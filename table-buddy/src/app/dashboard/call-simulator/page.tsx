'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import VapiCallSimulator from '@/components/call-simulator/VapiCallSimulator';

export default function CallSimulator() {

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Call Simulator</h1>
            <p className="mt-1 text-sm text-gray-500">
              Test your voice assistant with simulated calls
            </p>
          </div>

          {/* Call Simulator Component */}
          <VapiCallSimulator showChat={true} />
        </div>
      </div>
    </DashboardLayout>
  );
} 