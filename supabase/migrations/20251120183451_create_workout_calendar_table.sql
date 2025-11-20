/*
  # Create workout_calendar table

  1. New Tables
    - `workout_calendar`
      - `id` (uuid, primary key)
      - `user_id` (uuid, required, foreign key to auth.users)
      - `date` (date, required) - Actual calendar date of the workout
      - `workout_name` (text) - Name of the completed workout
      - `duration_minutes` (integer) - Duration of the workout
      - `exercises` (jsonb) - List of exercises performed with details
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `workout_calendar` table
    - Add policy for users to view their own completed workouts
    - Add policy for users to insert their own completed workouts
    - Add policy for users to update their own completed workouts
    - Add policy for users to delete their own completed workouts

  3. Indexes
    - Index on user_id for faster user-specific queries
    - Index on date for calendar view queries
    - Composite index on (user_id, date) for optimal performance

  4. Notes
    - This table stores actual completed workouts tied to calendar dates
    - Used for calendar display and workout history tracking
*/

CREATE TABLE IF NOT EXISTS workout_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  workout_name text,
  duration_minutes integer,
  exercises jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workout_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own completed workouts"
  ON workout_calendar FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed workouts"
  ON workout_calendar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completed workouts"
  ON workout_calendar FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completed workouts"
  ON workout_calendar FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_calendar_user_id ON workout_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_calendar_date ON workout_calendar(date);
CREATE INDEX IF NOT EXISTS idx_workout_calendar_user_date ON workout_calendar(user_id, date);
