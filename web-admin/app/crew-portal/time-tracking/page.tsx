'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { Clock, PlayCircle, StopCircle, Calendar } from 'lucide-react';

export default function CrewTimeTrackingPage() {
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadTimeEntries();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const userId = userResponse.data.id;
      const today = new Date().toISOString().split('T')[0];
      
      const response = await api.get(`/time-entries?user_id=${userId}&date=${today}`);
      const entries = response.data || [];
      
      const active = entries.find((e: any) => !e.clock_out);
      setCurrentEntry(active || null);
      setTodayEntries(entries);

      const hours = entries.reduce((sum: number, entry: any) => {
        if (entry.clock_out) {
          const diff = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          return sum + (diff / (1000 * 60 * 60));
        }
        return sum;
      }, 0);
      setTotalHours(hours);
    } catch (error) {
      console.error('Error loading time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const userResponse = await api.get('/auth/me');
      await api.post('/time-entries/clock-in', {
        user_id: userResponse.data.id,
        user_name: userResponse.data.name,
        clock_in: new Date().toISOString(),
      });
      await loadTimeEntries();
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;
    try {
      await api.post('/time-entries/clock-out', {
        entry_id: currentEntry.id,
        clock_out: new Date().toISOString(),
      });
      await loadTimeEntries();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
    }
  };

  const formatDuration = (start: string) => {
    const diff = currentTime.getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Time Clock"
        description="Manage your work hours"
          />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status Card */}
        <div className={`rounded-lg shadow-lg border-2 p-8 mb-8 text-center ${
          currentEntry ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200'
        }`}>
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
            currentEntry ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            <Clock className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentEntry ? 'Currently Clocked In' : 'Not Clocked In'}
          </h2>
          {currentEntry && (
            <>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {formatDuration(currentEntry.clock_in)}
              </div>
              <p className="text-gray-600">Since {formatTime(currentEntry.clock_in)}</p>
            </>
          )}
          <button
            onClick={currentEntry ? handleClockOut : handleClockIn}
            className={`mt-6 px-8 py-4 rounded-lg font-semibold text-white transition-colors flex items-center gap-3 mx-auto ${
              currentEntry ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {currentEntry ? (
              <><StopCircle className="w-6 h-6" /> Clock Out</>
            ) : (
              <><PlayCircle className="w-6 h-6" /> Clock In</>
            )}
          </button>
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Clock Events</p>
              <p className="text-2xl font-bold text-gray-900">{todayEntries.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentEntry ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium">{currentEntry ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Entries */}
        {todayEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Entries</h3>
            <div className="space-y-4">
              {todayEntries.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <PlayCircle className="w-5 h-5" />
                        <span className="font-semibold">{formatTime(entry.clock_in)}</span>
                      </div>
                      {entry.clock_out && (
                        <>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-2 text-red-600">
                            <StopCircle className="w-5 h-5" />
                            <span className="font-semibold">{formatTime(entry.clock_out)}</span>
                          </div>
                        </>
                      )}
                      {!entry.clock_out && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    {entry.clock_out && (
                      <span className="text-sm text-gray-600">
                        Duration: {((new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60)).toFixed(2)} hours
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
