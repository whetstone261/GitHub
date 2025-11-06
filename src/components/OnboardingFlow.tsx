import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Target, Dumbbell, Home, Clock } from 'lucide-react';
import { User } from '../types';

interface OnboardingFlowProps {
  onComplete: (user: User) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    fitnessLevel: '',
    availableEquipment: [] as string[],
    goals: [] as string[],
    equipment: '',
    workoutFrequency: 3,
    preferredDuration: 30,
    reminderTime: '09:00',
    notificationsEnabled: true,
    focusAreas: [] as string[]
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      // Determine equipment category based on what they have
      let equipmentCategory: 'none' | 'basic' | 'gym';
      if (formData.availableEquipment.length === 0) {
        equipmentCategory = 'none';
      } else if (formData.availableEquipment.some(eq =>
        ['Treadmill', 'Stationary bike', 'Rowing machine', 'Elliptical', 'Squat rack', 'Barbell'].includes(eq)
      )) {
        equipmentCategory = 'gym';
      } else {
        equipmentCategory = 'basic';
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        fitnessLevel: formData.fitnessLevel as 'beginner' | 'intermediate' | 'advanced',
        goals: formData.goals,
        equipment: equipmentCategory,
        availableEquipment: formData.availableEquipment.length > 0 ? formData.availableEquipment : undefined,
        workoutFrequency: formData.workoutFrequency,
        preferredDuration: formData.preferredDuration,
        preferences: {
          reminderTime: formData.reminderTime,
          notificationsEnabled: formData.notificationsEnabled,
          focusAreas: formData.focusAreas,
        },
        createdAt: new Date(),
      };
      onComplete(newUser);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(item)
        ? (prev[field as keyof typeof prev] as string[]).filter((i: string) => i !== item)
        : [...(prev[field as keyof typeof prev] as string[]), item]
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name && formData.email;
      case 2: return formData.fitnessLevel;
      case 3: return formData.goals.length > 0;
      case 4: return true; // Equipment selection is optional
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2C2C2C]">Step {step} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#0074D9] to-[#9B59B6] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">Let's get started!</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">What's your fitness level?</h2>
              <div className="grid gap-4">
                {[
                  { level: 'beginner', title: 'Beginner', description: 'New to fitness or getting back into it' },
                  { level: 'intermediate', title: 'Intermediate', description: 'Regular exercise, comfortable with basics' },
                  { level: 'advanced', title: 'Advanced', description: 'Experienced, ready for challenging workouts' }
                ].map((option) => (
                  <button
                    key={option.level}
                    onClick={() => updateFormData('fitnessLevel', option.level)}
                    className={`p-4 text-left border-2 rounded-lg transition-all ${
                      formData.fitnessLevel === option.level
                        ? 'border-[#0074D9] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-[#2C2C2C]">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">What are your goals?</h2>
              <p className="text-gray-600 mb-6">Select all that apply</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'weight-loss', title: 'Weight Loss', icon: Target },
                  { id: 'muscle-gain', title: 'Muscle Gain', icon: Dumbbell },
                  { id: 'strength', title: 'Build Strength', icon: Dumbbell },
                  { id: 'endurance', title: 'Improve Endurance', icon: Target },
                  { id: 'flexibility', title: 'Increase Flexibility', icon: Target },
                  { id: 'general-fitness', title: 'General Fitness', icon: Target }
                ].map((goal) => {
                  const IconComponent = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleArrayItem('goals', goal.id)}
                      className={`p-4 text-left border-2 rounded-lg transition-all ${
                        formData.goals.includes(goal.id)
                          ? 'border-[#0074D9] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <IconComponent className="w-5 h-5 text-[#0074D9] mr-3" />
                        <span className="font-semibold text-[#2C2C2C]">{goal.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">What equipment do you have at home?</h2>
              <p className="text-gray-600 mb-6">Select all that apply (or skip if you don't have any equipment)</p>

              <div className="max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Yoga mat",
                    "Resistance bands (light)",
                    "Resistance bands (medium)",
                    "Resistance bands (heavy)",
                    "Pull-up bar (door frame)",
                    "Adjustable dumbbells",
                    "Fixed-weight dumbbells (5–10 lb)",
                    "Fixed-weight dumbbells (10–20 lb)",
                    "Fixed-weight dumbbells (20–30 lb)",
                    "Kettlebell (light)",
                    "Kettlebell (medium)",
                    "Kettlebell (heavy)",
                    "Adjustable bench",
                    "Step platform or box",
                    "Foam roller",
                    "Medicine ball",
                    "Stability ball",
                    "Ab wheel",
                    "Jump rope",
                    "Mini bands / loop bands",
                    "Sliders / gliding discs",
                    "Weight plates",
                    "EZ curl bar",
                    "Barbell",
                    "Squat rack",
                    "Dip bars / parallel bars",
                    "TRX or suspension trainer",
                    "Treadmill",
                    "Stationary bike",
                    "Rowing machine",
                    "Elliptical",
                    "Stair stepper",
                    "Punching bag",
                    "Battle ropes",
                    "Weighted vest",
                    "Pull-up assist band",
                    "Door anchor for bands",
                    "Push-up handles",
                    "Foam blocks / yoga blocks",
                    "Balance board / BOSU ball",
                    "Ankle weights",
                    "Hand grippers",
                    "Resistance tubes with handles",
                    "Pilates ring",
                    "Workout bench (flat only)",
                    "Workout bench (adjustable incline/decline)",
                    "Workout gloves",
                    "Mat towel"
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleArrayItem('availableEquipment', item)}
                      className={`p-3 text-left border-2 rounded-lg transition-all text-sm ${
                        formData.availableEquipment.includes(item)
                          ? 'border-[#0074D9] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          formData.availableEquipment.includes(item)
                            ? 'bg-[#0074D9] border-[#0074D9]'
                            : 'border-gray-300'
                        }`}>
                          {formData.availableEquipment.includes(item) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span className="font-medium text-[#2C2C2C]">{item}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.availableEquipment.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-[#0074D9] font-medium">
                    {formData.availableEquipment.length} item{formData.availableEquipment.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">Set your schedule</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workouts per week: {formData.workoutFrequency}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={formData.workoutFrequency}
                    onChange={(e) => updateFormData('workoutFrequency', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>7</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred workout duration: {formData.preferredDuration} minutes
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="15"
                    value={formData.preferredDuration}
                    onChange={(e) => updateFormData('preferredDuration', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>15 min</span>
                    <span>90 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">Stay motivated</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily reminder time</label>
                  <input
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => updateFormData('reminderTime', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={formData.notificationsEnabled}
                    onChange={(e) => updateFormData('notificationsEnabled', e.target.checked)}
                    className="h-4 w-4 text-[#0074D9] rounded border-gray-300 focus:ring-[#0074D9]"
                  />
                  <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                    Enable motivational notifications and progress updates
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              step === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-[#0074D9] hover:bg-blue-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isStepValid()
                ? 'bg-[#0074D9] text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {step === totalSteps ? 'Complete Setup' : 'Continue'}
            {step < totalSteps && <ChevronRight className="w-4 h-4 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;