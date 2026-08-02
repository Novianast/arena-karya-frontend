CREATE TABLE judge_invitations (
  invitation_id  SERIAL PRIMARY KEY,
  competition_id INT NOT NULL REFERENCES competitions(competition_id),
  judge_id       INT NOT NULL REFERENCES judges(judge_id),
  status         invitation_status_enum NOT NULL DEFAULT 'pending',
  pesan_undangan TEXT,
  responded_at   TIMESTAMP,
  created_at     TIMESTAMP DEFAULT now(),
  CONSTRAINT uk_judge_per_competition UNIQUE (competition_id, judge_id)
);