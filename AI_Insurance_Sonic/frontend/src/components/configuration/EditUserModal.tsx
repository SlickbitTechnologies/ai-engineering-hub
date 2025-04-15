import React, { useState, useEffect } from 'react';
import { Modal } from '../common';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Viewer';
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (id: number, user: Omit<User, "id">) => Promise<void>;
  user: User | null;
  isLoading?: boolean;
  error?: string | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpdateUser, 
  user,
  isLoading = false,
  error = null
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Agent' | 'Viewer'>('Agent');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !email || !user) return;
    
    // Update the user
    await onUpdateUser(user.id, {
      name,
      email,
      role
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00aff0] bg-white text-gray-900"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <div className="relative">
            <button
              type="button"
              className="w-full p-2 border border-gray-300 rounded flex justify-between items-center bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading}
            >
              <span>{role || 'Select'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && !isLoading && (
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
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 bg-[#00aff0] text-white rounded-md ${!isLoading ? 'hover:bg-[#0099d6]' : 'opacity-70 cursor-not-allowed'}`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditUserModal; 