'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import {
  Plus,
  Search,
  Eye,
  Users,
  RefreshCw,
  Calendar,
  User,
  Edit,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function SafetyMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([
    {
      id: '1',
      meeting_number: 'SM-2025-001',
      type: 'Toolbox Talk',
      date: '2025-01-15',
      topic: 'Winter Driving Safety',
      facilitator: 'John Smith',
      attendees: 12,
      duration: 30,
      location: 'Main Office',
    },
    {
      id: '2',
      meeting_number: 'SM-2025-002',
      type: 'Safety Committee',
      date: '2025-01-20',
      topic: 'Monthly Safety Review',
      facilitator: 'Sarah Williams',
      attendees: 8,
      duration: 60,
      location: 'Conference Room',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'Toolbox Talk': 'bg-blue-100 text-blue-700',
      'Safety Committee': 'bg-purple-100 text-purple-700',
      'Emergency Drill': 'bg-red-100 text-red-700',
      'Training Session': 'bg-green-100 text-green-700',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      meeting.meeting_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || meeting.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="Safety Meetings"
          icon={Users}
          badges={[
            { label: `${meetings.length} Meetings`, color: 'blue' },
            { label: `${meetings.reduce((sum, m) => sum + m.attendees, 0)} Total Attendees`, color: 'green' },
          ]}
          actions={[
            {
              label: 'Schedule Meeting',
              icon: Plus,
              onClick: () => router.push('/safety/meetings/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Meeting Type Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({meetings.length})
            </button>
            <button
              onClick={() => setFilterType('Toolbox Talk')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'Toolbox Talk'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toolbox Talks ({meetings.filter(m => m.type === 'Toolbox Talk').length})
            </button>
            <button
              onClick={() => setFilterType('Safety Committee')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'Safety Committee'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Committee ({meetings.filter(m => m.type === 'Safety Committee').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
          {filteredMeetings.map((meeting, index) => (
            <div
              key={meeting.id || `meeting-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/safety/meetings/${meeting.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{meeting.meeting_number}</h3>
                    <p className="text-sm text-gray-600 truncate">{meeting.topic}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(meeting.type)}`}>
                  {meeting.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(meeting.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Facilitator: {meeting.facilitator}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{meeting.attendees} Attendees</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{meeting.duration} minutes</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/meetings/${meeting.id}`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/meetings/${meeting.id}/edit`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
