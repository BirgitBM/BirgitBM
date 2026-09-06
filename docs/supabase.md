# Nächste Ausbaustufe: Supabase anbinden

Version 1 läuft bewusst ohne Datenbank. Die Struktur ist aber schon so gebaut,
dass der Umstieg kein Neubau wird, sondern ein Austausch von zwei Dateien.

## Warum das ohne Umbau funktioniert

Die gesamte Oberfläche spricht ausschließlich mit der Schnittstelle
`ContentRepository` (`src/lib/data/repository.ts`). Dahinter liegt aktuell
`MockRepository` (Beispieldaten + Browser-Speicher). Für Supabase kommt eine
zweite Umsetzung `SupabaseRepository` mit denselben Methoden dazu – die Seiten
und Komponenten bleiben unverändert.

```
Seiten  →  useStore()  →  ContentRepository  →  MockRepository (heute)
                                             →  SupabaseRepository (später)
```

## Vorgeschlagene Tabellen

Die Felder entsprechen 1:1 den Typen in `src/lib/types.ts`.

| Tabelle | Wichtige Spalten |
| --- | --- |
| `brands` | `id`, `slug`, `name`, `organisation`, `accent_color`, `active` |
| `profiles` | `id` (= `auth.users.id`), `name`, `email`, `role` |
| `brand_members` | `brand_id`, `user_id` – wer sieht welche Marke |
| `content_items` | `id`, `brand_id`, `format`, `audience`, `goal`, `thema`, `produkt`, `hook`, `broll_ids`, `overlays` (jsonb), `caption`, `cta`, `status`, `visibility`, `geplant_fuer`, `created_by`, `created_at`, `updated_at` |
| `broll_clips` | `id`, `brand_id`, `code`, `titel`, `beschreibung`, `tags`, `produkt`, `kategorie`, `video_url`, `dauer_sekunden` |
| `plan_entries` | `id`, `brand_id`, `kalenderwoche`, `tag`, `content_id`, `thema`, `goal`, `status`, `broll_ids`, `uhrzeit` |
| `watched_accounts` | `id`, `handle`, `beschreibung`, `kategorie`, `follower`, `letzte_analyse` |
| `saved_hooks` | `id`, `brand_id`, `text`, `quelle`, `gespeichert_am` |
| `brand_knowledge` | `brand_id`, `zielgruppe`, `tonalitaet`, `produkte` (jsonb), `kernbotschaften`, `woerter_vermeiden`, `standard_ctas`, `notizen` |

## Rechte (Row Level Security)

Die Regel aus `src/lib/auth.ts` (`darfInhaltSehen`) wird zusätzlich in der
Datenbank hinterlegt. Wichtig: Die Prüfung im Frontend ist Komfort, die
Prüfung in der Datenbank ist die eigentliche Sicherheit.

```sql
-- Kundinnen sehen ausschließlich freigegebene, für Kunden markierte Inhalte
create policy "kunden_sehen_freigegebenes"
on content_items for select
using (
  exists (
    select 1 from brand_members bm
    where bm.brand_id = content_items.brand_id
      and bm.user_id = auth.uid()
  )
  and (
    (select role from profiles where id = auth.uid()) = 'admin'
    or (
      content_items.visibility = 'kunde'
      and content_items.status in ('freigegeben', 'produziert', 'veroeffentlicht')
    )
  )
);
```

## Videos und Downloads

Für „Video herunterladen" und „Story herunterladen" wird Supabase Storage
genutzt. Die Dateien liegen in einem privaten Bucket; die App erzeugt beim
Klick eine zeitlich begrenzte Download-Adresse. Nur Premium-Kunden erhalten
diese Adresse – die Rechte dafür stehen bereits in `ROLLEN_RECHTE`.

## Reihenfolge der Umsetzung

1. Supabase-Projekt anlegen, Tabellen und Rechte einrichten
2. Beispieldaten einmalig importieren
3. `SupabaseRepository` schreiben und in `src/lib/store.tsx` austauschen
4. Anmeldung ergänzen (`AKTUELLER_BENUTZER` in `src/lib/auth.ts` ersetzen)
5. Kundenansicht scharf schalten

## Was bewusst nicht vorgesehen ist

- **Automatisches Instagram-Posting.** Nicht Teil dieser Version.
- **Echte Instagram-Analyse.** Dafür ist ein kostenpflichtiger Datenzugang
  nötig. Vorher abstimmen, welcher Anbieter und welche Kosten sinnvoll sind.
- **Texterzeugung per Sprachmodell.** `src/lib/generator.ts` ist heute
  regelbasiert und lässt sich später gegen einen Modellaufruf tauschen – die
  Ein- und Ausgabe bleibt dieselbe.
