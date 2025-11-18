/*
  # Enhance Workout Completions Table

  ## Changes
  1. Add `workout_id` column for tracking workout plan references
  2. Add `exercises_completed` JSONB column for storing exercise details
  3. Add `completion_date` date column for easy calendar queries
  4. Add indexes for efficient calendar queries

  ## Purpose
  - Track completed workouts with full exercise details
  - Enable calendar display of workout completions by date
  - Support workout plan tracking
*/

-- Add new columns to workout_completions
DO $$
BEGIN
  -- Add workout_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'workout_id'
  ) THEN
    ALTER TABLE workout_completions 
    ADD COLUMN workout_id uuid;
  END IF;

  -- Add exercises_completed if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'exercises_completed'
  ) THEN
    ALTER TABLE workout_completions 
    ADD COLUMN exercises_completed jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add completion_date if it doesn't exist (for efficient calendar queries)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'completion_date'
  ) THEN
    ALTER TABLE workout_completions 
    ADD COLUMN completion_date date DEFAULT CURRENT_DATE NOT NULL;
  END IF;
END $$;

-- Create index on completion_date for fast calendar queries
CREATE INDEX IF NOT EXISTS idx_workout_completions_completion_date 
  ON workout_completions(user_id, completion_date DESC);

-- Create index on workout_id for plan tracking
CREATE INDEX IF NOT EXISTS idx_workout_completions_workout_id 
  ON workout_completions(workout_id);

-- Add comments
COMMENT ON COLUMN workout_completions.workout_id IS 'Optional reference to saved_workout_plans.id';
COMMENT ON COLUMN workout_completions.exercises_completed IS 'JSON array of exercises completed with details (name, sets, reps, weight, etc.)';
COMMENT ON COLUMN workout_completions.completion_date IS 'Date the workout was completed (for calendar display)';

-- Update existing rows to have completion_date based on completed_at
UPDATE workout_completions 
SET completion_date = DATE(completed_at)
WHERE completion_date IS NULL;
