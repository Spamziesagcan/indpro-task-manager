from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


def load_project_env() -> None:
    load_dotenv(dotenv_path=ENV_FILE, override=False)
