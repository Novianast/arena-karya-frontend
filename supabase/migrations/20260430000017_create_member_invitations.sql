CREATE TABLE member_invitations (
  invitation_id  SERIAL PRIMARY KEY,
  entry_id       INT NOT NULL REFERENCES entries(entry_id),
  participant_id INT NOT NULL REFERENCES participants(participant_id),
  status         invitation_status_enum DEFAULT 'pending',
  created_at     TIMESTAMP DEFAULT now()
);