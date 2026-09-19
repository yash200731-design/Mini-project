# ProjectMentor AI - FastAPI Backend

FastAPI RAG backend engine for ProjectMentor AI.

## Features
- Document parsing for PDF (PyMuPDF), DOCX (python-docx), TXT, and Markdown.
- Semantic document chunking preserving page numbers, section headers, and overlap.
- Vector embeddings and vector similarity search in Supabase (`pgvector` / RPC) with in-memory fallback.
- Context-grounded RAG query answering with anti-hallucination system instructions.
- Viva question generator with difficulty selection and expected evaluation points.
- Requirement analyzer for extracting functional, non-functional, missing details, and technical risks.
- Document reviewer for automated critique and actionable suggestions.

## Installation

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

## Running the Server

```bash
uvicorn app.main:app --reload --port 8000
```

API Documentation will be available at `http://localhost:8000/docs` or `http://localhost:8000/redoc`.
