/*
  # Create Clean Relational Database Schema for Guided Gains

  ## Overview
  This migration creates a clean, relational database structure for user authentication,
  profiles, and onboarding data. The schema is designed for optimal querying and data integrity.

  ## Tables Created

  ### 1. profiles
  Stores core user profile information linked to Supabase Auth
  
  ### 2. onboarding_preferences
  Stores all user onboarding and fitness preference data
  
  ### 3. user_stats
  Aggregated user statistics and achievements
  
  ### 4. workout_completions
  Tracks individual workout completion records
  
  ### 5. exercise_logs
  Detailed logs of exercises within workouts
  
  ### 6. saved_workout_plans
  Stores saved and scheduled workout plans
  
  ### 7. user_milestones
  Tracks user achievements and milestones

  ## Security
  - All tables have Row Level Security (RLS) enabled
  - Users can only access their own data
  - Policies use auth.uid() for secure authentication checks
  - Foreign key constraints ensure data integrity
*/

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

COMMENT ON TABLE profiles IS 'Core user profile information linked to Supabase Auth';

-- ============================================================================
-- 2. ONBOARDING_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fitness_level text CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals text[] DEFAULT '{}' NOT NULL,
  equipment_access text CHECK (equipment_access IN ('none', 'basic', 'gym')),
  available_equipment text[] DEFAULT '{}' NOT NULL,
  workout_frequency integer DEFAULT 3 CHECK (workout_frequency >= 1 AND workout_frequency <= 7),
  preferred_duration integer DEFAULT 30 CHECK (preferred_duration >= 10 AND preferred_duration <= 180),
  workout_days text[] DEFAULT '{}' NOT NULL,
  focus_areas text[] DEFAULT '{}' NOT NULL,
  reminder_time text DEFAULT '09:00' NOT NULL,
  notifications_enabled boolean DEFAULT true NOT NULL,
  email_opt_in boolean DEFAULT false NOT NULL,
  email_frequency text DEFAULT 'milestone_only' CHECK (email_frequency IN ('daily', 'every_2_days', 'milestone_only')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON onboarding_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON onboarding_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON onboarding_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_user_id ON onboarding_preferences(user_id);

COMMENT ON TABLE onboarding_preferences IS 'User onboarding and fitness preference data';

-- ============================================================================
-- 3. USER_STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_workouts_completed integer DEFAULT 0 NOT NULL,
  current_streak_days integer DEFAULT 0 NOT NULL,
  longest_streak_days integer DEFAULT 0 NOT NULL,
  last_workout_date date,
  total_exercise_time_minutes integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_stats IS 'Aggregated user statistics and achievements';

-- ============================================================================
-- 4. WORKOUT_COMPLETIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workout_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_name text NOT NULL,
  workout_category text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  completed_at timestamptz DEFAULT now() NOT NULL,
  total_time_minutes integer,
  notes text,
  workout_type text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout completions"
  ON workout_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout completions"
  ON workout_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout completions"
  ON workout_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_completions_user_id ON workout_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_completions_completed_at ON workout_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_date ON workout_completions(user_id, completed_at DESC);

COMMENT ON TABLE workout_completions IS 'Individual workout completion records';

-- ============================================================================
-- 5. EXERCISE_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_completion_id uuid NOT NULL REFERENCES workout_completions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  exercise_category text,
  sets_completed integer,
  reps_completed integer,
  weight_used numeric,
  duration_seconds integer,
  notes text,
  equipment_required text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise logs"
  ON exercise_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs"
  ON exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_id ON exercise_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_id ON exercise_logs(workout_completion_id);

COMMENT ON TABLE exercise_logs IS 'Detailed logs of exercises within workouts';

-- ============================================================================
-- 6. SAVED_WORKOUT_PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  plan_type text DEFAULT 'custom',
  target_muscle_groups text[] DEFAULT '{}',
  difficulty_level text,
  estimated_duration integer,
  exercises jsonb DEFAULT '[]'::jsonb NOT NULL,
  equipment_needed text[] DEFAULT '{}',
  scheduled_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE saved_workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout plans"
  ON saved_workout_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON saved_workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON saved_workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON saved_workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_workout_plans_user_id ON saved_workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_workout_plans_scheduled_date ON saved_workout_plans(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_saved_workout_plans_status ON saved_workout_plans(status);

COMMENT ON TABLE saved_workout_plans IS 'Saved and scheduled workout plans';

-- ============================================================================
-- 7. USER_MILESTONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type text NOT NULL,
  milestone_name text NOT NULL,
  milestone_icon text,
  unlocked_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
  ON user_milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON user_milestones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_unlocked_at ON user_milestones(unlocked_at DESC);

COMMENT ON TABLE user_milestones IS 'User achievements and milestone tracking';

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_preferences_updated_at
  BEFORE UPDATE ON onboarding_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_workout_plans_updated_at
  BEFORE UPDATE ON saved_workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_stats_on_profile_creation
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_stats();
