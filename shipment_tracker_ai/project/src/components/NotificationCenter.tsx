import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { X, Phone, Loader2, Volume2 } from 'lucide-react';
import { useShipments, Shipment } from '../contexts/ShipmentContext';
import { useSettings } from '../contexts/SettingsContext';
import { format } from 'date-fns';
import { callApi, ShipmentDetails } from '../services/api';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentShipment?: Shipment;
  enableCall?: boolean;
}

interface CallRecord {
  id: string;
  recipient: string;
  timestamp: string;
  duration: number;
  status: 'completed' | 'failed';
}

interface SelectedAlert {
  id: string;
  message: string;
  timestamp: string;
  temperature: number;
  personName: string;
}

// Use forwardRef to allow parent components to get a reference to this component
const NotificationCenter = forwardRef<{handleCallWithShipment: (phoneNumber: string, shipmentDetails: ShipmentDetails) => Promise<void>}, NotificationCenterProps>(({ isOpen, onClose, currentShipment, enableCall = false }, ref) => {
  const { shipments } = useShipments();
  const { phoneNumber, minTemperatureThreshold, maxTemperatureThreshold } = useSettings();
  const [activeTab, setActiveTab] = useState<'chat' | 'call' | 'history'>('call');
  const [callActive, setCallActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [recipientNumber, setRecipientNumber] = useState<string>(phoneNumber);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rightTab, setRightTab] = useState<'chat' | 'history'>('history');
  const [callEnabled, setCallEnabled] = useState(enableCall);
  const [selectedAlert, setSelectedAlert] = useState<SelectedAlert | null>(null);

  // Get selected alert from sessionStorage when component opens
  useEffect(() => {
    if (isOpen) {
      try {
        const storedAlert = sessionStorage.getItem('selectedAlert');
        if (storedAlert) {
          setSelectedAlert(JSON.parse(storedAlert));
        }
      } catch (error) {
        console.error('Error parsing selected alert:', error);
      }
    } else {
      // Clear selected alert when closing
      setSelectedAlert(null);
      sessionStorage.removeItem('selectedAlert');
    }
  }, [isOpen]);

  // Expose the handleCallWithShipment method to parent components
  useImperativeHandle(ref, () => ({
    handleCallWithShipment: async (phoneNumber: string, shipmentDetails: ShipmentDetails) => {
      console.log("Direct call initiation with shipment details:", shipmentDetails);
      await handleCall(phoneNumber, undefined, shipmentDetails);
    }
  }));

  // Update callEnabled when enableCall prop changes
  useEffect(() => {
    setCallEnabled(enableCall);
  }, [enableCall]);

  // Update recipient number when phone number from settings changes
  useEffect(() => {
    if (phoneNumber) {
      setRecipientNumber(phoneNumber);
    }
  }, [phoneNumber]);

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

  useEffect(() => {
    if (isOpen && rightTab === 'history') {
      fetchCallHistory();
    }
  }, [isOpen, rightTab]);

  if (!isOpen) return null;
  if (isOpen) console.log('NotificationCenter is open');

  const getCallUser = (call: any) => call.recipient || call.to || 'Unknown';
  
  const mapCallStatus = (twilioStatus: string): 'completed' | 'failed' | 'in-progress' => {
    const completedStatuses = ['completed', 'successful', 'success', 'answered'];
    const inProgressStatuses = ['in-progress', 'ringing', 'queued', 'initiated', 'in-progress'];
    const failedStatuses = ['failed', 'busy', 'no-answer', 'canceled'];
    
    const status = (twilioStatus || '').toLowerCase();
    
    if (completedStatuses.includes(status)) {
      return 'completed';
    } else if (inProgressStatuses.includes(status)) {
      return 'in-progress';
    } else if (failedStatuses.includes(status)) {
      return 'failed';
    } else {
      return 'failed';
    }
  };

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const calls = await callApi.getCalls();
      const mappedCalls = calls.map(call => ({ ...call, status: mapCallStatus(call.status) }));
      setCallHistory(mappedCalls);
    } catch (error) {
      console.error('Error fetching call history:', error);
      setErrorMessage('Failed to fetch call history');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (phoneNumberToCall: string, alertMessage?: string, shipmentDetails?: ShipmentDetails) => {
    if (!phoneNumberToCall) {
      setErrorMessage('Recipient phone number is required.');
      return;
    }
    
    if (!callEnabled) {
      setErrorMessage('Call functionality is currently disabled.');
      return;
    }
    
    setLoading(true);
    setCallActive(true);
    setCallStartTime(new Date());
    setErrorMessage('');
    setCallStatus('Calling...');
    
    try {
      // If shipmentDetails is not provided, try to get it from the current shipment and selected alert
      let callShipmentDetails = shipmentDetails;
      
      if (!callShipmentDetails && currentShipment) {
        // Get temperature thresholds from settings
        const minTemp = minTemperatureThreshold || 2;
        const maxTemp = maxTemperatureThreshold || 8;
        
        // Use the selected alert if available, otherwise find the most recent one
        let detectedTemp = currentShipment.currentTemperature;
        let alertTime = new Date().toISOString();
        let personName = 'there';
        
        if (selectedAlert) {
          // Use the data from the selected alert (from notification button)
          detectedTemp = selectedAlert.temperature;
          alertTime = selectedAlert.timestamp;
          personName = selectedAlert.personName;
          console.log("Using selected alert data:", selectedAlert);
        } else {
          // Use the most recent alert as fallback
          const tempAlert = currentShipment.alerts
            .filter(alert => alert.type === 'critical' && alert.message.includes('Temperature'))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            
          if (tempAlert) {
            const extracted = extractTemperature(tempAlert.message);
            if (extracted > 0) {
              detectedTemp = extracted;
            }
            alertTime = tempAlert.timestamp;
          }
          
          personName = (currentShipment as any).senderContactName || 
                      (currentShipment as any).recipientName || 
                      'there';
        }
        
        callShipmentDetails = {
          shipmentNumber: currentShipment.number || 'Unknown',
          detectedTemperature: `${detectedTemp}°C`,
          timeDate: format(new Date(alertTime), 'MM/dd/yyyy, h:mm:ss a'),
          temperatureRange: `${minTemp}°C - ${maxTemp}°C`,
          personName: personName
        };
      } else if (!callShipmentDetails) {
        // Fallback for when no shipment details are provided
        const minTemp = minTemperatureThreshold || 2;
        const maxTemp = maxTemperatureThreshold || 8;
        
        // Try to use selected alert data even in this case
        let personName = 'there';
        if (selectedAlert) {
          personName = selectedAlert.personName;
        }
        
        callShipmentDetails = {
          shipmentNumber: 'Unknown',
          detectedTemperature: 'N/A',
          timeDate: format(new Date(), 'MM/dd/yyyy, h:mm:ss a'),
          temperatureRange: `${minTemp}°C - ${maxTemp}°C`,
          personName: personName
        };
      }

      const call = await callApi.makeCall(phoneNumberToCall, alertMessage, callShipmentDetails);
      setCallStatus(call.status || 'Call initiated');
      
      const initialCallRecord = { 
        ...call, 
        status: mapCallStatus(call.status),
        id: call.id || call.sid,
        metadata: callShipmentDetails
      };
      
      setCallHistory(prev => [initialCallRecord, ...prev]);
      
      const maxPolls = 8;
      let pollCount = 0;
      
      const pollStatus = async () => {
        if (!call.id && !call.sid) return;
        
        try {
          const callId = call.id || call.sid;
          const updatedCall = await callApi.getCallStatus(callId);
          
          if (updatedCall) {
            const mappedStatus = mapCallStatus(updatedCall.status);
            setCallStatus(updatedCall.status || 'Call in progress'); 
            
            setCallHistory(prev => {
              const updatedHistory = [...prev];
              const callIndex = updatedHistory.findIndex(c => (c.id === callId || c.sid === callId));
              if (callIndex >= 0) {
                updatedHistory[callIndex] = { 
                  ...updatedHistory[callIndex], 
                  ...updatedCall,
                  status: mappedStatus,
                  metadata: callShipmentDetails
                };
              }
              return updatedHistory;
            });
            
            if (mappedStatus === 'completed' || mappedStatus === 'failed') {
              setCallActive(false);
              return;
            }
          }
          
          pollCount++;
          if (pollCount < maxPolls && callActive) {
            setTimeout(pollStatus, 5000);
          }
        } catch (error) {
          console.error('Error polling call status:', error);
        }
      };
      
      setTimeout(pollStatus, 5000);
      
    } catch (error: any) {
      console.error('Error making call:', error);
      setErrorMessage(`Failed to make call: ${error.message || 'Unknown error'}`);
      setCallStatus('Call Failed');
      setCallActive(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    setCallActive(false);
    const callDuration = callStartTime ? Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000) : 0;
    setCallStatus(`Call Ended. Duration: ${formatCallDuration(callDuration)}`);
    
    const newCallRecord: CallRecord = {
      id: `ended-call-${Date.now()}`,
      recipient: recipientNumber || 'Unknown',
      timestamp: callStartTime?.toISOString() || new Date().toISOString(),
      duration: callDuration,
      status: 'completed'
    };
    setCallStartTime(null);
    fetchCallHistory();
  };

  const formatCallDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCallTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'MMM d, h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleAlertCall = async (shipment: Shipment) => {
    console.log("handleAlertCall called with shipment:", shipment);
    
    // Use either the specified shipment or the currentShipment from props
    const targetShipment = shipment || currentShipment;
    
    if (!targetShipment) {
      setErrorMessage('No shipment data available.');
      return;
    }
    
    // Ensure we have a phone number
    const phoneNumber = (targetShipment as any).phoneNumber || (targetShipment as any).recipientPhone;
    if (!phoneNumber) {
      console.error("Missing phone number for shipment:", targetShipment.id);
      setErrorMessage('Shipment does not have a valid phone number.');
      return;
    }
    
    // Get the person name
    let personName = (targetShipment as any).senderContactName || 
                    (targetShipment as any).recipientName || 
                    'there';
    
    // If we have a selected alert, use its personName
    if (selectedAlert) {
      personName = selectedAlert.personName;
    }
    
    // Find the most recent temperature alert for this shipment
    let tempAlert = null;
    if (targetShipment.alerts && targetShipment.alerts.length > 0) {
      tempAlert = targetShipment.alerts
        .filter(alert => 
          alert.type === 'critical' && 
          alert.message && 
          alert.message.includes('Temperature')
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      console.log("Found temperature alert:", tempAlert);
    }
    
    // Get the actual temperature values and thresholds
    let currentTemp = targetShipment.currentTemperature;
    console.log("Current temperature:", currentTemp);
    
    // Use the selected alert temperature if available
    if (selectedAlert) {
      currentTemp = selectedAlert.temperature;
      console.log("Using selected alert temperature:", currentTemp);
    }
    
    // Get the temperature thresholds from settings
    const minTemp = minTemperatureThreshold || 2;
    const maxTemp = maxTemperatureThreshold || 8;
    console.log("Temperature thresholds:", minTemp, maxTemp);
    
    // Use the specific temperature from the alert
    const detectedTemp = currentTemp;
    
    console.log("Detected temperature for alert:", detectedTemp);
    
    // Format the alert data for the call with EXPLICIT values
    const shipmentDetails = {
      shipmentNumber: targetShipment.number,
      detectedTemperature: `${detectedTemp}°C`,
      timeDate: selectedAlert 
        ? format(new Date(selectedAlert.timestamp), 'MM/dd/yyyy, h:mm:ss a')
        : tempAlert 
          ? format(new Date(tempAlert.timestamp), 'MM/dd/yyyy, h:mm:ss a') 
          : format(new Date(), 'MM/dd/yyyy, h:mm:ss a'),
      temperatureRange: `${minTemp}°C - ${maxTemp}°C`,
      personName: personName
    };
    
    console.log("Sending call with shipment details:", shipmentDetails);
    
    // Make the call with the detailed information
    try {
      await handleCall(phoneNumber, undefined, shipmentDetails);
    } catch (error: any) {
      console.error("Error making call:", error);
      setErrorMessage(`Failed to make call: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Helper function to extract the temperature value from an alert message
  const extractTemperature = (message: string): number => {
    try {
      // Extract temperature value from message like "Temperature exceeds maximum threshold: 12°C"
      const match = message.match(/Temperature .* threshold: ([\d\.]+)°C/);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
      
      // Try another pattern like "Temperature: 12°C"
      const altMatch = message.match(/Temperature: ([\d\.]+)°C/);
      if (altMatch && altMatch[1]) {
        return parseFloat(altMatch[1]);
      }
      
      return 0; // Default if we can't extract
    } catch (e) {
      console.error("Error extracting temperature from message:", e);
      return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row gap-6 bg-white rounded-xl shadow-2xl overflow-hidden h-full max-h-[90vh]">
        <div className="flex-1 bg-gray-50 rounded-l-xl p-6 sm:p-8 flex flex-col items-center justify-center border-r border-gray-200 min-w-[300px] sm:min-w-[400px]">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 text-gray-800">Voice Call Interface</h2>
          
          {!callActive && (
            <div className="w-full max-w-xs mb-6">
              <label htmlFor="recipientPhone" className="block text-sm font-medium text-gray-700 mb-1">Recipient Phone</label>
              <input 
                type="tel" 
                id="recipientPhone"
                value={recipientNumber}
                onChange={(e) => setRecipientNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
            </div>
          )}

          {errorMessage && (
            <div className="w-full max-w-xs mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          {!callActive ? (
            <>
              <div className="text-gray-500 text-base mb-2">No active call</div>
              <Volume2 className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-3 sm:mb-4" />
              <div className="text-gray-400 text-sm mb-6 sm:mb-8">
                {callEnabled 
                  ? 'Press "Start Call" to begin' 
                  : 'Call is disabled. Use the Notify button to enable calling.'}
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-base sm:text-lg font-semibold shadow-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleCall(recipientNumber)}
                disabled={loading || !callEnabled || !recipientNumber}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Phone className="w-5 h-5" />} 
                {loading ? 'Calling...' : 'Start Call'}
              </button>
            </>
          ) : (
            <>
              <div className="text-gray-700 text-base sm:text-lg mb-2">Call in progress with: {recipientNumber}</div>
              <Volume2 className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-500 mb-3 sm:mb-4 animate-pulse" />
              {callStartTime && (
                <div className="text-gray-600 text-sm mb-2">
                  Call Status: <span className="font-medium">{callStatus}</span>
                </div>
              )}
              <button
                type="button"
                className="flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-base sm:text-lg font-semibold shadow-md transition-colors duration-150 mt-4"
                onClick={handleEndCall}
                disabled={loading && callStatus.includes('Calling')}
              >
                End Call
              </button>
            </>
          )}
        </div>

        <div className="w-full sm:w-[380px] md:w-[420px] bg-white rounded-r-xl flex flex-col overflow-hidden">
          <div className="px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-2 px-1 text-sm font-medium text-center -mb-px border-b-2 ${rightTab === 'chat' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setRightTab('chat')}
              >
                Chat Transcript
              </button>
              <button
                className={`flex-1 py-2 px-1 text-sm font-medium text-center -mb-px border-b-2 ${rightTab === 'history' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setRightTab('history')}
              >
                Call History
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {rightTab === 'history' && (
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Call Logs</h3>
                {loading && callHistory.length === 0 && <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto my-4"/>}
                {!loading && callHistory.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No call history available.</p>
                )}
                {callHistory.map((call, idx) => (
                  <div key={call.id || call.sid || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 text-sm truncate" title={getCallUser(call)}>{getCallUser(call)}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${call.status === 'completed' ? 'bg-green-100 text-green-700' : call.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{call.status}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Time: {formatCallTimestamp(call.dateCreated || call.timestamp)}</div>
                      <div>Duration: {formatCallDuration(call.duration)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rightTab === 'chat' && (
              <div className="h-full flex flex-col items-start justify-start p-4 space-y-4 overflow-y-auto">
                {callHistory.length === 0 ? (
                  <p className="text-gray-400 text-sm">No chat transcripts available.</p>
                ) : (
                  callHistory.map((call, idx) => (
                    <div key={call.id || call.sid || idx} className="mb-4 p-3 bg-gray-50 rounded shadow w-full">
                      <div className="text-xs text-gray-500 mb-1">
                        {formatCallTimestamp(call.dateCreated || call.timestamp)}
                      </div>
                      <div className="font-semibold text-gray-800 mb-1">
                        Call to: {call.recipient || call.to}
                      </div>
                      <div className="text-gray-700 whitespace-pre-line text-sm">
                        {/* Extract and show only the <Say> parts from the TwiML message */}
                        {call.message
                          ? call.message
                              .split(/<Say>|<\/Say>/)
                              .filter((part: string, i: number) => i % 2 === 1)
                              .join('\n\n')
                          : 'No transcript available.'}
                      </div>
                      
                      {call.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div><strong>Shipment:</strong> {call.metadata.shipmentNumber}</div>
                          <div><strong>Temperature:</strong> {call.metadata.detectedTemperature}</div>
                          <div><strong>Time:</strong> {call.metadata.timeDate}</div>
                          <div><strong>Safe Range:</strong> {call.metadata.temperatureRange}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 transition-colors z-50 p-1 bg-white rounded-full shadow"
        onClick={onClose}
        aria-label="Close notification center"
      >
        <X className="w-6 h-6 sm:w-7 sm:w-7" />
      </button>
    </div>
  );
});

export default NotificationCenter; 