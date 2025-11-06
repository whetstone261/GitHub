import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WorkoutRequest {
  experienceLevel: string;
  goalFocus: string[];
  equipmentType: string;
  userEquipment: string[];
  duration: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { experienceLevel, goalFocus, equipmentType, userEquipment, duration }: WorkoutRequest = await req.json();

    // Build the AI prompt
    const prompt = `You are an intelligent AI workout planner for the app Guided Gains.
Your task is to generate a personalized workout plan tailored to the user's profile and the equipment they have available at home.

The user's experience level is ${experienceLevel}, their workout goal or focus is ${goalFocus.join(', ')}, and their selected equipment type for this session is ${equipmentType}.

${equipmentType === 'basic' ? `The user has the following equipment at home: ${userEquipment.length > 0 ? userEquipment.join(', ') : 'None - bodyweight only'}.
Only include exercises that use the equipment in this list or that require no equipment (bodyweight-only).
Combine both equipment-based and bodyweight movements to create a balanced and engaging plan that fits into a home environment.` : ''}

${equipmentType === 'none' ? 'The user has NO equipment. Generate a bodyweight-only workout that still challenges different muscle groups.' : ''}

${equipmentType === 'gym' ? 'The user has access to a full gym. Include gym equipment and machines as appropriate.' : ''}

Always check for the following when building the workout:

- Do not include exercises that require equipment the user does not have.
- If the user's list is empty, generate a bodyweight-only workout that still challenges different muscle groups.
- Favor functional and realistic home-friendly movements (e.g., push-ups, lunges, bands, dumbbells, and household item substitutes).
- If an exercise uses minimal space or can be done with small items (like resistance bands or a chair), include it.
- Avoid gym-specific machines unless equipment type is "gym" (e.g., cable machines, leg press, Smith machine).
- Include warm-up and cool-down suggestions when appropriate.

Workout Format Expectations:

- Start with a short title (e.g., "Full-Body Strength and Core at Home").
- Include a short motivational sentence (e.g., "You've got everything you need to crush this workout — your own home!").
- List 6–10 exercises formatted clearly, with the following information for each:
  * Exercise name
  * Targeted muscle group
  * Equipment needed (if any, or "Bodyweight" if none)
  * Sets × reps or time
  * Optional short tip (e.g., "Keep your core tight" or "Slow and controlled movement").

- Ensure the overall plan fits within ${duration} minutes.
- Maintain a good mix of push, pull, legs, and core exercises across sessions.
- Provide exercise alternatives if possible (e.g., "If no dumbbells, try backpack rows").

Tone and style:
Use encouraging, knowledgeable language that motivates the user and feels like a friendly, professional fitness coach.

IMPORTANT: Return your response as a valid JSON object with this exact structure:
{
  "title": "Workout Title",
  "motivationalMessage": "Your motivational message",
  "warmup": "Brief warm-up instructions",
  "exercises": [
    {
      "name": "Exercise Name",
      "muscleGroup": "Target muscle group",
      "equipment": "Equipment needed or Bodyweight",
      "sets": 3,
      "reps": 12,
      "duration": null,
      "tip": "Short helpful tip"
    }
  ],
  "cooldown": "Brief cool-down instructions",
  "estimatedDuration": ${duration}
}

For cardio or timed exercises, use "duration" (in seconds) instead of "reps".
Generate the workout now.`;

    // For now, we'll return a mock response since we don't have an AI API key configured
    // In production, you would call OpenAI, Anthropic, or another AI service here

    // Example: Using OpenAI (commented out - requires API key)
    /*
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional fitness coach and workout planner. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiResponse.json();
    const workoutData = JSON.parse(openaiData.choices[0].message.content);
    */

    // Mock response for demonstration
    const workoutData = generateMockWorkout(experienceLevel, goalFocus, equipmentType, userEquipment, duration);

    return new Response(
      JSON.stringify({
        success: true,
        workout: workoutData,
        prompt: prompt // Include prompt for debugging
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error generating workout:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Mock workout generator for demonstration
function generateMockWorkout(
  experienceLevel: string,
  goalFocus: string[],
  equipmentType: string,
  userEquipment: string[],
  duration: number
) {
  const hasDumbbells = userEquipment.some(eq => eq.toLowerCase().includes('dumbbell'));
  const hasBands = userEquipment.some(eq => eq.toLowerCase().includes('band'));
  const hasKettlebell = userEquipment.some(eq => eq.toLowerCase().includes('kettlebell'));
  const hasPullupBar = userEquipment.some(eq => eq.toLowerCase().includes('pull-up'));

  let exercises = [];
  let title = '';
  let motivationalMessage = '';

  // Customize based on equipment
  if (equipmentType === 'none' || userEquipment.length === 0) {
    title = 'Bodyweight Power Circuit';
    motivationalMessage = "No equipment, no problem! Your body is the best tool you've got. Let's make it count!";
    exercises = [
      {
        name: 'Push-ups',
        muscleGroup: 'Chest, Shoulders, Triceps',
        equipment: 'Bodyweight',
        sets: 4,
        reps: experienceLevel === 'beginner' ? 8 : experienceLevel === 'intermediate' ? 12 : 15,
        duration: null,
        tip: 'Keep your body in a straight line from head to heels'
      },
      {
        name: 'Bodyweight Squats',
        muscleGroup: 'Legs, Glutes',
        equipment: 'Bodyweight',
        sets: 4,
        reps: experienceLevel === 'beginner' ? 12 : experienceLevel === 'intermediate' ? 15 : 20,
        duration: null,
        tip: 'Drive through your heels and keep chest up'
      },
      {
        name: 'Plank',
        muscleGroup: 'Core',
        equipment: 'Bodyweight',
        sets: 3,
        reps: null,
        duration: experienceLevel === 'beginner' ? 30 : experienceLevel === 'intermediate' ? 45 : 60,
        tip: 'Engage your core and keep hips level'
      },
      {
        name: 'Walking Lunges',
        muscleGroup: 'Legs, Glutes',
        equipment: 'Bodyweight',
        sets: 3,
        reps: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 12 : 16,
        duration: null,
        tip: 'Keep your front knee behind your toes'
      },
      {
        name: 'Mountain Climbers',
        muscleGroup: 'Core, Cardio',
        equipment: 'Bodyweight',
        sets: 4,
        reps: null,
        duration: 30,
        tip: 'Quick feet! Keep your hips low and core tight'
      },
      {
        name: 'Burpees',
        muscleGroup: 'Full Body, Cardio',
        equipment: 'Bodyweight',
        sets: 3,
        reps: experienceLevel === 'beginner' ? 8 : experienceLevel === 'intermediate' ? 12 : 15,
        duration: null,
        tip: 'Pace yourself and focus on form'
      }
    ];
  } else if (hasDumbbells) {
    title = 'Dumbbell Strength Builder';
    motivationalMessage = "Time to put those dumbbells to work! You're stronger than you think!";
    exercises = [
      {
        name: 'Dumbbell Goblet Squats',
        muscleGroup: 'Legs, Glutes',
        equipment: 'Dumbbells',
        sets: 4,
        reps: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 12 : 15,
        duration: null,
        tip: 'Hold the dumbbell close to your chest'
      },
      {
        name: 'Dumbbell Chest Press',
        muscleGroup: 'Chest, Shoulders, Triceps',
        equipment: 'Dumbbells',
        sets: 4,
        reps: experienceLevel === 'beginner' ? 8 : experienceLevel === 'intermediate' ? 10 : 12,
        duration: null,
        tip: 'Control the weight on the way down'
      },
      {
        name: 'Dumbbell Rows',
        muscleGroup: 'Back, Biceps',
        equipment: 'Dumbbells',
        sets: 4,
        reps: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 12 : 15,
        duration: null,
        tip: 'Pull your elbow back and squeeze your shoulder blade'
      },
      {
        name: 'Push-ups',
        muscleGroup: 'Chest, Shoulders',
        equipment: 'Bodyweight',
        sets: 3,
        reps: experienceLevel === 'beginner' ? 10 : experienceLevel === 'intermediate' ? 15 : 20,
        duration: null,
        tip: 'Mix in bodyweight for variety'
      },
      {
        name: 'Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders, Triceps',
        equipment: 'Dumbbells',
        sets: 3,
        reps: experienceLevel === 'beginner' ? 8 : experienceLevel === 'intermediate' ? 10 : 12,
        duration: null,
        tip: 'Press straight up, avoid arching your back'
      },
      {
        name: 'Plank',
        muscleGroup: 'Core',
        equipment: 'Bodyweight',
        sets: 3,
        reps: null,
        duration: experienceLevel === 'beginner' ? 30 : experienceLevel === 'intermediate' ? 45 : 60,
        tip: 'Finish strong with core work'
      }
    ];
  }

  return {
    title,
    motivationalMessage,
    warmup: 'Start with 5 minutes of light cardio (jumping jacks, jogging in place) and dynamic stretches (arm circles, leg swings, torso twists).',
    exercises,
    cooldown: 'Finish with 5 minutes of static stretching, focusing on all major muscle groups worked today. Hold each stretch for 30 seconds.',
    estimatedDuration: duration
  };
}
