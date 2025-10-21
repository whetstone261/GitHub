import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Award, Calendar, Target, Activity } from 'lucide-react';
import { User } from '../types';

interface ProgressTrackerProps {
  user: User;
  onBack: () => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ user, onBack }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');

  const achievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first workout',
      icon: '🎯',
      unlockedAt: new Date('2024-01-01'),
      progress: 100,
      target: 100
    },
    {
      id: '2',
      title: 'Consistency Champion',
      description: 'Complete 7 consecutive days',
      icon: '🔥',
      unlockedAt: new Date('2024-01-08'),
      progress: 100,
      target: 100
    },
    {
      id: '3',
      title: 'Strong Foundation',
      description: 'Complete 25 workouts',
      icon: '💪',
      progress: 48,
      target: 100
    },
    {
      id: '4',
      title: 'Time Master',
      description: 'Accumulate 10 hours of exercise',
      icon: '⏰',
      progress: 75,
      target: 100
    }
  ];

  const weeklyData = [
    { day: 'Mon', workouts: 1, duration: 30 },
    { day: 'Tue', workouts: 0, duration: 0 },
    { day: 'Wed', workouts: 1, duration: 45 },
    { day: 'Thu', workouts: 0, duration: 0 },
    { day: 'Fri', workouts: 1, duration: 30 },
    { day: 'Sat', workouts: 1, duration: 60 },
    { day: 'Sun', workouts: 0, duration: 0 }
  ];

  const stats = {
    totalWorkouts: 12,
    totalTime: 480, // minutes
    avgDuration: 40,
    currentStreak: 5,
    longestStreak: 8,
    completionRate: 85
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
            <h1 className="text-xl font-semibold text-[#2C2C2C]">Progress Tracker</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Frame Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-[#0074D9] text-white'
                    : 'text-gray-600 hover:text-[#0074D9]'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Workouts</span>
                  <Activity className="w-5 h-5 text-[#0074D9]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2C2C]">{stats.totalWorkouts}</div>
                <div className="text-sm text-green-600">+3 this week</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Time</span>
                  <Calendar className="w-5 h-5 text-[#9B59B6]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2C2C]">{Math.round(stats.totalTime / 60)}h</div>
                <div className="text-sm text-gray-500">{stats.totalTime % 60}m</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Current Streak</span>
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-[#2C2C2C]">{stats.currentStreak}</div>
                <div className="text-sm text-orange-600">days</div>
              </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-6">Weekly Activity</h3>
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className="text-sm text-gray-600 mb-2">{day.day}</div>
                    <div 
                      className={`h-20 rounded-lg flex items-end justify-center ${
                        day.workouts > 0 ? 'bg-[#0074D9]' : 'bg-gray-100'
                      }`}
                    >
                      {day.workouts > 0 && (
                        <div className="text-white text-xs pb-2">{day.duration}m</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {day.workouts > 0 ? `${day.workouts} workout${day.workouts > 1 ? 's' : ''}` : 'Rest'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Trends */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2C2C2C]">Progress Trends</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Average Duration</span>
                    <span className="font-semibold">{stats.avgDuration}min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#0074D9] h-2 rounded-full" 
                      style={{ width: `${(stats.avgDuration / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-semibold">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <Award className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-[#2C2C2C]">Achievements</h3>
              </div>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{achievement.icon}</span>
                        <div>
                          <h4 className="font-semibold text-[#2C2C2C]">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                      {achievement.unlockedAt && (
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Unlocked
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            achievement.progress === 100 ? 'bg-green-500' : 'bg-[#0074D9]'
                          }`}
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Card */}
            <div className="bg-gradient-to-r from-[#0074D9] to-[#9B59B6] p-6 rounded-xl text-white">
              <h3 className="font-bold text-lg mb-2">Keep Going!</h3>
              <p className="text-blue-100 mb-4">
                You're only 2 workouts away from your weekly goal. Every step counts towards your fitness journey!
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-sm mb-1">Weekly Goal Progress</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">3 / {user.workoutFrequency} workouts</span>
                  <span className="text-sm">{Math.round((3 / user.workoutFrequency) * 100)}%</span>
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