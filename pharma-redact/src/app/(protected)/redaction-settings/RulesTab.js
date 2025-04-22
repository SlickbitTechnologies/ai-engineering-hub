"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Save, X, Info } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { 
  createRedactionRule, 
  getUserRedactionRules, 
  updateRedactionRule, 
  deleteRedactionRule 
} from "../../lib/firebase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const RulesTab = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "regex",
    pattern: "",
    category: "PHI",
    severity: "high",
    isEnabled: true,
  });

  // Fetch user's redaction rules
  useEffect(() => {
    if (user) {
      fetchRules();
    }
  }, [user]);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRules = await getUserRedactionRules(user.uid);
      setRules(fetchedRules);
    } catch (err) {
      console.error("Error fetching rules:", err);
      setError("Failed to load your redaction rules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "regex",
      pattern: "",
      category: "PHI",
      severity: "high",
      isEnabled: true,
    });
    setCurrentRule(null);
  };

  const handleAddRule = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await createRedactionRule({
        ...formData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });
      
      await fetchRules();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding rule:", error);
      setError("Failed to add redaction rule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (rule) => {
    setCurrentRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      type: rule.type || "regex",
      pattern: rule.pattern || "",
      category: rule.category || "PHI",
      severity: rule.severity || "high",
      isEnabled: rule.isEnabled !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRule = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!currentRule) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateRedactionRule(currentRule.id, {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      
      await fetchRules();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating rule:", error);
      setError("Failed to update redaction rule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (rule) => {
    setCurrentRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteRule = async () => {
    if (!currentRule) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteRedactionRule(currentRule.id);
      await fetchRules();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting rule:", error);
      setError("Failed to delete redaction rule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Rule name is required";
    if (!formData.pattern.trim()) return "Pattern is required";
    
    if (formData.type === "regex") {
      try {
        new RegExp(formData.pattern);
      } catch (e) {
        return "Invalid regular expression pattern";
      }
    }
    
    return null;
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "phi": return "blue";
      case "pii": return "purple";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 border-r-2 rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Redaction Rules</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Redaction Rule</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Phone Number Rule"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Explain what this rule detects"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHI">Protected Health Info (PHI)</SelectItem>
                      <SelectItem value="PII">Personal Info (PII)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Priority Level</Label>
                  <Select 
                    value={formData.severity} 
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pattern">Pattern (RegEx)</Label>
                <Textarea
                  id="pattern"
                  name="pattern"
                  value={formData.pattern}
                  onChange={handleInputChange}
                  placeholder="e.g., \b\d{3}[-.]?\d{3}[-.]?\d{4}\b"
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground mb-4">You don't have any redaction rules yet</p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddDialogOpen(true)}
            className="mx-auto"
          >
            Create your first rule
          </Button>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <Card className={`h-full flex flex-col ${!rule.isEnabled ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {rule.name}
                          {!rule.isEnabled && (
                            <Badge variant="outline" className="ml-2 text-xs">Disabled</Badge>
                          )}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={getCategoryColor(rule.category)}>
                            {rule.category === "PHI" ? "Protected Health Info (PHI)" :
                             rule.category === "PII" ? "Personal Info (PII)" : "Custom"}
                          </Badge>
                          <Badge variant={getSeverityColor(rule.severity)}>
                            {rule.severity === "high" ? "High Priority" :
                             rule.severity === "medium" ? "Medium Priority" : "Low Priority"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {rule.description && (
                      <p className="text-muted-foreground text-sm mb-3">{rule.description}</p>
                    )}
                    <div className="bg-muted/50 rounded-md p-2 overflow-x-auto">
                      <code className="text-xs break-all">{rule.pattern}</code>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(rule)}
                          >
                            <Edit size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit rule</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(rule)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete rule</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Redaction Rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Rule Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-pattern">Pattern (RegEx)</Label>
              <Input
                id="edit-pattern"
                name="pattern"
                value={formData.pattern}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PII">PII</SelectItem>
                    <SelectItem value="PHI">PHI</SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Confidential">Confidential</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-replacementType">Replacement Type</Label>
                <Select 
                  value={formData.replacementType} 
                  onValueChange={(value) => handleSelectChange("replacementType", value)}
                >
                  <SelectTrigger id="edit-replacementType">
                    <SelectValue placeholder="Select replacement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redact">Redact (█████)</SelectItem>
                    <SelectItem value="anonymize">Anonymize (XXXXX)</SelectItem>
                    <SelectItem value="mask">Mask ([DATA])</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRule}>Update Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Redaction Rule</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to delete the rule "{currentRule?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRule}>Delete Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RulesTab; 