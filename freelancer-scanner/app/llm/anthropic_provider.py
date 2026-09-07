"""Claude-Anbindung ueber das offizielle Anthropic-SDK."""

from __future__ import annotations

from app.config import Settings
from app.llm.provider import LLMError, LLMProvider, LLMRequest, LLMResponse
from app.logging_setup import get_logger

logger = get_logger(__name__)


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, settings: Settings) -> None:
        if not settings.anthropic_api_key:
            raise LLMError(
                "ANTHROPIC_API_KEY fehlt. Trage den Schluessel in die .env-Datei ein "
                "oder setze DEMO_MODE=true."
            )
        try:
            from anthropic import Anthropic
        except ImportError as exc:  # pragma: no cover - haengt von der Installation ab
            raise LLMError(
                "Das Paket 'anthropic' ist nicht installiert. "
                "Bitte ausfuehren: pip install anthropic"
            ) from exc

        self._settings = settings
        self._model = settings.llm_model
        self._client = Anthropic(
            api_key=settings.anthropic_api_key,
            timeout=float(settings.llm_timeout_seconds),
            max_retries=settings.llm_max_retries,
        )

    @property
    def model(self) -> str:
        return self._model

    def complete(self, request: LLMRequest) -> LLMResponse:
        payload = {
            "model": self._model,
            "max_tokens": request.max_tokens,
            "system": request.system_prompt,
            "messages": [{"role": "user", "content": request.user_prompt}],
            # Bewertung ist eine Einstufungsaufgabe -- niedriger Aufwand
            # genuegt und haelt die Kosten unten.
            "output_config": {"effort": "low"},
        }

        try:
            message = self._client.messages.create(**payload)
        except TypeError:
            # Aeltere SDK-Versionen kennen output_config noch nicht.
            payload.pop("output_config", None)
            message = self._client.messages.create(**payload)
        except Exception as exc:
            raise LLMError(f"Anthropic-Aufruf fehlgeschlagen: {exc}") from exc

        if getattr(message, "stop_reason", None) == "refusal":
            raise LLMError("Claude hat die Bewertung dieses Projekttextes abgelehnt.")

        text = "".join(
            block.text for block in message.content if getattr(block, "type", None) == "text"
        )
        if not text.strip():
            raise LLMError("Claude hat eine leere Antwort geliefert.")

        usage = getattr(message, "usage", None)
        return LLMResponse(
            text=text,
            model=self._model,
            input_tokens=getattr(usage, "input_tokens", None),
            output_tokens=getattr(usage, "output_tokens", None),
        )
