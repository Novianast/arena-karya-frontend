CREATE TABLE evaluations (
  evaluation_id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(submission_id),
  judge_id      INT NOT NULL REFERENCES judges(judge_id),
  criteria_id   INT NOT NULL REFERENCES evaluation_criteria(criteria_id),
  score         DECIMAL(5,2) NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT now(),
  CONSTRAINT uk_eval_per_submission_judge_criteria 
    UNIQUE (submission_id, judge_id, criteria_id)
);