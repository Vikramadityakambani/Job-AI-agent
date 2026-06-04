import sys
import os

# Add the parent directory to sys.path so we can import from server.py
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from server import ResumeShapeshifterHandler, load_env

# Load environment configurations
load_env()

# Vercel expects a class named 'handler' that inherits from BaseHTTPRequestHandler
class handler(ResumeShapeshifterHandler):
    pass
