import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    bio: ''
  });

  // Initialize form data when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      // Parse the display name if available (typically in format "First Last")
      const nameParts = currentUser.displayName ? currentUser.displayName.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      setFormData({
        firstName,
        lastName,
        email: currentUser.email || '',
        company: '', // This could be stored in a separate collection or user profile
        bio: ''      // This could be stored in a separate collection or user profile
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would update the user profile in your database
    console.log('Updating user profile:', formData);
    
    // Example of what you might do (not implemented):
    // await updateUserProfile(currentUser.uid, formData);
    
    alert('Profile updated successfully!');
  };

  // Get user initials for avatar
  const getInitials = () => {
    const firstInitial = formData.firstName.charAt(0) || '';
    const lastInitial = formData.lastName.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Profile Information</h2>
          <p className="text-sm text-gray-600">Update your account information</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User avatar" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold">{getInitials()}</span>
                )}
              </div>
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Change Avatar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={true} // Email comes from authentication, typically can't be changed here
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Contact support for email changes.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}