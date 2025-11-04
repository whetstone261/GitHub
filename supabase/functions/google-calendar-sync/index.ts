import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CalendarSyncRequest {
  action: 'create' | 'update' | 'delete' | 'refresh_token';
  userId: string;
  eventId?: string;
  workoutData?: {
    name: string;
    type: string;
    focus: string;
    startTime: string;
    endTime: string;
    description?: string;
  };
  oauthCode?: string;
  refreshToken?: string;
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:5173/oauth/callback';

async function getAccessToken(userId: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/google_calendar_tokens?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const tokenData = data[0];
    const expiresAt = new Date(tokenData.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      const newToken = await refreshAccessToken(userId, tokenData.refresh_token);
      return newToken;
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('Failed to refresh token');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

    await fetch(
      `${supabaseUrl}/rest/v1/google_calendar_tokens?user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          access_token: data.access_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    );

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function exchangeCodeForTokens(code: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!data.access_token || !data.refresh_token) {
      throw new Error('Failed to exchange code for tokens');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

    await fetch(
      `${supabaseUrl}/rest/v1/google_calendar_tokens`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: userId,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          calendar_id: 'primary',
          is_connected: true
        })
      }
    );

    return true;
  } catch (error) {
    console.error('Error exchanging code:', error);
    return false;
  }
}

async function createCalendarEvent(accessToken: string, userId: string, workoutData: any): Promise<string | null> {
  try {
    const event = {
      summary: `Guided Gains — ${workoutData.name}`,
      description: `AI-planned ${workoutData.type} session. Focus: ${workoutData.focus}.\n\n${workoutData.description || ''}`,
      start: {
        dateTime: workoutData.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: workoutData.endTime,
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 30 },
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const data = await response.json();

    if (!data.id) {
      throw new Error('Failed to create calendar event');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(
      `${supabaseUrl}/rest/v1/google_calendar_events`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: userId,
          google_event_id: data.id,
          event_title: event.summary,
          event_start_time: workoutData.startTime,
          event_end_time: workoutData.endTime,
          event_description: event.description,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString()
        })
      }
    );

    return data.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

async function updateCalendarEvent(accessToken: string, eventId: string, userId: string, workoutData: any): Promise<boolean> {
  try {
    const event = {
      summary: `Guided Gains — ${workoutData.name}`,
      description: `AI-planned ${workoutData.type} session. Focus: ${workoutData.focus}.\n\n${workoutData.description || ''}`,
      start: {
        dateTime: workoutData.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: workoutData.endTime,
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 30 },
        ],
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(
      `${supabaseUrl}/rest/v1/google_calendar_events?google_event_id=eq.${eventId}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          event_title: event.summary,
          event_start_time: workoutData.startTime,
          event_end_time: workoutData.endTime,
          event_description: event.description,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    );

    return true;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

async function deleteCalendarEvent(accessToken: string, eventId: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete calendar event');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(
      `${supabaseUrl}/rest/v1/google_calendar_events?google_event_id=eq.${eventId}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          sync_status: 'deleted',
          updated_at: new Date().toISOString()
        })
      }
    );

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const request: CalendarSyncRequest = await req.json();

    if (request.action === 'refresh_token' && request.oauthCode) {
      const success = await exchangeCodeForTokens(request.oauthCode, request.userId);
      return new Response(
        JSON.stringify({ success, message: success ? 'Calendar connected' : 'Failed to connect' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: success ? 200 : 400,
        }
      );
    }

    const accessToken = await getAccessToken(request.userId);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid access token. Please reconnect Google Calendar.' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 401,
        }
      );
    }

    let result;

    switch (request.action) {
      case 'create':
        if (!request.workoutData) {
          throw new Error('Workout data required for create action');
        }
        result = await createCalendarEvent(accessToken, request.userId, request.workoutData);
        return new Response(
          JSON.stringify({ success: !!result, eventId: result }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: result ? 200 : 400,
          }
        );

      case 'update':
        if (!request.eventId || !request.workoutData) {
          throw new Error('Event ID and workout data required for update action');
        }
        result = await updateCalendarEvent(accessToken, request.eventId, request.userId, request.workoutData);
        return new Response(
          JSON.stringify({ success: result }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: result ? 200 : 400,
          }
        );

      case 'delete':
        if (!request.eventId) {
          throw new Error('Event ID required for delete action');
        }
        result = await deleteCalendarEvent(accessToken, request.eventId, request.userId);
        return new Response(
          JSON.stringify({ success: result }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: result ? 200 : 400,
          }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in calendar sync:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
