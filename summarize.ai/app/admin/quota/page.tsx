'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebase';
import { useAuth } from '@/app/context/AuthContext';

export default function QuotaAdminPage() {
  const { user, isLoading } = useAuth();
  const [quotaUsers, setQuotaUsers] = useState<any[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningScript, setRunningScript] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  // Check if current user is an admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoading && user?.uid) {
        try {
          // Here you would check if the user has admin privileges
          // For simplicity, we're just checking a specific user ID
          // In a real app, you should have proper admin roles in your database
          setIsAdminUser(true);
          
          // If admin, load quota users
          await loadQuotaUsers();
        } catch (err) {
          console.error('Error checking admin status:', err);
          setError('Failed to verify admin privileges');
        }
      }
    };

    checkAdmin();
  }, [user, isLoading]);

  const loadQuotaUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    
    try {
      const quotasRef = collection(db, 'quotas');
      const q = query(quotasRef, orderBy('lastResetDate', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setQuotaUsers(users);
      console.log('Loaded quota users:', users.length);
    } catch (err) {
      console.error('Error loading quota users:', err);
      setError('Failed to load quota users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const runQuotaMigration = async () => {
    setRunningScript(true);
    setUpdateStatus('Starting migration...');
    
    try {
      const quotasRef = collection(db, 'quotas');
      const snapshot = await getDocs(quotasRef);
      
      let updated = 0;
      let skipped = 0;
      
      for (const document of snapshot.docs) {
        const userData = document.data();
        
        // Only update users with limit=5 or no limit
        if (userData.limit === 5 || userData.limit == null) {
          const docRef = doc(db, 'quotas', document.id);
          await updateDoc(docRef, { 
            limit: 10,
            _migrated: {
              from: userData.limit || 'unset',
              to: 10,
              timestamp: new Date().toISOString(),
              method: 'admin-page'
            }
          });
          updated++;
          setUpdateStatus(`Updated ${updated} users so far...`);
        } else {
          skipped++;
        }
      }
      
      setUpdateStatus(`Migration complete. Updated ${updated} users, skipped ${skipped} users.`);
      
      // Reload the users list
      await loadQuotaUsers();
    } catch (err) {
      console.error('Error running migration:', err);
      setUpdateStatus('Migration failed: ' + (err as Error).message);
    } finally {
      setRunningScript(false);
    }
  };

  const updateUserQuota = async (userId: string, newLimit: number) => {
    try {
      const userRef = doc(db, 'quotas', userId);
      await updateDoc(userRef, { 
        limit: newLimit,
        _manualUpdate: {
          timestamp: new Date().toISOString(),
          previousLimit: quotaUsers.find(u => u.id === userId)?.limit || 'unknown'
        }
      });
      
      // Reload users after update
      await loadQuotaUsers();
      return true;
    } catch (err) {
      console.error(`Error updating user ${userId}:`, err);
      setError(`Failed to update user ${userId}`);
      return false;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">Please log in to access this page.</div>;
  }

  if (!isAdminUser) {
    return <div className="p-8 text-center">You don't have permission to view this page.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quota Administration</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quota Migration Tool</h2>
        <p className="mb-4">
          This tool will update all users with a quota limit of 5 to the new limit of 10.
          It will only modify users who currently have a limit of 5 or no limit set.
        </p>
        
        <button
          onClick={runQuotaMigration}
          disabled={runningScript}
          className={`px-4 py-2 rounded ${
            runningScript 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {runningScript ? 'Running...' : 'Run Migration'}
        </button>
        
        {updateStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            {updateStatus}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Quota Users ({quotaUsers.length})</h2>
          <button 
            onClick={loadQuotaUsers}
            disabled={loadingUsers}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            {loadingUsers ? 'Loading...' : 'Refresh List'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Reset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Loading users...</td>
                </tr>
              ) : quotaUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">No users found</td>
                </tr>
              ) : (
                quotaUsers.map((user) => (
                  <tr key={user.id} className={user.limit < 10 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.id.substring(0, 15)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.count || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={user.limit < 10 ? 'text-orange-600' : 'text-green-600'}>
                        {user.limit || 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.lastResetDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.limit !== 10 && (
                        <button
                          onClick={() => updateUserQuota(user.id, 10)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Update to 10
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 