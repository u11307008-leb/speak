export interface Sentence {
  text: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
  translation: string;
}

export interface PracticeSession {
  topic: string;
  sentences: Sentence[];
  currentIndex: number;
}

export type AppState = 'HOME' | 'LOADING' | 'PRACTICE' | 'RESULT';

export const TOPICS = [
  { id: 'travel', label: 'Travel & Tourism', icon: 'Plane' },
  { id: 'business', label: 'Business English', icon: 'Briefcase' },
  { id: 'daily', label: 'Daily Life', icon: 'Home' },
  { id: 'food', label: 'Food & Dining', icon: 'Utensils' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { id: 'health', label: 'Health & Fitness', icon: 'HeartPulse' },
  { id: 'tech', label: 'Technology', icon: 'Cpu' },
  { id: 'nature', label: 'Nature & Environment', icon: 'Leaf' },
  { id: 'social', label: 'Socializing', icon: 'Users' },
  { id: 'hobbies', label: 'Hobbies & Leisure', icon: 'Gamepad' },
];
