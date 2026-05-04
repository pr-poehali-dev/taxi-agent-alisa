CREATE TABLE IF NOT EXISTS alice_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term TEXT,
    utm_content TEXT,
    messages_count INT NOT NULL DEFAULT 0,
    has_error BOOLEAN NOT NULL DEFAULT FALSE,
    order_sent BOOLEAN NOT NULL DEFAULT FALSE,
    order_phone VARCHAR(32),
    order_route TEXT,
    order_price VARCHAR(64),
    user_ip VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_sessions_started ON alice_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_order ON alice_sessions(order_sent);

CREATE TABLE IF NOT EXISTS alice_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON alice_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON alice_messages(created_at);

CREATE TABLE IF NOT EXISTS alice_errors (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    session_id VARCHAR(64),
    error_type VARCHAR(128),
    error_message TEXT,
    user_message TEXT,
    notified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_errors_created ON alice_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_errors_notified ON alice_errors(notified);
