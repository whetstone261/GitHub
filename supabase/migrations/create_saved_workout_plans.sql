/*
  # Saved Workout Plans and Calendar Integration

  1. New Tables
    - `saved_workout_plans`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - User who saved the plan
      - `plan_name` (text) - Name of the workout plan
      - `plan_description` (text) - Description
      - `duration_minutes` (integer) - Duration per workout
      - `difficulty` (text) - Difficulty level
      - `equipment` (text) - Equipment required
      - `category` (text) - Workout category
      - `is_weekly_plan` (boolean) - Whether it's a weekly plan
      - `start_date` (date, nullable) - When the plan starts
      - `plan_data` (jsonb) - Full plan data including exercises
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `saved_weekly_workouts`
      - `id` (uuid, primary key) - Unique identifier
      - `saved_plan_id` (uuid, foreign key) - References saved_workout_plans
      - `day_of_week` (text) - Day of the week (e.g., "Monday")
      - `workout_name` (text) - Name of the day's workout
      - `focus_area` (text) - Focus area for the day
      - `workout_data` (jsonb) - Exercise data for this day
      - `created_at` (timestamptz) - Creation timestamp

    - `workout_plan_completions`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - User who completed the workout
      - `saved_plan_id` (uuid, nullable, foreign key) - References saved plan if applicable
      - `workout_date` (date) - Date the workout was completed
      - `workout_name` (text) - Name of the completed workout
      - `day_of_week` (text, nullable) - Day if part of weekly plan
      - `completed_at` (timestamptz) - Completion timestamp
      - `notes` (text, nullable) - Optional notes
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Users can only access their own saved plans and completions

  3. Indexes
    - Add indexes for fast queries on user_id, dates, and plan relationships
*/

-- Create saved_workout_plans table
CREATE TABLE IF NOT EXISTS saved_workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  plan_name text NOT NULL,
  plan_description text,
  duration_minutes integer NOT NULL,
  difficulty text NOT NULL,
  equipment text NOT NULL,
  category text NOT NULL,
  is_weekly_plan boolean DEFAULT false,
  start_date date,
  plan_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_weekly_workouts table
CREATE TABLE IF NOT EXISTS saved_weekly_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_plan_id uuid NOT NULL REFERENCES saved_workout_plans(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  workout_name text NOT NULL,
  focus_area text,
  workout_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create workout_plan_completions table
CREATE TABLE IF NOT EXISTS workout_plan_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  saved_plan_id uuid REFERENCES saved_workout_plans(id) ON DELETE SET NULL,
  workout_date date NOT NULL,
  workout_name text NOT NULL,
  day_of_week text,
  completed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_weekly_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_completions ENABLE ROW LEVEL SECURITY;

-- Policies for saved_workout_plans
CREATE POLICY "Users can view own saved plans"
  ON saved_workout_plans FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own saved plans"
  ON saved_workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own saved plans"
  ON saved_workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own saved plans"
  ON saved_workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Policies for saved_weekly_workouts
CREATE POLICY "Users can view own weekly workouts"
  ON saved_weekly_workouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own weekly workouts"
  ON saved_weekly_workouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own weekly workouts"
  ON saved_weekly_workouts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own weekly workouts"
  ON saved_weekly_workouts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_workout_plans
      WHERE saved_workout_plans.id = saved_weekly_workouts.saved_plan_id
      AND saved_workout_plans.user_id = auth.uid()::text
    )
  );

-- Policies for workout_plan_completions
CREATE POLICY "Users can view own completions"
  ON workout_plan_completions FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own completions"
  ON workout_plan_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own completions"
  ON workout_plan_completions FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own completions"
  ON workout_plan_completions FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_plans_user_id ON saved_workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_plans_start_date ON saved_workout_plans(start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_workouts_plan_id ON saved_weekly_workouts(saved_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_completions_user_id ON workout_plan_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_completions_date ON workout_plan_completions(workout_date);
CREATE INDEX IF NOT EXISTS idx_plan_completions_plan_id ON workout_plan_completions(saved_plan_id);
