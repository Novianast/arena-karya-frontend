-- enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Peserta hanya bisa melihat submission timnya sendiri
CREATE POLICY "Team members can view their team's submission"
ON submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM entry_members em
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE em.entry_id = submissions.entry_id
    AND p.profile_id = auth.uid()
  )
);

-- Policy INSERT: Peserta hanya bisa mengunggah submission timnya
CREATE POLICY "Team members can upload their team's submission"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entry_members em
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE em.entry_id = submissions.entry_id
    AND p.profile_id = auth.uid()
  )
);