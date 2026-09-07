"""Benachrichtigung im Terminal -- Standard im DEMO_MODE."""

from __future__ import annotations

import re

from app.logging_setup import get_logger
from app.models.evaluation import ScoreResult
from app.models.project import Project
from app.notifications.formatter import format_project_message
from app.notifications.notifier import Notifier

logger = get_logger(__name__)

_TAGS = re.compile(r"<[^>]+>")


class ConsoleNotifier(Notifier):
    name = "console"

    def send_project(
        self, project: Project, score: ScoreResult, proposal_excerpt: str | None = None
    ) -> bool:
        return self.send_text(format_project_message(project, score, proposal_excerpt))

    def send_text(self, text: str) -> bool:
        plain = _TAGS.sub("", text)
        print("\n" + "═" * 62)
        print(plain)
        print("═" * 62 + "\n", flush=True)
        return True


def build_notifier(settings=None) -> Notifier:
    """Waehlt anhand der Konfiguration den passenden Benachrichtigungsweg."""
    from app.config import get_settings
    from app.notifications.telegram import TelegramNotifier

    settings = settings or get_settings()
    if settings.demo_mode:
        return ConsoleNotifier()
    if settings.telegram_bot_token and settings.telegram_chat_id:
        return TelegramNotifier(settings)
    logger.warning("Kein Telegram konfiguriert -- Meldungen erscheinen nur im Terminal.")
    return ConsoleNotifier()
