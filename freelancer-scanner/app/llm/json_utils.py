"""Robustes Einlesen von JSON aus LLM-Antworten.

Modelle liefern gelegentlich Markdown-Zaeune, einen Einleitungssatz oder
ein nachgestelltes Komma. Statt die Antwort zu verwerfen, wird hier
zuerst versucht, sie zu retten. Erst danach greift der Retry.
"""

from __future__ import annotations

import json
import re
from typing import Any


class JSONExtractionError(ValueError):
    """Aus der Antwort liess sich kein gueltiges JSON-Objekt gewinnen."""


_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
_TRAILING_COMMA = re.compile(r",(\s*[}\]])")


def _balanced_object(text: str) -> str | None:
    """Findet das erste vollstaendige, klammerbalancierte JSON-Objekt."""
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False

    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]
    return None


def extract_json_object(raw: str) -> dict[str, Any]:
    """Gewinnt ein JSON-Objekt aus einer LLM-Antwort.

    Reihenfolge der Versuche:
      1. direkt parsen
      2. Inhalt eines Markdown-Codeblocks parsen
      3. erstes klammerbalanciertes Objekt parsen
      4. dasselbe, nach Entfernen nachgestellter Kommata
    """
    if not raw or not raw.strip():
        raise JSONExtractionError("Die Antwort des Modells war leer.")

    candidates: list[str] = [raw.strip()]

    fence_match = _FENCE.search(raw)
    if fence_match:
        candidates.append(fence_match.group(1).strip())

    balanced = _balanced_object(raw)
    if balanced:
        candidates.append(balanced)
        candidates.append(_TRAILING_COMMA.sub(r"\1", balanced))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(parsed, dict):
            return parsed

    preview = raw.strip()[:200].replace("\n", " ")
    raise JSONExtractionError(f"Kein gueltiges JSON-Objekt gefunden. Anfang: {preview!r}")
