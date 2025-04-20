import React from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { generateRedactionReport } from "@/lib/redaction";
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  Check, 
  Hash, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Pill 
} from "lucide-react";

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
];

const categoryIcons = {
  medication: <Pill size={16} />,
  patient: <User size={16} />,
  dob: <Calendar size={16} />,
  phone: <Phone size={16} />,
  address: <MapPin size={16} />,
  email: <Mail size={16} />,
  ssn: <Hash size={16} />,
  default: <Info size={16} />
};

const getCategoryIcon = (category) => {
  return categoryIcons[category.toLowerCase()] || categoryIcons.default;
};

const getConfidenceColor = (confidence) => {
  if (confidence >= 0.9) return "text-green-500";
  if (confidence >= 0.75) return "text-amber-500";
  return "text-red-500";
};

const getConfidenceIcon = (confidence) => {
  if (confidence >= 0.9) return <Check size={16} className="text-green-500" />;
  if (confidence >= 0.75) return <Info size={16} className="text-amber-500" />;
  return <AlertTriangle size={16} className="text-red-500" />;
};

const formatConfidence = (confidence) => {
  return (confidence * 100).toFixed(1) + "%";
};

const RedactionResults = ({ results, className = "" }) => {
  // Generate report from raw results
  const report = generateRedactionReport(results);
  
  // Early return if no redactions
  if (!report.totalRedactions) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-center p-8 text-gray-500">
          <Shield className="mr-2" size={20} />
          <span>No redactions were needed for this document</span>
        </div>
      </div>
    );
  }

  // Prepare data for pie chart
  const pieData = Object.entries(report.byCategory).map(([category, data], index) => ({
    name: category,
    value: data.count,
    color: COLORS[index % COLORS.length]
  }));

  // Create category items for the list
  const categoryItems = Object.entries(report.byCategory)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([category, data], index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: data.count,
      confidence: data.averageConfidence,
      color: COLORS[index % COLORS.length],
      examples: data.items.slice(0, 3).map(item => item.text)
    }));

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`bg-white rounded-lg shadow ${className}`}
    >
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <Shield className="mr-2" />
          Redaction Results
        </h3>
      </div>
      
      <div className="p-4">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-500 font-medium">Total Redactions</div>
            <div className="text-2xl font-bold">{report.totalRedactions}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-500 font-medium">Categories</div>
            <div className="text-2xl font-bold">{Object.keys(report.byCategory).length}</div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="text-sm text-amber-500 font-medium">Avg. Confidence</div>
            <div className="text-2xl font-bold flex items-center">
              {formatConfidence(report.averageConfidence)}
              <span className="ml-2">
                {getConfidenceIcon(report.averageConfidence)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Chart and breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-4">Redaction Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} redactions`, 'Count']} 
                    labelFormatter={(label) => label.charAt(0).toUpperCase() + label.slice(1)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Category breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4">Category Breakdown</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {categoryItems.map((item, index) => (
                <motion.div 
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium flex items-center">
                        {getCategoryIcon(item.name)}
                        <span className="ml-1">{item.name}</span>
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {item.count} {item.count === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex justify-between items-center">
                    <div>Confidence: {formatConfidence(item.confidence)}</div>
                    <div className={getConfidenceColor(item.confidence)}>
                      {getConfidenceIcon(item.confidence)}
                    </div>
                  </div>
                  
                  {item.examples.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="font-medium mb-1">Examples:</div>
                      <div className="space-y-1">
                        {item.examples.map((example, i) => (
                          <div key={i} className="bg-white p-1 rounded border border-gray-200">
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RedactionResults; 