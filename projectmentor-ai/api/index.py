import sys
import os

# Include backend path for relative imports if backend folder exists
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from backend.app.main import app
except ImportError:
    try:
        from app.main import app
    except ImportError:
        from fastapi import FastAPI
        app = FastAPI(title="ProjectMentor AI Serverless")

        @app.get("/health")
        def health():
            return {"status": "healthy", "service": "ProjectMentor AI Serverless"}

# Vercel Serverless Function export
handler = app
