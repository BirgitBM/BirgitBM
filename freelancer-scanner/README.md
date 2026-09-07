# Freelancer Scanner

Findet neue Automatisierungsprojekte auf Freelancer.com, bewertet sie mit KI und
meldet nur die, die sich für dich wirklich lohnen.

**Was das Programm ausdrücklich nicht tut:** Es bewirbt sich nicht automatisch,
es schreibt keine Kunden an und es nimmt keine Aufträge an. Es findet, bewertet
und bereitet einen Entwurf vor. Jede Entscheidung triffst du.

---

## Inhalt

1. [In 3 Minuten ausprobieren](#1-in-3-minuten-ausprobieren)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Installation](#3-installation)
4. [Freelancer-API-Zugang einrichten](#4-freelancer-api-zugang-einrichten)
5. [Claude- oder OpenAI-Schlüssel eintragen](#5-claude--oder-openai-schlüssel-eintragen)
6. [Telegram-Bot erstellen](#6-telegram-bot-erstellen)
7. [Umgebungsvariablen setzen](#7-umgebungsvariablen-setzen)
8. [Datenbank](#8-datenbank)
9. [Programm starten](#9-programm-starten)
10. [Test durchführen](#10-test-durchführen)
11. [Scanner im Echtbetrieb starten](#11-scanner-im-echtbetrieb-starten)
12. [Bewertung anpassen](#12-bewertung-anpassen)
13. [Was kostet der Betrieb](#13-was-kostet-der-betrieb)
14. [Wenn etwas nicht funktioniert](#14-wenn-etwas-nicht-funktioniert)
15. [Aufbau des Projekts](#15-aufbau-des-projekts)

---

## 1. In 3 Minuten ausprobieren

Du brauchst dafür **keinen einzigen Zugang** – keine Freelancer-API, keinen
KI-Schlüssel, kein Telegram. Der Demo-Modus arbeitet mit fünf Beispielprojekten.

```bash
cd freelancer-scanner
python3 -m venv .venv
source .venv/bin/activate          # unter Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run_scan.py
uvicorn app.main:app
```

Dann im Browser öffnen: **http://127.0.0.1:8000**

Beenden mit `Strg + C` im Terminal.

---

## 2. Voraussetzungen

| Was | Warum | Woher |
| --- | --- | --- |
| Python 3.11 oder neuer | Das Programm ist in Python geschrieben | https://www.python.org/downloads/ |
| Ein Terminal | Zum Starten des Programms | Mac: „Terminal". Windows: „PowerShell" |
| Ein Browser | Für das Dashboard | hast du schon |

Prüfen, ob Python installiert ist:

```bash
python3 --version
```

Erscheint eine Zahl ab `3.11`, ist alles in Ordnung.

Für den Echtbetrieb kommen später dazu: ein Freelancer-Konto, ein Claude- oder
OpenAI-Konto und ein Telegram-Konto. Für den Demo-Modus brauchst du nichts davon.

---

## 3. Installation

**Schritt 1 – In den Projektordner wechseln**

```bash
cd freelancer-scanner
```

**Schritt 2 – Eine abgeschottete Python-Umgebung anlegen**

Das ist ein eigener Ordner nur für dieses Projekt, damit nichts an deinem
System durcheinandergerät. Einmalig:

```bash
python3 -m venv .venv
```

**Schritt 3 – Die Umgebung aktivieren**

Das musst du bei **jedem neuen Terminalfenster** wiederholen:

```bash
source .venv/bin/activate          # Mac und Linux
.venv\Scripts\activate             # Windows
```

Du erkennst es daran, dass am Zeilenanfang `(.venv)` steht.

**Schritt 4 – Die benötigten Pakete installieren**

Einmalig:

```bash
pip install -r requirements.txt
```

**Schritt 5 – Die Konfigurationsdatei anlegen**

```bash
cp .env.example .env               # Mac und Linux
copy .env.example .env             # Windows
```

Die Datei `.env` enthält später deine Zugangsdaten. Sie wird **nie** ins
Repository hochgeladen – dafür sorgt die Datei `.gitignore`.

Fertig. Der Demo-Modus läuft ab jetzt.

---

## 4. Freelancer-API-Zugang einrichten

> Nur nötig, wenn du echte Projekte statt der Beispiele sehen willst.

Freelancer.com bietet eine offizielle Schnittstelle an. Das Programm nutzt
ausschließlich diese – es liest keine Webseiten aus.

**Wichtig:** Die Entwicklereinstellungen liegen auf `accounts.freelancer.com` –
das ist eine **andere Adresse** als deine normalen Kontoeinstellungen, und sie
ist von dort nicht verlinkt. Deshalb findet man sie nicht durch Suchen.

1. Melde dich normal bei Freelancer.com an.
2. Rufe direkt diese Adresse auf:
   **https://accounts.freelancer.com/settings/develop**
3. Dort findest du den Bereich für den Access-Token. Falls zuerst eine
   Anwendung angelegt werden muss, geht das über
   `https://accounts.freelancer.com/settings/create_app`.
4. Kopiere den Token in die Datei `.env`:

```
FREELANCER_OAUTH_TOKEN=dein_token_hier
```

**Den Zugang testen, bevor du weitermachst:**

```bash
python check_freelancer.py
```

Das Skript stellt genau eine Suchanfrage und sagt dir im Klartext, ob der
Token funktioniert – oder woran es liegt. Es speichert nichts, bewirbt sich
nirgends und gibt den Token nie aus.

> **Sicherheit:** Gib den Token niemals weiter, auch nicht in einem Chat. Wer
> ihn hat, kann in deinem Namen auf dein Freelancer-Konto zugreifen. Er gehört
> ausschließlich in die Datei `.env` auf deinem Rechner.
>
> Der Token läuft irgendwann ab. Wenn `check_freelancer.py` oder das Log
> `HTTP 401` meldet, hole dir auf derselben Seite einen neuen.
>
> Solange der Zugang nicht steht, funktioniert alles Übrige im Demo-Modus
> weiter – Dashboard, Bewertung und Entwürfe kannst du vollständig testen.

---

## 5. Claude- oder OpenAI-Schlüssel eintragen

> Nur nötig für die echte KI-Bewertung.

Du brauchst **genau einen** der beiden. Claude ist voreingestellt.

**Variante A – Claude (Anthropic)**

1. Konto anlegen auf **https://console.anthropic.com**
2. Guthaben aufladen (der Einstieg ist ab wenigen Euro möglich)
3. Links auf **API Keys** → **Create Key** → den Schlüssel kopieren
4. In die Datei `.env` eintragen:

```
LLM_PROVIDER=anthropic
LLM_MODEL=claude-opus-5
ANTHROPIC_API_KEY=sk-ant-...
```

Zusätzlich das Paket installieren:

```bash
pip install anthropic
```

**Variante B – OpenAI**

1. Konto anlegen auf **https://platform.openai.com**
2. Guthaben aufladen
3. **API Keys** → **Create new secret key** → kopieren
4. In die Datei `.env` eintragen:

```
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-...
```

Zusätzlich:

```bash
pip install openai
```

Umschalten zwischen beiden geht später jederzeit, indem du nur die Zeile
`LLM_PROVIDER` änderst. Am Code muss nichts angefasst werden.

**Wichtig:** Der Schlüssel gehört ausschließlich in die Datei `.env`. Schreibe
ihn niemals in eine andere Datei und schicke ihn niemandem.

---

## 6. Telegram-Bot erstellen

> Nur nötig, wenn du Meldungen aufs Handy bekommen willst.
> Ohne Telegram erscheinen die Meldungen einfach im Terminal.

**Schritt 1 – Den Bot anlegen**

1. Öffne Telegram und suche nach dem Kontakt **@BotFather**
2. Schreibe ihm: `/newbot`
3. Er fragt nach einem Namen (frei wählbar, z. B. „Mein Job Scanner")
4. Dann nach einem Benutzernamen. Der muss auf `bot` enden, z. B.
   `birgit_job_scanner_bot`
5. Du bekommst einen Token. Er besteht aus einer Zahlenfolge, einem
   Doppelpunkt und einer langen Buchstaben-Zahlen-Kombination.
6. Diesen Token in die `.env` eintragen:

```
TELEGRAM_BOT_TOKEN=<hier deinen Token vom BotFather einsetzen>
```

**Schritt 2 – Deine Chat-ID herausfinden**

Der Bot darf dir nur schreiben, wenn du ihn zuerst angeschrieben hast.

1. Suche in Telegram nach deinem neuen Bot (dem Benutzernamen von oben)
2. Drücke **Start** und schreibe ihm irgendetwas, z. B. „hallo"
3. Öffne im Browser diese Adresse und ersetze `<TOKEN>` durch deinen Token:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

4. In der Antwort steht irgendwo `"chat":{"id":123456789`. Diese Zahl ist deine
   Chat-ID.
5. In die `.env` eintragen:

```
TELEGRAM_CHAT_ID=123456789
```

---

## 7. Umgebungsvariablen setzen

Alle Einstellungen stehen in der Datei `.env`. Öffne sie mit einem beliebigen
Texteditor. Die wichtigsten Zeilen:

| Zeile | Bedeutung |
| --- | --- |
| `DEMO_MODE=true` | Beispieldaten, keine Kosten. Auf `false` setzen für den Echtbetrieb. |
| `LLM_PROVIDER=anthropic` | Welche KI: `anthropic`, `openai` oder `demo` |
| `LLM_MODEL=claude-opus-5` | Welches Modell (siehe Kostenabschnitt) |
| `SCAN_INTERVAL_MINUTES=5` | Wie oft gesucht wird |
| `SCANNER_ENABLED=true` | `false` = nur der Button im Dashboard, kein Automatiklauf |
| `FREELANCER_MAX_AGE_HOURS=24` | Wie alt ein Projekt höchstens sein darf |

Nach jeder Änderung an `.env` muss das Programm neu gestartet werden.

---

## 8. Datenbank

Du musst **nichts installieren und nichts starten**. Die Datenbank ist eine
einzelne Datei unter `data/projects.db` und wird beim ersten Start automatisch
angelegt.

Willst du von vorn beginnen, lösche einfach diese Datei. Beim nächsten Start
entsteht eine neue, leere.

**Später auf Supabase oder PostgreSQL wechseln:** Dafür genügt es, in der `.env`
eine einzige Zeile zu ersetzen:

```
DATABASE_URL=postgresql+psycopg://benutzer:passwort@host:5432/datenbank
```

Zusätzlich `pip install "psycopg[binary]"`. Am Code ändert sich nichts – alle
Datenbankzugriffe laufen über eine einzige Schicht (`app/database/repository.py`).

---

## 9. Programm starten

**Das Dashboard mit automatischem Scanner:**

```bash
source .venv/bin/activate          # falls noch nicht aktiv
uvicorn app.main:app
```

Dann öffnen: **http://127.0.0.1:8000**

Beenden mit `Strg + C`.

**Nur ein einzelner Durchlauf, ohne Dashboard:**

```bash
python run_scan.py
```

Das ist praktisch zum Ausprobieren und für die Fehlersuche, weil du dabei alle
Meldungen direkt im Terminal siehst.

---

## 10. Test durchführen

```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

Erwartet: **91 Tests, alle grün**. Die Tests laufen immer im Demo-Modus und
kosten kein Geld – sie greifen auf keine externe Schnittstelle zu.

Geprüft wird unter anderem:

- rechnet die Bewertung korrekt und bleibt sie konservativ
- greift der Vorfilter bei ausgeschlossenen Technologien
- werden ungültige KI-Antworten abgefangen und wiederholt
- fließt der Automatisierungshebel mit dem richtigen Gewicht ein
- verändert der Frische-Bonus die Qualitätsbewertung nicht
- greift die ARBITRAGE-Kennzeichnung nur bei allen fünf Bedingungen
- wird kein Projekt doppelt gespeichert
- laufen die fünf Beispielprojekte vollständig durch
- gibt es wirklich keinen Endpunkt, der sich automatisch bewirbt

---

## 11. Scanner im Echtbetrieb starten

Wenn Freelancer-Token, KI-Schlüssel und Telegram eingetragen sind:

1. In der Datei `.env` setzen: `DEMO_MODE=false`
2. Programm starten: `uvicorn app.main:app`

Ab jetzt sucht das Programm alle 5 Minuten nach neuen Projekten und meldet dir
alles ab Score 75 per Telegram.

**Empfehlung für den Anfang:** Fang mit `SCANNER_ENABLED=false` an und nutze
einige Tage lang nur den Button „Jetzt scannen" im Dashboard. So siehst du in
Ruhe, was der Scanner findet und wie er bewertet, bevor er im Hintergrund
dauerhaft Geld ausgibt.

**Auf einem Server dauerhaft laufen lassen:** Ein kleiner Server für etwa 4 EUR
im Monat genügt. Der Startbefehl dort lautet:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Sichere das Dashboard in diesem Fall unbedingt ab (z. B. mit einem Passwort über
einen vorgeschalteten Webserver) – es enthält deine Auftragsdaten.

---

## 12. Bewertung anpassen

Alle drei Dateien im Ordner `config/` kannst du mit einem Texteditor ändern.
Programmierkenntnisse sind dafür nicht nötig. Nach jeder Änderung neu starten.

**`config/keywords.yaml`** – wonach gesucht wird.
Neue Begriffe einfach als neue Zeile mit `- ` davor anhängen.

**`config/exclude.yaml`** – was sofort aussortiert wird.
Aktuell u. a. Salesforce, SAP, Kubernetes, Blockchain, Flutter. Ein Treffer
bedeutet: kein KI-Aufruf, keine Kosten.

**`config/scoring.yaml`** – wie bewertet wird. Die wichtigsten Stellschrauben:

| Wert | Wirkung |
| --- | --- |
| `min_score: 75` | Ab wann **gemeldet** wird (geprüft am Chance-Wert). |
| `apply_score: 82` | Ab wann **automatisch ein Entwurf** entsteht (am Score). |
| `target_hourly_rate_usd: 60` | Dein Ziel-Stundensatz. Höher = wählerischer. |
| `weights` | Die sieben Gewichte. Müssen zusammen 1.0 ergeben. |
| `caps` | Die Risiko-Bremse. Niedrigere Werte = vorsichtiger. |
| `freshness` | Bonus für frische Projekte mit wenigen Geboten. |
| `arbitrage` | Wann ein Projekt als besonders lohnend markiert wird. |
| `prefilter` | Was gar nicht erst bewertet wird. |

### Zwei Zahlen, zwei Zwecke

| | Bedeutung | Wofür |
| --- | --- | --- |
| **Score** | Reine Qualität des Auftrags. Ändert sich nie wieder. | Entwurf, ARBITRAGE, spätere Auswertungen |
| **Chance** | Score plus Bonus für frische Projekte mit wenigen Geboten. | Reihenfolge im Dashboard, Telegram-Meldung |

Der Frische-Bonus steckt bewusst **nicht** im Score. Sonst würde derselbe
Auftrag heute anders bewertet als morgen – und du könntest später nicht mehr
auswerten, welche Auftragsarten sich wirklich rechnen.

### Die sieben Kriterien

| Kriterium | Gewicht | Was es misst |
| --- | --- | --- |
| Technische Eignung | 22 % | Passt der Auftrag zu n8n / Make / Zapier / APIs? |
| **Automatisierungshebel** | 18 % | Wie viel Handarbeit nehmen dir KI und Low-Code wirklich ab? |
| Budget / Aufwand | 18 % | Was gibt das Budget pro Stunde her? |
| Geringes Risiko | 15 % | Wie wahrscheinlich sind böse Überraschungen? |
| Klarheit | 13 % | Wie präzise ist die Aufgabe beschrieben? |
| Wiederverwendbarkeit | 9 % | Kannst du das später wieder verkaufen? |
| Wenig Sonderprogrammierung | 5 % | Wie viel Spezialcode ist nötig? |

**Technische Eignung und Automatisierungshebel sind nicht dasselbe.** Ein
Auftrag kann perfekt zu n8n passen und trotzdem überwiegend Handarbeit sein –
etwa wenn 400 Produktfelder einzeln zugeordnet werden müssen. Genau das misst
der Hebel: was nach getaner Werkzeugarbeit an Handarbeit übrig bleibt.

### ARBITRAGE

Die Kennzeichnung für die Aufträge, bei denen sich dein Geschäftsmodell wirklich
rechnet. **Alle fünf** Bedingungen müssen erfüllt sein:

| Bedingung | Standardwert |
| --- | --- |
| Score | ≥ 80 |
| Automatisierungshebel | ≥ 8 |
| Risiko | ≤ 4 |
| Dein Stundensatz | ≥ 60 USD |
| Ausgeschlossene Technologie | keine |

ARBITRAGE-Projekte stehen im Dashboard ganz oben und bekommen immer einen
Bewerbungsentwurf – auch wenn ihr Score unter `apply_score` liegt.

Auf der Detailseite steht bei jedem Projekt, **welche** Bedingung gefehlt hat.
So siehst du, ob deine Schwellen zu streng eingestellt sind.

### Die beiden Stundensätze

| Feld | Bedeutung |
| --- | --- |
| `effective_hourly_rate_usd` | Was **du** verdienst, wenn die obere Aufwandsschätzung eintritt. |
| `budget_hourly_rate_usd` | Was das **Kundenbudget** pro Stunde hergeben würde. |

Der erste Wert ist bei `target_hourly_rate_usd` gedeckelt, weil das empfohlene
Gebot nie über deinen Zielsatz hinausgeht – hohe Gebote gewinnt man auf
Freelancer.com selten. Für die Frage „welche Aufträge waren am profitabelsten"
schaust du deshalb auf **beide** Werte: der zweite zeigt, wie viel Luft im
Budget gewesen wäre.

### Wie die Risiko-Bremse funktioniert

Das ist der Kern der konservativen Auslegung: **Ein gutes Budget kann ein
riskantes Projekt nicht hochziehen.**

Zwei Mechanismen sorgen dafür:

1. Die Budget-Komponente wiegt nur 20 % und ist bei 100 % gedeckelt. Ein Projekt
   kann durch Geld also um höchstens 20 Punkte steigen – egal wie hoch das
   Budget ist.
2. Zusätzlich greifen harte Deckel: Bei einem Risiko ab 7 wird der Score auf 55
   begrenzt, ab 9 auf 40. Unklare Beschreibungen und hohe Schwierigkeit deckeln
   auf 50.

Beispiel aus den Tests: Ein Projekt mit hohem Risiko käme rechnerisch auf 63
Punkte. Der Deckel senkt es auf 50 – und selbst mit dem Hundertfachen des
Budgets bleibt es dort.

Wenn dir der Scanner zu streng ist, erhöhe die `max_score`-Werte unter `caps`.
Wenn er zu großzügig ist, senke sie.

---

## 13. Was kostet der Betrieb

Im Demo-Modus: **nichts.**

Im Echtbetrieb kostet nur die KI-Bewertung Geld. Freelancer-API und Telegram
sind kostenlos.

Zwei Dinge halten die Kosten niedrig:

- Der **Vorfilter** sortiert ausgeschlossene Technologien, zu kleine Budgets und
  unbrauchbare Beschreibungen aus, **bevor** die KI überhaupt gefragt wird.
  Erfahrungsgemäß fallen so 60–70 % der Projekte kostenlos weg.
- Der **Bewerbungsentwurf** wird nur ab `apply_score` (Standard 82) oder bei
  ARBITRAGE erzeugt – also deutlich seltener als gemeldet wird. Für alle anderen
  kannst du ihn bei Bedarf per Button nachträglich erstellen.

Kosten pro tausend bewerteter Projekte, grob gerechnet (die Preise gelten je
eine Million Token):

| Modell | Eingabe | Ausgabe | Größenordnung pro 1.000 Bewertungen |
| --- | --- | --- | --- |
| `claude-opus-5` | 5 USD | 25 USD | am teuersten, beste Einschätzung |
| `claude-sonnet-5` | 2 USD | 10 USD | etwa 40 % davon |
| `claude-haiku-4-5` | 1 USD | 5 USD | etwa 20 % davon |
| `gpt-4o-mini` | – | – | die günstigste Variante |

**Meine Empfehlung:** Fang mit `claude-opus-5` an, damit du siehst, wie gut die
Bewertung sein kann. Wechsle dann testweise auf `claude-sonnet-5` und vergleiche
an denselben Projekten, ob die Einstufung für dich noch stimmt. Falls ja, sparst
du dauerhaft rund 60 %. Dafür genügt es, in der `.env` die Zeile `LLM_MODEL` zu
ändern.

Behalte dein Guthaben in den ersten Tagen im Blick. Setze bei deinem Anbieter
ein Ausgabenlimit, bevor der Scanner dauerhaft im Hintergrund läuft.

---

## 14. Wenn etwas nicht funktioniert

| Meldung im Terminal | Ursache | Lösung |
| --- | --- | --- |
| `command not found: python3` | Python fehlt | Python installieren (Abschnitt 2) |
| `No module named 'fastapi'` | Umgebung nicht aktiv | `source .venv/bin/activate` |
| `No module named 'anthropic'` | Paket fehlt | `pip install anthropic` |
| `ANTHROPIC_API_KEY fehlt` | Schlüssel nicht eingetragen | `.env` prüfen |
| `FREELANCER_OAUTH_TOKEN fehlt` | Token nicht eingetragen | `.env` prüfen oder `DEMO_MODE=true` |
| `HTTP 401` bei Freelancer | Token abgelaufen oder unvollständig kopiert | `python check_freelancer.py` ausführen, dann neuen Token auf accounts.freelancer.com/settings/develop holen |
| `HTTP 403` bei Freelancer | Token gültig, aber Berechtigung fehlt | Ausgabe von `check_freelancer.py` prüfen – dort steht die Meldung von Freelancer |
| `Address already in use` | Port 8000 belegt | `uvicorn app.main:app --port 8001` |
| Telegram meldet nichts | Bot nie angeschrieben | Bot in Telegram öffnen und „Start" drücken |
| Keine Projekte gefunden | Alles schon bekannt oder nichts Neues da | Normal. Log prüfen: wie viele wurden vorgefiltert? |
| `Die Gewichte ergeben ... statt 1.0` | Tippfehler in `scoring.yaml` | Die sieben Werte unter `weights` müssen zusammen 1.0 ergeben |
| `apply_score darf nicht unter min_score liegen` | Schwellen vertauscht | In `scoring.yaml`: `apply_score` muss ≥ `min_score` sein |
| Nie ein ARBITRAGE-Projekt | Schwellen zu streng | Detailseite zeigt „Warum kein ARBITRAGE". Passenden Wert in `scoring.yaml` senken |

Bei allen anderen Problemen hilft ein Blick ins Log. Setze in der `.env`:

```
LOG_LEVEL=DEBUG
```

Dann zeigt das Programm bei jedem Schritt, was es gerade tut.

---

## 15. Aufbau des Projekts

```
freelancer-scanner/
├── app/
│   ├── main.py              Startet Webserver und Scanner
│   ├── config.py            Liest .env und config/*.yaml
│   ├── api/                 Dashboard-Seiten und Buttons
│   ├── models/              Datenbanktabelle und KI-Schema
│   ├── database/            Datenbankzugriff (Umstiegspunkt Supabase)
│   ├── freelancer/          Anbindung an Freelancer + Demo-Daten
│   ├── llm/                 Claude / OpenAI / Demo + die Prompts
│   ├── scoring/             Vorfilter und Bewertungsrechnung
│   ├── notifications/       Telegram und Terminal
│   ├── services/scanner.py  Der eigentliche Ablauf
│   └── templates/           Die HTML-Seiten
├── config/                  Deine Einstellungen (ohne Programmieren änderbar)
├── data/projects.db         Die Datenbank (wird automatisch angelegt)
├── tests/                   91 automatische Tests
├── .env                     Deine Zugangsdaten (nie hochladen!)
├── .env.example             Vorlage dafür
├── requirements.txt         Die benötigten Pakete
├── run_scan.py              Einzelner Durchlauf ohne Dashboard
└── check_freelancer.py      Prüft den Freelancer-Zugang im Klartext
```

### Der Ablauf in einem Durchgang

```
alle 5 Minuten
   ↓
Freelancer-API pro Suchbegriff abfragen
   ↓
Ist die Projekt-ID schon in der Datenbank?  →  ja: verwerfen
   ↓ nein
Vorfilter (kostenlos, ohne KI)
   Ausschlussliste · Budget · Beschreibungslänge · Gebotszahl
   ↓ bestanden
KI-Bewertung (ein Aufruf, JSON, serverseitig geprüft)
   bei ungültiger Antwort: Retry mit Fehlerhinweis
   ↓
Scoring-Engine in Python
   Gewichtung + Risiko-Bremse
   ↓
in die Datenbank speichern
   ↓
Chance ≥ 75?  →  Telegram-Meldung
Score ≥ 82 oder ARBITRAGE?  →  zweiter LLM-Aufruf: Bewerbungsentwurf
   ↓
Dashboard (ARBITRAGE oben, dann nach Chance sortiert)
```

### Technische Entscheidungen und ihre Begründung

| Entscheidung | Warum |
| --- | --- |
| Python + FastAPI statt Node | Ein Prozess für Webserver und Scanner, kein zweites Programm nötig |
| Jinja2-Templates statt React | Kein Build-Schritt, kein npm, funktioniert ohne JavaScript |
| SQLite statt Datenbankserver | Eine Datei, keine Installation. Umstieg auf Postgres = eine Zeile |
| Score wird in Python gerechnet | Nachvollziehbar und testbar. Anpassen ohne Prompt-Änderung |
| Vorfilter vor dem KI-Aufruf | Spart 60–70 % der KI-Kosten |
| Entwurf erst ab Mindestscore | Ein Entwurf für einen Job mit Score 34 ist verschwendetes Geld |
| Budget-Komponente gedeckelt | Ein gutes Budget darf ein riskantes Projekt nicht attraktiv machen |
| Gebot auf Höchstaufwand kalkuliert | Du erreichst deinen Zielsatz auch im pessimistischen Fall |
| Frische getrennt vom Score | Der Score bleibt stabil und damit später auswertbar |
| Melden und Entwerfen getrennt | Melden kostet nichts, ein Entwurf kostet einen LLM-Aufruf |
| Kein Scraping | Nur die offizielle Schnittstelle wird genutzt |
| Keine Automatik-Bewerbung | Bewusst nicht vorgesehen. Ein Test prüft, dass es sie auch nicht gibt |

---

## Sicherheit

- Zugangsdaten stehen ausschließlich in `.env`. Diese Datei ist über
  `.gitignore` vom Repository ausgeschlossen.
- Im Quellcode steht kein einziger Schlüssel.
- Alle KI-Antworten werden serverseitig gegen ein festes Schema geprüft, bevor
  sie gespeichert werden.
- Es existiert kein Endpunkt, der eine Bewerbung versendet oder einen Auftrag
  annimmt.
