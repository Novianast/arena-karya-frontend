-- -- enable RLS
-- ALTER TABLE participant_education ENABLE ROW LEVEL SECURITY;

-- -- read profile sendiri
-- CREATE POLICY "Read own education"
-- ON participant_education
-- FOR SELECT
-- USING (participant_id IN (SELECT participant_id FROM participants WHERE profile_id = auth.uid()));

-- -- update profile sendiri
-- CREATE POLICY "Update own education"
-- ON participant_education
-- FOR UPDATE
-- USING (participant_id IN (SELECT participant_id FROM participants WHERE profile_id = auth.uid()));