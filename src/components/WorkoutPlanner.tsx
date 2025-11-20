import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Clock, Target, Dumbbell, CheckCircle, Play, Calendar, ChevronDown, ChevronUp, Activity, Zap, Heart } from 'lucide-react';
import { User, WorkoutPlan, Exercise } from '../types';
import WorkoutCompletionModal from './WorkoutCompletionModal';
import { supabase } from '../lib/supabase';

interface WorkoutPlannerProps {
  user: User;
  onBack: () => void;
  workoutPlans: WorkoutPlan[];
  setWorkoutPlans: (plans: WorkoutPlan[]) => void;
}

const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ user, onBack, workoutPlans, setWorkoutPlans }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    duration: user.preferredDuration.toString(),
    focusAreas: [] as string[],
    difficulty: user.fitnessLevel,
    equipment: user.equipment,
    planType: 'single' // 'single' or 'weekly'
  });
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyFrequency, setWeeklyFrequency] = useState(user.workoutFrequency);
  const [selectedWorkoutDays, setSelectedWorkoutDays] = useState<string[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [selectedWeeklyWorkout, setSelectedWeeklyWorkout] = useState<WorkoutPlan | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedSingleWorkout, setExpandedSingleWorkout] = useState(true);
  const [savedPlan, setSavedPlan] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [calendarCompletions, setCalendarCompletions] = useState<Map<string, any>>(new Map());

  // Load saved plan and completions on mount
  useEffect(() => {
    loadSavedPlan();
    loadCompletions();
  }, [user.id]);

  const loadSavedPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_workout_plans')
        .select('*, saved_weekly_workouts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSavedPlan(data);
        // Reconstruct the workout plan from saved data
        if (data.is_weekly_plan && data.plan_data) {
          const reconstructedPlan: WorkoutPlan = {
            id: data.id,
            userId: data.user_id,
            name: data.plan_name,
            description: data.plan_description,
            exercises: [],
            duration: data.duration_minutes,
            difficulty: data.difficulty as 'beginner' | 'intermediate' | 'advanced',
            category: data.category,
            equipment: data.equipment,
            isWeeklyPlan: true,
            weeklyWorkouts: data.saved_weekly_workouts?.map((ww: any) => ({
              id: ww.id,
              userId: data.user_id,
              name: ww.workout_name,
              description: '',
              exercises: ww.workout_data.exercises || [],
              duration: data.duration_minutes,
              difficulty: data.difficulty,
              category: ww.focus_area,
              equipment: data.equipment,
              dayOfWeek: ww.day_of_week,
              scheduledDate: ww.scheduled_date ? new Date(ww.scheduled_date) : undefined,
              focusArea: ww.focus_area,
              createdAt: new Date(ww.created_at)
            })) || [],
            createdAt: new Date(data.created_at)
          };
          setGeneratedPlan(reconstructedPlan);
        }
      }
    } catch (error) {
      console.error('Error loading saved plan:', error);
    }
  };

  const loadCompletions = async () => {
    try {
      // Load from new workout_calendar table
      const { data: calendarData, error: calendarError } = await supabase
        .from('workout_calendar')
        .select('*')
        .eq('user_id', user.id);

      if (calendarError) throw calendarError;

      // Also load from old workout_plan_completions for backwards compatibility
      const { data: oldData, error: oldError } = await supabase
        .from('workout_plan_completions')
        .select('*')
        .eq('user_id', user.id);

      if (oldError) throw oldError;

      if (calendarData || oldData) {
        const completionsMap = new Map();
        const completedSet = new Set<string>();

        // Process new calendar data
        if (calendarData) {
          calendarData.forEach((completion: any) => {
            const dateKey = completion.date;
            completionsMap.set(dateKey, completion);
          });
        }

        // Process old completions data for backwards compatibility
        if (oldData) {
          oldData.forEach((completion: any) => {
            const dateKey = completion.workout_date;
            if (!completionsMap.has(dateKey)) {
              completionsMap.set(dateKey, completion);
            }
            // Also track by workout ID if it's part of a saved plan
            if (completion.day_of_week) {
              completedSet.add(`${completion.saved_plan_id}-${completion.day_of_week}`);
            }
          });
        }
        setCalendarCompletions(completionsMap);
        // Update completed workouts for weekly plan
        if (savedPlan && savedPlan.saved_weekly_workouts) {
          const newCompletedWorkouts = new Set<string>();
          savedPlan.saved_weekly_workouts.forEach((ww: any) => {
            if (completedSet.has(`${savedPlan.id}-${ww.day_of_week}`)) {
              newCompletedWorkouts.add(ww.id);
            }
          });
          setCompletedWorkouts(newCompletedWorkouts);
        }
      }
    } catch (error) {
      console.error('Error loading completions:', error);
    }
  };

  // Helper function to format time properly
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Helper function to get category icon and styling
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { icon: string; color: string; bg: string }> = {
      'cardio': { icon: '❤️', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
      'strength': { icon: '💪', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
      'chest': { icon: '💪', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
      'back': { icon: '🏋️', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-200' },
      'shoulders': { icon: '🔱', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
      'arms': { icon: '💪', color: 'text-cyan-700', bg: 'bg-cyan-100 border-cyan-200' },
      'legs': { icon: '🦵', color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
      'core': { icon: '⚡', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-200' },
      'flexibility': { icon: '🧘', color: 'text-pink-700', bg: 'bg-pink-100 border-pink-200' },
    };
    return styles[category] || { icon: '🏃', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' };
  };

  // Calendar helper functions
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to get rest time based on difficulty
  const getRestTime = (difficulty: string, exerciseType: string): number => {
    if (exerciseType === 'cardio') return 60; // 1 minute rest for cardio
    if (difficulty === 'beginner') return 60; // 1 minute
    if (difficulty === 'intermediate') return 90; // 1.5 minutes
    return 120; // 2 minutes for advanced
  };

  // Helper function to analyze past workouts and get underused muscle groups
  const getUnderusedMuscleGroups = (): string[] => {
    const recentWorkouts = workoutPlans.slice(-5); // Last 5 workouts
    const muscleGroupCount: { [key: string]: number } = {};
    
    // Count muscle group usage
    recentWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.muscleGroups.forEach(muscle => {
          muscleGroupCount[muscle] = (muscleGroupCount[muscle] || 0) + 1;
        });
      });
    });

    // Find underused muscle groups
    const allMuscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardiovascular'];
    return allMuscleGroups.filter(muscle => (muscleGroupCount[muscle] || 0) < 2);
  };

  // Helper function to get recommended rest days
  const getRestDays = (frequency: number): string[] => {
    const restDayMap: { [key: number]: string[] } = {
      3: ['Wednesday', 'Saturday', 'Sunday'],
      4: ['Wednesday', 'Saturday', 'Sunday'],
      5: ['Wednesday', 'Sunday'],
      6: ['Sunday'],
      7: []
    };
    return restDayMap[frequency] || ['Sunday'];
  };

  // Helper function to get the current week's dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    return getWeekDates(today);
  };

  // Helper function to map day names to actual dates in the current week
  const getDateForDayName = (dayName: string): Date => {
    const weekDates = getCurrentWeekDates();
    const dayMap: { [key: string]: number } = {
      'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
      'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };
    const dayIndex = dayMap[dayName];
    return weekDates[dayIndex];
  };

  // Helper function to get weekly workout schedule with proper spacing and real dates
  const getWeeklySchedule = (frequency: number, focusAreas: string[]): { day: string; date: Date; focus: string }[] => {
    const schedule: { day: string; date: Date; focus: string }[] = [];

    // Determine focus rotation
    const focuses = focusAreas.length > 0 ? focusAreas : ['upper-body', 'lower-body', 'cardio', 'core'];

    // Check if user has selected specific workout days in the planner
    if (selectedWorkoutDays.length > 0) {
      // Use selected days from planner and assign focus areas cyclically
      selectedWorkoutDays.forEach((day, index) => {
        schedule.push({
          day: day,
          date: getDateForDayName(day),
          focus: focuses[index % focuses.length]
        });
      });
    } else {
      // Fall back to default frequency-based scheduling
      // Space workouts evenly throughout the week
      if (frequency === 3) {
        // Monday, Wednesday, Friday
        schedule.push(
          { day: 'Monday', date: getDateForDayName('Monday'), focus: focuses[0 % focuses.length] },
          { day: 'Wednesday', date: getDateForDayName('Wednesday'), focus: focuses[1 % focuses.length] },
          { day: 'Friday', date: getDateForDayName('Friday'), focus: focuses[2 % focuses.length] }
        );
      } else if (frequency === 4) {
        // Monday, Tuesday, Thursday, Saturday
        schedule.push(
          { day: 'Monday', date: getDateForDayName('Monday'), focus: focuses[0 % focuses.length] },
          { day: 'Tuesday', date: getDateForDayName('Tuesday'), focus: focuses[1 % focuses.length] },
          { day: 'Thursday', date: getDateForDayName('Thursday'), focus: focuses[2 % focuses.length] },
          { day: 'Saturday', date: getDateForDayName('Saturday'), focus: focuses[3 % focuses.length] }
        );
      } else if (frequency === 5) {
        // Monday, Tuesday, Thursday, Friday, Saturday
        schedule.push(
          { day: 'Monday', date: getDateForDayName('Monday'), focus: focuses[0 % focuses.length] },
          { day: 'Tuesday', date: getDateForDayName('Tuesday'), focus: focuses[1 % focuses.length] },
          { day: 'Thursday', date: getDateForDayName('Thursday'), focus: focuses[2 % focuses.length] },
          { day: 'Friday', date: getDateForDayName('Friday'), focus: focuses[3 % focuses.length] },
          { day: 'Saturday', date: getDateForDayName('Saturday'), focus: focuses[4 % focuses.length] }
        );
      } else if (frequency === 6) {
        // Monday through Saturday
        schedule.push(
          { day: 'Monday', date: getDateForDayName('Monday'), focus: focuses[0 % focuses.length] },
          { day: 'Tuesday', date: getDateForDayName('Tuesday'), focus: focuses[1 % focuses.length] },
          { day: 'Wednesday', date: getDateForDayName('Wednesday'), focus: focuses[2 % focuses.length] },
          { day: 'Thursday', date: getDateForDayName('Thursday'), focus: focuses[3 % focuses.length] },
          { day: 'Friday', date: getDateForDayName('Friday'), focus: focuses[4 % focuses.length] },
          { day: 'Saturday', date: getDateForDayName('Saturday'), focus: focuses[5 % focuses.length] }
        );
      }
    }

    return schedule;
  };

  const sampleExercises: Exercise[] = [
    // RUNNING/CARDIO EXERCISES
    {
      id: '1',
      name: 'Outdoor Running',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 1200, // 20 minutes
      description: 'Steady-pace outdoor running for cardiovascular fitness',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '2',
      name: 'Treadmill Running',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 1800, // 30 minutes
      description: 'Controlled indoor running with adjustable pace and incline',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '3',
      name: 'HIIT Running',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 900, // 15 minutes
      description: 'Alternating high-intensity sprints with recovery periods',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '4',
      name: 'Treadmill Intervals',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 1200, // 20 minutes
      description: 'Alternating between high and low intensity on treadmill',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '5',
      name: 'Incline Walking',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 1800, // 30 minutes
      description: 'Brisk walking on inclined treadmill for low-impact cardio',
      muscleGroups: ['legs', 'glutes', 'cardiovascular']
    },
    {
      id: '6',
      name: 'Jump Rope',
      category: 'cardio',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 600, // 10 minutes
      description: 'High-intensity cardio with coordination benefits',
      muscleGroups: ['legs', 'shoulders', 'core', 'cardiovascular']
    },
    {
      id: '7',
      name: 'Stationary Bike',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 2400, // 40 minutes
      description: 'Low-impact cardio workout on stationary bike',
      muscleGroups: ['legs', 'glutes', 'cardiovascular']
    },
    {
      id: '8',
      name: 'Rowing Machine',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 1200, // 20 minutes
      description: 'Full-body cardio workout targeting multiple muscle groups',
      muscleGroups: ['back', 'legs', 'arms', 'core', 'cardiovascular']
    },
    {
      id: '9',
      name: 'Elliptical Machine',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 1800, // 30 minutes
      description: 'Low-impact full-body cardio workout',
      muscleGroups: ['legs', 'arms', 'core', 'cardiovascular']
    },
    {
      id: '10',
      name: 'Jumping Jacks',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      reps: 50,
      sets: 3,
      description: 'Full-body cardio exercise to elevate heart rate',
      muscleGroups: ['legs', 'shoulders', 'core', 'cardiovascular']
    },
    {
      id: '11',
      name: 'Burpees',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 240,
      reps: 15,
      sets: 4,
      description: 'Full-body explosive movement combining squat, plank, and jump',
      muscleGroups: ['full-body', 'cardiovascular']
    },
    {
      id: '12',
      name: 'Mountain Climbers',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      reps: 30,
      sets: 3,
      description: 'Dynamic core and cardio exercise in plank position',
      muscleGroups: ['core', 'shoulders', 'legs', 'cardiovascular']
    },

    // CHEST EXERCISES
    {
      id: '13',
      name: 'Push-ups',
      category: 'chest',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 10,
      sets: 4,
      description: 'Classic push-up targeting chest, shoulders, and triceps',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '14',
      name: 'Incline Push-ups',
      category: 'chest',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 3,
      description: 'Easier push-up variation using elevated surface',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '15',
      name: 'Decline Push-ups',
      category: 'chest',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 8,
      sets: 4,
      description: 'Advanced push-up with feet elevated',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '16',
      name: 'Diamond Push-ups',
      category: 'chest',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 120,
      reps: 6,
      sets: 4,
      description: 'Advanced push-up variation targeting triceps',
      muscleGroups: ['triceps', 'chest', 'shoulders']
    },
    {
      id: '17',
      name: 'Dumbbell Bench Press',
      category: 'chest',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Classic chest exercise with dumbbells',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '18',
      name: 'Barbell Bench Press',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Heavy compound chest exercise',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '19',
      name: 'Chest Flyes',
      category: 'chest',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Isolation exercise for chest development',
      muscleGroups: ['chest']
    },
    {
      id: '20',
      name: 'Chest Dips',
      category: 'chest',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 3,
      description: 'Bodyweight exercise targeting lower chest',
      muscleGroups: ['chest', 'triceps', 'shoulders']
    },

    // BACK EXERCISES
    {
      id: '21',
      name: 'Pull-ups',
      category: 'back',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 8,
      sets: 4,
      description: 'Upper body pulling exercise for back and biceps',
      muscleGroups: ['back', 'biceps', 'shoulders']
    },
    {
      id: '22',
      name: 'Chin-ups',
      category: 'back',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Bicep-focused pulling exercise',
      muscleGroups: ['biceps', 'back', 'shoulders']
    },
    {
      id: '23',
      name: 'Dumbbell Rows',
      category: 'back',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Back strengthening exercise with dumbbells',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },
    {
      id: '24',
      name: 'Barbell Rows',
      category: 'back',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Compound back exercise with barbell',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },
    {
      id: '25',
      name: 'Lat Pulldowns',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Machine-based back exercise',
      muscleGroups: ['lats', 'biceps', 'rear-delts']
    },
    {
      id: '26',
      name: 'Seated Cable Rows',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Cable machine back exercise',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },
    {
      id: '27',
      name: 'T-Bar Rows',
      category: 'back',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Heavy compound back exercise',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },

    // SHOULDER EXERCISES
    {
      id: '28',
      name: 'Pike Push-ups',
      category: 'shoulders',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 10,
      sets: 4,
      description: 'Shoulder-focused push-up variation',
      muscleGroups: ['shoulders', 'triceps', 'core']
    },
    {
      id: '29',
      name: 'Overhead Press',
      category: 'shoulders',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Shoulder strengthening exercise',
      muscleGroups: ['shoulders', 'triceps', 'core']
    },
    {
      id: '30',
      name: 'Lateral Raises',
      category: 'shoulders',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 3,
      description: 'Isolation exercise for shoulder width',
      muscleGroups: ['shoulders']
    },
    {
      id: '31',
      name: 'Front Raises',
      category: 'shoulders',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 3,
      description: 'Front deltoid isolation exercise',
      muscleGroups: ['shoulders']
    },
    {
      id: '32',
      name: 'Rear Delt Flyes',
      category: 'shoulders',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 3,
      description: 'Rear deltoid strengthening exercise',
      muscleGroups: ['rear-delts', 'shoulders']
    },
    {
      id: '33',
      name: 'Arnold Press',
      category: 'shoulders',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 4,
      description: 'Complex shoulder exercise with rotation',
      muscleGroups: ['shoulders', 'triceps']
    },
    {
      id: '34',
      name: 'Upright Rows',
      category: 'shoulders',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Compound shoulder and trap exercise',
      muscleGroups: ['shoulders', 'traps']
    },

    // ARM EXERCISES (BICEPS/TRICEPS)
    {
      id: '35',
      name: 'Bicep Curls',
      category: 'arms',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 4,
      description: 'Isolation exercise for bicep development',
      muscleGroups: ['biceps']
    },
    {
      id: '36',
      name: 'Hammer Curls',
      category: 'arms',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 4,
      description: 'Neutral grip bicep exercise',
      muscleGroups: ['biceps', 'forearms']
    },
    {
      id: '37',
      name: 'Tricep Dips',
      category: 'arms',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 12,
      sets: 4,
      description: 'Bodyweight tricep exercise using chair or bench',
      muscleGroups: ['triceps', 'shoulders', 'chest']
    },
    {
      id: '38',
      name: 'Tricep Extensions',
      category: 'arms',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 4,
      description: 'Isolation exercise for tricep development',
      muscleGroups: ['triceps']
    },
    {
      id: '39',
      name: 'Close-Grip Push-ups',
      category: 'arms',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 10,
      sets: 4,
      description: 'Push-up variation targeting triceps',
      muscleGroups: ['triceps', 'chest']
    },
    {
      id: '40',
      name: 'Preacher Curls',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 4,
      description: 'Isolated bicep exercise using preacher bench',
      muscleGroups: ['biceps']
    },

    // LEG EXERCISES
    {
      id: '41',
      name: 'Squats',
      category: 'legs',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 4,
      description: 'Bodyweight squats for lower body strength',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '42',
      name: 'Jump Squats',
      category: 'legs',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 12,
      sets: 4,
      description: 'Explosive squat variation for power',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves']
    },
    {
      id: '43',
      name: 'Goblet Squats',
      category: 'legs',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Dumbbell squat variation for added resistance',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'core']
    },
    {
      id: '44',
      name: 'Barbell Back Squats',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Heavy compound lower body exercise',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'core']
    },
    {
      id: '45',
      name: 'Lunges',
      category: 'legs',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 4,
      description: 'Unilateral leg exercise for balance and strength',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves']
    },
    {
      id: '46',
      name: 'Walking Lunges',
      category: 'legs',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      reps: 20,
      sets: 4,
      description: 'Dynamic lunge variation',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves']
    },
    {
      id: '47',
      name: 'Bulgarian Split Squats',
      category: 'legs',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 4,
      description: 'Single-leg squat variation',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '48',
      name: 'Deadlifts',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Compound movement for full-body strength',
      muscleGroups: ['hamstrings', 'glutes', 'back', 'core']
    },
    {
      id: '49',
      name: 'Romanian Deadlifts',
      category: 'legs',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Hamstring-focused deadlift variation',
      muscleGroups: ['hamstrings', 'glutes', 'back']
    },
    {
      id: '50',
      name: 'Calf Raises',
      category: 'legs',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 20,
      sets: 4,
      description: 'Isolation exercise for calf muscles',
      muscleGroups: ['calves']
    },
    {
      id: '51',
      name: 'Hip Thrusts',
      category: 'legs',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 4,
      description: 'Glute-focused exercise',
      muscleGroups: ['glutes', 'hamstrings']
    },
    {
      id: '52',
      name: 'Leg Press',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 240,
      reps: 12,
      sets: 4,
      description: 'Machine-based leg exercise',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },

    // CORE EXERCISES
    {
      id: '53',
      name: 'Plank',
      category: 'core',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      description: 'Core strengthening isometric hold',
      muscleGroups: ['core', 'shoulders']
    },
    {
      id: '54',
      name: 'Side Plank',
      category: 'core',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      description: 'Lateral core strengthening exercise',
      muscleGroups: ['core', 'obliques', 'shoulders']
    },
    {
      id: '55',
      name: 'Crunches',
      category: 'core',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 20,
      sets: 4,
      description: 'Basic abdominal exercise',
      muscleGroups: ['abs']
    },
    {
      id: '56',
      name: 'Bicycle Crunches',
      category: 'core',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 30,
      sets: 4,
      description: 'Dynamic core exercise targeting obliques',
      muscleGroups: ['abs', 'obliques']
    },
    {
      id: '57',
      name: 'Russian Twists',
      category: 'core',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 30,
      sets: 4,
      description: 'Rotational core exercise',
      muscleGroups: ['obliques', 'abs']
    },
    {
      id: '58',
      name: 'Dead Bug',
      category: 'core',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 10,
      sets: 4,
      description: 'Core stability exercise',
      muscleGroups: ['core', 'hip-flexors']
    },
    {
      id: '59',
      name: 'Hanging Leg Raises',
      category: 'core',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 120,
      reps: 10,
      sets: 4,
      description: 'Advanced core exercise using pull-up bar',
      muscleGroups: ['abs', 'hip-flexors']
    },
    {
      id: '60',
      name: 'Ab Wheel Rollouts',
      category: 'core',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 120,
      reps: 8,
      sets: 4,
      description: 'Advanced core strengthening exercise',
      muscleGroups: ['core', 'shoulders']
    },
    {
      id: '61',
      name: 'Mountain Climbers',
      category: 'core',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      reps: 30,
      sets: 4,
      description: 'Dynamic core and cardio exercise',
      muscleGroups: ['core', 'shoulders', 'legs']
    },

    // FLEXIBILITY & MOBILITY
    {
      id: '62',
      name: 'Cat-Cow Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Spinal mobility exercise',
      muscleGroups: ['spine', 'core']
    },
    {
      id: '63',
      name: 'Downward Dog',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Full-body stretch from yoga',
      muscleGroups: ['hamstrings', 'calves', 'shoulders', 'back']
    },
    {
      id: '64',
      name: 'Child\'s Pose',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Relaxing stretch for back and shoulders',
      muscleGroups: ['back', 'shoulders', 'hips']
    },
    {
      id: '65',
      name: 'Standing Quad Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Standing stretch for quadriceps',
      muscleGroups: ['quads']
    },
    {
      id: '66',
      name: 'Seated Hamstring Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Seated forward fold for hamstrings',
      muscleGroups: ['hamstrings', 'lower-back']
    },
    {
      id: '67',
      name: 'Standing Calf Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Wall-assisted calf stretch',
      muscleGroups: ['calves']
    },
    {
      id: '68',
      name: 'Arm Circles',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Dynamic shoulder warmup',
      muscleGroups: ['shoulders', 'arms']
    },
    {
      id: '69',
      name: 'Hip Circles',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Dynamic hip mobility exercise',
      muscleGroups: ['hips', 'glutes']
    },
    {
      id: '70',
      name: 'Neck Rolls',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 60,
      description: 'Gentle neck mobility exercise',
      muscleGroups: ['neck']
    },
    {
      id: '71',
      name: 'Torso Twists',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Standing spinal rotation stretch',
      muscleGroups: ['obliques', 'spine']
    },
    {
      id: '72',
      name: 'Tricep Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Overhead tricep and shoulder stretch',
      muscleGroups: ['triceps', 'shoulders']
    },
    {
      id: '73',
      name: 'Chest Doorway Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Doorway pec stretch',
      muscleGroups: ['chest', 'shoulders']
    },
    {
      id: '74',
      name: 'Butterfly Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Seated inner thigh and hip stretch',
      muscleGroups: ['inner-thighs', 'hips']
    },
    {
      id: '75',
      name: 'Pigeon Pose',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      description: 'Deep hip flexor stretch',
      muscleGroups: ['hip-flexors', 'glutes']
    },
    {
      id: '76',
      name: 'Figure-4 Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Hip and glute stretch',
      muscleGroups: ['glutes', 'hips']
    },
    {
      id: '77',
      name: 'Cobra Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Back extension stretch',
      muscleGroups: ['abs', 'hip-flexors', 'spine']
    },
    {
      id: '78',
      name: 'Side Bend Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 90,
      description: 'Standing lateral stretch',
      muscleGroups: ['obliques', 'lats']
    },
    {
      id: '79',
      name: 'Wrist Circles',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 60,
      description: 'Wrist mobility exercise',
      muscleGroups: ['forearms', 'wrists']
    },
    {
      id: '80',
      name: 'Ankle Circles',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 60,
      description: 'Ankle mobility exercise',
      muscleGroups: ['ankles', 'calves']
    },
    {
      id: '81',
      name: 'Lunge Hip Flexor Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Deep hip flexor stretch in lunge position',
      muscleGroups: ['hip-flexors', 'quads']
    },
    {
      id: '82',
      name: 'Spinal Twist',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Seated spinal rotation stretch',
      muscleGroups: ['spine', 'obliques', 'back']
    },

    // FUNCTIONAL TRAINING
    {
      id: '83',
      name: 'Turkish Get-ups',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 300,
      reps: 5,
      sets: 3,
      description: 'Complex full-body movement pattern',
      muscleGroups: ['full-body', 'core', 'shoulders']
    },
    {
      id: '84',
      name: 'Farmer\'s Walk',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      description: 'Functional carrying exercise',
      muscleGroups: ['grip', 'core', 'traps', 'legs']
    },
    {
      id: '85',
      name: 'Bear Crawl',
      category: 'functional',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      description: 'Quadrupedal movement pattern',
      muscleGroups: ['full-body', 'core', 'shoulders']
    },
    {
      id: '86',
      name: 'Kettlebell Swings',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 20,
      sets: 4,
      description: 'Explosive hip hinge movement',
      muscleGroups: ['glutes', 'hamstrings', 'core', 'shoulders']
    },
    {
      id: '87',
      name: 'Box Jumps',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 3,
      description: 'Explosive lower body exercise',
      muscleGroups: ['legs', 'glutes', 'calves']
    },

    // GYM MACHINES - CHEST
    {
      id: '116',
      name: 'Chest Press Machine',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Machine-based chest press with controlled movement',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '74',
      name: 'Pec Deck Machine',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 15,
      sets: 3,
      description: 'Isolation machine for chest flyes',
      muscleGroups: ['chest']
    },
    {
      id: '75',
      name: 'Cable Crossover',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Cable machine chest exercise with constant tension',
      muscleGroups: ['chest', 'shoulders']
    },
    {
      id: '76',
      name: 'Smith Machine Bench Press',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Guided barbell bench press on Smith machine',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '77',
      name: 'Incline Bench Press Machine',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 10,
      sets: 4,
      description: 'Machine targeting upper chest',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },

    // GYM MACHINES - BACK
    {
      id: '78',
      name: 'Assisted Pull-up Machine',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 10,
      sets: 4,
      description: 'Machine-assisted pull-ups for back development',
      muscleGroups: ['back', 'biceps', 'shoulders']
    },
    {
      id: '79',
      name: 'Cable Lat Pulldown',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Wide grip lat pulldown on cable machine',
      muscleGroups: ['lats', 'back', 'biceps']
    },
    {
      id: '80',
      name: 'Low Row Machine',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Seated machine for horizontal pulling',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },
    {
      id: '81',
      name: 'Back Extension Machine',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Lower back strengthening machine',
      muscleGroups: ['lower-back', 'glutes', 'hamstrings']
    },
    {
      id: '82',
      name: 'Reverse Fly Machine',
      category: 'back',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Machine for rear delts and upper back',
      muscleGroups: ['rear-delts', 'back', 'shoulders']
    },

    // GYM MACHINES - SHOULDERS
    {
      id: '83',
      name: 'Shoulder Press Machine',
      category: 'shoulders',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Machine-based overhead shoulder press',
      muscleGroups: ['shoulders', 'triceps']
    },
    {
      id: '84',
      name: 'Lateral Raise Machine',
      category: 'shoulders',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Machine isolation for side deltoids',
      muscleGroups: ['shoulders']
    },
    {
      id: '85',
      name: 'Rear Delt Machine',
      category: 'shoulders',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Dedicated machine for rear deltoid development',
      muscleGroups: ['rear-delts', 'shoulders']
    },

    // GYM MACHINES - ARMS
    {
      id: '86',
      name: 'Cable Bicep Curls',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 12,
      sets: 4,
      description: 'Cable machine bicep curls with constant tension',
      muscleGroups: ['biceps']
    },
    {
      id: '87',
      name: 'Cable Tricep Pushdown',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 12,
      sets: 4,
      description: 'Cable machine tricep isolation exercise',
      muscleGroups: ['triceps']
    },
    {
      id: '88',
      name: 'Tricep Dip Machine',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 12,
      sets: 4,
      description: 'Assisted or weighted tricep dip machine',
      muscleGroups: ['triceps', 'chest', 'shoulders']
    },
    {
      id: '89',
      name: 'EZ Bar Curl',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 12,
      sets: 4,
      description: 'Bicep curls using EZ curl bar',
      muscleGroups: ['biceps', 'forearms']
    },
    {
      id: '90',
      name: 'Cable Overhead Tricep Extension',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 150,
      reps: 12,
      sets: 3,
      description: 'Overhead cable extension for tricep stretch',
      muscleGroups: ['triceps']
    },

    // GYM MACHINES - LEGS
    {
      id: '91',
      name: 'Leg Extension Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 15,
      sets: 4,
      description: 'Quad isolation machine',
      muscleGroups: ['quads']
    },
    {
      id: '92',
      name: 'Leg Curl Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 15,
      sets: 4,
      description: 'Hamstring isolation machine',
      muscleGroups: ['hamstrings']
    },
    {
      id: '93',
      name: 'Hack Squat Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Angled squat machine for leg development',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '94',
      name: 'Smith Machine Squats',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Guided barbell squats on Smith machine',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '95',
      name: 'Calf Raise Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 20,
      sets: 4,
      description: 'Standing or seated calf raise machine',
      muscleGroups: ['calves']
    },
    {
      id: '96',
      name: 'Leg Press Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 240,
      reps: 12,
      sets: 4,
      description: 'Heavy leg press machine for overall leg development',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '97',
      name: 'Hip Abductor Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Machine for outer thigh and hip abductors',
      muscleGroups: ['glutes', 'outer-thighs']
    },
    {
      id: '98',
      name: 'Hip Adductor Machine',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Machine for inner thigh adductors',
      muscleGroups: ['inner-thighs']
    },
    {
      id: '99',
      name: 'Glute Ham Raise',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Advanced hamstring and glute exercise',
      muscleGroups: ['hamstrings', 'glutes', 'lower-back']
    },

    // GYM MACHINES - CORE
    {
      id: '100',
      name: 'Cable Crunch',
      category: 'core',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 150,
      reps: 15,
      sets: 4,
      description: 'Weighted cable crunches for ab development',
      muscleGroups: ['abs', 'core']
    },
    {
      id: '101',
      name: 'Cable Wood Chop',
      category: 'core',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 150,
      reps: 12,
      sets: 3,
      description: 'Rotational core exercise using cable',
      muscleGroups: ['obliques', 'abs', 'core']
    },
    {
      id: '102',
      name: 'Decline Sit-ups',
      category: 'core',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 150,
      reps: 15,
      sets: 4,
      description: 'Sit-ups on decline bench for added resistance',
      muscleGroups: ['abs', 'core']
    },
    {
      id: '103',
      name: 'Captain\'s Chair Leg Raises',
      category: 'core',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 150,
      reps: 12,
      sets: 4,
      description: 'Leg raises using captain\'s chair apparatus',
      muscleGroups: ['abs', 'hip-flexors']
    },

    // GYM MACHINES - CARDIO
    {
      id: '104',
      name: 'Stair Climber',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 1200,
      description: 'Stair climbing machine for cardio and leg endurance',
      muscleGroups: ['legs', 'glutes', 'cardiovascular']
    },
    {
      id: '105',
      name: 'Assault Bike',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 900,
      description: 'High-intensity air bike for full-body cardio',
      muscleGroups: ['full-body', 'cardiovascular']
    },
    {
      id: '106',
      name: 'Ski Erg Machine',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 900,
      description: 'Skiing motion machine for upper body cardio',
      muscleGroups: ['arms', 'core', 'back', 'cardiovascular']
    },
    {
      id: '107',
      name: 'VersaClimber',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 600,
      description: 'Vertical climbing machine for intense cardio',
      muscleGroups: ['full-body', 'cardiovascular']
    },

    // GYM FREE WEIGHTS - Additional
    {
      id: '108',
      name: 'Barbell Front Squats',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Front-loaded squat variation emphasizing quads',
      muscleGroups: ['quads', 'core', 'glutes']
    },
    {
      id: '109',
      name: 'Barbell Overhead Press',
      category: 'shoulders',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 8,
      sets: 4,
      description: 'Standing barbell shoulder press',
      muscleGroups: ['shoulders', 'triceps', 'core']
    },
    {
      id: '110',
      name: 'Incline Dumbbell Press',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Incline bench press with dumbbells for upper chest',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '111',
      name: 'Dumbbell Pullover',
      category: 'back',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Dumbbell pullover for lats and chest stretch',
      muscleGroups: ['lats', 'chest', 'shoulders']
    },
    {
      id: '112',
      name: 'Barbell Shrugs',
      category: 'shoulders',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 4,
      description: 'Heavy barbell shrugs for trap development',
      muscleGroups: ['traps', 'shoulders']
    },
    {
      id: '113',
      name: 'Dumbbell Lunges',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 12,
      sets: 4,
      description: 'Weighted lunges with dumbbells',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '114',
      name: 'Barbell Curls',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 12,
      sets: 4,
      description: 'Classic barbell bicep curls',
      muscleGroups: ['biceps']
    },
    {
      id: '115',
      name: 'Dumbbell Tricep Kickbacks',
      category: 'arms',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 150,
      reps: 12,
      sets: 3,
      description: 'Isolation exercise for triceps',
      muscleGroups: ['triceps']
    },
    {
      id: '110',
      name: 'Pistol Squats',
      category: 'legs',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Single-leg squat requiring strength and balance',
      muscleGroups: ['quads', 'glutes', 'core']
    },
    {
      id: '111',
      name: 'Muscle-ups',
      category: 'back',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 180,
      reps: 5,
      sets: 4,
      description: 'Advanced pull-up transitioning to a dip',
      muscleGroups: ['back', 'chest', 'triceps', 'shoulders']
    },
    {
      id: '112',
      name: 'One-Arm Push-ups',
      category: 'chest',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 150,
      reps: 6,
      sets: 3,
      description: 'Single-arm push-up for extreme upper body strength',
      muscleGroups: ['chest', 'shoulders', 'triceps', 'core']
    },
    {
      id: '113',
      name: 'Handstand Push-ups',
      category: 'shoulders',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Inverted push-up for shoulder strength and balance',
      muscleGroups: ['shoulders', 'triceps', 'core']
    },
    {
      id: '114',
      name: 'Dragon Flags',
      category: 'core',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Advanced core exercise requiring full-body tension',
      muscleGroups: ['core', 'abs', 'hip-flexors']
    },
    {
      id: '115',
      name: 'Weighted Pull-ups',
      category: 'back',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 240,
      reps: 6,
      sets: 4,
      description: 'Pull-ups with added weight for strength progression',
      muscleGroups: ['back', 'biceps', 'forearms']
    },
    {
      id: '116',
      name: 'Clapping Push-ups',
      category: 'chest',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 150,
      reps: 10,
      sets: 3,
      description: 'Explosive push-up requiring power and speed',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '117',
      name: 'Archer Pull-ups',
      category: 'back',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 180,
      reps: 6,
      sets: 3,
      description: 'One-arm assisted pull-up variation',
      muscleGroups: ['back', 'biceps', 'core']
    },
    {
      id: '118',
      name: 'L-Sit Hold',
      category: 'core',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 90,
      sets: 3,
      description: 'Static hold with legs extended parallel to ground',
      muscleGroups: ['core', 'hip-flexors', 'shoulders']
    },
    {
      id: '119',
      name: 'Planche Lean',
      category: 'shoulders',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 120,
      sets: 4,
      description: 'Advanced calisthenics progression for planche',
      muscleGroups: ['shoulders', 'core', 'chest']
    },
    {
      id: '120',
      name: 'Front Lever Hold',
      category: 'back',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 90,
      sets: 3,
      description: 'Static hold parallel to ground on pull-up bar',
      muscleGroups: ['back', 'core', 'shoulders']
    },
    {
      id: '121',
      name: 'Weighted Dips',
      category: 'chest',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 240,
      reps: 8,
      sets: 4,
      description: 'Dips with added weight for increased resistance',
      muscleGroups: ['chest', 'triceps', 'shoulders']
    },
    {
      id: '122',
      name: 'Box Jump Overs',
      category: 'legs',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Explosive jumping over box for power development',
      muscleGroups: ['legs', 'glutes', 'calves', 'core']
    },
    {
      id: '123',
      name: 'Snatch',
      category: 'functional',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 300,
      reps: 5,
      sets: 5,
      description: 'Olympic lift requiring explosive full-body power',
      muscleGroups: ['full-body', 'shoulders', 'legs', 'back']
    },
    {
      id: '124',
      name: 'Clean and Jerk',
      category: 'functional',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 300,
      reps: 5,
      sets: 5,
      description: 'Olympic lift combining power and technique',
      muscleGroups: ['full-body', 'shoulders', 'legs', 'back']
    },
    {
      id: '125',
      name: 'Sissy Squats',
      category: 'legs',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 150,
      reps: 10,
      sets: 3,
      description: 'Advanced quad isolation exercise',
      muscleGroups: ['quads', 'core']
    },
    {
      id: '126',
      name: 'Nordic Curls',
      category: 'legs',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 150,
      reps: 6,
      sets: 3,
      description: 'Eccentric hamstring exercise requiring control',
      muscleGroups: ['hamstrings', 'core']
    },
    {
      id: '127',
      name: 'Ring Dips',
      category: 'chest',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 180,
      reps: 10,
      sets: 4,
      description: 'Dips on unstable rings for enhanced difficulty',
      muscleGroups: ['chest', 'triceps', 'shoulders', 'core']
    },
    {
      id: '128',
      name: 'Ring Rows Elevated Feet',
      category: 'back',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Inverted rows with elevated feet for increased resistance',
      muscleGroups: ['back', 'biceps', 'core']
    },
    {
      id: '129',
      name: 'Deficit Deadlifts',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 300,
      reps: 6,
      sets: 4,
      description: 'Deadlift from elevated platform for increased range',
      muscleGroups: ['hamstrings', 'glutes', 'back', 'core']
    },
    {
      id: '130',
      name: 'Overhead Squat',
      category: 'legs',
      equipment: 'gym',
      difficulty: 'advanced',
      duration: 240,
      reps: 8,
      sets: 4,
      description: 'Squat with barbell overhead requiring mobility and strength',
      muscleGroups: ['quads', 'glutes', 'shoulders', 'core']
    },
    {
      id: '131',
      name: 'Kettlebell Swings',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 20,
      sets: 4,
      description: 'Kettlebell explosive hip hinge movement for power',
      muscleGroups: ['hamstrings', 'glutes', 'core', 'shoulders']
    },
    {
      id: '132',
      name: 'Kettlebell Turkish Get-up',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 240,
      reps: 5,
      sets: 3,
      description: 'Complex movement from floor to standing with kettlebell overhead',
      muscleGroups: ['full-body', 'core', 'shoulders']
    },
    {
      id: '133',
      name: 'Kettlebell Goblet Squat',
      category: 'legs',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Front-loaded squat holding kettlebell',
      muscleGroups: ['quads', 'glutes', 'core']
    },
    {
      id: '134',
      name: 'Treadmill Hill Sprints',
      category: 'cardio',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 900,
      description: 'High-intensity sprints on incline treadmill',
      muscleGroups: ['legs', 'glutes', 'cardiovascular']
    },
    {
      id: '135',
      name: 'Stationary Bike Intervals',
      category: 'cardio',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 1200,
      description: 'Interval training on stationary bike',
      muscleGroups: ['legs', 'cardiovascular']
    },
    {
      id: '136',
      name: 'Rowing Machine Intervals',
      category: 'cardio',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 1200,
      description: 'High-intensity rowing with rest periods',
      muscleGroups: ['back', 'legs', 'arms', 'cardiovascular']
    },
    {
      id: '137',
      name: 'Resistance Band Chest Press',
      category: 'chest',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 15,
      sets: 3,
      description: 'Chest press using resistance bands',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '138',
      name: 'Resistance Band Rows',
      category: 'back',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 15,
      sets: 3,
      description: 'Rowing motion with resistance band',
      muscleGroups: ['back', 'biceps']
    },
    {
      id: '139',
      name: 'Resistance Band Squats',
      category: 'legs',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 15,
      sets: 3,
      description: 'Squats with resistance band tension',
      muscleGroups: ['quads', 'glutes']
    },
    {
      id: '140',
      name: 'Stability Ball Crunches',
      category: 'core',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 20,
      sets: 3,
      description: 'Crunches on stability ball for core',
      muscleGroups: ['abs', 'core']
    },
    {
      id: '141',
      name: 'Stability Ball Pike',
      category: 'core',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 150,
      reps: 12,
      sets: 3,
      description: 'Pike movement with feet on stability ball',
      muscleGroups: ['core', 'shoulders', 'abs']
    },
    {
      id: '142',
      name: 'Medicine Ball Slams',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 120,
      reps: 15,
      sets: 4,
      description: 'Explosive overhead medicine ball slams',
      muscleGroups: ['core', 'shoulders', 'back']
    },
    {
      id: '143',
      name: 'Medicine Ball Russian Twists',
      category: 'core',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 150,
      reps: 30,
      sets: 3,
      description: 'Rotational core exercise with medicine ball',
      muscleGroups: ['obliques', 'core']
    },
    {
      id: '144',
      name: 'TRX Rows',
      category: 'back',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Suspension trainer rowing exercise',
      muscleGroups: ['back', 'biceps', 'core']
    },
    {
      id: '145',
      name: 'TRX Push-ups',
      category: 'chest',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Push-ups using suspension trainer for instability',
      muscleGroups: ['chest', 'shoulders', 'triceps', 'core']
    },
    {
      id: '146',
      name: 'Bench Step-ups',
      category: 'legs',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 4,
      description: 'Step-ups using workout bench',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '147',
      name: 'Bench Dips',
      category: 'arms',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 150,
      reps: 15,
      sets: 3,
      description: 'Tricep dips using workout bench',
      muscleGroups: ['triceps', 'shoulders']
    }
  ];

  // Helper function to detect and label equipment requirements for an exercise
  const addEquipmentLabels = (exercise: Exercise): Exercise => {
    const nameLower = exercise.name.toLowerCase();
    const descLower = exercise.description.toLowerCase();
    const combined = nameLower + ' ' + descLower;

    let equipmentRequired = '';
    let equipmentOptional = '';

    // Check for required equipment based on exercise name/description
    if (combined.includes('dumbbell')) equipmentRequired = 'Dumbbells';
    else if (combined.includes('kettlebell')) equipmentRequired = 'Kettlebell';
    else if (combined.includes('barbell')) equipmentRequired = 'Barbell';
    else if (combined.includes('pull-up') || combined.includes('chin-up')) equipmentRequired = 'Pull-up bar';
    else if (combined.includes('bench press') || combined.includes('bench dip')) equipmentRequired = 'Workout bench';
    else if (combined.includes('resistance band')) equipmentRequired = 'Resistance bands';
    else if (combined.includes('medicine ball')) equipmentRequired = 'Medicine ball';
    else if (combined.includes('stability ball')) equipmentRequired = 'Stability ball';
    else if (combined.includes('ab wheel')) equipmentRequired = 'Ab wheel';
    else if (combined.includes('trx') || combined.includes('suspension')) equipmentRequired = 'TRX/Suspension trainer';
    else if (combined.includes('treadmill')) equipmentRequired = 'Treadmill';
    else if (combined.includes('bike') || combined.includes('cycling')) equipmentRequired = 'Stationary bike';
    else if (combined.includes('rowing') || combined.includes('rower')) equipmentRequired = 'Rowing machine';
    else if (combined.includes('elliptical')) equipmentRequired = 'Elliptical';
    else if (combined.includes('jump rope')) equipmentRequired = 'Jump rope';
    else if (combined.includes('battle rope')) equipmentRequired = 'Battle ropes';
    else if (combined.includes('box jump')) equipmentRequired = 'Box/Platform';
    else if (combined.includes('squat rack')) equipmentRequired = 'Squat rack';
    else if (combined.includes('dip bar') || combined.includes('parallel bar')) equipmentRequired = 'Dip bars';
    else if (combined.includes('foam roller')) equipmentRequired = 'Foam roller';
    else if (combined.includes('slider') || combined.includes('gliding')) equipmentRequired = 'Sliders';
    else if (combined.includes('weighted vest')) equipmentRequired = 'Weighted vest';
    else if (combined.includes('ankle weight')) equipmentRequired = 'Ankle weights';
    else if (combined.includes('ring')) equipmentRequired = 'Gymnastic rings';

    // Check for optional equipment (exercises that can be done with or without)
    if (combined.includes('step-up') && !equipmentRequired) equipmentOptional = 'Bench/Platform (or use stairs)';
    else if (combined.includes('elevated') && exercise.equipment === 'none') equipmentOptional = 'Platform/Box (or use chair)';
    else if (combined.includes('incline push-up')) equipmentOptional = 'Bench/Platform (or use wall)';
    else if (combined.includes('decline push-up')) equipmentOptional = 'Platform/Box (or use couch)';
    else if (combined.includes('hip thrust') && !equipmentRequired) equipmentOptional = 'Bench (or use floor)';
    else if (combined.includes('goblet squat') && !equipmentRequired) equipmentOptional = 'Dumbbell/Kettlebell';
    else if ((combined.includes('squat') || combined.includes('lunge')) && exercise.equipment === 'none') equipmentOptional = 'Weights for added resistance';

    return {
      ...exercise,
      equipmentRequired: equipmentRequired || undefined,
      equipmentOptional: equipmentOptional || undefined
    };
  };

  const generateWorkout = () => {
    setIsGenerating(true);

    // Simulate AI generation delay
    setTimeout(() => {
      if (selectedFilters.planType === 'weekly') {
        generateWeeklyPlan();
      } else {
        generateSingleWorkout();
      }
      setIsGenerating(false);
    }, 2000);
  };

  // Helper function to check if exercise matches user's available equipment
  const exerciseMatchesEquipment = (exercise: Exercise): boolean => {
    if (selectedFilters.equipment === 'none') {
      return exercise.equipment === 'none';
    } else if (selectedFilters.equipment === 'gym') {
      return ['none', 'basic', 'gym'].includes(exercise.equipment);
    } else if (selectedFilters.equipment === 'basic') {
      // For basic equipment, check specific equipment requirements
      if (exercise.equipment === 'none') return true;

      // Get user's available equipment
      const userEquipment = user.availableEquipment || [];
      if (userEquipment.length === 0) return exercise.equipment === 'none';

      // If exercise is marked as 'basic', check if it requires specific equipment
      if (exercise.equipment === 'basic') {
        // Check exercise name/description for equipment keywords
        const exerciseLower = (exercise.name + ' ' + exercise.description).toLowerCase();

        // Helper function to check if user has any variation of equipment
        const hasEquipment = (keywords: string[], equipmentNames: string[]): boolean => {
          return keywords.some(keyword => exerciseLower.includes(keyword)) &&
                 equipmentNames.some(name => userEquipment.some(eq => eq.toLowerCase().includes(name.toLowerCase())));
        };

        // Check specific equipment matches with new naming
        if (hasEquipment(['dumbbell'], ['dumbbell'])) return true;
        if (hasEquipment(['kettlebell'], ['kettlebell'])) return true;
        if (hasEquipment(['resistance band'], ['resistance band', 'resistance tube', 'mini band', 'loop band'])) return true;
        if (hasEquipment(['pull-up', 'pull up', 'chin-up', 'chin up'], ['pull-up bar'])) return true;
        if (hasEquipment(['bench'], ['bench'])) return true;
        if (hasEquipment(['medicine ball'], ['medicine ball'])) return true;
        if (hasEquipment(['ab wheel'], ['ab wheel'])) return true;
        if (hasEquipment(['dip'], ['dip bars', 'parallel bars', 'bench'])) return true;
        if (hasEquipment(['jump rope'], ['jump rope'])) return true;
        if (hasEquipment(['suspension', 'trx'], ['trx', 'suspension trainer'])) return true;
        if (hasEquipment(['stability ball'], ['stability ball'])) return true;
        if (hasEquipment(['box jump'], ['step platform', 'box'])) return true;
        if (hasEquipment(['barbell'], ['barbell', 'ez curl bar'])) return true;
        if (hasEquipment(['battle rope'], ['battle rope'])) return true;
        if (hasEquipment(['ring'], ['gymnastic rings'])) return true;
        if (hasEquipment(['treadmill'], ['treadmill'])) return true;
        if (hasEquipment(['bike', 'cycling'], ['stationary bike'])) return true;
        if (hasEquipment(['rowing', 'rower'], ['rowing machine'])) return true;
        if (hasEquipment(['elliptical'], ['elliptical'])) return true;
        if (hasEquipment(['squat rack'], ['squat rack'])) return true;
        if (hasEquipment(['weight plate'], ['weight plate'])) return true;
        if (hasEquipment(['foam roller'], ['foam roller'])) return true;
        if (hasEquipment(['slider', 'gliding'], ['slider', 'gliding disc'])) return true;
        if (hasEquipment(['weighted vest'], ['weighted vest'])) return true;
        if (hasEquipment(['ankle weight'], ['ankle weight'])) return true;
        if (hasEquipment(['yoga mat'], ['yoga mat'])) return true;

        // If no specific equipment found, allow generic basic exercises
        return userEquipment.length > 0;
      }

      return false;
    }
    return false;
  };

  const generateSingleWorkout = () => {
    const targetDuration = parseInt(selectedFilters.duration) * 60; // Convert to seconds
    const warmupTime = 5 * 60; // 5 minutes
    const cooldownTime = 5 * 60; // 5 minutes
    const exerciseTime = targetDuration - warmupTime - cooldownTime;

    // Get underused muscle groups for better variety
    const underusedMuscles = getUnderusedMuscleGroups();

    // Filter exercises based on user equipment and difficulty
    const filteredExercises = sampleExercises.filter(exercise => {
      const equipmentMatch = exerciseMatchesEquipment(exercise);

      // Match difficulty based on user level
      let difficultyMatch = false;
      if (selectedFilters.difficulty === 'beginner') {
        difficultyMatch = exercise.difficulty === 'beginner';
      } else if (selectedFilters.difficulty === 'intermediate') {
        difficultyMatch = exercise.difficulty === 'intermediate' || exercise.difficulty === 'beginner';
      } else if (selectedFilters.difficulty === 'advanced') {
        // For advanced users: mostly advanced, allow some intermediate but no beginner (except stretches)
        difficultyMatch = exercise.difficulty === 'advanced' ||
          (exercise.difficulty === 'intermediate' && exercise.category !== 'flexibility');
      }

      // Enhanced category matching for specific body parts
      const categoryMatch =
        selectedFilters.focusAreas.length === 0 ||
        selectedFilters.focusAreas.includes('full-body') ||
        selectedFilters.focusAreas.some(focusArea => (
          exercise.category === focusArea ||
          (focusArea === 'upper-body' && ['chest', 'back', 'shoulders', 'arms'].includes(exercise.category)) ||
          (focusArea === 'lower-body' && ['legs'].includes(exercise.category)) ||
          (focusArea === 'core' && exercise.category === 'core') ||
          (focusArea === 'cardio' && exercise.category === 'cardio') ||
          (focusArea === 'flexibility' && exercise.category === 'flexibility')
        ));

      return equipmentMatch && difficultyMatch && categoryMatch;
    });

    // Prioritize exercises based on difficulty and underused muscle groups
    const prioritizedExercises = filteredExercises.sort((a, b) => {
      // For advanced users, prioritize advanced difficulty exercises
      if (selectedFilters.difficulty === 'advanced') {
        if (a.difficulty === 'advanced' && b.difficulty !== 'advanced') return -1;
        if (b.difficulty === 'advanced' && a.difficulty !== 'advanced') return 1;
      }

      // Then prioritize exercises targeting underused muscle groups
      const aTargetsUnderused = underusedMuscles.some(muscle => a.muscleGroups.includes(muscle));
      const bTargetsUnderused = underusedMuscles.some(muscle => b.muscleGroups.includes(muscle));
      if (aTargetsUnderused && !bTargetsUnderused) return -1;
      if (!aTargetsUnderused && bTargetsUnderused) return 1;
      return 0.5 - Math.random();
    });

    // Select exercises to fill the target time more accurately
    const selectedExercises: Exercise[] = [];
    let currentTime = 0;
    let exerciseIndex = 0;

    // First pass: add exercises that fit within time
    while (exerciseIndex < prioritizedExercises.length) {
      const exercise = prioritizedExercises[exerciseIndex];
      const exerciseDuration = exercise.duration || 120;
      const restTime = getRestTime(selectedFilters.difficulty, exercise.category);
      const totalExerciseTime = exerciseDuration + restTime;

      if (currentTime + totalExerciseTime <= exerciseTime) {
        selectedExercises.push({
          ...exercise,
          restTime: restTime
        });
        currentTime += totalExerciseTime;
      }
      exerciseIndex++;
    }

    // Second pass: if we're more than 5 minutes short, try to add more exercises
    const timeRemaining = exerciseTime - currentTime;
    if (timeRemaining > 300 && prioritizedExercises.length > selectedExercises.length) {
      const unusedExercises = prioritizedExercises.filter(
        ex => !selectedExercises.some(sel => sel.id === ex.id)
      );

      for (const exercise of unusedExercises) {
        const exerciseDuration = exercise.duration || 120;
        const restTime = getRestTime(selectedFilters.difficulty, exercise.category);
        const totalExerciseTime = exerciseDuration + restTime;

        if (currentTime + totalExerciseTime <= exerciseTime) {
          selectedExercises.push({
            ...exercise,
            restTime: restTime
          });
          currentTime += totalExerciseTime;

          if (exerciseTime - currentTime < 300) break;
        }
      }
    }

    // Add warm-up and cool-down exercises - select random stretches
    const allStretches = sampleExercises.filter(ex => ex.category === 'flexibility');
    const shuffledStretches = allStretches.sort(() => 0.5 - Math.random());
    const warmupExercises = shuffledStretches.slice(0, 2);
    const cooldownExercises = shuffledStretches.slice(2, 4);

    // Calculate actual total time including warmup and cooldown
    const actualTotalMinutes = Math.round((warmupTime + currentTime + cooldownTime) / 60);
    const targetMinutes = parseInt(selectedFilters.duration);
    const timeDifference = Math.abs(actualTotalMinutes - targetMinutes);

    const newPlan: WorkoutPlan = {
      id: Date.now().toString(),
      userId: user.id,
      name: `${selectedFilters.focusAreas.length > 0 ? selectedFilters.focusAreas.map(f => f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')).join(' + ') : 'Full Body'} Workout`,
      description: `AI-generated ${actualTotalMinutes}-minute workout tailored to your goals${timeDifference > 0 ? ` (target: ${targetMinutes}min)` : ''}`,
      exercises: [
        ...warmupExercises.map(ex => addEquipmentLabels({ ...ex, isWarmup: true })),
        ...selectedExercises.map(ex => addEquipmentLabels(ex)),
        ...cooldownExercises.map(ex => addEquipmentLabels({ ...ex, isCooldown: true }))
      ],
      duration: parseInt(selectedFilters.duration),
      difficulty: selectedFilters.difficulty as 'beginner' | 'intermediate' | 'advanced',
      category: selectedFilters.focusAreas.length === 1 ? selectedFilters.focusAreas[0] : 'full-body',
      equipment: selectedFilters.equipment,
      createdAt: new Date()
    };

    setGeneratedPlan(newPlan);
  };

  const generateWeeklyPlan = () => {
    const schedule = getWeeklySchedule(weeklyFrequency, selectedFilters.focusAreas);
    const weeklyWorkouts: WorkoutPlan[] = [];

    schedule.forEach((dayPlan, index) => {
      const targetDuration = parseInt(selectedFilters.duration) * 60;
      const warmupTime = 5 * 60;
      const cooldownTime = 5 * 60;
      const exerciseTime = targetDuration - warmupTime - cooldownTime;

      // Filter exercises for this day's focus
      const filteredExercises = sampleExercises.filter(exercise => {
        const equipmentMatch = exerciseMatchesEquipment(exercise);

        // Match difficulty based on user level
        let difficultyMatch = false;
        if (selectedFilters.difficulty === 'beginner') {
          difficultyMatch = exercise.difficulty === 'beginner';
        } else if (selectedFilters.difficulty === 'intermediate') {
          difficultyMatch = exercise.difficulty === 'intermediate' || exercise.difficulty === 'beginner';
        } else if (selectedFilters.difficulty === 'advanced') {
          // For advanced users: mostly advanced, allow some intermediate but no beginner (except stretches)
          difficultyMatch = exercise.difficulty === 'advanced' ||
            (exercise.difficulty === 'intermediate' && exercise.category !== 'flexibility');
        }

        // Enhanced focus matching for specific body parts
        const focusMatch =
          exercise.category === dayPlan.focus ||
          (dayPlan.focus === 'upper-body' && ['chest', 'back', 'shoulders', 'arms'].includes(exercise.category)) ||
          (dayPlan.focus === 'lower-body' && ['legs'].includes(exercise.category)) ||
          (dayPlan.focus === 'core' && exercise.category === 'core') ||
          (dayPlan.focus === 'cardio' && exercise.category === 'cardio') ||
          (dayPlan.focus === 'full-body');

        return equipmentMatch && difficultyMatch && focusMatch;
      });

      // Select exercises for this day to match target duration
      const shuffled = [...filteredExercises].sort(() => 0.5 - Math.random());
      const selectedExercises: Exercise[] = [];
      let currentTime = 0;
      let exerciseIndex = 0;

      // First pass: add exercises
      while (exerciseIndex < shuffled.length) {
        const exercise = shuffled[exerciseIndex];
        const exerciseDuration = exercise.duration || 120;
        const restTime = getRestTime(selectedFilters.difficulty, exercise.category);
        const totalExerciseTime = exerciseDuration + restTime;

        if (currentTime + totalExerciseTime <= exerciseTime) {
          selectedExercises.push({
            ...exercise,
            restTime: restTime
          });
          currentTime += totalExerciseTime;
        }
        exerciseIndex++;
      }

      // Second pass: fill remaining time if more than 5 minutes short
      const timeRemaining = exerciseTime - currentTime;
      if (timeRemaining > 300 && shuffled.length > selectedExercises.length) {
        const unusedExercises = shuffled.filter(
          ex => !selectedExercises.some(sel => sel.id === ex.id)
        );

        for (const exercise of unusedExercises) {
          const exerciseDuration = exercise.duration || 120;
          const restTime = getRestTime(selectedFilters.difficulty, exercise.category);
          const totalExerciseTime = exerciseDuration + restTime;

          if (currentTime + totalExerciseTime <= exerciseTime) {
            selectedExercises.push({
              ...exercise,
              restTime: restTime
            });
            currentTime += totalExerciseTime;

            if (exerciseTime - currentTime < 300) break;
          }
        }
      }

      const allStretches = sampleExercises.filter(ex => ex.category === 'flexibility');
      const shuffledStretches = [...allStretches].sort(() => 0.5 - Math.random());
      const warmupExercises = shuffledStretches.slice(0, 2);
      const cooldownExercises = shuffledStretches.slice(2, 4);

      const dayWorkout: WorkoutPlan = {
        id: `${Date.now()}-${index}`,
        userId: user.id,
        name: `${dayPlan.day} - ${dayPlan.focus.charAt(0).toUpperCase() + dayPlan.focus.slice(1).replace('-', ' ')} Focus`,
        description: `${parseInt(selectedFilters.duration)}-minute ${dayPlan.focus} workout for ${dayPlan.day}`,
        exercises: [
          ...warmupExercises.map(ex => addEquipmentLabels({ ...ex, isWarmup: true })),
          ...selectedExercises.map(ex => addEquipmentLabels(ex)),
          ...cooldownExercises.map(ex => addEquipmentLabels({ ...ex, isCooldown: true }))
        ],
        duration: parseInt(selectedFilters.duration),
        difficulty: selectedFilters.difficulty as 'beginner' | 'intermediate' | 'advanced',
        category: dayPlan.focus,
        equipment: selectedFilters.equipment,
        dayOfWeek: dayPlan.day,
        scheduledDate: dayPlan.date,
        focusArea: dayPlan.focus,
        createdAt: new Date()
      };

      weeklyWorkouts.push(dayWorkout);
    });

    const weeklyPlan: WorkoutPlan = {
      id: Date.now().toString(),
      userId: user.id,
      name: selectedFilters.focusAreas.length > 0
        ? `${weeklyFrequency}-Day ${selectedFilters.focusAreas.map(f => f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')).join(' + ')} Plan`
        : `Weekly Workout Plan - ${weeklyFrequency} Days`,
      description: selectedFilters.focusAreas.length > 0
        ? `${weeklyFrequency}-day plan focused on ${selectedFilters.focusAreas.map(f => f.replace('-', ' ')).join(', ')}`
        : `Complete ${weeklyFrequency}-day workout plan with recommended rest days`,
      exercises: [],
      duration: parseInt(selectedFilters.duration),
      difficulty: selectedFilters.difficulty as 'beginner' | 'intermediate' | 'advanced',
      category: 'weekly-plan',
      equipment: selectedFilters.equipment,
      isWeeklyPlan: true,
      weeklyWorkouts: weeklyWorkouts,
      createdAt: new Date()
    };

    setGeneratedPlan(weeklyPlan);
  };

  const saveWorkout = async () => {
    if (!generatedPlan) return;

    setIsSaving(true);
    try {
      if (generatedPlan.isWeeklyPlan) {
        // Save weekly plan
        const { data: planData, error: planError } = await supabase
          .from('saved_workout_plans')
          .insert({
            user_id: user.id,
            plan_name: generatedPlan.name,
            plan_description: generatedPlan.description,
            duration_minutes: generatedPlan.duration,
            difficulty: generatedPlan.difficulty,
            equipment: generatedPlan.equipment,
            category: generatedPlan.category,
            is_weekly_plan: true,
            start_date: new Date().toISOString().split('T')[0],
            plan_data: { exercises: generatedPlan.exercises }
          })
          .select()
          .single();

        if (planError) throw planError;

        // Save each day's workout with scheduled dates
        if (planData && generatedPlan.weeklyWorkouts) {
          const weeklyWorkoutsData = generatedPlan.weeklyWorkouts.map(workout => ({
            saved_plan_id: planData.id,
            day_of_week: workout.dayOfWeek!,
            scheduled_date: workout.scheduledDate ? workout.scheduledDate.toISOString().split('T')[0] : null,
            workout_name: workout.name,
            focus_area: workout.focusArea,
            workout_data: { exercises: workout.exercises }
          }));

          const { error: workoutsError } = await supabase
            .from('saved_weekly_workouts')
            .insert(weeklyWorkoutsData);

          if (workoutsError) throw workoutsError;

          // Also save to planned_workouts table for calendar display
          const plannedWorkoutsData = generatedPlan.weeklyWorkouts.map(workout => ({
            user_id: user.id,
            date: workout.scheduledDate ? workout.scheduledDate.toISOString().split('T')[0] : null,
            workout_plan: {
              exercises: workout.exercises,
              description: workout.description,
              difficulty: workout.difficulty,
              equipment: workout.equipment
            },
            workout_name: workout.name,
            duration_minutes: workout.duration,
            focus_area: workout.focusArea,
            is_completed: false
          }));

          const { error: plannedError } = await supabase
            .from('planned_workouts')
            .insert(plannedWorkoutsData);

          if (plannedError) {
            console.error('Error saving to planned_workouts:', plannedError);
          }
        }

        setSaveMessage('Weekly plan saved successfully!');
        await loadSavedPlan(); // Reload to get the saved plan
      } else {
        // Save single workout
        const { error } = await supabase
          .from('saved_workout_plans')
          .insert({
            user_id: user.id,
            plan_name: generatedPlan.name,
            plan_description: generatedPlan.description,
            duration_minutes: generatedPlan.duration,
            difficulty: generatedPlan.difficulty,
            equipment: generatedPlan.equipment,
            category: generatedPlan.category,
            is_weekly_plan: false,
            plan_data: { exercises: generatedPlan.exercises }
          });

        if (error) throw error;
        setSaveMessage('Workout saved successfully!');
      }

      setWorkoutPlans([...workoutPlans, generatedPlan]);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveMessage('Error saving workout. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const markWorkoutComplete = async (workout: WorkoutPlan, date: Date) => {
    try {
      const { error } = await supabase
        .from('workout_plan_completions')
        .insert({
          user_id: user.id,
          saved_plan_id: savedPlan?.id || null,
          workout_date: date.toISOString().split('T')[0],
          workout_name: workout.name,
          day_of_week: workout.dayOfWeek || null,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reload completions to update UI
      await loadCompletions();
      setCompletedWorkouts(prev => new Set([...prev, workout.id]));
    } catch (error) {
      console.error('Error marking workout complete:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center text-[#0074D9] hover:text-blue-700 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-[#2C2C2C]">AI Workout Planner</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-6">
              <Filter className="w-5 h-5 text-[#0074D9] mr-2" />
              <h2 className="text-lg font-semibold text-[#2C2C2C]">Customize Your Workout</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Plan Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedFilters(prev => ({ ...prev, planType: 'single' }))}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedFilters.planType === 'single'
                        ? 'border-[#0074D9] bg-blue-50 text-[#0074D9]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Single Workout
                  </button>
                  <button
                    onClick={() => setSelectedFilters(prev => ({ ...prev, planType: 'weekly' }))}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedFilters.planType === 'weekly'
                        ? 'border-[#0074D9] bg-blue-50 text-[#0074D9]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Weekly Plan
                  </button>
                </div>
              </div>

              {selectedFilters.planType === 'weekly' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Select Workout Days
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedWorkoutDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])}
                          className="text-xs text-[#0074D9] hover:text-blue-700 font-medium"
                        >
                          All
                        </button>
                        <button
                          onClick={() => setSelectedWorkoutDays([])}
                          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayShort, index) => {
                        const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
                        const isSelected = selectedWorkoutDays.includes(fullDay);
                        return (
                          <button
                            key={fullDay}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedWorkoutDays(prev => prev.filter(d => d !== fullDay));
                              } else {
                                setSelectedWorkoutDays(prev => [...prev, fullDay]);
                              }
                            }}
                            className={`
                              p-3 rounded-lg border-2 transition-all duration-200 text-center text-sm font-semibold
                              ${isSelected
                                ? 'border-[#0074D9] bg-[#0074D9] text-white shadow-md'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-[#0074D9] hover:bg-blue-50'
                              }
                            `}
                          >
                            {dayShort}
                          </button>
                        );
                      })}
                    </div>

                    {selectedWorkoutDays.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">{selectedWorkoutDays.length} days selected:</span>{' '}
                          {selectedWorkoutDays.join(', ')}
                        </p>
                      </div>
                    )}

                    {selectedWorkoutDays.length === 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          Please select at least one day for your weekly plan
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {Array.from({ length: 24 }, (_, i) => ((i + 1) * 5).toString()).map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedFilters(prev => ({ ...prev, duration }))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        selectedFilters.duration === duration
                          ? 'border-[#0074D9] bg-blue-50 text-[#0074D9]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Focus Areas (select multiple)
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'full-body', label: 'Full Body' },
                    { id: 'upper-body', label: 'Upper Body' },
                    { id: 'lower-body', label: 'Lower Body' },
                    { id: 'core', label: 'Core' },
                    { id: 'cardio', label: 'Cardio' },
                    { id: 'flexibility', label: 'Flexibility' }
                  ].map((focus) => (
                    <button
                      key={focus.id}
                      onClick={() => {
                        setSelectedFilters(prev => {
                          const isSelected = prev.focusAreas.includes(focus.id);
                          return {
                            ...prev,
                            focusAreas: isSelected
                              ? prev.focusAreas.filter(f => f !== focus.id)
                              : [...prev.focusAreas, focus.id]
                          };
                        });
                      }}
                      className={`w-full p-2 text-sm rounded-lg border text-left transition-colors ${
                        selectedFilters.focusAreas.includes(focus.id)
                          ? 'border-[#0074D9] bg-blue-50 text-[#0074D9] font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{focus.label}</span>
                        {selectedFilters.focusAreas.includes(focus.id) && (
                          <span className="text-[#0074D9]">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {selectedFilters.focusAreas.length > 0 && (
                    <button
                      onClick={() => setSelectedFilters(prev => ({ ...prev, focusAreas: [] }))}
                      className="w-full p-2 text-sm rounded-lg border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-center transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Difficulty Level</label>
                <div className="space-y-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedFilters(prev => ({ ...prev, difficulty: level }))}
                      className={`w-full p-2 text-sm rounded-lg border text-left transition-colors ${
                        selectedFilters.difficulty === level
                          ? 'border-[#0074D9] bg-blue-50 text-[#0074D9]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Equipment</label>
                <div className="space-y-2">
                  {[
                    { id: 'none', label: 'No Equipment' },
                    { id: 'basic', label: 'Basic Equipment' },
                    { id: 'gym', label: 'Full Gym' }
                  ].map((equipment) => (
                    <button
                      key={equipment.id}
                      onClick={() => setSelectedFilters(prev => ({ ...prev, equipment: equipment.id }))}
                      className={`w-full p-2 text-sm rounded-lg border text-left transition-colors ${
                        selectedFilters.equipment === equipment.id
                          ? 'border-[#0074D9] bg-blue-50 text-[#0074D9]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {equipment.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateWorkout}
                disabled={isGenerating || (selectedFilters.planType === 'weekly' && selectedWorkoutDays.length === 0)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isGenerating || (selectedFilters.planType === 'weekly' && selectedWorkoutDays.length === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0074D9] text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? 'Generating...' : `Generate AI ${selectedFilters.planType === 'weekly' ? 'Weekly Plan' : 'Workout'}`}
              </button>
            </div>
          </div>

          {/* Generated Workout */}
          <div className="lg:col-span-2">
            {isGenerating && (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#0074D9] border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Creating Your Perfect Workout</h3>
                <p className="text-gray-600">Our AI is analyzing your preferences and generating a personalized workout plan...</p>
              </div>
            )}

            {generatedPlan && !isGenerating && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                {generatedPlan.isWeeklyPlan ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-[#2C2C2C]">{generatedPlan.name}</h2>
                        <p className="text-gray-600">{generatedPlan.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveWorkout}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Save Weekly Plan
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="flex items-center text-[#0074D9] hover:text-blue-700 font-medium mb-4"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {showCalendar ? 'Hide' : 'Show'} Calendar View
                      </button>

                      {showCalendar && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(newDate.getDate() - 7);
                                setSelectedDate(newDate);
                              }}
                              className="text-[#0074D9] hover:text-blue-700"
                            >
                              ← Previous Week
                            </button>
                            <h4 className="font-semibold text-[#2C2C2C]">
                              {formatDate(getWeekDates(selectedDate)[0])} - {formatDate(getWeekDates(selectedDate)[6])}
                            </h4>
                            <button
                              onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(newDate.getDate() + 7);
                                setSelectedDate(newDate);
                              }}
                              className="text-[#0074D9] hover:text-blue-700"
                            >
                              Next Week →
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {getWeekDates(selectedDate).map((date, index) => {
                              const dayName = getDayName(date);
                              const dayWorkout = generatedPlan.weeklyWorkouts?.find(w => w.dayOfWeek === dayName);
                              const isToday = isSameDay(date, new Date());
                              const dateKey = date.toISOString().split('T')[0];
                              const hasCompletion = calendarCompletions.has(dateKey);
                              const isCompleted = dayWorkout && (completedWorkouts.has(dayWorkout.id) || hasCompletion);

                              return (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg border text-center ${
                                    isToday ? 'border-[#0074D9] bg-blue-50' :
                                    isCompleted ? 'bg-green-50 border-green-200' :
                                    dayWorkout ? 'border-gray-300' : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="text-xs text-gray-600 mb-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#0074D9]' : 'text-[#2C2C2C]'}`}>
                                    {date.getDate()}
                                  </div>
                                  {dayWorkout && (
                                    <div className="text-xs text-gray-600 truncate">
                                      {dayWorkout.focusArea?.replace('-', ' ')}
                                    </div>
                                  )}
                                  {isCompleted && (
                                    <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      {generatedPlan.weeklyWorkouts?.map((dayWorkout, dayIndex) => {
                        const isCompleted = completedWorkouts.has(dayWorkout.id) ||
                          (savedPlan && calendarCompletions.has(`${savedPlan.id}-${dayWorkout.dayOfWeek}`));
                        return (
                          <div key={dayWorkout.id} className={`border rounded-lg p-4 ${
                            isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-lg font-semibold text-[#2C2C2C]">{dayWorkout.name}</h3>
                                  {isCompleted && (
                                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                      ✓ Complete
                                    </span>
                                  )}
                                </div>
                                {dayWorkout.scheduledDate && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {dayWorkout.scheduledDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {dayWorkout.duration}min
                                </div>
                                {!isCompleted && (
                                  <button
                                    onClick={() => {
                                      setSelectedWeeklyWorkout(dayWorkout);
                                      setShowCompletionModal(true);
                                    }}
                                    className="bg-[#0074D9] text-white px-3 py-1 rounded font-medium hover:bg-blue-700 transition-colors flex items-center text-sm"
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Start
                                  </button>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedWorkouts);
                                if (expandedWorkouts.has(dayWorkout.id)) {
                                  newExpanded.delete(dayWorkout.id);
                                } else {
                                  newExpanded.add(dayWorkout.id);
                                }
                                setExpandedWorkouts(newExpanded);
                              }}
                              className="flex items-center text-[#0074D9] hover:text-blue-700 text-sm font-medium mt-2"
                            >
                              {expandedWorkouts.has(dayWorkout.id) ? (
                                <><ChevronUp className="w-4 h-4 mr-1" /> Hide Details</>
                              ) : (
                                <><ChevronDown className="w-4 h-4 mr-1" /> Show Details</>
                              )}
                            </button>

                            {expandedWorkouts.has(dayWorkout.id) && (
                              <div className="space-y-2 mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Exercises:</h4>
                                {dayWorkout.exercises.map((exercise, idx) => (
                                  <div key={idx} className={`border rounded-lg p-3 ${
                                    exercise.isWarmup ? 'border-orange-200 bg-orange-50' :
                                    exercise.isCooldown ? 'border-blue-200 bg-blue-50' :
                                    'border-gray-200 bg-white'
                                  }`}>
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-medium text-sm text-[#2C2C2C]">
                                            {exercise.isWarmup ? '🔥 ' : exercise.isCooldown ? '🧘 ' : ''}
                                            {idx + 1}. {exercise.name}
                                          </h5>
                                          {!exercise.isWarmup && !exercise.isCooldown && (
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryStyle(exercise.category).bg} ${getCategoryStyle(exercise.category).color} font-medium`}>
                                              {getCategoryStyle(exercise.category).icon} {exercise.category}
                                            </span>
                                          )}
                                        </div>
                                        {exercise.isWarmup && <span className="text-xs text-orange-600 font-medium">Warm-up</span>}
                                        {exercise.isCooldown && <span className="text-xs text-blue-600 font-medium">Cool-down</span>}
                                        <p className="text-xs text-gray-600 mt-1">{exercise.description}</p>
                                      </div>
                                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">{exercise.difficulty}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      {exercise.sets && exercise.reps && (
                                        <span className="bg-blue-100 text-[#0074D9] px-2 py-1 rounded">
                                          {exercise.sets} sets × {exercise.reps} reps
                                        </span>
                                      )}
                                      {exercise.duration && !exercise.reps && (
                                        <span className="bg-purple-100 text-[#9B59B6] px-2 py-1 rounded">
                                          {formatTime(exercise.duration)}
                                        </span>
                                      )}
                                      {exercise.restTime && !exercise.isWarmup && !exercise.isCooldown && (
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                          Rest: {formatTime(exercise.restTime)}
                                        </span>
                                      )}

                                      {exercise.equipmentRequired && (
                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium border border-orange-200">
                                          ⚠️ Requires: {exercise.equipmentRequired}
                                        </span>
                                      )}

                                      {exercise.equipmentOptional && (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                                          💡 Optional: {exercise.equipmentOptional}
                                        </span>
                                      )}

                                      {!exercise.equipmentRequired && !exercise.equipmentOptional && exercise.equipment === 'none' && (
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">
                                          ✓ No equipment needed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#2C2C2C] mb-2">Weekly Schedule Overview</h4>
                      <div className="grid grid-cols-7 gap-2 text-center text-sm">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                          const dayWorkout = generatedPlan.weeklyWorkouts?.find(w => w.dayOfWeek?.startsWith(day));
                          const isRestDay = getRestDays(weeklyFrequency).some(restDay => restDay.startsWith(day));
                          
                          return (
                            <div key={day} className={`p-2 rounded ${
                              dayWorkout ? 'bg-[#0074D9] text-white' : 
                              isRestDay ? 'bg-gray-200 text-gray-600' : 'bg-white border'
                            }`}>
                              <div className="font-medium">{day}</div>
                              <div className="text-xs mt-1">
                                {dayWorkout ? dayWorkout.focusArea?.replace('-', ' ') : 
                                 isRestDay ? 'Rest' : 'Free'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-[#2C2C2C]">{generatedPlan.name}</h2>
                        <p className="text-gray-600">{generatedPlan.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveWorkout}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Save Workout
                        </button>
                        <button
                          onClick={() => setShowCompletionModal(true)}
                          className="bg-[#16A34A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#15803D] transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Complete
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mb-6 text-sm flex-wrap gap-y-2">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {generatedPlan.duration} minutes
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Target className="w-4 h-4 mr-2" />
                        {generatedPlan.difficulty}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Dumbbell className="w-4 h-4 mr-2" />
                        {generatedPlan.equipment === 'none' ? 'No Equipment' :
                         generatedPlan.equipment === 'basic' ? 'Basic Equipment' : 'Full Gym'}
                      </div>
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Optimized Duration Match
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedSingleWorkout(!expandedSingleWorkout)}
                      className="flex items-center text-[#0074D9] hover:text-blue-700 font-medium mb-4"
                    >
                      {expandedSingleWorkout ? (
                        <><ChevronUp className="w-5 h-5 mr-2" /> Hide Exercise Details</>
                      ) : (
                        <><ChevronDown className="w-5 h-5 mr-2" /> Show Exercise Details</>
                      )}
                    </button>

                    {expandedSingleWorkout && (
                      <div className="space-y-4">
                        {generatedPlan.exercises.map((exercise, index) => (
                        <div key={exercise.id} className={`border rounded-lg p-4 ${
                          exercise.isWarmup ? 'border-orange-200 bg-orange-50' :
                          exercise.isCooldown ? 'border-blue-200 bg-blue-50' :
                          'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-[#2C2C2C]">
                              {exercise.isWarmup ? '🔥 ' : exercise.isCooldown ? '🧘 ' : ''}
                              {index + 1}. {exercise.name}
                              {exercise.isWarmup ? ' (Warm-up)' : exercise.isCooldown ? ' (Cool-down)' : ''}
                            </h3>
                            <span className="text-sm text-gray-500 capitalize">{exercise.difficulty}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{exercise.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {exercise.sets && exercise.reps && (
                              <span className="bg-blue-100 text-[#0074D9] px-2 py-1 rounded">
                                {exercise.sets} sets × {exercise.reps} reps
                              </span>
                            )}
                            {exercise.duration && !exercise.reps && (
                              <span className="bg-purple-100 text-[#9B59B6] px-2 py-1 rounded">
                                {formatTime(exercise.duration)}
                              </span>
                            )}
                            {exercise.restTime && !exercise.isWarmup && !exercise.isCooldown && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Rest: {formatTime(exercise.restTime)}
                              </span>
                            )}

                            {exercise.equipmentRequired && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium border border-orange-200">
                                ⚠️ Requires: {exercise.equipmentRequired}
                              </span>
                            )}

                            {exercise.equipmentOptional && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                                💡 Optional: {exercise.equipmentOptional}
                              </span>
                            )}

                            {!exercise.equipmentRequired && !exercise.equipmentOptional && exercise.equipment === 'none' && (
                              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">
                                ✓ No equipment needed
                              </span>
                            )}

                            <span className="text-gray-500">
                              {exercise.muscleGroups.join(', ')}
                            </span>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}

                    {!expandedSingleWorkout && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>{generatedPlan.exercises.filter(e => !e.isWarmup && !e.isCooldown).length}</strong> main exercises •
                          <strong> {generatedPlan.exercises.filter(e => e.isWarmup).length}</strong> warmup •
                          <strong> {generatedPlan.exercises.filter(e => e.isCooldown).length}</strong> cooldown
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!generatedPlan && !isGenerating && (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Customize your preferences on the left and generate your personalized {selectedFilters.planType === 'weekly' ? 'weekly plan' : 'workout'}.
                </p>
                {selectedFilters.planType === 'weekly' && (
                  <div className="bg-blue-50 p-4 rounded-lg text-left">
                    <h4 className="font-semibold text-[#2C2C2C] mb-2">Weekly Plan Benefits:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Select multiple focus areas to cycle through</li>
                      <li>• Structured progression throughout the week</li>
                      <li>• Balanced muscle group targeting</li>
                      <li>• Optimal rest day placement</li>
                      <li>• Variety to prevent workout boredom</li>
                      <li>• AI considers your workout history</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompletionModal && (selectedWeeklyWorkout || generatedPlan) && (
        <WorkoutCompletionModal
          workout={selectedWeeklyWorkout || generatedPlan!}
          userId={user.id}
          savedPlanId={savedPlan?.id}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedWeeklyWorkout(null);
          }}
          onComplete={async () => {
            if (selectedWeeklyWorkout) {
              setCompletedWorkouts(prev => new Set([...prev, selectedWeeklyWorkout.id]));
              setCompletionMessage(`${selectedWeeklyWorkout.dayOfWeek} workout completed! Great job! 🎉`);
            } else {
              setCompletionMessage('Workout completed! Great job! 🎉');
            }
            await loadCompletions();
            setTimeout(() => setCompletionMessage(''), 3000);
            setSelectedWeeklyWorkout(null);
          }}
        />
      )}

      {completionMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{completionMessage}</span>
        </div>
      )}

      {saveMessage && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{saveMessage}</span>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlanner;