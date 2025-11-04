import { supabase } from './supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/oauth/callback';

export const initiateGoogleOAuth = () => {
  const scope = 'https://www.googleapis.com/auth/calendar.events';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  window.location.href = authUrl;
};

export const handleOAuthCallback = async (code: string, userId: string): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-calendar-sync`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refresh_token',
          userId: userId,
          oauthCode: code
        }),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return false;
  }
};

export const isGoogleCalendarConnected = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('is_connected')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.is_connected || false;
  } catch (error) {
    console.error('Error checking calendar connection:', error);
    return false;
  }
};

export const disconnectGoogleCalendar = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('google_calendar_tokens')
      .update({ is_connected: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return false;
  }
};

interface WorkoutEventData {
  name: string;
  type: string;
  focus: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export const createCalendarEvent = async (userId: string, workoutData: WorkoutEventData): Promise<string | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-calendar-sync`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          userId: userId,
          workoutData: workoutData
        }),
      }
    );

    const result = await response.json();
    return result.success ? result.eventId : null;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
};

export const updateCalendarEvent = async (
  userId: string,
  eventId: string,
  workoutData: WorkoutEventData
): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-calendar-sync`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userId: userId,
          eventId: eventId,
          workoutData: workoutData
        }),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
};

export const deleteCalendarEvent = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-calendar-sync`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          userId: userId,
          eventId: eventId
        }),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
};
