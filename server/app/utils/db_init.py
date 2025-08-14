from __future__ import annotations
import pymysql
from ..config import settings


def ensure_database_exists() -> None:
    connection = None
    try:
        connection = pymysql.connect(
            host=settings.db_host,
            user=settings.db_user,
            password=settings.db_password,
            autocommit=True,
            charset="utf8mb4",
        )
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    except Exception:
        # Swallow errors silently; DB might not be creatable with provided user
        pass
    finally:
        if connection:
            connection.close()



