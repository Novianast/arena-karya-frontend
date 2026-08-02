-- enable RLS
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Participants can only view awards belonging to their team
CREATE POLICY "Participants can view their team's awards"
ON awards FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM entry_members em
    JOIN participants p ON em.participant_id = p.participant_id
    WHERE em.entry_id = awards.entry_id
    AND p.profile_id = auth.uid()
  )
);