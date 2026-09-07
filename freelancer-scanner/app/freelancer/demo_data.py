"""Fuenf Beispielprojekte fuer den DEMO_MODE.

Damit laesst sich das gesamte System testen, ohne Freelancer-API,
ohne LLM-Schluessel und ohne Telegram.

Jedes Beispiel bringt eine fest hinterlegte KI-Einschaetzung mit
(`demo_evaluation`). Der Gesamtscore wird daraus NICHT abgelesen,
sondern von der echten Scoring-Engine berechnet -- der Demo-Modus
testet die Bewertungslogik also tatsaechlich.

Erwartete Einordnung:
  1-3  gut   (deutlich ueber dem Mindestscore)
  4-5  schlecht (deutlich darunter)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any


def _minutes_ago(minutes: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


DEMO_PROJECTS: list[dict[str, Any]] = [
    # ---------------------------------------------------------------- 1
    {
        "freelancer_id": "demo-1001",
        "title": "n8n workflow: new Google Sheets row triggers personalised Gmail follow-up",
        "description": (
            "We collect leads in a Google Sheet from our website form. I need an n8n "
            "workflow that watches the sheet, and whenever a new row is added, sends a "
            "personalised follow-up email from our Gmail account using the name, company "
            "and the service they selected. After sending, write the timestamp back into "
            "a 'contacted' column in the same sheet. If the email address is invalid, "
            "mark the row red and skip it instead of failing. We already have an n8n "
            "cloud account and a Google Workspace account. Roughly 40 leads per week. "
            "Please set this up in our own n8n instance and show us how to edit the "
            "email text ourselves afterwards."
        ),
        "url": "https://www.freelancer.com/projects/demo-1001",
        "posted_at": _minutes_ago(12),
        "budget_min": 400,
        "budget_max": 600,
        "currency": "USD",
        "project_type": "fixed",
        "skills": ["n8n", "Google Sheets", "Gmail", "Automation", "API"],
        "bid_count": 7,
        "bid_avg": 505.0,
        "employer_verified": True,
        "employer_country": "Germany",
        "matched_keyword": "n8n",
        "demo_evaluation": {
            "technical_fit": 10,
            "difficulty": 3,
            "risk": 2,
            "clarity": 8,
            "reusability": 8,
            "estimated_hours_min": 4,
            "estimated_hours_max": 7,
            "estimated_tool_cost_usd": 0,
            "required_tools": ["n8n", "Google Sheets", "Gmail"],
            "required_apis": ["Google Sheets API", "Gmail API"],
            "red_flags": [],
            "short_summary": (
                "Neue Zeile im Google Sheet loest eine personalisierte Gmail-Nachricht aus, "
                "danach wird der Zeitstempel zurueck ins Sheet geschrieben."
            ),
            "implementation_idea": (
                "n8n Google-Sheets-Trigger auf die Lead-Tabelle. Ein Set-Node baut aus Name, "
                "Firma und gewaehltem Service den Mailtext. Gmail-Node versendet, danach "
                "schreibt ein Sheets-Update-Node den Zeitstempel in die Spalte 'contacted'. "
                "Ein IF-Node prueft vorher per Regex die E-Mail-Adresse und faerbt ungueltige "
                "Zeilen rot, statt den Workflow abzubrechen. Der Mailtext liegt in einem "
                "eigenen Node, damit die Kundin ihn selbst aendern kann."
            ),
            "reason_for_score": (
                "Reine Verbindungsarbeit zwischen zwei sehr gut dokumentierten Google-APIs, "
                "die n8n nativ unterstuetzt. Der Fehlerfall ist vom Kunden bereits definiert, "
                "das Volumen ist klein, es gibt keine Sonderlogik. Das Risiko liegt fast nur "
                "beim OAuth-Zugang zum Google-Konto."
            ),
        },
        "demo_proposal": {
            "opening": (
                "Every new row in your lead sheet will trigger a personalised follow-up "
                "within a minute, and the sheet itself will show you exactly who was "
                "contacted and when."
            ),
            "understanding": (
                "The part that usually breaks these workflows is the invalid address, and "
                "you have already thought about it - so I will validate before sending and "
                "colour the row red rather than letting a bad address stop the run. I am "
                "assuming the service the lead selected is a column in the same sheet; if it "
                "sits in a second tab, that is a five-minute change, not a redesign."
            ),
            "solution_steps": [
                "Google Sheets trigger in your own n8n instance, watching the lead tab for new rows",
                "Validation step that checks the email address and routes invalid rows to a 'mark red' branch",
                "Message builder node that fills name, company and selected service into your text",
                "Gmail node that sends from your Workspace account using OAuth you control",
                "Write-back step that stamps the 'contacted' column, so the sheet stays your single source of truth",
                "Error branch that notifies you instead of failing silently",
            ],
            "deliverables": [
                "The live workflow running in your own n8n cloud account",
                "The email text isolated in one node so you can edit it without touching the logic",
                "A one-page handover showing where to change text, sender and timing",
            ],
            "timeline": "About 2-3 working days once I have access to the sheet and the Gmail account",
            "questions": [
                "Should the follow-up go out immediately, or wait a set delay after the row appears?"
            ],
            "closing": (
                "Happy to walk you through the workflow on a short call before you approve it."
            ),
        },
    },
    # ---------------------------------------------------------------- 2
    {
        "freelancer_id": "demo-1002",
        "title": "Shopify order automation: sync orders to Google Sheets and notify team in Slack",
        "description": (
            "Our Shopify store gets around 60 orders a day. We need every new paid order "
            "pushed into a Google Sheet with order number, customer name, email, product "
            "SKUs, quantity, total and shipping country. Orders above 200 EUR should also "
            "post a message into our #vip-orders Slack channel. Additionally, when an order "
            "is cancelled or refunded in Shopify, the corresponding row in the sheet has to "
            "be updated with the new status, not duplicated. We would prefer Make.com or "
            "n8n so our office manager can adjust things later. Shopify admin access can be "
            "provided. Please tell us how you would handle orders that come in while the "
            "automation is temporarily down."
        ),
        "url": "https://www.freelancer.com/projects/demo-1002",
        "posted_at": _minutes_ago(38),
        "budget_min": 750,
        "budget_max": 1000,
        "currency": "USD",
        "project_type": "fixed",
        "skills": ["Shopify", "Make.com", "Google Sheets", "Slack", "Automation"],
        "bid_count": 14,
        "bid_avg": 820.0,
        "employer_verified": True,
        "employer_country": "Netherlands",
        "matched_keyword": "Shopify automation",
        "demo_evaluation": {
            "technical_fit": 9,
            "difficulty": 4,
            "risk": 3,
            "clarity": 8,
            "reusability": 8,
            "estimated_hours_min": 8,
            "estimated_hours_max": 14,
            "estimated_tool_cost_usd": 0,
            "required_tools": ["Make.com", "Google Sheets", "Slack"],
            "required_apis": ["Shopify Admin API", "Google Sheets API", "Slack API"],
            "red_flags": ["Nachtraegliche Statusaenderungen erfordern sauberes Zeilen-Matching"],
            "short_summary": (
                "Shopify-Bestellungen laufen automatisch in ein Google Sheet, hochpreisige "
                "Bestellungen zusaetzlich nach Slack. Stornierungen aktualisieren die Zeile."
            ),
            "implementation_idea": (
                "Shopify-Webhooks fuer orders/paid, orders/cancelled und refunds/create auf ein "
                "Make.com-Szenario. Ein Router trennt Neuanlage von Aktualisierung. Die "
                "Bestellnummer dient als Schluessel fuer die Zeilensuche im Sheet, damit "
                "Statusaenderungen die bestehende Zeile treffen statt eine neue anzulegen. "
                "Ein Filter auf Bestellwert ueber 200 EUR loest die Slack-Nachricht aus. "
                "Gegen Ausfaelle laeuft zusaetzlich ein taeglicher Abgleich per Shopify-API."
            ),
            "reason_for_score": (
                "Gut dokumentierte Standard-APIs, die Make nativ anbindet. Der einzige echte "
                "Knackpunkt ist die Aktualisierung bestehender Zeilen statt Duplikaten -- das "
                "ist loesbar, kostet aber Testzeit. Der Kunde fragt selbst nach dem Ausfall-"
                "szenario, was fuer eine klare Zusammenarbeit spricht."
            ),
        },
        "demo_proposal": {
            "opening": (
                "You will have one sheet that always matches Shopify - including cancellations "
                "and refunds - and your team sees every order over 200 EUR in Slack as it lands."
            ),
            "understanding": (
                "The hard part here is not pushing orders in, it is making sure a cancellation "
                "updates the existing row instead of creating a second one. I will key every "
                "row on the Shopify order ID rather than the order number, because order "
                "numbers can repeat across sales channels. For your downtime question: "
                "webhooks alone will lose orders, so I will add a daily reconciliation run "
                "that pulls the last 48 hours from the Shopify API and fills any gaps."
            ),
            "solution_steps": [
                "Shopify webhooks for orders/paid, orders/cancelled and refunds/create into one Make.com scenario",
                "Router that separates new orders from status updates on existing rows",
                "Google Sheets step that matches on Shopify order ID and updates in place",
                "Value filter that posts orders above 200 EUR into #vip-orders via Slack",
                "Daily reconciliation run against the Shopify API to catch anything missed during downtime",
                "Error handler that alerts you rather than failing quietly",
            ],
            "deliverables": [
                "The scenario in your own Make.com account, documented step by step",
                "The reconciliation safety net as a separate, readable scenario",
                "A short handover so your office manager can change the 200 EUR threshold herself",
            ],
            "timeline": "About 4-6 working days, including a test run against real orders",
            "questions": [
                "Should partial refunds update the row status, or only full refunds?",
                "Do you want one sheet per year, or one continuous sheet?",
            ],
            "closing": "I can start as soon as I have Shopify admin and sheet access.",
        },
    },
    # ---------------------------------------------------------------- 3
    {
        "freelancer_id": "demo-1003",
        "title": "WordPress + OpenAI: auto-generate product descriptions and SEO meta from a CSV",
        "description": (
            "We run a WooCommerce shop on WordPress with about 300 products. We want to "
            "upload a CSV with product name, key attributes and category, and have an "
            "automation generate a German product description of roughly 120 words plus an "
            "SEO meta title and meta description for each product, then write them into "
            "WordPress via the REST API as drafts - never published automatically, we want "
            "to review first. Tone should follow three example texts we will provide. If "
            "the AI output is shorter than 80 words the item should be flagged for manual "
            "review instead of being written. We have an OpenAI account already. n8n or "
            "Make is fine, we do not have a preference."
        ),
        "url": "https://www.freelancer.com/projects/demo-1003",
        "posted_at": _minutes_ago(55),
        "budget_min": 500,
        "budget_max": 800,
        "currency": "USD",
        "project_type": "fixed",
        "skills": ["WordPress", "WooCommerce", "OpenAI", "n8n", "SEO"],
        "bid_count": 11,
        "bid_avg": 640.0,
        "employer_verified": True,
        "employer_country": "Austria",
        "matched_keyword": "WordPress automation",
        "demo_evaluation": {
            "technical_fit": 9,
            "difficulty": 4,
            "risk": 3,
            "clarity": 8,
            "reusability": 8,
            "estimated_hours_min": 6,
            "estimated_hours_max": 10,
            "estimated_tool_cost_usd": 15,
            "required_tools": ["n8n", "OpenAI API", "WordPress REST API"],
            "required_apis": ["OpenAI API", "WordPress REST API", "WooCommerce API"],
            "red_flags": ["Tonalitaet nach Beispieltexten erfordert eine Abstimmungsrunde"],
            "short_summary": (
                "CSV-Import erzeugt per OpenAI deutsche Produkttexte und SEO-Felder, die als "
                "Entwuerfe in WordPress landen. Nichts wird automatisch veroeffentlicht."
            ),
            "implementation_idea": (
                "n8n liest die CSV zeilenweise ein. Ein OpenAI-Node erzeugt aus Name, "
                "Attributen und Kategorie den Beschreibungstext, ein zweiter Aufruf Meta-Titel "
                "und Meta-Description. Die drei Beispieltexte liegen als Few-Shot-Beispiele im "
                "Prompt. Ein IF-Node prueft die Wortzahl und leitet zu kurze Ergebnisse in eine "
                "Pruefliste statt nach WordPress. Der WordPress-REST-Node legt die Texte als "
                "Draft an, Status 'publish' wird bewusst nie gesetzt."
            ),
            "reason_for_score": (
                "Ein einzelner, klar umrissener OpenAI-Aufruf pro Produkt plus zwei dokumentierte "
                "APIs -- genau das Muster, das mit n8n schnell steht. Die Kundin hat den "
                "Freigabeprozess und den Qualitaetsfilter selbst definiert, das senkt das Risiko "
                "deutlich. Offen bleibt nur die Abstimmung der Tonalitaet."
            ),
        },
        "demo_proposal": {
            "opening": (
                "You will be able to drop a CSV in and find 300 review-ready German product "
                "drafts in WordPress, each with its SEO title and meta description already set."
            ),
            "understanding": (
                "Nothing gets published - every item lands as a draft, and anything under 80 "
                "words goes onto a review list instead of into your shop. One thing worth "
                "settling early: your three example texts define the tone, so I will run a "
                "batch of five products first and adjust the prompt with you before processing "
                "all 300. That avoids regenerating everything after the fact."
            ),
            "solution_steps": [
                "n8n workflow reading your CSV row by row, so a failure never costs the whole batch",
                "OpenAI call for the 120-word German description, with your three examples as tone reference in the prompt",
                "Second, shorter call for SEO title and meta description within character limits",
                "Word-count gate that routes anything under 80 words to a review sheet instead of WordPress",
                "WordPress REST API step that creates each item as a draft, never as published",
            ],
            "deliverables": [
                "The workflow in your own n8n account, re-runnable for future product batches",
                "A review sheet listing every flagged item and why it was flagged",
                "The prompt in an editable node so you can adjust tone later yourself",
            ],
            "timeline": "About 3-4 working days, plus one tuning round after the five-product sample",
            "questions": [
                "Should existing products with a description be skipped, or overwritten as new drafts?"
            ],
            "closing": "Send the three example texts and I can show you sample output before you commit.",
        },
    },
    # ---------------------------------------------------------------- 4
    {
        "freelancer_id": "demo-2001",
        "title": "Build a complete multi-tenant SaaS platform with subscriptions and admin panel",
        "description": (
            "We are looking for a developer to build our SaaS product from scratch. It needs "
            "multi-tenant architecture with organisation and user management, role-based "
            "permissions, a subscription billing system with Stripe including trials, "
            "proration and dunning, a customer-facing dashboard with analytics, an internal "
            "admin panel, a public REST API with API key management and rate limiting, "
            "webhooks for our customers, email notifications, audit logging, and a white-label "
            "mode where customers can use their own domain and branding. Frontend should be "
            "React. We are flexible on the backend. We will need ongoing support and new "
            "features after launch. Long-term collaboration with the right person, and more "
            "modules to follow."
        ),
        "url": "https://www.freelancer.com/projects/demo-2001",
        "posted_at": _minutes_ago(90),
        "budget_min": 3000,
        "budget_max": 5000,
        "currency": "USD",
        "project_type": "fixed",
        "skills": ["React", "Node.js", "PostgreSQL", "Stripe", "SaaS"],
        "bid_count": 48,
        "bid_avg": 4100.0,
        "employer_verified": True,
        "employer_country": "United States",
        "matched_keyword": "API integration",
        "demo_evaluation": {
            "technical_fit": 3,
            "difficulty": 9,
            "risk": 8,
            "clarity": 4,
            "reusability": 3,
            "estimated_hours_min": 250,
            "estimated_hours_max": 400,
            "estimated_tool_cost_usd": 200,
            "required_tools": ["React", "Node.js", "PostgreSQL", "Stripe"],
            "required_apis": ["Stripe API"],
            "red_flags": [
                "Komplette Individualsoftware, kein Automatisierungsprojekt",
                "Budget deckt einen Bruchteil des realen Aufwands",
                "'more modules to follow' und 'ongoing support' deuten auf Scope Creep",
                "White-Label mit eigenen Domains ist ein Projekt fuer sich",
            ],
            "short_summary": (
                "Vollstaendige SaaS-Plattform inklusive Mandantenfaehigkeit, Abrechnung, "
                "Admin-Bereich, oeffentlicher API und White-Label-Modus."
            ),
            "implementation_idea": (
                "Nicht mit Low-Code loesbar. Erforderlich waeren ein individuelles Backend mit "
                "Mandantentrennung, eine vollstaendige Stripe-Abrechnungslogik mit Proration und "
                "Mahnwesen, ein React-Frontend, ein Rechte- und Rollensystem sowie Betrieb und "
                "Wartung. Das ist Teamarbeit ueber mehrere Monate."
            ),
            "reason_for_score": (
                "Das ist klassische Individualentwicklung und liegt ausserhalb des "
                "Automatisierungsprofils. Der geschaetzte Aufwand von 250 bis 400 Stunden steht "
                "einem Budget von 3.000 bis 5.000 USD gegenueber -- rechnerisch etwa 12 USD pro "
                "Stunde. Zusaetzlich ist der Umfang unscharf und auf Erweiterung angelegt."
            ),
        },
    },
    # ---------------------------------------------------------------- 5
    {
        "freelancer_id": "demo-2002",
        "title": "Senior backend engineer for event-driven microservices platform (Kafka, PCI-DSS)",
        "description": (
            "We need an experienced backend engineer to extend our payment processing "
            "platform. The system runs as event-driven microservices communicating over "
            "Kafka. Tasks include designing new event schemas with backward compatibility, "
            "implementing idempotent consumers with exactly-once semantics, building a "
            "reconciliation service against our card acquirer, hardening our PCI-DSS scope, "
            "implementing HSM-backed key rotation, writing load tests for 5000 transactions "
            "per second, and taking part in the on-call rotation. Must have production "
            "experience with distributed transactions and financial reconciliation. Security "
            "audit is scheduled for next quarter and the work has to pass it."
        ),
        "url": "https://www.freelancer.com/projects/demo-2002",
        "posted_at": _minutes_ago(120),
        "budget_min": 2000,
        "budget_max": 4000,
        "currency": "USD",
        "project_type": "fixed",
        "skills": ["Kafka", "Microservices", "Go", "PCI-DSS", "Distributed Systems"],
        "bid_count": 22,
        "bid_avg": 3300.0,
        "employer_verified": True,
        "employer_country": "United Kingdom",
        "matched_keyword": "API integration",
        "demo_evaluation": {
            "technical_fit": 2,
            "difficulty": 9,
            "risk": 9,
            "clarity": 6,
            "reusability": 2,
            "estimated_hours_min": 120,
            "estimated_hours_max": 200,
            "estimated_tool_cost_usd": 0,
            "required_tools": ["Kafka", "Go", "HSM"],
            "required_apis": ["Card acquirer API"],
            "red_flags": [
                "Sicherheitskritisches Zahlungssystem mit externem Audit",
                "On-Call-Bereitschaft gefordert",
                "Exactly-once-Semantik in verteilten Systemen ist Spezialistenarbeit",
                "Haftungsrisiko bei PCI-DSS-Verstoessen",
            ],
            "short_summary": (
                "Erweiterung einer Zahlungsplattform aus Kafka-Microservices inklusive "
                "PCI-DSS-Haertung, Schluesselrotation und Bereitschaftsdienst."
            ),
            "implementation_idea": (
                "Keine Automatisierungsaufgabe. Gefordert ist Spezialwissen in verteilten "
                "Systemen, Zahlungsverkehr und Sicherheitszertifizierung. Weder n8n noch Make "
                "noch ein LLM-Aufruf spielen hier eine Rolle."
            ),
            "reason_for_score": (
                "Sicherheitskritische Backend-Entwicklung mit externem Audit und "
                "Bereitschaftsdienst -- das genaue Gegenteil des gesuchten Profils. Selbst bei "
                "passendem Budget waere das Haftungs- und Fehlerrisiko nicht tragbar."
            ),
        },
    },
]


def demo_evaluation_for(freelancer_id: str) -> dict[str, Any] | None:
    for project in DEMO_PROJECTS:
        if project["freelancer_id"] == freelancer_id:
            return project.get("demo_evaluation")
    return None


def demo_proposal_for(freelancer_id: str) -> dict[str, Any] | None:
    for project in DEMO_PROJECTS:
        if project["freelancer_id"] == freelancer_id:
            return project.get("demo_proposal")
    return None
