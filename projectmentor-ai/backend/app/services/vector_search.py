import math
import numpy as np
from typing import List, Dict, Any, Optional
from app.config import settings

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    Client = Any

class VectorSearchService:
    # Class-level in-memory stores for fallback when Supabase is unconfigured
    IN_MEMORY_PROJECTS: Dict[str, Dict[str, Any]] = {}
    IN_MEMORY_DOCUMENTS: Dict[str, Dict[str, Any]] = {}
    IN_MEMORY_CHUNKS: List[Dict[str, Any]] = []

    @staticmethod
    def get_supabase_client() -> Optional[Any]:
        if HAS_SUPABASE and settings.SUPABASE_URL and settings.SUPABASE_KEY and "your-supabase" not in settings.SUPABASE_URL:
            try:
                return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            except Exception as e:
                print(f"[VectorSearch] Supabase connection error: {e}")
                return None
        return None

    @classmethod
    def save_document_memory(cls, doc_record: Dict[str, Any], chunk_records: List[Dict[str, Any]]):
        cls.IN_MEMORY_DOCUMENTS[doc_record["id"]] = doc_record
        cls.IN_MEMORY_CHUNKS.extend(chunk_records)

    @classmethod
    def delete_document_memory(cls, document_id: str):
        if document_id in cls.IN_MEMORY_DOCUMENTS:
            del cls.IN_MEMORY_DOCUMENTS[document_id]
        cls.IN_MEMORY_CHUNKS = [c for c in cls.IN_MEMORY_CHUNKS if c.get("document_id") != document_id]

    @classmethod
    def delete_project_memory(cls, project_id: str):
        if project_id in cls.IN_MEMORY_PROJECTS:
            del cls.IN_MEMORY_PROJECTS[project_id]
        doc_ids = [did for did, d in cls.IN_MEMORY_DOCUMENTS.items() if d.get("project_id") == project_id]
        for did in doc_ids:
            del cls.IN_MEMORY_DOCUMENTS[did]
        cls.IN_MEMORY_CHUNKS = [c for c in cls.IN_MEMORY_CHUNKS if c.get("project_id") != project_id]

    @classmethod
    def search_similar_chunks(cls, project_id: str, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        client = cls.get_supabase_client()
        if client:
            try:
                response = client.rpc('match_document_chunks', {
                    'query_embedding': query_embedding,
                    'match_project_id': project_id,
                    'match_count': top_k
                }).execute()
                
                if response.data:
                    results = []
                    for item in response.data:
                        results.append({
                            "id": item.get("id"),
                            "document_id": item.get("document_id"),
                            "content": item.get("content"),
                            "filename": item.get("filename", "Document"),
                            "page_number": item.get("page_number", 1),
                            "similarity": round(float(item.get("similarity", 0.0)), 4),
                            "metadata": item.get("metadata", {})
                        })
                    return results
            except Exception as e:
                print(f"[VectorSearch] Supabase RPC search failed ({e}), falling back to memory.")
        
        # In-memory similarity search fallback
        project_chunks = [c for c in cls.IN_MEMORY_CHUNKS if c.get("project_id") == project_id]
        if not project_chunks:
            return []

        q_vec = np.array(query_embedding)
        q_norm = np.linalg.norm(q_vec)

        scored_chunks = []
        for chunk in project_chunks:
            c_vec = np.array(chunk.get("embedding", []))
            if len(c_vec) != len(q_vec):
                continue
            c_norm = np.linalg.norm(c_vec)
            if q_norm > 0 and c_norm > 0:
                similarity = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            else:
                similarity = 0.0
            
            doc_info = cls.IN_MEMORY_DOCUMENTS.get(chunk.get("document_id"), {})
            scored_chunks.append({
                "id": chunk.get("id"),
                "document_id": chunk.get("document_id"),
                "content": chunk.get("content"),
                "filename": doc_info.get("filename", chunk.get("metadata", {}).get("filename", "Document")),
                "page_number": chunk.get("page_number", 1),
                "similarity": round(max(0.0, similarity), 4),
                "metadata": chunk.get("metadata", {})
            })

        scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_chunks[:top_k]
