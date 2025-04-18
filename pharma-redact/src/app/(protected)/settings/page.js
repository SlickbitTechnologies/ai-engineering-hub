'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Settings, PlusCircle, Trash2, Edit, Save, X, Check, 
  AlertTriangle, Info, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../../lib/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 500,
      duration: 0.3
    } 
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 } 
  }
};

const tabAnimation = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
};

export default function RedactionSettings() {
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([
    { id: '1', name: 'Email Addresses', description: 'Redacts email addresses', enabled: true, pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b' },
    { id: '2', name: 'Phone Numbers', description: 'Redacts US phone numbers', enabled: true, pattern: '\\b\\(\\d{3}\\)\\s?\\d{3}-\\d{4}\\b|\\b\\d{3}-\\d{3}-\\d{4}\\b' },
    { id: '3', name: 'Social Security Numbers', description: 'Redacts SSNs', enabled: true, pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b' },
    { id: '4', name: 'Credit Card Numbers', description: 'Redacts credit card numbers', enabled: false, pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b' },
  ]);
  
  const [templates, setTemplates] = useState([
    { id: '1', name: 'HIPAA Compliance', description: 'Redacts PHI including names, addresses, emails, and medical record numbers', rules: ['1', '2', '3'], isDefault: true },
    { id: '2', name: 'GDPR Standard', description: 'Redacts personal identifiable information as per GDPR guidelines', rules: ['1', '3', '4'], isDefault: false },
    { id: '3', name: 'Internal Communications', description: 'Redacts employee IDs, internal codes and proprietary information', rules: ['1', '2'], isDefault: false },
  ]);
  
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '' });
  
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  // Handle rule modal
  const openRuleModal = (rule = null) => {
    setCurrentRule(rule || { name: '', description: '', enabled: true, pattern: '' });
    setIsRuleModalOpen(true);
  };

  // Handle template modal
  const openTemplateModal = (template = null) => {
    setCurrentTemplate(template || { name: '', description: '', rules: [], isDefault: false });
    setIsTemplateModalOpen(true);
  };

  // Handle delete modal
  const openDeleteModal = (type, id) => {
    setDeleteTarget({ type, id });
    setIsDeleteModalOpen(true);
  };

  // Handle save rule
  const handleSaveRule = () => {
    if (!currentRule.name || !currentRule.pattern) return;
    
    if (currentRule.id) {
      // Update existing rule
      setRules(rules.map(r => r.id === currentRule.id ? currentRule : r));
    } else {
      // Add new rule
      setRules([...rules, { ...currentRule, id: Date.now().toString() }]);
    }
    
    setIsRuleModalOpen(false);
  };

  // Handle save template
  const handleSaveTemplate = () => {
    if (!currentTemplate.name || currentTemplate.rules.length === 0) return;
    
    if (currentTemplate.id) {
      // Update existing template
      setTemplates(templates.map(t => t.id === currentTemplate.id ? currentTemplate : t));
      
      // If marking as default, unmark others
      if (currentTemplate.isDefault) {
        setTemplates(templates.map(t => 
          t.id !== currentTemplate.id ? { ...t, isDefault: false } : t
        ));
      }
    } else {
      // Add new template
      const newTemplate = { ...currentTemplate, id: Date.now().toString() };
      
      // If marking as default, unmark others
      if (newTemplate.isDefault) {
        setTemplates(templates.map(t => ({ ...t, isDefault: false })).concat(newTemplate));
      } else {
        setTemplates([...templates, newTemplate]);
      }
    }
    
    setIsTemplateModalOpen(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (deleteTarget.type === 'rule') {
      setRules(rules.filter(r => r.id !== deleteTarget.id));
      
      // Also remove this rule from any templates that use it
      setTemplates(templates.map(t => ({
        ...t,
        rules: t.rules.filter(rId => rId !== deleteTarget.id)
      })));
    } else if (deleteTarget.type === 'template') {
      setTemplates(templates.filter(t => t.id !== deleteTarget.id));
    }
    
    setIsDeleteModalOpen(false);
  };

  // Toggle rule enabled state
  const toggleRuleEnabled = (id) => {
    setRules(rules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  // Get rule name by ID
  const getRuleName = (id) => {
    const rule = rules.find(r => r.id === id);
    return rule ? rule.name : 'Unknown Rule';
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Redaction Settings</h1>
          <p className="text-gray-600 mt-1">Configure rules and templates for document redaction</p>
        </div>
      </motion.div>

      <Tabs.Root 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-4"
      >
        <Tabs.List 
          className="flex border-b border-gray-200 mb-6 space-x-4"
          aria-label="Manage redaction settings"
        >
          <Tabs.Trigger
            value="rules"
            className={`pb-3 px-3 inline-flex items-center text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'rules' 
              ? 'border-chateau-green-600 text-chateau-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Redaction Rules
          </Tabs.Trigger>
          
          <Tabs.Trigger
            value="templates"
            className={`pb-3 px-3 inline-flex items-center text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'templates' 
              ? 'border-chateau-green-600 text-chateau-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Redaction Templates
          </Tabs.Trigger>
        </Tabs.List>

        <AnimatePresence mode="wait">
          <Tabs.Content value="rules" asChild>
            <motion.div
              key="rules-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabAnimation}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Redaction Rules</h2>
                <motion.button
                  onClick={() => openRuleModal()}
                  className="inline-flex items-center justify-center px-4 py-2 bg-chateau-green-600 text-white rounded-md shadow-sm hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Rule
                </motion.button>
              </div>
              
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {rules.map(rule => (
                    <motion.li
                      key={rule.id}
                      className="p-4 hover:bg-gray-50"
                      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">{rule.name}</h3>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 break-words">
                            {rule.description}
                          </p>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">
                              {rule.pattern}
                            </code>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleRuleEnabled(rule.id)}
                            className={`p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 ${
                              rule.enabled ? 'text-chateau-green-600' : 'text-gray-400'
                            }`}
                          >
                            {rule.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openRuleModal(rule)}
                            className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal('rule', rule.id)}
                            className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                  {rules.length === 0 && (
                    <li className="p-6 text-center">
                      <p className="text-gray-500">No redaction rules created. Click "Add Rule" to create one.</p>
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="templates" asChild>
            <motion.div
              key="templates-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabAnimation}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Redaction Templates</h2>
                <motion.button
                  onClick={() => openTemplateModal()}
                  className="inline-flex items-center justify-center px-4 py-2 bg-chateau-green-600 text-white rounded-md shadow-sm hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Template
                </motion.button>
              </div>
              
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {templates.map(template => (
                    <motion.li
                      key={template.id}
                      className="p-4 hover:bg-gray-50"
                      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                            {template.isDefault && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {template.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {template.rules.map(ruleId => (
                              <span 
                                key={ruleId}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {getRuleName(ruleId)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openTemplateModal(template)}
                            className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!template.isDefault && (
                            <button
                              onClick={() => openDeleteModal('template', template.id)}
                              className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                  {templates.length === 0 && (
                    <li className="p-6 text-center">
                      <p className="text-gray-500">No templates created. Click "Add Template" to create one.</p>
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          </Tabs.Content>
        </AnimatePresence>
      </Tabs.Root>

      {/* Rule Modal */}
      <Dialog.Root open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div 
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    {currentRule?.id ? 'Edit Rule' : 'Add Rule'}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-400 hover:text-gray-500">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      id="rule-name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm"
                      placeholder="Email Addresses"
                      value={currentRule?.name || ''}
                      onChange={e => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="rule-description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="rule-description"
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm"
                      placeholder="Redacts email addresses from documents"
                      value={currentRule?.description || ''}
                      onChange={e => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="rule-pattern" className="block text-sm font-medium text-gray-700">
                      Regex Pattern
                    </label>
                    <input
                      type="text"
                      id="rule-pattern"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm font-mono"
                      placeholder="\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
                      value={currentRule?.pattern || ''}
                      onChange={e => setCurrentRule(prev => ({ ...prev, pattern: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Regular expression pattern used to match sensitive information.
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="rule-enabled"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-chateau-green-600 focus:ring-chateau-green-500"
                      checked={currentRule?.enabled || false}
                      onChange={e => setCurrentRule(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <label htmlFor="rule-enabled" className="ml-2 block text-sm text-gray-900">
                      Rule enabled
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-end space-x-3">
                <Dialog.Close asChild>
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button 
                  onClick={handleSaveRule}
                  disabled={!currentRule?.name || !currentRule?.pattern}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Rule
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Template Modal */}
      <Dialog.Root open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div 
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    {currentTemplate?.id ? 'Edit Template' : 'Add Template'}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-400 hover:text-gray-500">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">
                      Template Name
                    </label>
                    <input
                      type="text"
                      id="template-name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm"
                      placeholder="HIPAA Compliance"
                      value={currentTemplate?.name || ''}
                      onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="template-description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="template-description"
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm"
                      placeholder="Redacts PHI including names, addresses, emails, and medical record numbers"
                      value={currentTemplate?.description || ''}
                      onChange={e => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Included Rules
                    </label>
                    <div className="border border-gray-300 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
                      {rules.map(rule => (
                        <div 
                          key={rule.id} 
                          className="flex items-center p-3 hover:bg-gray-50"
                        >
                          <input
                            id={`rule-${rule.id}`}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-chateau-green-600 focus:ring-chateau-green-500"
                            checked={currentTemplate?.rules?.includes(rule.id) || false}
                            onChange={e => {
                              if (e.target.checked) {
                                setCurrentTemplate(prev => ({
                                  ...prev,
                                  rules: [...(prev.rules || []), rule.id]
                                }));
                              } else {
                                setCurrentTemplate(prev => ({
                                  ...prev,
                                  rules: prev.rules.filter(r => r !== rule.id)
                                }));
                              }
                            }}
                          />
                          <label htmlFor={`rule-${rule.id}`} className="ml-3 block text-sm text-gray-900">
                            <span className="font-medium">{rule.name}</span>
                            {!rule.enabled && (
                              <span className="ml-2 text-xs text-red-500">(disabled)</span>
                            )}
                          </label>
                        </div>
                      ))}
                      {rules.length === 0 && (
                        <p className="p-3 text-sm text-gray-500">
                          No rules available. Create rules first.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="template-default"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-chateau-green-600 focus:ring-chateau-green-500"
                      checked={currentTemplate?.isDefault || false}
                      onChange={e => setCurrentTemplate(prev => ({ ...prev, isDefault: e.target.checked }))}
                    />
                    <label htmlFor="template-default" className="ml-2 block text-sm text-gray-900">
                      Set as default template
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-end space-x-3">
                <Dialog.Close asChild>
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button 
                  onClick={handleSaveTemplate}
                  disabled={!currentTemplate?.name || !(currentTemplate?.rules?.length > 0)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div 
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden z-50"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-center text-gray-500">
                  {deleteTarget.type === 'rule' 
                    ? "Are you sure you want to delete this rule? This action cannot be undone and will remove this rule from any templates using it."
                    : "Are you sure you want to delete this template? This action cannot be undone."}
                </p>
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-end space-x-3">
                <Dialog.Close asChild>
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button 
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
} 