"""Erzeugt den passenden LLM-Anbieter anhand der Konfiguration."""

from __future__ import annotations

from app.config import Settings, get_settings
from app.llm.demo_provider import DemoProvider
from app.llm.provider import LLMProvider
from app.logging_setup import get_logger

logger = get_logger(__name__)


def build_provider(settings: Settings | None = None) -> LLMProvider:
    settings = settings or get_settings()
    provider_name = settings.effective_llm_provider

    if provider_name == "demo":
        if not settings.demo_mode:
            logger.warning("LLM_PROVIDER=demo -- es findet keine echte KI-Bewertung statt.")
        return DemoProvider()

    if provider_name == "anthropic":
        from app.llm.anthropic_provider import AnthropicProvider

        return AnthropicProvider(settings)

    if provider_name == "openai":
        from app.llm.openai_provider import OpenAIProvider

        return OpenAIProvider(settings)

    raise ValueError(f"Unbekannter LLM-Anbieter: {provider_name}")
