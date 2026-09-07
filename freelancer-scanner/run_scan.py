#!/usr/bin/env python3
"""Einen einzelnen Scan-Durchlauf ohne Webserver ausfuehren.

    python run_scan.py
"""

from __future__ import annotations

import sys

from app.config import get_scoring_config, get_settings
from app.database.session import init_db
from app.logging_setup import setup_logging
from app.services.scanner import run_scan


def main() -> int:
    settings = get_settings()
    setup_logging(settings.log_level)
    init_db()

    scoring = get_scoring_config()
    print(f"Demo-Modus      : {'AN' if settings.demo_mode else 'aus'}")
    print(f"LLM-Anbieter    : {settings.effective_llm_provider}")
    print(f"Mindestscore    : {scoring.min_score}")
    print(f"Ziel-Stundensatz: {scoring.target_hourly_rate_usd} USD\n")

    report = run_scan()

    print("\n" + "─" * 62)
    print("ERGEBNIS:", report.summary())
    if report.errors:
        print(f"\n{len(report.errors)} Fehler:")
        for error in report.errors[:10]:
            print("  -", error)
    print("─" * 62)
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
