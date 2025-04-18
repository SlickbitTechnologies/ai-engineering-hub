'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  File, FilePlus, ChevronRight, Clock, CheckCircle, 
  AlertTriangle, FileText, Upload, TrendingUp, Shield 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { getUserDocuments } from '../../lib/firebase';
import PageTransition from '../../components/PageTransition';
import Button from '../../components/Button';

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
  const { user, isAuthenticated, loading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    redacted: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    async function fetchDocuments() {
      if (user) {
        try {
          const docs = await getUserDocuments(user.uid);
          setDocuments(docs);
          
          // Calculate statistics
          const total = docs.length;
          const redacted = docs.filter(doc => doc.status === 'redacted').length;
          const pending = docs.filter(doc => doc.status === 'pending').length;
          
          setStats({
            total,
            redacted,
            pending,
          });
        } catch (error) {
          console.error('Error fetching documents:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Here's an overview of your document redaction activity.</p>
      </motion.div>
      
      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
          variants={fadeInUp}
          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-50 p-3 rounded-full">
                <FileText className="h-7 w-7 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Documents</dt>
                  <dd>
                    <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <div className="text-sm">
              <Link href="/documents" className="font-medium text-chateau-green-700 hover:text-chateau-green-900 flex items-center">
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
          variants={fadeInUp}
          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-50 p-3 rounded-full">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Redacted Documents</dt>
                  <dd>
                    <div className="text-2xl font-semibold text-gray-900">{stats.redacted}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <div className="text-sm">
              <Link href="/documents?status=redacted" className="font-medium text-chateau-green-700 hover:text-chateau-green-900 flex items-center">
                View redacted
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
          variants={fadeInUp}
          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-50 p-3 rounded-full">
                <Clock className="h-7 w-7 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Documents</dt>
                  <dd>
                    <div className="text-2xl font-semibold text-gray-900">{stats.pending}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <div className="text-sm">
              <Link href="/documents?status=pending" className="font-medium text-chateau-green-700 hover:text-chateau-green-900 flex items-center">
                View pending
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Documents */}
      <div className="mb-2 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
        <Link href="/documents" className="text-sm font-medium text-chateau-green-700 hover:text-chateau-green-900 flex items-center">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-chateau-green-600"></div>
        </div>
      ) : documents.length > 0 ? (
        <motion.div
          className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ul className="divide-y divide-gray-200">
            {documents.slice(0, 5).map((doc) => (
              <motion.li 
                key={doc.id} 
                className="p-4 hover:bg-gray-50 transition-colors duration-150"
                whileHover={{ x: 5 }}
              >
                <Link href={`/documents/${doc.id}`} className="flex items-center">
                  <div className="mr-4 flex-shrink-0">
                    {doc.status === 'redacted' ? (
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded on {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doc.status === 'redacted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      ) : (
        <motion.div
          className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col items-center justify-center p-8">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <File className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No documents</h3>
            <p className="text-gray-500 mb-4">Get started by uploading your first document for redaction.</p>
            <Button 
              onClick={() => router.push('/documents/upload')}
              variant="primary"
              Icon={Upload}
            >
              Upload Document
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
} 