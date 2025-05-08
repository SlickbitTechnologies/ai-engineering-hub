'use client';

import { useState, useEffect, useRef } from 'react';
import { PhoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Vapi from '@vapi-ai/web';

interface VapiCallSimulatorProps {
  assistantId?: string;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

interface Message {
  role: string;
  content: string;
}

export default function VapiCallSimulator({showChat}:{showChat:boolean}) {
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Vapi SDK with environment variable
    const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY || '');
    
    setVapi(vapiInstance);
    setMessages([]);
    // Cleanup on unmount
    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
        vapiInstance.removeAllListeners();
      }
    };
  }, [assistantId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getCurrentDateAndTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // yyyy-mm-dd
    const time = now.toTimeString().slice(0, 8); // HH:mm

    return { date, time };
  }

  const startSimulator = async () => {
    if (!vapi) return;

    try {
      setIsCalling(true);
      setMessages([]);
      setCallStatus('Connecting to Vapi...');

      const { date, time } = getCurrentDateAndTime();
      // Use environment variable for assistantId if not provided as prop
      const effectiveAssistantId = assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!effectiveAssistantId) {
        throw new Error('Assistant ID is required');
      }
      
      await vapi.start(effectiveAssistantId, { variableValues: { date, time,name:"Bella" } });
      
      setCallStatus('Call connected!');
      toast.success('Call simulator started successfully');

      vapi.on("speech-start", () => {
        console.log("Assistant speech has started.");
      });
      vapi.on("speech-end", () => {
        console.log("Assistant speech has ended.");
        
      });
      vapi.on("call-start", () => {
        console.log("Call has started.");
      });
      vapi.on('call-end', () => {
        setIsCalling(false);
        setCallStatus('');
        toast.success('Call ended');
      });
      vapi.on("message", (message) => {
        console.log("message => conversation-update ::", message);
        if (message.type === "conversation-update") {
          setMessages(message.conversation);
        }
      });
      vapi.on("error", (e) => {
        console.error("error",e);
      });
      
    } catch (error) {
      console.error('Error starting call simulator:', error);
      setCallStatus('Failed to start call');
      toast.error('Failed to start call simulator');
      setIsCalling(false);
    }
  };

  const stopSimulator = async () => {
    if (!vapi) return;

    try {
      setCallStatus('Ending call...');
      await vapi.stop();
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col items-center gap-4">
        <PhoneIcon className="h-12 w-12 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-500">Simulate an Incoming Call</h2>
        <p className="text-sm text-gray-500 text-center">
          Test how the AI voice agent interacts with customers to make reservations.
        </p>
        <div className="text-sm text-gray-500">
          {callStatus || 'Ready to start call simulation'}
        </div>
        
        {!isCalling ? (
          <button
            onClick={startSimulator}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0F172A] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Start Simulator
          </button>
        ) : (
          <button
            onClick={stopSimulator}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <StopIcon className="h-5 w-5 mr-2" />
            End Call
          </button>
        )}

        {messages.length > 0 && showChat && (
          <div className="mt-4 w-full">
            <h3 className="text-lg font-semibold mb-4">Conversation</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {messages
                .filter(msg => msg.role !== 'system')
                .map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${
                      msg.role === 'assistant' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'assistant'
                          ? 'bg-blue-100 text-blue-900 rounded-tl-none'
                          : 'bg-green-100 text-green-900 rounded-tr-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 