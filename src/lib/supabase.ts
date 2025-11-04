import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables not configured. Database features will be disabled.');
}

export { supabase };

export interface WorkoutCompletion {
  id?: string;
  user_id: string;
  workout_name: string;
  workout_category: string;
  duration_minutes: number;
  completed_at?: string;
  total_time_minutes?: number;
  notes?: string;
  created_at?: string;
}

export interface ExerciseLog {
  id?: string;
  workout_completion_id: string;
  exercise_name: string;
  exercise_category: string;
  sets_completed?: number;
  reps_completed?: number;
  weight_used?: number;
  duration_seconds?: number;
  notes?: string;
  created_at?: string;
}

export async function saveWorkoutCompletion(
  userId: string,
  workoutName: string,
  workoutCategory: string,
  durationMinutes: number,
  totalTimeMinutes?: number,
  notes?: string
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: userId,
        workout_name: workoutName,
        workout_category: workoutCategory,
        duration_minutes: durationMinutes,
        total_time_minutes: totalTimeMinutes,
        notes: notes,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving workout completion:', error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('Exception saving workout:', err);
    return null;
  }
}

export async function saveExerciseLogs(
  workoutCompletionId: string,
  exercises: ExerciseLog[]
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  try {
    const logsToInsert = exercises.map(ex => ({
      workout_completion_id: workoutCompletionId,
      exercise_name: ex.exercise_name,
      exercise_category: ex.exercise_category,
      sets_completed: ex.sets_completed,
      reps_completed: ex.reps_completed,
      weight_used: ex.weight_used,
      duration_seconds: ex.duration_seconds,
      notes: ex.notes
    }));

    const { error } = await supabase
      .from('exercise_logs')
      .insert(logsToInsert);

    if (error) {
      console.error('Error saving exercise logs:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception saving exercise logs:', err);
    return false;
  }
}

export async function getWorkoutStats(userId: string) {
  if (!supabase) {
    return {
      totalWorkouts: 0,
      thisWeek: 0,
      completions: []
    };
  }

  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching workout stats:', error);
      return {
        totalWorkouts: 0,
        thisWeek: 0,
        completions: []
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeek = data?.filter(w =>
      new Date(w.completed_at) >= weekAgo
    ).length || 0;

    return {
      totalWorkouts: data?.length || 0,
      thisWeek,
      completions: data || []
    };
  } catch (err) {
    console.error('Exception fetching workout stats:', err);
    return {
      totalWorkouts: 0,
      thisWeek: 0,
      completions: []
    };
  }
}

export async function getExerciseLogs(workoutCompletionId: string) {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('workout_completion_id', workoutCompletionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching exercise logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching exercise logs:', err);
    return [];
  }
}

export interface ProgressUpdate {
  total_workouts_completed: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_workout_date: string;
  newly_unlocked_milestones: string[];
}

export async function markWorkoutComplete(
  workoutId: string,
  userId: string
): Promise<{ success: boolean; progress?: ProgressUpdate; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error: updateError } = await supabase
      .from('saved_workout_plans')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error marking workout complete:', updateError);
      return { success: false, error: updateError.message };
    }

    const progressData = await getUserProgress(userId);

    return {
      success: true,
      progress: progressData
    };
  } catch (err: any) {
    console.error('Exception marking workout complete:', err);
    return { success: false, error: err.message };
  }
}

export async function getUserProgress(userId: string): Promise<ProgressUpdate> {
  if (!supabase) {
    return {
      total_workouts_completed: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      last_workout_date: '',
      newly_unlocked_milestones: []
    };
  }

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles_extended')
      .select('total_workouts_completed, current_streak_days, longest_streak_days, last_workout_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user progress:', profileError);
    }

    const recentTime = new Date(Date.now() - 10000).toISOString();
    const { data: milestones, error: milestonesError } = await supabase
      .from('user_milestones')
      .select('milestone_name')
      .eq('user_id', userId)
      .gte('unlocked_at', recentTime);

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
    }

    return {
      total_workouts_completed: profileData?.total_workouts_completed || 0,
      current_streak_days: profileData?.current_streak_days || 0,
      longest_streak_days: profileData?.longest_streak_days || 0,
      last_workout_date: profileData?.last_workout_date || '',
      newly_unlocked_milestones: milestones?.map(m => m.milestone_name) || []
    };
  } catch (err) {
    console.error('Exception fetching user progress:', err);
    return {
      total_workouts_completed: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      last_workout_date: '',
      newly_unlocked_milestones: []
    };
  }
}

export async function calculateStreak(userId: string): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('workout_plan_completions')
      .select('workout_date')
      .eq('user_id', userId)
      .order('workout_date', { ascending: false })
      .limit(365);

    if (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const uniqueDates = Array.from(new Set(data.map(w => w.workout_date))).sort().reverse();

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const nextExpectedDate = new Date(currentDate);
      nextExpectedDate.setDate(nextExpectedDate.getDate() - 1);
      const nextExpectedStr = nextExpectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === nextExpectedStr) {
        streak++;
        currentDate = new Date(uniqueDates[i]);
      } else {
        break;
      }
    }

    return streak;
  } catch (err) {
    console.error('Exception calculating streak:', err);
    return 0;
  }
}
