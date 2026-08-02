CREATE OR REPLACE VIEW public_profiles AS
SELECT p.id, p.role_id, p.username, p.profile_image, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id;