-- 1. Izin membaca berkas secara publik (untuk mengunduh buku panduan/melihat poster)
CREATE POLICY "Public read competition assets" ON storage.objects FOR SELECT 
USING (bucket_id = 'competitions');

-- 2. Izin Penyelenggara (role_id = 2) untuk mengunggah berkas baru
CREATE POLICY "Allow organizers to upload competition assets" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'competitions' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role_id = 2
  )
);

-- 3. Izin Penyelenggara (role_id = 2) untuk memperbarui berkas
CREATE POLICY "Allow organizers to update competition assets" ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id = 'competitions' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role_id = 2
  )
);

-- 4. Izin Penyelenggara (role_id = 2) untuk menghapus berkas
CREATE POLICY "Allow organizers to delete competition assets" ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'competitions' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role_id = 2
  )
);
