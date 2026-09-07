-- ContentOS – Migration 002, Ergänzung für den Auth-Betrieb
--
-- NUR ausführen, wenn schema_auth.sql bereits aktiv ist (Login erforderlich).
-- Setzt die restriktiven Policies auf die neue Tabelle broll_zuordnungen.

drop policy if exists "v1_public_all" on broll_zuordnungen;

create policy "authenticated_all" on broll_zuordnungen
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Sobald echte Kundenkonten existieren, ersetzt diese Regel die obige:
-- Jede Kundin sieht und ändert ausschliesslich ihre eigene Zuordnung.
--
-- drop policy if exists "authenticated_all" on broll_zuordnungen;
-- create policy "eigene_zuordnung" on broll_zuordnungen
--   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
