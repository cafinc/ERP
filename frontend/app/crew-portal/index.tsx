import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import api from '../../utils/api';

export default function CrewPortalDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { tasks, unreadCount } = useTask();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    active_work_orders: 0,
    pending_tasks: 0,
    hours_today: 0,
    is_clocked_in: false,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [workOrders, timeEntries] = await Promise.all([
        api.get(`/work-orders?crew_id=${currentUser?.id}&status=active,in_progress`),
        api.get(`/time-entries?user_id=${currentUser?.id}&date=${new Date().toISOString().split('T')[0]}`),
      ]);

      const hoursToday = timeEntries.data.reduce((sum: number, entry: any) => {
        if (entry.clock_out) {
          const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      const isClockedIn = timeEntries.data.some((entry: any) => !entry.clock_out);

      setStats({
        active_work_orders: workOrders.data.length,
        pending_tasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
        hours_today: hoursToday,
        is_clocked_in: isClockedIn,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const todaysTasks = tasks.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled'
  ).slice(0, 5);

  const quickActions = [
    { icon: 'clipboard', label: 'My Tasks', route: '/crew-portal/tasks', color: '#3b82f6' },
    { icon: 'construct', label: 'Work Orders', route: '/crew-portal/work-orders', color: '#f59e0b' },
    { icon: 'time', label: 'Time Clock', route: '/crew-portal/time-tracking', color: '#10b981' },
    { icon: 'build', label: 'Equipment', route: '/crew-portal/equipment', color: '#8b5cf6' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
              {currentUser?.name || 'Crew Member'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: theme.colors.background }]}
            onPress={() => router.push('/crew-portal/notifications' as any)}
          >
            <Ionicons name="notifications" size={24} color={theme.colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Time Clock Status */}
        <View style={[styles.timeClockCard, { 
          backgroundColor: stats.is_clocked_in ? '#10b981' + '20' : theme.colors.surface,
          borderColor: stats.is_clocked_in ? '#10b981' : theme.colors.border 
        }]}>
          <View style={styles.timeClockLeft}>
            <View style={[styles.clockIcon, { backgroundColor: stats.is_clocked_in ? '#10b981' : '#6b7280' }]}>
              <Ionicons name="time" size={28} color="white" />
            </View>
            <View>
              <Text style={[styles.clockStatus, { color: theme.colors.textPrimary }]}>
                {stats.is_clocked_in ? 'Clocked In' : 'Not Clocked In'}
              </Text>
              <Text style={[styles.clockHours, { color: theme.colors.textSecondary }]}>
                {stats.hours_today.toFixed(1)} hours today
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.clockButton, { 
              backgroundColor: stats.is_clocked_in ? '#ef4444' : '#10b981'
            }]}
            onPress={() => router.push('/crew-portal/time-tracking' as any)}
          >
            <Text style={styles.clockButtonText}>
              {stats.is_clocked_in ? 'Clock Out' : 'Clock In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b' + '20' }]}>
              <Ionicons name="construct" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.active_work_orders}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active Work Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' + '20' }]}>
              <Ionicons name="clipboard" size={24} color="#3b82f6" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.pending_tasks}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending Tasks</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Tasks */}
        {todaysTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Today's Tasks</Text>
              <TouchableOpacity onPress={() => router.push('/crew-portal/tasks' as any)}>
                <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {todaysTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => router.push(`/tasks/${task.id}` as any)}
              >
                <View style={[styles.taskPriorityDot, { backgroundColor: 
                  task.priority === 'urgent' ? '#ef4444' :
                  task.priority === 'high' ? '#f59e0b' :
                  task.priority === 'medium' ? '#3b82f6' : '#6b7280'
                }]} />
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: theme.colors.textPrimary }]}>{task.title}</Text>
                  <Text style={[styles.taskMeta, { color: theme.colors.textSecondary }]}>
                    {task.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Safety Tip */}
        <View style={[styles.safetyCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
          <Ionicons name="warning" size={24} color="#f59e0b" />
          <View style={styles.safetyContent}>
            <Text style={[styles.safetyTitle, { color: '#92400e' }]}>Safety First!</Text>
            <Text style={[styles.safetyText, { color: '#78350f' }]}>
              Always wear proper safety equipment and follow protocols.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  timeClockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  timeClockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  clockHours: {
    fontSize: 14,
  },
  clockButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clockButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  taskPriorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 12,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});