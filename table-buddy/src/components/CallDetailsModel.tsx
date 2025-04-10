// src/components/CallDetailsModal.tsx

import React from 'react';
import { PhoneIcon, ClockIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callDetails: {
    phoneNumber: string;
    date: string;
    time: string;
    duration: string;
    reservation?: {
      customerName: string;
      datetime: string;
      partySize: number;
      status: string;
    };
    transcription: string;
  };
}

const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ isOpen, onClose, callDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000099] bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Call Details</h2>
        <p className="text-sm text-gray-600 mb-4">Detailed information about this call.</p>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center mb-2">
            <PhoneIcon className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-lg font-semibold text-gray-800">{callDetails.phoneNumber}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{callDetails.date} {callDetails.time}</span>
            <span><ClockIcon className="h-4 w-4 inline-block mr-1" />Duration: {callDetails.duration}</span>
          </div>
        </div>
        {callDetails.reservation && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2 text-gray-800"><CalendarIcon className="h-5 w-5 inline-block mr-1" />Reservation Created</h3>
            <p className="text-gray-600">Customer: {callDetails.reservation.customerName}</p>
            <p className="text-gray-600">Date & Time: {callDetails.reservation.datetime}</p>
            <p className="text-gray-600">Guests: {callDetails.reservation.partySize}</p>
            <p className="text-gray-600">Status: {callDetails.reservation.status}</p>
          </div>
        )}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-800"><DocumentTextIcon className="h-5 w-5 inline-block mr-1" />Call Transcription</h3>
          <p className="text-gray-600">{`Customer called to create their reservation for ${callDetails.reservation?.partySize} people.`}</p>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;