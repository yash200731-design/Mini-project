-- ProjectMentor AI Supabase Database Schema

-- Enable vector extension if not enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Chunks Table with pgvector embedding column
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    page_number INTEGER DEFAULT 1,
    chunk_index INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and isolation
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_chunks_project_id ON public.document_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.document_chunks(document_id);

-- Vector HNSW index for cosine distance vector search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Vector Similarity Match Function (RPC)
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    match_project_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    filename TEXT,
    page_number INT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        d.filename,
        dc.page_number,
        (1 - (dc.embedding <=> query_embedding))::FLOAT AS similarity,
        dc.metadata
    FROM public.document_chunks dc
    JOIN public.documents d ON d.id = dc.document_id
    WHERE dc.project_id = match_project_id
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Enable Row Level Security (RLS) - Can be customized when Supabase Auth is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all users (Development mode / Anonymous client access)
CREATE POLICY "Allow public access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to document_chunks" ON public.document_chunks FOR ALL USING (true) WITH CHECK (true);
