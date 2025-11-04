import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  type: 'daily_reminder' | 'missed_workout' | 'milestone_celebration';
  userId: string;
  userName?: string;
  workoutName?: string;
  focusArea?: string;
  totalWorkouts?: number;
  streakDays?: number;
  milestoneName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailRequest: EmailRequest = await req.json();

    // Get user's email from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles_extended?user_id=eq.${emailRequest.userId}&select=email,email_opt_in,email_frequency`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const userData = await userResponse.json();

    if (!userData || userData.length === 0 || !userData[0].email || !userData[0].email_opt_in) {
      return new Response(
        JSON.stringify({ success: false, message: 'User has not opted in for emails or email not found' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    const userEmail = userData[0].email;
    const emailFrequency = userData[0].email_frequency;

    // Check if we should send based on frequency
    if (emailRequest.type === 'daily_reminder' && emailFrequency === 'milestone_only') {
      return new Response(
        JSON.stringify({ success: false, message: 'User prefers milestone-only emails' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    // Generate email content based on type
    let subject = '';
    let htmlBody = '';
    const userName = emailRequest.userName || 'Fitness Enthusiast';

    switch (emailRequest.type) {
      case 'daily_reminder':
        subject = `💪 Your ${emailRequest.focusArea || 'workout'} awaits, ${userName}!`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #0074D9; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Guided Gains</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your guided workout awaits 💪</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2C2C2C; margin-top: 0;">Hey ${userName}!</h2>
              <p style="color: #4B5563; line-height: 1.6;">
                Today's <strong>${emailRequest.workoutName || emailRequest.focusArea || 'workout'}</strong> is ready and waiting for you.
                Let's crush it! 🔥
              </p>
              <p style="color: #4B5563; line-height: 1.6;">
                Remember: Every workout brings you closer to your goals. You've got this!
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background-color: #0074D9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Start Workout
                </a>
              </div>
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Keep up the amazing work! 💙
              </p>
            </div>
          </div>
        `;
        break;

      case 'missed_workout':
        subject = `We missed you, ${userName} 💙`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #F97316; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Guided Gains</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Let's get back on track 🎯</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2C2C2C; margin-top: 0;">Hey ${userName},</h2>
              <p style="color: #4B5563; line-height: 1.6;">
                We noticed you haven't worked out in a couple of days. That's okay - life happens!
                The important thing is getting back at it.
              </p>
              <p style="color: #4B5563; line-height: 1.6;">
                <strong>One workout at a time.</strong> That's all it takes to rebuild momentum.
                Let's make today count!
              </p>
              <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400E; margin: 0; font-style: italic;">
                  "The only bad workout is the one that didn't happen."
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background-color: #F97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Resume Your Journey
                </a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'milestone_celebration':
        subject = `🎉 Congrats ${userName}! You unlocked: ${emailRequest.milestoneName}`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #16A34A; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 36px;">🎉 🎊 🎉</h1>
              <h2 style="margin: 10px 0; font-size: 24px;">Milestone Unlocked!</h2>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2C2C2C; margin-top: 0;">Incredible work, ${userName}!</h2>
              <p style="color: #4B5563; line-height: 1.6;">
                You just unlocked the <strong>${emailRequest.milestoneName}</strong> achievement! 🏆
              </p>
              ${emailRequest.totalWorkouts ? `
                <div style="background-color: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #1E40AF; margin: 0; font-size: 18px;">
                    <strong>${emailRequest.totalWorkouts}</strong> total workouts completed
                  </p>
                </div>
              ` : ''}
              ${emailRequest.streakDays ? `
                <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #92400E; margin: 0; font-size: 18px;">
                    <strong>🔥 ${emailRequest.streakDays} day streak!</strong>
                  </p>
                </div>
              ` : ''}
              <p style="color: #4B5563; line-height: 1.6;">
                This is proof of your dedication and consistency. You're absolutely crushing it! 💪
              </p>
              <p style="color: #4B5563; line-height: 1.6;">
                Keep this momentum going - the next milestone is waiting for you!
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background-color: #16A34A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  View All Achievements
                </a>
              </div>
            </div>
          </div>
        `;
        break;
    }

    // Here you would integrate with an email service like SendGrid, Resend, or Postmark
    // For now, we'll log it and queue it in the database

    const queueResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_queue`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: emailRequest.userId,
          email_type: emailRequest.type,
          email_subject: subject,
          email_body: htmlBody,
          scheduled_for: new Date().toISOString(),
          status: 'pending'
        })
      }
    );

    if (!queueResponse.ok) {
      throw new Error('Failed to queue email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queued successfully',
        recipient: userEmail
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing email request:', error);
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
