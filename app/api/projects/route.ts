import { NextRequest, NextResponse } from 'next/server';
import { projectsStore, documentsStore } from '@/lib/store';

export async function GET() {
  const projects = Array.from(projectsStore.values()).map(p => {
    const docCount = Array.from(documentsStore.values()).filter((d: any) => d.project_id === p.id).length;
    return { ...p, document_count: docCount };
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newProject = {
      id,
      name: body.name || 'Untitled Project',
      description: body.description || '',
      created_at: now,
      updated_at: now,
      document_count: 0
    };

    projectsStore.set(id, newProject);
    return NextResponse.json(newProject, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Invalid project data' }, { status: 400 });
  }
}
