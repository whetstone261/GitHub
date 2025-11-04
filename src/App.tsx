import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import WorkoutPlanner from './components/WorkoutPlanner';
import ProgressTracker from './components/ProgressTracker';
import ProgressDashboard from './components/ProgressDashboard';
import { User, WorkoutPlan } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard' | 'planner' | 'progress' | 'progressDashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

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

  const handleViewProgressDashboard = () => {
    setCurrentView('progressDashboard');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleGetStarted = () => {
    setCurrentView('onboarding');
  };

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