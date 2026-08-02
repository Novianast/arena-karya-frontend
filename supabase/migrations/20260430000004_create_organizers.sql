CREATE TABLE organizers (
  organizer_id             SERIAL PRIMARY KEY,
  profile_id               UUID UNIQUE NOT NULL REFERENCES profiles(id),
  organization_name        VARCHAR(100) NOT NULL,
  organization_description TEXT,
  pic_name                 VARCHAR(50) NOT NULL,
  pic_phone                VARCHAR(20) NOT NULL,
  address                  TEXT,
  website                  VARCHAR(255),
  logo                     VARCHAR(255),
  status                   organizer_status_enum DEFAULT 'active' NOT NULL,
  created_at               TIMESTAMP DEFAULT now(),
  updated_at               TIMESTAMP
);