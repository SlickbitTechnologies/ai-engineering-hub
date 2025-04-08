export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface SentimentBreakdown {
  stronglyPositive: number;
  somewhatPositive: number;
  neutral: number;
  somewhatNegative: number;
  stronglyNegative: number;
}

export interface Theme {
  id: string;
  name: string;
  sentiment: SentimentType;
  mentions: number;
}

export interface SentimentData {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  breakdown: SentimentBreakdown;
  themes: Theme[];
} 