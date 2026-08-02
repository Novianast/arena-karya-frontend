CREATE TABLE competitions (
  competition_id   SERIAL PRIMARY KEY,
  event_id         INT NOT NULL REFERENCES events(event_id),
  competition_name VARCHAR(50) NOT NULL,
  description      TEXT,
  rule_text        TEXT,
  guidebook_url    VARCHAR(255),
  type             competition_type_enum DEFAULT 'individual' NOT NULL,
  max_teams        INT,
  team_size_min    INT,
  team_size_max    INT,
  max_participants INT,
  price            DECIMAL(12,2) DEFAULT 0,
  status           competition_status_enum DEFAULT 'draft' NOT NULL,
  created_at       TIMESTAMP DEFAULT now(),
  updated_at       TIMESTAMP
);