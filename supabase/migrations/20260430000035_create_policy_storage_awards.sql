-- Policy Storage (Bucket: awards)
-- Policy SELECT: Participants can only download certificates belonging to their team
CREATE POLICY "Participants can download their team's certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM awards a
    JOIN entry_members em ON a.entry_id = em.entry_id
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE a.certificate_file_path = name -- Match storage path with database record
    AND p.profile_id = auth.uid()
  )
);