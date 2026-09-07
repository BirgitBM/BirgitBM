"""OpenAI-Anbindung ueber das offizielle OpenAI-SDK."""

from __future__ import annotations

from app.config import Settings
from app.llm.provider import LLMError, LLMProvider, LLMRequest, LLMResponse
from app.logging_setup import get_logger

logger = get_logger(__name__)

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise LLMError(
                "OPENAI_API_KEY fehlt. Trage den Schluessel in die .env-Datei ein "
                "oder setze DEMO_MODE=true."
            )
        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover
            raise LLMError(
                "Das Paket 'openai' ist nicht installiert. "
                "Bitte ausfuehren: pip install openai"
            ) from exc

        # Ist LLM_MODEL noch auf einem Claude-Modell, wird still auf ein
        # OpenAI-Modell gewechselt -- sonst schlaegt jeder Aufruf fehl.
        model = settings.llm_model
        if model.startswith("claude"):
            logger.warning(
                "LLM_MODEL='%s' passt nicht zu LLM_PROVIDER=openai. Verwende '%s'.",
                model,
                DEFAULT_OPENAI_MODEL,
            )
            model = DEFAULT_OPENAI_MODEL

        self._model = model
        self._client = OpenAI(
            api_key=settings.openai_api_key,
            timeout=float(settings.llm_timeout_seconds),
            max_retries=settings.llm_max_retries,
        )

    @property
    def model(self) -> str:
        return self._model

    def complete(self, request: LLMRequest) -> LLMResponse:
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                max_tokens=request.max_tokens,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": request.system_prompt},
                    {"role": "user", "content": request.user_prompt},
                ],
            )
        except Exception as exc:
            raise LLMError(f"OpenAI-Aufruf fehlgeschlagen: {exc}") from exc

        text = completion.choices[0].message.content or ""
        if not text.strip():
            raise LLMError("OpenAI hat eine leere Antwort geliefert.")

        usage = getattr(completion, "usage", None)
        return LLMResponse(
            text=text,
            model=self._model,
            input_tokens=getattr(usage, "prompt_tokens", None),
            output_tokens=getattr(usage, "completion_tokens", None),
        )
