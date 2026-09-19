from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from datetime import datetime
from app.models.schemas import ProjectCreate, ProjectResponse
from app.services.vector_search import VectorSearchService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate):
    client = VectorSearchService.get_supabase_client()
    project_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    if client:
        try:
            res = client.table("projects").insert({
                "id": project_id,
                "name": project_in.name,
                "description": project_in.description,
                "created_at": now_iso,
                "updated_at": now_iso
            }).execute()
            if res.data:
                item = res.data[0]
                return ProjectResponse(
                    id=item["id"],
                    name=item["name"],
                    description=item.get("description"),
                    created_at=str(item.get("created_at")),
                    updated_at=str(item.get("updated_at")),
                    document_count=0
                )
        except Exception as e:
            print(f"[Projects API] Supabase insert failed ({e}). Falling back to memory.")

    # In-memory fallback
    project_obj = {
        "id": project_id,
        "name": project_in.name,
        "description": project_in.description,
        "created_at": now_iso,
        "updated_at": now_iso,
        "document_count": 0
    }
    VectorSearchService.IN_MEMORY_PROJECTS[project_id] = project_obj
    return ProjectResponse(**project_obj)

@router.get("", response_model=List[ProjectResponse])
def get_projects():
    client = VectorSearchService.get_supabase_client()
    if client:
        try:
            res = client.table("projects").select("*").order("created_at", desc=True).execute()
            if res.data:
                results = []
                for item in res.data:
                    doc_res = client.table("documents").select("id", count="exact").eq("project_id", item["id"]).execute()
                    doc_count = doc_res.count if doc_res.count is not None else len(doc_res.data or [])
                    results.append(ProjectResponse(
                        id=item["id"],
                        name=item["name"],
                        description=item.get("description"),
                        created_at=str(item.get("created_at")),
                        updated_at=str(item.get("updated_at")),
                        document_count=doc_count
                    ))
                return results
        except Exception as e:
            print(f"[Projects API] Supabase select failed ({e}). Falling back to memory.")

    # Memory fallback
    results = []
    for pid, proj in VectorSearchService.IN_MEMORY_PROJECTS.items():
        doc_count = sum(1 for d in VectorSearchService.IN_MEMORY_DOCUMENTS.values() if d.get("project_id") == pid)
        proj_copy = dict(proj)
        proj_copy["document_count"] = doc_count
        results.append(ProjectResponse(**proj_copy))
    return results

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    client = VectorSearchService.get_supabase_client()
    if client:
        try:
            res = client.table("projects").select("*").eq("id", project_id).execute()
            if res.data:
                item = res.data[0]
                doc_res = client.table("documents").select("id", count="exact").eq("project_id", project_id).execute()
                doc_count = doc_res.count if doc_res.count is not None else len(doc_res.data or [])
                return ProjectResponse(
                    id=item["id"],
                    name=item["name"],
                    description=item.get("description"),
                    created_at=str(item.get("created_at")),
                    updated_at=str(item.get("updated_at")),
                    document_count=doc_count
                )
        except Exception as e:
            print(f"[Projects API] Supabase get failed ({e}).")

    if project_id in VectorSearchService.IN_MEMORY_PROJECTS:
        proj = dict(VectorSearchService.IN_MEMORY_PROJECTS[project_id])
        doc_count = sum(1 for d in VectorSearchService.IN_MEMORY_DOCUMENTS.values() if d.get("project_id") == project_id)
        proj["document_count"] = doc_count
        return ProjectResponse(**proj)

    raise HTTPException(status_code=404, detail="Project not found")

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str):
    client = VectorSearchService.get_supabase_client()
    if client:
        try:
            client.table("projects").delete().eq("id", project_id).execute()
        except Exception as e:
            print(f"[Projects API] Supabase delete failed ({e}).")

    VectorSearchService.delete_project_memory(project_id)
    return None
