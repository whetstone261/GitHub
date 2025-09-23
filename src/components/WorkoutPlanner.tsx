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
    focusArea: '',
    difficulty: user.fitnessLevel,
    equipment: user.equipment
  });
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const sampleExercises: Exercise[] = [
    {
      id: '1',
      name: 'Push-ups',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 60,
      reps: 12,
      sets: 3,
      description: 'Classic push-up targeting chest, shoulders, and triceps',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '2',
      name: 'Squats',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 60,
      reps: 15,
      sets: 3,
      description: 'Bodyweight squats for lower body strength',
      muscleGroups: ['quads', 'glutes', 'hamstrings']
    },
    {
      id: '3',
      name: 'Plank',
      category: 'strength',
      equipment: 'none',
      difficulty: 'beginner',
      duration: 180,
      description: 'Core strengthening isometric hold',
      muscleGroups: ['core', 'shoulders']
    },
    {
      id: '4',
      name: 'Dumbbell Bench Press',
      category: 'strength',
      equipment: 'basic',
      difficulty: 'intermediate',
      duration: 120,
      reps: 10,
      sets: 4,
      description: 'Classic chest exercise with dumbbells',
      muscleGroups: ['chest', 'shoulders', 'triceps']
    },
    {
      id: '5',
      name: 'Deadlifts',
      category: 'strength',
      equipment: 'gym',
      difficulty: 'intermediate',
      duration: 150,
      reps: 8,
      sets: 4,
      description: 'Compound movement for full-body strength',
      muscleGroups: ['hamstrings', 'glutes', 'back', 'core']
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

        return equipmentMatch && difficultyMatch;
      });

      // Select 4-6 exercises for the workout
      const selectedExercises = filteredExercises.slice(0, 5);
      
      const newPlan: WorkoutPlan = {
        id: Date.now().toString(),
        userId: user.id,
        name: `${selectedFilters.focusArea || 'Full Body'} Workout`,
        description: `AI-generated ${parseInt(selectedFilters.duration)}-minute workout tailored to your goals`,
        exercises: selectedExercises,
        duration: parseInt(selectedFilters.duration),
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
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Creating Your Perfect Workout</h3>
                <p className="text-gray-600">Our AI is analyzing your preferences and generating a personalized workout plan...</p>
              </div>
            )}

            {generatedPlan && !isGenerating && (
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
                        {exercise.duration && !exercise.reps && (
                          <span className="bg-purple-100 text-[#9B59B6] px-2 py-1 rounded">
                            {exercise.duration}s hold
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

            {!generatedPlan && !isGenerating && (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Customize your preferences on the left and click "Generate AI Workout" to create your personalized fitness plan.
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