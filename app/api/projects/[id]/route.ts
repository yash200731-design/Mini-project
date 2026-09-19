import { NextRequest, NextResponse } from 'next/server';
import { projectsStore, documentsStore } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const project = projectsStore.get(params.id);
  if (!project) {
    return NextResponse.json({ detail: 'Project not found' }, { status: 404 });
  }

  const docCount = Array.from(documentsStore.values()).filter((d: any) => d.project_id === params.id).length;
  return NextResponse.json({ ...project, document_count: docCount });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (projectsStore.has(params.id)) {
    projectsStore.delete(params.id);
    const docIds = Array.from(documentsStore.values())
      .filter((d: any) => d.project_id === params.id)
      .map((d: any) => d.id);
    
    docIds.forEach(did => documentsStore.delete(did));
  }
  return new NextResponse(null, { status: 204 });
}
