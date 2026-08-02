-- Policy Storage (Bucket: certificates)
-- Izin Peserta untuk mengunduh sertifikat
create policy "Participants can download their team's certificates"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'certificates'
  AND EXISTS (
    SELECT 1
    FROM awards a
    JOIN entry_members em ON a.entry_id = em.entry_id
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE 
      a.certificate_file_path = storage.objects.name
      AND p.profile_id = auth.uid()
  )
);

-- Tambahan Policy untuk mengizinkan Penyelenggara membaca (SELECT) sertifikat.
CREATE POLICY "Allow organizers to read certificates" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM entries e
    JOIN competitions c ON e.competition_id = c.competition_id
    JOIN events ev ON c.event_id = ev.event_id
    JOIN organizers o ON ev.organizer_id = o.organizer_id
    WHERE o.profile_id = auth.uid()
    AND e.entry_id::text = replace((string_to_array(name, '/'))[3], 'entry_', '')
  )
);

-- Izin Penyelenggara untuk mengunggah sertifikat
CREATE POLICY "Allow organizers to upload certificates" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM entries e
    JOIN competitions c ON e.competition_id = c.competition_id
    JOIN events ev ON c.event_id = ev.event_id
    JOIN organizers o ON ev.organizer_id = o.organizer_id
    WHERE o.profile_id = auth.uid()
    AND e.entry_id::text = replace((string_to_array(name, '/'))[3], 'entry_', '')
  )
);

-- Izin Penyelenggara untuk memperbarui sertifikat
CREATE POLICY "Allow organizers to update certificates" ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM entries e
    JOIN competitions c ON e.competition_id = c.competition_id
    JOIN events ev ON c.event_id = ev.event_id
    JOIN organizers o ON ev.organizer_id = o.organizer_id
    WHERE o.profile_id = auth.uid()
    AND e.entry_id::text = replace((string_to_array(name, '/'))[3], 'entry_', '')
  )
);

-- Izin Penyelenggara untuk menghapus sertifikat
CREATE POLICY "Allow organizers to delete certificates" ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM entries e
    JOIN competitions c ON e.competition_id = c.competition_id
    JOIN events ev ON c.event_id = ev.event_id
    JOIN organizers o ON ev.organizer_id = o.organizer_id
    WHERE o.profile_id = auth.uid()
    AND e.entry_id::text = replace((string_to_array(name, '/'))[3], 'entry_', '')
  )
);
