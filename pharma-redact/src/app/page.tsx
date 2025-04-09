"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Get documents data from Redux store
  const { documents } = useSelector((state: RootState) => state.documents as {
    documents: any[];
    isLoading: boolean;
    error: string | null;
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [router, isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg 
            className="animate-spin h-12 w-12 text-chateau-green-600 mx-auto mb-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 className="text-xl font-medium text-gray-700">Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  // Count documents by status
  const pendingCount = documents.filter(doc => doc.status === 'pending').length;
  const processingCount = documents.filter(doc => doc.status === 'processing').length;
  const redactedCount = documents.filter(doc => doc.status === 'redacted').length;
  const errorCount = documents.filter(doc => doc.status === 'error').length;
  
  // Calculate recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDocuments = documents.filter(doc => new Date(doc.uploadedAt) >= sevenDaysAgo);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-chateau-green-500 to-chateau-green-700 rounded-2xl overflow-hidden shadow-xl mb-10">
          <div className="flex flex-col md:flex-row items-center py-10 px-8">
            <div className="w-full md:w-1/2 mb-8 md:mb-0 text-white">
              <h1 className="text-4xl font-bold mb-3">Welcome back, {user?.name}</h1>
              <p className="text-xl mb-6 opacity-90">
                Your secure pharma document redaction platform
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  href="/documents"
                  className="px-5 py-2.5 rounded-lg bg-white text-chateau-green-700 font-medium hover:bg-gray-100 transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  View All Documents
                </Link>
                <Link
                  href="/redaction-rules"
                  className="px-5 py-2.5 rounded-lg bg-chateau-green-600 text-white border border-white/30 font-medium hover:bg-chateau-green-700 transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  Manage Rules
                </Link>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <div className="relative w-72 h-72">
                <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  {/* Document stack */}
                  <rect x="60" y="30" width="80" height="110" rx="4" fill="#fff" />
                  <rect x="70" y="40" width="60" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="50" width="40" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="60" width="55" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="70" width="48" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="80" width="38" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="90" width="58" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="100" width="48" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="70" y="110" width="52" height="6" rx="1" fill="#e2e8f0" />
                  {/* Document with redaction */}
                  <rect x="50" y="60" width="80" height="110" rx="4" fill="#fff" stroke="#f1f5f9" strokeWidth="2" />
                  <rect x="60" y="70" width="60" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="60" y="80" width="40" height="6" rx="1" fill="#e2e8f0" />
                  {/* Redacted line */}
                  <rect x="60" y="90" width="55" height="6" rx="1" fill="#ef4444" />
                  <rect x="60" y="100" width="48" height="6" rx="1" fill="#e2e8f0" />
                  {/* Redacted line */}
                  <rect x="60" y="110" width="38" height="6" rx="1" fill="#ef4444" />
                  <rect x="60" y="120" width="58" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="60" y="130" width="48" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="60" y="140" width="52" height="6" rx="1" fill="#e2e8f0" />
                  {/* Front document */}
                  <rect x="40" y="90" width="80" height="110" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
                  <rect x="50" y="105" width="60" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="50" y="115" width="40" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="50" y="125" width="55" height="6" rx="1" fill="#e2e8f0" />
                  <rect x="50" y="135" width="48" height="6" rx="1" fill="#e2e8f0" />
                  {/* Magnifying glass with checkmark */}
                  <circle cx="130" cy="140" r="25" fill="#10b981" />
                  <circle cx="130" cy="140" r="20" fill="#fff" fillOpacity="0.8" />
                  <path d="M125 140 L128 143 L135 136" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Shield for security */}
                  <path d="M150 70 L160 65 L170 70 L170 85 C170 90 165 95 160 100 C155 95 150 90 150 85 Z" fill="#10b981" fillOpacity="0.8" stroke="#fff" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Document Statistics Cards */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Total Documents</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{documents.length}</div>
            <div className="text-sm text-gray-500 mt-2">
              {recentDocuments.length} added in the last 7 days
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Pending</h3>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-sm text-gray-500 mt-2">
              Awaiting processing
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Processing</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{processingCount}</div>
            <div className="text-sm text-gray-500 mt-2">
              Currently being processed
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Redacted</h3>
              <div className="p-2 bg-chateau-green-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-chateau-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{redactedCount}</div>
            <div className="text-sm text-gray-500 mt-2">
              Successfully redacted
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/documents?upload=true"
              className="flex items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-3 rounded-full bg-blue-50 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload Document</h3>
                <p className="text-sm text-gray-500">Add a new document for redaction</p>
              </div>
            </Link>
            
            <Link
              href="/documents?status=pending"
              className="flex items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-3 rounded-full bg-yellow-50 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Pending Documents</h3>
                <p className="text-sm text-gray-500">View documents awaiting redaction</p>
              </div>
            </Link>
            
            <Link
              href="/redaction-rules"
              className="flex items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-3 rounded-full bg-chateau-green-50 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-chateau-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="9" x2="20" y2="9" />
                  <line x1="4" y1="15" x2="20" y2="15" />
                  <line x1="10" y1="3" x2="8" y2="21" />
                  <line x1="16" y1="3" x2="14" y2="21" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Redaction Rules</h3>
                <p className="text-sm text-gray-500">Manage your redaction patterns</p>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        {recentDocuments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <ul className="divide-y divide-gray-200">
                  {recentDocuments.slice(0, 5).map(doc => (
                    <li key={doc.id} className="py-3 first:pt-0 last:pb-0">
                      <Link href={`/documents/${doc.id}`} className="flex items-center hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors">
                        <div className="mr-4">
                          <div className="p-2 rounded-md bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            <span className="capitalize">{doc.status}</span>
                            <span className="mx-1">•</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doc.status === 'redacted' ? 'bg-chateau-green-100 text-chateau-green-800' :
                            doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            doc.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <Link href="/documents" className="text-sm font-medium text-chateau-green-600 hover:text-chateau-green-500">
                  View all documents →
                </Link>
              </div>
            </div>
          </div>
        )}
    </div>
    </MainLayout>
  );
}
