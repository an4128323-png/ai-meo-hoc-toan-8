
export interface MathQuestion {
  id: string;
  question: string;
  answer: string;
  hint: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  exp: number;
}

export interface MathProgress {
  exercises: number;
  correct: number;
  total: number;
  exp: number;
  streak: number;
}

export enum Tab {
  HOME = 'home',
  LEARN = 'learn',
  PRACTICE = 'practice',
  CHATS = 'chats',
  PROFILE = 'profile'
}
