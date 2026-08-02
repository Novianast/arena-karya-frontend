CREATE TABLE profiles ( 
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(role_id),
  username VARCHAR(50),
  profile_image VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);