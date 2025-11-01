'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import CreateEventModal from '@/components/CreateEventModal';
import api from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Download,
  Upload,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  RefreshCw,
  XCircle,
  FileText,
  Paperclip,
  Repeat,
  Bell,
  Tag,
  X,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  type: 'appointment' | 'task' | 'meeting' | 'event';
  status: 'confirmed' | 'tentative' | 'cancelled';
  google_event_id?: string;
  color?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState('');

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    type: 'appointment',
    status: 'confirmed',
    location: '',
    customer_id: '',
    site_id: '',
    form_ids: [] as string[],
    attendees: [] as string[],
    priority: 'medium',
    color: 'blue',
    recurring: false,
    recurring_frequency: 'weekly',
    notes: '',
  });
  const [eventFiles, setEventFiles] = useState<File[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
    checkGoogleConnection();
    loadRelatedData();
    
    // Check if we just returned from OAuth with success
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('connected') === 'true') {
        // Remove the query param
        window.history.replaceState({}, '', '/calendar');
        // Force reload the connection status
        setTimeout(() => {
          checkGoogleConnection();
        }, 500);
      }
    }
  }, [currentDate, view]);

  const loadRelatedData = async () => {
    try {
      const [customersRes, sitesRes, formsRes, teamRes] = await Promise.all([
        api.get('/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/sites').catch(() => ({ data: [] })),
        api.get('/forms/templates').catch(() => ({ data: [] })),
        api.get('/team').catch(() => ({ data: [] })),
      ]);

      setCustomers(customersRes.data.customers || customersRes.data || []);
      setSites(sitesRes.data || []);
      setForms(formsRes.data || []);
      setTeamMembers(teamRes.data || []);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Fetch events from backend
      const response = await api.get('/calendar/events', {
        params: {
          start: getStartDate().toISOString(),
          end: getEndDate().toISOString(),
        }
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      // Use mock data for now
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const response = await api.get('/calendar/google/status');
      setGoogleConnected(response.data.connected || false);
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleConnected(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setSyncing(true);
      // Redirect to Google OAuth flow
      const response = await api.get('/calendar/google/auth-url');
      
      if (response.data.setup_required) {
        // Show setup message as popup
        setConnectionErrorMessage(response.data.message + '\n\nTo set up Google Calendar integration:\n1. Create a Google Cloud project\n2. Enable Google Calendar API\n3. Create OAuth 2.0 credentials\n4. Add GOOGLE_CALENDAR_CLIENT_ID to backend .env');
        setShowConnectionError(true);
      } else if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setConnectionErrorMessage('Failed to connect to Google Calendar. The backend endpoints are ready, but Google OAuth credentials need to be configured.');
      setShowConnectionError(true);
    } finally {
      setSyncing(false);
    }
  };

  const syncGoogleCalendar = async () => {
    try {
      setSyncing(true);
      await api.post('/calendar/google/sync');
      await loadEvents();
      // Show success popup
      setConnectionErrorMessage('Calendar synced successfully!');
      setShowConnectionError(true);
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setConnectionErrorMessage('Failed to sync calendar. Please try again.');
      setShowConnectionError(true);
    } finally {
      setSyncing(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day + 6);
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const getMockEvents = (): CalendarEvent[] => {
    const today = new Date();
    return [
      {
        id: '1',
        title: 'Follow up: Smith Estimate',
        description: 'Call customer about EST-2024-156',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
        type: 'appointment',
        status: 'confirmed',
        color: 'blue',
      },
      {
        id: '2',
        title: 'Site Inspection - Elm Street',
        description: 'Parking lot inspection',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0).toISOString(),
        location: 'Elm Street Parking Lot',
        type: 'appointment',
        status: 'confirmed',
        color: 'green',
      },
      {
        id: '3',
        title: 'Team Meeting',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0).toISOString(),
        attendees: ['Team'],
        type: 'meeting',
        status: 'confirmed',
        color: 'purple',
      },
      {
        id: '4',
        title: 'Contract Renewal - Downtown Plaza',
        description: 'Season 2025 contract discussion',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 13, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 15, 0).toISOString(),
        type: 'meeting',
        status: 'tentative',
        color: 'orange',
      },
    ];
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = getStartDate();
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getCurrentDayEvents = () => {
    return getEventsForDate(currentDate);
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const goToPreviousMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const goToNextMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const startOfWeek = getStartDate();
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Calendar"
        subtitle="Manage appointments, meetings, and events with Google Calendar sync"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Calendar" },
        ]}
        actions={[
          {
            label: googleConnected ? "Sync with Google" : "Connect Google Calendar",
            icon: googleConnected ? <RefreshCw className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />,
            variant: googleConnected ? "secondary" : "primary",
            onClick: googleConnected ? syncGoogleCalendar : connectGoogleCalendar,
            disabled: syncing,
          },
          {
            label: "New Event",
            icon: <Plus className="w-4 h-4 mr-2" />,
            variant: "primary",
            onClick: () => setShowCreateEventModal(true),
          },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Calendar Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={view === 'month' ? 'Previous month' : view === 'week' ? 'Previous week' : 'Previous day'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[300px] text-center transition-all duration-300">
                {formatDateHeader()}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={view === 'month' ? 'Next month' : view === 'week' ? 'Next week' : 'Next day'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors text-sm font-medium"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === 'month'
                    ? 'bg-[#3f72af] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === 'week'
                    ? 'bg-[#3f72af] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === 'day'
                    ? 'bg-[#3f72af] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-[#3f72af] animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <div className="transition-opacity duration-300 ease-in-out">
              {view === 'month' && (
                <>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth().map((date, index) => {
                      const dayEvents = getEventsForDate(date);
                      const today = isToday(date);

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (date) {
                              setSelectedDate(date);
                              setShowEventModal(true);
                            }
                          }}
                          disabled={!date}
                          className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                            !date
                              ? 'bg-gray-50 border-transparent'
                              : today
                              ? 'bg-blue-50 border-[#3f72af] border-2'
                              : 'bg-white border-gray-200 hover:border-[#3f72af] hover:shadow-sm cursor-pointer'
                          }`}
                        >
                          {date && (
                            <div className="h-full flex flex-col">
                              <div className={`text-left text-sm font-semibold mb-2 ${
                                today ? 'text-[#3f72af]' : 'text-gray-900'
                              }`}>
                                {date.getDate()}
                              </div>
                              <div className="space-y-1 flex-1">
                                {dayEvents.slice(0, 3).map(event => (
                                  <div
                                    key={event.id}
                                    className={`text-xs px-2 py-1 rounded bg-${event.color}-100 text-${event.color}-700 truncate text-left`}
                                  >
                                    {event.title}
                                  </div>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-xs text-gray-500 font-medium">
                                    +{dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {view === 'week' && (
                <>
                  {/* Week view */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {getWeekDays().map((date, index) => {
                      const dayEvents = getEventsForDate(date);
                      const today = isToday(date);

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedDate(date);
                            setShowEventModal(true);
                          }}
                          className={`min-h-[400px] p-3 rounded-lg border transition-all ${
                            today
                              ? 'bg-blue-50 border-[#3f72af] border-2'
                              : 'bg-white border-gray-200 hover:border-[#3f72af] hover:shadow-sm cursor-pointer'
                          }`}
                        >
                          <div className="h-full flex flex-col">
                            <div className={`text-left text-lg font-bold mb-3 ${
                              today ? 'text-[#3f72af]' : 'text-gray-900'
                            }`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-2 flex-1 overflow-y-auto">
                              {dayEvents.map(event => {
                                const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return (
                                  <div
                                    key={event.id}
                                    className={`text-xs px-2 py-2 rounded bg-${event.color}-100 text-${event.color}-700 text-left`}
                                  >
                                    <div className="font-semibold">{startTime}</div>
                                    <div className="truncate">{event.title}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {view === 'day' && (
                <>
                  {/* Day view */}
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {currentDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {getCurrentDayEvents().length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No events scheduled for this day</p>
                        </div>
                      ) : (
                        getCurrentDayEvents().map((event) => (
                          <div
                            key={event.id}
                            className="p-6 border-2 border-gray-200 rounded-xl hover:border-[#3f72af] transition-all cursor-pointer"
                            onClick={() => {
                              setSelectedDate(currentDate);
                              setShowEventModal(true);
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${event.color}-100 text-${event.color}-700`}>
                                    {event.type}
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    event.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    event.status === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {event.status}
                                  </div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-xl mb-2">{event.title}</h3>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {' - '}
                                      {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>{event.attendees.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className={`w-1 h-full bg-${event.color}-500 rounded-full flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.start).toLocaleString()}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  event.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  event.status === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {event.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day Events Modal */}
      {showEventModal && selectedDate && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEventModal(false);
            setSelectedDate(null);
          }
        }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </h2>
            </div>
            <div className="p-6">
              {getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No events scheduled</p>
                  <p className="text-gray-400 text-sm">Click "New Event" to add one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map((event) => {
                    const Icon = CalendarIcon;
                    return (
                      <div
                        key={event.id}
                        className="p-4 border border-gray-200 rounded-xl hover:border-[#3f72af] transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{event.attendees.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              event.status === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {event.status}
                            </div>
                            <button
                              onClick={() => {
                                // For now, just show alert. Can be enhanced with edit modal
                                alert(`Edit event: ${event.title}\n\nThis will open the event edit form.`);
                              }}
                              className="px-3 py-1 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors text-xs font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Popup */}
      {showConnectionError && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowConnectionError(false);
          }
        }}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-3 ${
                  connectionErrorMessage.includes('success') 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {connectionErrorMessage.includes('success') ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {connectionErrorMessage.includes('success') 
                      ? 'Success' 
                      : 'Connection Issue'}
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {connectionErrorMessage}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowConnectionError(false)}
                  className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
