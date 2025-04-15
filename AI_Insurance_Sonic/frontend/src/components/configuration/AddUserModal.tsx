import React, { useState } from 'react';
import { Modal } from '../common';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Viewer';
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (user: Omit<User, "id">) => Promise<void>;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onCreateUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Agent' | 'Viewer'>('Agent');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !email) return;
    
    // Create the user
    await onCreateUser({
      name,
      email,
      role
    });
    
    // Reset form and close modal
    setName('');
    setEmail('');
    setRole('Agent');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add User">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            placeholder="john.doe@example.com"
          />
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <div className="relative">
            <button
              type="button"
              className="w-full p-2 border border-gray-300 rounded flex justify-between items-center bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{role || 'Select'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                {['Admin', 'Agent', 'Viewer'].map((option) => (
                  <div
                    key={option}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setRole(option as 'Admin' | 'Agent' | 'Viewer');
                      setIsDropdownOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]"
            onClick={handleSubmit}
          >
            Create User
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddUserModal; 