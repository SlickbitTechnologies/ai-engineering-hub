'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TabGroup({ tabs, defaultValue, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);
  const tabRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  // Update the indicator position when the active tab changes
  useEffect(() => {
    if (tabRefs.current[activeTab]) {
      const tabElement = tabRefs.current[activeTab];
      setIndicatorStyle({
        width: tabElement.offsetWidth,
        left: tabElement.offsetLeft,
      });
    }
  }, [activeTab]);

  const handleTabClick = (value) => {
    setActiveTab(value);
    if (onChange) {
      onChange(value);
    }
  };

  // Initialize tabRefs
  useEffect(() => {
    tabRefs.current = {};
  }, []);

  return (
    <div className="border-b border-gray-200">
      <div className="flex relative">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            ref={(el) => (tabRefs.current[tab.value] = el)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.value 
                ? 'text-chateau-green-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabClick(tab.value)}
            aria-selected={activeTab === tab.value}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-chateau-green-600"
          initial={false}
          animate={{
            width: indicatorStyle.width,
            left: indicatorStyle.left,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
      <div className="py-4">
        {tabs.map((tab) => (
          <div
            key={tab.value}
            className={activeTab === tab.value ? 'block' : 'hidden'}
            role="tabpanel"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
} 