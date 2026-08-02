-- enable RLS
ALTER TABLE entry_members ENABLE ROW LEVEL SECURITY;

-- Mengizinkan user yang login untuk menambahkan anggota tim
CREATE POLICY "Allow authenticated users to insert entry_members"
ON entry_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Mengizinkan user yang login untuk menghapus anggota tim (untuk fitur Kick nanti)
CREATE POLICY "Allow authenticated users to delete entry_members"
ON entry_members FOR DELETE
TO authenticated
USING (true);

-- Pastikan juga akses SELECT sudah diizinkan jika belum
CREATE POLICY "Allow authenticated users to read entry_members"
ON entry_members FOR SELECT
TO authenticated
USING (true);