# 💼 Job AI Agent & Resume Shapeshifter Suite

Welcome to the AI-powered Job Search and Application Suite. This workspace contains two integrated, premium local applications designed to automate and optimize your job application workflow from discovery to tailoring.

---

## 📂 Workspace Structure

The repository is divided into two primary sub-projects:

```text
antigravity/
├── job AI agent/            # Module 1: Multi-platform Job Scraper & Web Dashboard
│   ├── job_agent.py         # Standard CLI Scraper entry point
│   ├── phase5_web.py        # Web Server & Glassmorphic Dashboard
│   ├── styles.css           # Premium Web Dashboard styling
│   ├── README.md            # Job Agent specific documentation
│   └── ...
│
└── resume shapeshifter/     # Module 2: JD-to-Resume Tailoring Engine
    ├── server.py            # Local HTTP server (zero heavy dependencies)
    ├── app.js               # Reactive frontend controller (LCS word-diff engine)
    ├── style.css            # Glassmorphic editor & print styles
    ├── README.md            # Resume Shapeshifter specific documentation
    └── ...
```

---

## 🔍 1. Job AI Agent Scraper & Web Dashboard

A highly resilient Python-based command-line interface (CLI) and web dashboard that searches, aggregates, and standardizes job listings from **Naukri**, **RemoteOK**, and **Wellfound** (formerly AngelList).

### Key Features
* **Stealth Scrapers**: Bypasses anti-bot detection rules using `curl_cffi` to match Chrome browser TLS and HTTP/2 signatures.
* **Firecrawl Integration**: Seamlessly integrates the Firecrawl API to extract structured JSON data from Wellfound roles.
* **Dual-Mode Fallback**: Automatically generates high-fidelity query-relevant mock listings if direct scraping gets blocked, ensuring zero downtime.
* **Web Dashboard**: A beautiful, glassmorphic dark-mode web server (`phase5_web.py`) equipped with proxy rotation and Slack webhook notifications.
* **CSV Export**: Normalizes and exports all job results to a standardized `jobs_export.csv` file.

👉 For detailed setup and usage instructions, see [job AI agent/README.md](file:///c:/Users/vikra/Downloads/antigravity/job%20AI%20agent/README.md).

---

## 📄 2. Resume Shapeshifter Tailoring Engine

A zero-fabrication local JD-to-resume editor and analysis board. It lets you upload your resume and paste a target job description (JD) to evaluate compatibility, inspect gap items, rewrite bullets truthfully, and print a side-by-side comparative PDF.

### Key Features
* **Structured Document Parsers**: Built-in support for parsing PDF text (`pypdf`) and XML-based DOCX files with **zero** heavy system dependencies.
* **Multi-LLM Integration**: Supports OpenAI, Google Gemini, and Groq Cloud (specifically configured for Llama 3.3).
* **LCS Word-Diff Engine**: Built a custom client-side Longest Common Subsequence (LCS) diff highlighting system in pure JS, displaying interactive real-time visual inline edits (insertions and deletions).
* **Zero-Fabrication Guardrail**: Rewrites resume bullet points by adapting syntax and phrasing to align with the JD, without fabricating credentials or metrics.
* **PDF Proof Generator**: A fully layout-optimized CSS print template for printing or saving a side-by-side matching proof directly from the browser window.

👉 For detailed setup and usage instructions, see [resume shapeshifter/README.md](file:///c:/Users/vikra/Downloads/antigravity/resume%20shapeshifter/README.md).

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python 3.7+** (Python 3.12.3 recommended)
* A modern browser (Chrome, Edge, Firefox, Safari)

### Installation
Run the following command in your terminal to install the combined dependencies for both applications:
```bash
pip install pypdf requests curl_cffi beautifulsoup4 rich
```

### Running the Services

1. **To search and aggregate jobs (CLI):**
   ```bash
   cd "job AI agent"
   python job_agent.py
   ```

2. **To launch the Jobs Dashboard (Web):**
   ```bash
   cd "job AI agent"
   python phase5_web.py
   ```

3. **To launch the Resume Tailoring Engine (Web):**
   ```bash
   cd "resume shapeshifter"
   python server.py
   ```
   Navigate to [http://localhost:8000/](http://localhost:8000/) in your browser to begin tailoring.

---

*This suite is designed for local deployment, offering rapid, privacy-conscious processing of personal resume and job-hunt data.*
