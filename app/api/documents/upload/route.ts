import { NextRequest, NextResponse } from 'next/server';
import { documentsStore, chunksStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const projectId = formData.get('project_id') as string;
    const file = formData.get('file') as File;

    if (!projectId || !file) {
      return NextResponse.json({ detail: 'project_id and file are required' }, { status: 400 });
    }

    const fileText = await file.text();
    const docId = crypto.randomUUID();
    const now = new Date().toISOString();
    const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';

    const docRecord = {
      id: docId,
      project_id: projectId,
      filename: file.name,
      file_type: ext,
      storage_path: `projects/${projectId}/${docId}_${file.name}`,
      status: 'ready',
      created_at: now
    };

    const paragraphs = fileText.split(/\n\n+/).filter(p => p.trim());
    const createdChunks: any[] = [];
    
    paragraphs.forEach((p, idx) => {
      createdChunks.push({
        id: crypto.randomUUID(),
        document_id: docId,
        project_id: projectId,
        content: p.trim(),
        page_number: Math.floor(idx / 3) + 1,
        chunk_index: idx,
        filename: file.name
      });
    });

    if (createdChunks.length === 0) {
      createdChunks.push({
        id: crypto.randomUUID(),
        document_id: docId,
        project_id: projectId,
        content: fileText.slice(0, 1000) || 'Project Document',
        page_number: 1,
        chunk_index: 0,
        filename: file.name
      });
    }

    documentsStore.set(docId, docRecord);
    chunksStore.push(...createdChunks);

    return NextResponse.json({
      message: `Document '${file.name}' processed successfully into ${createdChunks.length} chunks.`,
      document: { ...docRecord, chunk_count: createdChunks.length }
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to process document' }, { status: 500 });
  }
}
