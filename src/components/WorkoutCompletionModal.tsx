import { useState } from 'react';
import { X, Clock, Weight } from 'lucide-react';
import { WorkoutPlan } from '../types';
import { saveWorkoutCompletion, saveExerciseLogs, ExerciseLog } from '../lib/supabase';

interface WorkoutCompletionModalProps {
  workout: WorkoutPlan;
  userId: string;
  onClose: () => void;
  onComplete: () => void;
  savedPlanId?: string;
}

interface ExerciseData {
  exerciseId: string;
  exerciseName: string;
  exerciseCategory: string;
  sets?: number;
  reps?: number;
  weight?: number;
  durationMinutes?: number;
  notes?: string;
}

export default function WorkoutCompletionModal({
  workout,
  userId,
  onClose,
  onComplete,
  savedPlanId
}: WorkoutCompletionModalProps) {
  const [totalTime, setTotalTime] = useState<number>(workout.duration);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const mainExercises = workout.exercises.filter(ex => !ex.isWarmup && !ex.isCooldown);

  const [exerciseData, setExerciseData] = useState<Record<string, ExerciseData>>(
    mainExercises.reduce((acc, exercise) => {
      acc[exercise.id] = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseCategory: exercise.category,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: 0,
        durationMinutes: exercise.duration ? Math.round(exercise.duration / 60) : undefined,
        notes: ''
      };
      return acc;
    }, {} as Record<string, ExerciseData>)
  );

  const updateExerciseData = (exerciseId: string, field: keyof ExerciseData, value: any) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      // Save to workout_completions table (existing)
      const workoutCompletionId = await saveWorkoutCompletion(
        userId,
        workout.name,
        workout.category,
        workout.duration,
        totalTime,
        notes
      );

      if (!workoutCompletionId) {
        alert('Failed to save workout completion. Please check the database setup.');
        setIsSaving(false);
        return;
      }

      const exerciseLogs: ExerciseLog[] = Object.values(exerciseData).map(ex => ({
        workout_completion_id: workoutCompletionId,
        exercise_name: ex.exerciseName,
        exercise_category: ex.exerciseCategory,
        sets_completed: ex.sets,
        reps_completed: ex.reps,
        weight_used: ex.weight,
        duration_seconds: ex.durationMinutes ? ex.durationMinutes * 60 : undefined,
        notes: ex.notes
      }));

      await saveExerciseLogs(workoutCompletionId, exerciseLogs);

      // Also save to workout_plan_completions for calendar view
      const { supabase } = await import('../lib/supabase');
      await supabase
        .from('workout_plan_completions')
        .insert({
          user_id: userId,
          saved_plan_id: savedPlanId || null,
          workout_date: new Date().toISOString().split('T')[0],
          workout_name: workout.name,
          day_of_week: workout.dayOfWeek || null,
          completed_at: new Date().toISOString(),
          notes: notes
        });

      // Check for newly unlocked milestones
      const { data: newMilestones } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', userId)
        .gte('unlocked_at', new Date(Date.now() - 5000).toISOString());

      // Send celebration email for new milestones
      if (newMilestones && newMilestones.length > 0) {
        const { checkAndSendMilestoneEmail } = await import('../lib/emailService');
        for (const milestone of newMilestones) {
          await checkAndSendMilestoneEmail(
            userId,
            'Fitness Champion',
            milestone.milestone_type,
            milestone.milestone_name
          );
        }
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('An error occurred while saving your workout. Please check the console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#2C2C2C]">Complete Workout</h2>
            <p className="text-gray-600 mt-1">{workout.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Total Time (minutes)
            </label>
            <input
              type="number"
              value={totalTime}
              onChange={(e) => setTotalTime(parseInt(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
              min="0"
            />
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-lg text-[#2C2C2C]">Log Your Exercises</h3>

            {mainExercises.map((exercise) => (
              <div key={exercise.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-[#2C2C2C] mb-3">{exercise.name}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercise.sets && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Sets</label>
                      <input
                        type="number"
                        value={exerciseData[exercise.id]?.sets || ''}
                        onChange={(e) => updateExerciseData(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                        min="0"
                      />
                    </div>
                  )}

                  {exercise.reps && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Reps per Set</label>
                      <input
                        type="number"
                        value={exerciseData[exercise.id]?.reps || ''}
                        onChange={(e) => updateExerciseData(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                        min="0"
                      />
                    </div>
                  )}

                  {exercise.category !== 'cardio' && exercise.category !== 'flexibility' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <Weight className="w-3 h-3 inline mr-1" />
                        Weight (lbs/kg)
                      </label>
                      <input
                        type="number"
                        value={exerciseData[exercise.id]?.weight || ''}
                        onChange={(e) => updateExerciseData(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  )}

                  {exercise.duration && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={exerciseData[exercise.id]?.durationMinutes || ''}
                        onChange={(e) => updateExerciseData(exercise.id, 'durationMinutes', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={exerciseData[exercise.id]?.notes || ''}
                    onChange={(e) => updateExerciseData(exercise.id, 'notes', e.target.value)}
                    placeholder="How did it feel?"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your workout overall?"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Complete Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
