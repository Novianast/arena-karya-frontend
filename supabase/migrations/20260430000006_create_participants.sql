CREATE TABLE participants (
  participant_id SERIAL PRIMARY KEY,
  profile_id     UUID UNIQUE NOT NULL REFERENCES profiles(id),
  country country_enum DEFAULT 'Indonesia' NOT NULL,
  address        TEXT,
  birth_date     DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT now()
);