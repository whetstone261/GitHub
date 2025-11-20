/*
  # Create planned_workouts table

  1. New Tables
    - `planned_workouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, required, foreign key to auth.users)
      - `date` (date, required) - Scheduled calendar date for the workout
      - `workout_plan` (jsonb) - AI-generated workout plan for that day
      - `workout_name` (text) - Name of the planned workout
      - `duration_minutes` (integer) - Expected duration
      - `focus_area` (text) - Focus area (upper-body, lower-body, etc.)
      - `is_completed` (boolean, default false) - Track if workout was completed
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `planned_workouts` table
    - Add policy for users to view their own planned workouts
    - Add policy for users to insert their own planned workouts
    - Add policy for users to update their own planned workouts
    - Add policy for users to delete their own planned workouts

  3. Indexes
    - Index on user_id for faster user-specific queries
    - Index on date for calendar view queries
    - Composite index on (user_id, date) for optimal performance

  4. Notes
    - This table stores AI-generated weekly plans before completion
    - Used for displaying scheduled workouts on the calendar
    - Linked to actual completions via the workout_calendar table
*/

CREATE TABLE IF NOT EXISTS planned_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  workout_plan jsonb DEFAULT '{}'::jsonb,
  workout_name text,
  duration_minutes integer,
  focus_area text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own planned workouts"
  ON planned_workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planned workouts"
  ON planned_workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned workouts"
  ON planned_workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned workouts"
  ON planned_workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_id ON planned_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_date ON planned_workouts(date);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_date ON planned_workouts(user_id, date);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_planned_workouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_planned_workouts_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_planned_workouts_updated_at_trigger
      BEFORE UPDATE ON planned_workouts
      FOR EACH ROW
      EXECUTE FUNCTION update_planned_workouts_updated_at();
  END IF;
END $$;
