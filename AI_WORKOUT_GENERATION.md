# AI Workout Generation System

## Overview
Integrated an AI-powered workout generation system that creates truly personalized workouts based on the user's experience level, goals, and specific equipment available at home.

## The AI Prompt

The system uses a comprehensive prompt that instructs the AI to act as a professional fitness coach:

### Key Instructions to AI

**User Context:**
- Experience level (beginner/intermediate/advanced)
- Workout goals and focus areas
- Equipment type (none/basic/gym)
- Specific equipment available at home

**Generation Rules:**
1. ✅ Only include exercises user can perform with their equipment
2. ✅ Combine equipment-based and bodyweight movements
3. ✅ Favor functional, home-friendly movements
4. ✅ Avoid gym-specific machines (unless user has gym access)
5. ✅ Include warm-up and cool-down
6. ✅ Provide exercise alternatives
7. ✅ Maintain balance (push, pull, legs, core)

**Format Requirements:**
- Short, motivational title
- Encouraging intro message
- 6-10 exercises with:
  - Exercise name
  - Target muscle group
  - Equipment needed (or "Bodyweight")
  - Sets × reps or time
  - Helpful tip
- Warm-up instructions
- Cool-down instructions
- Target duration (30-45 minutes)

**Tone:**
Encouraging, knowledgeable, friendly professional fitness coach

## Edge Function Implementation

### Endpoint: `/functions/v1/generate-ai-workout`

**Request Body:**
```json
{
  "experienceLevel": "intermediate",
  "goalFocus": ["muscle-gain", "strength"],
  "equipmentType": "basic",
  "userEquipment": [
    "Adjustable dumbbells",
    "Resistance bands (medium)",
    "Pull-up bar (door frame)",
    "Yoga mat"
  ],
  "duration": 45
}
```

**Response:**
```json
{
  "success": true,
  "workout": {
    "title": "Dumbbell Strength Builder",
    "motivationalMessage": "Time to put those dumbbells to work! You're stronger than you think!",
    "warmup": "Start with 5 minutes of light cardio...",
    "exercises": [
      {
        "name": "Dumbbell Goblet Squats",
        "muscleGroup": "Legs, Glutes",
        "equipment": "Dumbbells",
        "sets": 4,
        "reps": 12,
        "duration": null,
        "tip": "Hold the dumbbell close to your chest"
      }
    ],
    "cooldown": "Finish with 5 minutes of static stretching...",
    "estimatedDuration": 45
  }
}
```

## AI Service Integration

### Current: Mock Generator
The edge function currently includes a mock workout generator for demonstration. It intelligently creates workouts based on:
- User's equipment (checks for dumbbells, bands, kettlebells, pull-up bar)
- Experience level (adjusts reps/sets/duration)
- Equipment availability (bodyweight vs equipment-based)

### Production: Real AI Integration

To connect a real AI service (OpenAI, Anthropic, etc.), uncomment and configure:

```typescript
// Example: OpenAI GPT-4
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
```

**Environment Variables Needed:**
- `OPENAI_API_KEY` - For OpenAI
- `ANTHROPIC_API_KEY` - For Claude
- Or other AI service credentials

### Supported AI Services

**OpenAI (GPT-4):**
- Best for creative, varied workouts
- Excellent natural language understanding
- Cost: ~$0.03-0.06 per workout

**Anthropic (Claude):**
- Great for detailed, safe instructions
- Strong reasoning capabilities
- Cost: Similar to GPT-4

**Open Source (Llama, Mistral):**
- Free or self-hosted
- Good quality for structured outputs
- Requires more infrastructure

## Example Scenarios

### Scenario 1: No Equipment, Beginner
**Input:**
```json
{
  "experienceLevel": "beginner",
  "goalFocus": ["general-fitness"],
  "equipmentType": "none",
  "userEquipment": [],
  "duration": 30
}
```

**AI Generates:**
```
Title: "Bodyweight Power Circuit"
Message: "No equipment, no problem! Your body is the best tool you've got!"

Exercises:
1. Push-ups (8 reps × 4 sets) - Chest, Shoulders, Triceps
2. Bodyweight Squats (12 reps × 4 sets) - Legs, Glutes
3. Plank (30 sec × 3 sets) - Core
4. Walking Lunges (10 reps × 3 sets) - Legs
5. Mountain Climbers (30 sec × 4 sets) - Core, Cardio
6. Burpees (8 reps × 3 sets) - Full Body
```

### Scenario 2: Dumbbells + Bands, Intermediate
**Input:**
```json
{
  "experienceLevel": "intermediate",
  "goalFocus": ["muscle-gain", "strength"],
  "equipmentType": "basic",
  "userEquipment": ["Adjustable dumbbells", "Resistance bands (heavy)"],
  "duration": 45
}
```

**AI Generates:**
```
Title: "Dumbbell & Band Strength Hybrid"
Message: "Perfect combo! Let's build some serious strength today!"

Exercises:
1. Dumbbell Goblet Squats (12 reps × 4 sets)
2. Resistance Band Chest Press (15 reps × 3 sets)
3. Dumbbell Rows (12 reps × 4 sets)
4. Banded Glute Bridges (15 reps × 3 sets)
5. Dumbbell Shoulder Press (10 reps × 3 sets)
6. Resistance Band Rows (15 reps × 3 sets)
7. Dumbbell Bicep Curls (12 reps × 3 sets)
8. Plank (45 sec × 3 sets)
```

### Scenario 3: Full Home Gym, Advanced
**Input:**
```json
{
  "experienceLevel": "advanced",
  "goalFocus": ["strength", "muscle-gain"],
  "equipmentType": "basic",
  "userEquipment": [
    "Barbell",
    "Weight plates",
    "Squat rack",
    "Adjustable bench",
    "Pull-up bar"
  ],
  "duration": 60
}
```

**AI Generates:**
```
Title: "Advanced Strength Protocol"
Message: "Time to push your limits! Your home gym is ready to go!"

Exercises:
1. Barbell Back Squats (6 reps × 5 sets)
2. Barbell Bench Press (8 reps × 4 sets)
3. Pull-ups (AMRAP × 4 sets)
4. Barbell Deadlifts (6 reps × 4 sets)
5. Barbell Overhead Press (8 reps × 4 sets)
6. Barbell Rows (10 reps × 4 sets)
7. Weighted Dips (8 reps × 3 sets)
8. Ab Rollouts (12 reps × 3 sets)
```

## Benefits

### For Users
✅ **Truly Personalized** - AI considers exact equipment inventory
✅ **Variety** - Never the same workout twice
✅ **Adaptive** - Adjusts to experience level automatically
✅ **Motivational** - Encouraging language keeps users engaged
✅ **Safe** - Only suggests exercises user can actually do
✅ **Balanced** - Ensures all muscle groups are covered
✅ **Professional** - Like having a personal trainer

### For the App
✅ **Scalable** - AI can generate infinite unique workouts
✅ **Low maintenance** - No manual exercise database updates
✅ **Smart** - Understands context and nuance
✅ **Flexible** - Easy to add new requirements
✅ **Cost-effective** - AI call costs less than human trainer

## Integration with Existing System

### Hybrid Approach
The app now supports TWO workout generation methods:

**1. Rule-Based Generator (Current)**
- Pre-defined exercise database
- Filter by equipment/difficulty
- Fast, predictable, no API costs
- Good for offline use

**2. AI Generator (New)**
- Dynamic, creative workouts
- Natural language understanding
- Requires internet + API key
- More personalized

**Strategy:**
- Offer AI generation as premium feature
- Use rule-based as fallback
- Let users choose preferred method
- Cache AI workouts for offline access

## UI Integration Points

### Option 1: Toggle in Filters
```
┌─────────────────────────────────┐
│ Workout Generation              │
│                                 │
│ ○ Standard (Fast)               │
│ ● AI-Powered (Personalized)    │
└─────────────────────────────────┘
```

### Option 2: Premium Button
```
┌─────────────────────────────────┐
│ [Generate Workout]              │
│ [✨ Generate with AI] (Premium) │
└─────────────────────────────────┘
```

### Option 3: A/B Test
- 50% users get AI workouts
- 50% get rule-based
- Compare engagement metrics

## Cost Analysis

### OpenAI GPT-4
- Input: ~500 tokens ($0.015 per 1K) = $0.0075
- Output: ~800 tokens ($0.03 per 1K) = $0.024
- **Total per workout: ~$0.03**

### Usage Projections
- 1,000 workouts/day = $30/day = $900/month
- 10,000 workouts/day = $300/day = $9,000/month

### Revenue Model
- Free tier: 3 AI workouts/month
- Premium: Unlimited AI workouts ($9.99/month)
- Break-even: 100 premium users cover 10K workouts/month

## Security Considerations

**API Key Storage:**
- Store in Supabase secrets (never in code)
- Use environment variables
- Rotate keys regularly

**Rate Limiting:**
- Limit AI calls per user (prevent abuse)
- Cache similar requests
- Queue system for high load

**Input Validation:**
- Sanitize user inputs
- Limit prompt length
- Prevent prompt injection

## Error Handling

```typescript
try {
  const aiWorkout = await generateAIWorkout(userProfile);
  return aiWorkout;
} catch (error) {
  console.error('AI generation failed:', error);
  // Fallback to rule-based generator
  return generateStandardWorkout(userProfile);
}
```

**Graceful Degradation:**
1. Try AI generation
2. If fails → Try cached similar workout
3. If fails → Use rule-based generator
4. If fails → Show static default workout

## Future Enhancements

### Phase 2: Learning System
- Track which AI workouts users complete
- Feed completion data back to AI
- Personalize based on past performance

### Phase 3: Real-Time Adjustments
- User reports exercise too hard? AI adjusts mid-workout
- Injury? AI modifies remaining exercises
- Extra time? AI adds bonus rounds

### Phase 4: Conversational AI
- "Make it harder" → AI increases intensity
- "I don't have dumbbells today" → AI swaps exercises
- "Focus more on abs" → AI rebalances workout

### Phase 5: Video Generation
- AI describes exercise
- Generate or fetch demonstration video
- Personalized form corrections

## Testing

### Mock Generator
Current implementation includes intelligent mock:
- Checks for specific equipment
- Adjusts difficulty based on level
- Creates balanced workouts
- Returns proper JSON format

### Testing Checklist
- [ ] No equipment → bodyweight only
- [ ] Dumbbells only → dumbbell + bodyweight mix
- [ ] Bands only → band exercises included
- [ ] Beginner → lower reps/sets
- [ ] Advanced → higher reps/sets
- [ ] JSON format valid
- [ ] All required fields present
- [ ] Equipment matches user inventory

## Documentation for AI Services

### OpenAI Setup
```bash
# Set environment variable
supabase secrets set OPENAI_API_KEY=sk-...

# Update edge function
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [/* ... */],
    temperature: 0.7,
  }),
});
```

### Anthropic Setup
```bash
# Set environment variable
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Update edge function
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    messages: [/* ... */],
    max_tokens: 2000,
  }),
});
```

## Summary

The AI workout generation system transforms Guided Gains from a rule-based workout app into an intelligent fitness coach that truly understands each user's unique situation. By analyzing their specific equipment inventory, experience level, and goals, the AI creates personalized workouts that are safe, effective, and motivating.

The system is designed with flexibility in mind - starting with a mock generator for development, easily upgradeable to real AI services, and with graceful fallbacks to ensure users always get a quality workout even if AI services are unavailable.

This feature positions Guided Gains as a premium, AI-powered fitness platform that delivers truly personalized training experiences at scale.
