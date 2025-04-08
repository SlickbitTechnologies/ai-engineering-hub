export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SentimentData {
  id: string;
  text: string;
  score: number;
  category: string;
  timestamp: string;
}

export interface TrendData {
  date: string;
  score: number;
  category: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}