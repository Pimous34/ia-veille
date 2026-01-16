-- Create planning_cours table if it doesn't exist (it might be missing from migrations)
CREATE TABLE IF NOT EXISTS planning_cours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_event_id TEXT UNIQUE,
  title TEXT,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  detected_topic TEXT,
  organizer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns for the email automation
ALTER TABLE planning_cours ADD COLUMN IF NOT EXISTS attendees TEXT[] DEFAULT '{}';
ALTER TABLE planning_cours ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE planning_cours ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Add index for faster querying of upcoming events
CREATE INDEX IF NOT EXISTS planning_cours_start_date_idx ON planning_cours(start_date);
