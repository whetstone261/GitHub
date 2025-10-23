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
