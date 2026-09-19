from typing import Dict, Any, List
from app.services.embeddings import EmbeddingService
from app.services.vector_search import VectorSearchService
from app.services.llm import LLMService

SYSTEM_PROMPT = """You are ProjectMentor AI, an academic project mentor.
Your task is to answer questions about a student's project using the provided project context.

Rules:
1. Use the retrieved project context for project-specific claims.
2. Do not invent information about the project.
3. If the requested information is not available in the retrieved context, explicitly say that it was not found in the project's knowledge base.
4. You may provide general technical explanations when useful, but clearly distinguish them from information found in the student's documents.
5. When possible, reference the relevant source document and page.
6. Give clear, educational answers suitable for a B.Tech student.
7. Never claim that something exists in the project documentation unless the retrieved context supports it."""

class RAGService:
    @classmethod
    def answer_question(cls, project_id: str, question: str) -> Dict[str, Any]:
        # Step 1: Generate query embedding
        query_embedding = EmbeddingService.get_embedding(question)

        # Step 2: Retrieve relevant document chunks (top 5)
        chunks = VectorSearchService.search_similar_chunks(
            project_id=project_id,
            query_embedding=query_embedding,
            top_k=5
        )

        # Include top matching chunks
        relevant_chunks = chunks if chunks else []

        # Step 3: Construct context block
        if not relevant_chunks:
            context_str = "No relevant project context found in the uploaded documents."
        else:
            context_blocks = []
            for i, chunk in enumerate(relevant_chunks, 1):
                fn = chunk.get("filename", "Document")
                pg = chunk.get("page_number", 1)
                txt = chunk.get("content", "")
                context_blocks.append(f"--- Document: {fn} (Page {pg}) ---\n{txt}")
            context_str = "\n\n".join(context_blocks)

        user_prompt = f"Question: {question}\n\nCONTEXT:\n{context_str}"

        # Step 4: Call LLM
        answer = LLMService.generate_completion(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt
        )

        # Step 5: Format source documents output
        sources = []
        for chunk in relevant_chunks:
            sources.append({
                "document_id": chunk.get("document_id", ""),
                "filename": chunk.get("filename", "Document"),
                "page_number": chunk.get("page_number", 1),
                "similarity": chunk.get("similarity", 0.0),
                "content_snippet": chunk.get("content", "")[:150] + "..."
            })

        return {
            "answer": answer,
            "sources": sources
        }
