"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MainLayout } from "@/components/layout/main-layout";
import { RuleCard } from "@/components/ui/rule-card";
import { RootState } from "@/store";
import {
  RedactionRule,
  RedactionTemplate,
  addRule,
  updateRule,
  toggleRuleActive,
  deleteRule,
  selectRule,
  addTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/store/slices/redactionSlice";

export default function RedactionRulesPage() {
  const dispatch = useDispatch();
  const { rules, templates } = useSelector((state: RootState) => state.redaction as {
    rules: RedactionRule[];
    templates: RedactionTemplate[];
    items: any[];
    isProcessing: boolean;
    processingProgress: number;
    error: string | null;
    selectedRuleId: string | null;
  });
  
  // State for view mode (rules or templates)
  const [activeTab, setActiveTab] = useState<'rules' | 'templates'>('rules');
  
  // Rules state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<RedactionRule | null>(null);
  const [newRule, setNewRule] = useState<Omit<RedactionRule, 'id' | 'createdAt' | 'isSystem'>>({
    name: '',
    pattern: '',
    description: '',
    type: 'custom',
    isActive: true,
  });

  // Templates state
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<RedactionTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Omit<RedactionTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    ruleIds: []
  });

  // Rules functions
  const handleCreateRule = () => {
    dispatch(addRule(newRule));
    setNewRule({
      name: '',
      pattern: '',
      description: '',
      type: 'custom',
      isActive: true,
    });
    setIsCreateModalOpen(false);
  };

  const handleEditRule = () => {
    if (currentRule) {
      dispatch(updateRule({
        id: currentRule.id,
        ...newRule,
      }));
      setCurrentRule(null);
      setIsEditModalOpen(false);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    dispatch(toggleRuleActive(ruleId));
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      dispatch(deleteRule(ruleId));
    }
  };

  const handleEditClick = (rule: RedactionRule) => {
    setCurrentRule(rule);
    setNewRule({
      name: rule.name,
      pattern: rule.pattern,
      description: rule.description,
      type: rule.type,
      isActive: rule.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSelectRule = (ruleId: string) => {
    dispatch(selectRule(ruleId));
  };

  // Template functions
  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.ruleIds.length > 0) {
      dispatch(addTemplate(newTemplate));
      setNewTemplate({
        name: '',
        description: '',
        ruleIds: []
      });
      setIsCreateTemplateModalOpen(false);
    }
  };

  const handleEditTemplate = () => {
    if (currentTemplate) {
      dispatch(updateTemplate({
        id: currentTemplate.id,
        ...newTemplate,
      }));
      setCurrentTemplate(null);
      setIsEditTemplateModalOpen(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      dispatch(deleteTemplate(templateId));
    }
  };

  const handleEditTemplateClick = (template: RedactionTemplate) => {
    setCurrentTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      ruleIds: [...template.ruleIds],
    });
    setIsEditTemplateModalOpen(true);
  };

  const toggleRuleInTemplate = (ruleId: string) => {
    if (newTemplate.ruleIds.includes(ruleId)) {
      setNewTemplate({
        ...newTemplate,
        ruleIds: newTemplate.ruleIds.filter(id => id !== ruleId)
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        ruleIds: [...newTemplate.ruleIds, ruleId]
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Redaction Rules</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage rules and templates for automatic document redaction
              </p>
            </div>
            {activeTab === 'rules' ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 transition-colors md:w-auto w-full"
              >
                Create New Rule
              </button>
            ) : (
              <button
                onClick={() => setIsCreateTemplateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 transition-colors md:w-auto w-full"
              >
                Create New Template
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'rules'
                  ? 'text-chateau-green-600 border-b-2 border-chateau-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rules
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'templates'
                  ? 'text-chateau-green-600 border-b-2 border-chateau-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Templates
            </button>
          </div>

          {activeTab === 'rules' ? (
            <>
              {/* Rule Types */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  onClick={() => handleSelectRule('')}
                  className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">All Rules</span>
                  <div className="text-3xl font-bold text-chateau-green-600 mt-2">{rules.length}</div>
                </div>
                <div
                  onClick={() => handleSelectRule('name')}
                  className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Personal Names</span>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    {rules.filter((rule: RedactionRule) => rule.type === 'name').length}
                  </div>
                </div>
                <div
                  onClick={() => handleSelectRule('site')}
                  className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Site Names</span>
                  <div className="text-3xl font-bold text-pink-600 mt-2">
                    {rules.filter((rule: RedactionRule) => rule.type === 'site').length}
                  </div>
                </div>
                <div
                  onClick={() => handleSelectRule('custom')}
                  className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Custom Rules</span>
                  <div className="text-3xl font-bold text-chateau-green-600 mt-2">
                    {rules.filter((rule: RedactionRule) => rule.type === 'custom').length}
                  </div>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-4">
                {rules.length > 0 ? (
                  rules.map((rule: RedactionRule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      onToggle={() => handleToggleRule(rule.id)}
                      onEdit={() => handleEditClick(rule)}
                      onDelete={() => handleDeleteRule(rule.id)}
                    />
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 shadow-sm text-center">
                    <p className="text-gray-600 dark:text-gray-400">No rules found. Create your first rule to get started.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Templates List */}
              <div className="space-y-4">
                {templates.length > 0 ? (
                  templates.map((template: RedactionTemplate) => (
                    <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-xl font-medium text-gray-900 dark:text-white">{template.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 mb-1">Included Rules ({template.ruleIds.length})</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {template.ruleIds.map(ruleId => {
                                const rule = rules.find(r => r.id === ruleId);
                                return rule ? (
                                  <span 
                                    key={rule.id} 
                                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-opacity-20 ${
                                      rule.type === 'name' ? 'bg-blue-100 text-blue-800' :
                                      rule.type === 'email' ? 'bg-purple-100 text-purple-800' :
                                      rule.type === 'site' ? 'bg-pink-100 text-pink-800' :
                                      rule.type === 'address' ? 'bg-yellow-100 text-yellow-800' :
                                      rule.type === 'phone' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {rule.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4 md:mt-0">
                          <button
                            onClick={() => handleEditTemplateClick(template)}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded focus:outline-none focus:ring-2 focus:ring-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 shadow-sm text-center">
                    <p className="text-gray-600 dark:text-gray-400">No templates found. Create your first template to get started.</p>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Create Rule Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Rule</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter rule name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rule Type
                    </label>
                    <select
                      value={newRule.type}
                      onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="name">Personal Name</option>
                      <option value="address">Address</option>
                      <option value="phone">Phone Number</option>
                      <option value="email">Email</option>
                      <option value="site">Site Name</option>
                      <option value="investigator">Investigator</option>
                      <option value="confidential">Confidential</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={newRule.pattern}
                      onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 font-mono"
                      placeholder="Enter regex pattern"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newRule.description}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter rule description"
                      rows={3}
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRule}
                    className="px-4 py-2 bg-chateau-green-600 text-white rounded-md hover:bg-chateau-green-700"
                    disabled={!newRule.name || !newRule.pattern}
                  >
                    Create Rule
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Edit Rule Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Rule</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter rule name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rule Type
                    </label>
                    <select
                      value={newRule.type}
                      onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="name">Personal Name</option>
                      <option value="address">Address</option>
                      <option value="phone">Phone Number</option>
                      <option value="email">Email</option>
                      <option value="site">Site Name</option>
                      <option value="investigator">Investigator</option>
                      <option value="confidential">Confidential</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={newRule.pattern}
                      onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 font-mono"
                      placeholder="Enter regex pattern"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newRule.description}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter rule description"
                      rows={3}
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditRule}
                    className="px-4 py-2 bg-chateau-green-600 text-white rounded-md hover:bg-chateau-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Template Modal */}
          {isCreateTemplateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Template</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter template description"
                      rows={3}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Rules to Include
                    </label>
                    <div className="border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto">
                      {rules.map(rule => (
                        <div key={rule.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded mb-1">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTemplate.ruleIds.includes(rule.id)}
                              onChange={() => toggleRuleInTemplate(rule.id)}
                              className="h-4 w-4 text-chateau-green-600 focus:ring-chateau-green-500 border-gray-300 rounded"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{rule.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{rule.description}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    {newTemplate.ruleIds.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">Please select at least one rule</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateTemplateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 bg-chateau-green-600 text-white rounded-md hover:bg-chateau-green-700"
                    disabled={!newTemplate.name || newTemplate.ruleIds.length === 0}
                  >
                    Create Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Template Modal */}
          {isEditTemplateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Template</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter template description"
                      rows={3}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Rules to Include
                    </label>
                    <div className="border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto">
                      {rules.map(rule => (
                        <div key={rule.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded mb-1">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTemplate.ruleIds.includes(rule.id)}
                              onChange={() => toggleRuleInTemplate(rule.id)}
                              className="h-4 w-4 text-chateau-green-600 focus:ring-chateau-green-500 border-gray-300 rounded"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{rule.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{rule.description}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    {newTemplate.ruleIds.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">Please select at least one rule</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditTemplateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditTemplate}
                    className="px-4 py-2 bg-chateau-green-600 text-white rounded-md hover:bg-chateau-green-700"
                    disabled={!newTemplate.name || newTemplate.ruleIds.length === 0}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 