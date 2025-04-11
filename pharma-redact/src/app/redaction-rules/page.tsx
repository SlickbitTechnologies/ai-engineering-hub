"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MainLayout } from "@/components/layout/main-layout";
import { RuleCard } from "@/components/ui/rule-card";
import { RootState } from "@/store";
import {
  RedactionRule,
  addRule,
  updateRule,
  toggleRuleActive,
  deleteRule,
  selectRule,
} from "@/store/slices/redactionSlice";

export default function RedactionRulesPage() {
  const dispatch = useDispatch();
  const { rules } = useSelector((state: RootState) => state.redaction as {
    rules: RedactionRule[];
    items: any[];
    isProcessing: boolean;
    processingProgress: number;
    error: string | null;
    selectedRuleId: string | null;
  });
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Redaction Rules</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage rules for automatic document redaction
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-chateau-green-600 text-white font-medium hover:bg-chateau-green-700 transition-colors md:w-auto w-full"
            >
              Create New Rule
            </button>
          </div>

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
        </div>
      </div>

      {/* Create Rule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
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
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Rule Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
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
    </MainLayout>
  );
} 