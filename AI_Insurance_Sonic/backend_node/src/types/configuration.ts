export interface ModelConfiguration {
  provider: string;
  modelName: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
}

export interface AnalysisSettings {
  sentimentAnalysisEnabled: boolean;
  keywordExtractionEnabled: boolean;
  topicDetectionEnabled: boolean;
}

export interface KPIMetric {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 