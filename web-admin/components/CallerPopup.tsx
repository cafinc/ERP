'use client';

import { useState, useEffect } from 'react';
import { Phone, X, User, Mail, MapPin } from 'lucide-react';
import api from '@/lib/api';

interface ActiveCall {
  session_id: string;
  from_number: string;
  from_name?: string;
  to_number: string;
  direction: 'Inbound' | 'Outbound';
  timestamp: string;
  status: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
}

export default function CallerPopup() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Poll for active calls every 2 seconds
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/ringcentral/active-calls');
        setActiveCalls(res.data.calls || []);
      } catch (error) {
        console.error('Error fetching active calls:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (sessionId: string) => {
    setDismissed(prev => new Set(prev).add(sessionId));
  };

  const visibleCalls = activeCalls.filter(
    call => call.direction === 'Inbound' && !dismissed.has(call.session_id)
  );

  if (visibleCalls.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3">
      {visibleCalls.map((call) => (
        <div
          key={call.session_id}
          className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-4 w-80 animate-bounce"
          style={{ animationIterationCount: 3 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Incoming Call</p>
                <p className="text-xs text-gray-500">{call.status}</p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(call.session_id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {call.customer_name ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-green-600" />
                <p className="font-semibold text-green-900">{call.customer_name}</p>
              </div>
              {call.customer_email && (
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <Mail className="w-3 h-3" />
                  <p>{call.customer_email}</p>
                </div>
              )}
              <div className="mt-2">
                <a
                  href={`/customers/${call.customer_id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View Customer Profile →
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-yellow-900 mb-2">Unknown Caller</p>
              <p className="text-xs text-yellow-700">No customer record found</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">From:</span>
              <span className="font-medium text-gray-900">
                {call.from_name || call.from_number}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">To:</span>
              <span className="font-medium text-gray-900">{call.to_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-900">
                {new Date(call.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
