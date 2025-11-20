/*
  # Add reminder_time field to user_stats table

  1. Changes
    - Add `reminder_time` column to `user_stats` table to store user's preferred workout reminder time
    - Default value is '09:00' (9:00 AM)
    - This field will be used by the Edit Fitness Profile feature

  2. Notes
    - Uses TIME format to store hour and minute (e.g., '09:00', '18:30')
    - No foreign key constraints needed
    - Existing records will get the default value
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN reminder_time TEXT DEFAULT '09:00';
  END IF;
END $$;
