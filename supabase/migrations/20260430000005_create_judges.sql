CREATE TABLE judges (
  judge_id    SERIAL PRIMARY KEY,
  profile_id  UUID UNIQUE NOT NULL REFERENCES profiles(id),
  bio         TEXT,
  speciality  TEXT,
  last_education judge_last_education_enum NOT NULL,
  institution VARCHAR(150) NOT NULL,
  prefix VARCHAR(20),
  suffix VARCHAR(20),
  created_at  TIMESTAMP DEFAULT now()
);