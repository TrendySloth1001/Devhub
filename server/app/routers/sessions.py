import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..auth import get_current_user
from ..deps import get_db_dep


router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _generate_code(length: int = 8) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


@router.post("/create", response_model=schemas.SessionOut)
def create_session(payload: schemas.SessionCreate, db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    code = _generate_code()
    while db.query(models.Session).filter(models.Session.code == code).first() is not None:
        code = _generate_code()
    session = models.Session(name=payload.name, code=code, owner_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    # create default document
    doc = models.Document(session_id=session.id, title="main.ts", content="", language="typescript")
    db.add(doc)
    db.commit()
    return session


@router.get("/by-code/{code}", response_model=schemas.SessionOut)
def get_by_code(code: str, db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    session = db.query(models.Session).filter(models.Session.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/info/{code}", response_model=schemas.SessionInfoOut)
def get_info(code: str, db: Session = Depends(get_db_dep)):
    session = db.query(models.Session).filter(models.Session.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    owner = db.query(models.User).filter(models.User.id == session.owner_id).first()
    return {
        "id": session.id,
        "name": session.name,
        "code": session.code,
        "owner_email": owner.email if owner else None,
        "created_at": session.created_at,
    }


@router.get("/{session_id}/documents", response_model=list[schemas.DocumentOut])
def list_documents(session_id: int, db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    docs = db.query(models.Document).filter(models.Document.session_id == session_id).all()
    return docs


@router.patch("/documents/{document_id}", response_model=schemas.DocumentOut)
def upsert_document(document_id: int, payload: schemas.DocumentUpsert, db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if payload.title is not None:
        doc.title = payload.title
    if payload.content is not None:
        doc.content = payload.content
    if payload.language is not None:
        doc.language = payload.language
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{session_id}/documents", response_model=schemas.DocumentOut)
def create_document(session_id: int, payload: schemas.DocumentCreate, db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    doc = models.Document(session_id=session_id, title=payload.title, content="", language=payload.language or "typescript")
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/mine", response_model=list[schemas.SessionOut])
def my_sessions(db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    sessions = db.query(models.Session).filter(models.Session.owner_id == current_user.id).order_by(models.Session.created_at.desc()).all()
    return sessions


@router.get("/{session_id}/messages", response_model=list[schemas.ChatMessageViewOut])
def list_messages(session_id: int, db: Session = Depends(get_db_dep), current_user: models.User = Depends(get_current_user)):
    msgs = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.created_at.asc()).all()
    result: list[schemas.ChatMessageViewOut] = []
    for m in msgs:
        user = db.query(models.User).filter(models.User.id == m.user_id).first()
        result.append({
            "content": m.content,
            "created_at": m.created_at,
            "user_email": user.email if user else None,
        })
    return result


