from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime
from app.models.schemas import DocumentResponse, DocumentUploadResponse
from app.services.document_parser import DocumentParserService
from app.services.chunker import TextChunkerService
from app.services.embeddings import EmbeddingService
from app.services.vector_search import VectorSearchService

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB limit
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "md"}

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    project_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, DOCX, TXT, MD"
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum limit of 25MB")

    document_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()
    client = VectorSearchService.get_supabase_client()

    try:
        # Step 1: Parse Document into pages
        parsed_pages = DocumentParserService.parse_document(file_bytes, file.filename, file.content_type or "")
        if not parsed_pages:
            raise ValueError("No extractable text content found in document.")

        # Step 2: Chunk Document pages
        chunks = TextChunkerService.chunk_pages(parsed_pages, file.filename)
        if not chunks:
            raise ValueError("Failed to create text chunks from document.")

        # Step 3: Generate Embeddings for chunks
        chunk_texts = [c.content for c in chunks]
        embeddings = EmbeddingService.get_embeddings_batch(chunk_texts)

        # Step 4: Format records
        doc_record = {
            "id": document_id,
            "project_id": project_id,
            "filename": file.filename,
            "file_type": ext.upper(),
            "storage_path": f"projects/{project_id}/{document_id}_{file.filename}",
            "status": "ready",
            "created_at": now_iso
        }

        chunk_records = []
        for i, chunk in enumerate(chunks):
            chunk_records.append({
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "project_id": project_id,
                "content": chunk.content,
                "embedding": embeddings[i],
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "metadata": chunk.metadata,
                "created_at": now_iso
            })

        if client:
            try:
                # Store in Supabase
                client.table("documents").insert(doc_record).execute()
                batch_size = 50
                for b in range(0, len(chunk_records), batch_size):
                    client.table("document_chunks").insert(chunk_records[b:b+batch_size]).execute()
            except Exception as e:
                print(f"[Documents API] Supabase insert error ({e}). Saving to memory fallback.")
                VectorSearchService.save_document_memory(doc_record, chunk_records)
        else:
            VectorSearchService.save_document_memory(doc_record, chunk_records)

        response_doc = DocumentResponse(
            id=document_id,
            project_id=project_id,
            filename=file.filename,
            file_type=ext.upper(),
            storage_path=doc_record["storage_path"],
            status="ready",
            created_at=now_iso,
            chunk_count=len(chunks)
        )

        return DocumentUploadResponse(
            message=f"Document '{file.filename}' processed successfully into {len(chunks)} searchable chunks.",
            document=response_doc
        )

    except Exception as e:
        print(f"[Documents API] Processing failed: {e}")
        failed_doc = {
            "id": document_id,
            "project_id": project_id,
            "filename": file.filename,
            "file_type": ext.upper(),
            "storage_path": None,
            "status": "failed",
            "created_at": now_iso
        }
        VectorSearchService.save_document_memory(failed_doc, [])
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )

@router.get("", response_model=List[DocumentResponse])
def get_documents(project_id: str):
    client = VectorSearchService.get_supabase_client()
    if client:
        try:
            res = client.table("documents").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
            if res.data:
                results = []
                for item in res.data:
                    c_res = client.table("document_chunks").select("id", count="exact").eq("document_id", item["id"]).execute()
                    chunk_cnt = c_res.count if c_res.count is not None else len(c_res.data or [])
                    results.append(DocumentResponse(
                        id=item["id"],
                        project_id=item["project_id"],
                        filename=item["filename"],
                        file_type=item["file_type"],
                        storage_path=item.get("storage_path"),
                        status=item["status"],
                        created_at=str(item["created_at"]),
                        chunk_count=chunk_cnt
                    ))
                return results
        except Exception as e:
            print(f"[Documents API] Supabase list failed ({e}).")

    # In-memory fallback
    results = []
    for did, doc in VectorSearchService.IN_MEMORY_DOCUMENTS.items():
        if doc.get("project_id") == project_id:
            chunk_cnt = sum(1 for c in VectorSearchService.IN_MEMORY_CHUNKS if c.get("document_id") == did)
            doc_copy = dict(doc)
            doc_copy["chunk_count"] = chunk_cnt
            results.append(DocumentResponse(**doc_copy))
    return results

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str):
    client = VectorSearchService.get_supabase_client()
    if client:
        try:
            client.table("documents").delete().eq("id", document_id).execute()
        except Exception as e:
            print(f"[Documents API] Supabase delete failed ({e}).")

    VectorSearchService.delete_document_memory(document_id)
    return None
