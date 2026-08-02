CREATE TABLE submissions (
  submission_id SERIAL PRIMARY KEY,
  stage_id      INT NOT NULL REFERENCES stages(stage_id),
  entry_id      INT NOT NULL REFERENCES entries(entry_id),
  title         VARCHAR(50) NOT NULL,
  description   TEXT,
  file_url      VARCHAR(255),
  link_url      VARCHAR(255),
  uploaded_at   TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP
);