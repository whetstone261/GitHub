# Supabase Database Setup for Guided Gains

## ✅ Database Connection Status

**Supabase is CONNECTED and CONFIGURED**

- **Supabase URL:** `https://0ec90b57d6e95fcbda19832f.supabase.co`
- **Environment Variables:** Configured in `.env`
- **Auth:** Supabase Auth enabled
- **Database:** PostgreSQL with Row Level Security (RLS)

---

## 📊 Database Schema

### Tables Created

#### 1. **user_profiles_extended**
Stores complete user profiles, fitness information, and preferences.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (text, unique) - Links to Supabase Auth user
- `email` (text) - User's email address
- `name` (text) - User's display name
- `fitness_level` (text) - beginner, intermediate, advanced
- `goals` (text[]) - Array of fitness goals
- `equipment` (text) - none, basic, gym
- `available_equipment` (text[]) - Specific equipment list
- `workout_frequency` (integer) - Workouts per week (default: 3)
- `preferred_duration` (integer) - Minutes per workout (default: 30)
- `workout_days` (text[]) - Selected workout days
- `reminder_time` (text) - Daily reminder time (default: '09:00')
- `notifications_enabled` (boolean) - Notification preference
- `focus_areas` (text[]) - Workout focus areas
- `email_opt_in` (boolean) - Email notifications opt-in
- `email_frequency` (text) - daily, every_2_days, milestone_only
- `total_workouts_completed` (integer) - Total workout count
- `current_streak_days` (integer) - Current consecutive days
- `longest_streak_days` (integer) - Best streak ever
- `last_workout_date` (date) - Last workout completion
- `created_at` (timestamptz) - Account creation
- `updated_at` (timestamptz) - Last update

**RLS Policies:**
- ✅ Users can view own profile
- ✅ Users can insert own profile
- ✅ Users can update own profile

---

#### 2. **workout_completions**
Tracks individual workout completion records.

**Columns:**
- `id` (uuid, PK)
- `user_id` (text) - User who completed workout
- `workout_name` (text) - Name of workout
- `workout_category` (text) - Category (strength, cardio, etc.)
- `duration_minutes` (integer) - Workout duration
- `completed_at` (timestamptz) - When workout was completed
- `total_time_minutes` (integer) - Total time including rest
- `notes` (text) - User notes
- `workout_type` (text) - Type of workout
- `total_volume` (number) - Total volume/weight
- `progress_weight` (number) - Progress tracking weight
- `experience_level` (text) - User level at time
- `goal_focus` (text[]) - Goals for this workout
- `google_calendar_event_id` (text) - Calendar sync ID
- `google_calendar_synced` (boolean) - Sync status
- `created_at` (timestamptz)

**RLS Policies:**
- ✅ Users can view own completions
- ✅ Users can insert own completions
- ✅ Users can update own completions

---

#### 3. **exercise_logs**
Detailed logs of exercises within workouts.

**Columns:**
- `id` (uuid, PK)
- `workout_completion_id` (uuid, FK) - Links to workout
- `exercise_name` (text) - Name of exercise
- `exercise_category` (text) - Category
- `sets_completed` (integer) - Sets done
- `reps_completed` (integer) - Reps done
- `weight_used` (number) - Weight lifted
- `duration_seconds` (integer) - Duration
- `notes` (text) - Exercise notes
- `equipment_required` (text[]) - Equipment used
- `created_at` (timestamptz)

**RLS Policies:**
- ✅ Users can view own exercise logs
- ✅ Users can insert own exercise logs

---

#### 4. **saved_workout_plans**
Stores saved/generated workout plans.

**Columns:**
- `id` (uuid, PK)
- `user_id` (text) - User who owns plan
- `plan_name` (text) - Name of workout plan
- `plan_type` (text) - Type (AI-generated, custom, etc.)
- `target_muscle_groups` (text[]) - Muscle groups targeted
- `difficulty_level` (text) - Difficulty
- `estimated_duration` (integer) - Duration in minutes
- `exercises` (jsonb) - Full exercise details
- `equipment_needed` (text[]) - Required equipment
- `scheduled_date` (date) - When scheduled
- `status` (text) - active, completed, skipped
- `notes` (text) - Plan notes
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS Policies:**
- ✅ Users can view own workout plans
- ✅ Users can insert own workout plans
- ✅ Users can update own workout plans
- ✅ Users can delete own workout plans

---

#### 5. **user_milestones**
Tracks user achievements and milestones.

**Columns:**
- `id` (uuid, PK)
- `user_id` (text) - User who unlocked
- `milestone_type` (text) - Type of milestone
- `milestone_name` (text) - Display name
- `milestone_icon` (text) - Icon/emoji
- `unlocked_at` (timestamptz) - When unlocked
- `created_at` (timestamptz)

**RLS Policies:**
- ✅ Users can view own milestones
- ✅ Users can insert own milestones

---

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Auth is required for all operations
- Proper validation using `auth.uid()`

### Authentication
- **Method:** Supabase Auth (email/password)
- **Session Management:** Automatic token refresh
- **Security:** Industry-standard bcrypt password hashing

---

## 🔌 Connected Features

### ✅ Sign Up & Authentication
**Status:** CONNECTED

**Functions:**
- `signUp()` - Creates auth user + profile
- `signIn()` - Authenticates and loads profile
- `signOut()` - Logs out user
- `getCurrentUser()` - Checks active session
- `getUserProfile()` - Fetches user profile

**Flow:**
1. User signs up with email/password
2. Supabase Auth creates user account
3. Profile created in `user_profiles_extended`
4. All onboarding data saved
5. User authenticated and logged in

**Location:** `src/lib/supabase.ts`

---

### ✅ User Profile Management
**Status:** CONNECTED

**Saved Data:**
- ✅ Name, email
- ✅ Fitness level
- ✅ Goals
- ✅ Equipment access
- ✅ Workout preferences
- ✅ Notification settings
- ✅ Focus areas

**Auto-Load on Return:**
When user signs in, profile is loaded and user skips onboarding.

---

### ✅ Workout Completion Tracking
**Status:** CONNECTED

**Functions:**
- `logWorkoutCompletion()` - Saves workout
- `getWorkoutStats()` - Fetches stats
- `calculateStreak()` - Calculates streak
- `markWorkoutComplete()` - Updates workout status

**Tracked Metrics:**
- ✅ Total workouts completed
- ✅ Current streak days
- ✅ Longest streak
- ✅ Last workout date
- ✅ Individual exercise logs

**Location:** `src/lib/supabase.ts`

---

### ✅ Workout Plan Saving
**Status:** CONNECTED

**Functions:**
- Saves AI-generated plans
- Stores scheduled workouts
- Tracks workout status (active, completed, skipped)
- Persists exercise details

**Location:** `src/components/WorkoutPlanner.tsx`

---

### ✅ Progress Dashboard
**Status:** CONNECTED

**Features:**
- View workout history
- Track completion trends
- See milestone achievements
- Analyze workout patterns

**Location:** `src/components/ProgressDashboard.tsx`

---

## 📝 Migration Files

All migrations are located in `supabase/migrations/`:

1. ✅ `create_auth_and_user_profiles.sql` - Auth + profiles
2. ✅ `create_progress_and_email_system.sql` - Progress tracking
3. ✅ `create_saved_workout_plans.sql` - Workout plans
4. ✅ `enhance_workout_completions_system.sql` - Enhanced tracking
5. ✅ `fix_workout_completions_system.sql` - Completion fixes
6. ✅ `create_google_calendar_integration.sql` - Calendar sync
7. ✅ `add_workout_days_field.sql` - Workout days

---

## 🚀 Quick Start for Developers

### Environment Setup
Ensure `.env` contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Testing Auth
```typescript
import { signUp, signIn } from './lib/supabase';

// Sign up
const result = await signUp('test@example.com', 'password123', {
  name: 'Test User',
  fitness_level: 'beginner',
  // ... other profile data
});

// Sign in
const loginResult = await signIn('test@example.com', 'password123');
```

### Testing Workout Logging
```typescript
import { logWorkoutCompletion } from './lib/supabase';

await logWorkoutCompletion({
  user_id: userId,
  workout_name: 'Morning Cardio',
  workout_category: 'cardio',
  duration_minutes: 30,
  completed_at: new Date().toISOString()
});
```

---

## ✅ Verification Checklist

- [x] Supabase project created and connected
- [x] Environment variables configured
- [x] Database tables created
- [x] RLS policies enabled
- [x] Auth system integrated
- [x] Sign up saves to database
- [x] Sign in loads from database
- [x] Workout completions tracked
- [x] Progress stats calculated
- [x] Streak tracking functional
- [x] Workout plans saved
- [x] User profiles persisted

---

## 🎯 Status: FULLY CONNECTED

All database features are connected and functional. Users can:
- ✅ Sign up and create profiles
- ✅ Sign in and auto-load saved data
- ✅ Log workout completions
- ✅ Track progress and streaks
- ✅ Save workout plans
- ✅ View workout history
- ✅ Never re-answer onboarding questions

The application is production-ready with full database persistence!
