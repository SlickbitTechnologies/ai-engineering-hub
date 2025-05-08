import React, { useState, useEffect } from 'react';
import { callApi, Call } from '../services/api';
import { format } from 'date-fns';

const CallHistory: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [makingCall, setMakingCall] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const callHistory = await callApi.getCalls();
      setCalls(callHistory);
      setError(null);
    } catch (err) {
      setError('Failed to load call history');
      console.error('Error loading calls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    try {
      setMakingCall(true);
      const newCall = await callApi.makeCall(phoneNumber, message);
      setCalls([newCall, ...calls]);
      setPhoneNumber('');
      setMessage('');
      setError(null);
    } catch (err) {
      setError('Failed to make call');
      console.error('Error making call:', err);
    } finally {
      setMakingCall(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'busy':
      case 'no-answer':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return <div className="p-4">Loading call history...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Call History</h2>
      
      {/* Make Call Form */}
      <form onSubmit={handleMakeCall} className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to be spoken"
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          disabled={makingCall}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {makingCall ? 'Making Call...' : 'Make Call'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Call History List */}
      <div className="space-y-4">
        {calls.map((call) => (
          <div
            key={call.sid}
            className="p-4 bg-white rounded-lg shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">To: {call.to}</p>
                <p className="text-sm text-gray-500">
                  From: {call.from}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(call.timestamp), 'PPpp')}
                </p>
              </div>
              <span className={`font-medium ${getStatusColor(call.status)}`}>
                {call.status}
              </span>
            </div>
            {call.message && (
              <p className="mt-2 text-sm text-gray-600">
                Message: {call.message}
              </p>
            )}
            {call.duration > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Duration: {call.duration} seconds
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallHistory; 