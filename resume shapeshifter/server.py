import http.server
import json
import os
import sys
import io
import zipfile
import xml.etree.ElementTree as ET
import requests
from http import HTTPStatus

# Check and import pypdf conditionally
try:
    import pypdf
except ImportError:
    pypdf = None

# Custom .env loader to prevent external dependencies
def load_env(env_path=".env"):
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'").strip('"')
                os.environ[key] = val

# PDF text extractor using pypdf
def extract_text_from_pdf(pdf_bytes):
    if not pypdf:
        raise ImportError("pypdf is not installed in the environment.")
    pdf_file = io.BytesIO(pdf_bytes)
    reader = pypdf.PdfReader(pdf_file)
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts).strip()

# Dependency-free DOCX text extractor via zipfile and ElementTree
def extract_text_from_docx(docx_bytes):
    docx_file = io.BytesIO(docx_bytes)
    try:
        with zipfile.ZipFile(docx_file) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Find paragraphs in document namespace
            paragraphs = []
            for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                text_runs = []
                for run in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if run.text:
                        text_runs.append(run.text)
                if text_runs:
                    paragraphs.append("".join(text_runs))
            return "\n".join(paragraphs).strip()
    except Exception as e:
        raise ValueError(f"Error parsing DOCX file: {str(e)}")

# Custom robust multipart/form-data parser for dependency-free Python http.server
def parse_multipart(body_bytes, boundary):
    boundary_delimiter = b'--' + boundary
    parts = body_bytes.split(boundary_delimiter)
    for part in parts:
        if not part or part.strip() == b'--' or part.strip() == b'':
            continue
        
        if b'\r\n\r\n' in part:
            header_bytes, content_bytes = part.split(b'\r\n\r\n', 1)
            # Trim trailing boundary newline characters
            if content_bytes.endswith(b'\r\n'):
                content_bytes = content_bytes[:-2]
            elif content_bytes.endswith(b'\r'):
                content_bytes = content_bytes[:-1]
                
            header_str = header_bytes.decode('utf-8', errors='ignore')
            
            if 'name="file"' in header_str:
                filename = ""
                for line in header_str.split('\r\n'):
                    if 'Content-Disposition' in line and 'filename=' in line:
                        parts_line = line.split('filename=')
                        if len(parts_line) > 1:
                            filename = parts_line[1].strip().strip('"').strip("'")
    return None, None

# Load prompt text template from local file system
def load_prompt_template(filename):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "prompts", filename)
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Prompt template file not found: {prompt_path}")
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()

# Strip markdown formatting prepended/appended by some LLMs
def clean_json_response(raw_text):
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

# Run LLM API request via OpenAI, Google Gemini, or Groq (OpenAI Compatibility Mode)
def call_llm(prompt_text):
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    
    if openai_key:
        url = "https://api.openai.com/v1/chat/completions"
        api_key = openai_key
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    elif gemini_key:
        url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        api_key = gemini_key
        model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    elif groq_key:
        url = "https://api.groq.com/openai/v1/chat/completions"
        api_key = groq_key
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    else:
        raise ValueError("No LLM API keys found in .env. Set OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt_text
            }
        ],
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            raise RuntimeError(f"LLM API request failed (HTTP {response.status_code}): {response.text}")
        
        response_data = response.json()
        content = response_data['choices'][0]['message']['content']
        return content
    except Exception as e:
        raise RuntimeError(f"Failed to communicate with LLM API: {str(e)}")

class ResumeShapeshifterHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API Health Check Endpoint
        if self.path == "/api/health":
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            openai_configured = bool(os.environ.get("OPENAI_API_KEY"))
            gemini_configured = bool(os.environ.get("GEMINI_API_KEY"))
            groq_configured = bool(os.environ.get("GROQ_API_KEY"))
            
            health_status = {
                "status": "healthy",
                "openai_configured": openai_configured,
                "gemini_configured": gemini_configured,
                "groq_configured": groq_configured,
                "port": self.server.server_port
            }
            self.wfile.write(json.dumps(health_status).encode("utf-8"))
            return
        
        # Default static file server behavior
        return super().do_GET()

    def do_POST(self):
        # API Document Parser Endpoint
        if self.path == "/api/parse":
            content_length = int(self.headers.get('Content-Length', 0))
            # Enforce client size limits (Edge Case 3.3)
            if content_length > 5 * 1024 * 1024:
                self.send_response(HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Payload Too Large: Files must be under 5MB."}).encode("utf-8"))
                return
            
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b''
            
            # Extract boundary
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Content-Type must be multipart/form-data"}).encode("utf-8"))
                return
                
            boundary = ""
            for param in content_type.split(';'):
                param = param.strip()
                if param.startswith('boundary='):
                    boundary = param.split('boundary=', 1)[1]
            
            if not boundary:
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Boundary parameter missing in Content-Type"}).encode("utf-8"))
                return
                
            # Parse multipart data
            filename, file_bytes = parse_multipart(body_bytes, boundary.encode('utf-8'))
            
            if not filename or file_bytes is None:
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No file uploaded or parsing failed."}).encode("utf-8"))
                return
                
            # Detect file type and parse
            ext = os.path.splitext(filename.lower())[1]
            extracted_text = ""
            
            try:
                if ext == ".pdf":
                    extracted_text = extract_text_from_pdf(file_bytes)
                elif ext == ".docx":
                    extracted_text = extract_text_from_docx(file_bytes)
                elif ext == ".txt":
                    extracted_text = file_bytes.decode('utf-8', errors='ignore')
                else:
                    self.send_response(HTTPStatus.BAD_REQUEST)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Unsupported file type: {ext}. Upload PDF, DOCX, or TXT."}).encode("utf-8"))
                    return
            except Exception as e:
                self.send_response(HTTPStatus.INTERNAL_SERVER_ERROR)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Error parsing document: {str(e)}"}).encode("utf-8"))
                return
                
            # Scanned PDF or empty text verification (Edge Case 3.1)
            if not extracted_text.strip():
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "warning",
                    "text": "",
                    "warning": "We detected that your uploaded document has no selectable text (e.g. scanned image). Please paste your resume text manually."
                }).encode("utf-8"))
                return
                
            # Success response
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "text": extracted_text
            }).encode("utf-8"))
            return

        # API Core Analysis Pipeline Endpoint (Stub for Phase 1)
        elif self.path == "/api/analyze":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            # Verify basic request format
            try:
                data = json.loads(post_data.decode("utf-8"))
                resume_text = data.get("resumeText", "")
                jd_text = data.get("jdText", "")
                
                # Check for empty job description (Edge Case 5.2)
                if len(jd_text.strip()) < 50:
                    self.send_response(HTTPStatus.BAD_REQUEST)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Job description is too short. Please provide at least 50 characters."}).encode("utf-8"))
                    return
            except Exception as e:
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}).encode("utf-8"))
                return

            try:
                # Step 1: Parse and structure the raw Resume
                parser_template = load_prompt_template("resume_parser.txt")
                parser_prompt = parser_template.replace("{{resume_text}}", resume_text)
                parser_response = call_llm(parser_prompt)
                resume_profile = json.loads(clean_json_response(parser_response))
                
                # Step 2: Extract and structure Job Description requirements
                jd_template = load_prompt_template("jd_extraction.txt")
                jd_prompt = jd_template.replace("{{jd_text}}", jd_text)
                jd_response = call_llm(jd_prompt)
                jd_profile = json.loads(clean_json_response(jd_response))
                
                # Step 3: Grade baseline alignment (Original Score)
                scoring_template = load_prompt_template("match_scoring.txt")
                orig_scoring_prompt = scoring_template.replace(
                    "{{resume_profile}}", json.dumps(resume_profile, indent=2)
                ).replace(
                    "{{jd_profile}}", json.dumps(jd_profile, indent=2)
                )
                orig_score_response = call_llm(orig_scoring_prompt)
                original_score = json.loads(clean_json_response(orig_score_response))
                
                # Step 4: Run qualifications gap analysis
                gap_template = load_prompt_template("gap_analysis.txt")
                gap_prompt = gap_template.replace(
                    "{{resume_profile}}", json.dumps(resume_profile, indent=2)
                ).replace(
                    "{{jd_profile}}", json.dumps(jd_profile, indent=2)
                )
                gap_response = call_llm(gap_prompt)
                gaps_data = json.loads(clean_json_response(gap_response))
                gaps = gaps_data.get("gaps", [])
                
                # Step 5: Rewrite experience bullets aligning to JD (enforcing truthfulness)
                rewriter_template = load_prompt_template("bullet_rewriter.txt")
                exp_proj_subset = {
                    "experience": resume_profile.get("experience", []),
                    "projects": resume_profile.get("projects", [])
                }
                rewriter_prompt = rewriter_template.replace(
                    "{{original_experience_and_projects}}", json.dumps(exp_proj_subset, indent=2)
                ).replace(
                    "{{jd_profile}}", json.dumps(jd_profile, indent=2)
                )
                rewriter_response = call_llm(rewriter_prompt)
                tailoring_result = json.loads(clean_json_response(rewriter_response))
                
                # Step 6: Assemble tailored sections and dynamically optimize summary/skills
                assembly_template = load_prompt_template("final_assembly.txt")
                tailored_sections = {
                    "tailoredExperience": tailoring_result.get("tailoredExperience", []),
                    "tailoredProjects": tailoring_result.get("tailoredProjects", [])
                }
                assembly_prompt = assembly_template.replace(
                    "{{original_resume}}", json.dumps(resume_profile, indent=2)
                ).replace(
                    "{{tailored_sections}}", json.dumps(tailored_sections, indent=2)
                )
                assembly_response = call_llm(assembly_prompt)
                assembled_tailored = json.loads(clean_json_response(assembly_response))
                
                # Step 7: Grade tailored alignment (Tailored Score)
                tailored_scoring_prompt = scoring_template.replace(
                    "{{resume_profile}}", json.dumps(assembled_tailored, indent=2)
                ).replace(
                    "{{jd_profile}}", json.dumps(jd_profile, indent=2)
                )
                tailored_score_response = call_llm(tailored_scoring_prompt)
                tailored_score = json.loads(clean_json_response(tailored_score_response))
                
                # Assemble final payload matching frontend's schema
                final_response = {
                    "originalScore": original_score,
                    "tailoredScore": tailored_score,
                    "gaps": gaps,
                    "tailoredResume": {
                        "tailoredSummary": assembled_tailored.get("tailoredSummary", ""),
                        "tailoredSkills": assembled_tailored.get("tailoredSkills", []),
                        "tailoredExperience": assembled_tailored.get("tailoredExperience", []),
                        "tailoredProjects": assembled_tailored.get("tailoredProjects", [])
                    }
                }
                
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(final_response).encode("utf-8"))
                return
                
            except Exception as e:
                self.send_response(HTTPStatus.INTERNAL_SERVER_ERROR)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Analysis pipeline failed: {str(e)}"}).encode("utf-8"))
                return

        self.send_error(HTTPStatus.NOT_FOUND, "API Endpoint Not Found")

def run_server():
    # Force Unicode stdout/stderr encoding on Windows to prevent console crashes
    if sys.platform.startswith("win"):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except AttributeError:
            pass

    # Ensure script's directory is the current working directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)

    load_env()
    
    port = int(os.environ.get("PORT", 8000))
    server_address = ("", port)
    
    # Dynamic port binding fallback (Edge Case 1.1)
    max_retries = 100
    httpd = None
    for i in range(max_retries):
        try:
            httpd = http.server.HTTPServer(server_address, ResumeShapeshifterHandler)
            break
        except OSError as e:
            # Check for Windows address in use error 10048 or generic OSError
            is_in_use = "Address already in use" in str(e) or (sys.platform == "win32" and getattr(e, "winerror", 0) == 10048)
            if is_in_use:
                print(f"Port {port} is occupied. Trying port {port + 1}...")
                port += 1
                server_address = ("", port)
            else:
                raise e

    if not httpd:
        print("Error: Could not bind to any port.")
        sys.exit(1)

    print(f"Server started successfully at http://localhost:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    run_server()
