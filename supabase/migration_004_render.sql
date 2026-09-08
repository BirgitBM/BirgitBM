-- ContentOS – Migration 004: fertige Reel-Videos und Renderstatus
--
-- Das Rendern erzeugt eine MP4-Datei. Sie liegt im Storage-Bucket
-- "reels-fertig"; hier steht nur, wo sie liegt und wie der letzte Renderlauf
-- ausgegangen ist.
--
-- Im Supabase-Dashboard unter "SQL Editor" ausführen. Mehrfach ausführbar,
-- verändert keine vorhandenen Daten.

alter table reels add column if not exists video_pfad text;
alter table reels add column if not exists video_dauer_sekunden numeric;
alter table reels add column if not exists render_status text not null default 'offen';
alter table reels add column if not exists render_fehler text;
alter table reels add column if not exists gerendert_am timestamptz;

alter table reels drop constraint if exists reels_render_status_check;
alter table reels add constraint reels_render_status_check
  check (render_status in ('offen', 'laeuft', 'fertig', 'fehler'));

-- ---------------------------------------------------------------------------
-- Buckets (im Dashboard unter "Storage" anzulegen, nicht per SQL)
-- ---------------------------------------------------------------------------
--   broll-videos   – die hochgeladenen Rohclips, privat
--   reels-fertig   – die gerenderten MP4-Dateien, privat
--
-- Beide privat: Der Zugriff läuft über zeitlich begrenzte Adressen, die die
-- Anwendung bei Bedarf erzeugt. Ein öffentlicher Bucket wäre für jeden
-- erreichbar, der die Adresse kennt.

-- ---------------------------------------------------------------------------
-- Zugriffsregeln für die Buckets
-- ---------------------------------------------------------------------------
-- Gleiche Logik wie in schema.sql: solange es kein Login gibt, offener
-- Zugriff für den anon-Key. Wird schema_auth.sql ausgeführt, ersetzt der
-- Block in migration_004_render_auth.sql diese Regeln.

drop policy if exists "v1_broll_videos_all" on storage.objects;
create policy "v1_broll_videos_all" on storage.objects
  for all using (bucket_id = 'broll-videos') with check (bucket_id = 'broll-videos');

drop policy if exists "v1_reels_fertig_all" on storage.objects;
create policy "v1_reels_fertig_all" on storage.objects
  for all using (bucket_id = 'reels-fertig') with check (bucket_id = 'reels-fertig');
