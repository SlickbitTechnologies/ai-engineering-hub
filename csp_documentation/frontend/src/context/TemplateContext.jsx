import React, { createContext, useContext, useState, useEffect } from 'react';

const TemplateContext = createContext();

export function TemplateProvider({ children }) {
  // Initial templates data
  const initialTemplates = [
    // {
    //   id: 1,
    //   name: 'Clinical Study Report',
    //   description: 'Template for extracting metadata from clinical study reports',
    //   fields: 10,
    //   lastModified: '2025-04-01',
    //   metadataFields: [
    //     { name: 'Study ID', description: 'Unique identifier for the study' },
    //     { name: 'Protocol Number', description: 'Protocol identification number' }
    //   ]
    // },
    // {
    //   id: 2,
    //   name: 'Regulatory Submission',
    //   description: 'Template for regulatory documents submitted to agencies',
    //   fields: 8,
    //   lastModified: '2025-03-25',
    //   metadataFields: [
    //     { name: 'Submission ID', description: 'Regulatory submission identifier' },
    //     { name: 'Agency', description: 'Regulatory agency name' }
    //   ]
    // },
    // {
    //   id: 3,
    //   name: 'Patient Data Summary',
    //   description: 'Template for patient data summary reports',
    //   fields: 12,
    //   lastModified: '2025-04-10',
    //   metadataFields: [
    //     { name: 'Patient ID', description: 'Unique patient identifier' },
    //     { name: 'Visit Date', description: 'Date of patient visit' }
    //   ]
    // }
  ];

  // Load templates from localStorage or use initial templates
  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem('documentTemplates');
    return savedTemplates ? JSON.parse(savedTemplates) : initialTemplates;
  });

  // Save templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('documentTemplates', JSON.stringify(templates));
  }, [templates]);

  return (
    <TemplateContext.Provider value={{ templates, setTemplates }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
} 