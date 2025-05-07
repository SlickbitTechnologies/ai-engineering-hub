import React, { useState, useEffect, useRef } from 'react';
import { useTemplates } from '../context/TemplateContext';
import '../styles/global.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const url = 'https://slickbit-ai-csp.onrender.com';
// const url = 'http://localhost:8000';

function Settings() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fields, setFields] = useState([{ name: '', description: '' }]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { templates, setTemplates } = useTemplates();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFields, setUploadedFields] = useState([]);
  const [showFieldVerification, setShowFieldVerification] = useState(false);
  const [metadata, setMetadata] = useState([]);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  console.log(templates, 'templatessss')
  const handleAddField = () => {
    setFields([...fields, { name: '', description: '' }]);
  };

  const handleDeleteField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...fields];
    newFields[index][field] = value;
    setFields(newFields);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setFields(template.metadataFields);
    setShowCreateForm(true);
  };

  const handleCopyTemplate = async (template) => {
    try {
      // Generate new ID for the copy
      const newId = Date.now().toString();
      
      // Create copy with new ID
      const copiedTemplate = {
        ...template,
        id: newId,
        name: `${template.name} (Copy)`,
        lastModified: new Date().toISOString().split('T')[0]
      };

      // Save the copy to backend
      const response = await fetch(`${url}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(copiedTemplate),
      });

      if (!response.ok) {
        throw new Error('Failed to create template copy');
      }

      // Refresh templates list
      const updatedTemplates = await fetch(`${url}/templates`).then(res => res.json());
      setTemplates(updatedTemplates);
      
      alert(`Template copied successfully with new ID: ${newId}`);
    } catch (error) {
      console.error('Error copying template:', error);
      alert('There was an error copying the template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await fetch(`${url}/templates/${templateId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete template');
        }

        // Remove the template from the local state
        setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
        
        // Show success message
        alert('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        alert(error.message || 'There was an error deleting the template. Please try again.');
      }
    }
  };

  const handleSaveTemplate = async () => {
    try {
      // Validate required fields
      if (!templateName.trim()) {
        alert('Please enter a template name');
        return;
      }

      if (!templateDescription.trim()) {
        alert('Please enter a template description');
        return;
      }

      // Filter out empty fields
      const validFields = fields.filter(field => field.name.trim() && field.description.trim());

      if (validFields.length === 0) {
        alert('Please add at least one metadata field');
        return;
      }

      // Generate a timestamp-based ID if not editing
      const templateId = editingTemplate ? editingTemplate.id : Date.now().toString();

      // Create template data
      const templateData = {
        id: templateId,
        name: templateName.trim(),
        description: templateDescription.trim(),
        metadataFields: validFields.map(field => ({
          name: field.name.trim(),
          description: field.description.trim()
        }))
      };

      // Save template to backend
      const response = await fetch(`${url}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save template');
      }

      // Refresh templates list
      const updatedTemplates = await fetch(`${url}/templates`).then(res => res.json());
      setTemplates(updatedTemplates);
      
      // Reset form
      handleResetForm();
      
      // Show success message
      alert(`Template ${editingTemplate ? 'updated' : 'created'} successfully with ID: ${templateId}`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert(error.message || 'There was an error saving the template. Please try again.');
    }
  };

  const handleResetForm = () => {
    setShowCreateForm(false);
    setTemplateName('');
    setTemplateDescription('');
    setFields([{ name: '', description: '' }]);
    setEditingTemplate(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      setUploadError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${url}/templates/upload-fields`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload file');
      }

      if (!data.fields || data.fields.length === 0) {
        throw new Error('No valid fields found in the file');
      }

      setUploadedFields(data.fields);
      setShowFieldVerification(true);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Failed to process file. Please check the file format and try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAcceptUploadedFields = () => {
    setFields(uploadedFields);
    setShowFieldVerification(false);
    setUploadedFields([]);
  };

  const handleRejectUploadedFields = () => {
    setShowFieldVerification(false);
    setUploadedFields([]);
  };

  const handleEditMetadata = async (metadataItem) => {
    try {
      // Here you can implement the edit functionality
      // For now, we'll just show an alert
      alert('Edit functionality will be implemented here');
    } catch (error) {
      console.error('Error editing metadata:', error);
      alert('There was an error editing the metadata. Please try again.');
    }
  };

  const handleDeleteMetadata = async (documentUrl) => {
    if (window.confirm('Are you sure you want to delete this metadata entry?')) {
      try {
        const response = await fetch(`${url}/metadata/${encodeURIComponent(documentUrl)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete metadata');
        }

        // Update the local state by filtering out the deleted item
        setMetadata(prevMetadata => prevMetadata.filter(item => item['Document URL'] !== documentUrl));
        
        alert('Metadata deleted successfully');
      } catch (error) {
        console.error('Error deleting metadata:', error);
        alert(error.message || 'There was an error deleting the metadata. Please try again.');
      }
    }
  };

  // Load templates and metadata on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load templates
        const templatesResponse = await fetch(`${url}/templates`);
        if (!templatesResponse.ok) {
          throw new Error('Failed to load templates');
        }
        const loadedTemplates = await templatesResponse.json();
        setTemplates(loadedTemplates);

        // Load metadata
        const metadataResponse = await fetch(`${url}/metadata`);
        if (!metadataResponse.ok) {
          throw new Error('Failed to load metadata');
        }
        const loadedMetadata = await metadataResponse.json();
        setMetadata(loadedMetadata);
      } catch (error) {
        console.error('Error loading data:', error);
        // alert('There was an error loading the data. Please try again.');
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveStatus('success');
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Cog6ToothIcon },
    { id: 'templates', label: 'Document Templates', icon: DocumentTextIcon }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-[#0098B3]">Settings</h1>
          <p className="mt-2 text-gray-600">Configure document templates for metadata extraction</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Create New Template Form */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-blue-700 mb-6 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-500" />
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Clinical Study Report Template"
                  style={{paddingLeft: '5px'}}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={e => setTemplateDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Describe the purpose of this template..."
                  style={{paddingLeft: '5px'}}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold text-gray-800">Metadata Fields</h4>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddField}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-1" /> Add Field
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-1" /> Import Fields
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />
              </div>
            </div>
            <motion.div layout className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {fields.map((field, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4 border border-blue-100 relative"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Field Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={e => handleFieldChange(idx, 'name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Product Name"
                        style={{paddingLeft: '5px'}}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={field.description}
                        onChange={e => handleFieldChange(idx, 'description', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Invented name, full product name"
                        style={{paddingLeft: '5px'}}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteField(idx)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 rounded-lg p-4 mt-4 flex items-center"
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{uploadError}</span>
                </motion.div>
              )}
              {showFieldVerification && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 rounded-lg p-4 mt-4"
                >
                  <h4 className="font-semibold mb-2">Verify Imported Fields ({uploadedFields.length})</h4>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {uploadedFields.map((field, i) => (
                      <div key={i} className="p-2 bg-white rounded border border-gray-200 mb-2">
                        <div className="text-sm font-medium text-gray-900">{field.name}</div>
                        <div className="text-xs text-gray-500">{field.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleRejectUploadedFields}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >Cancel</button>
                    <button
                      onClick={handleAcceptUploadedFields}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >Use These Fields</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex space-x-4 mt-6">
              {editingTemplate && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveTemplate}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </motion.button>
            </div>
          </motion.div>

          {/* Right Side: Template List */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-blue-700 mb-6 flex items-center">
              <Cog6ToothIcon className="h-6 w-6 mr-2 text-blue-500" />
              Existing Templates
            </h2>

            {templates.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No templates found. Create your first template to get started.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                <AnimatePresence>
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between">
                        <div className="flex-1 mr-4">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            {template.metadataFields?.length || 0} fields defined
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditTemplate(template)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            Edit
                          </motion.button>
                          {/* <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopyTemplate(template)}
                            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium"
                          >
                            Copy
                          </motion.button> */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Add global scrollbar styles */}
      <style jsx global>{`
        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
      `}</style>
    </div>
  );
}

export default Settings; 