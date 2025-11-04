/*
  # Fix Workout Completions System

  1. New Tables
    - `workout_completions`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - User who completed the workout
      - `workout_name` (text) - Name of the workout
      - `workout_category` (text) - Category (strength, cardio, etc)
      - `duration_minutes` (integer) - Planned duration
      - `total_time_minutes` (integer, nullable) - Actual time taken
      - `completed_at` (timestamptz) - When completed
      - `notes` (text, nullable) - Optional notes
      - `created_at` (timestamptz) - Record creation

    - `exercise_logs`
      - `id` (uuid, primary key) - Unique identifier
      - `workout_completion_id` (uuid, foreign key) - References workout_completions
      - `exercise_name` (text) - Exercise name
      - `exercise_category` (text) - Exercise category
      - `sets_completed` (integer, nullable) - Sets done
      - `reps_completed` (integer, nullable) - Reps per set
      - `weight_used` (numeric, nullable) - Weight used
      - `duration_seconds` (integer, nullable) - Duration for cardio
      - `notes` (text, nullable) - Exercise notes
      - `created_at` (timestamptz) - Record creation

  2. Functions
    - Trigger function to auto-update progress when workout is saved
    - Helper function to calculate streaks
    - Function to check and unlock milestones

  3. Security
    - Enable RLS on all tables
    - Users can only access their own data

  4. Fixes
    - Ensures workout completions trigger progress updates
    - Properly handles both workout_completions and workout_plan_completions
    - Fixes streak calculation logic
*/

-- Create workout_completions table
CREATE TABLE IF NOT EXISTS workout_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  workout_name text NOT NULL,
  workout_category text NOT NULL,
  duration_minutes integer NOT NULL,
  total_time_minutes integer,
  completed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create exercise_logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_completion_id uuid NOT NULL REFERENCES workout_completions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  exercise_category text NOT NULL,
  sets_completed integer,
  reps_completed integer,
  weight_used numeric,
  duration_seconds integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Policies for workout_completions
CREATE POLICY "Users can view own workout completions"
  ON workout_completions FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workout completions"
  ON workout_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workout completions"
  ON workout_completions FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workout completions"
  ON workout_completions FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Policies for exercise_logs
CREATE POLICY "Users can view own exercise logs"
  ON exercise_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_completions
      WHERE workout_completions.id = exercise_logs.workout_completion_id
      AND workout_completions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own exercise logs"
  ON exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_completions
      WHERE workout_completions.id = exercise_logs.workout_completion_id
      AND workout_completions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own exercise logs"
  ON exercise_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_completions
      WHERE workout_completions.id = exercise_logs.workout_completion_id
      AND workout_completions.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_completions
      WHERE workout_completions.id = exercise_logs.workout_completion_id
      AND workout_completions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own exercise logs"
  ON exercise_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_completions
      WHERE workout_completions.id = exercise_logs.workout_completion_id
      AND workout_completions.user_id = auth.uid()::text
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_id ON workout_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_completions_completed_at ON workout_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_id ON exercise_logs(workout_completion_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_user_progress ON workout_plan_completions;
DROP TRIGGER IF EXISTS trigger_update_user_progress_from_completions ON workout_completions;

-- Drop and recreate the update_user_progress function with fixes
DROP FUNCTION IF EXISTS update_user_progress();

CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_user_profile RECORD;
  v_days_since_last INTEGER;
  v_new_streak INTEGER;
  v_workout_date DATE;
BEGIN
  -- Determine the workout date based on the table
  IF TG_TABLE_NAME = 'workout_completions' THEN
    v_workout_date := DATE(NEW.completed_at);
  ELSE
    v_workout_date := NEW.workout_date;
  END IF;

  -- Get or create user profile
  SELECT * INTO v_user_profile
  FROM user_profiles_extended
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_profiles_extended (user_id, email_opt_in, total_workouts_completed, current_streak_days, longest_streak_days)
    VALUES (NEW.user_id, false, 0, 0, 0)
    RETURNING * INTO v_user_profile;
  END IF;

  -- Calculate days since last workout
  IF v_user_profile.last_workout_date IS NULL THEN
    v_days_since_last := 999;
  ELSE
    v_days_since_last := v_workout_date - v_user_profile.last_workout_date;
  END IF;

  -- Calculate new streak (workouts on same day don't increase streak)
  IF v_days_since_last = 0 THEN
    v_new_streak := v_user_profile.current_streak_days;
  ELSIF v_days_since_last = 1 THEN
    v_new_streak := v_user_profile.current_streak_days + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- Update user profile
  UPDATE user_profiles_extended
  SET
    total_workouts_completed = CASE
      WHEN v_days_since_last = 0 THEN v_user_profile.total_workouts_completed + 1
      ELSE v_user_profile.total_workouts_completed + 1
    END,
    current_streak_days = v_new_streak,
    longest_streak_days = GREATEST(v_user_profile.longest_streak_days, v_new_streak),
    last_workout_date = CASE
      WHEN v_workout_date > COALESCE(v_user_profile.last_workout_date, v_workout_date) THEN v_workout_date
      ELSE v_user_profile.last_workout_date
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Check and unlock milestones
  PERFORM check_and_unlock_milestones(NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate check_and_unlock_milestones with fixes
DROP FUNCTION IF EXISTS check_and_unlock_milestones(text);

CREATE OR REPLACE FUNCTION check_and_unlock_milestones(p_user_id text)
RETURNS void AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile
  FROM user_profiles_extended
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- First Workout
  IF v_profile.total_workouts_completed >= 1 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'first_workout', 'First Workout!', '🥇')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 5 Workouts
  IF v_profile.total_workouts_completed >= 5 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'workouts_5', '5 Workouts Done!', '💪')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 10 Workouts
  IF v_profile.total_workouts_completed >= 10 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'workouts_10', '10 Workouts Done!', '💯')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 25 Workouts
  IF v_profile.total_workouts_completed >= 25 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'workouts_25', '25 Workouts Done!', '🌟')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 50 Workouts
  IF v_profile.total_workouts_completed >= 50 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'workouts_50', '50 Workouts Done!', '🏆')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 5-Day Streak
  IF v_profile.current_streak_days >= 5 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'streak_5', '5-Day Streak!', '🔥')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 10-Day Streak
  IF v_profile.current_streak_days >= 10 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'streak_10', '10-Day Streak!', '🔥🔥')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 30-Day Consistency
  IF v_profile.current_streak_days >= 30 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_name, milestone_icon)
    VALUES (p_user_id, 'streak_30', '30-Day Consistency!', '🚀')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both workout tables
CREATE TRIGGER trigger_update_user_progress_from_completions
  AFTER INSERT ON workout_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress();

CREATE TRIGGER trigger_update_user_progress_from_plan_completions
  AFTER INSERT ON workout_plan_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress();
