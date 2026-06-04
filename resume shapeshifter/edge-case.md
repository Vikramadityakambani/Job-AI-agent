# Resume Shapeshifter — Edge Cases & Mitigations Guide

This guide compiles critical edge cases, failure modes, and mitigation strategies for each phase of the implementation plan. Use this as a reference checklist during development.

---

## Phase 1: Local Server Setup & Project Shell

### 1.1 Port Collision (Port 8000 Already in Use)
* **Scenario**: Port 8000 is occupied by another local service (such as the Job Agent scraper Web UI). Running `server.py` causes an `OSError: [Errno 98] Address already in use`.
* **Mitigation**: 
  * Implement dynamic port binding fallback. If port 8000 is occupied, try 8001, 8002, etc., and print the active URL to the console.
  * Allow optional port customization via command line arguments (e.g., `python server.py --port 8080`).

### 1.2 Windows Terminal Crash on Unicode Output
* **Scenario**: Standard output/stderr streams in CMD or PowerShell crash when rendering special characters (such as currency symbols `₹` or emoji loading states) if the default shell encoding is set to CP1252.
* **Mitigation**: 
  * Reconfigure terminal streams at server startup:
    ```python
    import sys
    if sys.platform.startswith("win"):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    ```

### 1.3 Missing Environment Configuration File
* **Scenario**: The system attempts to read `os.environ["OPENAI_API_KEY"]` but the key is not defined, crashing runtime operations.
* **Mitigation**: 
  * Write a custom `.env` parser at startup. If `.env` is missing, log a warning and fall back to scanning standard environment variables.
  * Add a health check endpoint `/api/health` that returns validation states of the required API credentials to the frontend UI so users are guided to fix their configuration.

---

## Phase 2: Premium Frontend Layout & Design (Static Layout)

### 2.1 Print Layout Overlapping and Column Mismatch
* **Scenario**: In the browser, the side-by-side list of bullets looks fine due to CSS flexbox/grid scrollbars. But when printed/exported as PDF, scrollbars disappear, and long columns cause the text to overlap or overflow page boundaries.
* **Mitigation**: 
  * Apply `page-break-inside: avoid;` to row panels to ensure that matching bullet pairs do not split across physical page breaks.
  * Force the side-by-side wrapper layout to use a table or grid structure with explicit column widths (e.g., `grid-template-columns: 1fr 1fr;`) for print styles:
    ```css
    @media print {
        .scrollable-container {
            overflow: visible !important;
            max-height: none !important;
        }
        .bullet-row {
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
    }
    ```

### 2.2 CSS Print Color Loss (Highlights Missing)
* **Scenario**: Browser print dialogs default to saving ink, stripping out difference highlight background colors (red/green highlights indicating deletions/additions), rendering the proof layout unreadable.
* **Mitigation**: 
  * Force rendering of background graphics inside CSS:
    ```css
    @media print {
        body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
    ```

### 2.3 Single-Column Layout Collapse on Smaller Laptop Screens
* **Scenario**: A side-by-side grid is too narrow on standard screens (1080p or smaller), compressing the bullets into tall, hard-to-read text boxes.
* **Mitigation**: 
  * Implement responsive layout switches. On screens smaller than 1024px, show a toggle switch to flip between "Original View", "Tailored View", and "Comparison View". Enable side-by-side panels only on screens larger than 1024px.

---

## Phase 3: Document Parsing Service

### 3.1 Scanned or Protected PDF Files (Empty Text Extraction)
* **Scenario**: Ingesting scanned image PDFs (no selectable text layer) or PDFs with security restrictions results in an empty text string, producing errors downstream.
* **Mitigation**: 
  * Detect empty text output after parsing. 
  * Show a clear warning message on the UI: *"We detected that your PDF has no selectable text (scanned image). Please paste your resume text manually using the editor below."*
  * Always provide a backup raw text input editor in the UI.

### 3.2 Non-Standard DOCX Formatting & XML Namespaces
* **Scenario**: Hand-made DOCX files may contain custom tables, text blocks wrapped in shapes, or non-standard namespaces, causing standard XML tag scanners to skip the content.
* **Mitigation**: 
  * When extracting text from `word/document.xml`, target generic text tags (`<w:t>`) while stripping out control elements.
  * Provide a fallback wrapper catching zip file errors (e.g., if the uploaded file is not a valid zip archive) and return a clear description.

### 3.3 Large Upload Payloads (High Memory / Timeouts)
* **Scenario**: The user uploads a 50MB file or a PDF containing embedded image assets, causing the server to hang or run out of memory.
* **Mitigation**: 
  * Enforce client-side file size verification (e.g., max 5MB).
  * Check the content length in `server.py` before downloading the buffer:
    ```python
    content_length = int(self.headers.get('Content-Length', 0))
    if content_length > 5 * 1024 * 1024:
        self.send_error(413, "Payload Too Large: Files must be under 5MB")
        return
    ```

---

## Phase 4: API Prompt Pipeline & LLM Caller

### 4.1 LLM Formatting Inconsistencies (Markdown Code Blocks)
* **Scenario**: Even when requesting JSON Mode, some LLMs prepend conversational phrases (e.g., *"Here is your structured JSON..."*) or enclose the JSON inside markdown blocks (e.g., ` ```json ... ``` `), which breaks `json.loads`.
* **Mitigation**: 
  * Clean the LLM string before loading. Strip out backticks and leading/trailing whitespace:
    ```python
    def clean_json_response(raw_text: str) -> str:
        text = raw_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()
    ```

### 4.2 Escape Characters & Quotes within Text
* **Scenario**: Bullets often contain double quotes (`"`) or backslashes (`\`). If the LLM generates a JSON response and doesn't escape them properly, the JSON payload breaks.
* **Mitigation**: 
  * Explicitly instruct the LLM in the system prompts: *"All string values in the JSON output must escape double quotes with a backslash (\") and replace control characters with standard spaces."*
  * Implement an automatic regex-based fixer or retry loop if JSON parsing fails.

### 4.3 Context Limit Violations
* **Scenario**: A user uploads a 10-page resume and a long job listing, causing the combined prompt size to exceed context limits or output generation limit thresholds, producing truncated JSON.
* **Mitigation**: 
  * Truncate raw input strings to a maximum character length (e.g., 25,000 characters) before sending them to the LLM.
  * Run the extraction prompts separately (one call for JD extraction, one call for Resume Parsing) to split context overhead.

---

## Phase 5: Scoring, Gaps & Tailoring Engine Integration

### 5.1 Fabrication of Experience (Hallucination)
* **Scenario**: The LLM adds a skill from the Job Description directly into the tailored resume experience bullets, even though the user has never used that technology.
* **Mitigation**: 
  * Implement strict negative prompting: *"CRITICAL: You are an auditor. Never add new technologies, employers, or certifications to the experience section. If a technology listed in the JD is missing from the resume, leave it out of the experience section entirely. Instead, compile it into the Gap Analysis payload."*
  * Contrast check: On the server side, parse the tailored experience and compare its keyword counts against the original skills. Highlight new keywords in yellow as "User Verification Required" instead of asserting them as truth.

### 5.2 Empty or Vague Job Descriptions
* **Scenario**: The user pastes a vague job description (e.g., *"Looking for a cool dev to write code, call us!"*). The matching engine gets confused, resulting in division-by-zero errors or meaningless match scores.
* **Mitigation**: 
  * Validate Job Description structure before sending to LLM. If the text is shorter than 50 characters, return an API error code prompting the user to enter more detail.
  * Set fallback baseline scores if required fields (like `requiredSkills` or `responsibilities`) are empty.

### 5.3 Bullet Array Count Mismatch
* **Scenario**: An experience section has 5 bullets, but the LLM returns 3 rewritten bullets, scrambling the side-by-side array alignment.
* **Mitigation**: 
  * Loop through experience items and run rewrites section-by-section (e.g. experience block by experience block) rather than asking for the entire resume rewrite in one prompt.
  * Instruct the rewriter: *"You must output the exact same number of bullet points as the input list. Each bullet index in the output must map directly to the corresponding index of the input list."*

---

## Phase 6: PDF Export & Visual Polish

### 6.1 PDF Rendering Layout Disconnect
* **Scenario**: The user modifies a tailored bullet in the browser-side text editor, but the print command fetches original untailored values from the server database, missing edits.
* **Mitigation**: 
  * Make the print-ready CSS layout render directly off the browser DOM. Since the DOM contains all live user edits, using `window.print()` automatically captures all edits accurately.

### 6.2 Visual Loading States & Timeout
* **Scenario**: Processing a full resume analysis calls the LLM multiple times, which can take 15–30 seconds. If there is no feedback, the user clicks "Analyze" repeatedly or assumes the app has crashed.
* **Mitigation**: 
  * Disable buttons and inputs once the request starts.
  * Show a step-by-step progress checklist overlay indicating what stage is executing (e.g., *"Step 1/5: Extracting job requirements...", "Step 3/5: Running gap calculations..."*). This manages expectations and prevents double submissions.
