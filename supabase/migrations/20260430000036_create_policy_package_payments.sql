-- 1. Aktifkan Row Level Security (RLS) di tabel package_payments
ALTER TABLE public.package_payments ENABLE ROW LEVEL SECURITY;

-- 2. Policy untuk SELECT (READ): Penyelenggara hanya bisa membaca payment milik organizernya / profilenya
CREATE POLICY "Allow users to select own package payments" 
ON public.package_payments
FOR SELECT
USING (
  profile_id = auth.uid() 
  OR 
  organizer_id IN (
    SELECT organizer_id 
    FROM public.organizers 
    WHERE profile_id = auth.uid()
  )
);

-- 3. Policy untuk INSERT: Penyelenggara hanya bisa insert payment untuk organizernya / profilenya
CREATE POLICY "Allow users to insert own package payments" 
ON public.package_payments
FOR INSERT 
WITH CHECK (
  profile_id = auth.uid() 
  OR 
  organizer_id IN (
    SELECT organizer_id 
    FROM public.organizers 
    WHERE profile_id = auth.uid()
  )
);

-- 4. Policy untuk Select: Admin bisa melihat semua package payments
CREATE POLICY "Allow admins to select all package payments" 
ON public.package_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role_id = 1
  )
);

-- 5. Policy untuk Update: Admin bisa update package payments
CREATE POLICY "Allow admins to update all package payments" 
ON public.package_payments
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role_id = 1
  )
);