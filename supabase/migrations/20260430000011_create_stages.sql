CREATE TABLE stages (
  stage_id       SERIAL PRIMARY KEY,
  competition_id INT NOT NULL REFERENCES competitions(competition_id),
  stage_name     VARCHAR(50) NOT NULL,
  stage_type     stage_type_enum NOT NULL,
  stage_order    INT NOT NULL,
  max_qualified  INT,
  start_date     TIMESTAMP,
  end_date       TIMESTAMP,
  status         stage_status_enum DEFAULT 'not_started',
  created_at     TIMESTAMP DEFAULT now()
);