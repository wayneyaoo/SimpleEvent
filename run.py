import uvicorn
import os
from pathlib import Path

def ensure_directories():
    # Create necessary directories
    Path("data").mkdir(exist_ok=True)
    Path("static").mkdir(exist_ok=True)
    Path("static/css").mkdir(exist_ok=True)
    Path("static/js").mkdir(exist_ok=True)

if __name__ == "__main__":
    ensure_directories()
    uvicorn.run(
        "src.simpleevent.main:app",
        host="localhost",
        port=8000,
        reload=True
    ) 