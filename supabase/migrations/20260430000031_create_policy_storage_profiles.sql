-- Policy Storage (Bucket: profiles)
-- Buat policy SELECT (Publik agar bisa dibaca di img src)
CREATE POLICY "Public read avatar" ON storage.objects FOR SELECT 
USING (bucket_id = 'profiles');

-- Buat policy INSERT baru
CREATE POLICY "Upload own avatar" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^participants/([a-f0-9\-]{36})'))[1]
);

-- Buat policy UPDATE baru untuk peserta
CREATE POLICY "Update own avatar" ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^participants/([a-f0-9\-]{36})'))[1]
);

-- Buat policy DELETE baru untuk peserta
CREATE POLICY "Delete own avatar" ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^participants/([a-f0-9\-]{36})'))[1]
);

-- Buat policy SELECT (Publik agar bisa dibaca di img src)
CREATE POLICY "Public read avatar" ON storage.objects FOR SELECT 
USING (bucket_id = 'profiles');

-- Buat policy INSERT baru khusus organizer
CREATE POLICY "Upload own organizer avatar" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^organizers/([a-f0-9\-]{36})'))[1]
);

-- Buat policy UPDATE baru khusus organizer
CREATE POLICY "Update own organizer avatar" ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^organizers/([a-f0-9\-]{36})'))[1]
);

-- Buat policy DELETE baru khusus organizer
CREATE POLICY "Delete own organizer avatar" ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^organizers/([a-f0-9\-]{36})'))[1]
);

-- Buat policy INSERT baru
CREATE POLICY "Upload own judge avatar" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^judges/([a-f0-9\-]{36})'))[1]
);

-- Buat policy UPDATE baru (opsional tapi baik untuk dipertahankan)
CREATE POLICY "Update own judge avatar" ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^judges/([a-f0-9\-]{36})'))[1]
);

-- Buat policy DELETE baru (WAJIB untuk fungsi .remove() kita)
CREATE POLICY "Delete own judge avatar" ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (regexp_match(name, '^judges/([a-f0-9\-]{36})'))[1]
);

