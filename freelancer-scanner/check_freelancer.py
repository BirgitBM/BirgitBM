#!/usr/bin/env python3
"""Prueft den Freelancer-Zugang -- ohne etwas zu speichern oder zu veraendern.

Aufruf:
    python check_freelancer.py

Das Skript stellt genau EINE Suchanfrage an die offizielle Freelancer-API
und uebersetzt die Antwort in Klartext. Es bewirbt sich nirgends, es legt
nichts an und es schreibt nichts in die Datenbank.

Der Token wird niemals ausgegeben -- nur seine Laenge und die letzten
vier Zeichen, damit du Tippfehler erkennen kannst.
"""

from __future__ import annotations

import sys

import httpx

from app.config import get_settings

TRENNER = "─" * 66
SEARCH_PATH = "/projects/0.1/projects/active/"
AUTH_HEADER = "Freelancer-OAuth-V1"


def kopf(text: str) -> None:
    print(f"\n{TRENNER}\n{text}\n{TRENNER}")


def main() -> int:
    settings = get_settings()

    kopf("Freelancer-Zugang prüfen")

    # --- 1. Ist überhaupt ein Token hinterlegt? --------------------------
    token = (settings.freelancer_oauth_token or "").strip()
    if not token:
        print("FEHLER: In der Datei .env steht kein FREELANCER_OAUTH_TOKEN.\n")
        print("So gehst du vor:")
        print("  1. Öffne die Datei .env in einem Texteditor")
        print("  2. Suche die Zeile   FREELANCER_OAUTH_TOKEN=")
        print("  3. Schreibe deinen Token direkt dahinter, ohne Leerzeichen,")
        print("     ohne Anführungszeichen")
        print("  4. Speichern und dieses Skript erneut ausführen")
        return 1

    if token.lower().startswith("bearer "):
        print("HINWEIS: Dein Token beginnt mit 'Bearer '. Das gehört nicht dazu.")
        print("Trage in der .env nur den Token selbst ein.\n")

    print(f"Token gefunden : {len(token)} Zeichen, endet auf ...{token[-4:]}")
    print(f"Adresse        : {settings.freelancer_api_base}{SEARCH_PATH}")
    print("Suchbegriff    : n8n\n")
    print("Frage die Freelancer-API an ...")

    # --- 2. Eine einzige, harmlose Suchanfrage ---------------------------
    try:
        antwort = httpx.get(
            settings.freelancer_api_base.rstrip("/") + SEARCH_PATH,
            headers={
                AUTH_HEADER: token,
                "Accept": "application/json",
                "User-Agent": "freelancer-scanner/1.0",
            },
            params={
                "query": "n8n",
                "limit": 3,
                "full_description": "true",
                "job_details": "true",
            },
            timeout=float(settings.freelancer_timeout_seconds),
        )
    except httpx.TimeoutException:
        kopf("ZEITÜBERSCHREITUNG")
        print("Die Freelancer-API hat nicht rechtzeitig geantwortet.")
        print("Prüfe deine Internetverbindung und versuche es erneut.")
        return 1
    except httpx.HTTPError as fehler:
        kopf("VERBINDUNG FEHLGESCHLAGEN")
        print(f"Technische Meldung: {fehler}")
        print("\nMögliche Ursachen: keine Internetverbindung, Firewall,")
        print("oder ein Tippfehler in FREELANCER_API_BASE in der .env.")
        return 1

    # --- 3. Antwort in Klartext übersetzen -------------------------------
    if antwort.status_code == 401:
        kopf("TOKEN WIRD NICHT AKZEPTIERT (HTTP 401)")
        print("Der Token ist ungültig, abgelaufen oder unvollständig kopiert.")
        print("\nWas du prüfen kannst:")
        print("  - Wurde der Token vollständig kopiert? Sie sind sehr lang.")
        print("  - Ist versehentlich ein Leerzeichen oder Zeilenumbruch dabei?")
        print("  - Hole auf accounts.freelancer.com/settings/develop einen neuen.")
        return 1

    if antwort.status_code == 403:
        kopf("ZUGRIFF VERWEIGERT (HTTP 403)")
        print("Der Token ist gültig, darf aber diese Abfrage nicht ausführen.")
        print("Das deutet auf fehlende Berechtigungen (Scopes) hin.")
        print("\nSchick mir bitte diese Meldung, dann sehe ich mir an,")
        print("welche Berechtigung fehlt:")
        print(f"\n{antwort.text[:600]}")
        return 1

    if antwort.status_code == 429:
        kopf("ZU VIELE ANFRAGEN (HTTP 429)")
        print("Freelancer bremst dich gerade aus. Warte ein paar Minuten.")
        return 1

    if antwort.status_code != 200:
        kopf(f"UNERWARTETE ANTWORT (HTTP {antwort.status_code})")
        print(antwort.text[:800])
        print("\nSchick mir diese Ausgabe, dann ordne ich sie ein.")
        return 1

    try:
        daten = antwort.json()
    except ValueError:
        kopf("ANTWORT UNLESBAR")
        print("Die API hat kein gültiges JSON geliefert. Anfang der Antwort:")
        print(antwort.text[:400])
        return 1

    if daten.get("status") not in (None, "success"):
        kopf("API MELDET EINEN FEHLER")
        print(f"Status : {daten.get('status')}")
        print(f"Meldung: {daten.get('message', 'keine Angabe')}")
        return 1

    ergebnis = daten.get("result") or {}
    projekte = ergebnis.get("projects") or []

    kopf("ES FUNKTIONIERT")
    print(f"Die Freelancer-API hat geantwortet. Gefundene Projekte: {len(projekte)}\n")

    if not projekte:
        print("Es kamen null Projekte zurück. Der Zugang funktioniert trotzdem --")
        print("zum Suchbegriff 'n8n' gibt es gerade schlicht nichts Aktives.")
    else:
        for projekt in projekte[:3]:
            titel = str(projekt.get("title", "ohne Titel"))[:58]
            budget = projekt.get("budget") or {}
            waehrung = (projekt.get("currency") or {}).get("code", "")
            spanne = f"{budget.get('minimum', '?')}–{budget.get('maximum', '?')} {waehrung}"
            gebote = (projekt.get("bid_stats") or {}).get("bid_count", "?")
            print(f"  • {titel}")
            print(f"    Budget {spanne} · {gebote} Gebote\n")

    print("Nächster Schritt:")
    print("  1. In der Datei .env setzen:  DEMO_MODE=false")
    print("  2. Sicherstellen, dass ein KI-Schlüssel eingetragen ist")
    print("     (ANTHROPIC_API_KEY oder OPENAI_API_KEY) und LLM_PROVIDER passt")
    print("  3. Starten mit:  uvicorn app.main:app")
    return 0


if __name__ == "__main__":
    sys.exit(main())
