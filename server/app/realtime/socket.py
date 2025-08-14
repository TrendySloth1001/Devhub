import socketio
import jwt
from ..config import settings
from ..database import SessionLocal
from .. import models
from datetime import datetime


mgr = socketio.AsyncRedisManager(url=None) if False else None  # placeholder for future scale-out

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    pass


@sio.event
async def join_session(sid, data):
    session_code = data.get("code")
    token = data.get("token")

    user_email = None
    if token:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
            user_email = payload.get("sub")
        except Exception:
            user_email = None

    await sio.save_session(sid, {"session_code": session_code, "user_email": user_email})
    await sio.enter_room(sid, session_code)
    await sio.emit("system", {"message": f"joined {session_code}"}, room=sid)


@sio.event
async def editor_change(sid, data):
    sess = await sio.get_session(sid)
    room = sess.get("session_code")
    # Include document_id and cursor info if provided
    payload = {
        "document_id": (data or {}).get("document_id"),
        "content": (data or {}).get("content", ""),
        "cursor": (data or {}).get("cursor"),
        "ts": (data or {}).get("ts"),
    }
    await sio.emit("editor_change", payload, room=room, skip_sid=sid)


@sio.event
async def chat_message(sid, data):
    sess = await sio.get_session(sid)
    room = sess.get("session_code")
    user_email = sess.get("user_email") or "anon"
    content = (data or {}).get("content", "")
    created_at = datetime.utcnow().isoformat()

    # Broadcast
    await sio.emit("chat_message", {"user": user_email, "content": content, "created_at": created_at}, room=room, skip_sid=None)

    # Persist message (best-effort)
    try:
        db = SessionLocal()
        s = db.query(models.Session).filter(models.Session.code == room).first()
        u = db.query(models.User).filter(models.User.email == user_email).first() if user_email and user_email != "anon" else None
        if s and u and content:
            msg = models.ChatMessage(session_id=s.id, user_id=u.id, content=content)
            db.add(msg)
            db.commit()
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass


