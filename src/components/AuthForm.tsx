import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, Dumbbell } from 'lucide-react';

interface AuthFormProps {
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSignUp, onSignIn, isLoading, error }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (mode === 'signup' && !name) {
      setLocalError('Please enter your name');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup') {
      await onSignUp(email, password, name);
    } else {
      await onSignIn(email, password);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0074D9] to-[#9B59B6] rounded-full flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back!'}
          </h2>
          <p className="text-gray-600">
            {mode === 'signup'
              ? 'Save your progress and access your workouts anywhere'
              : 'Sign in to continue your fitness journey'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-white text-[#0074D9] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-white text-[#0074D9] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-4 h-4 inline mr-2" />
            Sign In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium mb-2">{error || localError}</p>
              {(error || localError).includes('environment variables') && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-xs text-red-600 font-semibold mb-1">📖 Quick Fix:</p>
                  <p className="text-xs text-red-600">
                    Open your browser console (F12) for detailed setup instructions, or see the 
                    <a 
                      href="https://github.com/whetstone261/GitHub/blob/main/DEPLOYMENT_ENVIRONMENT_SETUP.md" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline ml-1 font-medium"
                    >
                      deployment guide
                    </a>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#0074D9] to-[#9B59B6] hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-5 h-5 inline mr-2" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 inline mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-[#0074D9] font-medium hover:underline"
              >
                Sign in instead
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#0074D9] font-medium hover:underline"
              >
                Create one now
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
