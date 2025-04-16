import React from 'react';
import { KPIMetricsCard } from '../components/configuration';
import { Toaster } from 'react-hot-toast';




const ConfigurationPage: React.FC = () => {
  console.log('Rendering Configuration page');

  
  

  

  // Call analysis settings state
  // const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysisSettings>({
  //   enabled: true
  // });
  
  // const [keywordExtraction, setKeywordExtraction] = useState<KeywordExtractionSettings>({
  //   enabled: true
  // });
  
  // const [topicDetection, setTopicDetection] = useState<TopicDetectionSettings>({
  //   enabled: false
  // });

  // Users state
  

  // KPI Metrics state
  // const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);

  // Update local state when API data is received
 
  
  // Update users from API
  // useEffect(() => {
  //   if (usersData) {
  //     console.log('Users data received:', usersData);
  //     // Convert API users to UI format
  //     const mappedUsers = usersData.map(apiUser => ({
  //       id: apiUser.id,
  //       name: apiUser.name,
  //       email: apiUser.email,
  //       role: apiUser.role as 'Admin' | 'Agent' | 'Viewer'
  //     }));
  //     setUsers(mappedUsers);
  //   }
  // }, [usersData]);

  // Handle input changes for model configuration

  // Handle provider selection from dropdown

  // Handle slider changes

  // Handle save model config

  // Handle toggle changes for call analysis settings

  // Save all analysis settings at once

  // Handle user actions
  
  

  // Prepare analysis settings for the component





  // Loading state


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
    <div className="container mx-auto px-4 py-8">
      <Toaster position="bottom-center" />
      <div className="space-y-8">
        {/* AI Model Configuration */}
        {/* <AIModelCard
          modelConfig={modelConfig}
          onModelConfigChange={handleModelConfigChange}
          onProviderChange={handleProviderChange}
          onSliderChange={handleSliderChange}
          onSave={handleSaveModelConfig}
        /> */}
        
        {/* Call Analysis Settings */}
        {/* <AnalysisSettingsCard
          settings={analysisSettings}
          onToggleChange={handleToggleChange}
          saveSettings={saveAnalysisSettings}
        /> */}

        {/* KPI Metrics Configuration */}
        <KPIMetricsCard />

        {/* User Management */}
        {/* <UserManagementCard 
          users={users} 
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
        /> */}
      </div>
    </div>
  );
};

export default ConfigurationPage; 