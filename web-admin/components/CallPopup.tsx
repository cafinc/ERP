'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CallInfo {
  id: string;
  session_id: string;
  from_number: string;
  from_name?: string;
  to_number: string;
  direction: string;
  timestamp: string;
  status: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
}

interface CallPopupProps {
  apiUrl: string;
}

const CALL_DISPOSITIONS = [
  { value: 'answered', label: 'Answered' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'callback_requested', label: 'Callback Requested' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'other', label: 'Other' },
];

export default function CallPopup({ apiUrl }: CallPopupProps) {
  const [activeCalls, setActiveCalls] = useState<CallInfo[]>([]);
  const [dismissedCalls, setDismissedCalls] = useState<Set<string>>(new Set());
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState<string | null>(null);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', email: '', phone: '', address: '' });
  const [callNotes, setCallNotes] = useState<{ [key: string]: { disposition: string; notes: string } }>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Play alert sound when new call comes in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0NV6ro8btjHAY6kt7zzIIuBiaCzfHbkD8LGG+68dycSg4PW6vo8L5kHAU+k9nyzH8tBSV+zPLZijYIGmrA7+KdTw0OWK3p8rRqGwY9kdnxy4AuBiWAzPLaizUIGmuq7uKeTg0OWbDp8bVoGwg+ktjxy4EvBiV+zfTZizUIGW7A7t+dUA0MWa3p8rNrHAY+kdnyy4AuBSV/zfPaijUIGW3A7t6dTw0NWK7p8bVpHAY+kNrxy4EvBiV/zvPaizYIGW+/7t6dUA0NV6/o8bVoHAU+lNnyy4AuBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrHAY+kNrxy4EvBSV/zvPaizUIGW+/7t+dUA0MWbDo8bZrHAU+kNnxy4EvBiV/z/PaizUIGW+/7t+dUA0MWbDp8bZrHAU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrHAY+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/PaizUIGW/A7d+dUA0MWbDo8bZrGwU+kNnxy4EvBiV/z/Pa');
    }
  }, []);

  useEffect(() => {
    // Connect to SSE endpoint for real-time call notifications
    const eventSource = new EventSource(`${apiUrl}/ringcentral/call-stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'call') {
          const call = data.call;
          
          // Only show ringing calls that haven't been dismissed
          if (call.status === 'ringing' && !dismissedCalls.has(call.session_id)) {
            setActiveCalls((prev) => {
              // Check if call already exists
              const exists = prev.some((c) => c.session_id === call.session_id);
              if (exists) {
                return prev;
              }
              
              // Play alert sound
              if (audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
              }
              
              // Add new call
              return [...prev, call];
            });

            // Auto-dismiss after 30 seconds
            setTimeout(() => {
              handleDismiss(call.session_id);
            }, 30000);
          }
        } else if (data.type === 'connected') {
          console.log('Call stream connected');
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [apiUrl, dismissedCalls]);

  const handleDismiss = (sessionId: string) => {
    setDismissedCalls((prev) => new Set(prev).add(sessionId));
    setActiveCalls((prev) => prev.filter((call) => call.session_id !== sessionId));
    setExpandedCall(null);
  };

  const handleViewCustomer = (customerId: string, sessionId: string) => {
    router.push(`/customers?id=${customerId}`);
    handleDismiss(sessionId);
  };

  const handleToggleExpand = (sessionId: string) => {
    setExpandedCall(expandedCall === sessionId ? null : sessionId);
  };

  const handleCreateCustomer = async (call: CallInfo) => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${apiUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCustomerData.name || call.from_name || 'Unknown Customer',
          email: newCustomerData.email,
          phone: newCustomerData.phone || call.from_number,
          address: newCustomerData.address,
          active: true
        })
      });

      if (response.ok) {
        const customer = await response.json();
        // Update call to show customer info
        setActiveCalls(prev => prev.map(c => 
          c.session_id === call.session_id 
            ? { ...c, customer_id: customer.id, customer_name: customer.name, customer_email: customer.email }
            : c
        ));
        setShowCreateCustomer(null);
        setNewCustomerData({ name: '', email: '', phone: '', address: '' });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const handleSaveNote = async (call: CallInfo) => {
    const noteData = callNotes[call.session_id];
    if (!noteData || !noteData.disposition || !noteData.notes) {
      alert('Please select a disposition and enter notes');
      return;
    }

    setSavingNote(call.session_id);
    try {
      const token = localStorage.getItem('session_token');
      await fetch(`${apiUrl}/api/ringcentral/calls/${call.session_id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });

      // Clear note after saving
      setCallNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[call.session_id];
        return newNotes;
      });
      
      // Collapse and dismiss
      handleDismiss(call.session_id);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSavingNote(null);
    }
  };

  // Don't render if no active calls
  if (activeCalls.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed top-20 right-6 z-50 space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto">
        {activeCalls.map((call) => {
          const isExpanded = expandedCall === call.session_id;
          const isCreatingCustomer = showCreateCustomer === call.session_id;
          const noteData = callNotes[call.session_id] || { disposition: '', notes: '' };

          return (
            <div
              key={call.session_id}
              className="bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-4 min-w-[340px] max-w-[420px] animate-slide-in"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold text-gray-900">📞 Incoming Call</h3>
                </div>
                <button
                  onClick={() => handleDismiss(call.session_id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Call Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900">
                    {call.from_name || call.from_number || 'Unknown'}
                  </span>
                </div>

                {call.from_name && call.from_number && (
                  <div className="text-sm text-gray-600 ml-7">{call.from_number}</div>
                )}

                {call.customer_name && (
                  <div className="ml-7 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-blue-900">{call.customer_name}</span>
                    </div>
                    {call.customer_email && (
                      <div className="text-xs text-blue-700 mt-1">{call.customer_email}</div>
                    )}
                  </div>
                )}

                {!call.customer_name && !isCreatingCustomer && (
                  <div className="ml-7 mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-sm text-yellow-800">⚠️ New caller - not in database</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 mb-3">
                {call.customer_id && (
                  <button
                    onClick={() => handleViewCustomer(call.customer_id!, call.session_id)}
                    className="flex-1 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Customer
                  </button>
                )}
                {!call.customer_id && !isCreatingCustomer && (
                  <button
                    onClick={() => setShowCreateCustomer(call.session_id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ➕ Create Customer
                  </button>
                )}
                <button
                  onClick={() => handleToggleExpand(call.session_id)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isExpanded ? '📝 Hide Notes' : '📝 Add Notes'}
                </button>
              </div>

              {/* Create Customer Form */}
              {isCreatingCustomer && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-sm mb-2">Create New Customer</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={newCustomerData.address}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreateCustomer(call)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateCustomer(null);
                          setNewCustomerData({ name: '', email: '', phone: '', address: '' });
                        }}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {isExpanded && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-sm mb-2">Call Notes</h4>
                  <div className="space-y-2">
                    <select
                      value={noteData.disposition}
                      onChange={(e) => setCallNotes(prev => ({
                        ...prev,
                        [call.session_id]: { ...noteData, disposition: e.target.value }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    >
                      <option value="">Select Disposition *</option>
                      {CALL_DISPOSITIONS.map(disp => (
                        <option key={disp.value} value={disp.value}>{disp.label}</option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Enter call notes..."
                      value={noteData.notes}
                      onChange={(e) => setCallNotes(prev => ({
                        ...prev,
                        [call.session_id]: { ...noteData, notes: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent resize-none"
                    />
                    <button
                      onClick={() => handleSaveNote(call)}
                      disabled={savingNote === call.session_id}
                      className="w-full bg-[#3f72af] hover:bg-[#3f72af]/90 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      {savingNote === call.session_id ? 'Saving...' : 'Save & Close'}
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center">
                {new Date(call.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
