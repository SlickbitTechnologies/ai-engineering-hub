import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Users,
  FileText,
  Bell,
  Save,
  Eye,
  EyeOff,
  Download,
  UserPlus,
  FileDown,
  Slack,
  AlertTriangle,
  Mail,
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('api');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [formData, setFormData] = useState({
    groqKey: '',
    googleDriveKey: '',
    sharePointCredentials: '',
    automaticProcessing: true,
    anonymizeData: true,
    dataRetention: '90',
    emailNotifications: true,
    slackNotifications: false,
    negativeSentimentThreshold: '15',
    newRecommendations: true,
    newDataProcessed: true,
    exportFormat: 'pdf',
    includeVisualizations: true,
    includeRawData: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const tabs = [
    { id: 'api', label: 'API Integration', icon: KeyRound },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your API keys, user access, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Configuration Section */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">API Configuration</h2>
            <p className="text-gray-600 text-sm">
              Manage your API keys for various integrations
            </p>
          </div>

          <div className="space-y-4">
            {/* GROQ API Key */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">GROQ API Key (for Sentiment Analysis)</h3>
                  <p className="text-sm text-gray-600">Required for sentiment analysis processing</p>
                </div>
                <button
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showGroqKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  name="groqKey"
                  value={formData.groqKey}
                  onChange={handleInputChange}
                  placeholder="Enter your GROQ API key"
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save
                </button>
              </div>
            </div>

            {/* Google Drive API Key */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="mb-4">
                <h3 className="font-medium">Google Drive API Key</h3>
                <p className="text-sm text-gray-600">Connect to import files from Google Drive</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="googleDriveKey"
                  placeholder="Enter your Google Drive API key"
                  value={formData.googleDriveKey}
                  onChange={handleInputChange}
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                  Configure
                </button>
              </div>
            </div>

            {/* SharePoint Credentials */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="mb-4">
                <h3 className="font-medium">SharePoint API Credentials</h3>
                <p className="text-sm text-gray-600">Connect to import files from SharePoint</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sharePointCredentials"
                  placeholder="Enter your SharePoint credentials"
                  value={formData.sharePointCredentials}
                  onChange={handleInputChange}
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Data Processing Settings */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Data Processing Settings</h2>
              <p className="text-gray-600 text-sm">
                Configure how sentiment analysis processes your data
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border space-y-6">
              {/* Automatic Processing */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Automatic Processing</h3>
                  <p className="text-sm text-gray-600">Automatically process new uploads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="automaticProcessing"
                    checked={formData.automaticProcessing}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Anonymize Data */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Anonymize Data</h3>
                  <p className="text-sm text-gray-600">Remove personally identifiable information</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="anonymizeData"
                    checked={formData.anonymizeData}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Data Retention */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Retention</h3>
                  <p className="text-sm text-gray-600">Keep processed data for analysis</p>
                </div>
                <select
                  name="dataRetention"
                  value={formData.dataRetention}
                  onChange={handleInputChange}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">User Management</h2>
              <p className="text-gray-600 text-sm">
                Manage user roles and access permissions
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-12 gap-4 font-medium text-gray-600">
                <div className="col-span-4">Role</div>
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Status</div>
              </div>
            </div>
            <div className="p-4 text-center text-gray-500">
              No user roles have been configured yet.
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  User management requires an active subscription. Please contact support to enable this feature.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Section */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Report Settings</h2>
            <p className="text-gray-600 text-sm">
              Configure default export options for reports
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border space-y-6">
            <div>
              <h3 className="font-medium mb-2">Default Export Format</h3>
              <select
                name="exportFormat"
                value={formData.exportFormat}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="csv">CSV Spreadsheet</option>
                <option value="xlsx">Excel Spreadsheet</option>
                <option value="json">JSON Data</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeVisualizations"
                name="includeVisualizations"
                checked={formData.includeVisualizations}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeVisualizations">
                <span>Include visualizations and charts</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeRawData"
                name="includeRawData"
                checked={formData.includeRawData}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeRawData">
                <span>Include raw data tables</span>
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Historical Reports</h2>
            <p className="text-gray-600 text-sm">
              Download previously generated reports
            </p>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-12 gap-4 font-medium text-gray-600">
                <div className="col-span-6">Report Name</div>
                <div className="col-span-4">Date</div>
                <div className="col-span-2">Action</div>
              </div>
            </div>
            <div className="p-4 text-center text-gray-500">
              No historical reports available. Upload and analyze data to generate reports.
            </div>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Notification Settings</h2>
            <p className="text-gray-600 text-sm">
              Configure how you receive alerts and notifications
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border space-y-6">
            <div>
              <h3 className="font-medium mb-2">Email Notifications</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-3 ml-6">
                <input
                  type="checkbox"
                  id="newRecommendations"
                  name="newRecommendations"
                  checked={formData.newRecommendations}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="newRecommendations">
                  <span>New HR recommendations</span>
                </label>
              </div>
              <div className="flex items-center gap-3 ml-6 mt-2">
                <input
                  type="checkbox"
                  id="newDataProcessed"
                  name="newDataProcessed"
                  checked={formData.newDataProcessed}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="newDataProcessed">
                  <span>New data processed</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Slack Integration</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Receive notifications in Slack
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="slackNotifications"
                    checked={formData.slackNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                <Slack className="w-4 h-4" />
                <span>Connect Slack</span>
              </button>
            </div>

            <div>
              <h3 className="font-medium mb-2">Alert Thresholds</h3>
              <div className="flex items-center gap-4">
                <label htmlFor="negativeSentimentThreshold" className="text-sm text-gray-600">
                  Alert when negative sentiment exceeds
                </label>
                <input
                  type="number"
                  id="negativeSentimentThreshold"
                  name="negativeSentimentThreshold"
                  min="0"
                  max="100"
                  value={formData.negativeSentimentThreshold}
                  onChange={handleInputChange}
                  className="w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
}