import React from 'react';
import { Play, Target, Smartphone, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/public/guided-gains-high-resolution-logo.png" 
                alt="Guided Gains Logo" 
                className="h-12 w-auto"
              />
            </div>
            <button
              onClick={onGetStarted}
              className="bg-[#0074D9] text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F9FAFB] via-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-[#2C2C2C] mb-6 leading-tight">
              Your AI-Powered
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0074D9] to-[#9B59B6]">
                Fitness Plan
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Take the guesswork out of working out. Get personalized plans that adapt to your goals, 
              fitness level, and available equipment—anytime, anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-[#0074D9] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Play className="w-5 h-5 inline mr-2" />
                Start Your Journey
              </button>
              <button className="bg-white text-[#0074D9] px-8 py-4 rounded-lg font-semibold text-lg border-2 border-[#0074D9] hover:bg-blue-50 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C2C2C] mb-4">
              SMARTER WORKOUTS. STRONGER RESULTS.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by AI to eliminate fitness confusion and build sustainable habits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[#0074D9] rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-4">Personalized Planning</h3>
              <p className="text-gray-600">
                AI creates custom workout plans based on your goals, fitness level, and available equipment
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[#9B59B6] rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-4">Anywhere, Anytime</h3>
              <p className="text-gray-600">
                Train at home, at the gym, or anywhere in between with equipment-aware recommendations
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[#7F8C8D] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-4">Track Progress</h3>
              <p className="text-gray-600">
                Stay motivated with visual progress tracking, milestones, and adaptive goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0074D9] to-[#9B59B6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who've made fitness simple, sustainable, and successful
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-[#0074D9] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Get Your Free Plan
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/public/guided-gains-high-resolution-logo.png" 
              alt="Guided Gains Logo" 
              className="h-10 w-auto brightness-0 invert"
            />
          </div>
          <p className="text-gray-400">
            © 2024 Guided Gains. Making fitness accessible for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;