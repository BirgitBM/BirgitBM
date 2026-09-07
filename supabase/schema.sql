-- ContentOS – Schema für Version 1
-- Im Supabase-Dashboard unter "SQL Editor" ausführen (einmalig).

create table if not exists broll (
  id text primary key,
  titel text not null,
  beschreibung text not null,
  tags text[] not null default '{}',
  produkt text,
  kategorie text not null
);

create table if not exists accounts (
  id text primary key,
  handle text not null,
  hinzugefuegt_am date not null default current_date,
  letzte_analyse date
);

create table if not exists reels (
  id text primary key,
  marke text not null,
  zielgruppe text not null,
  ziel text not null,
  thema text not null,
  produkt text,
  hook text not null,
  broll_empfehlung text not null,
  text_overlays jsonb not null default '[]',
  caption text not null,
  cta text not null,
  status text not null default 'Idee',
  content_art text not null default 'Reel',
  erstellt_am date not null default current_date,
  freigegeben_fuer_kunden boolean not null default false
);

create table if not exists wochenplan (
  id text primary key,
  tag text not null,
  thema text not null,
  ziel text not null,
  status text not null default 'Idee',
  broll_id text references broll(id) on delete set null,
  reel_id text references reels(id) on delete set null
);

create table if not exists markenwissen (
  marke text primary key,
  zielgruppe text not null,
  tonalitaet text not null,
  produkte text[] not null default '{}'
);

-- Row Level Security aktivieren.
-- WICHTIG: Version 1 hat noch kein Login. Die Policies unten erlauben dem
-- öffentlichen (anon) Key vollen Lese-/Schreibzugriff, damit die App ohne
-- Auth funktioniert. Sobald echte Nutzerkonten/Rollen gebaut sind, müssen
-- diese Policies durch nutzerbezogene Regeln ersetzt werden. Bis dahin:
-- Deployment nicht öffentlich verlinken bzw. zusätzlich schützen.

alter table broll enable row level security;
alter table accounts enable row level security;
alter table reels enable row level security;
alter table wochenplan enable row level security;
alter table markenwissen enable row level security;

create policy "v1_public_all" on broll for all using (true) with check (true);
create policy "v1_public_all" on accounts for all using (true) with check (true);
create policy "v1_public_all" on reels for all using (true) with check (true);
create policy "v1_public_all" on wochenplan for all using (true) with check (true);
create policy "v1_public_all" on markenwissen for all using (true) with check (true);

-- Seed-Daten (identisch zu den bisherigen Mock-Daten)

insert into broll (id, titel, beschreibung, tags, produkt, kategorie) values
  ('B001', 'Radiance Set auf Behandlungstisch', 'Produktset drapiert auf weißem Behandlungstuch, Studiolicht.', '{Produkt,Studio,clean}', 'Radiance', 'Produktaufnahme'),
  ('B002', 'Refine Verpackung öffnen', 'Hände öffnen die Verpackung, langsame Bewegung, Nahaufnahme.', '{Unboxing,Hände,Nahaufnahme}', 'Refine', 'Produktaufnahme'),
  ('B003', 'Ampulle in der Hand', 'Ampulle wird zwischen zwei Fingern gehalten, Gegenlicht.', '{Ampulle,Makro,Gegenlicht}', null, 'Produktaufnahme'),
  ('B004', 'Behandlungsvorbereitung', 'Kosmetikerin bereitet den Arbeitsplatz für eine Behandlung vor.', '{Behandlung,Studio,Prozess}', null, 'Behandlungsablauf'),
  ('B005', 'Produktregal', 'Schwenk über ein geordnetes Regal mit der gesamten Produktlinie.', '{Regal,Übersicht,Studio}', null, 'Produktaufnahme')
on conflict (id) do nothing;

insert into accounts (id, handle, hinzugefuegt_am, letzte_analyse) values
  ('A001', '@dermaklinik_berlin', '2026-08-12', '2026-09-01'),
  ('A002', '@hautzentrum.muc', '2026-08-18', '2026-08-30'),
  ('A003', '@beauty.insights.de', '2026-08-25', null)
on conflict (id) do nothing;

insert into reels (id, marke, zielgruppe, ziel, thema, produkt, hook, broll_empfehlung, text_overlays, caption, cta, status, content_art, erstellt_am, freigegeben_fuer_kunden) values
  ('R001', 'SQT B2B', 'Kosmetikerinnen', 'Education', 'Warum Spiculae anders wirken als klassische Microneedling-Nadeln', 'SQT Biomicroneedling Starter-Set',
   'Die meisten Kosmetikerinnen erklären Microneedling falsch – hier ist der Unterschied.', 'B003 – Ampulle in der Hand',
   '[{"zeit":"0:00–0:03","text":"Microneedling ≠ Microneedling"},{"zeit":"0:03–0:08","text":"Spiculae lösen sich im Gewebe auf"},{"zeit":"0:08–0:15","text":"Das bedeutet für deine Behandlung..."}]',
   'Spiculae sind keine Nadeln im klassischen Sinn – sie lösen sich im Gewebe auf und setzen den Regenerationsprozess anders in Gang. Genau das macht den Unterschied für messbare Ergebnisse in deiner Behandlung.',
   'Mehr zum Protokoll im Profil', 'Freigegeben', 'Reel', '2026-09-01', false),
  ('R002', 'SQT Homecare', 'Endkunden', 'Produktverkauf', 'Radiance Serum Anwendung zuhause', 'Radiance',
   'Das Studio-Ergebnis auch zwischen den Behandlungen halten.', 'B001 – Radiance Set auf Behandlungstisch',
   '[{"zeit":"0:00–0:04","text":"Zwischen den Behandlungen passiert oft: nichts."},{"zeit":"0:04–0:10","text":"Radiance hält den Effekt aufrecht"}]',
   'Deine Haut regeneriert sich nicht nur im Studio. Radiance ist die Ergänzung für zuhause, abgestimmt auf deine Behandlung.',
   'Jetzt im Shop entdecken', 'Entwurf', 'Reel', '2026-09-02', false),
  ('R003', 'Exoprime', 'Kosmetikerinnen', 'Vertrauen', 'Warum wir Exoprime exklusiv aus Italien beziehen', null,
   'Nicht jedes Exosomen-Produkt hält, was es verspricht.', 'B005 – Produktregal',
   '[{"zeit":"0:00–0:03","text":"Exosomen sind aktuell überall."},{"zeit":"0:03–0:09","text":"Herkunft und Herstellung entscheiden über Qualität."}]',
   'Exoprime wird in Italien nach klar definierten Standards hergestellt. Als exklusive deutsche Vertriebspartnerin achten wir genau darauf, was in deiner Praxis ankommt.',
   'Fragen? Schreib uns.', 'Idee', 'Reel', '2026-09-03', false)
on conflict (id) do nothing;

insert into wochenplan (id, tag, thema, ziel, status, broll_id, reel_id) values
  ('W001', 'Montag', 'Spiculae vs. klassisches Microneedling', 'Education', 'Freigegeben', 'B003', 'R001'),
  ('W002', 'Dienstag', 'Radiance Set im Detail', 'Produktverkauf', 'Entwurf', 'B001', 'R002'),
  ('W003', 'Mittwoch', 'Ein Tag im Behandlungsraum', 'Reichweite', 'Idee', 'B004', null),
  ('W004', 'Donnerstag', 'Herkunft von Exoprime', 'Vertrauen', 'Idee', 'B005', 'R003'),
  ('W005', 'Freitag', 'Refine Unboxing', 'Education', 'Idee', 'B002', null)
on conflict (id) do nothing;

insert into markenwissen (marke, zielgruppe, tonalitaet, produkte) values
  ('SQT B2B', 'Kosmetikerinnen, Heilpraktiker und Ärzte', 'professionell, verständlich, modern, nicht übertrieben',
   '{Nourishing,Revitalizing,"Anti-Aging",Recovery,Body,Radiance,Refine}')
on conflict (marke) do nothing;
