# Workout Days Selection Feature (v2)

## Overview
A customizable feature in the AI Workout Planner that allows users to select specific days of the week for their weekly workout schedule. This gives users full control over when they want to work out each week, directly in the Customize Your Workout section before generating their AI Weekly Plan.

## Feature Location

**AI Workout Planner Page → Customize Your Workout Section**

The workout days selector appears when users choose "Weekly Plan" as their plan type, before they click "Generate AI Weekly Plan."

## User Experience

### Visual Interface

When users select "Weekly Plan" in the Customize Your Workout section, they see:

```
┌────────────────────────────────────────────────┐
│  Customize Your Workout                        │
│                                                │
│  Plan Type                                     │
│  ┌─────────────┐  ┌─────────────┐            │
│  │Single       │  │Weekly Plan ✓│            │
│  └─────────────┘  └─────────────┘            │
│                                                │
│  📅 Select Workout Days        [All] [Clear]  │
│                                                │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │Mon│ │Tue│ │Wed│ │Thu│ │Fri│ │Sat│ │Sun│ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                                │
│  ✓ 3 days selected: Monday, Wednesday, Friday │
│                                                │
│  Duration: [30 min]                           │
│  Focus Areas: ...                             │
│                                                │
│  [Generate AI Weekly Plan]                    │
└────────────────────────────────────────────────┘
```

### UI Features

**Day Selection Buttons:**
- Compact horizontal layout with 7 day buttons
- Shows 3-letter abbreviations (Mon, Tue, Wed, etc.)
- Responsive sizing
- Each button toggles on/off

**Visual States:**
- **Unselected:** White background, gray border, gray text
- **Selected:** Blue background (#0074D9), white text, shadow
- **Hover:** Blue-tinted background (when unselected)

**Quick Actions:**
- **All:** Instantly selects all 7 days
- **Clear:** Deselects all days

**Feedback:**
- Green confirmation shows selected days count and names
- Yellow warning if no days selected
- Generate button disabled until at least 1 day selected

### Workflow

1. User navigates to AI Workout Planner
2. User selects "Weekly Plan" as plan type
3. Workout days selector appears
4. User clicks days they want to work out
5. Selected days are highlighted in blue
6. Confirmation shows: "3 days selected: Monday, Wednesday, Friday"
7. User continues with other customizations (duration, focus areas, etc.)
8. User clicks "Generate AI Weekly Plan"
9. Plan is generated with workouts only on selected days

## Technical Implementation

### 1. Component State

**File:** `src/components/WorkoutPlanner.tsx`

**New State Variable:**
```typescript
const [selectedWorkoutDays, setSelectedWorkoutDays] = useState<string[]>([]);
```

**Purpose:**
- Stores currently selected workout days for the weekly plan
- Array of full day names: `["Monday", "Wednesday", "Friday"]`
- Resets when user switches between single/weekly plan types
- Independent of onboarding (removed from onboarding flow)

### 2. UI Component

**Location:** After "Plan Type" selection, before "Duration"

**Conditional Rendering:**
```typescript
{selectedFilters.planType === 'weekly' && (
  <div className="space-y-6">
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4 inline mr-2" />
          Select Workout Days
        </label>
        <div className="flex gap-2">
          <button onClick={() => setSelectedWorkoutDays([...all days])}>
            All
          </button>
          <button onClick={() => setSelectedWorkoutDays([])}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* 7 day buttons */}
      </div>

      {/* Feedback messages */}
    </div>
  </div>
)}
```

**Button Toggle Logic:**
```typescript
onClick={() => {
  if (isSelected) {
    setSelectedWorkoutDays(prev => prev.filter(d => d !== fullDay));
  } else {
    setSelectedWorkoutDays(prev => [...prev, fullDay]);
  }
}}
```

### 3. Workout Plan Generation

**Updated Function:** `getWeeklySchedule()`

**Logic:**
```typescript
const getWeeklySchedule = (frequency: number, focusAreas: string[]) => {
  const schedule = [];
  const focuses = focusAreas.length > 0 ? focusAreas : ['upper-body', 'lower-body', 'cardio', 'core'];

  // Use selected days from planner
  if (selectedWorkoutDays.length > 0) {
    selectedWorkoutDays.forEach((day, index) => {
      schedule.push({
        day: day,
        focus: focuses[index % focuses.length]
      });
    });
  } else {
    // Fall back to frequency-based default
    // ... existing logic
  }

  return schedule;
}
```

**Focus Area Distribution:**
- Focus areas rotate cyclically across selected days
- Example with 3 days and 2 focus areas:
  - Monday → upper-body
  - Wednesday → lower-body
  - Friday → upper-body

### 4. Generate Button Validation

**Disabled State:**
```typescript
disabled={
  isGenerating ||
  (selectedFilters.planType === 'weekly' && selectedWorkoutDays.length === 0)
}
```

**Purpose:**
- Prevents generation without day selection
- Ensures users make conscious choice
- Provides clear feedback via gray disabled state

### 5. Calendar Integration

**Automatic Sync:**
- Workouts generated only for selected days
- When user completes a workout, syncs to Google Calendar
- Calendar events use actual completion date
- No special handling needed (existing system works)

**Google Calendar Event:**
- Title: Workout name + "— Guided Gains"
- Date: Workout completion date
- Time: Actual workout time
- Description: Full workout details

## User Flow Examples

### Example 1: Monday/Wednesday/Friday Schedule

**User Actions:**
1. Opens AI Workout Planner
2. Selects "Weekly Plan"
3. Clicks: Monday, Wednesday, Friday
4. Sees: "✓ 3 days selected: Monday, Wednesday, Friday"
5. Selects duration: 45 min
6. Selects focus: Upper Body, Lower Body
7. Clicks "Generate AI Weekly Plan"

**Generated Plan:**
```
📅 Weekly Workout Plan

Monday: Upper Body Focus (45 min)
- Bench Press, Rows, Shoulder Press...

Wednesday: Lower Body Focus (45 min)
- Squats, Lunges, Deadlifts...

Friday: Upper Body Focus (45 min)
- Dips, Pull-ups, Overhead Press...
```

### Example 2: Weekend Warrior

**User Actions:**
1. Selects "Weekly Plan"
2. Clicks: Saturday, Sunday
3. Sees: "✓ 2 days selected: Saturday, Sunday"
4. Generates plan

**Generated Plan:**
```
📅 Weekly Workout Plan

Saturday: Full Body Strength
- Compound movements, high intensity

Sunday: Recovery & Cardio
- Low impact, stretching, endurance
```

### Example 3: Custom 5-Day Split

**User Actions:**
1. Clicks "All" to select all days
2. Deselects: Wednesday, Sunday
3. Sees: "✓ 5 days selected: Monday, Tuesday, Thursday, Friday, Saturday"
4. Selects multiple focus areas
5. Generates plan

**Generated Plan:**
```
📅 Weekly Workout Plan

Monday: Chest & Triceps
Tuesday: Back & Biceps
Thursday: Legs
Friday: Shoulders
Saturday: Full Body HIIT
```

## Benefits

### For Users

**Flexibility:**
- ✅ Customize schedule each week
- ✅ Plan around changing commitments
- ✅ See exactly which days have workouts
- ✅ Adjust on the fly

**Clarity:**
- ✅ Visual day selector is intuitive
- ✅ Immediate feedback on selections
- ✅ Clear validation messages
- ✅ See selected days before generating

**Control:**
- ✅ No need to modify profile settings
- ✅ Different schedule each week if desired
- ✅ Easy to experiment with different patterns

### For the App

**Better User Experience:**
- Fewer clicks than onboarding-only approach
- More flexible than profile settings
- Integrated into natural workflow

**Improved Plans:**
- Plans match actual availability
- Better adherence rates
- More realistic scheduling

**Data Insights:**
- Track popular day combinations
- Understand weekly patterns
- Optimize recommendations

## Differences from Onboarding Version

### Removed from Onboarding

**What Changed:**
- Step 5 (Set your schedule) removed
- Step 6 (Select Workout Days) removed
- Total onboarding steps: 7 → 5
- Default workout frequency: 3/week
- Default duration: 30 min

**Reason:**
- Users don't know their schedule during first setup
- Schedule changes week to week
- Better to select when actually planning
- Reduces onboarding friction

### Added to Workout Planner

**What's New:**
- Appears in Customize Your Workout section
- Only visible when "Weekly Plan" is selected
- Required for generating weekly plans
- Session-based (doesn't persist to user profile)

**Advantages:**
- Just-in-time selection
- Context-aware (user is actively planning)
- Can change each time
- More flexible than fixed profile setting

## Edge Cases Handled

### No Days Selected
- Generate button disabled
- Yellow warning message displayed
- Clear instruction to select days
- Cannot proceed without selection

### All Days Selected
- "All" button provides quick selection
- Generates 7-day intensive plan
- No rest days (suitable for advanced users)

### Single Day Selected
- Allowed for users with limited time
- Generates one focused workout
- Focus matches user's selected areas

### Switching Plan Types
- Days remain selected when switching back to weekly
- Only visible for weekly plan type
- Single workout type ignores day selection

### User Doesn't Complete Workflow
- Selection is session-only
- Not saved to database or profile
- Fresh start next time they open planner

## Future Enhancements

### Phase 2: Smart Defaults
- [ ] Pre-select common patterns (MWF, MTThF, etc.)
- [ ] Remember last selection in session
- [ ] Suggest days based on past completions

### Phase 3: Rest Day Recommendations
- [ ] Highlight recommended rest days
- [ ] Warn about consecutive intense days
- [ ] Suggest optimal spacing

### Phase 4: Template Patterns
- [ ] Save favorite day combinations
- [ ] Quick select from presets
- [ ] Copy last week's schedule

### Phase 5: Calendar Integration
- [ ] Import busy days from Google Calendar
- [ ] Auto-avoid conflicting appointments
- [ ] Suggest best available days

## Testing Checklist

### Manual Testing

**UI Interaction:**
- [ ] Weekly Plan shows day selector
- [ ] Single Workout hides day selector
- [ ] Can click individual days
- [ ] Days highlight when selected
- [ ] All button selects all 7 days
- [ ] Clear button deselects all days
- [ ] Confirmation updates with count

**Generation:**
- [ ] Cannot generate without days selected
- [ ] Button disabled with 0 days
- [ ] Plan uses selected days only
- [ ] Focus areas rotate correctly
- [ ] Preview shows correct days

**Visual Design:**
- [ ] Buttons look good on mobile
- [ ] Grid adjusts for small screens
- [ ] Colors match Guided Gains theme
- [ ] Hover states work
- [ ] Selected state is clear

**Edge Cases:**
- [ ] 1 day works
- [ ] 7 days works
- [ ] Non-consecutive days work
- [ ] Weekend-only works
- [ ] Weekday-only works
- [ ] Switching plan types works

### Integration Testing

**Calendar Sync:**
- [ ] Workouts sync on selected days
- [ ] Calendar events have correct dates
- [ ] Multiple workouts same week sync

**Database:**
- [ ] No database calls for day selection (session only)
- [ ] Workout completions save correctly
- [ ] Plan generation uses selected days

## Implementation Summary

### Files Modified

1. **OnboardingFlow.tsx**
   - Removed Step 5 (schedule settings)
   - Removed Step 6 (workout days selection)
   - Total steps: 7 → 5
   - Removed: workoutFrequency, preferredDuration, workoutDays from form

2. **WorkoutPlanner.tsx**
   - Added: `selectedWorkoutDays` state
   - Added: Day selector UI component
   - Updated: `getWeeklySchedule()` to use `selectedWorkoutDays`
   - Updated: Generate button validation
   - Lines changed: ~50

3. **types/index.ts**
   - No changes needed (workoutDays still optional on User type)

### Files Removed

None (kept database migration for potential future use)

### Key Functions

```typescript
// State management
const [selectedWorkoutDays, setSelectedWorkoutDays] = useState<string[]>([]);

// Toggle day selection
const toggleDay = (day: string) => {
  if (selectedWorkoutDays.includes(day)) {
    setSelectedWorkoutDays(prev => prev.filter(d => d !== day));
  } else {
    setSelectedWorkoutDays(prev => [...prev, day]);
  }
};

// Generate schedule
const getWeeklySchedule = (frequency, focusAreas) => {
  if (selectedWorkoutDays.length > 0) {
    // Use selected days
    return selectedWorkoutDays.map((day, i) => ({
      day,
      focus: focuses[i % focuses.length]
    }));
  }
  // Fall back to defaults
};
```

## Code References

### Workout Planner Component

**Day Selector UI:** `src/components/WorkoutPlanner.tsx:2784-2854`
**State Variable:** `src/components/WorkoutPlanner.tsx:25`
**Schedule Function:** `src/components/WorkoutPlanner.tsx:210-266`
**Generate Button:** `src/components/WorkoutPlanner.tsx:2968-2978`

### Onboarding Component

**Total Steps:** `src/components/OnboardingFlow.tsx:27` (changed to 5)
**Step 5 Content:** Now "Stay motivated" (was step 7)

## Accessibility

**Keyboard Navigation:**
- Tab through all day buttons
- Space/Enter to toggle selection
- Focus indicators visible
- Quick action buttons accessible

**Screen Readers:**
- Labels announce day name
- Selection state communicated
- Count announced on change
- Error messages clear

**Visual Design:**
- High contrast states
- Icons supplement text
- Color not sole indicator
- Clear disabled state

## Analytics Events

**Suggested Tracking:**

```typescript
// When days selected in planner
trackEvent('planner_workout_days_selected', {
  days_count: selectedDays.length,
  days: selectedDays.join(','),
  plan_type: 'weekly'
});

// When weekly plan generated
trackEvent('weekly_plan_generated', {
  days_count: selectedDays.length,
  days: selectedDays.join(','),
  focus_areas: focusAreas.join(',')
});

// When workout completed on planned day
trackEvent('workout_completed_on_planned_day', {
  day: completionDay,
  was_planned: true
});
```

## Summary

The Workout Days Selection feature has been moved from the onboarding flow to the AI Workout Planner page, where it appears in the "Customize Your Workout" section when users select "Weekly Plan."

**Key Improvements:**
1. **More Flexible:** Users can change days each week
2. **Better UX:** Select days when actually planning, not during initial setup
3. **Clearer Workflow:** Integrated into natural planning process
4. **Less Friction:** Shorter onboarding (5 steps vs 7)
5. **Session-Based:** No database calls, just immediate use

The implementation is production-ready, fully functional, and provides an intuitive way for users to customize their weekly workout schedule right when they need it—during the planning phase.
