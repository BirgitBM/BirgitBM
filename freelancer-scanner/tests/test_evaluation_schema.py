"""Ungueltige KI-Antworten muessen sauber abgefangen werden."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from app.llm.client import LLMClient
from app.llm.json_utils import JSONExtractionError, extract_json_object
from app.llm.provider import LLMError, LLMProvider, LLMResponse
from app.models.evaluation import LLMEvaluation, Proposal

VALID = {
    "technical_fit": 9, "automation_leverage": 8, "difficulty": 3, "risk": 2, "clarity": 8, "reusability": 7,
    "estimated_hours_min": 4, "estimated_hours_max": 8, "estimated_tool_cost_usd": 0,
    "required_tools": ["n8n"], "required_apis": [], "red_flags": [],
    "short_summary": "s", "implementation_idea": "i", "reason_for_score": "r",
}


# --- JSON aus unsauberen Antworten gewinnen --------------------------------
def test_sauberes_json():
    assert extract_json_object('{"a": 1}') == {"a": 1}


def test_markdown_block_wird_entfernt():
    assert extract_json_object('```json\n{"a": 2}\n```') == {"a": 2}


def test_text_vor_und_nach_dem_json_wird_ignoriert():
    raw = 'Hier ist deine Bewertung:\n{"a": 3}\nIch hoffe das passt!'
    assert extract_json_object(raw) == {"a": 3}


def test_geschweifte_klammer_im_string_bricht_nichts():
    assert extract_json_object('{"a": "eine } Klammer"}') == {"a": "eine } Klammer"}


def test_nachgestelltes_komma_wird_repariert():
    assert extract_json_object('{"a": 1, "b": [1,2,],}') == {"a": 1, "b": [1, 2]}


def test_ohne_json_gibt_es_einen_klaren_fehler():
    with pytest.raises(JSONExtractionError):
        extract_json_object("Ich kann das leider nicht bewerten.")


def test_leere_antwort_gibt_einen_klaren_fehler():
    with pytest.raises(JSONExtractionError):
        extract_json_object("")


# --- Schema-Validierung -----------------------------------------------------
def test_gueltige_bewertung_wird_angenommen():
    assert LLMEvaluation.model_validate(VALID).technical_fit == 9


def test_wert_ausserhalb_der_skala_wird_abgelehnt():
    with pytest.raises(ValidationError):
        LLMEvaluation.model_validate({**VALID, "technical_fit": 15})


def test_negativer_wert_wird_abgelehnt():
    with pytest.raises(ValidationError):
        LLMEvaluation.model_validate({**VALID, "risk": -2})


def test_fehlendes_pflichtfeld_wird_abgelehnt():
    unvollstaendig = {key: value for key, value in VALID.items() if key != "short_summary"}
    with pytest.raises(ValidationError):
        LLMEvaluation.model_validate(unvollstaendig)


def test_vertauschte_stunden_werden_korrigiert():
    evaluation = LLMEvaluation.model_validate(
        {**VALID, "estimated_hours_min": 20, "estimated_hours_max": 5}
    )
    assert evaluation.estimated_hours_max >= evaluation.estimated_hours_min


def test_string_statt_liste_wird_geheilt():
    evaluation = LLMEvaluation.model_validate({**VALID, "required_tools": "n8n"})
    assert evaluation.required_tools == ["n8n"]


def test_unbekannte_zusatzfelder_stoeren_nicht():
    assert LLMEvaluation.model_validate({**VALID, "confidence": 0.9}).risk == 2


# --- Retry-Verhalten des Clients -------------------------------------------
class ScriptedProvider(LLMProvider):
    """Spielt eine feste Folge von Antworten ab und zaehlt die Aufrufe."""

    name = "scripted"

    def __init__(self, answers: list[str]) -> None:
        self.answers = answers
        self.calls = 0
        self.prompts: list[str] = []

    @property
    def model(self) -> str:
        return "scripted"

    def complete(self, request):
        self.prompts.append(request.user_prompt)
        answer = self.answers[min(self.calls, len(self.answers) - 1)]
        self.calls += 1
        return LLMResponse(text=answer, model="scripted")


def test_retry_rettet_eine_kaputte_erste_antwort(make_project):
    provider = ScriptedProvider(["Sorry, das kann ich nicht.", json.dumps(VALID)])
    evaluation = LLMClient(provider=provider).evaluate_project(make_project())

    assert provider.calls == 2
    assert evaluation.technical_fit == 9
    # Der zweite Versuch muss den Fehler benennen, sonst bringt er nichts.
    assert "CORRECTION REQUIRED" in provider.prompts[1]


def test_retry_rettet_auch_eine_schema_verletzung(make_project):
    kaputt = json.dumps({**VALID, "risk": 99})
    provider = ScriptedProvider([kaputt, json.dumps(VALID)])
    evaluation = LLMClient(provider=provider).evaluate_project(make_project())
    assert provider.calls == 2
    assert evaluation.risk == 2


def test_nach_erschoepften_versuchen_gibt_es_einen_klaren_fehler(make_project):
    provider = ScriptedProvider(["kein json"])
    with pytest.raises(LLMError) as excinfo:
        LLMClient(provider=provider).evaluate_project(make_project())

    assert provider.calls == 3  # 1 Versuch + 2 Wiederholungen
    assert "keine gueltige Antwort" in str(excinfo.value)


# --- Bewerbungsentwurf ------------------------------------------------------
def test_entwurf_wird_zu_lesbarem_text():
    proposal = Proposal(
        opening="Ihr Ergebnis steht in drei Tagen.",
        understanding="Ich habe verstanden, dass ...",
        solution_steps=["Schritt eins", "Schritt zwei"],
        deliverables=["Der fertige Workflow"],
        timeline="3 Arbeitstage",
        questions=["Eine Frage?"],
        closing="Melde dich gern.",
    )
    text = proposal.as_text()
    assert text.startswith("Ihr Ergebnis steht in drei Tagen.")
    assert "1. Schritt eins" in text
    assert "- Der fertige Workflow" in text
    assert "Timeline: 3 Arbeitstage" in text


def test_entwurf_ohne_schritte_wird_abgelehnt():
    with pytest.raises(ValidationError):
        Proposal(opening="a", understanding="b", solution_steps=[])
