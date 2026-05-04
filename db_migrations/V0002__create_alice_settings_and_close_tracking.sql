CREATE TABLE IF NOT EXISTS alice_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE alice_sessions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
ALTER TABLE alice_sessions ADD COLUMN IF NOT EXISTS last_user_message TEXT;
ALTER TABLE alice_sessions ADD COLUMN IF NOT EXISTS last_alice_message TEXT;
