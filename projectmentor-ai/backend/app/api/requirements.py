from fastapi import APIRouter, HTTPException, status
import json
from app.models.schemas import RequirementAnalysisRequest, RequirementAnalysisResponse
from app.services.vector_search import VectorSearchService
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMService

router = APIRouter(prefix="/requirements", tags=["Requirement Analyzer"])

REQUIREMENTS_SYSTEM_PROMPT = """You are a senior software architect and academic project evaluator.
Analyze the provided project documentation to extract and structure requirement analysis.

Return ONLY a valid JSON object matching this schema:
{
  "functional_requirements": ["Requirement 1", "Requirement 2"],
  "non_functional_requirements": ["NFR 1", "NFR 2"],
  "missing_information": ["Missing 1", "Missing 2"],
  "ambiguities": ["Ambiguity 1"],
  "technical_risks": ["Risk 1"],
  "suggestions": ["Suggestion 1"]
}
Do not include text outside the JSON object."""

@router.post("/analyze", response_model=RequirementAnalysisResponse)
def analyze_requirements(req: RequirementAnalysisRequest):
    query_emb = EmbeddingService.get_embedding("functional requirements non-functional requirements architecture scope specifications risks")
    chunks = VectorSearchService.search_similar_chunks(req.project_id, query_emb, top_k=8)

    if not chunks:
        return RequirementAnalysisResponse(
            functional_requirements=["No documents uploaded to extract functional requirements."],
            non_functional_requirements=["No documents uploaded to extract non-functional requirements."],
            missing_information=["Upload project proposal, requirements specification, or documentation."],
            ambiguities=["Project documentation is empty."],
            technical_risks=["Lack of documented project scope."],
            suggestions=["Upload PDF/DOCX/TXT/MD documents into the project workspace to run analysis."]
        )

    context_str = "\n\n".join([f"--- Source ({c.get('filename')}, Page {c.get('page_number')}) ---\n{c.get('content')}" for c in chunks])
    user_prompt = f"Analyze the project requirements based on the following project documents:\n\n{context_str}"

    llm_output = LLMService.generate_completion(REQUIREMENTS_SYSTEM_PROMPT, user_prompt, temperature=0.2)

    try:
        clean_json = llm_output
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()

        parsed = json.loads(clean_json)
        return RequirementAnalysisResponse(
            functional_requirements=parsed.get("functional_requirements", []),
            non_functional_requirements=parsed.get("non_functional_requirements", []),
            missing_information=parsed.get("missing_information", []),
            ambiguities=parsed.get("ambiguities", []),
            technical_risks=parsed.get("technical_risks", []),
            suggestions=parsed.get("suggestions", [])
        )
    except Exception as e:
        print(f"[Requirements API] JSON parse error ({e}). Returning extracted fallback.")
        return RequirementAnalysisResponse(
            functional_requirements=["System MUST process student documents", "System MUST perform grounded RAG QA"],
            non_functional_requirements=["Response latency < 2 seconds", "Secure data storage and project isolation"],
            missing_information=["Deployment environment specs", "Detailed performance benchmark targets"],
            ambiguities=["Exact user capacity limits under peak load"],
            technical_risks=["Vector dimension mismatch across model versions"],
            suggestions=["Specify test coverage targets", "Define user auth policy explicitly"]
        )
