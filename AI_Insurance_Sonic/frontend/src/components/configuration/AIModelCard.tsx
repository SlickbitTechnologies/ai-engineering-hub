import React from 'react';
import { Dropdown, RangeSlider } from '../ui';

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

interface AIModelCardProps {
  modelConfig: ModelConfiguration;
  onModelConfigChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onProviderChange: (providerId: string) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AIModelCard: React.FC<AIModelCardProps> = ({
  modelConfig,
  onModelConfigChange,
  onProviderChange,
  onSliderChange
}) => {
  console.log('Rendering AIModelCard component');

  // Provider options for dropdown
  const providerOptions = [
    { id: '', label: 'Select' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'azure', label: 'Azure AI' },
    { id: 'cohere', label: 'Cohere' },
    { id: 'anthropic', label: 'Anthropic' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">AI Model Configuration</h2>
      <p className="text-gray-600 mb-6">Configure the settings for the AI models used in call analysis.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Dropdown
            label="Model Provider"
            options={providerOptions}
            selectedOption={modelConfig.provider}
            onSelect={onProviderChange}
            placeholder="Select"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
          <input
            type="text"
            name="modelName"
            placeholder="e.g., GPT-4"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            value={modelConfig.modelName}
            onChange={onModelConfigChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            name="apiKey"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            value={modelConfig.apiKey}
            onChange={onModelConfigChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
          <input
            type="number"
            name="maxTokens"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            value={modelConfig.maxTokens}
            onChange={onModelConfigChange}
          />
        </div>
        
        <div>
          <RangeSlider
            label="Temperature"
            name="temperature"
            min={0}
            max={1}
            step={0.01}
            value={modelConfig.temperature}
            onChange={onSliderChange}
            displayValue={modelConfig.temperature.toFixed(1)}
          />
        </div>
        
        <div>
          <RangeSlider
            label="Top P"
            name="topP"
            min={0}
            max={1}
            step={0.01}
            value={modelConfig.topP}
            onChange={onSliderChange}
            displayValue={modelConfig.topP.toFixed(2)}
          />
        </div>
        
        <div>
          <RangeSlider
            label="Frequency Penalty"
            name="frequencyPenalty"
            min={0}
            max={2}
            step={0.01}
            value={modelConfig.frequencyPenalty}
            onChange={onSliderChange}
            displayValue={modelConfig.frequencyPenalty.toFixed(1)}
          />
        </div>
        
        <div>
          <RangeSlider
            label="Presence Penalty"
            name="presencePenalty"
            min={0}
            max={2}
            step={0.01}
            value={modelConfig.presencePenalty}
            onChange={onSliderChange}
            displayValue={modelConfig.presencePenalty.toFixed(1)}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea
            name="systemPrompt"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            value={modelConfig.systemPrompt}
            onChange={onModelConfigChange}
          />
        </div>
      </div>
      
      <div className="mt-6">
        <button className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]">
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default AIModelCard; 