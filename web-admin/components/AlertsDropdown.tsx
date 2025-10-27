'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Info, XCircle, Clock } from 'lucide-react';

interface AlertsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock alerts - replace with real data later
const MOCK_ALERTS = [
  {
    id: '1',
    type: 'success',
    title: 'Payment Received',
    message: 'Invoice #1234 has been paid',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Service Due',
    message: 'Customer site requires attention',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false
  },
  {
    id: '3',
    type: 'info',
    title: 'New Message',
    message: 'You have 3 unread messages',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true
  },
  {
    id: '4',
    type: 'error',
    title: 'Payment Failed',
    message: 'Auto-payment failed for Invoice #1235',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true
  },
];

export default function AlertsDropdown({ isOpen, onClose }: AlertsDropdownProps) {
  if (!isOpen) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Alerts</h3>
        <button
          onClick={onClose}
          className="text-xs text-[#3f72af] hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-100">
        {MOCK_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
              !alert.read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {alert.title}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(alert.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {alert.message}
                </p>
                {!alert.read && (
                  <span className="inline-block mt-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-center">
        <button
          onClick={() => {
            // Navigate to alerts page
            onClose();
          }}
          className="text-xs text-[#3f72af] hover:underline cursor-pointer"
        >
          View All Alerts
        </button>
      </div>
    </div>
  );
}
