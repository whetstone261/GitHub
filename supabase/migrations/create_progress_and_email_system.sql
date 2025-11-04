/*
  # User Progress, Milestones, and Email System

  1. New Tables
    - `user_profiles_extended`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text, unique) - User ID reference
      - `email` (text, nullable) - User's email address
      - `email_opt_in` (boolean) - Whether user opted in for emails
      - `email_frequency` (text) - daily, every_2_days, milestone_only
      - `total_workouts_completed` (integer) - Total workout count
      - `current_streak_days` (integer) - Current consecutive days
      - `longest_streak_days` (integer) - Best streak ever
      - `last_workout_date` (date, nullable) - Last workout completion date
      - `created_at` (timestamptz) - Account creation date
      - `updated_at` (timestamptz) - Last update timestamp

    - `user_milestones`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - User who unlocked the milestone
      - `milestone_type` (text) - Type of milestone (first_workout, streak_5, workouts_10, etc.)
      - `milestone_name` (text) - Display name
      - `milestone_icon` (text) - Emoji or icon
      - `unlocked_at` (timestamptz) - When it was unlocked
      - `created_at` (timestamptz) - Record creation timestamp

    - `email_queue`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - User to send email to
      - `email_type` (text) - daily_reminder, missed_workout, milestone_celebration
      - `email_subject` (text) - Email subject line
      - `email_body` (text) - Email content
      - `scheduled_for` (timestamptz) - When to send
      - `sent_at` (timestamptz, nullable) - When it was sent
      - `status` (text) - pending, sent, failed
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Email queue is read-only for users

  3. Indexes
    - Add indexes for fast queries on user_id and dates
*/

-- Create user_profiles_extended table
CREATE TABLE IF NOT EXISTS user_profiles_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  email text,
  email_opt_in boolean DEFAULT false,
  email_frequency text DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'every_2_days', 'milestone_only')),
  total_workouts_completed integer DEFAULT 0,
  current_streak_days integer DEFAULT 0,
  longest_streak_days integer DEFAULT 0,
  last_workout_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_milestones table
CREATE TABLE IF NOT EXISTS user_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  milestone_type text NOT NULL,
  milestone_name text NOT NULL,
  milestone_icon text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, milestone_type)
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('daily_reminder', 'missed_workout', 'milestone_celebration')),
  email_subject text NOT NULL,
  email_body text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles_extended
CREATE POLICY "Users can view own profile"
  ON user_profiles_extended FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles_extended FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles_extended FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policies for user_milestones
CREATE POLICY "Users can view own milestones"
  ON user_milestones FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert milestones"
  ON user_milestones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Policies for email_queue (read-only for users)
CREATE POLICY "Users can view own queued emails"
  ON email_queue FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_workout ON user_profiles_extended(last_workout_date);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_unlocked_at ON user_milestones(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);

-- Function to update user progress after workout completion
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_user_profile RECORD;
  v_days_since_last INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Get current user profile
  SELECT * INTO v_user_profile
  FROM user_profiles_extended
  WHERE user_id = NEW.user_id;

  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_profiles_extended (user_id, email_opt_in)
    VALUES (NEW.user_id, false)
    RETURNING * INTO v_user_profile;
  END IF;

  -- Calculate days since last workout
  IF v_user_profile.last_workout_date IS NULL THEN
    v_days_since_last := 999; -- First workout
  ELSE
    v_days_since_last := NEW.workout_date - v_user_profile.last_workout_date;
  END IF;

  -- Calculate new streak
  IF v_days_since_last <= 1 THEN
    v_new_streak := v_user_profile.current_streak_days + 1;
  ELSE
    v_new_streak := 1; -- Reset streak
  END IF;

  -- Update user profile
  UPDATE user_profiles_extended
  SET
    total_workouts_completed = v_user_profile.total_workouts_completed + 1,
    current_streak_days = v_new_streak,
    longest_streak_days = GREATEST(v_user_profile.longest_streak_days, v_new_streak),
    last_workout_date = NEW.workout_date,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Check and unlock milestones
  PERFORM check_and_unlock_milestones(NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock milestones
CREATE OR REPLACE FUNCTION check_and_unlock_milestones(p_user_id text)
RETURNS void AS $$
DECLARE
  v_profile RECORD;
  v_milestone_exists boolean;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile
  FROM user_profiles_extended
  WHERE user_id = p_user_id;

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

-- Trigger to update progress when workout is completed
CREATE TRIGGER trigger_update_user_progress
  AFTER INSERT ON workout_plan_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress();