import React, { useState } from 'react';
import { AIModelCard, AnalysisSettingsCard, UserManagementCard } from '../components/configuration';

// Define the model configuration interface
interface ModelConfiguration {
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

// Define the sentiment analysis settings interface
interface SentimentAnalysisSettings {
  enabled: boolean;
}

// Define the keyword extraction settings interface
interface KeywordExtractionSettings {
  enabled: boolean;
}

// Define the topic detection settings interface
interface TopicDetectionSettings {
  enabled: boolean;
}

// Define the user interface
interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Agent';
}

const ConfigurationPage: React.FC = () => {
  console.log('Rendering Configuration page');

  // Model configuration state
  const [modelConfig, setModelConfig] = useState<ModelConfiguration>({
    provider: '',
    modelName: 'GPT-4',
    apiKey: '12••••••••••••••••••••••••••••',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.95,
    frequencyPenalty: 0.5,
    presencePenalty: 0.6,
    systemPrompt: 'You are a helpful AI assistant that analyzes insurance call transcripts.'
  });

  // Call analysis settings state
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysisSettings>({
    enabled: true
  });
  
  const [keywordExtraction, setKeywordExtraction] = useState<KeywordExtractionSettings>({
    enabled: true
  });
  
  const [topicDetection, setTopicDetection] = useState<TopicDetectionSettings>({
    enabled: false
  });

  // Mock users data
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Agent' }
  ]);

  // Handle input changes for model configuration
  const handleModelConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setModelConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle provider selection from dropdown
  const handleProviderChange = (providerId: string) => {
    setModelConfig(prev => ({
      ...prev,
      provider: providerId
    }));
  };

  // Handle slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setModelConfig(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // Handle toggle changes for call analysis settings
  const handleToggleChange = (settingType: 'sentiment' | 'keyword' | 'topic') => {
    switch (settingType) {
      case 'sentiment':
        setSentimentAnalysis(prev => ({ enabled: !prev.enabled }));
        break;
      case 'keyword':
        setKeywordExtraction(prev => ({ enabled: !prev.enabled }));
        break;
      case 'topic':
        setTopicDetection(prev => ({ enabled: !prev.enabled }));
        break;
    }
  };

  // Prepare analysis settings for the component
  const analysisSettings = {
    sentimentAnalysis,
    keywordExtraction,
    topicDetection
  };

  return (
    <div className="space-y-8">
      {/* AI Model Configuration */}
      <AIModelCard
        modelConfig={modelConfig}
        onModelConfigChange={handleModelConfigChange}
        onProviderChange={handleProviderChange}
        onSliderChange={handleSliderChange}
      />
      
      {/* Call Analysis Settings */}
      <AnalysisSettingsCard
        settings={analysisSettings}
        onToggleChange={handleToggleChange}
      />

      {/* User Management */}
      <UserManagementCard users={users} />
    </div>
  );
};

export default ConfigurationPage; 