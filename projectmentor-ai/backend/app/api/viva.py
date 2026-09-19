from fastapi import APIRouter, HTTPException, status
import json
from app.models.schemas import VivaRequest, VivaResponse, VivaQuestion
from app.services.vector_search import VectorSearchService
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMService

router = APIRouter(prefix="/viva", tags=["Viva Question Generator"])

VIVA_SYSTEM_PROMPT = """You are an expert external examiner conducting a B.Tech / M.Tech final project viva voce examination.
Generates project-specific viva questions grounded in the provided project documentation.

Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "question": "String question",
    "topic": "Topic Name (e.g., Methodology, Architecture, Database, Testing, Algorithms, Limitations)",
    "difficulty": "easy | medium | hard",
    "expected_points": ["Point 1", "Point 2", "Point 3"]
  }
]
Do not add markdown formatting or extra text outside the JSON array."""

@router.post("/generate", response_model=VivaResponse)
def generate_viva_questions(req: VivaRequest):
    # Retrieve top 8 context chunks across project
    query_emb = EmbeddingService.get_embedding("project architecture methodology requirements algorithms database testing")
    chunks = VectorSearchService.search_similar_chunks(req.project_id, query_emb, top_k=8)
    
    if not chunks:
        # Fallback generic questions if no documents uploaded yet
        return VivaResponse(questions=[
            VivaQuestion(
                question="What is the primary problem statement and core objective of your project?",
                topic="Problem Statement",
                difficulty=req.difficulty,
                expected_points=["Clear problem scope", "Target user base", "Expected outcome"]
            ),
            VivaQuestion(
                question="Can you explain the high-level architecture and data flow of your system?",
                topic="Architecture",
                difficulty=req.difficulty,
                expected_points=["Client-server components", "API boundaries", "Database interactions"]
            ),
            VivaQuestion(
                question="What key algorithms or frameworks were chosen and why?",
                topic="Methodology",
                difficulty=req.difficulty,
                expected_points=["Technology justification", "Performance considerations", "Alternative evaluations"]
            )
        ])

    context_str = "\n\n".join([f"--- Source ({c.get('filename')}) ---\n{c.get('content')}" for c in chunks])
    user_prompt = (
        f"Generate {req.count} project-specific viva questions at '{req.difficulty}' difficulty.\n"
        f"Base the questions on the following project context:\n\n{context_str}"
    )

    llm_output = LLMService.generate_completion(VIVA_SYSTEM_PROMPT, user_prompt, temperature=0.3)
    
    try:
        # Clean JSON markdown fences if present
        clean_json = llm_output
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
        
        parsed = json.loads(clean_json)
        questions = []
        for item in parsed:
            questions.append(VivaQuestion(
                question=item.get("question", "Describe your project implementation."),
                topic=item.get("topic", "General"),
                difficulty=item.get("difficulty", req.difficulty),
                expected_points=item.get("expected_points", ["Clear technical explanation", "Practical demonstration"])
            ))
        return VivaResponse(questions=questions[:req.count])

    except Exception as e:
        print(f"[Viva API] JSON parsing error ({e}). Returning formatted fallback questions.")
        # Structured fallback based on retrieved context
        q_list = []
        topics = ["Problem Statement", "Methodology", "Architecture", "Database", "Algorithms", "Testing", "Limitations"]
        for i in range(min(req.count, len(chunks))):
            c = chunks[i]
            q_list.append(VivaQuestion(
                question=f"In document '{c.get('filename')}', section on page {c.get('page_number')}: How is this component designed and tested?",
                topic=topics[i % len(topics)],
                difficulty=req.difficulty,
                expected_points=[
                    "System design details",
                    "Trade-offs & performance",
                    "Verification steps"
                ]
            ))
        return VivaResponse(questions=q_list)
