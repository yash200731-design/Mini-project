# ProjectMentor AI 🚀

**ProjectMentor AI** is a full-stack, AI-powered academic project mentor application built for students working on academic and software engineering projects. It allows students to upload project documents (PDF, DOCX, TXT, Markdown), process them into a searchable vector knowledge base (Supabase pgvector), and interact with an AI mentor that provides context-grounded answers, source attributions with page numbers, viva practice questions, requirement analysis, and document reviews.

---

## 🌟 Features

- **Document Processing Pipeline**: Parses PDF (preserving page numbers via PyMuPDF), DOCX (python-docx), TXT, and MD files, splitting them into semantic chunks with overlap.
- **Project-Specific RAG Chat**: Context-grounded retrieval using cosine similarity search in Supabase `pgvector`, with explicit source attribution and page numbers.
- **Anti-Hallucination Safeguards**: If a requested topic is missing from uploaded project files, the system explicitly informs the student rather than hallucinating answers.
- **Viva Voce Generator**: Generates realistic external examiner questions categorized by difficulty, topic, and expected answer points.
- **Requirement Analyzer**: Automatically extracts functional and non-functional requirements, technical risks, ambiguities, and missing specifications.
- **Academic Document Reviewer**: Critiques document quality, strengths, clarity issues, and actionable improvement recommendations.
- **Modern Responsive UI**: Built with Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and Markdown rendering.

---

## 🏗️ Architecture

```
Student User
     │
     ▼
Next.js 14 Frontend (App Router, TypeScript, Tailwind CSS, Lucide Icons)
     │  REST API (HTTP/JSON)
     ▼
FastAPI Backend (Python 3.11+, PyMuPDF, python-docx, Pydantic, Uvicorn)
     │
     ├──► Document Parser & Overlapping Chunker (Page-level preservation)
     ├──► Vector Embeddings Service (OpenAI / Gemini / Deterministic Fallback)
     └──► Context-Grounded RAG Engine (Anti-hallucination system prompt)
     │
     ▼
Supabase PostgreSQL + pgvector (Projects, Documents, Chunks, similarity match RPC)
```

---

## 📁 Project Structure

```
projectmentor-ai/
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing Page
│   │   ├── dashboard/page.tsx     # Student Dashboard
│   │   ├── projects/[id]/page.tsx # Project Workspace (Tabs: Overview, Docs, Chat, Viva, Requirements, Review)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   ├── lib/
│   │   └── api.ts                 # Centralized typed API Client
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── .env.example
│   ├── .env.local
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app entrypoint with CORS & routes
│   │   ├── config.py              # Environment configuration settings
│   │   ├── api/
│   │   │   ├── projects.py        # Project CRUD endpoints
│   │   │   ├── documents.py       # Upload & document management
│   │   │   ├── chat.py            # RAG QA endpoint
│   │   │   ├── viva.py            # Viva question generator
│   │   │   ├── requirements.py    # Requirement analyzer
│   │   │   └── review.py          # Document reviewer
│   │   ├── services/
│   │   │   ├── document_parser.py # PDF fitz & DOCX text extraction
│   │   │   ├── chunker.py         # Semantic text chunking
│   │   │   ├── embeddings.py      # Embedding vector provider
│   │   │   ├── vector_search.py   # Supabase pgvector RPC & similarity search
│   │   │   ├── llm.py             # LLM provider wrapper
│   │   │   └── rag.py             # RAG orchestrator & anti-hallucination prompt
│   │   └── models/
│   │       └── schemas.py         # Pydantic request & response models
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── supabase/
│   └── schema.sql                 # Complete PostgreSQL schema & match_document_chunks function
│
└── README.md
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React icons, React Markdown.
- **Backend**: Python 3.11+, FastAPI, Pydantic, Uvicorn, PyMuPDF (`fitz`), `python-docx`, `supabase-py`, `openai`, `httpx`, `numpy`.
- **Database & Vector Search**: Supabase PostgreSQL with `pgvector` extension and custom RPC function `match_document_chunks`.

---

## ⚙️ Environment Variables Setup

### 1. Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
# Supabase Database Credentials
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# AI Provider Credentials (openai, gemini, etc.)
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o-mini

EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small

# Frontend Origin for CORS
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend Configuration (`frontend/.env.local`)

Copy `frontend/.env.example` to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🗄️ Supabase Database & pgvector Setup

1. Open your Supabase project SQL Editor.
2. Run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. The SQL script will:
   - Enable `vector` and `uuid-ossp` extensions.
   - Create `projects`, `documents`, and `document_chunks` tables.
   - Add vector indexing via HNSW.
   - Register the PostgreSQL vector similarity function `match_document_chunks(query_embedding, match_project_id, match_count)`.

---

## 🚀 Local Development Instructions

### 1. Start FastAPI Backend

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`.  
Swagger documentation: `http://localhost:8000/docs`.

### 2. Start Next.js Frontend

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be running at `http://localhost:3000`.

---

## 🔌 API Endpoint Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status check |
| `POST` | `/projects` | Create a new project workspace |
| `GET` | `/projects` | List all projects with document counts |
| `GET` | `/projects/{id}` | Get specific project details |
| `DELETE` | `/projects/{id}` | Delete project and associated documents |
| `POST` | `/documents/upload` | Upload & process document (PDF, DOCX, TXT, MD) |
| `GET` | `/documents?project_id=...` | List documents uploaded for project |
| `DELETE` | `/documents/{id}` | Delete document and chunk vectors |
| `POST` | `/chat` | RAG context QA endpoint with document sources |
| `POST` | `/viva/generate` | Generate viva practice questions |
| `POST | `/requirements/analyze` | Analyze functional/non-functional requirements & risks |
| `POST` | `/review/document` | Critique academic document quality |

---

## 🧪 Testing the Complete Workflow

1. Open `http://localhost:3000` in your browser.
2. Click **Get Started** to open the **Dashboard**.
3. Click **New Project** and enter a name (e.g., "Smart Healthcare Diagnostic System").
4. Open the workspace, go to the **Documents** tab, and upload a project PDF or text document.
5. Navigate to **AI Chat** and ask: `"What methodology does this project use?"`.
6. Verify that the answer references the document filename, page number, and similarity score.
7. Switch to **Viva Generator** and click **Generate Questions**.
8. Switch to **Requirements** or **Document Review** to perform automated scope analysis.
