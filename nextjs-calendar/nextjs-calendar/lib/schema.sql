-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  duration INTEGER DEFAULT 60,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE
  ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();