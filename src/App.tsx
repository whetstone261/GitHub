import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import WorkoutPlanner from './components/WorkoutPlanner';
import ProgressTracker from './components/ProgressTracker';
import ProgressDashboard from './components/ProgressDashboard';
import { User, WorkoutPlan } from './types';
import { getCurrentUser, getUserProfile } from './lib/supabase';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard' | 'planner' | 'progress' | 'progressDashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);

        if (profile) {
          const userData: User = {
            id: currentUser.id,
            name: profile.name,
            email: profile.email,
            fitnessLevel: profile.fitness_level,
            goals: profile.goals,
            equipment: profile.equipment,
            availableEquipment: profile.available_equipment,
            workoutFrequency: profile.workout_frequency,
            preferredDuration: profile.preferred_duration,
            workoutDays: profile.workout_days,
            preferences: {
              reminderTime: profile.reminder_time,
              notificationsEnabled: profile.notifications_enabled,
              focusAreas: profile.focus_areas,
            },
            createdAt: new Date(profile.created_at),
          };

          setUser(userData);
          setCurrentView('dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleUserCreated = (userData: User, isReturningUser: boolean = false) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleStartPlanning = () => {
    setCurrentView('planner');
  };

  const handleViewProgress = () => {
    setCurrentView('progress');
  };

  const handleViewProgressDashboard = () => {
    setCurrentView('progressDashboard');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleGetStarted = () => {
    setCurrentView('onboarding');
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0074D9] to-[#9B59B6] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-600">Loading Guided Gains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {currentView === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      {currentView === 'onboarding' && (
        <OnboardingFlow onComplete={handleUserCreated} />
      )}
      {currentView === 'dashboard' && user && (
        <Dashboard
          user={user}
          onStartPlanning={handleStartPlanning}
          onViewProgress={handleViewProgress}
          onViewProgressDashboard={handleViewProgressDashboard}
        />
      )}
      {currentView === 'planner' && user && (
        <WorkoutPlanner 
          user={user} 
          onBack={handleBackToDashboard}
          workoutPlans={workoutPlans}
          setWorkoutPlans={setWorkoutPlans}
        />
      )}
      {currentView === 'progress' && user && (
        <ProgressTracker
          user={user}
          onBack={handleBackToDashboard}
        />
      )}
      {currentView === 'progressDashboard' && user && (
        <ProgressDashboard
          user={user}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}

export default App;