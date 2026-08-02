-- -- enable RLS
-- ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- -- read profile sendiri
-- CREATE POLICY "Read own participant"
-- ON participants
-- FOR SELECT
-- USING (auth.uid() = profile_id);

-- -- update profile sendiri
-- CREATE POLICY "Update own participant"
-- ON participants
-- FOR UPDATE
-- USING (auth.uid() = profile_id);