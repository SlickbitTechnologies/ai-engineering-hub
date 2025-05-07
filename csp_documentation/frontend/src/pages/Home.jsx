import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import '../styles/global.css';

const features = [
  {
    icon: SparklesIcon,
    title: 'AI-Powered Processing',
    description: 'Advanced AI algorithms for intelligent document analysis and processing',
    
  },
  {
    icon: ClockIcon,
    title: 'Real-time Progress',
    description: 'Track document processing status with detailed progress updates',
    
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with reliable document handling'
  }
];

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Hero Section */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            <span className=" bg-[#0098B3] to-blue-800 bg-clip-text text-transparent hover:bg-[#007A92]">
              Meta-Doc Automator
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Extract metadata from clinical and regulatory documents in SharePoint
          </motion.p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <Link to="/documents" className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <DocumentTextIcon className="h-8 w-8" style={{ color: '#0098B3' }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Process Documents</h3>
                  <p className="text-gray-600">Upload and process your documents</p>
                </div>
              </div>
              <ArrowRightIcon className="h-6 w-6" style={{ color: '#0098B3' }} />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <Link to="/settings" className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Cog6ToothIcon className="h-8 w-8 " style={{ color: '#0098B3' }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configure Templates</h3>
                  <p className="text-gray-600">Configure your preferences</p>
                </div>
              </div>
              <ArrowRightIcon className="h-6 w-6" style={{ color: '#0098B3' }} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="bg-blue-50 p-3 rounded-lg w-fit mb-4">
                <feature.icon className="h-6 w-6 " style={{ color: '#0098B3' }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home; 