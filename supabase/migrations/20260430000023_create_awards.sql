CREATE TABLE awards (
  award_id    SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES award_categories(category_id),
  entry_id    INT NOT NULL REFERENCES entries(entry_id),
  decided_by  INT NOT NULL REFERENCES organizers(organizer_id),
  certificate_file_path VARCHAR(255),
  certificate_external_url VARCHAR(255),
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT uk_award_per_entry 
    UNIQUE (category_id, entry_id)
);