import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Clock, Target } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface FitnessProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const FitnessProfileModal: React.FC<FitnessProfileModalProps> = ({ user, onClose, onSave }) => {
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(user.availableEquipment || []);
  const [reminderTime, setReminderTime] = useState<string>(user.preferences.reminderTime || '09:00');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const equipmentOptions = [
    'Dumbbells',
    'Barbell',
    'Resistance Bands',
    'Pull-up Bar',
    'Kettlebell',
    'Bench',
    'Medicine Ball',
    'Jump Rope',
    'Yoga Mat',
    'Foam Roller',
    'Cable Machine',
    'Smith Machine',
    'Leg Press Machine',
    'Rowing Machine',
    'Treadmill',
    'Stationary Bike',
    'Elliptical'
  ];

  const toggleEquipment = (equipment: string) => {
    setAvailableEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Update onboarding_preferences table
      const { error: prefsError } = await supabase
        .from('onboarding_preferences')
        .update({
          available_equipment: availableEquipment,
          reminder_time: reminderTime,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (prefsError) {
        console.error('Error updating onboarding_preferences:', prefsError);
        throw prefsError;
      }

      // Update user_stats table
      const { error } = await supabase
        .from('user_stats')
        .update({
          reminder_time: reminderTime,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating fitness profile:', error);
        throw error;
      }

      // Update local user object
      const updatedUser: User = {
        ...user,
        availableEquipment,
        preferences: {
          ...user.preferences,
          reminderTime
        }
      };

      setSaveMessage('Profile updated successfully!');

      // Wait a moment to show success message
      setTimeout(() => {
        onSave(updatedUser);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Failed to update fitness profile:', error);
      setSaveMessage('Failed to update profile. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#0074D9] rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2C2C2C]">Edit Fitness Profile</h2>
              <p className="text-sm text-gray-600">Update your equipment and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Equipment Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Dumbbell className="w-5 h-5 text-[#0074D9]" />
              <h3 className="text-lg font-semibold text-[#2C2C2C]">Available Equipment</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select all equipment you have access to. This helps us create better workout plans for you.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {equipmentOptions.map((equipment) => (
                <button
                  key={equipment}
                  onClick={() => toggleEquipment(equipment)}
                  className={`p-3 text-sm rounded-lg border transition-all ${
                    availableEquipment.includes(equipment)
                      ? 'border-[#0074D9] bg-blue-50 text-[#0074D9] font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {equipment}
                </button>
              ))}
            </div>
            {availableEquipment.length === 0 && (
              <p className="text-sm text-amber-600 mt-3 flex items-center space-x-2">
                <span>💡</span>
                <span>Select at least one piece of equipment or choose bodyweight exercises</span>
              </p>
            )}
          </div>

          {/* Reminder Time Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-[#0074D9]" />
              <h3 className="text-lg font-semibold text-[#2C2C2C]">Workout Reminder Time</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Choose what time you'd like to receive daily workout reminders.
            </p>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full sm:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0074D9] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              You'll receive a reminder at {new Date(`2000-01-01T${reminderTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })} each day
            </p>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`p-3 rounded-lg ${
              saveMessage.includes('success')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#0074D9] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FitnessProfileModal;
