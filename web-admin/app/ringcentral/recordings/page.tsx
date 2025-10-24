'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Play,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  Mic,
} from 'lucide-react';

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchRecordings();
    }
  }, [currentPage, dateFrom, dateTo]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const params: any = {
        per_page: 50,
        page: currentPage,
      };
      
      if (dateFrom) {
        params.date_from = new Date(dateFrom).toISOString();
      }
      if (dateTo) {
        params.date_to = new Date(dateTo).toISOString();
      }

      const response = await api.get('/ringcentral/recordings', { params });
      setRecordings(response.data.records || []);
      
      const paging = response.data.paging || {};
      setTotalPages(Math.ceil((paging.totalElements || 0) / (paging.perPage || 50)));
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (recordingId: string, sessionId: string) => {
    try {
      const response = await api.get(`/ringcentral/recordings/${recordingId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recording_${sessionId}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to download recording');
    }
  };

  const filteredRecordings = recordings.filter(rec => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      rec.from?.phoneNumber?.includes(query) ||
      rec.to?.phoneNumber?.includes(query) ||
      rec.sessionId?.toLowerCase().includes(query)
    );
  });

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageHeader
        title="Recordings"
        subtitle="Manage recordings"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Ringcentral", href: "/ringcentral" }, { label: "Recordings" }]}
      />
      <div className="flex-1 overflow-auto p-6">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Call Recordings</h1>
          <p className="text-gray-600">Access and download call recordings</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={fetchRecordings}
              className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Recordings</p>
                <p className="text-2xl font-bold text-gray-900">{recordings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recordings List */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recordings found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your date range or search criteria
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Phone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {recording.direction === 'Inbound' ? 'From' : 'To'}:{' '}
                            {formatPhoneNumber(
                              recording.direction === 'Inbound'
                                ? recording.from?.phoneNumber
                                : recording.to?.phoneNumber
                            )}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(recording.startTime)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(recording.duration || 0)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {recording.recording && (
                        <div className="ml-12 flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {recording.recording.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(recording.recording.id, recording.sessionId)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
