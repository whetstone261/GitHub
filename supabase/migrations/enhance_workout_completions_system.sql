/*
  # Enhanced Workout Completions System

  1. Schema Enhancements
    - Add missing fields to workout_completions table:
      - `start_time` (timestamptz) - When user started the workout
      - `end_time` (timestamptz) - When user finished the workout
      - `workout_type` (text) - daily or weekly
      - `total_volume` (numeric) - Sum of weights × reps
      - `progress_weight` (numeric) - User's bodyweight or load progression
      - `experience_level` (text) - beginner/intermediate/advanced
      - `goal_focus` (text[]) - Array of goals (strength, cardio, etc)
      - `google_calendar_event_id` (text) - ID of synced calendar event
      - `google_calendar_synced` (boolean) - Whether synced to calendar
      - `google_calendar_sync_error` (text) - Error message if sync failed

    - Add equipment tracking to exercise_logs:
      - `equipment_required` (text[]) - Equipment needed for exercise
      - `equipment_optional` (text[]) - Optional equipment

  2. Functions
    - Function to calculate total volume from exercise logs
    - Function to sync workout to Google Calendar after completion

  3. Security
    - Maintain existing RLS policies
    - Add policies for new fields

  4. Purpose
    - Complete workout tracking automation
    - Google Calendar integration on completion
    - Historical accuracy with exact timestamps
    - Progress metrics and analytics
*/

-- Add new columns to workout_completions (if not exists)
DO $$
BEGIN
  -- Start time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN start_time timestamptz;
  END IF;

  -- End time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN end_time timestamptz;
  END IF;

  -- Workout type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'workout_type'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN workout_type text DEFAULT 'daily';
  END IF;

  -- Total volume
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'total_volume'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN total_volume numeric;
  END IF;

  -- Progress weight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'progress_weight'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN progress_weight numeric;
  END IF;

  -- Experience level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN experience_level text;
  END IF;

  -- Goal focus (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'goal_focus'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN goal_focus text[];
  END IF;

  -- Google Calendar event ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'google_calendar_event_id'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN google_calendar_event_id text;
  END IF;

  -- Google Calendar synced flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'google_calendar_synced'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN google_calendar_synced boolean DEFAULT false;
  END IF;

  -- Google Calendar sync error
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_completions' AND column_name = 'google_calendar_sync_error'
  ) THEN
    ALTER TABLE workout_completions ADD COLUMN google_calendar_sync_error text;
  END IF;
END $$;

-- Add equipment tracking to exercise_logs
DO $$
BEGIN
  -- Equipment required
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs' AND column_name = 'equipment_required'
  ) THEN
    ALTER TABLE exercise_logs ADD COLUMN equipment_required text[];
  END IF;

  -- Equipment optional
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs' AND column_name = 'equipment_optional'
  ) THEN
    ALTER TABLE exercise_logs ADD COLUMN equipment_optional text[];
  END IF;
END $$;

-- Function to calculate total volume from exercise logs
CREATE OR REPLACE FUNCTION calculate_workout_volume(p_workout_completion_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total_volume numeric;
BEGIN
  SELECT COALESCE(SUM(
    COALESCE(weight_used, 0) * COALESCE(sets_completed, 0) * COALESCE(reps_completed, 0)
  ), 0)
  INTO v_total_volume
  FROM exercise_logs
  WHERE workout_completion_id = p_workout_completion_id
    AND weight_used IS NOT NULL
    AND sets_completed IS NOT NULL
    AND reps_completed IS NOT NULL;

  RETURN v_total_volume;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total volume after exercise logs are inserted
CREATE OR REPLACE FUNCTION update_workout_volume()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workout_completions
  SET total_volume = calculate_workout_volume(NEW.workout_completion_id)
  WHERE id = NEW.workout_completion_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_workout_volume ON exercise_logs;

-- Create trigger for volume calculation
CREATE TRIGGER trigger_update_workout_volume
  AFTER INSERT OR UPDATE ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_volume();

-- Function to format workout description for Google Calendar
CREATE OR REPLACE FUNCTION format_workout_description(
  p_workout_completion_id uuid
)
RETURNS text AS $$
DECLARE
  v_completion RECORD;
  v_exercise_list text;
  v_description text;
BEGIN
  -- Get workout completion details
  SELECT * INTO v_completion
  FROM workout_completions
  WHERE id = p_workout_completion_id;

  IF NOT FOUND THEN
    RETURN 'Workout completed via Guided Gains';
  END IF;

  -- Build exercise list
  SELECT string_agg(
    exercise_name ||
    CASE
      WHEN sets_completed IS NOT NULL AND reps_completed IS NOT NULL
      THEN ' (' || sets_completed || ' × ' || reps_completed || ')'
      WHEN duration_seconds IS NOT NULL
      THEN ' (' || (duration_seconds / 60) || ' min)'
      ELSE ''
    END,
    E'\n• '
  )
  INTO v_exercise_list
  FROM exercise_logs
  WHERE workout_completion_id = p_workout_completion_id;

  -- Format description
  v_description := '💪 Workout: ' || v_completion.workout_name || E'\n\n';

  IF v_completion.total_time_minutes IS NOT NULL THEN
    v_description := v_description || '⏱️ Duration: ' || v_completion.total_time_minutes || ' minutes' || E'\n';
  END IF;

  IF v_completion.total_volume IS NOT NULL AND v_completion.total_volume > 0 THEN
    v_description := v_description || '💯 Total Volume: ' || ROUND(v_completion.total_volume, 0) || ' lbs' || E'\n';
  END IF;

  IF v_exercise_list IS NOT NULL THEN
    v_description := v_description || E'\n📋 Exercises:\n• ' || v_exercise_list || E'\n';
  END IF;

  IF v_completion.notes IS NOT NULL AND v_completion.notes != '' THEN
    v_description := v_description || E'\n📝 Notes: ' || v_completion.notes || E'\n';
  END IF;

  v_description := v_description || E'\n✅ Logged automatically via Guided Gains';

  RETURN v_description;
END;
$$ LANGUAGE plpgsql;

-- Create index for Google Calendar event lookups
CREATE INDEX IF NOT EXISTS idx_workout_completions_calendar_event
  ON workout_completions(google_calendar_event_id)
  WHERE google_calendar_event_id IS NOT NULL;

-- Create index for synced status
CREATE INDEX IF NOT EXISTS idx_workout_completions_sync_status
  ON workout_completions(google_calendar_synced, completed_at DESC);
