-- ContentOS – Migration 003: Video zu B-Roll-Clips
--
-- Zwei Wege, ein Datenmodell:
--   video_url   – Link auf eine Datei bei Google Drive, Dropbox o. ä.
--                 Wird jetzt schon verwendet, kostet nichts.
--   video_pfad  – Pfad im Supabase-Storage-Bucket "broll-videos".
--                 Noch ungenutzt; die Spalte steht bereits hier, damit für
--                 den späteren echten Upload keine weitere Migration nötig ist.
--
-- video_quelle sagt, welcher der beiden Wege für diesen Clip gilt.
--
-- Im Supabase-Dashboard unter "SQL Editor" ausführen. Mehrfach ausführbar,
-- verändert keine vorhandenen Daten.

alter table broll add column if not exists video_url text;
alter table broll add column if not exists video_pfad text;
alter table broll add column if not exists dateigroesse_bytes bigint;
alter table broll add column if not exists video_quelle text not null default 'link';

alter table broll drop constraint if exists broll_video_quelle_check;
alter table broll add constraint broll_video_quelle_check
  check (video_quelle in ('link', 'upload'));

-- Nur http(s) zulassen. Verhindert, dass über ein gespeichertes
-- "javascript:"-Ziel Schadcode in die Oberfläche gelangt.
alter table broll drop constraint if exists broll_video_url_check;
alter table broll add constraint broll_video_url_check
  check (video_url is null or video_url ~* '^https?://');

-- ---------------------------------------------------------------------------
-- Für den späteren Upload (jetzt NICHT nötig)
-- ---------------------------------------------------------------------------
-- Wenn der echte Upload gebaut wird, im Supabase-Dashboard unter "Storage"
-- einen privaten Bucket "broll-videos" anlegen. Die Zugriffsregeln kommen
-- dann in eine eigene Migration – bewusst erst dann, damit hier nichts
-- Ungenutztes offen steht.
