'use client';

import { useEffect, useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  File, FilePlus, ChevronRight, Clock, CheckCircle, 
  AlertTriangle, FileText, Upload, TrendingUp, Shield, ArrowRight, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { getUserDocuments, getDocumentStats } from '../../lib/firebase';
import PageTransition from '../../components/PageTransition';
import Button from '../../components/Button';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    redacted: 0,
    pending: 0
  });
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    console.log('Dashboard page: Auth state:', { 
      userExists: !!user,
      uid: user?.uid || 'no uid',
      isAuthenticated: !!user,
      authLoading 
    });
    
    if (!authLoading && !user) {
      console.log('Dashboard page: Not authenticated, redirecting to auth page');
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Fetch documents
  useEffect(() => {
    if (user?.uid) {
      console.log('User authenticated, fetching documents');
      fetchDocuments();
    } else {
      console.log('No authenticated user, cannot fetch documents');
    }
  }, [user, retryCount]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    if (!user?.uid) {
      console.log("No user ID available for fetching documents");
      setLoading(false);
      return;
    }
    
    console.log(`Fetching documents for user: ${user.uid}`);
    
    // Set a timeout to prevent indefinite loading state
    const timeoutDuration = 15000; // 15 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeoutDuration)
    );
    
    try {
      // Get documents without using orderBy to avoid index errors
      console.log('Fetching documents directly from Firebase');
      const docs = await Promise.race([
        getUserDocuments(user.uid),
        timeoutPromise
      ]);
      
      console.log(`Successfully fetched ${docs.length} documents`);
      
      // Calculate stats from the documents
      const calculatedStats = {
        total: docs.length,
        redacted: docs.filter(doc => doc.status === 'redacted').length,
        pending: docs.filter(doc => doc.status === 'pending').length
      };
      
      console.log('Calculated document stats:', calculatedStats);
      
      setDocuments(docs);
      setStats(calculatedStats);
      setError(null);
    } catch (err) {
      console.error("Error fetching documents:", err);
      
      // Handle different error types
      let errorMessage = 'Failed to load documents. Please try again.';
      
      if (err.name === 'FirebaseError') {
        if (err.message?.includes('index')) {
          errorMessage = 'Database index is being created. Please try again in a few moments.';
        } else if (err.code === 'permission-denied') {
          errorMessage = 'You don\'t have permission to access these documents.';
        } else if (err.code === 'unavailable') {
          errorMessage = 'Service is temporarily unavailable. Please try again later.';
        }
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      
      // Set empty values even if there's an error
      setDocuments([]);
      setStats({
        total: 0,
        redacted: 0,
        pending: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while checking auth
  if (authLoading) {
    console.log('Dashboard page: Auth is loading, showing auth loading state');
    return (
      <div className="flex justify-center items-center min-h-screen flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-lg">Authenticating...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    console.log('Dashboard page: No user detected, redirecting to auth page');
    router.push('/auth');
    return (
      <div className="flex justify-center items-center min-h-screen flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle different timestamp formats
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    
    // Handle Firestore timestamps
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    
    // Try to parse as date string
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.warn('Failed to parse timestamp:', timestamp);
      return 'N/A';
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Error display */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-red-700">{error}</h3>
          <button 
            onClick={fetchDocuments} 
            className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Documents Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Documents</h2>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">Documents in your account</p>
        </motion.div>

        {/* Redacted Documents Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Redacted Documents</h2>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <p className="text-3xl font-bold text-green-600">{stats.redacted}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">Successfully processed</p>
        </motion.div>

        {/* Pending Documents Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Pending Documents</h2>
          {loading ? (
            <Skeleton height={36} width={80} />
          ) : (
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">Awaiting processing</p>
        </motion.div>
      </div>

      {/* Recent Documents Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Documents</h2>
          <Link href="/documents" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't uploaded any documents yet.</p>
            <Link href="/documents" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Upload Your First Document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.slice(0, 5).map((doc, index) => (
                  <motion.tr 
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.fileName || doc.filename}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doc.status === 'redacted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status === 'redacted' ? 'Redacted' : 'Pending'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 