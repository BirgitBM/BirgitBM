"""Zentrale Konfiguration.

Zwei Quellen:
  1. Umgebungsvariablen (.env)  -> Zugangsdaten und Betriebsmodus
  2. config/*.yaml             -> fachliche Einstellungen (Keywords, Scoring)

Geheimnisse stehen ausschliesslich in .env und niemals im Quellcode.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"


# ---------------------------------------------------------------------------
# Umgebungsvariablen
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    """Alles, was aus der .env-Datei kommt."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Betriebsmodus -------------------------------------------------------
    demo_mode: bool = True
    log_level: str = "INFO"

    # Datenbank -----------------------------------------------------------
    # SQLite ist der Standard. Fuer Supabase/PostgreSQL genuegt hier ein
    # anderer Verbindungsstring, z.B.
    # postgresql+psycopg://user:pass@host:5432/dbname
    database_url: str = f"sqlite:///{DATA_DIR / 'projects.db'}"

    # LLM -----------------------------------------------------------------
    llm_provider: str = "demo"  # anthropic | openai | demo
    llm_model: str = "claude-opus-5"
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    llm_timeout_seconds: int = 120
    llm_max_retries: int = 2

    # Freelancer ----------------------------------------------------------
    freelancer_oauth_token: str | None = None
    freelancer_api_base: str = "https://www.freelancer.com/api"
    freelancer_timeout_seconds: int = 30
    # Sekunden Pause zwischen zwei Keyword-Abfragen (Rate-Limit-Schutz)
    freelancer_request_delay_seconds: float = 1.5
    # Nur Projekte beruecksichtigen, die juenger sind als X Stunden
    freelancer_max_age_hours: int = 24

    # Telegram ------------------------------------------------------------
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None

    # Scanner -------------------------------------------------------------
    scan_interval_minutes: int = 5
    scanner_enabled: bool = True

    @field_validator("llm_provider")
    @classmethod
    def _known_provider(cls, value: str) -> str:
        allowed = {"anthropic", "openai", "demo"}
        normalised = value.strip().lower()
        if normalised not in allowed:
            raise ValueError(
                f"LLM_PROVIDER='{value}' ist unbekannt. Erlaubt: {', '.join(sorted(allowed))}"
            )
        return normalised

    @property
    def effective_llm_provider(self) -> str:
        """Im DEMO_MODE wird immer der Demo-Provider verwendet."""
        return "demo" if self.demo_mode else self.llm_provider


# ---------------------------------------------------------------------------
# YAML-Konfiguration
# ---------------------------------------------------------------------------
class Cap(BaseModel):
    threshold: float | None = None
    max_score: float


class Caps(BaseModel):
    risk_high: Cap
    risk_critical: Cap
    clarity_low: Cap
    difficulty_high: Cap
    many_red_flags: Cap
    employer_unverified: Cap
    no_budget: Cap


class Weights(BaseModel):
    technical_fit: float
    automation_leverage: float
    budget_ratio: float
    clarity: float
    risk: float
    simplicity: float
    reusability: float

    def total(self) -> float:
        return (
            self.technical_fit
            + self.automation_leverage
            + self.budget_ratio
            + self.clarity
            + self.risk
            + self.simplicity
            + self.reusability
        )


class AgeBonusRule(BaseModel):
    max_minutes: float
    bonus: float


class BidBonusRule(BaseModel):
    max_bids: int
    bonus: float


class FreshnessConfig(BaseModel):
    """Bonus fuer frische Projekte -- nur fuer Reihenfolge und Meldung."""

    age_bonus: list[AgeBonusRule] = Field(default_factory=list)
    bid_bonus: list[BidBonusRule] = Field(default_factory=list)
    unknown_age_bonus: float = 0.0

    @property
    def max_bonus(self) -> float:
        best_age = max((rule.bonus for rule in self.age_bonus), default=0.0)
        best_bid = max((rule.bonus for rule in self.bid_bonus), default=0.0)
        return best_age + best_bid


class ArbitrageConfig(BaseModel):
    """Wann ein Projekt als besonders lohnend gekennzeichnet wird."""

    min_overall_score: float = 80
    min_automation_leverage: float = 8
    max_risk: float = 4
    min_effective_hourly_rate_usd: float = 60


class PrefilterConfig(BaseModel):
    min_budget_usd: float = 100
    min_description_chars: int = 120
    max_existing_bids: int = 60
    skip_if_no_budget: bool = False


class ScoringConfig(BaseModel):
    # Schwelle fuer die Benachrichtigung (geprueft am opportunity_score)
    min_score: float = 75
    # Schwelle fuer den automatischen Bewerbungsentwurf (am overall_score)
    apply_score: float = 82
    target_hourly_rate_usd: float = 60
    weights: Weights
    caps: Caps
    freshness: FreshnessConfig = Field(default_factory=FreshnessConfig)
    arbitrage: ArbitrageConfig = Field(default_factory=ArbitrageConfig)
    prefilter: PrefilterConfig = Field(default_factory=PrefilterConfig)
    currency_rates_usd: dict[str, float] = Field(default_factory=lambda: {"USD": 1.0})

    @field_validator("apply_score")
    @classmethod
    def _apply_not_below_min(cls, value: float, info) -> float:
        minimum = info.data.get("min_score")
        if minimum is not None and value < minimum:
            raise ValueError(
                f"apply_score ({value}) darf nicht unter min_score ({minimum}) liegen. "
                "Sonst wuerden Entwuerfe fuer Projekte erzeugt, die du nie gemeldet bekommst."
            )
        return value

    @field_validator("weights")
    @classmethod
    def _weights_sum_to_one(cls, value: Weights) -> Weights:
        if abs(value.total() - 1.0) > 0.001:
            raise ValueError(
                f"Die Gewichte in config/scoring.yaml ergeben {value.total():.3f} statt 1.0."
            )
        return value


class KeywordConfig(BaseModel):
    keywords: list[str]


class ExcludeConfig(BaseModel):
    exclude_technologies: list[str] = Field(default_factory=list)
    exclude_phrases: list[str] = Field(default_factory=list)


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(
            f"Konfigurationsdatei fehlt: {path}. "
            "Bitte aus dem Repository wiederherstellen."
        )
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


@lru_cache(maxsize=1)
def get_scoring_config() -> ScoringConfig:
    return ScoringConfig(**_load_yaml(CONFIG_DIR / "scoring.yaml"))


@lru_cache(maxsize=1)
def get_keywords() -> list[str]:
    return KeywordConfig(**_load_yaml(CONFIG_DIR / "keywords.yaml")).keywords


@lru_cache(maxsize=1)
def get_exclude_config() -> ExcludeConfig:
    return ExcludeConfig(**_load_yaml(CONFIG_DIR / "exclude.yaml"))


def reset_config_cache() -> None:
    """Fuer Tests: alle zwischengespeicherten Konfigurationen verwerfen."""
    get_settings.cache_clear()
    get_scoring_config.cache_clear()
    get_keywords.cache_clear()
    get_exclude_config.cache_clear()


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


__all__ = [
    "BASE_DIR",
    "CONFIG_DIR",
    "DATA_DIR",
    "Settings",
    "ScoringConfig",
    "ExcludeConfig",
    "get_settings",
    "get_scoring_config",
    "get_keywords",
    "get_exclude_config",
    "reset_config_cache",
    "ensure_data_dir",
]
