CREATE TABLE package_payments (
  payment_id    SERIAL PRIMARY KEY,
  order_id       VARCHAR(50) UNIQUE NOT NULL,
  organizer_id  INT NOT NULL REFERENCES organizers(organizer_id),
  event_id      INT NOT NULL REFERENCES events(event_id),
  package_id    INT NOT NULL REFERENCES packages(package_id),
  amount        DECIMAL(12,2) NOT NULL,
  proof_image   VARCHAR(255),
  status        payment_status_enum DEFAULT 'pending' NOT NULL,
  profile_id    UUID UNIQUE REFERENCES profiles(id),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT now(),
  verified_at   TIMESTAMP
);