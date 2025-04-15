import React from 'react';
import { Modal } from '../common';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700'
}) => {
  
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-gray-700">{message}</p>
        
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-white rounded-md ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal; 