"""Sozlamalar — hammasi .env dan o'qiladi. Sir kod ichida saqlanmaydi."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, "") or default)
    except ValueError:
        return default


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, "") or default)
    except ValueError:
        return default


@dataclass(frozen=True)
class Config:
    # --- Telegram userbot (MTProto) ---
    api_id: int = field(default_factory=lambda: _int("TG_API_ID", 0))
    api_hash: str = field(default_factory=lambda: os.getenv("TG_API_HASH", ""))
    session_name: str = field(
        default_factory=lambda: os.getenv("TG_SESSION_NAME", "kattabaza_userbot")
    )

    # --- Baza ---
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL", ""))

    # --- Tempo (ban bo'lmaslik uchun) ---
    delay_seconds: float = field(default_factory=lambda: _float("COPY_DELAY_SECONDS", 1.5))
    batch_pause_every: int = field(default_factory=lambda: _int("BATCH_PAUSE_EVERY", 100))
    batch_pause_seconds: int = field(default_factory=lambda: _int("BATCH_PAUSE_SECONDS", 60))
    max_attempts: int = field(default_factory=lambda: _int("MAX_JOB_ATTEMPTS", 5))

    # --- Fayl chegaralari ---
    max_file_mb: int = field(default_factory=lambda: _int("MAX_FILE_MB", 2000))
    work_dir: Path = field(default_factory=lambda: ROOT / "downloads")

    def validate(self) -> list[str]:
        problems = []
        if not self.api_id:
            problems.append("TG_API_ID yo'q (my.telegram.org dan oling)")
        if not self.api_hash:
            problems.append("TG_API_HASH yo'q")
        if not self.database_url:
            problems.append("DATABASE_URL yo'q (Supabase → Settings → Database)")
        if self.delay_seconds < 0.5:
            problems.append("COPY_DELAY_SECONDS 0.5 dan kichik — ban xavfi yuqori")
        return problems


cfg = Config()

if __name__ == "__main__":
    issues = cfg.validate()
    print(f"session : {cfg.session_name}")
    print(f"api_id  : {'✅ bor' if cfg.api_id else '❌ yo‘q'}")
    print(f"api_hash: {'✅ bor' if cfg.api_hash else '❌ yo‘q'}")
    print(f"database: {'✅ bor' if cfg.database_url else '❌ yo‘q'}")
    print(f"tempo   : har fayl orasida {cfg.delay_seconds}s, "
          f"har {cfg.batch_pause_every} tadan keyin {cfg.batch_pause_seconds}s pauza")
    if issues:
        print("\n⚠️  Muammolar:")
        for p in issues:
            print(f"   • {p}")
        raise SystemExit(1)
    print("\n✅ Sozlamalar to'liq")
