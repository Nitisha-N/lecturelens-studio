# LectureLens Studio 🔍🎓

Turn lecture slide-deck PDFs into structured recaps, key-term glossaries, Mermaid diagrams (mindmap + flowchart) and review quizzes — with an interactive dashboard and Markdown / HTML / JSON export.

> Based on the open-source *GENAI--COURSE-RECAP-GENERATOR* project, with a new brand, teal theme, portable config and bug fixes. Credit the original author when sharing.

## Features
- Multi-PDF upload (drag & drop) with in-browser parsing via pdf.js
- Module breakdowns, key-term glossary, code/formula extraction
- Mermaid mindmap + flowchart generation
- Self-assessment quiz and per-module review tracking
- Export to Markdown, standalone HTML, or JSON
- Optional Gemini synthesis (falls back to an offline heuristic engine)
- Optional FastAPI backend (`pdfplumber` / `pypdf`)

## Run the frontend
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
```

## Run the backend (optional)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # optionally add GEMINI_API_KEY
python main.py           # http://127.0.0.1:8000  (docs at /docs)
python test_recap.py     # unit tests
```

## Project layout
```
src/        frontend (app, pdf parser, recap generator, exporter, styles)
backend/    FastAPI API, PDF extractor, recap engine, tests
.agents/    MCP config, sub-agent and skill definitions
PLAN.md     planning notes      RECAP.md  sample output
```
