import React, { useState, useEffect, useRef } from 'react';
import { Calendar, TrendingUp, Target, Play, Award, Bell, Dumbbell, Activity, Zap, Heart, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { User } from '../types';
import { getWorkoutStats, calculateStreak, signOut, supabase } from '../lib/supabase';
import FitnessProfileModal from './FitnessProfileModal';

interface DashboardProps {
  user: User;
  onStartPlanning: () => void;
  onViewProgress: () => void;
  onViewProgressDashboard?: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartPlanning, onViewProgress, onViewProgressDashboard, onLogout }) => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    completions: []
  });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showFitnessProfileModal, setShowFitnessProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStats();
  }, [user.id]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    console.log('🚪 Logging out user...');

    try {
      const result = await signOut();

      if (result.success) {
        console.log('✅ Logout successful');
        // Call parent's logout handler to redirect to welcome screen
        onLogout();
      } else {
        console.error('❌ Logout failed:', result.error);
        alert('Failed to log out. Please try again.');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('❌ Logout exception:', error);
      alert('An error occurred while logging out.');
      setIsLoggingOut(false);
    }
  };

  const loadStats = async () => {
    setIsLoading(true);
    const data = await getWorkoutStats(user.id);
    setStats(data);

    if (supabase) {
      const { data: profileData } = await supabase
        .from('user_profiles_extended')
        .select('current_streak_days')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setCurrentStreak(profileData.current_streak_days || 0);
      } else {
        const streak = await calculateStreak(user.id);
        setCurrentStreak(streak);
      }
    }

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
              <h1 className="text-2xl brand-text">Guided Gains</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" />

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 bg-[#0074D9] rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Account menu"
                >
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#0074D9] rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C2C2C] truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Future: Navigate to profile settings
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span>View Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowFitnessProfileModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Edit Fitness Profile</span>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 transition-colors ${
                          isLoggingOut
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#0074D9] to-[#9B59B6] rounded-xl p-8 mb-8 text-white relative overflow-hidden">
          {/* Background Fitness Icons */}
          <div className="absolute inset-0 opacity-10">
            <Dumbbell className="absolute top-4 right-10 w-24 h-24 transform rotate-12" />
            <Activity className="absolute bottom-4 right-32 w-20 h-20" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
              <Zap className="w-8 h-8 text-yellow-300" />
            </div>
            <p className="text-blue-100 text-lg mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {randomMessage}
            </p>
            <button
              onClick={onStartPlanning}
              className="bg-white text-[#0074D9] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Dumbbell className="w-5 h-5" />
              Plan Today's Workout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-[#0074D9]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0074D9]" />
                  Weekly Progress
                </h3>
                <Activity className="w-5 h-5 text-[#0074D9] opacity-50" />
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

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-[#9B59B6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#9B59B6]" />
                  Total Workouts
                </h3>
                <Dumbbell className="w-5 h-5 text-[#9B59B6] opacity-50" />
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

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-[#16A34A]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                  Average Duration
                </h3>
                <Zap className="w-5 h-5 text-[#16A34A] opacity-50" />
              </div>
              <div className="text-2xl font-bold text-[#2C2C2C] mb-2">{user.preferredDuration}min</div>
              <div className="text-sm text-gray-600">Per workout session</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  Current Streak
                </h3>
                <div className="text-2xl">{currentStreak > 0 ? '🔥' : '💪'}</div>
              </div>
              <div className="text-2xl font-bold text-[#2C2C2C] mb-2">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</div>
              <div className="text-sm text-orange-600 flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
              </div>
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
                  View Calendar
                </button>
                {onViewProgressDashboard && (
                  <button
                    onClick={onViewProgressDashboard}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors text-left flex items-center"
                  >
                    <Award className="w-4 h-4 mr-3" />
                    Progress & Achievements
                  </button>
                )}
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

      </div>

      {/* Fitness Profile Modal */}
      {showFitnessProfileModal && (
        <FitnessProfileModal
          user={currentUser}
          onClose={() => setShowFitnessProfileModal(false)}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            loadStats();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;