# 🔍 Job Agent Scraper CLI

A premium, resilient Python-based Command Line Interface (CLI) application that searches, aggregates, and standardizes job listings from **Naukri**, **RemoteOK**, and **Wellfound** (formerly AngelList), exporting the aggregated results directly to a CSV file.

## 🚀 Key Features

* **Stealth Scrapers:** Mimics Chrome browser TLS, HTTP/2 fingerprints, and headers using `curl_cffi` to avoid bot-detection blocks on major targets.
* **Resilient Fallback Engine:** Features a dual-mode scraper system that gracefully falls back to generating query-relevant, high-fidelity mock listings if direct HTML crawling is blocked (Naukri) or missing API credentials (Wellfound).
* **Firecrawl & LLM Extraction:** Integrates Mendable.ai's **Firecrawl API** to crawl Wellfound roles using direct scraping and a structured JSON schema extraction.
* **Aggregated CSV Export:** Normalizes different data structures and writes results directly to a standardized `jobs_export.csv` file.
* **Premium CLI UI:** Renders loading progress indicators, status alerts, and tabular results in the terminal using the `rich` library.
* **Windows Terminal Encoding Fix:** Automatically reconfigures `sys.stdout` and `sys.stderr` to force UTF-8 encoding, preventing crashes when rendering currency symbols (e.g. `₹`) or status emojis in CMD/PowerShell.

---

## 📂 Project Structure

* **[job_agent.py](job_agent.py):** The full, production-ready implementation of the Job Agent (combines Phases 1-4).
* **[context.md](context.md):** Architectural context outlining the project scope, problem statements, target scraping methodologies, and phase breakdowns.
* **Phase-specific Scripts:** (Provided for progressive testing and educational purposes)
  * **[phase1_cli.py](phase1_cli.py):** Establishes terminal foundation shell, reconfigures encoding, and defines the standardized job listing model.
  * **[phase2_cli.py](phase2_cli.py):** Integrates live RemoteOK API fetching and the normalized CSV export engine.
  * **[phase3_cli.py](phase3_cli.py):** Adds the BeautifulSoup Naukri HTML scraper and fallback generator.
  * **[phase4_cli.py](phase4_cli.py):** Integrates Wellfound scraping via the Firecrawl API and structured JSON schemas.
  * **[phase5_web.py](phase5_web.py):** Implements the full-featured, glassmorphic dark-mode web server and dashboard (includes proxy rotation and Slack webhooks).

---

## 🛠️ Installation & Setup

Ensure you have Python 3.7+ installed. 

1. Install the required libraries:
   ```bash
   pip install rich curl_cffi beautifulsoup4
   ```

2. *(Optional)* To enable live Wellfound scraping, set your Firecrawl API key in your environment:
   * **Windows PowerShell:**
     ```powershell
     $env:FIRECRAWL_API_KEY="your-firecrawl-key"
     ```
   * **Windows CMD:**
     ```cmd
     set FIRECRAWL_API_KEY=your-firecrawl-key
     ```
   * **Linux/macOS:**
     ```bash
     export FIRECRAWL_API_KEY="your-firecrawl-key"
     ```

---

## 💻 How to Run

Run the main Job Agent application:
```bash
python job_agent.py
```
Upon launching, the CLI will prompt you to enter a search term (e.g. `Python Developer` or `Sales`). The script will scan the targets and export the aggregated job listings to `jobs_export.csv` in the current folder.

To run specific architectural phase files:
```bash
python phase1_cli.py
python phase2_cli.py
python phase3_cli.py
```

---

## 📊 Export Format (`jobs_export.csv`)

The export engine standardizes job records into a clean CSV format with the following columns:

| Column | Description | Example |
|---|---|---|
| **Source** | The origin platform of the listing | `Naukri`, `RemoteOK`, or `Wellfound` |
| **Job Title** | The title of the job opening | `Software Engineer - Python & Cloud` |
| **Company** | The hiring organization | `Razorpay` |
| **Location** | Geographical or remote status | `Bangalore/Bengaluru` |
| **Salary Range** | Extracted or estimated package | `₹ 10 - 15 Lakhs P.A. (Exp: 1-3 years)` |
| **Apply URL** | The URL to view or apply for the job | `https://www.naukri.com/job-listings-python-123456` |
