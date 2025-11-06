export interface User {
  id: string;
  name: string;
  email: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  equipment: 'none' | 'basic' | 'gym';
  availableEquipment?: string[];
  workoutFrequency: number;
  preferredDuration: number;
  preferences: {
    reminderTime: string;
    notificationsEnabled: boolean;
    focusAreas: string[];
  };
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  equipmentRequired?: string;
  equipmentOptional?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  reps?: number;
  sets?: number;
  description: string;
  muscleGroups: string[];
  isWarmup?: boolean;
  isCooldown?: boolean;
  restTime?: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  exercises: Exercise[];
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  equipment: string;
  createdAt: Date;
  isWeeklyPlan?: boolean;
  weeklyWorkouts?: WorkoutPlan[];
  dayOfWeek?: string;
  focusArea?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
}