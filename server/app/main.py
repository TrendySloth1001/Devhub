from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import users, sessions, ai
from .database import engine
from . import models
from .realtime.socket import sio
from starlette.middleware.sessions import SessionMiddleware
from starlette.routing import Mount
from socketio import ASGIApp


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)

app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(ai.router)

# Mount Socket.IO
socket_app = ASGIApp(sio, other_asgi_app=app)


def get_app():
    return socket_app



