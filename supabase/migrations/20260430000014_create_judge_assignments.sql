CREATE TABLE judge_assignments (
  assignment_id SERIAL PRIMARY KEY,
  judge_id      INT NOT NULL REFERENCES judges(judge_id),
  stage_id      INT NOT NULL REFERENCES stages(stage_id),
  status        assignment_status_enum NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT now(),
  CONSTRAINT uk_judge_per_stage UNIQUE (judge_id, stage_id)
);