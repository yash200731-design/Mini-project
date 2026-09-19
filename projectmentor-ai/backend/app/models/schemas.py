from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Project title")
    description: Optional[str] = Field(None, description="Project summary or context")

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    document_count: Optional[int] = 0

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    file_type: str
    storage_path: Optional[str] = None
    status: str  # processing, ready, failed
    created_at: str
    chunk_count: Optional[int] = 0

class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentResponse

# --- Chat & RAG Schemas ---
class ChatRequest(BaseModel):
    project_id: str = Field(..., description="ID of the active project context")
    question: str = Field(..., min_length=1, description="Student query regarding project")

class SourceItem(BaseModel):
    document_id: str
    filename: str
    page_number: int
    similarity: float
    content_snippet: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]

# --- Viva Question Generator Schemas ---
class VivaRequest(BaseModel):
    project_id: str
    difficulty: str = Field("medium", description="easy, medium, hard")
    count: int = Field(10, ge=1, le=30)

class VivaQuestion(BaseModel):
    question: str
    topic: str
    difficulty: str
    expected_points: List[str]

class VivaResponse(BaseModel):
    questions: List[VivaQuestion]

# --- Requirement Analyzer Schemas ---
class RequirementAnalysisRequest(BaseModel):
    project_id: str
    document_id: Optional[str] = None

class RequirementAnalysisResponse(BaseModel):
    functional_requirements: List[str]
    non_functional_requirements: List[str]
    missing_information: List[str]
    ambiguities: List[str]
    technical_risks: List[str]
    suggestions: List[str]

# --- Document Reviewer Schemas ---
class DocumentReviewRequest(BaseModel):
    project_id: str
    document_id: str

class DocumentReviewResponse(BaseModel):
    summary: str
    strengths: List[str]
    missing_information: List[str]
    technical_issues: List[str]
    clarity_issues: List[str]
    suggestions: List[str]

# --- System Health ---
class HealthResponse(BaseModel):
    status: str
    service: str
