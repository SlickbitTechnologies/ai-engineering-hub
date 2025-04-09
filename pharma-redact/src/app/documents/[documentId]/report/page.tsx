"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Document } from "@/store/slices/documentsSlice";
import { RedactionItem } from "@/store/slices/redactionSlice";
import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";

type RedactionCategory = "Personal" | "Financial" | "Medical" | "Legal";

interface RedactedContent {
  id: string;
  text: string;
  redactedText: string;
  page: number;
  para: number;
  category: RedactionCategory;
  description: string;
  confidence: number;
  isApproved: boolean;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  
  // In a real implementation, we would fetch this from the API or Redux store
  const [mockRedactedContent] = useState<RedactedContent[]>([
    {
      id: "1",
      text: "HealthPlus Insurance",
      redactedText: "[REDACTED]",
      page: 1,
      para: 5,
      category: "Financial",
      description: "Insurance provider",
      confidence: 90,
      isApproved: true
    },
    {
      id: "2",
      text: "VISA ending in 4321",
      redactedText: "[REDACTED]",
      page: 1,
      para: 5,
      category: "Financial",
      description: "Payment information",
      confidence: 92,
      isApproved: true
    },
    {
      id: "3",
      text: "John Doe",
      redactedText: "[REDACTED]",
      page: 1,
      para: 2,
      category: "Personal",
      description: "Staff identity",
      confidence: 95,
      isApproved: true
    },
    {
      id: "4",
      text: "Dr. Jane Smith",
      redactedText: "[REDACTED]",
      page: 1,
      para: 1,
      category: "Personal",
      description: "Principal Investigator",
      confidence: 98,
      isApproved: true
    },
    {
      id: "5",
      text: "Robert Johnson",
      redactedText: "[REDACTED]",
      page: 1,
      para: 3,
      category: "Personal",
      description: "Patient name",
      confidence: 96,
      isApproved: true
    },
    {
      id: "6",
      text: "05/12/1975",
      redactedText: "[REDACTED]",
      page: 1,
      para: 3,
      category: "Personal",
      description: "Date of birth",
      confidence: 97,
      isApproved: true
    },
    {
      id: "7",
      text: "123 Main Street, Cityville, State 12345",
      redactedText: "[REDACTED]",
      page: 1,
      para: 3,
      category: "Personal",
      description: "Address",
      confidence: 94,
      isApproved: true
    },
    {
      id: "8",
      text: "(555) 123-4567",
      redactedText: "[REDACTED]",
      page: 1,
      para: 3,
      category: "Personal",
      description: "Phone number",
      confidence: 99,
      isApproved: true
    },
    {
      id: "9",
      text: "robertj@example.com",
      redactedText: "[REDACTED]",
      page: 1,
      para: 3,
      category: "Personal",
      description: "Email address",
      confidence: 99,
      isApproved: true
    },
    {
      id: "10",
      text: "987-65-4321",
      redactedText: "[REDACTED]",
      page: 1,
      para: 2,
      category: "Personal",
      description: "Patient ID",
      confidence: 99,
      isApproved: true
    }
  ]);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  const countByCategory = {
    Personal: mockRedactedContent.filter(item => item.category === "Personal").length,
    Financial: mockRedactedContent.filter(item => item.category === "Financial").length,
    Medical: mockRedactedContent.filter(item => item.category === "Medical").length,
    Legal: mockRedactedContent.filter(item => item.category === "Legal").length
  };

  const handleItemClick = (id: string) => {
    setSelectedItem(id === selectedItem ? null : id);
    if (feedbackRef.current) {
      feedbackRef.current.focus();
    }
  };

  const handleClearFeedback = () => {
    setFeedback("");
    if (feedbackRef.current) {
      feedbackRef.current.focus();
    }
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      // In a real implementation, we would submit the feedback
      alert("Feedback submitted successfully!");
      setFeedback("");
      setSelectedItem(null);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Redaction Report</h2>
            <p className="text-gray-600">Review redacted content and provide feedback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Original Document */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-blue-600 mb-3">Original Document</h3>
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 h-[600px] overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <h4 className="font-bold text-center">CLINICAL STUDY REPORT</h4>
                <div className="my-4">
                  <p><strong>Protocol:</strong> ABC-12345-XYZ</p>
                  <p><strong>Sponsor:</strong> PharmaCorp, Inc.</p>
                  <p><strong>Principal Investigator:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">Dr. Jane Smith</span></p>
                  <p><strong>Study Coordinator:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">John Doe</span></p>
                  <p><strong>Patient ID:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">987-65-4321</span></p>
                </div>

                <h5 className="font-bold mt-6">SUBJECT INFORMATION</h5>
                <div className="my-4">
                  <p><strong>Name:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">Robert Johnson</span></p>
                  <p><strong>DOB:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">05/12/1975</span></p>
                  <p><strong>Address:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">123 Main Street, Cityville, State 12345</span></p>
                  <p><strong>Phone:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">(555) 123-4567</span></p>
                  <p><strong>Email:</strong> <span className="text-red-500 bg-red-50 px-1 rounded">robertj@example.com</span></p>
                </div>

                <h5 className="font-bold mt-6">MEDICAL HISTORY</h5>
                <div className="my-4">
                  <p>The patient has a history of hypertension and Type 2 diabetes managed with Metformin 500mg BID.</p>
                  <p>Patient is insured by <span className="text-red-500 bg-red-50 px-1 rounded">HealthPlus Insurance</span> and payments are processed through <span className="text-red-500 bg-red-50 px-1 rounded">VISA ending in 4321</span>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redacted Document */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-blue-600 mb-3">Redacted Document</h3>
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 h-[600px] overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <h4 className="font-bold text-center">CLINICAL STUDY REPORT</h4>
                <div className="my-4">
                  <p><strong>Protocol:</strong> ABC-12345-XYZ</p>
                  <p><strong>Sponsor:</strong> PharmaCorp, Inc.</p>
                  <p><strong>Principal Investigator:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="Dr. Jane Smith">Dr. Jane Smith</span></p>
                  <p><strong>Study Coordinator:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="John Doe">John Doe</span></p>
                  <p><strong>Patient ID:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="987-65-4321">987-65-4321</span></p>
                </div>

                <h5 className="font-bold mt-6">SUBJECT INFORMATION</h5>
                <div className="my-4">
                  <p><strong>Name:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="Robert Johnson">Robert Johnson</span></p>
                  <p><strong>DOB:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="05/12/1975">05/12/1975</span></p>
                  <p><strong>Address:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="123 Main Street, Cityville, State 12345">123 Main Street, Cityville, State 12345</span></p>
                  <p><strong>Phone:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="(555) 123-4567">(555) 123-4567</span></p>
                  <p><strong>Email:</strong> <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="robertj@example.com">robertj@example.com</span></p>
                </div>

                <h5 className="font-bold mt-6">MEDICAL HISTORY</h5>
                <div className="my-4">
                  <p>The patient has a history of hypertension and Type 2 diabetes managed with Metformin 500mg BID.</p>
                  <p>Patient is insured by <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="HealthPlus Insurance">HealthPlus Insurance</span> and payments are processed through <span className="bg-black text-transparent px-2 py-0.5 rounded" aria-label="Redacted content" title="VISA ending in 4321">VISA ending in 4321</span>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redacted Content Panel */}
          <div className="lg:col-span-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
              <h3 className="text-lg font-medium text-blue-600">Redacted Content ({mockRedactedContent.length})</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span className="whitespace-nowrap">Personal: {countByCategory.Personal}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
                  <span className="whitespace-nowrap">Financial: {countByCategory.Financial}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></span>
                  <span className="whitespace-nowrap">Medical: {countByCategory.Medical}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="whitespace-nowrap">Legal: {countByCategory.Legal}</span>
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-md shadow-sm border border-gray-200 h-[450px] overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {mockRedactedContent.map(item => (
                  <div 
                    key={item.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedItem === item.id ? 'bg-gray-50 border-l-4 border-chateau-green-500 pl-3' : ''}`}
                    onClick={() => handleItemClick(item.id)}
                    role="button"
                    tabIndex={0}
                    aria-selected={selectedItem === item.id}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleItemClick(item.id);
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 pr-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{item.text}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.category === "Personal" ? "bg-blue-100 text-blue-800" :
                            item.category === "Financial" ? "bg-green-100 text-green-800" :
                            item.category === "Medical" ? "bg-purple-100 text-purple-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700">{item.confidence}%</span>
                        <button 
                          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 rounded-full p-1"
                          aria-label={`View details for ${item.text}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Page {item.page}, Para {item.para}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-white rounded-md shadow-sm border border-gray-200 p-5">
              <textarea
                ref={feedbackRef}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Select a redacted item to provide specific feedback, or enter general feedback here..."
                className="w-full h-24 text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:border-transparent"
                aria-label="Feedback"
              ></textarea>
              <div className="flex justify-between items-center mt-3">
                <button 
                  onClick={handleClearFeedback}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-chateau-green-500"
                  title="Clear feedback"
                  aria-label="Clear feedback"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3.5 14l-7-7m0 7l7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">{feedback.length} characters</div>
                  <button 
                    onClick={handleSubmitFeedback}
                    className="bg-chateau-green-600 hover:bg-chateau-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2"
                    disabled={!feedback.trim()}
                    aria-label="Submit feedback"
                  >
                    <span>Submit</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 