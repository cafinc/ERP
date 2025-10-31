'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, Zap, Settings, AlertCircle } from 'lucide-react';

export default function WorkflowsPlaceholder() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <PageHeader
        title="Workflow Builder"
        subtitle="Manage automated workflows"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Automation", href: "/automation" },
          { label: "Workflows" }
        ]}
        actions={[
          {
            label: 'Back to Dashboard',
            icon: <ArrowLeft className="w-4 h-4 mr-2" />,
            onClick: () => router.push('/automation'),
            variant: 'secondary',
          },
        ]}
      />

      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Workflow Management
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            The full workflow management interface is being optimized for your deployment.
            In the meantime, you can manage workflows through the Automation Dashboard.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-xl mx-auto">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">Available Actions</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• View workflow status on the main Automation Dashboard</li>
                  <li>• Enable/disable workflows via API endpoints</li>
                  <li>• Monitor workflow execution logs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/automation')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Settings className="w-5 h-5 mr-2" />
              Go to Automation Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
