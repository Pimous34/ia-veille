-- Migration: Setup Cron Job for RSS Feed Aggregation
-- This creates a cron job that runs every 8 hours to fetch RSS feeds

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create the cron job to fetch RSS feeds every 8 hours
-- The job will call the Edge Function via HTTP POST
SELECT cron.schedule(
  'fetch-rss-feeds',           -- Job name
  '0 */8 * * *',               -- Cron expression: every 8 hours at minute 0
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.edge_function_url') || '/fetch-rss',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('action', 'fetch_rss')
    ) AS request_id;
  $$
);

-- Create a settings table to store configuration
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings (you'll need to update these with your actual values)
INSERT INTO app_settings (key, value, description) VALUES
  ('edge_function_url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1', 'Base URL for Edge Functions'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY', 'Service role key for authenticated requests')
ON CONFLICT (key) DO NOTHING;

-- Create a function to get settings
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
  SELECT value FROM app_settings WHERE key = setting_key;
$$ LANGUAGE SQL STABLE;

-- Set the custom settings for the current session
-- These will be used by the cron job
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET app.settings.edge_function_url = %L',
    current_database(),
    (SELECT value FROM app_settings WHERE key = 'edge_function_url')
  );
  EXECUTE format('ALTER DATABASE %I SET app.settings.service_role_key = %L',
    current_database(),
    (SELECT value FROM app_settings WHERE key = 'service_role_key')
  );
END $$;

-- Create a view to monitor cron job execution
CREATE OR REPLACE VIEW cron_job_status AS
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'fetch-rss-feeds';

-- Grant access to the view
GRANT SELECT ON cron_job_status TO postgres;

-- Create a table to log RSS fetch results
CREATE TABLE IF NOT EXISTS rss_fetch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('running', 'success', 'error')),
  sources_processed INTEGER DEFAULT 0,
  articles_added INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB
);

-- Create index on started_at for faster queries
CREATE INDEX IF NOT EXISTS idx_rss_fetch_logs_started_at ON rss_fetch_logs(started_at DESC);

-- Add comment
COMMENT ON TABLE rss_fetch_logs IS 'Logs of RSS feed fetch operations for monitoring and debugging';
