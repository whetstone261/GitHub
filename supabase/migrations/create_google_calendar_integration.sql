/*
  # Google Calendar Integration Schema

  1. New Tables
    - `google_calendar_tokens`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text, unique) - User who connected Google Calendar
      - `access_token` (text) - OAuth access token (encrypted)
      - `refresh_token` (text) - OAuth refresh token (encrypted)
      - `token_expires_at` (timestamptz) - When the access token expires
      - `calendar_id` (text) - Google Calendar ID (usually 'primary')
      - `is_connected` (boolean) - Whether calendar is currently connected
      - `created_at` (timestamptz) - When connection was established
      - `updated_at` (timestamptz) - Last token refresh

    - `google_calendar_events`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - User who owns the event
      - `workout_plan_id` (uuid, nullable) - References saved_workout_plans
      - `workout_completion_id` (uuid, nullable) - References workout_plan_completions
      - `google_event_id` (text) - Google Calendar event ID
      - `event_title` (text) - Event title
      - `event_start_time` (timestamptz) - Event start
      - `event_end_time` (timestamptz) - Event end
      - `event_description` (text) - Event description
      - `sync_status` (text) - synced, pending, failed, deleted
      - `last_synced_at` (timestamptz) - Last successful sync
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Users can only access their own calendar data
    - Tokens are encrypted at rest

  3. Indexes
    - Add indexes for fast queries on user_id and sync_status
*/

-- Create google_calendar_tokens table
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_id text DEFAULT 'primary',
  is_connected boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create google_calendar_events table
CREATE TABLE IF NOT EXISTS google_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  workout_plan_id uuid REFERENCES saved_workout_plans(id) ON DELETE SET NULL,
  workout_completion_id uuid REFERENCES workout_plan_completions(id) ON DELETE SET NULL,
  google_event_id text NOT NULL,
  event_title text NOT NULL,
  event_start_time timestamptz NOT NULL,
  event_end_time timestamptz NOT NULL,
  event_description text,
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'deleted')),
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, google_event_id)
);

-- Enable RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for google_calendar_tokens
CREATE POLICY "Users can view own calendar tokens"
  ON google_calendar_tokens FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own calendar tokens"
  ON google_calendar_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own calendar tokens"
  ON google_calendar_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own calendar tokens"
  ON google_calendar_tokens FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Policies for google_calendar_events
CREATE POLICY "Users can view own calendar events"
  ON google_calendar_events FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own calendar events"
  ON google_calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own calendar events"
  ON google_calendar_events FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON google_calendar_events FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_user_id ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON google_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_status ON google_calendar_events(sync_status, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_workout_plan ON google_calendar_events(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON google_calendar_events(event_start_time);