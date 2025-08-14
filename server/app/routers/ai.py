from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db_dep


router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/assist")
def assist(prompt: dict, db: Session = Depends(get_db_dep)):
    # Placeholder for future AI integration (OpenAI, etc.)
    code = prompt.get("code", "")
    question = prompt.get("question", "")
    return {"answer": f"AI assistant is not configured. You asked: {question}", "codeEcho": code}



