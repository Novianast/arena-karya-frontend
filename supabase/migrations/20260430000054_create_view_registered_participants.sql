CREATE OR REPLACE VIEW public.registered_participants AS
WITH (security_invoker = true) -- Pastikan RLS Aktif di tabel
SELECT 
    em.member_id,
    em.entry_id,
    em.participant_id,
    em.role,
    em.joined_at,
    en.competition_id,
    c.event_id,
    e.organizer_id
FROM 
    public.entry_members em
JOIN 
    public.entries en ON em.entry_id = en.entry_id
JOIN 
    public.competitions c ON en.competition_id = c.competition_id
JOIN 
    public.events e ON c.event_id = e.event_id;