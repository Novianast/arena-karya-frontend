CREATE TABLE stage_timelines (
  timeline_id SERIAL PRIMARY KEY,
  stage_id INT NOT NULL REFERENCES stages(stage_id),
  timeline_type timeline_type_enum NOT NULL,
  timeline_order INT NOT NULL,
  location VARCHAR(255),
  meeting_link VARCHAR(255),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL
);