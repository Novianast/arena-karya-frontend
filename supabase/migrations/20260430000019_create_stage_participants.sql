CREATE TABLE stage_participants (
  stage_participant_id SERIAL PRIMARY KEY,
  stage_id             INT NOT NULL REFERENCES stages(stage_id),
  entry_id             INT NOT NULL REFERENCES entries(entry_id),
  final_score          DECIMAL(5,2),
  qualification_status qualification_status_enum DEFAULT 'pending',
  decided_by           INT NOT NULL REFERENCES organizers(organizer_id),
  rank_position        INT,
  judge_notes          TEXT,
  entered_at           TIMESTAMP DEFAULT now(),
  CONSTRAINT uk_stage_entry UNIQUE (stage_id, entry_id)
);