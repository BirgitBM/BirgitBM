-- ContentOS – Phase 2: restriktive Policies
--
-- Erst ausführen, wenn:
-- 1. mindestens ein Admin-Nutzer unter Supabase → Authentication → Users
--    angelegt wurde (E-Mail/Passwort),
-- 2. NEXT_PUBLIC_REQUIRE_AUTH in .env.local (lokal) bzw. in den
--    Vercel-Umgebungsvariablen (Produktion) auf "true" gesetzt ist.
--
-- Diese Migration ersetzt die offenen v1_public_all-Policies aus
-- schema.sql durch Policies, die nur eingeloggten (authenticated)
-- Nutzern Zugriff geben. Der anon-Key kann danach nichts mehr lesen
-- oder schreiben.

drop policy if exists "v1_public_all" on broll;
drop policy if exists "v1_public_all" on accounts;
drop policy if exists "v1_public_all" on reels;
drop policy if exists "v1_public_all" on wochenplan;
drop policy if exists "v1_public_all" on markenwissen;

create policy "authenticated_all" on broll
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all" on accounts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all" on reels
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all" on wochenplan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all" on markenwissen
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Hinweis zu späteren Kundenrollen (aus der ursprünglichen Spezifikation):
-- Sobald Studio-/Premium-Kunden echte Konten bekommen, reicht die grobe
-- Unterscheidung "authenticated ja/nein" nicht mehr aus. Dann braucht es
-- zusätzlich eine Spalte (z.B. profiles.role) und Policies, die zwischen
-- admin und Kundenrollen unterscheiden – z.B. Kunden dürfen nur Reels mit
-- freigegeben_fuer_kunden = true lesen, aber nichts schreiben. Das ist in
-- den App-Typen (UserRole, freigegebenFuerKunden) bereits vorbereitet,
-- aber in Version 1 nicht mit echter Logik hinterlegt.
