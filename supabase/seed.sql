-- Insert Roles
INSERT INTO roles (role_name)
VALUES 
  ('admin'),
  ('organizer'),
  ('judge'),
  ('participant');

-- Insert Packages
INSERT INTO packages (package_id, package_name, price, max_competitions, max_stages, upload_format, description, is_active) 
VALUES
  (1, 'Karsa', 100000.00, 3, 2, 'doc_img', 'Cocok untuk lomba skala kecil', true),
  (2, 'Karya', 250000.00, 7, 4, 'doc_img_vid', 'Pilihan ideal untuk event fakultas', true),
  (3, 'Mahakarya', 500000.00, 10, 99, 'all', 'Solusi penuh untuk event lintas negara', true);

-- Insert Profiles
  -- INSERT INTO profiles (id, role_id, username, profile_image, phone) 
  -- VALUES
  --   ('11111111-1111-1111-1111-111111111111', 2, 'Alif Pernando', 'alif.png', '081234567890'),
  --   ('22222222-2222-2222-2222-222222222222', 2, 'Adzaky', 'adzaky.png', '081234567891'),
  --   ('33333333-3333-3333-3333-333333333333', 2, 'Kuraihan', 'kuraihan.png', '081234567892');

-- Insert Organizers
-- INSERT INTO organizers (organizer_id, profile_id, organization_name, organization_description, pic_name, pic_phone, address, website, logo, status) 
-- VALUES
--   (1, '9d42e2e3-92e7-45e3-b565-84f0d14b167a', 'Tech Event Organizer', 'Fokus pada event IT', 'Alif', '081234567890', 'Semarang', 'tech-org.com', 'logo1.png', 'active'),
--   (2, '8ce4da98-08fd-41dd-805d-8b21257b032e', 'Art Creative Space', 'Fokus pada event desain', 'Adzaky', '081234567891', 'Jakarta', 'art-space.com', 'logo2.png', 'active'),
--   (3, 'f7c13678-bfd0-4048-b2f2-102af650adc0', 'Sportive Community', 'Fokus pada event olahraga', 'Kuraihan', '081234567892', 'Bandung', 'sportive.com', 'logo3.png', 'active');

-- Insert Events
-- INSERT INTO events (event_id, organizer_id, package_id, event_name, year, description, poster, start_date, end_date, location, status, allow_multi_comp) 
-- VALUES
--   (1, 1, 1, 'Web Dev Hackathon', 2026, 'Lomba membuat website', 'poster_hackathon.png', '2026-06-01', '2026-06-03', 'Semarang', 'active', false),
--   (2, 2, 2, 'UI/UX Design Challenge', 2026, 'Lomba desain antarmuka', 'poster_uiux.png', '2026-07-10', '2026-07-15', 'Online', 'active', true),
--   (3, 3, 3, 'National E-Sports Cup', 2026, 'Turnamen E-Sports', 'poster_esports.png', '2026-08-17', '2026-08-20', 'Jakarta', 'draft', true);

-- Insert Competitions
-- INSERT INTO competitions (competition_id, event_id, competition_name, description, rule_text, guidebook_url, type, max_teams, team_size_min, team_size_max, max_participants, price, status) 
-- VALUES
--   -- Event 1 (event_id: 1)
--   (1, 1, 'Frontend Challenge', 'Lomba membuat UI/UX website', 'Dilarang menggunakan template', 'guide_fe.pdf', 'team', 20, 2, 3, 100, 50000.00, 'active'),
--   (2, 1, 'Backend API Race', 'Lomba membangun REST API', 'Gunakan framework bebas', 'guide_be.pdf', 'individual', NULL, NULL, NULL, 100, 30000.00, 'active'),

--   -- Event 2 (event_id: 2)
--   (3, 2, 'Mobile App Redesign', 'Redesign aplikasi publik', 'Kumpulkan link Figma', 'guide_mobile.pdf', 'individual', NULL, NULL, NULL, 50, 0, 'active'),
--   (4, 2, 'Web Landing Page', 'Desain landing page kreatif', 'Kumpulkan link Figma', 'guide_web.pdf', 'individual', NULL, NULL, NULL, 50, 0, 'active'),

--   -- Event 3 (event_id: 3)
--   (5, 3, 'Valorant Tournament', 'Turnamen FPS PC 5v5', 'Sistem gugur (BO1)', 'guide_valo.pdf', 'team', 16, 5, 6, 70, 100000.00, 'draft'),
--   (6, 3, 'Mobile Legends', 'Turnamen MOBA Mobile', 'Sistem gugur (BO3)', 'guide_ml.pdf', 'team', 32, 5, 6, 70, 75000.00, 'draft');

