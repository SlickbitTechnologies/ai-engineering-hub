import { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function PageContainer({ title, description, children }: PageContainerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      <div className="bg-white rounded-[10px] p-6 shadow-sm ring-1 ring-gray-300">
        {children}
      </div>
    </div>
  );
} 