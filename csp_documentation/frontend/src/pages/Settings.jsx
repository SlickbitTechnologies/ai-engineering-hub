import React, { useState, useEffect, useRef } from 'react';
import { useTemplates } from '../context/TemplateContext';
import '../styles/global.css';

const url = 'https://slickbit-ai-valut-redact.onrender.com';

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
        alert('There was an error loading the data. Please try again.');
      }
    };

    loadData();
  }, []);

  return (
    <div className="page-container">
      <div className="bg-pattern">
        <div className="bg-pattern-inner"></div>
      </div>

      <div className="content-container">
        <div className="mb-4">
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Configure document templates for metadata extraction</p>
        </div>

        {!showCreateForm ? (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="section-title">Document Templates</h2>
                <p className="section-description">Define metadata fields to extract from different document types</p>
              </div>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="button-primary"
              >
                <svg className="small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Template</span>
              </button>
            </div>

            <div className="mb-4">
              <nav className="flex space-x-4 border-b border-gray-100">
                <button className="px-3 py-2 text-xs text-[#0098B3] border-b-2 border-[#0098B3] -mb-[1px]">All Templates</button>
                {/* <button className="px-3 py-2 text-xs text-gray-500 hover:text-[#0098B3]">Clinical</button>
                <button className="px-3 py-2 text-xs text-gray-500 hover:text-[#0098B3]">Regulatory</button> */}
              </nav>
            </div>

            <div className="space-y-2">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 table-header">Template Name</th>
                    <th className="pb-2 table-header">Fields</th>
                    <th className="pb-2 table-header"></th>
                    <th className="pb-2 table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-t border-gray-100">
                      <td className="py-2.5">
                        <div>
                          <div className="table-cell-title">{template.name}</div>
                          <div className="table-cell-description">{template.description}</div>
                        </div>
                      </td>
                      <td className="py-2.5 table-cell">{template.fields} fields</td>
                      <td className="py-2.5 table-cell">{template.lastModified}</td>
                      <td className="py-2.5">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditTemplate(template)}
                            className="icon-button"
                            title="Edit template"
                          >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleCopyTemplate(template)}
                            className="icon-button"
                            title="Copy template"
                          >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="icon-button hover:text-red-500"
                            title="Delete template"
                          >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-cell-description pt-2">
                Total {templates.length} templates
              </div>
            </div>

            {/* Add Metadata Viewer Section */}
            {/* <div className="mt-8">
              <h2 className="section-title mb-4">Stored Metadata</h2>
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2 table-header">NCT ID</th>
                      <th className="pb-2 table-header">Template</th>
                      <th className="pb-2 table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map((item, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="py-2.5">
                          <div className="table-cell-title">{item['NCT ID'] || '-'}</div>
                        </td>
                        <td className="py-2.5">
                          <div className="table-cell-title">{item['Template'] || '-'}</div>
                        </td>
                        <td className="py-2.5">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditMetadata(item)}
                              className="icon-button"
                              title="Edit metadata"
                            >
                              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteMetadata(item['Document URL'])}
                              className="icon-button hover:text-red-500"
                              title="Delete metadata"
                            >
                              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div> */}
          </div>
        ) : (
          <div className="card">
            <div className="mb-4">
              <h2 className="section-title mb-1">Document Templates</h2>
              <p className="section-description">Define metadata fields to extract from different document types</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="section-title mb-3">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="form-label">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="form-input"
                      placeholder="e.g., Clinical Study Report Template"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Description
                    </label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="form-input h-16"
                      placeholder="Describe the purpose of this template..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="form-label">
                        Metadata Fields
                      </label>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleAddField}
                          className="text-[#0098B3] text-xs font-medium flex items-center space-x-1 hover:text-[#007A8F] transition-colors"
                        >
                          <svg className="small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Field</span>
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[#0098B3] text-xs font-medium flex items-center space-x-1 hover:text-[#007A8F] transition-colors"
                            disabled={isUploading}
                          >
                            <svg className="small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>{isUploading ? 'Uploading...' : 'Import Fields'}</span>
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                          />
                          {uploadError && (
                            <div className="absolute top-full left-0 mt-1 text-red-500 text-xs max-w-xs">
                              {uploadError}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {showFieldVerification && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Verify Imported Fields ({uploadedFields.length} fields)
                        </h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                          {uploadedFields.map((field, index) => (
                            <div key={index} className="p-2 bg-white rounded border border-gray-200">
                              <div className="text-sm font-medium text-gray-900">{field.name}</div>
                              <div className="text-xs text-gray-500">{field.description}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleRejectUploadedFields}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAcceptUploadedFields}
                            className="text-sm text-[#0098B3] hover:text-[#007A8F] font-medium"
                          >
                            Use These Fields
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div key={index} className="relative grid grid-cols-2 gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
                          <div>
                            <label className="form-label">
                              Field Name
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                              className="form-input"
                              placeholder="e.g., Study ID"
                            />
                          </div>
                          <div>
                            <label className="form-label">
                              Description
                            </label>
                            <input
                              type="text"
                              value={field.description}
                              onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                              className="form-input"
                              placeholder="e.g., Unique identifier for the study"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteField(index)}
                            className="absolute top-2 right-2 icon-button hover:text-red-500"
                          >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={handleResetForm}
                  className="button-secondary"
                >
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={handleSaveTemplate}
                  className="button-primary"
                >
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings; 