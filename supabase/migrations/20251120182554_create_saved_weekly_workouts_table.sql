/*
  # Create saved_weekly_workouts table

  1. New Tables
    - `saved_weekly_workouts`
      - `id` (uuid, primary key)
      - `saved_plan_id` (uuid, foreign key to saved_workout_plans)
      - `day_of_week` (text) - Day name (Monday, Tuesday, etc.)
      - `scheduled_date` (date) - Actual calendar date for this workout
      - `workout_name` (text) - Name of the workout
      - `focus_area` (text) - Focus area (upper-body, lower-body, etc.)
      - `workout_data` (jsonb) - Full workout details including exercises
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_weekly_workouts` table
    - Add policy for users to read their own weekly workouts
    - Add policy for users to insert their own weekly workouts
    - Add policy for users to update their own weekly workouts
    - Add policy for users to delete their own weekly workouts

  3. Indexes
    - Index on saved_plan_id for faster lookups
    - Index on scheduled_date for calendar queries
*/

CREATE TABLE IF NOT EXISTS saved_weekly_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_plan_id uuid REFERENCES saved_workout_plans(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  scheduled_date date,
  workout_name text NOT NULL,
  focus_area text,
  workout_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_weekly_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own weekly workouts"
  ON saved_weekly_workouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own weekly workouts"
  ON saved_weekly_workouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own weekly workouts"
  ON saved_weekly_workouts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own weekly workouts"
  ON saved_weekly_workouts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_weekly_workouts_plan_id ON saved_weekly_workouts(saved_plan_id);
CREATE INDEX IF NOT EXISTS idx_saved_weekly_workouts_scheduled_date ON saved_weekly_workouts(scheduled_date);
