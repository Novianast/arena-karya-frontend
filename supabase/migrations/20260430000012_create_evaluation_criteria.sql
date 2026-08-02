CREATE TABLE evaluation_criteria (
  criteria_id SERIAL PRIMARY KEY,
  stage_id    INT NOT NULL REFERENCES stages(stage_id),
  name        VARCHAR(50) NOT NULL,
  weight      DECIMAL(5,2) NOT NULL,
  min_score   DECIMAL(5,2) DEFAULT 0,
  max_score   DECIMAL(5,2) DEFAULT 100,
  description TEXT,
  created_at  TIMESTAMP DEFAULT now()
);