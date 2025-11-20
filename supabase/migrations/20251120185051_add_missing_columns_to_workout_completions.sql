/*
  # Add missing columns to workout_completions table

  1. New Columns
    - `start_time` (timestamptz) - When the workout started
    - `progress_weight` (numeric) - Weight for progress calculations
    - `experience_level` (text) - User's fitness level at completion
    - `goal_focus` (text[]) - User's focus goals for the workout
    - `google_calendar_sync_error` (text) - Error message if sync fails

  2. Notes
    - All columns are nullable to support existing records
    - These columns are used by the saveEnhancedWorkoutCompletion function
    - Ensures compatibility with the existing codebase
*/

-- Add start_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN start_time timestamptz;
  END IF;
END $$;

-- Add progress_weight column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'progress_weight'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN progress_weight numeric;
  END IF;
END $$;

-- Add experience_level column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN experience_level text;
  END IF;
END $$;

-- Add goal_focus column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'goal_focus'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN goal_focus text[] DEFAULT '{}';
  END IF;
END $$;

-- Add google_calendar_sync_error column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'google_calendar_sync_error'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN google_calendar_sync_error text;
  END IF;
END $$;

-- Add index on start_time for potential queries
CREATE INDEX IF NOT EXISTS idx_workout_completions_start_time ON workout_completions(start_time);
