import React from 'react';
import { Play, Target, Smartphone, TrendingUp, Dumbbell, Activity, Zap, Award, Calendar, Heart } from 'lucide-react';

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
              <h1 className="text-2xl brand-text">Guided Gains</h1>
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
      <section className="bg-gradient-to-br from-[#F9FAFB] via-blue-50 to-purple-50 py-20 relative overflow-hidden">
        {/* Background Fitness Icons */}
        <div className="absolute inset-0 opacity-5">
          <Dumbbell className="absolute top-10 left-10 w-32 h-32 text-[#0074D9] transform rotate-45" />
          <Activity className="absolute top-20 right-20 w-24 h-24 text-[#9B59B6]" />
          <Zap className="absolute bottom-20 left-1/4 w-28 h-28 text-[#0074D9]" />
          <Award className="absolute bottom-10 right-1/4 w-20 h-20 text-[#9B59B6] transform -rotate-12" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Dumbbell className="w-12 h-12 text-[#0074D9] mr-4" />
              <Activity className="w-12 h-12 text-[#9B59B6]" />
            </div>
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
            {/* Personalized Planning */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-200">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0074D9] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">Personalized Planning</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Dumbbell className="w-4 h-4 text-[#0074D9]" />
                <Activity className="w-4 h-4 text-[#0074D9]" />
                <Zap className="w-4 h-4 text-[#0074D9]" />
              </div>
              <p className="text-gray-600">
                AI creates custom workout plans based on your goals, fitness level, and available equipment
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border border-purple-200">
              <div className="w-20 h-20 bg-gradient-to-br from-[#9B59B6] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">Anywhere, Anytime</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-[#9B59B6]" />
                <Calendar className="w-4 h-4 text-[#9B59B6]" />
                <Activity className="w-4 h-4 text-[#9B59B6]" />
              </div>
              <p className="text-gray-600">
                Train at home, at the gym, or anywhere in between with equipment-aware recommendations
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border border-green-200">
              <div className="w-20 h-20 bg-gradient-to-br from-[#16A34A] to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">Track Progress</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award className="w-4 h-4 text-[#16A34A]" />
                <Zap className="w-4 h-4 text-[#16A34A]" />
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
              </div>
              <p className="text-gray-600">
                Stay motivated with visual progress tracking, milestones, and adaptive goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C2C2C] mb-4">
              HOW IT WORKS
            </h2>
            <p className="text-xl text-gray-600">
              Start your fitness transformation in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#0074D9] to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <Target className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#16A34A] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    1
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">Set Your Goals</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tell us about your fitness level, goals, and available equipment in a quick 2-minute setup
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#0074D9] font-medium">
                  <Dumbbell className="w-4 h-4" />
                  <span>Personalized to you</span>
                </div>
              </div>
              <div className="hidden md:block absolute top-12 left-full w-12 h-0.5 bg-gradient-to-r from-[#0074D9] to-[#9B59B6]" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#9B59B6] to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <Zap className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#16A34A] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    2
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">Get Your Plan</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI generates a custom workout plan with exercises, sets, reps, and rest times tailored to you
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#9B59B6] font-medium">
                  <Activity className="w-4 h-4" />
                  <span>AI-powered precision</span>
                </div>
              </div>
              <div className="hidden md:block absolute top-12 left-full w-12 h-0.5 bg-gradient-to-r from-[#9B59B6] to-[#16A34A]" />
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-[#16A34A] to-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <Award className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0074D9] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Log your workouts, track your streak, and watch your progress grow with visual milestones
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#16A34A] font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Results you can see</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0074D9] to-[#9B59B6] relative overflow-hidden">
        {/* Background Fitness Elements */}
        <div className="absolute inset-0 opacity-10">
          <Dumbbell className="absolute top-10 left-10 w-24 h-24 text-white transform rotate-12" />
          <Activity className="absolute top-1/2 right-10 w-32 h-32 text-white" />
          <Zap className="absolute bottom-10 left-1/4 w-20 h-20 text-white transform -rotate-45" />
          <Award className="absolute top-20 right-1/3 w-16 h-16 text-white" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Dumbbell className="w-10 h-10 text-white" />
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who've made fitness simple, sustainable, and successful
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-[#0074D9] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Get Your Free Plan
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl brand-text-solid text-white mb-4">Guided Gains</h2>
          <p className="text-gray-400">
            © 2024 Guided Gains. Making fitness accessible for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;