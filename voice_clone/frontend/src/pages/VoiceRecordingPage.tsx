import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/solid';

const VoiceRecordingPage: React.FC<{}> = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [showSampleText, setShowSampleText] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  // Sample text for recording
  const sampleText = `Hello, this is a sample text for voice recording. 
  
Please read this text clearly and naturally. This will help us capture the characteristics of your voice.

The more natural and consistent your reading, the better the voice cloning will work. Try to maintain a steady pace and volume throughout the recording.

Thank you for participating in our voice cloning project!`;

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startRecording = async () => {
    try {
      // Show sample text popup first
      setShowSampleText(true);
      
      // Wait for user to read the text
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Clean up any existing audio context first
      cleanupAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      updateAudioLevel();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], 'recorded-audio.wav', { type: 'audio/wav' });
        setAudioFile(file);
        cleanupAudio();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
      } else {
        alert('Please upload an audio file (MP3 or WAV)');
      }
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      alert('Please record or upload an audio file first');
      return;
    }

    try {
      // Clean up audio context before navigating
      cleanupAudio();

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('language', 'en');
      
      const response = await fetch('http://localhost:8000/api/voice/clone', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to clone voice');
      }
      
      const data = await response.json();
      console.log('Voice cloned successfully:', data);
      
      localStorage.setItem('voicePath', data.voice_path);
      navigate('/upload-document');
    } catch (error) {
      console.error('Error cloning voice:', error);
      alert(`Error cloning voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-12 text-white drop-shadow-glow">Voice Recording</h1>
      
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-white">Record Your Voice</h2>
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <div className={`absolute inset-0 rounded-full ${
              isRecording ? 'animate-ping bg-red-500/30' : ''
            }`} />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative flex items-center px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:scale-105 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/20' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-blue-500/20'
              } text-white`}
            >
              <MicrophoneIcon className={`h-6 w-6 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>

          {isRecording && (
            <div className="w-full max-w-md">
              {/* Recording indicator */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse" />
                <span className="text-red-400 text-sm font-medium">Recording in progress...</span>
              </div>
              
              {/* Sound wave visualization */}
              <div className="h-16 bg-gray-900/50 rounded-lg p-2 flex items-center justify-center overflow-hidden">
                <div className="flex items-center justify-center space-x-1 w-full h-full">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.min(100, (Math.sin(i * 0.2 + audioLevel * 0.05) + 1) * 50 * (audioLevel / 128))}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
        <h2 className="text-2xl font-semibold mb-6 text-white">Or Upload Audio File</h2>
        <div className="flex flex-col items-center">
          <button
            onClick={() => document.getElementById('audio-upload')?.click()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 hover:scale-105 mb-4"
          >
            Choose File
          </button>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {audioFile && (
            <div className="text-blue-300 mt-2 bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-600">
              Selected file: {audioFile.name}
            </div>
          )}
        </div>
      </div>

      {audioFile && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 hover:scale-105"
          >
            Continue to Document Upload
          </button>
        </div>
      )}

      {/* Sample Text Popup */}
      {showSampleText && (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
          <div className="bg-gray-800/90 rounded-xl p-4 w-80 shadow-2xl border border-gray-700/50 relative">
            <button 
              onClick={() => setShowSampleText(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col space-y-3">
              <h3 className="text-lg font-semibold text-white">Read This Text</h3>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">{sampleText}</p>
              </div>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-center text-blue-300 text-xs">
                Recording will start automatically...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecordingPage;