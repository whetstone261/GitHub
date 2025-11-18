/*
  # Create Authentication and User Profiles System

  1. Schema Changes
    - Add user profile fields to user_profiles_extended table
      - `name` (text) - User's display name
      - `fitness_level` (text) - beginner, intermediate, advanced
      - `goals` (text[]) - Array of fitness goals
      - `equipment` (text) - none, basic, gym
      - `available_equipment` (text[]) - Specific equipment available
      - `workout_frequency` (integer) - Workouts per week
      - `preferred_duration` (integer) - Minutes per workout
      - `workout_days` (text[]) - Selected workout days
      - `reminder_time` (text) - Daily reminder time
      - `notifications_enabled` (boolean) - Notification preference
      - `focus_areas` (text[]) - Workout focus areas

  2. Purpose
    - Store complete user profile from onboarding
    - Enable authentication with Supabase Auth
    - Persist user preferences and settings
    - Allow seamless return without re-onboarding

  3. Security
    - RLS policies ensure users only access their own data
    - Auth users automatically linked to profiles
    - Secure profile creation on sign up
*/

-- Add profile fields to user_profiles_extended
ALTER TABLE user_profiles_extended
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS fitness_level text CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment text CHECK (equipment IN ('none', 'basic', 'gym')),
ADD COLUMN IF NOT EXISTS available_equipment text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS workout_frequency integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS preferred_duration integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS workout_days text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reminder_time text DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS focus_areas text[] DEFAULT '{}';

-- Update RLS policies to work with auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles_extended;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles_extended;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles_extended;

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

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_extended_user_id
  ON user_profiles_extended(user_id);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles_extended.name IS 'User display name';
COMMENT ON COLUMN user_profiles_extended.fitness_level IS 'User fitness experience level';
COMMENT ON COLUMN user_profiles_extended.goals IS 'Array of user fitness goals';
COMMENT ON COLUMN user_profiles_extended.equipment IS 'Equipment category (none, basic, gym)';
COMMENT ON COLUMN user_profiles_extended.available_equipment IS 'Specific equipment user has access to';
COMMENT ON COLUMN user_profiles_extended.workout_frequency IS 'Target workouts per week';
COMMENT ON COLUMN user_profiles_extended.preferred_duration IS 'Preferred workout duration in minutes';
COMMENT ON COLUMN user_profiles_extended.workout_days IS 'Selected days for weekly workouts';
