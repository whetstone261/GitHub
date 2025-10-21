import React, { useState } from 'react';
import { ArrowLeft, Filter, Play, Clock, Target, Dumbbell } from 'lucide-react';
import { User, WorkoutPlan, Exercise } from '../types';

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

  // Helper function to get weekly workout schedule
  const getWeeklySchedule = (frequency: number, focusAreas: string[]): { day: string; focus: string }[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // If specific focus areas are selected, cycle through them
    if (focusAreas.length > 0) {
      return days.slice(0, frequency).map((day, index) => ({
        day,
        focus: focusAreas[index % focusAreas.length]
      }));
    }

    // Default balanced schedule if no focus areas selected
    const defaultFocusAreas = ['upper-body', 'lower-body', 'cardio', 'core', 'upper-body', 'lower-body'];
    return days.slice(0, frequency).map((day, index) => ({
      day,
      focus: defaultFocusAreas[index]
    }));
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
    }
  ];

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

  const generateSingleWorkout = () => {
    const targetDuration = parseInt(selectedFilters.duration) * 60; // Convert to seconds
    const warmupTime = 5 * 60; // 5 minutes
    const cooldownTime = 5 * 60; // 5 minutes
    const exerciseTime = targetDuration - warmupTime - cooldownTime;
    
    // Get underused muscle groups for better variety
    const underusedMuscles = getUnderusedMuscleGroups();
    
    // Filter exercises based on user equipment and difficulty
    const filteredExercises = sampleExercises.filter(exercise => {
      const equipmentMatch = 
        (selectedFilters.equipment === 'none' && exercise.equipment === 'none') ||
        (selectedFilters.equipment === 'basic' && ['none', 'basic'].includes(exercise.equipment)) ||
        (selectedFilters.equipment === 'gym' && ['none', 'basic', 'gym'].includes(exercise.equipment));
      
      const difficultyMatch = 
        exercise.difficulty === selectedFilters.difficulty ||
        (selectedFilters.difficulty === 'advanced' && exercise.difficulty === 'intermediate') ||
        (selectedFilters.difficulty === 'intermediate' && exercise.difficulty === 'beginner');

      // Enhanced category matching for specific body parts
      const categoryMatch =
        selectedFilters.focusAreas.length === 0 ||
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

    // Prioritize exercises that target underused muscle groups
    const prioritizedExercises = filteredExercises.sort((a, b) => {
      const aTargetsUnderused = underusedMuscles.some(muscle => a.muscleGroups.includes(muscle));
      const bTargetsUnderused = underusedMuscles.some(muscle => b.muscleGroups.includes(muscle));
      if (aTargetsUnderused && !bTargetsUnderused) return -1;
      if (!aTargetsUnderused && bTargetsUnderused) return 1;
      return 0.5 - Math.random();
    });

    // Select exercises to fill the target time
    const selectedExercises: Exercise[] = [];
    let currentTime = 0;
    let exerciseIndex = 0;

    while (currentTime < exerciseTime && exerciseIndex < prioritizedExercises.length) {
      const exercise = prioritizedExercises[exerciseIndex];
      const exerciseDuration = exercise.duration || 120; // Default 2 minutes if not specified
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

    // Add warm-up and cool-down exercises - select random stretches
    const allStretches = sampleExercises.filter(ex => ex.category === 'flexibility');
    const shuffledStretches = allStretches.sort(() => 0.5 - Math.random());
    const warmupExercises = shuffledStretches.slice(0, 2);
    const cooldownExercises = shuffledStretches.slice(2, 4);

    const newPlan: WorkoutPlan = {
      id: Date.now().toString(),
      userId: user.id,
      name: `${selectedFilters.focusAreas.length > 0 ? selectedFilters.focusAreas.map(f => f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')).join(' + ') : 'Full Body'} Workout`,
      description: `AI-generated ${parseInt(selectedFilters.duration)}-minute workout tailored to your goals`,
      exercises: [
        ...warmupExercises.map(ex => ({ ...ex, isWarmup: true })),
        ...selectedExercises,
        ...cooldownExercises.map(ex => ({ ...ex, isCooldown: true }))
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
        const equipmentMatch = 
          (selectedFilters.equipment === 'none' && exercise.equipment === 'none') ||
          (selectedFilters.equipment === 'basic' && ['none', 'basic'].includes(exercise.equipment)) ||
          (selectedFilters.equipment === 'gym' && ['none', 'basic', 'gym'].includes(exercise.equipment));
        
        const difficultyMatch = 
          exercise.difficulty === selectedFilters.difficulty ||
          (selectedFilters.difficulty === 'advanced' && exercise.difficulty === 'intermediate') ||
          (selectedFilters.difficulty === 'intermediate' && exercise.difficulty === 'beginner');

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

      // Select exercises for this day
      const shuffled = [...filteredExercises].sort(() => 0.5 - Math.random());
      const selectedExercises: Exercise[] = [];
      let currentTime = 0;
      let exerciseIndex = 0;

      while (currentTime < exerciseTime && exerciseIndex < shuffled.length) {
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
          ...warmupExercises.map(ex => ({ ...ex, isWarmup: true })),
          ...selectedExercises,
          ...cooldownExercises.map(ex => ({ ...ex, isCooldown: true }))
        ],
        duration: parseInt(selectedFilters.duration),
        difficulty: selectedFilters.difficulty as 'beginner' | 'intermediate' | 'advanced',
        category: dayPlan.focus,
        equipment: selectedFilters.equipment,
        dayOfWeek: dayPlan.day,
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

  const saveWorkout = () => {
    if (generatedPlan) {
      setWorkoutPlans([...workoutPlans, generatedPlan]);
      // Could add a success toast here
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Workouts per week: {weeklyFrequency}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="6"
                    value={weeklyFrequency}
                    onChange={(e) => setWeeklyFrequency(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>3 days</span>
                    <span>6 days</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Rest days:</strong> {getRestDays(weeklyFrequency).join(', ')}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {['15', '30', '45', '60'].map((duration) => (
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
                  Focus Areas {selectedFilters.planType === 'weekly' && '(select multiple)'}
                </label>
                <div className="space-y-2">
                  {[
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
                              : prev.planType === 'single'
                                ? [focus.id]
                                : [...prev.focusAreas, focus.id]
                          };
                        });
                      }}
                      className={`w-full p-2 text-sm rounded-lg border text-left transition-colors ${
                        selectedFilters.focusAreas.includes(focus.id)
                          ? 'border-[#0074D9] bg-blue-50 text-[#0074D9]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {focus.label}
                      {selectedFilters.focusAreas.includes(focus.id) && selectedFilters.planType === 'weekly' && (
                        <span className="ml-2 text-xs">(selected)</span>
                      )}
                    </button>
                  ))}
                  {selectedFilters.focusAreas.length > 0 && (
                    <button
                      onClick={() => setSelectedFilters(prev => ({ ...prev, focusAreas: [] }))}
                      className="w-full p-2 text-sm rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 text-center"
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
                disabled={isGenerating}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isGenerating
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

                    <div className="grid gap-4">
                      {generatedPlan.weeklyWorkouts?.map((dayWorkout, dayIndex) => (
                        <div key={dayWorkout.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#2C2C2C]">{dayWorkout.name}</h3>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-1" />
                                {dayWorkout.duration}min
                              </div>
                              <button className="bg-[#0074D9] text-white px-3 py-1 rounded font-medium hover:bg-blue-700 transition-colors flex items-center text-sm">
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {dayWorkout.exercises.map((exercise, index) => (
                              <div key={exercise.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{index + 1}. {exercise.name}</span>
                                <div className="flex items-center space-x-2">
                                  {exercise.sets && exercise.reps && (
                                    <span className="bg-blue-100 text-[#0074D9] px-2 py-1 rounded text-xs">
                                      {exercise.sets}×{exercise.reps}
                                    </span>
                                  )}
                                  {exercise.duration && !exercise.reps && (
                                    <span className="bg-purple-100 text-[#9B59B6] px-2 py-1 rounded text-xs">
                                      {formatTime(exercise.duration)}
                                    </span>
                                  )}
                                  {exercise.restTime && (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                      Rest: {formatTime(exercise.restTime)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
                        <button className="bg-[#0074D9] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
                          <Play className="w-4 h-4 mr-2" />
                          Start Now
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mb-6 text-sm">
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
                    </div>

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
                          <div className="flex items-center space-x-4 text-sm">
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
                            <span className="text-gray-500">
                              {exercise.muscleGroups.join(', ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
    </div>
  );
};

export default WorkoutPlanner;