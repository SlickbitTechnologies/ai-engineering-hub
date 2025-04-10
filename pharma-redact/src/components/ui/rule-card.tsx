"use client";

import { RedactionRule } from "@/store/slices/redactionSlice";
import { formatDistanceToNow } from "date-fns";

interface RuleCardProps {
  rule: RedactionRule;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  const getTypeColor = (type: RedactionRule["type"]) => {
    switch (type) {
      case "name":
        return "bg-blue-100 text-blue-800";
      case "address":
        return "bg-purple-100 text-purple-800";
      case "phone":
        return "bg-orange-100 text-orange-800";
      case "email":
        return "bg-yellow-100 text-yellow-800";
      case "site":
        return "bg-pink-100 text-pink-800";
      case "investigator":
        return "bg-indigo-100 text-indigo-800";
      case "confidential":
        return "bg-red-100 text-red-800";
      case "custom":
        return "bg-chateau-green-100 text-chateau-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(rule.type)}`}>
              {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}
            </div>
            {rule.isSystem && (
              <div className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                System
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggle}
            className={`p-2 rounded-md ${
              rule.isActive
                ? "bg-chateau-green-100 text-chateau-green-600"
                : "bg-gray-100 text-gray-400"
            }`}
            title={rule.isActive ? "Disable rule" : "Enable rule"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M22 12c0 5.52-4.48 10-10 10s-10-4.48-10-10 4.48-10 10-10 10 4.48 10 10z" />
              {rule.isActive && <path d="m9 12 2 2 4-4" />}
            </svg>
          </button>
          {!rule.isSystem && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Edit rule"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                title="Delete rule"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-700 overflow-x-auto max-w-md">
          {rule.pattern}
        </div>
        <div className="text-xs text-gray-500">
          Created {formatDistanceToNow(new Date(rule.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
} 