import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Award, Calendar, Target, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface ProgressTrackerProps {
  user: User;
  onBack: () => void;
}

interface WorkoutCompletion {
  id: string;
  workout_date: string;
  workout_name: string;
  completed_at: string;
  notes: string | null;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ user, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthData();
  }, [selectedDate, user.id]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data: completionData, error: completionError } = await supabase
        .from('workout_plan_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('workout_date', startOfMonth.toISOString().split('T')[0])
        .lte('workout_date', endOfMonth.toISOString().split('T')[0])
        .order('workout_date', { ascending: true });

      if (completionError) throw completionError;

      setCompletions(completionData || []);

      const { data: milestoneData, error: milestoneError } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (milestoneError) throw milestoneError;

      setMilestones(milestoneData || []);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: number | null; hasWorkout: boolean; workouts: WorkoutCompletion[] }> = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, hasWorkout: false, workouts: [] });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayWorkouts = completions.filter(c => c.workout_date === dateString);
      days.push({
        date: day,
        hasWorkout: dayWorkouts.length > 0,
        workouts: dayWorkouts
      });
    }

    return days;
  };

  const getMonthStats = () => {
    const totalWorkouts = completions.length;
    const uniqueDates = new Set(completions.map(c => c.workout_date)).size;

    return {
      totalWorkouts,
      activeDays: uniqueDates,
      completionRate: user.workoutFrequency > 0
        ? Math.round((uniqueDates / (user.workoutFrequency * 4)) * 100)
        : 0
    };
  };

  const stats = getMonthStats();
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = getDaysInMonth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button onClick={onBack} className="flex items-center text-[#0074D9] hover:text-blue-700 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-[#2C2C2C]">Progress Tracker</h1>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0074D9] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button onClick={onBack} className="flex items-center text-[#0074D9] hover:text-blue-700 mr-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-[#2C2C2C]">Progress Tracker</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Workouts This Month</span>
                  <Activity className="w-5 h-5 text-[#0074D9]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2C2C]">{stats.totalWorkouts}</div>
                <div className="text-sm text-green-600">{stats.activeDays} active days</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Active Days</span>
                  <Calendar className="w-5 h-5 text-[#9B59B6]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2C2C]">{stats.activeDays}</div>
                <div className="text-sm text-gray-500">days with workouts</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-[#2C2C2C]">{stats.completionRate}%</div>
                <div className="text-sm text-orange-600">of monthly goal</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-lg font-semibold text-[#2C2C2C]">{monthName}</h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={selectedDate >= new Date()}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${
                      day.date === null
                        ? 'bg-transparent'
                        : day.hasWorkout
                        ? 'bg-[#0074D9] text-white font-semibold cursor-pointer hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    title={day.hasWorkout ? `${day.workouts.length} workout${day.workouts.length > 1 ? 's' : ''}` : ''}
                  >
                    {day.date && (
                      <>
                        <span>{day.date}</span>
                        {day.hasWorkout && (
                          <span className="text-xs mt-1">{day.workouts.length > 1 ? `${day.workouts.length}x` : '✓'}</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4">Recent Workouts</h3>
              {completions.length > 0 ? (
                <div className="space-y-3">
                  {completions.slice(-5).reverse().map((completion) => (
                    <div key={completion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-[#2C2C2C]">{completion.workout_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(completion.workout_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="text-green-600 font-medium">✓</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No workouts recorded this month</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <Award className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-[#2C2C2C]">Achievements</h3>
              </div>
              {milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.slice(0, 4).map((milestone) => (
                    <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{milestone.milestone_icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#2C2C2C]">{milestone.milestone_name}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            Unlocked {new Date(milestone.unlocked_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          ✓
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">Complete workouts to unlock achievements!</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-[#0074D9] to-[#9B59B6] p-6 rounded-xl text-white">
              <h3 className="font-bold text-lg mb-2">Keep Going!</h3>
              <p className="text-blue-100 mb-4">
                Every workout brings you closer to your fitness goals. You're doing amazing!
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-sm mb-1">Monthly Progress</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{stats.activeDays} active days</span>
                  <span className="text-sm">{stats.completionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
