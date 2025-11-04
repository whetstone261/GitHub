import { supabase } from './supabase';

interface SendEmailParams {
  type: 'daily_reminder' | 'missed_workout' | 'milestone_celebration';
  userId: string;
  userName?: string;
  workoutName?: string;
  focusArea?: string;
  totalWorkouts?: number;
  streakDays?: number;
  milestoneName?: string;
}

export const sendWorkoutEmail = async (params: SendEmailParams): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-workout-emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const checkAndSendMilestoneEmail = async (
  userId: string,
  userName: string,
  milestoneType: string,
  milestoneName: string
) => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles_extended')
      .select('total_workouts_completed, current_streak_days, email, email_opt_in')
      .eq('user_id', userId)
      .single();

    if (!profile || !profile.email_opt_in) {
      return false;
    }

    await sendWorkoutEmail({
      type: 'milestone_celebration',
      userId,
      userName,
      milestoneName,
      totalWorkouts: profile.total_workouts_completed,
      streakDays: profile.current_streak_days,
    });

    return true;
  } catch (error) {
    console.error('Error checking and sending milestone email:', error);
    return false;
  }
};
