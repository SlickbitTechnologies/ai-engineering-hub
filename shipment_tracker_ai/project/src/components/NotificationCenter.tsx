import React, { useState, useEffect, useMemo } from 'react';
import { X, Volume2, MessageSquare, Clock, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { useShipments } from '../contexts/ShipmentContext';
import { useSettings } from '../contexts/SettingsContext';
import axios from 'axios';
import { format } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CallRecord {
  id: string;
  recipient: string;
  timestamp: string;
  duration: number;
  status: 'completed' | 'failed';
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { shipments } = useShipments();
  const { phoneNumber } = useSettings();
  const [activeTab, setActiveTab] = useState<'chat' | 'call' | 'history'>('call');
  const [callActive, setCallActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [recipientNumber, setRecipientNumber] = useState<string>(phoneNumber);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get all temperature alerts (unread, critical)
  const temperatureAlerts = useMemo(() => {
    return shipments.flatMap(shipment => 
      (shipment.alerts || [])
        .filter(alert => 
          alert.type === 'critical' && 
          alert.message.includes('Temperature') &&
          !alert.read
        )
        .map(alert => ({
          ...alert,
          shipmentNumber: shipment.number
        }))
    );
  }, [shipments]);

  // Fetch call history on first load or when tab is switched
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchCallHistory();
    }
  }, [isOpen, activeTab]);

  // Map Twilio status to our simplified status
  const mapCallStatus = (twilioStatus: string): 'completed' | 'failed' => {
    const completedStatuses = ['completed', 'successful', 'success', 'answered'];
    return completedStatuses.includes((twilioStatus || '').toLowerCase()) ? 'completed' : 'failed';
  };

  // Fetch call history from backend
  const fetchCallHistory = async () => {
    try {
      const response = await axios.get('/api/twilio/calls');
      if (response.data && Array.isArray(response.data)) {
        const formattedHistory: CallRecord[] = response.data.map((call: any) => ({
          id: call.sid || `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          recipient: call.to || 'Unknown',
          timestamp: call.timestamp || new Date().toISOString(),
          duration: parseInt(call.duration || '0', 10),
          status: mapCallStatus(call.status || '')
        }));
        setCallHistory(formattedHistory);
      } else {
        setCallHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      setCallHistory([]);
    }
  };

  // Handle making a call
  const handleCall = async () => {
    try {
      setErrorMessage('');
      if (!recipientNumber.trim()) {
        setErrorMessage('Please enter a recipient phone number');
        return;
      }
      setLoading(true);
      setCallActive(true);
      const startTime = new Date();
      setCallStartTime(startTime);
      // Create alert message with details
      const alertMessage = temperatureAlerts.length > 0
        ? `Alert from Cold Chain Monitor. ${temperatureAlerts.length} temperature excursions detected. ` +
          temperatureAlerts.map(alert => 
            `Shipment ${alert.shipmentNumber}: ${alert.message}`
          ).join('. ')
        : 'Alert from Cold Chain Monitor. System check requested.';
      // Make API call to backend
      const response = await axios.post('/api/twilio/call', {
        to: recipientNumber,
        message: alertMessage
      });
      if (response.data && response.data.success) {
        setCallStatus(`Call connected to ${recipientNumber}`);
      } else {
        throw new Error(response.data?.error || 'Failed to connect call');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error making call:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to make call');
      setLoading(false);
      setCallActive(false);
      setCallStatus('');
    }
  };

  // Handle ending a call (UI only)
  const handleEndCall = () => {
    setCallActive(false);
    setCallStatus(''); // Fix: do not set to null, use empty string
    // Calculate call duration
    if (callStartTime) {
      const endTime = new Date();
      const durationInSeconds = Math.floor((endTime.getTime() - callStartTime.getTime()) / 1000);
      // Record the call in history
      const newCallRecord: CallRecord = {
        id: `call-${Date.now()}`,
        recipient: recipientNumber || 'Unknown',
        timestamp: callStartTime.toISOString(),
        duration: durationInSeconds,
        status: 'completed'
      };
      setCallHistory(prev => [newCallRecord, ...prev]);
      setCallStartTime(null);
      // Do not clear recipient number, keep it for next call
    }
    // Refresh call history
    fetchCallHistory();
  };

  // Format call duration as mm:ss
  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format call timestamp for display
  const formatCallTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 overflow-hidden ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="px-4 py-6 bg-cyan-700 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-white">Notifications</h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="bg-cyan-700 rounded-md text-cyan-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-6 sm:px-6">
                  {/* Temperature Alerts */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Temperature Alerts</h3>
                    {temperatureAlerts.length > 0 ? (
                      <div className="space-y-4">
                        {temperatureAlerts.map(alert => (
                          <div
                            key={alert.id}
                            className="bg-red-50 border-l-4 border-red-400 p-4"
                          >
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">Shipment {alert.shipmentNumber}:</span> {alert.message}
                                </p>
                                <p className="mt-1 text-sm text-red-600">
                                  Location: {alert.location}
                                </p>
                                <p className="mt-1 text-sm text-red-600">
                                  Time: {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No temperature alerts</p>
                    )}
                  </div>
                  {/* Call Controls */}
                  <div className="mt-8 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Send Alert Call</h3>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Recipient Phone Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="+1 (123) 456-7890"
                          value={recipientNumber}
                          onChange={(e) => setRecipientNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    {errorMessage && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <X className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{errorMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        loading || callActive
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
                      }`}
                      onClick={handleCall}
                      disabled={loading || callActive}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Connecting...
                        </>
                      ) : callActive ? (
                        <>
                          <Phone className="-ml-1 mr-2 h-4 w-4" />
                          Call Active
                        </>
                      ) : (
                        <>
                          <Phone className="-ml-1 mr-2 h-4 w-4" />
                          Send Alert Call
                        </>
                      )}
                    </button>
                    {callActive && callStartTime && (
                      <div className="text-sm text-gray-500 text-center">
                        Call started at {format(callStartTime, 'h:mm:ss a')}
                      </div>
                    )}
                    {callStatus && (
                      <div className="text-sm text-gray-500 text-center">
                        {callStatus}
                      </div>
                    )}
                  </div>
                  {/* Call History Tab */}
                  {activeTab === 'history' && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Call History</h3>
                      {callHistory.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {callHistory.map(call => (
                            <li key={call.id} className="py-3 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{call.recipient}</p>
                                <p className="text-xs text-gray-500">{formatCallTimestamp(call.timestamp)}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm ${call.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>{call.status === 'completed' ? 'Completed' : 'Failed'}</p>
                                {call.status === 'completed' && (
                                  <p className="text-xs text-gray-500">Duration: {formatCallDuration(call.duration)}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-500">No call history available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 