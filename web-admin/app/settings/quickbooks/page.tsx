'use client';

import { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';

export default function QuickbooksSettingsPage() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">QuickBooks Integration</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">Connect your QuickBooks account to sync financial data.</p>
          <button
            onClick={() => setConnected(!connected)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <LinkIcon className="w-4 h-4" />
            {connected ? 'Disconnect' : 'Connect QuickBooks'}
          </button></div></div></div>
  );
}
