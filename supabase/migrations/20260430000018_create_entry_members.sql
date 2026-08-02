CREATE TABLE entry_members (
  member_id      SERIAL PRIMARY KEY,
  entry_id       INT NOT NULL REFERENCES entries(entry_id),
  participant_id INT NOT NULL REFERENCES participants(participant_id),
  role           entry_member_role_enum DEFAULT 'member',
  joined_at      TIMESTAMP DEFAULT now(),
  CONSTRAINT uk_entry_participant UNIQUE (entry_id, participant_id)
);