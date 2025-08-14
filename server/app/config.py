from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    app_name: str = "Devhub Collaborative Editor"

    # Database
    db_host: str = Field(default=os.getenv("DB_HOST", "test.schooldesk.org"))
    db_user: str = Field(default=os.getenv("DB_USER", "ANSK"))
    db_password: str = Field(default=os.getenv("DB_PASSWORD", "Nick8956"))
    db_name: str = Field(default=os.getenv("DB_NAME", "devhub"))

    # Auth
    jwt_secret: str = Field(default=os.getenv("JWT_SECRET", "change-me-dev-secret"))
    jwt_alg: str = Field(default=os.getenv("JWT_ALG", "HS256"))
    access_token_expire_minutes: int = 60 * 24 * 7

    # CORS / Client
    cors_origins: str = Field(default=os.getenv("CORS_ORIGINS", "http://localhost:5173"))
    socket_cors_origin: str = Field(default=os.getenv("SOCKET_CORS_ORIGIN", "http://localhost:5173"))

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


settings = Settings()


