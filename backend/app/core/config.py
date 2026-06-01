from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.env import load_project_env


load_project_env()

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Task Manager API"
    app_env: str = "development"
    app_debug: bool = True
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24

    # Neon Postgres example:
    # postgresql+psycopg://user:password@host/dbname?sslmode=require
    database_url: str

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
