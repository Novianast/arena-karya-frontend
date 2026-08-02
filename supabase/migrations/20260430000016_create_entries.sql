CREATE TABLE entries (
  entry_id       SERIAL PRIMARY KEY,
  competition_id INT NOT NULL REFERENCES competitions(competition_id),
  leader_id      INT NOT NULL REFERENCES participants(participant_id),
  entry_type     entry_type_enum NOT NULL,
  entry_name     VARCHAR(50) NOT NULL,
  created_at     TIMESTAMP DEFAULT now(),
  CONSTRAINT uk_entry_per_competition UNIQUE (competition_id, leader_id)
);