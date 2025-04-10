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
  setDefaultTemplate,
  addRuleToTemplate,
  removeRuleFromTemplate,
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
  
  // Rule state
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
  
  // Template state
  const [isTemplateTabActive, setIsTemplateTabActive] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<RedactionTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Omit<RedactionTemplate, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    ruleIds: [],
    isDefault: false,
  });

  // Rule handlers
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
  
  // Template handlers
  const handleCreateTemplate = () => {
    dispatch(addTemplate(newTemplate));
    setNewTemplate({
      name: '',
      description: '',
      ruleIds: [],
      isDefault: false,
    });
    setIsTemplateModalOpen(false);
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
      isDefault: template.isDefault,
    });
    setIsEditTemplateModalOpen(true);
  };
  
  const handleSetDefaultTemplate = (templateId: string) => {
    dispatch(setDefaultTemplate(templateId));
  };
  
  const handleToggleRuleInTemplate = (templateId: string, ruleId: string, isAdding: boolean) => {
    if (isAdding) {
      dispatch(addRuleToTemplate({ templateId, ruleId }));
    } else {
      dispatch(removeRuleFromTemplate({ templateId, ruleId }));
    }
  };
  
  const getRulesByIds = (ruleIds: string[]) => {
    return rules.filter(rule => ruleIds.includes(rule.id));
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
                Manage rules and templates for document redaction
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={`px-4 py-2 rounded-lg ${!isTemplateTabActive ? 'bg-chateau-green-600 text-white hover:bg-chateau-green-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'} font-medium transition-colors md:w-auto w-full`}
              >
                Create New Rule
              </button>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className={`px-4 py-2 rounded-lg ${isTemplateTabActive ? 'bg-chateau-green-600 text-white hover:bg-chateau-green-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'} font-medium transition-colors md:w-auto w-full`}
              >
                Create New Template
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setIsTemplateTabActive(false)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  !isTemplateTabActive
                    ? 'border-chateau-green-500 text-chateau-green-600 dark:text-chateau-green-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Rules
              </button>
              <button
                onClick={() => setIsTemplateTabActive(true)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isTemplateTabActive
                    ? 'border-chateau-green-500 text-chateau-green-600 dark:text-chateau-green-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Templates
              </button>
            </nav>
          </div>

          {!isTemplateTabActive ? (
            <>
              {/* Rule Types */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-500">
                        <path d="M9 11h6" />
                        <path d="M12 8v6" />
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No redaction rules found</h3>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md">
                      Create your first redaction rule to start identifying sensitive information in your documents.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Templates List */
            <div className="space-y-6">
              {templates.length > 0 ? (
                templates.map((template: RedactionTemplate) => (
                  <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          {template.isDefault && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-chateau-green-100 text-chateau-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex flex-row gap-2">
                        {!template.isDefault && (
                          <>
                            <button
                              onClick={() => handleSetDefaultTemplate(template.id)}
                              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              Set as Default
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="px-3 py-1.5 rounded-md border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditTemplateClick(template)}
                          className="px-3 py-1.5 rounded-md bg-chateau-green-600 text-sm font-medium text-white hover:bg-chateau-green-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">INCLUDED RULES ({template.ruleIds.length})</h4>
                      <div className="space-y-3">
                        {getRulesByIds(template.ruleIds).length > 0 ? (
                          getRulesByIds(template.ruleIds).map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{rule.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{rule.type}</div>
                              </div>
                              {!template.isDefault && (
                                <button
                                  onClick={() => handleToggleRuleInTemplate(template.id, rule.id, false)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-center py-3">
                            No rules added to this template yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-500">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md">
                    Create your first template to group redaction rules for easy application to documents.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                className="px-4 py-2 bg-chateau-green-600 rounded-md text-white hover:bg-chateau-green-700"
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
                  disabled={currentRule?.isSystem}
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
                className="px-4 py-2 bg-chateau-green-600 rounded-md text-white hover:bg-chateau-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Template Modal */}
      {isTemplateModalOpen && (
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Rules
                </label>
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center p-3 border-b border-gray-200 last:border-b-0">
                      <input
                        type="checkbox"
                        id={`rule-${rule.id}`}
                        checked={newTemplate.ruleIds.includes(rule.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplate({
                              ...newTemplate,
                              ruleIds: [...newTemplate.ruleIds, rule.id]
                            });
                          } else {
                            setNewTemplate({
                              ...newTemplate,
                              ruleIds: newTemplate.ruleIds.filter(id => id !== rule.id)
                            });
                          }
                        }}
                        className="h-4 w-4 text-chateau-green-600 focus:ring-chateau-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`rule-${rule.id}`} className="ml-3 block">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                          {rule.type} • {rule.description.substring(0, 50)}{rule.description.length > 50 ? '...' : ''}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newTemplate.isDefault}
                  onChange={(e) => setNewTemplate({...newTemplate, isDefault: e.target.checked})}
                  className="h-4 w-4 text-chateau-green-600 focus:ring-chateau-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  Set as default template
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-chateau-green-600 rounded-md text-white hover:bg-chateau-green-700"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Rules
                </label>
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center p-3 border-b border-gray-200 last:border-b-0">
                      <input
                        type="checkbox"
                        id={`edit-rule-${rule.id}`}
                        checked={newTemplate.ruleIds.includes(rule.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplate({
                              ...newTemplate,
                              ruleIds: [...newTemplate.ruleIds, rule.id]
                            });
                          } else {
                            setNewTemplate({
                              ...newTemplate,
                              ruleIds: newTemplate.ruleIds.filter(id => id !== rule.id)
                            });
                          }
                        }}
                        className="h-4 w-4 text-chateau-green-600 focus:ring-chateau-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`edit-rule-${rule.id}`} className="ml-3 block">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                          {rule.type} • {rule.description.substring(0, 50)}{rule.description.length > 50 ? '...' : ''}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {!currentTemplate?.isDefault && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsDefault"
                    checked={newTemplate.isDefault}
                    onChange={(e) => setNewTemplate({...newTemplate, isDefault: e.target.checked})}
                    className="h-4 w-4 text-chateau-green-600 focus:ring-chateau-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsDefault" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                    Set as default template
                  </label>
                </div>
              )}
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
                className="px-4 py-2 bg-chateau-green-600 rounded-md text-white hover:bg-chateau-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 