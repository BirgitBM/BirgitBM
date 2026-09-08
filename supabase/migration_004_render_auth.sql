-- ContentOS – Migration 004, Ergänzung für den Auth-Betrieb
--
-- NUR ausführen, wenn schema_auth.sql bereits aktiv ist (Login erforderlich).

drop policy if exists "v1_broll_videos_all" on storage.objects;
drop policy if exists "v1_reels_fertig_all" on storage.objects;

create policy "authenticated_broll_videos" on storage.objects
  for all using (bucket_id = 'broll-videos' and auth.role() = 'authenticated')
  with check (bucket_id = 'broll-videos' and auth.role() = 'authenticated');

create policy "authenticated_reels_fertig" on storage.objects
  for all using (bucket_id = 'reels-fertig' and auth.role() = 'authenticated')
  with check (bucket_id = 'reels-fertig' and auth.role() = 'authenticated');
