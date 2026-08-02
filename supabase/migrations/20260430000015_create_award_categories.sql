CREATE TABLE award_categories (
  category_id   SERIAL PRIMARY KEY,
  organizer_id  INT NOT NULL REFERENCES organizers(organizer_id),
  category_name VARCHAR(20) NOT NULL,
  "order"       INT DEFAULT 1,
  description   TEXT,
  created_at    TIMESTAMP DEFAULT now()
);