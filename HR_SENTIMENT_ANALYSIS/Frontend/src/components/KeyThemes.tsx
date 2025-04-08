import React from 'react';
import { Theme } from '../types/sentiment';

interface KeyThemesProps {
  themes: Theme[];
}

const KeyThemes: React.FC<KeyThemesProps> = ({ themes }) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 text-green-700';
      case 'neutral':
        return 'bg-blue-50 text-blue-700';
      case 'negative':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Key Themes</h2>
          <p className="text-sm text-gray-600">
            Most mentioned themes from employee feedback
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col h-full">
              <span
                className={`text-xs px-2 py-1 rounded-full w-fit mb-3 ${getSentimentColor(
                  theme.sentiment
                )}`}
              >
                {theme.sentiment}
              </span>
              <h3 className="font-medium mb-2">{theme.name}</h3>
              <p className="text-sm text-gray-500 mt-auto">
                {theme.mentions} mentions
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyThemes; 