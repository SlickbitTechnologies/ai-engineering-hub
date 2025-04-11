import React, { useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import { DataTable } from '../../components/common';
import { Column } from '../../components/common/DataTable';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Agent';
}

interface UserManagementCardProps {
  users: User[];
}

const UserManagementCard: React.FC<UserManagementCardProps> = ({ users }) => {
  console.log('Rendering UserManagementCard component');

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
      render: () => (
        <>
          <button className="text-[#00aff0] hover:text-[#0099d6] mr-3">
            Edit
          </button>
          <button className="text-red-600 hover:text-red-900">
            Delete
          </button>
        </>
      )
    }
  ], []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">User Management</h2>
      <p className="text-gray-600 mb-6">Manage users and their roles within the application.</p>
      
      <DataTable
        columns={columns}
        data={users}
        emptyMessage="No users found."
      />
      
      <div className="mt-6">
        <button className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]">
          <FaPlus className="inline mr-1" /> Add User
        </button>
      </div>
    </div>
  );
};

export default UserManagementCard; 