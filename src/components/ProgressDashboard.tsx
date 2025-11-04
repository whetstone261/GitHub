import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Target, TrendingUp, Award, Mail, Settings } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface ProgressDashboardProps {
  user: User;
  onBack: () => void;
}

interface UserProgress {
  total_workouts_completed: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_workout_date: string | null;
  email: string | null;
  email_opt_in: boolean;
  email_frequency: string;
}

interface Milestone {
  id: string;
  milestone_type: string;
  milestone_name: string;
  milestone_icon: string;
  unlocked_at: string;
}

const motivationalQuotes = [
  "Every workout counts. You're doing amazing!",
  "Consistency is the key to transformation.",
  "Your only limit is you. Keep pushing!",
  "Progress, not perfection. You've got this!",
  "The only bad workout is the one you didn't do.",
  "Small steps every day lead to big results.",
  "You're stronger than you think!",
  "Champions train, losers complain. Keep going!",
  "Believe in yourself and all that you are.",
  "Your body can stand almost anything. It's your mind you have to convince."
];

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, onBack }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [email, setEmail] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState('daily');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const todayQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  useEffect(() => {
    loadProgressData();
    loadMilestones();
  }, [user.id]);

  const loadProgressData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles_extended')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProgress(data);
        setEmail(data.email || '');
        setEmailOptIn(data.email_opt_in);
        setEmailFrequency(data.email_frequency);
      } else {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles_extended')
          .insert({
            user_id: user.id,
            email_opt_in: false,
            total_workouts_completed: 0,
            current_streak_days: 0,
            longest_streak_days: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        setProgress(newProfile);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  };

  const saveEmailSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles_extended')
        .update({
          email: email,
          email_opt_in: emailOptIn,
          email_frequency: emailFrequency,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => {
        setSaveMessage('');
        setShowSettings(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getNextMilestone = () => {
    if (!progress) return null;

    const totalWorkouts = progress.total_workouts_completed;
    const currentStreak = progress.current_streak_days;

    if (totalWorkouts < 5) return { name: '5 Workouts Done', target: 5, current: totalWorkouts, type: 'workouts' };
    if (totalWorkouts < 10) return { name: '10 Workouts Done', target: 10, current: totalWorkouts, type: 'workouts' };
    if (totalWorkouts < 25) return { name: '25 Workouts Done', target: 25, current: totalWorkouts, type: 'workouts' };
    if (totalWorkouts < 50) return { name: '50 Workouts Done', target: 50, current: totalWorkouts, type: 'workouts' };
    if (currentStreak < 5) return { name: '5-Day Streak', target: 5, current: currentStreak, type: 'streak' };
    if (currentStreak < 10) return { name: '10-Day Streak', target: 10, current: currentStreak, type: 'streak' };
    if (currentStreak < 30) return { name: '30-Day Streak', target: 30, current: currentStreak, type: 'streak' };

    return { name: 'Keep Going!', target: 100, current: totalWorkouts, type: 'workouts' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0074D9] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const progressPercent = nextMilestone ? (nextMilestone.current / nextMilestone.target) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-[#0074D9] hover:text-blue-700 font-medium mb-2 flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-[#2C2C2C]">Your Progress</h1>
            <p className="text-gray-600 mt-1">Track your fitness journey</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Email Settings</span>
          </button>
        </div>

        {showSettings && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-[#2C2C2C] mb-4 flex items-center">
              <Mail className="w-6 h-6 mr-2 text-[#0074D9]" />
              Email Preferences
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailOptIn"
                  checked={emailOptIn}
                  onChange={(e) => setEmailOptIn(e.target.checked)}
                  className="w-4 h-4 text-[#0074D9] border-gray-300 rounded focus:ring-[#0074D9]"
                />
                <label htmlFor="emailOptIn" className="ml-2 text-gray-700">
                  Send me motivational emails and workout reminders
                </label>
              </div>

              {emailOptIn && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Frequency
                  </label>
                  <select
                    value={emailFrequency}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                  >
                    <option value="daily">Daily reminders</option>
                    <option value="every_2_days">Every 2 days</option>
                    <option value="milestone_only">Milestone celebrations only</option>
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={saveEmailSettings}
                  disabled={saving || !email}
                  className="bg-[#0074D9] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#0074D9] to-blue-600 rounded-xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Daily Motivation</h2>
            <TrendingUp className="w-8 h-8" />
          </div>
          <p className="text-lg italic">"{todayQuote}"</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#0074D9]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Workouts</h3>
              <Trophy className="w-8 h-8 text-[#0074D9]" />
            </div>
            <p className="text-4xl font-bold text-[#2C2C2C]">{progress?.total_workouts_completed || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Keep crushing it!</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Current Streak</h3>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-[#2C2C2C]">{progress?.current_streak_days || 0}</p>
            <p className="text-sm text-gray-600 mt-2">days in a row</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Best Streak</h3>
              <Target className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-[#2C2C2C]">{progress?.longest_streak_days || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Personal record</p>
          </div>
        </div>

        {nextMilestone && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-[#2C2C2C] mb-4">Next Milestone</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">{nextMilestone.name}</span>
              <span className="text-[#0074D9] font-bold">
                {nextMilestone.current} / {nextMilestone.target}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0074D9] to-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {nextMilestone.target - nextMilestone.current} more to go!
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-[#2C2C2C] mb-4 flex items-center">
            <Award className="w-6 h-6 mr-2 text-[#0074D9]" />
            Achievements ({milestones.length})
          </h2>

          {milestones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Complete your first workout to unlock achievements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="border-2 border-[#0074D9] rounded-lg p-4 bg-blue-50 hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-2 text-center">{milestone.milestone_icon}</div>
                  <h3 className="font-bold text-[#2C2C2C] text-center mb-1">
                    {milestone.milestone_name}
                  </h3>
                  <p className="text-xs text-gray-600 text-center">
                    Unlocked {new Date(milestone.unlocked_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Available Milestones</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
              <div>🥇 First Workout</div>
              <div>💪 5 Workouts</div>
              <div>💯 10 Workouts</div>
              <div>🌟 25 Workouts</div>
              <div>🔥 5-Day Streak</div>
              <div>🔥🔥 10-Day Streak</div>
              <div>🚀 30-Day Streak</div>
              <div>✨ And more...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
