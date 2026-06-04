import sys
import os

# Add parent directory to sys.path so we can import phase5_web.py
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from phase5_web import JobAgentHandler

# Vercel expects a class named 'handler' that inherits from BaseHTTPRequestHandler
class handler(JobAgentHandler):
    pass
