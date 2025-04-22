import React, { useMemo, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { DataTable } from '../../components/common';
import { Column } from '../../components/common/DataTable';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import ConfirmationModal from './ConfirmationModal';
import { parseApiError } from '../../services/errorHandler';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Viewer';
}

interface UserManagementCardProps {
  users: User[];
  onCreateUser: (user: Omit<User, "id">) => Promise<void>;
  onUpdateUser: (id: number, user: Omit<User, "id">) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
}

const UserManagementCard: React.FC<UserManagementCardProps> = ({ 
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) => {
  console.log('Rendering UserManagementCard component');
  
  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  
  // Selected user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Operation states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle edit user click
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
    setError(null);
  };

  // Handle delete user click
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteConfirmationOpen(true);
    setError(null);
  };

  // Helper to handle API errors
  const handleApiError = (err: unknown): string => {
    // Check if it's a known error type
    if (
      typeof err === 'object' && 
      err !== null && 
      ('status' in err || 'message' in err)
    ) {
      const apiError = parseApiError(err as FetchBaseQueryError | SerializedError);
      return apiError.message;
    }
    
    // Handle unknown errors
    console.error('Unknown error type:', err);
    return 'An unexpected error occurred';
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (selectedUser) {
      setIsLoading(true);
      setError(null);
      
      try {
        await onDeleteUser(selectedUser.id);
        console.log('User deleted successfully');
        setIsDeleteConfirmationOpen(false);
        setSelectedUser(null);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(`Failed to delete user: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle create user with error handling
  const handleCreateUser = async (user: Omit<User, "id">) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onCreateUser(user);
      console.log('User created successfully');
      setIsAddUserModalOpen(false);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(`Failed to create user: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle update user with error handling
  const handleUpdateUser = async (id: number, user: Omit<User, "id">) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onUpdateUser(id, user);
      console.log('User updated successfully');
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(`Failed to update user: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column[] = useMemo(() => [
    { 
      key: 'name', 
      label: 'Name',
      sortable: true 
    },
    { 
      key: 'email', 
      label: 'Email',
      sortable: true 
    },
    { 
      key: 'role', 
      label: 'Role',
      sortable: true 
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row: User) => (
        <>
          <button 
            className="text-[#00aff0] hover:text-[#0099d6] mr-3"
            onClick={() => handleEditUser(row)}
            disabled={isLoading}
          >
            Edit
          </button>
          <button 
            className="text-red-600 hover:text-red-900"
            onClick={() => handleDeleteUser(row)}
            disabled={isLoading}
          >
            Delete
          </button>
        </>
      )
    }
  ], [isLoading]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">User Management</h2>
      <p className="text-gray-600 mb-6">Manage users and their roles within the application.</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      <DataTable
        columns={columns}
        data={users}
        emptyMessage="No users found."
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
      
      <div className="mt-6">
        <button 
          className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6] disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => setIsAddUserModalOpen(true)}
          disabled={isLoading}
        >
          <FaPlus className="inline mr-1" /> Add User
        </button>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onCreateUser={handleCreateUser}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        onUpdateUser={handleUpdateUser}
        user={selectedUser}
        isLoading={isLoading}
        error={error}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Confirm Delete"
        message={`Are you sure you want to delete the user "${selectedUser?.name}"? This action cannot be undone.`}
        confirmButtonText={isLoading ? "Deleting..." : "Delete"}
        confirmButtonClass={`${isLoading ? "bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
      />
    </div>
  );
};

export default UserManagementCard; 