'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Clock,
  CheckSquare,
  Briefcase,
  Wrench,
  PlayCircle,
  StopCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function CrewPortalPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    active_work_orders: 0,
    pending_tasks: 0,
    hours_today: 0,
    is_clocked_in: false,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedInTime, setClockedInTime] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const crewId = userResponse.data.id;

      const [workOrders, tasksRes, timeEntries] = await Promise.all([
        api.get(`/work-orders?crew_id=${crewId}`).catch(() => ({ data: [] })),
        api.get(`/tasks?assigned_to=${crewId}`).catch(() => ({ data: [] })),
        api.get(`/time-entries?user_id=${crewId}&date=${new Date().toISOString().split('T')[0]}`).catch(() => ({ data: [] })),
      ]);

      const activeWorkOrders = (workOrders.data || []).filter((w: any) => 
        w.status === 'active' || w.status === 'in_progress'
      ).length;
      
      const pendingTasks = (tasksRes.data || []).filter((t: any) => 
        t.status === 'pending' || t.status === 'in_progress'
      ).length;

      const entries = timeEntries.data || [];
      const hoursToday = entries.reduce((sum: number, entry: any) => {
        if (entry.clock_out) {
          const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      const activeEntry = entries.find((e: any) => !e.clock_out);
      const isClockedIn = !!activeEntry;

      setStats({
        active_work_orders: activeWorkOrders,
        pending_tasks: pendingTasks,
        hours_today: hoursToday,
        is_clocked_in: isClockedIn,
      });

      if (activeEntry) {
        setClockedInTime(activeEntry.clock_in);
      }

      setTasks((tasksRes.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = async () => {
    try {
      if (stats.is_clocked_in) {
        await api.post('/time-entries/clock-out', {
          entry_id: 'current',
          clock_out: new Date().toISOString(),
        });
      } else {
        const userResponse = await api.get('/auth/me');
        await api.post('/time-entries/clock-in', {
          user_id: userResponse.data.id,
          user_name: userResponse.data.name,
          clock_in: new Date().toISOString(),
        });
      }
      loadDashboard();
    } catch (error) {
      console.error('Error with clock action:', error);
    }
  };

  const quickActions = [
    { icon: CheckSquare, label: 'My Tasks', route: '/crew-portal/tasks', color: 'blue' },
    { icon: Briefcase, label: 'Work Orders', route: '/crew-portal/work-orders', color: 'orange' },
    { icon: Clock, label: 'Time Tracking', route: '/crew-portal/time-tracking', color: 'green' },
    { icon: Tool, label: 'Equipment', route: '/crew-portal/equipment', color: 'purple' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Crew Portal"
        subtitle="Manage crew portal"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Crew Portal" }]}
        title="Crew Portal"
        description="Welcome to your crew dashboard"
          />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Clock Card */}
        <div className={`rounded-lg shadow border-2 p-6 mb-8 ${
          stats.is_clocked_in ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                stats.is_clocked_in ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {stats.is_clocked_in ? 'Clocked In' : 'Not Clocked In'}
                </h3>
                <p className="text-gray-600">{stats.hours_today.toFixed(1)} hours today</p>
                {stats.is_clocked_in && clockedInTime && (
                  <p className="text-sm text-gray-500">
                    Since {new Date(clockedInTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClockAction}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors flex items-center gap-2 ${
                stats.is_clocked_in ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}>
              {stats.is_clocked_in ? (
                <><StopCircle className="w-5 h-5" /> Clock Out</>
              ) : (
                <><PlayCircle className="w-5 h-5" /> Clock In</>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.active_work_orders}</h3>
            <p className="text-sm text-gray-600">Active Work Orders</p>
          </div>

          <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</h3>
            <p className="text-sm text-gray-600">Pending Tasks</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.route)}
                className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg ${getColorClasses(action.color)} flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">{action.label}</h3>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Tasks */}
          {tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Today\'s Tasks</h2>
                <button
                  onClick={() => router.push('/crew-portal/tasks')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 divide-y hover:shadow-md transition-shadow">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${getPriorityColor(task.priority)}`}></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600">
                          {task.type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Reminder */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Safety First</h2>
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Safety Reminder</h3>
                  <p className="text-sm text-gray-700">
                    Always wear proper safety equipment and follow all safety protocols. Your safety is our top priority.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
