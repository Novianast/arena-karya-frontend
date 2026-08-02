CREATE TABLE entry_payments (
  payment_id     SERIAL PRIMARY KEY,
  order_id       VARCHAR(50) UNIQUE NOT NULL,
  competition_id INT NOT NULL REFERENCES competitions(competition_id),
  entry_id       INT REFERENCES entries(entry_id),
  amount         DECIMAL(12,2) NOT NULL,
  proof_image    VARCHAR(255),
  status         entry_payment_status_enum DEFAULT 'pending',
  verified_by    INT REFERENCES organizers(organizer_id),
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT now(),
  verified_at    TIMESTAMP
);