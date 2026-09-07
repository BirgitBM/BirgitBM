"""Benachrichtigung per Telegram-Bot."""

from __future__ import annotations

import time

import httpx

from app.config import Settings, get_settings
from app.logging_setup import get_logger
from app.models.evaluation import ScoreResult
from app.models.project import Project
from app.notifications.formatter import format_project_message
from app.notifications.notifier import Notifier

logger = get_logger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
MAX_MESSAGE_LENGTH = 4096
RETRY_BACKOFF_SECONDS = (2, 4)


class TelegramNotifier(Notifier):
    name = "telegram"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._configured = bool(
            self.settings.telegram_bot_token and self.settings.telegram_chat_id
        )
        if not self._configured:
            logger.warning(
                "Telegram ist nicht vollstaendig konfiguriert "
                "(TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Es werden keine "
                "Nachrichten versendet."
            )

    def send_project(
        self, project: Project, score: ScoreResult, proposal_excerpt: str | None = None
    ) -> bool:
        return self.send_text(format_project_message(project, score, proposal_excerpt))

    def send_text(self, text: str) -> bool:
        if not self._configured:
            return False

        if len(text) > MAX_MESSAGE_LENGTH:
            text = text[: MAX_MESSAGE_LENGTH - 20].rsplit("\n", 1)[0] + "\n…"

        url = TELEGRAM_API.format(token=self.settings.telegram_bot_token)
        payload = {
            "chat_id": self.settings.telegram_chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        }

        for attempt in range(len(RETRY_BACKOFF_SECONDS) + 1):
            try:
                response = httpx.post(url, json=payload, timeout=20.0)
                if response.status_code == 200:
                    return True
                if response.status_code == 429:
                    wait = int(
                        (response.json().get("parameters") or {}).get("retry_after", 5)
                    )
                    logger.warning("Telegram-Rate-Limit, warte %ss.", wait)
                    time.sleep(min(wait, 60))
                    continue
                logger.error(
                    "Telegram antwortete mit HTTP %s: %s",
                    response.status_code,
                    response.text[:200],
                )
                if 400 <= response.status_code < 500:
                    # Konfigurationsfehler -- ein Retry aendert nichts.
                    return False
            except httpx.HTTPError as exc:
                logger.warning("Telegram nicht erreichbar: %s", exc)

            if attempt < len(RETRY_BACKOFF_SECONDS):
                time.sleep(RETRY_BACKOFF_SECONDS[attempt])

        logger.error("Telegram-Nachricht konnte nicht zugestellt werden.")
        return False
