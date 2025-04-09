export type ImpactLevel = 'High Impact' | 'Medium Impact' | 'Low Impact';

export type RecommendationStatus = 'New' | 'Implemented' | 'Dismissed';

export interface Department {
  name: string;
  label: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  department: string[];
  impactLevel: ImpactLevel;
  status: RecommendationStatus;
  tags: string[];
} 