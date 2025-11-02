'use client';

import PageHeader from '@/components/PageHeader';
import { MessageSquare, Construction } from 'lucide-react';

export default function MessagesPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <PageHeader
        title="Messages"
        subtitle="Communication center"
        icon={<MessageSquare size={28} />}
      />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Construction className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Messages Feature Under Maintenance
          </h2>
          <p className="text-gray-600 mb-6">
            The messages feature is currently being updated with improved functionality. 
            Please check back soon.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All other features of the application remain fully functional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
