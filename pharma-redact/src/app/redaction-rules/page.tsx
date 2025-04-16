"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
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
  addTemplate as addLocalTemplate,
  updateTemplate as updateLocalTemplate,
  deleteTemplate as deleteLocalTemplate,
  selectTemplate,
  createTemplate,
  updateTemplateAsync,
  deleteTemplateAsync,
  fetchUserTemplates
} from "@/store/slices/redactionSlice";
import { RedactionTemplate, RedactionCategory } from "@/types/redaction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { AppDispatch } from "@/store";

export default function RedactionRulesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { rules, templates, isLoadingTemplates } = useSelector((state: RootState) => state.redaction as {
    rules: RedactionRule[];
    templates: RedactionTemplate[];
    items: any[];
    isProcessing: boolean;
    processingProgress: number;
    error: string | null;
    selectedRuleId: string | null;
    selectedTemplateId: string | null;
    isLoadingTemplates: boolean;
  });
  const [activeTab, setActiveTab] = useState<string>("rules");
  
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
  const [newTemplate, setNewTemplate] = useState<Omit<RedactionTemplate, 'id'>>({
    name: '',
    description: '',
    categories: [],
  });
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

  // Animation variants
  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  // Fetch templates on component mount
  useEffect(() => {
    dispatch(fetchUserTemplates());
  }, [dispatch]);

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
    // Convert selected rules to categories
    const categories: RedactionCategory[] = selectedRules.map(ruleId => {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return null;
      
      return {
        type: rule.type.toUpperCase(),
        patterns: [rule.pattern],
        contexts: ['document', 'form']
      };
    }).filter(Boolean) as RedactionCategory[];
    
    // Create template using API thunk
    dispatch(createTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      categories
    }));
    
    setNewTemplate({
      name: '',
      description: '',
      categories: [],
    });
    setSelectedRules([]);
    setIsCreateTemplateModalOpen(false);
  };

  const handleEditTemplate = () => {
    if (currentTemplate) {
      // Convert selected rules to categories
      const categories: RedactionCategory[] = selectedRules.map(ruleId => {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return null;
        
        return {
          type: rule.type.toUpperCase(),
          patterns: [rule.pattern],
          contexts: ['document', 'form']
        };
      }).filter(Boolean) as RedactionCategory[];
      
      // Update template using API thunk
      dispatch(updateTemplateAsync({
        id: currentTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        categories
      }));
      
      setCurrentTemplate(null);
      setNewTemplate({
        name: '',
        description: '',
        categories: [],
      });
      setSelectedRules([]);
      setIsEditTemplateModalOpen(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      // Delete template using API thunk
      dispatch(deleteTemplateAsync(templateId));
    }
  };

  const handleEditTemplateClick = (template: RedactionTemplate) => {
    setCurrentTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      categories: template.categories,
    });
    
    // Try to map categories back to rule IDs
    const selectedRuleIds: string[] = [];
    template.categories.forEach(category => {
      if (category.patterns && category.patterns.length > 0) {
        const pattern = category.patterns[0];
        const rule = rules.find(r => r.pattern === pattern);
        if (rule) {
          selectedRuleIds.push(rule.id);
        }
      }
    });
    
    setSelectedRules(selectedRuleIds);
    setIsEditTemplateModalOpen(true);
  };

  const toggleRuleSelection = (ruleId: string) => {
    setSelectedRules(prevSelected => 
      prevSelected.includes(ruleId)
        ? prevSelected.filter(id => id !== ruleId)
        : [...prevSelected, ruleId]
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Redaction Settings</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Create rules and templates for automatic document redaction
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="rules" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules">Redaction Rules</TabsTrigger>
              <TabsTrigger value="templates">Redaction Templates</TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
              >
                {/* Rules Tab */}
                <TabsContent value="rules" className="pt-6">
                  <div className="flex justify-end mb-6">
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-chateau-green-600 hover:bg-chateau-green-700"
                    >
                      Create New Rule
                    </Button>
                  </div>
                  
                  {/* Rule Types */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRule('')}
                      className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                    >
                      <span className="text-lg font-medium text-gray-900 dark:text-white">All Rules</span>
                      <div className="text-3xl font-bold text-chateau-green-600 mt-2">{rules.length}</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRule('name')}
                      className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                    >
                      <span className="text-lg font-medium text-gray-900 dark:text-white">Personal Names</span>
                      <div className="text-3xl font-bold text-blue-600 mt-2">
                        {rules.filter((rule: RedactionRule) => rule.type === 'name').length}
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRule('site')}
                      className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                    >
                      <span className="text-lg font-medium text-gray-900 dark:text-white">Site Names</span>
                      <div className="text-3xl font-bold text-pink-600 mt-2">
                        {rules.filter((rule: RedactionRule) => rule.type === 'site').length}
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRule('custom')}
                      className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
                    >
                      <span className="text-lg font-medium text-gray-900 dark:text-white">Custom Rules</span>
                      <div className="text-3xl font-bold text-chateau-green-600 mt-2">
                        {rules.filter((rule: RedactionRule) => rule.type === 'custom').length}
                      </div>
                    </motion.div>
                  </div>

                  {/* Rules List */}
                  <div className="space-y-4">
                    {rules.length > 0 ? (
                      rules.map((rule: RedactionRule) => (
                        <motion.div
                          key={rule.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <RuleCard
                            rule={rule}
                            onToggle={() => handleToggleRule(rule.id)}
                            onEdit={() => handleEditClick(rule)}
                            onDelete={() => handleDeleteRule(rule.id)}
                          />
                        </motion.div>
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
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="pt-6">
                  <div className="flex justify-end mb-6">
                    <Button 
                      onClick={() => setIsCreateTemplateModalOpen(true)}
                      className="bg-chateau-green-600 hover:bg-chateau-green-700"
                    >
                      Create New Template
                    </Button>
                  </div>
                  
                  {/* Templates List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.length > 0 ? (
                      templates.map((template: RedactionTemplate) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                          className="h-full"
                        >
                          <Card className="h-full flex flex-col">
                            <CardHeader>
                              <CardTitle>{template.name}</CardTitle>
                              <CardDescription>{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <div className="flex flex-wrap gap-2 mb-4">
                                {template.categories.map((category, index) => (
                                  <Badge key={index} variant="secondary">
                                    {category.type}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">{template.categories.length}</span> rule{template.categories.length !== 1 ? 's' : ''} included
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                              <Button 
                                variant="outline" 
                                onClick={() => handleEditTemplateClick(template)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-gray-100 p-4 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-500">
                            <path d="M9 11h6" />
                            <path d="M12 8v6" />
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No redaction templates found</h3>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md">
                          Create your first redaction template to combine multiple rules for document processing.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>

      {/* Create Rule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Rule</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={newRule.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <Label htmlFor="rule-type">Rule Type</Label>
                <select
                  id="rule-type"
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
                <Label htmlFor="rule-pattern">Pattern (Regex)</Label>
                <Input
                  id="rule-pattern"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  placeholder="Enter regex pattern"
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  placeholder="Enter rule description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRule}
                className="bg-chateau-green-600 hover:bg-chateau-green-700"
              >
                Create Rule
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Rule</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-rule-name">Rule Name</Label>
                <Input
                  id="edit-rule-name"
                  value={newRule.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-rule-type">Rule Type</Label>
                <select
                  id="edit-rule-type"
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
                <Label htmlFor="edit-rule-pattern">Pattern (Regex)</Label>
                <Input
                  id="edit-rule-pattern"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  placeholder="Enter regex pattern"
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-rule-description">Description</Label>
                <Textarea
                  id="edit-rule-description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  placeholder="Enter rule description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditRule}
                className="bg-chateau-green-600 hover:bg-chateau-green-700"
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Template Modal */}
      {isCreateTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Template</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTemplate({...newTemplate, description: e.target.value})}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Select Rules</h3>
                <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {rules.length > 0 ? (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className={cn(
                            "flex items-center p-3 rounded-md cursor-pointer transition-colors",
                            selectedRules.includes(rule.id)
                              ? "bg-chateau-green-50 border border-chateau-green-200"
                              : "bg-white hover:bg-gray-50 border border-gray-200"
                          )}
                          onClick={() => toggleRuleSelection(rule.id)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{rule.name}</h4>
                            <p className="text-sm text-gray-600">{rule.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{rule.type}</Badge>
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border",
                              selectedRules.includes(rule.id) 
                                ? "bg-chateau-green-600 border-chateau-green-600" 
                                : "border-gray-300"
                            )}>
                              {selectedRules.includes(rule.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-white">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No rules available. Create rules first.
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{selectedRules.length}</span> rule{selectedRules.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateTemplateModalOpen(false);
                  setSelectedRules([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                className="bg-chateau-green-600 hover:bg-chateau-green-700"
                disabled={!newTemplate.name || selectedRules.length === 0}
              >
                Create Template
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Template Modal */}
      {isEditTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Template</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input
                  id="edit-template-name"
                  value={newTemplate.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-template-description">Description</Label>
                <Textarea
                  id="edit-template-description"
                  value={newTemplate.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTemplate({...newTemplate, description: e.target.value})}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Select Rules</h3>
                <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {rules.length > 0 ? (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className={cn(
                            "flex items-center p-3 rounded-md cursor-pointer transition-colors",
                            selectedRules.includes(rule.id)
                              ? "bg-chateau-green-50 border border-chateau-green-200"
                              : "bg-white hover:bg-gray-50 border border-gray-200"
                          )}
                          onClick={() => toggleRuleSelection(rule.id)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{rule.name}</h4>
                            <p className="text-sm text-gray-600">{rule.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{rule.type}</Badge>
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border",
                              selectedRules.includes(rule.id) 
                                ? "bg-chateau-green-600 border-chateau-green-600" 
                                : "border-gray-300"
                            )}>
                              {selectedRules.includes(rule.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-white">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No rules available. Create rules first.
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{selectedRules.length}</span> rule{selectedRules.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditTemplateModalOpen(false);
                  setSelectedRules([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditTemplate}
                className="bg-chateau-green-600 hover:bg-chateau-green-700"
                disabled={!newTemplate.name || selectedRules.length === 0}
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
} 