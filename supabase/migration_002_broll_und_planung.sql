-- ContentOS – Migration 002
--
-- Ergänzt die Felder für: mehrere B-Roll-Clips pro Reel, eigene Clips von
-- Kundinnen, persönliche Clip-Zuordnung, Kalenderwoche und Uhrzeit im
-- Wochenplan sowie erweitertes Markenwissen.
--
-- Im Supabase-Dashboard unter "SQL Editor" ausführen. Die Migration ist
-- mehrfach ausführbar (alle Anweisungen sind "if not exists" bzw. "if exists")
-- und verändert keine vorhandenen Daten.

-- ---------------------------------------------------------------------------
-- 1. B-Roll: Eigentümer, Dauer, Vorschaufarbe
-- ---------------------------------------------------------------------------
-- "besitzer" trennt die Bestände: Clips der Marke sehen alle, Clips einer
-- Kundin nur sie selbst. Ohne dieses Feld liesse sich das Abo-Modell
-- (Inhalt gehört der Marke, Bilder gehören der Kundin) nicht abbilden.

alter table broll add column if not exists besitzer text not null default 'marke';
alter table broll add column if not exists besitzer_user_id uuid;
alter table broll add column if not exists dauer_sekunden integer not null default 8;
alter table broll add column if not exists vorschau_farbe text not null default '#eee7dd';

alter table broll drop constraint if exists broll_besitzer_check;
alter table broll add constraint broll_besitzer_check
  check (besitzer in ('marke', 'kunde'));

-- ---------------------------------------------------------------------------
-- 2. Reels: mehrere Clips statt einer Freitext-Empfehlung
-- ---------------------------------------------------------------------------
-- broll_empfehlung bleibt erhalten und dient weiterhin als Hinweistext zur
-- Bildsprache. Neu ist broll_ids: die konkret zugeordneten Clips.

alter table reels add column if not exists broll_ids text[] not null default '{}';
alter table reels add column if not exists geaendert_am timestamptz not null default now();

-- Bestehende Reels: die Kennung aus dem Empfehlungstext übernehmen, damit die
-- bisherige Zuordnung nicht verloren geht. Aus "B003 – Ampulle in der Hand"
-- wird {B003}. Nur, wenn der Clip auch wirklich existiert.
update reels r
   set broll_ids = array[substring(r.broll_empfehlung from '^\s*(B[0-9]+)')]
 where cardinality(r.broll_ids) = 0
   and substring(r.broll_empfehlung from '^\s*(B[0-9]+)') is not null
   and exists (
     select 1 from broll b
      where b.id = substring(r.broll_empfehlung from '^\s*(B[0-9]+)')
   );

-- ---------------------------------------------------------------------------
-- 3. Persönliche Clip-Zuordnung einer Kundin
-- ---------------------------------------------------------------------------
-- Ein Reel gehört der Marke und wird von allen Kundinnen geteilt. Welche
-- Clips eine Kundin dafür verwendet, ist ihre eigene Entscheidung. Läge das
-- im Reel selbst, würde die Auswahl einer Kundin die einer anderen
-- überschreiben.

create table if not exists broll_zuordnungen (
  id text primary key,
  user_id uuid not null,
  reel_id text not null references reels(id) on delete cascade,
  broll_ids text[] not null default '{}',
  geaendert_am timestamptz not null default now(),
  unique (user_id, reel_id)
);

-- ---------------------------------------------------------------------------
-- 4. Wochenplan: Kalenderwoche und Uhrzeit
-- ---------------------------------------------------------------------------
-- Bisher gab es genau eine Woche. Mit der Kalenderwoche lassen sich Wochen
-- vor- und zurückblättern und im Voraus planen.

alter table wochenplan add column if not exists kalenderwoche text;
alter table wochenplan add column if not exists uhrzeit text not null default '12:00';

-- Bestehende Einträge der laufenden Kalenderwoche zuordnen, damit sie nicht
-- unsichtbar werden.
update wochenplan
   set kalenderwoche = to_char(current_date, 'IYYY') || '-W' || to_char(current_date, 'IW')
 where kalenderwoche is null;

alter table wochenplan alter column kalenderwoche set not null;

-- ---------------------------------------------------------------------------
-- 5. Markenwissen: Sprachregeln
-- ---------------------------------------------------------------------------
-- woerter_vermeiden ist die Grundlage der Warnung vor heiklen Formulierungen.

alter table markenwissen add column if not exists woerter_vermeiden text[] not null default '{}';
alter table markenwissen add column if not exists kernbotschaften text[] not null default '{}';
alter table markenwissen add column if not exists standard_ctas text[] not null default '{}';

update markenwissen
   set woerter_vermeiden = '{Wundermittel,"sofortiger Effekt",Faltenkiller,"100 % garantiert",faltenfrei,heilt}'
 where marke = 'SQT B2B' and cardinality(woerter_vermeiden) = 0;

-- ---------------------------------------------------------------------------
-- 6. Zugriffsregeln für die neue Tabelle
-- ---------------------------------------------------------------------------
-- Gleiche Logik wie in schema.sql: solange es kein Login gibt, offener
-- Zugriff. Wird schema_auth.sql ausgeführt, greift der zweite Block.

alter table broll_zuordnungen enable row level security;

drop policy if exists "v1_public_all" on broll_zuordnungen;
create policy "v1_public_all" on broll_zuordnungen
  for all using (true) with check (true);
