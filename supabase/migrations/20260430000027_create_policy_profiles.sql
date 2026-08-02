-- enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- insert profile sendiri
CREATE POLICY "Insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- read profile sendiri
CREATE POLICY "Read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- update profile sendiri
CREATE POLICY "Update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);