# Planning Phase Evidence - LectureLens Studio

This document details the architectural decisions and execution plan formulated during the initial planning phase for the **LectureLens Studio**.

---

## 1. Goal Description & Scope

The objective of the **LectureLens Studio** is to read multi-slide lecture PDFs, extract structural presentation content, synthesize comprehensive recaps with key terms and formulas, generate visual Mermaid diagrams (Mindmaps & Flowcharts), provide an interactive review workspace, and export clean formatted reports.

---

## 2. Key Architectural Decisions

### A. Extraction Strategy
- **Choice**: Hybrid extraction using `pdfplumber` / `pypdf` in Python backend, supplemented by client-side `pdf.js` in the web browser.
- **Rationale**: Ensures the tool functions both as a high-precision API server and as a zero-dependency standalone web app.

### B. Summary & Recap Hierarchy
- **Choice**: Multi-level structured hierarchy:
  1. Executive Summary (Whole Deck overview)
  2. Thematic Module Breakdowns (Section-level summaries, slide reference ranges)
  3. Key Term Glossary & Definitions (Structured table)
  4. Formulas & Code Blocks
  5. Self-Assessment Review Questions
- **Rationale**: Avoids generic unorganized bullet lists, providing clear academic reference points.

### C. Diagram Types
- **Choice**: Dual Mermaid.js visual visualizations:
  - **Mindmaps**: Hierarchical conceptual taxonomy mapping.
  - **Flowcharts**: Sequential topic execution and procedural flow.
- **Rationale**: Mindmaps capture relationship hierarchies while flowcharts clarify multi-step processes.

### D. Agent Harness Capabilities
1. **Planning Phase**: Formal design approval before code execution.
2. **MCP Server**: `@modelcontextprotocol/server-filesystem` for local filesystem reading/writing.
3. **Custom Skill (`@concept-extractor`)**: Standardized rule set enforcing 4-part summary schema and valid Mermaid syntax.
4. **Sub-Agent (`@recap-reviewer`)**: Dedicated QA auditor verifying recap accuracy, missing concepts, and diagram rendering.

---

## 3. Verification Plan

- **Automated Tests**: Python `unittest` suite (`backend/test_recap.py`) testing PDF parsing, heuristic fallback extraction, and Mermaid syntax validation.
- **Frontend Compilation**: Production build via Vite (`npm run build`).
- **End-to-End Verification**: Live execution on real course decks (`AAPLecture1_LLM_Foundations.pdf` and `AAPLecture2_Prompt_Engineering.pdf`), producing validated outputs in `RECAP.md`.
