'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Phone,
  PhoneOff,
  Pause,
  Play,
  PhoneForwarded,
  RefreshCw,
  User,
  Clock,
  Radio,
} from 'lucide-react';

export default function ActiveCallsPage() {
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchActiveCalls();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchActiveCalls, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchActiveCalls = async () => {
    try {
      const response = await api.get('/ringcentral/active-calls');
      setActiveCalls(response.data.records || []);
    } catch (error) {
      console.error('Error fetching active calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHold = async (sessionId: string, partyId: string) => {
    try {
      await api.post(`/ringcentral/calls/${sessionId}/parties/${partyId}/hold`);
      alert('Call placed on hold');
      fetchActiveCalls();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to hold call');
    }
  };

  const handleUnhold = async (sessionId: string, partyId: string) => {
    try {
      await api.post(`/ringcentral/calls/${sessionId}/parties/${partyId}/unhold`);
      alert('Call resumed');
      fetchActiveCalls();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to unhold call');
    }
  };

  const handleHangup = async (sessionId: string, partyId: string) => {
    if (!confirm('Are you sure you want to hangup this call?')) return;

    try {
      await api.delete(`/ringcentral/calls/${sessionId}/parties/${partyId}`);
      alert('Call terminated');
      fetchActiveCalls();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to hangup call');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getCallDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const durationSeconds = Math.floor((now - start) / 1000);
    
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <PageHeader>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Calls</h1>
            <p className="text-gray-600">
              Real-time call monitoring and control
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>
            <button
              onClick={fetchActiveCalls}
              className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Calls</p>
                <p className="text-2xl font-bold text-gray-900">{activeCalls.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Radio className="w-6 h-6 text-[#3f72af] animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Live Monitoring</p>
                <p className="text-2xl font-bold text-gray-900">{autoRefresh ? 'ON' : 'OFF'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Calls List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
            </div>
          ) : activeCalls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active calls</p>
              <p className="text-gray-400 text-sm mt-2">
                Active calls will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeCalls.map((call) => (
                <div key={call.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Phone className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Session {call.id}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{getCallDuration(call.creationTime)}</span>
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {call.origin?.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="space-y-3">
                    {call.parties?.map((party: any) => (
                      <div
                        key={party.id}
                        className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {party.direction === 'Inbound' ? 'From' : 'To'}:{' '}
                              {formatPhoneNumber(
                                party.direction === 'Inbound'
                                  ? party.from?.phoneNumber
                                  : party.to?.phoneNumber
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {party.status?.code || 'Unknown'}
                              {party.muted && ' • Muted'}
                            </p>
                          </div>
                        </div>

                        {/* Call Controls */}
                        <div className="flex items-center space-x-2">
                          {party.status?.code === 'Hold' ? (
                            <button
                              onClick={() => handleUnhold(call.id, party.id)}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                              title="Resume"
                            >
                              <Play className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHold(call.id, party.id)}
                              className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg transition-colors"
                              title="Hold"
                            >
                              <Pause className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleHangup(call.id, party.id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            title="Hangup"
                          >
                            <PhoneOff className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageHeader>
  );
}
