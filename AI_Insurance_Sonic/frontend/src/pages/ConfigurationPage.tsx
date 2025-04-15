import React, { useState, useEffect } from 'react';
import { AIModelCard, AnalysisSettingsCard, UserManagementCard } from '../components/configuration';
import { 
  useGetConfigurationQuery, 
  useUpdateModelConfigurationMutation, 
  useUpdateAnalysisSettingsMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} from '../redux/configurationApi';
import { parseApiError } from '../services/errorHandler';

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
  role: 'Admin' | 'Agent' | 'Viewer';
}

const ConfigurationPage: React.FC = () => {
  console.log('Rendering Configuration page');

  // API hooks
  const { data: configData, isLoading, error } = useGetConfigurationQuery();
  const [updateModelConfig] = useUpdateModelConfigurationMutation();
  const [updateAnalysisSettings] = useUpdateAnalysisSettingsMutation();
  const { data: usersData } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // State management (keeping the same UI state)
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

  // Users state
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Agent' }
  ]);

  // Update local state when API data is received
  useEffect(() => {
    if (configData) {
      console.log('Configuration data received:', configData);
      
      // Update model config
      if (configData.ai_model_config) {
        setModelConfig({
          provider: configData.ai_model_config.provider,
          modelName: configData.ai_model_config.model_name,
          apiKey: configData.ai_model_config.api_key,
          maxTokens: configData.ai_model_config.max_tokens,
          temperature: configData.ai_model_config.temperature,
          topP: configData.ai_model_config.top_p,
          frequencyPenalty: configData.ai_model_config.frequency_penalty,
          presencePenalty: configData.ai_model_config.presence_penalty,
          systemPrompt: configData.ai_model_config.system_prompt
        });
      }
      
      // Update analysis settings
      if (configData.analysis_settings) {
        setSentimentAnalysis({
          enabled: configData.analysis_settings.sentiment_analysis_enabled
        });
        
        setKeywordExtraction({
          enabled: configData.analysis_settings.keyword_extraction_enabled
        });
        
        setTopicDetection({
          enabled: configData.analysis_settings.topic_detection_enabled
        });
      }
    }
  }, [configData]);
  
  // Update users from API
  useEffect(() => {
    if (usersData) {
      console.log('Users data received:', usersData);
      // Convert API users to UI format
      const mappedUsers = usersData.map(apiUser => ({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role as 'Admin' | 'Agent' | 'Viewer'
      }));
      setUsers(mappedUsers);
    }
  }, [usersData]);

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

  // Handle save model config
  const handleSaveModelConfig = async () => {
    try {
      await updateModelConfig({
        provider: modelConfig.provider,
        model_name: modelConfig.modelName,
        api_key: modelConfig.apiKey,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty,
        system_prompt: modelConfig.systemPrompt
      });
      console.log('Model configuration saved successfully');
    } catch (err) {
      console.error('Error saving model configuration:', err);
    }
  };

  // Handle toggle changes for call analysis settings
  const handleToggleChange = async (settingType: 'sentiment' | 'keyword' | 'topic') => {
    // Update local state first for responsive UI
    let newSentimentEnabled = sentimentAnalysis.enabled;
    let newKeywordEnabled = keywordExtraction.enabled;
    let newTopicEnabled = topicDetection.enabled;
    
    switch (settingType) {
      case 'sentiment':
        newSentimentEnabled = !sentimentAnalysis.enabled;
        setSentimentAnalysis({ enabled: newSentimentEnabled });
        break;
      case 'keyword':
        newKeywordEnabled = !keywordExtraction.enabled;
        setKeywordExtraction({ enabled: newKeywordEnabled });
        break;
      case 'topic':
        newTopicEnabled = !topicDetection.enabled;
        setTopicDetection({ enabled: newTopicEnabled });
        break;
    }
    
    // Then update the API
    try {
      await updateAnalysisSettings({
        sentiment_analysis_enabled: newSentimentEnabled,
        keyword_extraction_enabled: newKeywordEnabled,
        topic_detection_enabled: newTopicEnabled
      });
      console.log('Analysis settings updated successfully');
    } catch (err) {
      console.error('Error updating analysis settings:', err);
      // Revert local state if API call fails
      if (settingType === 'sentiment') setSentimentAnalysis({ enabled: !newSentimentEnabled });
      if (settingType === 'keyword') setKeywordExtraction({ enabled: !newKeywordEnabled });
      if (settingType === 'topic') setTopicDetection({ enabled: !newTopicEnabled });
    }
  };

  // Save all analysis settings at once
  const saveAnalysisSettings = async () => {
    try {
      await updateAnalysisSettings({
        sentiment_analysis_enabled: sentimentAnalysis.enabled,
        keyword_extraction_enabled: keywordExtraction.enabled,
        topic_detection_enabled: topicDetection.enabled
      });
      console.log('All analysis settings saved successfully');
    } catch (err) {
      console.error('Error saving analysis settings:', err);
    }
  };

  // Handle user actions
  const handleCreateUser = async (user: Omit<User, 'id'>) => {
    try {
      await createUser({
        name: user.name,
        email: user.email,
        role: user.role
      });
      console.log('User created successfully');
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };
  
  const handleUpdateUser = async (id: number, user: Omit<User, 'id'>) => {
    try {
      await updateUser({
        id,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
      console.log('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };
  
  const handleDeleteUser = async (id: number) => {
    try {
      await deleteUser(id);
      console.log('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // Prepare analysis settings for the component
  const analysisSettings = {
    sentimentAnalysis,
    keywordExtraction,
    topicDetection
  };

  // Loading state
  if (isLoading) {
    return <div className="p-4">Loading configuration data...</div>;
  }

  // Error state
  // if (error) {
  //   const apiError = parseApiError(error);
  //   console.error('Error loading configuration:', apiError);
  //   return (
  //     <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
  //       <h3 className="text-lg font-semibold mb-2">Error Loading Configuration</h3>
  //       <p>{apiError.message}</p>
  //       <button 
  //         onClick={() => window.location.reload()} 
  //         className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
  //       >
  //         Refresh Page
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-8">
      {/* AI Model Configuration */}
      <AIModelCard
        modelConfig={modelConfig}
        onModelConfigChange={handleModelConfigChange}
        onProviderChange={handleProviderChange}
        onSliderChange={handleSliderChange}
        onSave={handleSaveModelConfig}
      />
      
      {/* Call Analysis Settings */}
      <AnalysisSettingsCard
        settings={analysisSettings}
        onToggleChange={handleToggleChange}
        saveSettings={saveAnalysisSettings}
      />

      {/* User Management */}
      <UserManagementCard 
        users={users} 
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
};

export default ConfigurationPage; 