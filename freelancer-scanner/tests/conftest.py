"""Gemeinsame Test-Vorbereitung."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Tests laufen immer im Demo-Modus -- keine externen Zugriffe, keine Kosten.
os.environ["DEMO_MODE"] = "true"
os.environ["LLM_PROVIDER"] = "demo"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SCANNER_ENABLED"] = "false"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_scoring_config, reset_config_cache  # noqa: E402
from app.database.session import configure_for_tests  # noqa: E402
from app.models.evaluation import LLMEvaluation  # noqa: E402
from app.models.project import Base, Project  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_database():
    """Jeder Test bekommt eine leere Datenbank im Arbeitsspeicher."""
    reset_config_cache()
    configure_for_tests("sqlite:///:memory:")
    yield
    from app.database.session import get_engine

    Base.metadata.drop_all(bind=get_engine())


@pytest.fixture
def scoring():
    return get_scoring_config()


@pytest.fixture
def make_project():
    def _make(**overrides) -> Project:
        defaults = dict(
            freelancer_id="test-1",
            title="Automate Google Sheets to Gmail",
            description="A" * 400,
            url="https://example.com/p/1",
            budget_min=400.0,
            budget_max=600.0,
            currency="USD",
            project_type="fixed",
            skills=["n8n", "Automation"],
            bid_count=5,
            employer_verified=True,
        )
        defaults.update(overrides)
        return Project(**defaults)

    return _make


@pytest.fixture
def make_evaluation():
    def _make(**overrides) -> LLMEvaluation:
        defaults = dict(
            technical_fit=9,
            difficulty=3,
            risk=2,
            clarity=8,
            reusability=8,
            estimated_hours_min=4,
            estimated_hours_max=7,
            estimated_tool_cost_usd=0,
            required_tools=["n8n"],
            required_apis=["Gmail API"],
            red_flags=[],
            short_summary="Kurzfassung",
            implementation_idea="Plan",
            reason_for_score="Begruendung",
        )
        defaults.update(overrides)
        return LLMEvaluation(**defaults)

    return _make
