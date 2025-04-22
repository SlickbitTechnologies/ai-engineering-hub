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
  Copy
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
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
  getUserRules,
  createRule,
  updateRule,
  deleteRule
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

// Rule categories
const CATEGORIES = [
  { value: "pharma", label: "Pharmaceutical" },
  { value: "pii", label: "Personal Identifiable Information" },
  { value: "financial", label: "Financial" },
  { value: "legal", label: "Legal" },
  { value: "custom", label: "Custom" }
];

// Severity levels
const SEVERITY_LEVELS = [
  { value: "high", label: "High", color: "destructive" },
  { value: "medium", label: "Medium", color: "amber" },
  { value: "low", label: "Low", color: "blue" }
];

export default function RulesTab({ userId }) {
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pattern: "",
    category: "pharma",
    severity: "medium",
    isActive: true
  });

  useEffect(() => {
    if (userId) {
      fetchRules();
    }
  }, [userId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRules(rules);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = rules.filter(
        rule =>
          rule.name.toLowerCase().includes(query) ||
          rule.description.toLowerCase().includes(query) ||
          rule.pattern.toLowerCase().includes(query) ||
          rule.category.toLowerCase().includes(query)
      );
      setFilteredRules(filtered);
    }
  }, [searchQuery, rules]);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userRules = await getUserRules(userId);
      setRules(userRules);
      setFilteredRules(userRules);
    } catch (err) {
      console.error("Error fetching rules:", err);
      setError("Failed to load redaction rules. Please try again later.");
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

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.pattern.trim()) {
      errors.pattern = "Pattern is required";
    } else {
      // Check if pattern is a valid regex
      try {
        new RegExp(formData.pattern);
      } catch (e) {
        errors.pattern = "Invalid regular expression";
      }
    }
    
    if (!formData.category) {
      errors.category = "Category is required";
    }
    
    if (!formData.severity) {
      errors.severity = "Severity is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      pattern: "",
      category: "pharma",
      severity: "medium",
      isActive: true
    });
    setFormErrors({});
    setSubmitSuccess(false);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setCurrentRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      pattern: rule.pattern,
      category: rule.category,
      severity: rule.severity,
      isActive: rule.isActive
    });
    setFormErrors({});
    setSubmitSuccess(false);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (rule) => {
    setCurrentRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newRule = {
        ...formData,
        userId,
        createdAt: new Date()
      };
      
      await createRule(newRule);
      await fetchRules();
      setSubmitSuccess(true);
      
      // Close dialog after showing success message
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        setSubmitSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error("Error creating rule:", err);
      setError("Failed to create rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedRule = {
        ...currentRule,
        ...formData,
        updatedAt: new Date()
      };
      
      await updateRule(currentRule.id, updatedRule);
      await fetchRules();
      setSubmitSuccess(true);
      
      // Close dialog after showing success message
      setTimeout(() => {
        setIsEditDialogOpen(false);
        setSubmitSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error("Error updating rule:", err);
      setError("Failed to update rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await deleteRule(currentRule.id);
      await fetchRules();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting rule:", err);
      setError("Failed to delete rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (rule) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const duplicatedRule = {
        ...rule,
        name: `${rule.name} (Copy)`,
        userId,
        createdAt: new Date()
      };
      
      // Remove id to create a new document
      delete duplicatedRule.id;
      
      await createRule(duplicatedRule);
      await fetchRules();
    } catch (err) {
      console.error("Error duplicating rule:", err);
      setError("Failed to duplicate rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading redaction rules...</p>
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
            placeholder="Search rules..."
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
          <Plus className="mr-2 h-4 w-4" /> Add Rule
        </Button>
      </div>
      
      {filteredRules.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/30">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">No rules found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? "No rules match your search criteria. Try a different search or clear the filter."
              : "You don't have any redaction rules yet. Create your first rule to get started."}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          ) : (
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Create First Rule
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
          {filteredRules.map((rule) => (
            <motion.div key={rule.id} variants={itemVariants}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg truncate" title={rule.name}>
                      {rule.name}
                    </h3>
                    <div className="flex space-x-1">
                      {getSeverityBadge(rule.severity)}
                      {rule.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2" title={rule.description}>
                    {rule.description || "No description provided"}
                  </p>
                  
                  <div className="mb-4">
                    <Label className="text-xs text-muted-foreground mb-1 block">Pattern</Label>
                    <div className="bg-muted p-2 rounded text-sm font-mono break-all">
                      {rule.pattern}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
                    <Badge variant="secondary">
                      {getCategoryLabel(rule.category)}
                    </Badge>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end space-x-2 pt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(rule)}
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
                          onClick={() => openEditDialog(rule)}
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
                          onClick={() => openDeleteDialog(rule)}
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
      
      {/* Create Rule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Redaction Rule</DialogTitle>
            <DialogDescription>
              Add a new redaction rule to automatically detect and redact sensitive information.
            </DialogDescription>
          </DialogHeader>
          
          {submitSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Rule Created Successfully</h3>
              <p className="text-muted-foreground">Your new redaction rule has been added.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Rule name"
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
                  placeholder="Describe what this rule detects"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pattern">
                  Regex Pattern
                </Label>
                <Input
                  id="pattern"
                  name="pattern"
                  placeholder="\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"
                  value={formData.pattern}
                  onChange={handleInputChange}
                  className={formErrors.pattern ? "border-destructive" : ""}
                />
                {formErrors.pattern && (
                  <p className="text-sm text-destructive">{formErrors.pattern}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter a valid regular expression that matches the content you want to redact.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    name="category"
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="text-sm text-destructive">{formErrors.category}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    name="severity"
                    value={formData.severity}
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger className={formErrors.severity ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.severity && (
                    <p className="text-sm text-destructive">{formErrors.severity}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="form-checkbox h-4 w-4 text-primary border-primary rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
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
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Rule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Redaction Rule</DialogTitle>
            <DialogDescription>
              Update the details of your redaction rule.
            </DialogDescription>
          </DialogHeader>
          
          {submitSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Rule Updated Successfully</h3>
              <p className="text-muted-foreground">Your redaction rule has been updated.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Rule name"
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
                  placeholder="Describe what this rule detects"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-pattern">
                  Regex Pattern
                </Label>
                <Input
                  id="edit-pattern"
                  name="pattern"
                  placeholder="\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"
                  value={formData.pattern}
                  onChange={handleInputChange}
                  className={formErrors.pattern ? "border-destructive" : ""}
                />
                {formErrors.pattern && (
                  <p className="text-sm text-destructive">{formErrors.pattern}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter a valid regular expression that matches the content you want to redact.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    name="category"
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="text-sm text-destructive">{formErrors.category}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-severity">Severity</Label>
                  <Select
                    name="severity"
                    value={formData.severity}
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger className={formErrors.severity ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.severity && (
                    <p className="text-sm text-destructive">{formErrors.severity}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="form-checkbox h-4 w-4 text-primary border-primary rounded"
                />
                <Label htmlFor="edit-isActive" className="cursor-pointer">Active</Label>
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
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Rule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Redaction Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentRule && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-md mb-4">
                <h4 className="font-medium">{currentRule.name}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {currentRule.description || "No description provided"}
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

// Helper functions
function getSeverityBadge(severity) {
  const level = SEVERITY_LEVELS.find(l => l.value === severity);
  if (!level) return null;
  
  let variant = "outline";
  let className = "";
  
  switch (level.value) {
    case "high":
      className = "bg-red-50 text-red-700 border-red-200";
      break;
    case "medium":
      className = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "low":
      className = "bg-blue-50 text-blue-700 border-blue-200";
      break;
  }
  
  return (
    <Badge variant={variant} className={className}>
      {level.label}
    </Badge>
  );
}

function getCategoryLabel(categoryValue) {
  const category = CATEGORIES.find(c => c.value === categoryValue);
  return category ? category.label : categoryValue;
} 