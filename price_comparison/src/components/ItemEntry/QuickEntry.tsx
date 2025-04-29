'use client';

import { Mic } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useState } from 'react';
import { parseItems, ParsedItem } from '@/utils/parseItems';
import { Loader2 } from 'lucide-react';

interface QuickEntryProps {
  onAddItems: (items: ParsedItem[]) => void;
}

const QuickEntry = ({ onAddItems }: QuickEntryProps) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddItems = async () => {
    if (!inputValue.trim()) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      const parsedItems = await parseItems(inputValue);
      console.log('Parsed items:', parsedItems);
      onAddItems(parsedItems);
      setInputValue('');
    } catch (err) {
      console.error('Error parsing items:', err);
      setError('Failed to process items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { listening, startListening } = useSpeechRecognition({
    onResult: (spokenText) => {
      console.log('Speech recognized:', spokenText);
      setError(null);
      // Append new text to existing input, with a newline if needed
      setInputValue(current => {
        const prefix = current.trim() ? current.trim() + '\n' : '';
        return prefix + spokenText.trim();
      });
    },
    onError: (errorMessage) => {
      console.error('Speech recognition error:', errorMessage);
      setError(errorMessage);
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItems();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-100 rounded-md text-gray-800 font-medium cursor-pointer hover:bg-gray-200">
          Quick Entry
        </button>
        <button
          className={`px-4 py-2 flex items-center gap-2 text-gray-800 cursor-pointer hover:text-gray-900 ${
            listening ? 'bg-green-100' : ''
          } ${error ? 'bg-red-100' : ''}`}
          onClick={startListening}
          disabled={listening || isProcessing}
          title={error || ''}
        >
          <Mic 
            size={18} 
            className={listening ? 'text-green-600' : error ? 'text-red-600' : ''} 
          />
          {listening ? 'Listening...' : error ? 'Try Again' : 'Speak Items'}
        </button>
      </div>
      <div className="relative space-y-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-4 border rounded-md h-32 resize-none text-gray-800 placeholder:text-gray-500"
          placeholder="Type naturally, like '2kg of chicken' or '5 apples'.&#10;Press Enter to add multiple items."
          disabled={isProcessing}
        />
        {error && (
          <div className="text-red-600 text-sm mt-1">
            {error}
          </div>
        )}
        <button 
          onClick={handleAddItems}
          disabled={isProcessing || !inputValue.trim()}
          className={`w-full py-2 text-center border rounded-md text-gray-800 hover:bg-gray-50 cursor-pointer font-medium flex items-center justify-center gap-2 ${
            isProcessing ? 'bg-gray-50' : ''
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : (
            'Add from Text'
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickEntry; 