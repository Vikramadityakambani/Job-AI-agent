# Resume Shapeshifter — JD-to-Resume Tailoring Engine

Resume Shapeshifter is a lightweight, local, zero-fabrication JD-to-resume tailoring engine. It allows job seekers to upload or paste an existing resume and a target job description (JD) to calculate compatibility scores, conduct gap analyses, rewrite experience bullets to align with roles without fabricating details, and export a side-by-side comparative PDF proof.

It is built with **zero heavy dependencies** using a Python backend (`http.server` handler) and a premium glassmorphic single-page Vanilla HTML/CSS/JS frontend.

---

## Features

1. **Structured Parsers**:
   - PDF text extraction using `pypdf`.
   - DOCX paragraph text extraction via built-in XML parsing (no external `python-docx` or DLL requirements).
   - Custom, robust multipart form-data parsing compatible with Python 3.12+ (since `cgi` is deprecated).
2. **LLM Orchestration**:
   - Sequential 7-stage pipeline (Resume Parse -> JD Extract -> Original Score -> Gap Analysis -> Bullet Rewrite -> Final Assembly -> Tailored Score).
   - Multi-provider support (OpenAI, Google Gemini, or Groq Cloud via OpenAI-compatible endpoints).
3. **Interactive Side-by-Side Diff Editor**:
   - Custom **client-side LCS (Longest Common Subsequence) word-based diff engine** that dynamically highlights additions (`<ins>`) and deletions (`<del>`) in real-time as you edit tailored bullets.
4. **Dynamic Gauges & Charts**:
   - Modern SVG radial gauges that animate to display baseline and tailored match scores.
   - Breakdown metrics and priority-labeled gap lists with actionable suggest items.
5. **Layout-Perfect PDF Export**:
   - Dynamic `@media print` print styles formatting columns to A4 sheet dimensions.
   - Generates the side-by-side comparison proof directly from active DOM elements, capturing all inline user edits.

---

## System Requirements

* **Python 3.7+** (Python 3.12.3 is verified in the workspace environment)
* **pypdf** (for PDF text parsing)
* **requests** (for LLM API calls)

---

## Installation & Setup

1. **Navigate to the project root**:
   ```bash
   cd "resume shapeshifter"
   ```

2. **Install dependencies**:
   ```bash
   pip install pypdf requests
   ```

3. **Configure environment keys**:
   Copy or rename `.env` and populate your API credentials under Option A, B, or C:
   ```env
   # Option A: OpenAI API
   OPENAI_API_KEY=your-openai-key
   OPENAI_MODEL=gpt-4o-mini

   # Option B: Google Gemini API
   GEMINI_API_KEY=your-gemini-key
   GEMINI_MODEL=gemini-1.5-flash

   # Option C: Groq Cloud API
   GROQ_API_KEY=your-groq-key
   GROQ_MODEL=llama-3.3-70b-versatile

   PORT=8000
   ```

---

## Running the Application

Start the local server using Python:
```bash
python server.py
```
*Note: If port 8000 is occupied, the server automatically increments and binds to the next free port (8001, 8002, etc.).*

Open your browser and navigate to:
[http://localhost:8000/](http://localhost:8000/)

### Demo Instructions
1. Click **Use Sample Resume & JD** in the hero section to load test data.
2. Click **Analyze & Tailor** to trigger the analysis.
   - If no API key is set in `.env`, the app automatically falls back to a high-fidelity mock dashboard.
   - If a key is configured, the app communicates live with the LLM.
3. Edit any rewritten bullet on the right side of the comparison grid. Notice the diff highlighting above the textarea updates dynamically in real-time.
4. Click **Export PDF Proof** to download/print your side-by-side comparative PDF.

---

## Directory Structure

```text
/
├── server.py               # Main Python HTTP Server (runs on localhost:8000)
├── index.html              # Core single-page layout (Semantic HTML5)
├── style.css               # Styling (Vanilla CSS, Glassmorphic Dashboard, Print layout)
├── app.js                  # Frontend Controller (State management, AJAX handlers, UI updates)
├── README.md               # Setup and running instructions (this file)
└── prompts/                # Plain text files containing LLM prompt instructions
    ├── resume_parser.txt
    ├── jd_extraction.txt
    ├── match_scoring.txt
    ├── bullet_rewriter.txt
    ├── gap_analysis.txt
    └── final_assembly.txt
```
