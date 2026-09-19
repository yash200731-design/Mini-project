import { NextRequest, NextResponse } from 'next/server';
import { documentsStore, chunksStore } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ detail: 'project_id required' }, { status: 400 });
  }

  const docs = Array.from(documentsStore.values())
    .filter((d: any) => d.project_id === projectId)
    .map((d: any) => {
      const chunkCount = chunksStore.filter((c: any) => c.document_id === d.id).length;
      return { ...d, chunk_count: chunkCount };
    });

  return NextResponse.json(docs);
}
