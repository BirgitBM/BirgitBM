"""Gemeinsame Schnittstelle fuer alle LLM-Anbieter."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


class LLMError(RuntimeError):
    """Der Anbieter konnte keine verwertbare Antwort liefern."""


@dataclass
class LLMRequest:
    system_prompt: str
    user_prompt: str
    max_tokens: int = 16000
    # Zusatzdaten, die nur der Demo-Provider auswertet.
    context: dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMResponse:
    text: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class LLMProvider(ABC):
    """Ein Anbieter erzeugt aus einem Prompt reinen Text.

    Das Einlesen und Validieren des JSON passiert bewusst NICHT hier,
    sondern zentral im LLMClient -- damit gilt fuer alle Anbieter
    dieselbe Pruefung und derselbe Retry.
    """

    name: str = "base"

    @abstractmethod
    def complete(self, request: LLMRequest) -> LLMResponse:  # pragma: no cover
        ...

    @property
    @abstractmethod
    def model(self) -> str:  # pragma: no cover
        ...
