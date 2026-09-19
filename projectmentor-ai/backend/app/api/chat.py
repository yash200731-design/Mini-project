from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag import RAGService

router = APIRouter(prefix="/chat", tags=["AI Chat"])

@router.post("", response_model=ChatResponse)
def chat_with_project_ai(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    try:
        result = RAGService.answer_question(
            project_id=req.project_id,
            question=req.question
        )
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        print(f"[Chat API] Exception in RAG flow: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating RAG response: {str(e)}"
        )
