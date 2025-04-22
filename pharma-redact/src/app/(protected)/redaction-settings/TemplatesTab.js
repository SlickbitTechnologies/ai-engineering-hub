"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Copy, Info, List, FileText, Check, X } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { 
  createTemplate, 
  getUserTemplates, 
  updateTemplate, 
  deleteTemplate,
  getUserRedactionRules
} from "../../lib/firebase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { CheckboxItem, CheckboxIndicator } from "../../../components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Badge } from "../../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../../../components/ui/tooltip";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const TemplatesTab = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ruleIds: []
  });

  // Fetch user's templates and rules
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedTemplates, fetchedRules] = await Promise.all([
        getUserTemplates(user.uid),
        getUserRedactionRules(user.uid)
      ]);
      setTemplates(fetchedTemplates);
      setRules(fetchedRules);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load your templates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRuleToggle = (ruleId) => {
    setFormData(prev => {
      const newRuleIds = prev.ruleIds.includes(ruleId)
        ? prev.ruleIds.filter(id => id !== ruleId)
        : [...prev.ruleIds, ruleId];
      return { ...prev, ruleIds: newRuleIds };
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      ruleIds: []
    });
    setCurrentTemplate(null);
  };

  const handleAddTemplate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await createTemplate(user.uid, formData);
      fetchData();
      setIsAddDialogOpen(false);
      resetForm();
      showSuccessMessage("Template created successfully");
    } catch (err) {
      console.error("Error creating template:", err);
      setError("Failed to create template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      ruleIds: template.ruleIds || []
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTemplate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!currentTemplate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateTemplate(currentTemplate.id, formData);
      fetchData();
      setIsEditDialogOpen(false);
      resetForm();
      showSuccessMessage("Template updated successfully");
    } catch (err) {
      console.error("Error updating template:", err);
      setError("Failed to update template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (template) => {
    setCurrentTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteTemplate(currentTemplate.id, user.uid);
      fetchData();
      setIsDeleteDialogOpen(false);
      showSuccessMessage("Template deleted successfully");
    } catch (err) {
      console.error("Error deleting template:", err);
      setError("Failed to delete template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTemplateRules = (template) => {
    return rules.filter(rule => template.ruleIds?.includes(rule.id)) || [];
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Template name is required";
    if (formData.ruleIds.length === 0) return "Please select at least one rule";
    return null;
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const getTemplateRulesInfo = (template) => {
    const templateRules = getTemplateRules(template);
    
    const phiCount = templateRules.filter(rule => rule.category === "PHI").length;
    const piiCount = templateRules.filter(rule => rule.category === "PII").length;
    const customCount = templateRules.filter(rule => rule.category !== "PHI" && rule.category !== "PII").length;
    
    return { phiCount, piiCount, customCount, totalCount: templateRules.length };
  };

  const templateVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 border-r-2 rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Redaction Templates</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Template</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., HIPAA Compliance Template"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Explain what this template is for"
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-2 block">Select Rules</Label>
                {rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You haven't created any rules yet. Create rules first to add them to a template.
                  </p>
                ) : (
                  <ScrollArea className="h-60 border rounded-md p-4">
                    <div className="space-y-2">
                      {rules.map((rule) => (
                        <div key={rule.id} className="flex items-start gap-2 pb-2 border-b">
                          <div className="flex h-4 items-center">
                            <CheckboxItem
                              checked={formData.ruleIds.includes(rule.id)}
                              onCheckedChange={() => handleRuleToggle(rule.id)}
                              id={`rule-${rule.id}`}
                            >
                              <CheckboxIndicator />
                            </CheckboxItem>
                          </div>
                          <div className="grid gap-1 leading-none">
                            <Label
                              htmlFor={`rule-${rule.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {rule.name}
                            </Label>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {rule.pattern}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleAddTemplate}
                disabled={formData.name.trim() === "" || formData.ruleIds.length === 0}
              >
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200 text-green-800">
          <AlertDescription className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          </AlertDescription>
        </Alert>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground mb-4">You don't have any templates yet</p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddDialogOpen(true)}
            className="mx-auto"
            disabled={rules.length === 0}
          >
            {rules.length === 0 ? "Create rules first" : "Create your first template"}
          </Button>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {templates.map((template) => {
              const templateRules = getTemplateRules(template);
              return (
                <motion.div
                  key={template.id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {templateRules.length} {templateRules.length === 1 ? 'rule' : 'rules'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {templateRules.slice(0, 3).map(rule => (
                          <Badge key={rule.id} variant="outline" className="text-xs">
                            {rule.name}
                          </Badge>
                        ))}
                        {templateRules.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{templateRules.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="text-xs flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>Updated {new Date(template.updatedAt || template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div>
              <Label className="mb-2 block">Select Rules</Label>
              <ScrollArea className="h-60 border rounded-md p-4">
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-start gap-2 pb-2 border-b">
                      <div className="flex h-4 items-center">
                        <CheckboxItem
                          checked={formData.ruleIds.includes(rule.id)}
                          onCheckedChange={() => handleRuleToggle(rule.id)}
                          id={`edit-rule-${rule.id}`}
                        >
                          <CheckboxIndicator />
                        </CheckboxItem>
                      </div>
                      <div className="grid gap-1 leading-none">
                        <Label
                          htmlFor={`edit-rule-${rule.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {rule.name}
                        </Label>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {rule.pattern}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateTemplate}
              disabled={formData.name.trim() === "" || formData.ruleIds.length === 0}
            >
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to delete the template "{currentTemplate?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>Delete Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesTab; 