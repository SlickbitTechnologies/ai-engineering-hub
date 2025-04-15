import React from 'react';

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

// Combined settings interface
interface AnalysisSettings {
  sentimentAnalysis: SentimentAnalysisSettings;
  keywordExtraction: KeywordExtractionSettings;
  topicDetection: TopicDetectionSettings;
}

// Props interface
interface AnalysisSettingsCardProps {
  settings: AnalysisSettings;
  onToggleChange: (settingType: 'sentiment' | 'keyword' | 'topic') => void;
  saveSettings: () => Promise<void>;
}

const AnalysisSettingsCard: React.FC<AnalysisSettingsCardProps> = ({
  settings,
  onToggleChange,
  saveSettings
}) => {
  console.log('Rendering AnalysisSettingsCard component');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Call Analysis Settings</h2>
      <p className="text-gray-600 mb-6">Configure which features are enabled for call analysis.</p>
      
      <div className="space-y-4">
        {/* Sentiment Analysis */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Sentiment Analysis</h3>
            <p className="text-sm text-gray-600">Detect the emotional tone of conversations</p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.sentimentAnalysis.enabled}
                onChange={() => onToggleChange('sentiment')}
              />
              <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 ${
                settings.sentimentAnalysis.enabled 
                  ? 'bg-blue-600 peer-checked:after:translate-x-full' 
                  : 'bg-gray-200'
              } after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
        
        {/* Keyword Extraction */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Keyword Extraction</h3>
            <p className="text-sm text-gray-600">Identify important words and phrases in conversations</p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.keywordExtraction.enabled}
                onChange={() => onToggleChange('keyword')}
              />
              <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 ${
                settings.keywordExtraction.enabled 
                  ? 'bg-blue-600 peer-checked:after:translate-x-full' 
                  : 'bg-gray-200'
              } after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
        
        {/* Topic Detection */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Topic Detection</h3>
            <p className="text-sm text-gray-600">Identify main topics discussed in conversations</p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.topicDetection.enabled}
                onChange={() => onToggleChange('topic')}
              />
              <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 ${
                settings.topicDetection.enabled 
                  ? 'bg-blue-600 peer-checked:after:translate-x-full' 
                  : 'bg-gray-200'
              } after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button 
          className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]"
          onClick={saveSettings}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AnalysisSettingsCard; 