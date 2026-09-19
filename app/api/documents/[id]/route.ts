import { NextRequest, NextResponse } from 'next/server';
import { documentsStore, chunksStore } from '@/lib/store';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (documentsStore.has(params.id)) {
    documentsStore.delete(params.id);
    for (let i = chunksStore.length - 1; i >= 0; i--) {
      if (chunksStore[i].document_id === params.id) {
        chunksStore.splice(i, 1);
      }
    }
  }
  return new NextResponse(null, { status: 204 });
}
