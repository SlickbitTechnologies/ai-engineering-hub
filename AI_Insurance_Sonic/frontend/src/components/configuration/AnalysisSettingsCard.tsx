import React from 'react';

interface AnalysisSettings {
  sentimentAnalysis: {
    enabled: boolean;
  };
  keywordExtraction: {
    enabled: boolean;
  };
  topicDetection: {
    enabled: boolean;
  };
}

interface AnalysisSettingsCardProps {
  settings: AnalysisSettings;
  onToggleChange: (settingType: 'sentiment' | 'keyword' | 'topic') => void;
}

const AnalysisSettingsCard: React.FC<AnalysisSettingsCardProps> = ({
  settings,
  onToggleChange
}) => {
  console.log('Rendering AnalysisSettingsCard component');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">Call Analysis Settings</h2>
      <p className="text-gray-600 mb-6">Customize the settings for analyzing call transcripts.</p>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Sentiment Analysis</h3>
              <p className="text-sm text-gray-500">Analyze the sentiment of the call for better insights.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.sentimentAnalysis.enabled}
                onChange={() => onToggleChange('sentiment')}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${settings.sentimentAnalysis.enabled ? 'bg-[#00aff0]' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Keyword Extraction</h3>
              <p className="text-sm text-gray-500">Automatically extract important keywords from the call.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.keywordExtraction.enabled}
                onChange={() => onToggleChange('keyword')}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${settings.keywordExtraction.enabled ? 'bg-[#00aff0]' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Topic Detection</h3>
              <p className="text-sm text-gray-500">Identify the main topics discussed during the call.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.topicDetection.enabled}
                onChange={() => onToggleChange('topic')}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${settings.topicDetection.enabled ? 'bg-[#00aff0]' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AnalysisSettingsCard; 