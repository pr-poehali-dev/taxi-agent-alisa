
CREATE TABLE taxi_users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('dispatcher','driver')),
  full_name VARCHAR(128) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE taxi_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER REFERENCES taxi_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE taxi_orders (
  id SERIAL PRIMARY KEY,
  passenger_name VARCHAR(128) NOT NULL,
  passenger_phone VARCHAR(20) NOT NULL,
  from_city VARCHAR(128) NOT NULL,
  to_city VARCHAR(128) NOT NULL,
  trip_date DATE NOT NULL,
  passengers_count INTEGER DEFAULT 1,
  comment TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','in_progress','done','cancelled')),
  driver_id INTEGER REFERENCES taxi_users(id),
  dispatcher_id INTEGER REFERENCES taxi_users(id),
  price INTEGER,
  chat_token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE taxi_chat_messages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES taxi_orders(id),
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('passenger','dispatcher','driver')),
  sender_name VARCHAR(128),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE taxi_reviews (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES taxi_orders(id),
  chat_token VARCHAR(64) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  passenger_name VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_taxi_orders_status ON taxi_orders(status);
CREATE INDEX idx_taxi_orders_driver ON taxi_orders(driver_id);
CREATE INDEX idx_taxi_orders_token ON taxi_orders(chat_token);
CREATE INDEX idx_taxi_chat_order ON taxi_chat_messages(order_id);
CREATE INDEX idx_taxi_sessions_user ON taxi_sessions(user_id);
