CREATE TABLE events (
  event_id                SERIAL PRIMARY KEY,
  organizer_id            INT NOT NULL REFERENCES organizers(organizer_id),
  package_payment_id      INT NOT NULL REFERENCES package_payments(package_payment_id),
  event_name              VARCHAR(50) NOT NULL,
  year                    INT NOT NULL,
  description             TEXT,
  poster                  VARCHAR(255),
  event_guidebook         VARCHAR(255),
  start_date              DATE NOT NULL,
  end_date                DATE NOT NULL,
  location                TEXT,
  status                  event_status_enum DEFAULT 'draft' NOT NULL,
  allow_multi_comp        BOOLEAN DEFAULT false NOT NULL,
  is_published            BOOLEAN DEFAULT false NOT NULL,
  created_at              TIMESTAMP DEFAULT now(),
  published_at            TIMESTAMP,
  updated_at              TIMESTAMP
);