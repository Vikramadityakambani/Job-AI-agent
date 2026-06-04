# Implementation Plan — Resume Shapeshifter

Resume Shapeshifter is a JD-to-Resume tailoring engine that helps job seekers rewrite experience bullets, evaluate resume compatibility with job descriptions, identify gaps, and generate side-by-side comparison proofs.

> [!NOTE]
> **Tech Stack Selection**: Since Node.js / `npx` are not installed on the system, the project stack is **Python + Vanilla HTML/CSS/JS** served by Python's built-in `http.server`. This ensures zero complex system dependencies and guarantees it will run out-of-the-box.

---

## 1. System Requirements

* **Python 3.7+** (Python 3.12.3 is already verified as installed on your environment)
* **pypdf** (for PDF parsing)
* **requests** (for LLM API calls, already verified as installed)
* **python-dotenv** (optional, but recommended for loading `.env` variables)

---

## 2. Proposed Changes

We will build the project inside a clean workspace under `c:/Users/vikra/Downloads/antigravity/resume shapeshifter`.

---

### 2.1 Core Server & Configurations

Setup the python server, dependencies, and environment files in the project root.

#### [NEW] [server.py](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/server.py)
- Implements `http.server.BaseHTTPRequestHandler` to serve the static frontend assets (`index.html`, `style.css`, `app.js`) and process REST API requests.
- Implements routes:
  - `POST /api/analyze`: Coordinates the step-by-step LLM extraction, scoring, gap analysis, and bullet rewrites.
  - `POST /api/parse`: Parses uploaded PDF/DOCX files.
- Reads API key configurations from a `.env` file.

#### [NEW] [.env](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/.env)
- Contains API credentials (e.g., `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY`).

#### [NEW] [.gitignore](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/.gitignore)
- Ignores local environment files (`.env`), Python caching, and system files.

---

### 2.2 Prompt Files

Plain text instruction files loaded by the python server.

#### [NEW] [resume_parser.txt](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/prompts/resume_parser.txt)
- Guidelines for structuring raw resume text into JSON format.

#### [NEW] [jd_extraction.txt](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/prompts/jd_extraction.txt)
- Rules to extract job requirements, tools, seniority, and keywords.

#### [NEW] [match_scoring.txt](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/prompts/match_scoring.txt)
- Math instructions to score JD-resume alignment.

#### [NEW] [bullet_rewriter.txt](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/prompts/bullet_rewriter.txt)
- Phrasing instructions with strict truthfulness guardrails.

#### [NEW] [gap_analysis.txt](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/prompts/gap_analysis.txt)
- Logic to flag missing requirements and suggest corrective actions.

---

### 2.3 Client Interface

Building a modern, glassmorphic layout using semantic HTML, custom CSS, and reactive JS.

#### [NEW] [index.html](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/index.html)
- Provides the single-page layout structure. Includes input panel, results container, side-by-side comparison tables, and score dials.

#### [NEW] [style.css](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/style.css)
- Configures variables (colors, fonts).
- Implements a premium, modern dark mode/glassmorphism design.
- Implements a print style sheet (`@media print`) that formats the side-by-side comparison layout perfectly to fit A4/Letter size for paper printing or PDF export.

#### [NEW] [app.js](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/app.js)
- Manages frontend state (original and tailored profiles, scores, gaps).
- Implements file upload triggers and form AJAX requests.
- Dynamically generates comparison tables and handles differences highlighting.
- Controls UI loading states and triggers `window.print()` for local PDF creation.

---

## 3. Phase-wise Milestones

### Phase 1: Local Server Setup & Project Shell
- Create the `server.py` base layout serving dummy files.
- Establish the `.env` helper to load variables.
- Write standard `.gitignore`.

### Phase 2: Premium Frontend Layout & Design (Static)
- Create `index.html` and `style.css` with a responsive dashboard layout.
- Build modern static components (radial match gauges, gap list cards, and original vs tailored tables).
- Create the custom `@media print` style settings.

### Phase 3: Document Parsing Service
- Install `pypdf` via pip.
- Add file upload parser endpoints in `server.py` to extract text from PDFs.
- Add XML parsing script for DOCX file uploads (no external package dependency).

### Phase 4: API Prompt Pipeline & LLM Caller
- Create prompt template files inside the `/prompts` folder.
- Implement the HTTP caller method in `server.py` calling the LLM API using the `requests` library.
- Build parsing and formatting validations for JSON responses.

### Phase 5: Scoring, Gaps & Tailoring Engine Integration
- Hook up extraction, scoring, gap analysis, and bullet rewriter prompts sequentially.
- Verify truthfulness guardrails prevent LLM hallucinations.
- Display tailored results, explanations, risk alerts, and dynamic score changes in the browser.

### Phase 6: PDF Export & Visual Polish
- Hook up print trigger buttons.
- Finalize stylesheet layouts, ensuring no page-break overflows.
- Add user feedback indicators and tooltips.

---

## 4. Verification Plan

### Automated Tests
- Parse target resumes and assert correct JSON extraction.
- Verify LLM responses match target schemas using local Python scripts.

### Manual Verification
- Launch server via `python server.py` and verify availability on `http://localhost:8000`.
- Upload test resumes and job descriptions.
- Confirm side-by-side view highlighting is accurate.
- Print to PDF and verify columns, font scale, and borders match specifications.
