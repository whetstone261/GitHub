import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import { AuthUser, LoginCredentials, SignupCredentials } from '../types';

interface AuthFlowProps {
  onAuthSuccess: (user: AuthUser) => void;
  onBack: () => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthSuccess, onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  
  const [signupData, setSignupData] = useState<SignupCredentials>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateSignup = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(signupData.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLogin = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignup()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if email already exists (simulate)
      const existingEmails = ['test@example.com', 'user@demo.com'];
      if (existingEmails.includes(signupData.email.toLowerCase())) {
        setErrors({ email: 'An account with this email already exists' });
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser: AuthUser = {
        id: Date.now().toString(),
        email: signupData.email,
        createdAt: new Date()
      };

      // Store in localStorage (in real app, this would be handled by backend)
      localStorage.setItem('guidedGainsUser', JSON.stringify(newUser));
      
      onAuthSuccess(newUser);
    } catch (error) {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate authentication check
      const validCredentials = [
        { email: 'demo@guidedgains.com', password: 'password123' },
        { email: 'test@example.com', password: 'testpass123' }
      ];

      const isValid = validCredentials.some(
        cred => cred.email === loginData.email && cred.password === loginData.password
      );

      if (!isValid) {
        setErrors({ general: 'Invalid email or password' });
        setIsLoading(false);
        return;
      }

      // Create user object
      const user: AuthUser = {
        id: Date.now().toString(),
        email: loginData.email,
        createdAt: new Date()
      };

      // Store in localStorage
      localStorage.setItem('guidedGainsUser', JSON.stringify(user));
      
      onAuthSuccess(user);
    } catch (error) {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoUser: AuthUser = {
        id: 'demo-user',
        email: 'demo@guidedgains.com',
        createdAt: new Date()
      };

      localStorage.setItem('guidedGainsUser', JSON.stringify(demoUser));
      onAuthSuccess(demoUser);
    } catch (error) {
      setErrors({ general: 'Demo login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center text-[#0074D9] hover:text-blue-700 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#0074D9] to-[#9B59B6] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GG</span>
              </div>
              <span className="text-xl font-bold text-[#2C2C2C]">Guided Gains</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {/* Mode Toggle */}
          <div className="bg-white rounded-lg p-1 shadow-sm mb-8">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  setMode('signup');
                  setErrors({});
                }}
                className={`py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'signup'
                    ? 'bg-[#0074D9] text-white'
                    : 'text-gray-600 hover:text-[#0074D9]'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setMode('login');
                  setErrors({});
                }}
                className={`py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-[#0074D9] text-white'
                    : 'text-gray-600 hover:text-[#0074D9]'
                }`}
              >
                Log In
              </button>
            </div>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">
                {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {mode === 'signup' 
                  ? 'Start your personalized fitness journey today'
                  : 'Continue your fitness journey'
                }
              </p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={mode === 'signup' ? signupData.email : loginData.email}
                    onChange={(e) => {
                      if (mode === 'signup') {
                        setSignupData(prev => ({ ...prev, email: e.target.value }));
                      } else {
                        setLoginData(prev => ({ ...prev, email: e.target.value }));
                      }
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={mode === 'signup' ? signupData.password : loginData.password}
                    onChange={(e) => {
                      if (mode === 'signup') {
                        setSignupData(prev => ({ ...prev, password: e.target.value }));
                      } else {
                        setLoginData(prev => ({ ...prev, password: e.target.value }));
                      }
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent transition-colors ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={mode === 'signup' ? 'Create a password (8+ characters)' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupData.confirmPassword}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }));
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent transition-colors ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold transition-all transform ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0074D9] text-white hover:bg-blue-700 hover:scale-105'
                } shadow-lg`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {mode === 'signup' ? <User className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </div>
                )}
              </button>
            </form>

            {/* Demo Login */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full py-3 bg-gray-100 text-[#2C2C2C] rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Try Demo Account
              </button>
            </div>

            {/* Additional Info */}
            {mode === 'signup' && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            )}

            {mode === 'login' && (
              <div className="mt-4 text-center">
                <button className="text-sm text-[#0074D9] hover:text-blue-700">
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          {/* Benefits Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-[#2C2C2C] mb-4 text-center">
              {mode === 'signup' ? 'Why Join Guided Gains?' : 'Welcome Back to Your Journey'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                <span>AI-powered personalized workout plans</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                <span>Progress tracking and achievements</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                <span>Workouts for any equipment level</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                <span>Motivational reminders and support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;