'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Database, RefreshCw, AlertCircle, Wifi, Server } from 'lucide-react';

export default function SystemStatusDropdown({ onClose }: { onClose?: () => void }) {
  const router = useRouter();

  const handleViewAllClick = () => {
    router.push('/system');
    if (onClose) onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <h3 className="font-bold text-lg mb-1">System Status</h3>
        <p className="text-sm opacity-90">All systems operational</p>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">API Status</p>
              <p className="text-xs text-gray-500">Healthy</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">ONLINE</span>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Database</p>
              <p className="text-xs text-gray-500">Connected</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">ONLINE</span>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Server className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Services</p>
              <p className="text-xs text-gray-500">All running</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">ONLINE</span>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Last Sync</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleViewAllClick}
        className="w-full bg-gray-50 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-200"
      >
        View System Details →
      </button>
    </div>
  );
}
