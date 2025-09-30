import React, { useState } from 'react';
import { ArrowLeft, Filter, Play, Clock, Target, Dumbbell, Calendar } from 'lucide-react';
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
    focusArea: '',
    difficulty: user.fitnessLevel,
    equipment: user.equipment
  });
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planType, setPlanType] = useState<'single' | 'weekly'>('single');
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutPlan[]>([]);
  const [weeklySettings, setWeeklySettings] = useState({
    workoutsPerWeek: user.workoutFrequency,
    restDays: [] as string[]
  });

  const sampleExercises: Exercise[] = [
    // CARDIO EXERCISES
    {
      id: '1',
      name: 'Running (Outdoor)',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 20, // 20 minutes
      description: 'Steady-pace outdoor running for cardiovascular fitness',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '2',
      name: 'Treadmill Running',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 25, // 25 minutes
      description: 'Controlled indoor running with adjustable pace and incline',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '3',
      name: 'High-Intensity Interval Running',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 15, // 15 minutes
      description: 'Alternating high-intensity sprints with recovery periods',
      muscleGroups: ['legs', 'glutes', 'core', 'cardiovascular']
    },
    {
      id: '4',
      name: 'Jumping Jacks',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 3,
      reps: 50,
      sets: 3,
      restBetweenSets: 30,
      description: 'Full-body cardio exercise to elevate heart rate',
      muscleGroups: ['legs', 'shoulders', 'core', 'cardiovascular']
    },
    {
      id: '5',
      name: 'Burpees',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 4,
      reps: 15,
      sets: 4,
      restBetweenSets: 45,
      description: 'Full-body explosive movement combining squat, plank, and jump',
      muscleGroups: ['full-body', 'cardiovascular']
    },
    {
      id: '6',
      name: 'Mountain Climbers',
      category: 'cardio',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 3,
      reps: 30,
      sets: 3,
      restBetweenSets: 30,
      description: 'Dynamic core and cardio exercise in plank position',
      muscleGroups: ['core', 'shoulders', 'legs', 'cardiovascular']
    },
    {
      id: '7',
      name: 'Cycling (Stationary)',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 30, // 30 minutes
      description: 'Low-impact cardio workout on stationary bike',
      muscleGroups: ['legs', 'glutes', 'cardiovascular']
    },
    {
      id: '8',
      name: 'Rowing Machine',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 20, // 20 minutes
      description: 'Full-body cardio workout targeting multiple muscle groups',
      muscleGroups: ['back', 'legs', 'arms', 'core', 'cardiovascular']
    },
    {
      id: '9',
      name: 'Jump Rope',
      category: 'cardio',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 10, // 10 minutes
      description: 'High-intensity cardio with coordination benefits',
      muscleGroups: ['legs', 'shoulders', 'core', 'cardiovascular']
    },
    {
      id: '10',
      name: 'Elliptical Machine',
      category: 'cardio',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 25, // 25 minutes
      description: 'Low-impact full-body cardio workout',
      muscleGroups: ['legs', 'arms', 'core', 'cardiovascular']
    },

    // UPPER BODY STRENGTH
    {
      id: '11',
      name: 'Push-ups',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 3,
      description: 'Classic push-up targeting chest, shoulders, and triceps',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '12',
      name: 'Diamond Push-ups',
      category: 'strength',
      equipment: 'none',
      difficulty: 'advanced',
      duration: 120,
      reps: 8,
      sets: 3,
      description: 'Advanced push-up variation targeting triceps',
      muscleGroups: ['triceps', 'chest', 'shoulders']
    },
    {
      id: '13',
      name: 'Pike Push-ups',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 10,
      sets: 3,
      description: 'Shoulder-focused push-up variation',
      muscleGroups: ['shoulders', 'triceps', 'core']
    },
    {
      id: '14',
      name: 'Pull-ups',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Upper body pulling exercise for back and biceps',
      muscleGroups: ['back', 'biceps', 'shoulders']
    },
    {
      id: '15',
      name: 'Chin-ups',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 8,
      sets: 3,
      description: 'Bicep-focused pulling exercise',
      muscleGroups: ['biceps', 'back', 'shoulders']
    },
    {
      id: '16',
      name: 'Dumbbell Bench Press',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Classic chest exercise with dumbbells',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '17',
      name: 'Barbell Bench Press',
      category: 'strength',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Heavy compound chest exercise',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '18',
      name: 'Dumbbell Rows',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Back strengthening exercise with dumbbells',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },
    {
      id: '19',
      name: 'Barbell Rows',
      category: 'strength',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Compound back exercise with barbell',
      muscleGroups: ['back', 'biceps', 'rear-delts']
    },
    {
      id: '20',
      name: 'Lat Pulldowns',
      category: 'strength',
      equipment: 'gym',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Machine-based back exercise',
      muscleGroups: ['lats', 'biceps', 'rear-delts']
    },
    {
      id: '21',
      name: 'Overhead Press',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 4,
      description: 'Shoulder strengthening exercise',
      muscleGroups: ['shoulders', 'triceps', 'core']
    },
    {
      id: '22',
      name: 'Lateral Raises',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 3,
      description: 'Isolation exercise for shoulder width',
      muscleGroups: ['shoulders']
    },
    {
      id: '23',
      name: 'Tricep Dips',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 12,
      sets: 3,
      description: 'Bodyweight tricep exercise using chair or bench',
      muscleGroups: ['triceps', 'shoulders', 'chest']
    },
    {
      id: '24',
      name: 'Bicep Curls',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 3,
      description: 'Isolation exercise for bicep development',
      muscleGroups: ['biceps']
    },

    // LOWER BODY STRENGTH
    {
      id: '25',
      name: 'Squats',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 3,
      description: 'Bodyweight squats for lower body strength',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '26',
      name: 'Jump Squats',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 12,
      sets: 3,
      description: 'Explosive squat variation for power',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves']
    },
    {
      id: '27',
      name: 'Goblet Squats',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'beginner',
      duration: 180,
      reps: 12,
      sets: 3,
      description: 'Dumbbell squat variation for added resistance',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'core']
    },
    {
      id: '28',
      name: 'Barbell Back Squats',
      category: 'strength',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Heavy compound lower body exercise',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'core']
    },
    {
      id: '29',
      name: 'Lunges',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 12,
      sets: 3,
      description: 'Unilateral leg exercise for balance and strength',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves']
    },
    {
      id: '30',
      name: 'Walking Lunges',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      reps: 20,
      sets: 3,
      description: 'Dynamic lunge variation',
      muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves']
    },
    {
      id: '31',
      name: 'Bulgarian Split Squats',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 3,
      description: 'Single-leg squat variation',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '32',
      name: 'Deadlifts',
      category: 'strength',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 300,
      reps: 8,
      sets: 4,
      description: 'Compound movement for full-body strength',
      muscleGroups: ['hamstrings', 'glutes', 'back', 'core']
    },
    {
      id: '33',
      name: 'Romanian Deadlifts',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 240,
      reps: 10,
      sets: 3,
      description: 'Hamstring-focused deadlift variation',
      muscleGroups: ['hamstrings', 'glutes', 'back']
    },
    {
      id: '34',
      name: 'Calf Raises',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 20,
      sets: 3,
      description: 'Isolation exercise for calf muscles',
      muscleGroups: ['calves']
    },
    {
      id: '35',
      name: 'Hip Thrusts',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 15,
      sets: 3,
      description: 'Glute-focused exercise',
      muscleGroups: ['glutes', 'hamstrings']
    },
    {
      id: '36',
      name: 'Leg Press',
      category: 'strength',
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
      id: '37',
      name: 'Plank',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      description: 'Core strengthening isometric hold',
      muscleGroups: ['core', 'shoulders']
    },
    {
      id: '38',
      name: 'Side Plank',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      description: 'Lateral core strengthening exercise',
      muscleGroups: ['core', 'obliques', 'shoulders']
    },
    {
      id: '39',
      name: 'Crunches',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 20,
      sets: 3,
      description: 'Basic abdominal exercise',
      muscleGroups: ['abs']
    },
    {
      id: '40',
      name: 'Bicycle Crunches',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 30,
      sets: 3,
      description: 'Dynamic core exercise targeting obliques',
      muscleGroups: ['abs', 'obliques']
    },
    {
      id: '41',
      name: 'Russian Twists',
      category: 'strength',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 120,
      reps: 30,
      sets: 3,
      description: 'Rotational core exercise',
      muscleGroups: ['obliques', 'abs']
    },
    {
      id: '42',
      name: 'Dead Bug',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      reps: 10,
      sets: 3,
      description: 'Core stability exercise',
      muscleGroups: ['core', 'hip-flexors']
    },
    {
      id: '43',
      name: 'Hanging Leg Raises',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 120,
      reps: 10,
      sets: 3,
      description: 'Advanced core exercise using pull-up bar',
      muscleGroups: ['abs', 'hip-flexors']
    },
    {
      id: '44',
      name: 'Ab Wheel Rollouts',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'advanced',
      duration: 120,
      reps: 8,
      sets: 3,
      description: 'Advanced core strengthening exercise',
      muscleGroups: ['core', 'shoulders']
    },

    // FLEXIBILITY & MOBILITY
    {
      id: '45',
      name: 'Cat-Cow Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      description: 'Spinal mobility exercise',
      muscleGroups: ['spine', 'core']
    },
    {
      id: '46',
      name: 'Downward Dog',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      description: 'Full-body stretch from yoga',
      muscleGroups: ['hamstrings', 'calves', 'shoulders', 'back']
    },
    {
      id: '47',
      name: 'Pigeon Pose',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 300,
      description: 'Deep hip flexor stretch',
      muscleGroups: ['hip-flexors', 'glutes']
    },
    {
      id: '48',
      name: 'Child\'s Pose',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 240,
      description: 'Relaxing stretch for back and shoulders',
      muscleGroups: ['back', 'shoulders', 'hips']
    },
    {
      id: '49',
      name: 'Hamstring Stretch',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      description: 'Seated or standing hamstring stretch',
      muscleGroups: ['hamstrings']
    },
    {
      id: '50',
      name: 'Shoulder Rolls',
      category: 'flexibility',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 120,
      description: 'Shoulder mobility exercise',
      muscleGroups: ['shoulders', 'upper-back']
    },

    // FUNCTIONAL TRAINING
    {
      id: '51',
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
      id: '52',
      name: 'Farmer\'s Walk',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      description: 'Functional carrying exercise',
      muscleGroups: ['grip', 'core', 'traps', 'legs']
    },
    {
      id: '53',
      name: 'Bear Crawl',
      category: 'functional',
      equipment: 'none',
      difficulty: 'intermediate',
      duration: 180,
      description: 'Quadrupedal movement pattern',
      muscleGroups: ['full-body', 'core', 'shoulders']
    },
    {
      id: '54',
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
      id: '55',
      name: 'Box Jumps',
      category: 'functional',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 180,
      reps: 10,
      sets: 3,
      description: 'Explosive lower body exercise',
      muscleGroups: ['legs', 'glutes', 'calves']
    }
  ];

  const generateWorkout = () => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
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

        const categoryMatch = 
          !selectedFilters.focusArea || 
          selectedFilters.focusArea === '' ||
          exercise.category === selectedFilters.focusArea ||
          (selectedFilters.focusArea === 'upper-body' && ['chest', 'shoulders', 'triceps', 'biceps', 'back'].some(muscle => exercise.muscleGroups.includes(muscle))) ||
          (selectedFilters.focusArea === 'lower-body' && ['quads', 'glutes', 'hamstrings', 'calves', 'legs'].some(muscle => exercise.muscleGroups.includes(muscle))) ||
          (selectedFilters.focusArea === 'core' && exercise.muscleGroups.includes('core')) ||
          (selectedFilters.focusArea === 'cardio' && exercise.category === 'cardio') ||
          (selectedFilters.focusArea === 'flexibility' && exercise.category === 'flexibility');

        return equipmentMatch && difficultyMatch && categoryMatch;
      });

      // Calculate target duration and select exercises to fill the time
      const targetDuration = parseInt(selectedFilters.duration);
      let currentDuration = 0;
      let selectedExercises: Exercise[] = [];
      
      const shuffled = [...filteredExercises].sort(() => 0.5 - Math.random());
      
      // Add warm-up (5 minutes)
      currentDuration += 5;
      
      // Select exercises to fill remaining time
      for (const exercise of shuffled) {
        const exerciseTime = exercise.duration + (exercise.sets && exercise.restBetweenSets ? 
          (exercise.sets - 1) * (exercise.restBetweenSets / 60) : 0);
        
        if (currentDuration + exerciseTime <= targetDuration - 5) { // Leave 5 min for cool-down
          selectedExercises.push(exercise);
          currentDuration += exerciseTime;
        }
        
        if (selectedExercises.length >= 8 || currentDuration >= targetDuration - 10) break;
      }
      
      // Add cool-down (5 minutes)
      currentDuration += 5;
      
      const newPlan: WorkoutPlan = {
        id: Date.now().toString(),
        userId: user.id,
        name: `${selectedFilters.focusArea ? selectedFilters.focusArea.charAt(0).toUpperCase() + selectedFilters.focusArea.slice(1).replace('-', ' ') : 'Full Body'} Workout`,
        description: `AI-generated ${targetDuration}-minute workout with ${selectedExercises.length} exercises`,
        exercises: selectedExercises,
        duration: targetDuration,
        difficulty: selectedFilters.difficulty as 'beginner' | 'intermediate' | 'advanced',
        category: selectedFilters.focusArea || 'full-body',
        equipment: selectedFilters.equipment,
        createdAt: new Date()
      };

      setGeneratedPlan(newPlan);
      setIsGenerating(false);
    }, 2000);
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Focus Area</label>
                <select
                  value={selectedFilters.focusArea}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, focusArea: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                >
                  <option value="">Full Body</option>
                  <option value="upper-body">Upper Body</option>
                  <option value="lower-body">Lower Body</option>
                  <option value="core">Core</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                </select>
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
                {isGenerating ? 'Generating...' : 'Generate AI Workout'}
              </button>
            </div>
          </div>

          {/* Generated Workout */}
          <div className="lg:col-span-2">
            {isGenerating && (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#0074D9] border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">
                  Creating Your Perfect {planType === 'single' ? 'Workout' : 'Weekly Plan'}
                </h3>
                <p className="text-gray-600">
                  Our AI is analyzing your preferences and generating a personalized {planType === 'single' ? 'workout' : 'weekly schedule'}...
                </p>
              </div>
            )}

            {/* Single Workout Display */}
            {generatedPlan && !isGenerating && planType === 'single' && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
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
                    {formatDuration(generatedPlan.duration)}
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

                {/* Warm-up */}
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-[#2C2C2C] mb-2">🔥 Warm-up (5 minutes)</h3>
                  <p className="text-sm text-gray-600">Light cardio and dynamic stretching to prepare your body</p>
                </div>

                <div className="space-y-4">
                  {generatedPlan.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-[#2C2C2C]">
                          {index + 1}. {exercise.name}
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
                        {exercise.restBetweenSets && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Rest: {formatRestTime(exercise.restBetweenSets)}
                          </span>
                        )}
                        {exercise.duration && (
                          <span className="bg-purple-100 text-[#9B59B6] px-2 py-1 rounded">
                            {formatDuration(exercise.duration)}
                          </span>
                        )}
                        <span className="text-gray-500">
                          {exercise.muscleGroups.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cool-down */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-[#2C2C2C] mb-2">❄️ Cool-down (5 minutes)</h3>
                  <p className="text-sm text-gray-600">Static stretching and breathing exercises to help recovery</p>
                </div>
              </div>
            )}

            {/* Weekly Plan Display */}
            {weeklyPlan.length > 0 && !isGenerating && planType === 'weekly' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#2C2C2C]">Your Weekly Workout Plan</h2>
                    <button
                      onClick={() => setWorkoutPlans([...workoutPlans, ...weeklyPlan])}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Save Weekly Plan
                    </button>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {weeklySettings.workoutsPerWeek} workout days with recommended rest on: {weeklySettings.restDays.join(', ')}
                  </p>
                </div>

                {weeklyPlan.map((plan, index) => (
                  <div key={plan.id} className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#2C2C2C]">{plan.name}</h3>
                        <p className="text-gray-600">{plan.description}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(plan.duration)}
                        </div>
                        <button className="bg-[#0074D9] text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      {plan.exercises.slice(0, 4).map((exercise, exerciseIndex) => (
                        <div key={exercise.id} className="flex items-center p-2 bg-gray-50 rounded">
                          <span className="w-5 h-5 bg-[#0074D9] text-white text-xs rounded-full flex items-center justify-center mr-2">
                            {exerciseIndex + 1}
                          </span>
                          <span className="text-gray-700">{exercise.name}</span>
                        </div>
                      ))}
                      {plan.exercises.length > 4 && (
                        <div className="flex items-center p-2 text-gray-500">
                          +{plan.exercises.length - 4} more exercises
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!generatedPlan && !weeklyPlan.length && !isGenerating && (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Customize your preferences on the left and generate your personalized {planType === 'single' ? 'workout' : 'weekly plan'}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlanner;