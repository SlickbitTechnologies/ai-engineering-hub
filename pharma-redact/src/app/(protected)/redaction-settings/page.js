"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/AuthContext";
import { redirect } from "next/navigation";
import RulesTab from "./RulesTab";
import TemplatesTab from "./TemplatesTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Settings, FileText, Database } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { initializeUserData } from "../../lib/seedData";
import { Alert, AlertDescription } from "../../../components/ui/alert";

const RedactionSettings = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("rules");
  const [initializing, setInitializing] = useState(false);
  const [initSuccess, setInitSuccess] = useState(false);
  const [initError, setInitError] = useState(null);

  // Handle authentication check
  if (!loading && !user) {
    redirect("/auth");
  }

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleInitializeData = async () => {
    if (!user) return;
    
    setInitializing(true);
    setInitSuccess(false);
    setInitError(null);
    
    try {
      // Call the updated initializeUserData function that no longer creates templates
      await initializeUserData(user.uid);
      
      // Show info message instead of success
      setInitError("Automatic template creation is disabled. Please create your templates and rules manually.");
      
      // Don't show success message
      setInitSuccess(false);
      
      // Show message for longer (8 seconds)
      setTimeout(() => setInitError(null), 8000);
    } catch (error) {
      console.error("Error:", error);
      setInitError("Please create your templates and rules manually through the interface.");
      // Show error for 5 seconds
      setTimeout(() => setInitError(null), 5000);
    } finally {
      setInitializing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 border-r-2 rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container px-4 py-8 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Redaction Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your redaction rules and templates for document processing.
          </p>
        </div>
        <Button 
          onClick={handleInitializeData} 
          disabled={initializing}
          isLoading={initializing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          <span>Create Rules & Templates</span>
        </Button>
      </motion.div>

      {initSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4"
        >
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription>Operation complete.</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {initError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4"
        >
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <AlertDescription>{initError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Tabs
          defaultValue="rules"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-8">
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Redaction Rules</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rules" className="mt-0">
            <RulesTab />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <TemplatesTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};