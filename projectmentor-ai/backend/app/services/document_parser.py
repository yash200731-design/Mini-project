from typing import List, Dict, Any
import io

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

class ParsedPage:
    def __init__(self, page_number: int, content: str, section: str = ""):
        self.page_number = page_number
        self.content = content
        self.section = section

class DocumentParserService:
    @staticmethod
    def parse_pdf(file_bytes: bytes, filename: str) -> List[ParsedPage]:
        pages = []
        if HAS_FITZ:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                for i, page in enumerate(doc):
                    text = page.get_text("text").strip()
                    if text:
                        pages.append(ParsedPage(page_number=i + 1, content=text, section=f"Page {i + 1}"))
                return pages
            except Exception as e:
                print(f"[DocumentParser] PyMuPDF failed ({e}). Falling back to text decoder.")
        
        # Plain text fallback for PDF
        text_content = file_bytes.decode("utf-8", errors="ignore").strip()
        return [ParsedPage(page_number=1, content=text_content, section="PDF Document")]

    @staticmethod
    def parse_docx(file_bytes: bytes, filename: str) -> List[ParsedPage]:
        if HAS_DOCX:
            try:
                doc = docx.Document(io.BytesIO(file_bytes))
                pages = []
                current_page_text = []
                page_num = 1
                current_section = "General"

                for para in doc.paragraphs:
                    text = para.text.strip()
                    if not text:
                        continue
                    if para.style and "heading" in para.style.name.lower():
                        current_section = text
                    current_page_text.append(text)
                    full_text = "\n".join(current_page_text)
                    if len(full_text.split()) > 350:
                        pages.append(ParsedPage(page_number=page_num, content=full_text, section=current_section))
                        page_num += 1
                        current_page_text = []

                if current_page_text:
                    pages.append(ParsedPage(page_number=page_num, content="\n".join(current_page_text), section=current_section))
                return pages
            except Exception as e:
                print(f"[DocumentParser] python-docx failed ({e}). Falling back to text decoder.")

        # Text fallback
        text_content = file_bytes.decode("utf-8", errors="ignore").strip()
        return [ParsedPage(page_number=1, content=text_content, section="DOCX Document")]

    @staticmethod
    def parse_txt_or_md(file_bytes: bytes, filename: str) -> List[ParsedPage]:
        text_content = file_bytes.decode("utf-8", errors="ignore").strip()
        lines = text_content.split("\n")
        pages = []
        current_page_lines = []
        page_num = 1
        current_section = "Document"

        for line in lines:
            line_str = line.strip()
            if line_str.startswith("#"):
                current_section = line_str.lstrip("#").strip()
            
            current_page_lines.append(line)
            if len("\n".join(current_page_lines).split()) > 350:
                pages.append(ParsedPage(page_number=page_num, content="\n".join(current_page_lines), section=current_section))
                page_num += 1
                current_page_lines = []
        
        if current_page_lines:
            pages.append(ParsedPage(page_number=page_num, content="\n".join(current_page_lines), section=current_section))
            
        return pages

    @classmethod
    def parse_document(cls, file_bytes: bytes, filename: str, file_type: str) -> List[ParsedPage]:
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext == "pdf" or "pdf" in file_type.lower():
            return cls.parse_pdf(file_bytes, filename)
        elif ext in ["docx", "doc"] or "word" in file_type.lower():
            return cls.parse_docx(file_bytes, filename)
        elif ext in ["txt", "md", "markdown"] or "text" in file_type.lower():
            return cls.parse_txt_or_md(file_bytes, filename)
        else:
            return cls.parse_txt_or_md(file_bytes, filename)
