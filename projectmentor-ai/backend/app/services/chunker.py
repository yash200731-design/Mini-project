from typing import List, Dict, Any
from app.services.document_parser import ParsedPage

class ChunkItem:
    def __init__(self, content: str, page_number: int, chunk_index: int, metadata: Dict[str, Any]):
        self.content = content
        self.page_number = page_number
        self.chunk_index = chunk_index
        self.metadata = metadata

class TextChunkerService:
    CHUNK_SIZE = 600  # Target characters per chunk
    OVERLAP = 100     # Overlap characters between chunks

    @classmethod
    def chunk_pages(cls, pages: List[ParsedPage], filename: str) -> List[ChunkItem]:
        chunks = []
        global_chunk_index = 0

        for page in pages:
            text = page.content.strip()
            if not text:
                continue

            # Split text into paragraphs first
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            
            current_chunk = ""
            for p in paragraphs:
                if len(current_chunk) + len(p) + 2 <= cls.CHUNK_SIZE:
                    if current_chunk:
                        current_chunk += "\n\n" + p
                    else:
                        current_chunk = p
                else:
                    if current_chunk:
                        chunks.append(ChunkItem(
                            content=current_chunk,
                            page_number=page.page_number,
                            chunk_index=global_chunk_index,
                            metadata={
                                "filename": filename,
                                "page": page.page_number,
                                "section": page.section
                            }
                        ))
                        global_chunk_index += 1
                        
                        # Apply overlap by taking trailing chars
                        overlap_text = current_chunk[-cls.OVERLAP:] if len(current_chunk) > cls.OVERLAP else ""
                        current_chunk = (overlap_text + "\n\n" + p).strip()
                    else:
                        current_chunk = p

            if current_chunk and len(current_chunk) >= 20:
                chunks.append(ChunkItem(
                    content=current_chunk,
                    page_number=page.page_number,
                    chunk_index=global_chunk_index,
                    metadata={
                        "filename": filename,
                        "page": page.page_number,
                        "section": page.section
                    }
                ))
                global_chunk_index += 1

        return chunks
