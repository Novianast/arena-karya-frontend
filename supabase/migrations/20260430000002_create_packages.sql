CREATE TABLE packages (
  package_id       SERIAL PRIMARY KEY,
  package_name     VARCHAR(50) NOT NULL,
  price            DECIMAL(12,2) NOT NULL,
  max_competitions INT NOT NULL,
  max_stages       INT NOT NULL,
  max_days         INT NOT NULL,
  upload_format    upload_format_enum NOT NULL,
  description      TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT now()
);