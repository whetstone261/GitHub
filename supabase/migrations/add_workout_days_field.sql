/*
  # Add Workout Days Selection Field

  1. Schema Changes
    - Add `workout_days` field to user profiles
      - `workout_days` (text[]) - Array of selected days ["Monday", "Wednesday", "Friday"]

  2. Purpose
    - Allow users to select specific days for weekly workout scheduling
    - Integration with workout plan generation
    - Calendar sync for selected days only

  3. Notes
    - Days stored as full day names (Monday, Tuesday, etc.)
    - Empty array means no preference (use frequency instead)
    - Default to empty array for existing users
*/

-- Add workout_days column to user_profiles_extended table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles_extended' AND column_name = 'workout_days'
  ) THEN
    ALTER TABLE user_profiles_extended
    ADD COLUMN workout_days text[] DEFAULT '{}';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN user_profiles_extended.workout_days IS
  'Array of selected workout days (e.g., ["Monday", "Wednesday", "Friday"]). Empty array means user prefers frequency-based scheduling.';

-- Create index for querying by workout days
CREATE INDEX IF NOT EXISTS idx_user_profiles_workout_days
  ON user_profiles_extended USING GIN (workout_days);
