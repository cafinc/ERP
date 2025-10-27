'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, UserPlus, DollarSign, Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface ActivityDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock activities - replace with real data later
const MOCK_ACTIVITIES = [
  {
    id: '1',
    type: 'estimate',
    title: 'Estimate Created',
    description: 'Estimate #EST-2024-001 for ABC Corp',
    user: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
  },
  {
    id: '2',
    type: 'customer',
    title: 'New Customer Added',
    description: 'XYZ Industries added to system',
    user: 'Jane Smith',
    timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    description: 'Invoice #INV-2024-123 paid - $5,240.00',
    user: 'System',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
  },
  {
    id: '4',
    type: 'project',
    title: 'Project Completed',
    description: 'Winter maintenance for Parking Lot A',
    user: 'Mike Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
  },
  {
    id: '5',
    type: 'lead',
    title: 'New Lead',
    description: 'Property management inquiry received',
    user: 'System',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
];

export default function ActivityDropdown({ isOpen, onClose }: ActivityDropdownProps) {
  if (!isOpen) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'estimate':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'customer':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'project':
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'lead':
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
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
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        <button
          onClick={onClose}
          className="text-xs text-[#3f72af] hover:underline cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-gray-100">
        {MOCK_ACTIVITIES.map((activity) => (
          <div
            key={activity.id}
            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                  {activity.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>by {activity.user}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-center">
        <button
          onClick={() => {
            // Navigate to activity log page
            onClose();
          }}
          className="text-xs text-[#3f72af] hover:underline cursor-pointer"
        >
          View Full Activity Log
        </button>
      </div>
    </div>
  );
}
