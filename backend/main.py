import os
import shutil
import tempfile
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from extractor import SlideDeckExtractor
from recap_engine import CourseRecapEngine

app = FastAPI(
    title="Course Recap Generator API",
    description="Backend API for reading slide deck PDFs, extracting slide content, and synthesizing recaps + Mermaid diagrams.",
    version="1.0.0"
)

# Enable CORS for local dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recap_engine = CourseRecapEngine()


class SlidesPayload(BaseModel):
    slides: List[Dict[str, Any]]
    custom_prompt: Optional[str] = None
    api_key: Optional[str] = None


class MermaidValidationPayload(BaseModel):
    code: str


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Course Recap Generator API",
        "gemini_available": recap_engine.client is not None or os.getenv("GEMINI_API_KEY") is not None
    }


@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Receives a slide deck PDF file, saves temporarily, extracts slides, and returns structured slide list.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        extractor = SlideDeckExtractor(tmp_path)
        slides = extractor.extract_slides()
        return {
            "filename": file.filename,
            "total_slides": len(slides),
            "slides": slides
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/api/generate-recap")
def generate_recap_endpoint(payload: SlidesPayload):
    """
    Processes extracted slides to produce JSON recap, key concept glossary, and Mermaid diagrams.
    """
    try:
        engine = recap_engine
        if payload.api_key:
            engine = CourseRecapEngine(api_key=payload.api_key)
        
        recap = engine.generate_recap(payload.slides, payload.custom_prompt)
        return recap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recap generation error: {str(e)}")


@app.post("/api/validate-mermaid")
def validate_mermaid_endpoint(payload: MermaidValidationPayload):
    """
    Validates Mermaid diagram code string and returns sanitized syntax.
    """
    code = payload.code.strip()
    valid = len(code) > 0 and (
        code.startswith("graph") or
        code.startswith("flowchart") or
        code.startswith("mindmap") or
        code.startswith("sequenceDiagram") or
        code.startswith("classDiagram")
    )
    return {
        "valid": valid,
        "sanitized_code": code
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
