import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthFlow from './components/AuthFlow';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import WorkoutPlanner from './components/WorkoutPlanner';
import ProgressTracker from './components/ProgressTracker';
import { User, WorkoutPlan, AuthUser } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'onboarding' | 'dashboard' | 'planner' | 'progress'>('landing');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

  const handleAuthSuccess = (userData: AuthUser) => {
    setAuthUser(userData);
    setCurrentView('onboarding');
  };

  const handleUserCreated = (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleStartPlanning = () => {
    setCurrentView('planner');
  };

  const handleViewProgress = () => {
    setCurrentView('progress');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {currentView === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      {currentView === 'auth' && (
        <AuthFlow onAuthSuccess={handleAuthSuccess} onBack={handleBackToLanding} />
      )}
      {currentView === 'onboarding' && (
        <OnboardingFlow onComplete={handleUserCreated} />
      )}
      {currentView === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onStartPlanning={handleStartPlanning}
          onViewProgress={handleViewProgress}
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
    </div>
  );
}

export default App;