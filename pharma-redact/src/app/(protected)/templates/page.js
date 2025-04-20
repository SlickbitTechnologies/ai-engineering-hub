'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { FileText, List, Settings } from 'lucide-react';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

export default function RedactionSettings() {
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Redaction Settings</h1>
        <p className="text-gray-600 mt-2">Configure rules and templates for document redaction</p>
      </motion.div>
      
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <Tabs.List className="flex border-b border-gray-200">
          <Tabs.Trigger
            value="rules"
            className={`px-4 py-2 text-sm font-medium -mb-px ${
              activeTab === 'rules'
                ? 'border-b-2 border-chateau-green-600 text-chateau-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              Rules
            </div>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="templates"
            className={`px-4 py-2 text-sm font-medium -mb-px ${
              activeTab === 'templates'
                ? 'border-b-2 border-chateau-green-600 text-chateau-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </div>
          </Tabs.Trigger>
        </Tabs.List>
        
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === 'rules' ? (
              <motion.div
                key="rules"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
                className="bg-white shadow-md rounded-lg p-6"
              >
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <Settings className="h-12 w-12 text-chateau-green-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Redaction Rules</h2>
                  <p className="text-gray-600 text-center max-w-md">
                    This tab will allow management of redaction rules.
                    Rules define patterns to identify sensitive information.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="templates"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
                className="bg-white shadow-md rounded-lg p-6"
              >
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <FileText className="h-12 w-12 text-chateau-green-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Redaction Templates</h2>
                  <p className="text-gray-600 text-center max-w-md">
                    This tab will allow management of redaction templates.
                    Templates group multiple rules together for easy application.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs.Root>
    </div>
  );
} 