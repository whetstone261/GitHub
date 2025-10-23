import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Play, Award, Bell } from 'lucide-react';
import { User } from '../types';
import { getWorkoutStats } from '../lib/supabase';

interface DashboardProps {
  user: User;
  onStartPlanning: () => void;
  onViewProgress: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartPlanning, onViewProgress }) => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    completions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user.id]);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await getWorkoutStats(user.id);
    setStats(data);
    setIsLoading(false);
  };

  const motivationalMessages = [
    "Ready to crush your fitness goals today?",
    "Every workout brings you closer to your best self!",
    "Your body can do it. It's time to convince your mind.",
    "The hardest part is showing up. You've got this!"
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/public/guided-gains-high-resolution-logo.png" 
                alt="Guided Gains Logo" 
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-gray-500" />
              <div className="w-8 h-8 bg-[#0074D9] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#0074D9] to-[#9B59B6] rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-blue-100 text-lg mb-6">{randomMessage}</p>
          <button
            onClick={onStartPlanning}
            className="bg-white text-[#0074D9] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Plan Today's Workout
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C]">Weekly Progress</h3>
                <Calendar className="w-5 h-5 text-[#0074D9]" />
              </div>
              {isLoading ? (
                <div className="text-gray-400">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#2C2C2C] mb-2">{stats.thisWeek}/{user.workoutFrequency}</div>
                  <div className="text-sm text-gray-600">Workouts completed this week</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-[#0074D9] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.thisWeek / user.workoutFrequency) * 100, 100)}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C]">Total Workouts</h3>
                <Target className="w-5 h-5 text-[#9B59B6]" />
              </div>
              {isLoading ? (
                <div className="text-gray-400">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#2C2C2C] mb-2">{stats.totalWorkouts}</div>
                  <div className="text-sm text-gray-600">All time</div>
                </>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C]">Average Duration</h3>
                <TrendingUp className="w-5 h-5 text-[#7F8C8D]" />
              </div>
              <div className="text-2xl font-bold text-[#2C2C2C] mb-2">{user.preferredDuration}min</div>
              <div className="text-sm text-gray-600">Per workout session</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C]">Current Streak</h3>
                <Award className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-[#2C2C2C] mb-2">5 days</div>
              <div className="text-sm text-orange-600">Keep it up!</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold text-[#2C2C2C] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={onStartPlanning}
                  className="w-full bg-[#0074D9] text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-left flex items-center"
                >
                  <Play className="w-4 h-4 mr-3" />
                  Create New Workout
                </button>
                <button
                  onClick={onViewProgress}
                  className="w-full bg-gray-100 text-[#2C2C2C] p-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left flex items-center"
                >
                  <TrendingUp className="w-4 h-4 mr-3" />
                  View Progress
                </button>
                <button className="w-full bg-gray-100 text-[#2C2C2C] p-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left flex items-center">
                  <Target className="w-4 h-4 mr-3" />
                  Update Goals
                </button>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold text-[#2C2C2C] mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-500 mr-3" />
                  <div className="text-sm">
                    <div className="font-medium text-[#2C2C2C]">First Week Complete!</div>
                    <div className="text-gray-600">Completed your first week of workouts</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Target className="w-5 h-5 text-[#0074D9] mr-3" />
                  <div className="text-sm">
                    <div className="font-medium text-[#2C2C2C]">Consistency King</div>
                    <div className="text-gray-600">5 days workout streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Recommendation */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-[#2C2C2C] mb-4">Today's AI Recommendation</h3>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <h4 className="font-semibold text-[#2C2C2C] mb-2">Upper Body Strength Focus</h4>
            <p className="text-gray-600 mb-4">
              Based on your recent activity, we recommend a 30-minute upper body strength workout. 
              Perfect for your {user.equipment === 'gym' ? 'gym session' : user.equipment === 'basic' ? 'home setup with basic equipment' : 'bodyweight training'}.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-white rounded-full text-sm text-[#0074D9] font-medium">
                {user.preferredDuration} minutes
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm text-[#9B59B6] font-medium">
                {user.fitnessLevel}
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm text-[#7F8C8D] font-medium">
                {user.equipment === 'gym' ? 'Gym Equipment' : user.equipment === 'basic' ? 'Basic Equipment' : 'No Equipment'}
              </span>
            </div>
            <button
              onClick={onStartPlanning}
              className="bg-[#0074D9] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start This Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;