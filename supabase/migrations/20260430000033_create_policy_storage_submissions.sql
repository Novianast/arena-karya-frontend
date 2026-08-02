-- Policy Storage (Bucket: submissions)
-- Policy SELECT (View File): Anggota tim bisa melihat/mendownload file karya timnya
CREATE POLICY "Team members can view their team's submission file"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM entry_members em
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE em.entry_id = NULLIF(regexp_replace(split_part(name, '/', 4), '\D', '', 'g'), '')::integer
    AND p.profile_id = auth.uid()
  )
);

-- Policy INSERT (Upload File): Anggota tim bisa mengunggah file ke folder entry mereka
CREATE POLICY "Team members can upload their team's submission file"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM entry_members em
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE em.entry_id = NULLIF(regexp_replace(split_part(name, '/', 4), '\D', '', 'g'), '')::integer
    AND p.profile_id = auth.uid()
  )
);

-- Policy SELECT (View File): Juri bisa melihat file di entry yang dinilainya
CREATE POLICY "Judges can view submissions according to their assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' 
  AND auth.uid() IN (
    SELECT p.id 
    FROM judges j
    JOIN judge_assignments ja ON ja.judge_id = j.judge_id
    JOIN submissions s ON s.stage_id = ja.stage_id
    JOIN profiles p ON p.id = j.profile_id
  )
);