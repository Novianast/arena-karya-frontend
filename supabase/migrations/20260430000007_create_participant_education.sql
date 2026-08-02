CREATE TABLE participant_education (
  id_education     SERIAL PRIMARY KEY,
  participant_id   INT UNIQUE NOT NULL REFERENCES participants(participant_id),
  education_level  education_level_enum NOT NULL,
  institution_name VARCHAR(150) NOT NULL,
  province         VARCHAR(50) NOT NULL,
  regency          VARCHAR(50) NOT NULL,
  district         VARCHAR(50) NOT NULL,
  school_address   TEXT,
  supervisor_name  VARCHAR(100),
  supervisor_phone VARCHAR(20),
  created_at       TIMESTAMP DEFAULT now(),
  updated_at       TIMESTAMP
);