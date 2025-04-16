import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

interface TranscriptEntry {
  time: string;
  speaker: 'Agent' | 'Customer';
  text: string;
}

interface CallAudioTranscriptProps {
  duration: string;
  agent: string;
  customer: string;
  category: string;
  transcript: TranscriptEntry[];
  audioUrl: string;
}

const CallAudioTranscript: React.FC<CallAudioTranscriptProps> = ({
  duration,
  agent,
  customer,
  category,
  transcript,
  audioUrl
}) => {
 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioVolume, setAudioVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState('0:00');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = audioVolume / 100;

      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      setCurrentTime(formatTime(audioRef.current.currentTime));
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
    setCurrentTime('0:00');
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const volumeBar = e.currentTarget;
    const rect = volumeBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.round((x / width) * 100);
    
    setAudioVolume(Math.max(0, Math.min(100, newVolume)));
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const newProgress = (x / width) * 100;
      const newTime = (audioRef.current.duration * newProgress) / 100;
      
      audioRef.current.currentTime = newTime;
      setAudioProgress(newProgress);
      setCurrentTime(formatTime(newTime));
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900">Call Audio & Transcript</h2>
        <div className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs font-medium">
          {duration}
        </div>
      </div>

      <div className="bg-gray-50 p-4">
        <div className="flex items-center">
          <button 
            onClick={togglePlayback} 
            className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-[#00aff0] mr-4 hover:bg-gray-50"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          <div className="flex-1">
            <div 
              className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
              onClick={handleProgressChange}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-[#00aff0]" 
                style={{ width: `${audioProgress}%` }}
              ></div>
              <div 
                className="absolute top-0 left-0 h-4 w-4 bg-white border-2 border-[#00aff0] rounded-full cursor-pointer" 
                style={{ left: `${audioProgress}%`, transform: 'translateX(-50%)' }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{currentTime}</span>
              <span>{duration}</span>
            </div>
          </div>

          <div className="flex items-center ml-4">
            <FaVolumeUp className="text-gray-400 mr-2" />
            <div 
              className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
              onClick={handleVolumeChange}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-[#00aff0]" 
                style={{ width: `${audioVolume}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-sm">
            <div className="flex items-center gap-1 text-gray-500 mb-1">
              <i className="fas fa-user-tie"></i>
              <span>Agent: {agent}</span>
            </div>
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-1 text-gray-500 mb-1">
              <i className="fas fa-user"></i>
              <span>Customer: {customer}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-col space-y-1 text-gray-500">
            <div className="px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md">
              <div className="text-xs text-gray-400 mb-1">{category}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {transcript.map((entry, index) => (
          <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
            <div className="font-medium mb-1">
              {entry.speaker}
              <span className="ml-2 text-sm font-normal text-gray-500">{entry.time}</span>
            </div>
            <div className="text-gray-700">{entry.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallAudioTranscript; 