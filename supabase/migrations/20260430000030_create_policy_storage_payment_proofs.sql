-- Policy: User hanya bisa MENGUNGGAH (INSERT) ke foldernya sendiri
CREATE POLICY "Allow users to upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment_proofs' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: User hanya bisa MELIHAT (SELECT) file di foldernya sendiri
CREATE POLICY "Allow users and team members to view payment proof"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment_proofs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[2]
    OR
    EXISTS (
      SELECT 1 
      FROM public.entry_members em
      JOIN public.entries e ON e.entry_id = em.entry_id
      JOIN public.participants p_member ON p_member.participant_id = em.participant_id
      JOIN public.participants p_leader ON p_leader.participant_id = e.leader_id
      WHERE p_leader.profile_id::text = (storage.foldername(name))[2]
      AND p_member.profile_id = auth.uid()
    )
  )
);

-- Policy: User hanya bisa MENGHAPUS/UPDATE file di foldernya sendiri
CREATE POLICY "Allow users to update/delete their own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment_proofs' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Buat policy akses baca khusus organizer
CREATE POLICY "Organizer can view own competition payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment_proofs' AND
  EXISTS (
    SELECT 1 
    FROM public.entry_payments ep
    JOIN public.competitions c ON ep.competition_id = c.competition_id
    JOIN public.events e ON c.event_id = e.event_id
    JOIN public.organizers o ON e.organizer_id = o.organizer_id
    WHERE ep.proof_image = storage.objects.name
      AND o.profile_id = auth.uid()
  )
);

-- Admin (role_id = 1) dapat SELECT dari storage payment_proofs
CREATE POLICY "Admin can view all payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment_proofs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role_id = 1
  )
);