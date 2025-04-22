"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Label } from "../../../../components/ui/label";
import { Badge } from "../../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Card, CardContent, CardFooter } from "../../../../components/ui/card";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../../components/ui/tooltip";
import {
  getUserTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getUserRules
} from "../../../lib/firebase";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Template categories
const CATEGORIES = [
  { value: "medical", label: "Medical" },
  { value: "financial", label: "Financial" },
  { value: "legal", label: "Legal" },
  { value: "correspondence", label: "Correspondence" },
  { value: "custom", label: "Custom" }
];

export default function TemplatesTab({ userId }) {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableRules, setAvailableRules] = useState([]);
  
  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    category: "medical",
    selectedRules: []
  });

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = templates.filter(
        template =>
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query)
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both templates and rules (for rule selection)
      const [userTemplates, userRules] = await Promise.all([
        getUserTemplates(userId),
        getUserRules(userId)
      ]);
      
      setTemplates(userTemplates);
      setFilteredTemplates(userTemplates);
      setAvailableRules(userRules.filter(rule => rule.isActive));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load templates and rules. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleRuleToggle = (ruleId) => {
    setFormData(prev => {
      const selectedRules = [...prev.selectedRules];
      
      if (selectedRules.includes(ruleId)) {
        // Remove rule if already selected
        const index = selectedRules.indexOf(ruleId);
        selectedRules.splice(index, 1);
      } else {
        // Add rule if not selected
        selectedRules.push(ruleId);
      }
      
      return {
        ...prev,
        selectedRules
      };
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.content.trim()) {
      errors.content = "Content is required";
    }
    
    if (!formData.category) {
      errors.category = "Category is required";
    }
    
    if (formData.selectedRules.length === 0) {
      errors.selectedRules = "At least one rule must be selected";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      content: "",
      category: "medical",
      selectedRules: []
    });
    setFormErrors({});
    setSubmitSuccess(false);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      category: template.category,
      selectedRules: template.rules || []
    });
    setFormErrors({});
    setSubmitSuccess(false);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (template) => {
    setCurrentTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newTemplate = {
        ...formData,
        userId,
        createdAt: new Date()
      };
      
      await createTemplate(newTemplate);
      await fetchData();
      setSubmitSuccess(true);
      
      // Close dialog after showing success message
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        setSubmitSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error("Error creating template:", err);
      setError("Failed to create template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedTemplate = {
        ...currentTemplate,
        ...formData,
        updatedAt: new Date()
      };
      
      await updateTemplate(currentTemplate.id, updatedTemplate);
      await fetchData();
      setSubmitSuccess(true);
      
      // Close dialog after showing success message
      setTimeout(() => {
        setIsEditDialogOpen(false);
        setSubmitSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error("Error updating template:", err);
      setError("Failed to update template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await deleteTemplate(currentTemplate.id);
      await fetchData();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting template:", err);
      setError("Failed to delete template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        userId,
        createdAt: new Date()
      };
      
      // Remove id to create a new document
      delete duplicatedTemplate.id;
      
      await createTemplate(duplicatedTemplate);
      await fetchData();
    } catch (err) {
      console.error("Error duplicating template:", err);
      setError("Failed to duplicate template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        
        <Button onClick={openCreateDialog} className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" /> Add Template
        </Button>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/30">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? "No templates match your search criteria. Try a different search or clear the filter."
              : "You don't have any document templates yet. Create your first template to get started."}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          ) : (
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Create First Template
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredTemplates.map((template) => (
            <motion.div key={template.id} variants={itemVariants}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg truncate" title={template.name}>
                      {template.name}
                    </h3>
                    <Badge variant="secondary">
                      {getCategoryLabel(template.category)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2" title={template.description}>
                    {template.description || "No description provided"}
                  </p>
                  
                  <div className="mb-4">
                    <Label className="text-xs text-muted-foreground mb-1 block">Content Preview</Label>
                    <div className="bg-muted p-2 rounded text-sm h-20 overflow-hidden relative">
                      <p className="line-clamp-3">{template.content}</p>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent"></div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Rules Applied</Label>
                    <div className="flex flex-wrap gap-1">
                      {template.rules && template.rules.length > 0 ? (
                        template.rules.slice(0, 3).map((ruleId, index) => {
                          const rule = availableRules.find(r => r.id === ruleId);
                          return (
                            <Badge key={ruleId} variant="outline" className="text-xs">
                              {rule ? rule.name : "Unknown Rule"}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">No rules selected</span>
                      )}
                      {template.rules && template.rules.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.rules.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end space-x-2 pt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(template)}
                          disabled={isSubmitting}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Duplicate</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Document Template</DialogTitle>
            <DialogDescription>
              Create a new document template with redaction rules to automatically process documents.
            </DialogDescription>
          </DialogHeader>
          
          {submitSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Template Created Successfully</h3>
              <p className="text-muted-foreground">Your new document template has been added.</p>
            </div>
          ) : (
            <ScrollArea className="pr-4 max-h-[60vh]">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Template name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Describe the purpose of this template"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${
                      formErrors.category ? "border-destructive" : "border-input"
                    } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-sm text-destructive">{formErrors.category}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Template Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Enter the template content here..."
                    value={formData.content}
                    onChange={handleInputChange}
                    className={`min-h-[150px] ${formErrors.content ? "border-destructive" : ""}`}
                  />
                  {formErrors.content && (
                    <p className="text-sm text-destructive">{formErrors.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This is the base content that will be used for document generation.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Redaction Rules</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.selectedRules.length} selected
                    </span>
                  </div>
                  
                  {availableRules.length === 0 ? (
                    <div className="bg-muted p-4 rounded text-center">
                      <p className="text-sm text-muted-foreground">
                        No redaction rules available. Please create rules first.
                      </p>
                      <Button 
                        variant="link" 
                        className="mt-2 p-0 h-auto"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          // Navigate to rules tab would go here in a real implementation
                        }}
                      >
                        Go to Rules Tab
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y">
                      {availableRules.map((rule) => (
                        <div key={rule.id} className="p-2 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`rule-${rule.id}`}
                            checked={formData.selectedRules.includes(rule.id)}
                            onChange={() => handleRuleToggle(rule.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`rule-${rule.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {rule.name}
                            </label>
                            <p className="text-xs text-muted-foreground truncate">
                              {rule.description || "No description"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {rule.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formErrors.selectedRules && (
                    <p className="text-sm text-destructive">{formErrors.selectedRules}</p>
                  )}
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting || submitSuccess || availableRules.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Document Template</DialogTitle>
            <DialogDescription>
              Update your document template and its redaction rules.
            </DialogDescription>
          </DialogHeader>
          
          {submitSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Template Updated Successfully</h3>
              <p className="text-muted-foreground">Your document template has been updated.</p>
            </div>
          ) : (
            <ScrollArea className="pr-4 max-h-[60vh]">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    placeholder="Template name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    placeholder="Describe the purpose of this template"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select
                    id="edit-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${
                      formErrors.category ? "border-destructive" : "border-input"
                    } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-sm text-destructive">{formErrors.category}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-content">Template Content</Label>
                  <Textarea
                    id="edit-content"
                    name="content"
                    placeholder="Enter the template content here..."
                    value={formData.content}
                    onChange={handleInputChange}
                    className={`min-h-[150px] ${formErrors.content ? "border-destructive" : ""}`}
                  />
                  {formErrors.content && (
                    <p className="text-sm text-destructive">{formErrors.content}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Redaction Rules</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.selectedRules.length} selected
                    </span>
                  </div>
                  
                  {availableRules.length === 0 ? (
                    <div className="bg-muted p-4 rounded text-center">
                      <p className="text-sm text-muted-foreground">
                        No redaction rules available. Please create rules first.
                      </p>
                      <Button 
                        variant="link" 
                        className="mt-2 p-0 h-auto"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          // Navigate to rules tab would go here in a real implementation
                        }}
                      >
                        Go to Rules Tab
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y">
                      {availableRules.map((rule) => (
                        <div key={rule.id} className="p-2 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-rule-${rule.id}`}
                            checked={formData.selectedRules.includes(rule.id)}
                            onChange={() => handleRuleToggle(rule.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`edit-rule-${rule.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {rule.name}
                            </label>
                            <p className="text-xs text-muted-foreground truncate">
                              {rule.description || "No description"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {rule.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formErrors.selectedRules && (
                    <p className="text-sm text-destructive">{formErrors.selectedRules}</p>
                  )}
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isSubmitting || submitSuccess || availableRules.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentTemplate && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-md mb-4">
                <h4 className="font-medium">{currentTemplate.name}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {currentTemplate.description || "No description provided"}
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function
function getCategoryLabel(categoryValue) {
  const category = CATEGORIES.find(c => c.value === categoryValue);
  return category ? category.label : categoryValue;
} 