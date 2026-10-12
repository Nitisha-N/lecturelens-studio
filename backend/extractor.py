import re
from typing import List, Dict, Any, Optional
import pypdf

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False


class SlideDeckExtractor:
    """
    Parses PDF slide decks into structured slide objects containing
    slide indices, titles, body content, tables, and metadata.
    """
    def __init__(self, pdf_file_path_or_stream):
        self.source = pdf_file_path_or_stream

    def extract_slides(self) -> List[Dict[str, Any]]:
        slides = []
        if HAS_PDFPLUMBER and isinstance(self.source, str):
            try:
                slides = self._extract_with_pdfplumber(self.source)
            except Exception as e:
                print(f"[Extractor] pdfplumber error: {e}. Falling back to pypdf.")
                slides = self._extract_with_pypdf(self.source)
        else:
            slides = self._extract_with_pypdf(self.source)

        return self._post_process_slides(slides)

    def _extract_with_pdfplumber(self, file_path: str) -> List[Dict[str, Any]]:
        slides = []
        with pdfplumber.open(file_path) as pdf:
            for idx, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                tables = []
                try:
                    tables = page.extract_tables() or []
                except Exception:
                    pass

                slides.append({
                    "slide_number": idx + 1,
                    "raw_text": text,
                    "tables": tables
                })
        return slides

    def _extract_with_pypdf(self, source) -> List[Dict[str, Any]]:
        slides = []
        reader = pypdf.PdfReader(source)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            slides.append({
                "slide_number": idx + 1,
                "raw_text": text,
                "tables": []
            })
        return slides

    def _post_process_slides(self, raw_slides: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        processed = []
        for slide in raw_slides:
            raw_text = slide.get("raw_text", "").strip()
            lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
            
            title = f"Slide {slide['slide_number']}"
            body_lines = []
            
            if lines:
                title = lines[0]
                body_lines = lines[1:]

            # Identify bullet points or code snippets
            bullets = [l for l in body_lines if l.startswith(("-", "*", "•", "1.", "2.", "3.", "4."))]
            code_snippets = [l for l in body_lines if re.search(r'[{}=><();#]|def |class |import ', l)]
            
            processed.append({
                "slide_number": slide["slide_number"],
                "title": title,
                "body": "\n".join(body_lines),
                "bullets": bullets,
                "code_snippets": code_snippets,
                "tables": slide.get("tables", []),
                "word_count": len(raw_text.split()),
                "raw_text": raw_text
            })
        return processed
