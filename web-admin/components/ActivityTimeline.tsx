'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  MapPin,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  Calendar,
  Activity,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'note' | 'email' | 'call' | 'meeting' | 'status_change' | 'document' | 'payment' | 'site_visit';
  title: string;
  description: string;
  user_name?: string;
  created_at: string;
  metadata?: any;
}

interface ActivityTimelineProps {
  relatedTo: 'lead' | 'customer' | 'site';
  relatedId: string;
}

export default function ActivityTimeline({ relatedTo, relatedId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTimeline();
  }, [relatedId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      // Mock data for now - in production would call api.get(`/activity-timeline?related_to=${relatedTo}&related_id=${relatedId}`)
      const mockEvents: TimelineEvent[] = [
        {
          id: '1',
          type: 'note',
          title: 'Initial Contact',
          description: 'Customer reached out via website contact form',
          user_name: 'John Doe',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '2',
          type: 'call',
          title: 'Follow-up Call',
          description: 'Discussed pricing and service options. Customer interested in snow removal package.',
          user_name: 'Jane Smith',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          type: 'email',
          title: 'Quote Sent',
          description: 'Sent detailed quote for seasonal snow removal services',
          user_name: 'System',
          created_at: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: '4',
          type: 'status_change',
          title: 'Status Updated',
          description: 'Status changed from "New" to "Contacted"',
          user_name: 'Jane Smith',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        type: 'note',
        title: 'Note Added',
        description: noteText,
        user_name: 'Current User',
        created_at: new Date().toISOString(),
      };

      // In production: await api.post('/activity-timeline', { ...newEvent, related_to: relatedTo, related_id: relatedId });
      setEvents([newEvent, ...events]);
      setNoteText('');
      setShowAddNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'note': return <MessageSquare className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'call': return <Phone className="w-5 h-5" />;
      case 'meeting': return <Calendar className="w-5 h-5" />;
      case 'status_change': return <Activity className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'payment': return <DollarSign className="w-5 h-5" />;
      case 'site_visit': return <MapPin className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'note': return 'bg-blue-100 text-blue-600';
      case 'email': return 'bg-purple-100 text-purple-600';
      case 'call': return 'bg-green-100 text-green-600';
      case 'meeting': return 'bg-yellow-100 text-yellow-600';
      case 'status_change': return 'bg-orange-100 text-orange-600';
      case 'document': return 'bg-gray-100 text-gray-600';
      case 'payment': return 'bg-emerald-100 text-emerald-600';
      case 'site_visit': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
        <button
          onClick={() => setShowAddNote(!showAddNote)}
          className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this interaction..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Note
            </button>
            <button
              onClick={() => {
                setShowAddNote(false);
                setNoteText('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[#3f72af] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('note')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'note'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => setFilter('call')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'call'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Calls
        </button>
        <button
          onClick={() => setFilter('email')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'email'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Emails
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />

        {/* Events */}
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No activity yet</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={event.id} className="relative pl-16">
                {/* Icon */}
                <div className={`absolute left-0 top-1 w-12 h-12 rounded-xl ${getEventColor(event.type)} flex items-center justify-center z-10 shadow-sm`}>
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{event.user_name || 'Unknown'}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(event.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
