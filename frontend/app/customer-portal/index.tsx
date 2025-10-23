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

export default function CustomerPortalDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { tasks, unreadCount } = useTask();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pending_estimates: 0,
    unpaid_invoices: 0,
    active_work_orders: 0,
    total_due: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch customer-specific stats
      const [estimates, invoices, workOrders] = await Promise.all([
        api.get(`/estimates?customer_id=${currentUser?.id}`),
        api.get(`/invoices?customer_id=${currentUser?.id}&status=unpaid`),
        api.get(`/work-orders?customer_id=${currentUser?.id}&status=active`),
      ]);

      const totalDue = invoices.data.reduce((sum: number, inv: any) => sum + inv.amount, 0);

      setStats({
        pending_estimates: estimates.data.filter((e: any) => e.status === 'pending').length,
        unpaid_invoices: invoices.data.length,
        active_work_orders: workOrders.data.length,
        total_due: totalDue,
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

  const myTasks = tasks.filter(t => t.status !== 'completed');

  const quickActions = [
    { icon: 'document-text', label: 'Estimates', route: '/customer-portal/estimates', color: '#3b82f6' },
    { icon: 'receipt', label: 'Invoices', route: '/customer-portal/invoices', color: '#10b981' },
    { icon: 'construct', label: 'Work Orders', route: '/customer-portal/work-orders', color: '#f59e0b' },
    { icon: 'chatbubbles', label: 'Messages', route: '/customer-portal/communications', color: '#8b5cf6' },
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
              {currentUser?.name || 'Customer'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: theme.colors.background }]}
            onPress={() => router.push('/customer-portal/notifications' as any)}
          >
            <Ionicons name="notifications" size={24} color={theme.colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' + '20' }]}>
              <Ionicons name="document-text" size={24} color="#3b82f6" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.pending_estimates}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending Estimates</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10b981' + '20' }]}>
              <Ionicons name="receipt" size={24} color="#10b981" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.unpaid_invoices}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Unpaid Invoices</Text>
          </View>

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
            <View style={[styles.statIconContainer, { backgroundColor: '#ef4444' + '20' }]}>
              <Ionicons name="cash" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              ${stats.total_due.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Due</Text>
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

        {/* My Tasks */}
        {myTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>My Tasks</Text>
              <TouchableOpacity onPress={() => router.push('/tasks' as any)}>
                <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {myTasks.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => router.push(`/tasks/${task.id}` as any)}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.primary} />
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: theme.colors.textPrimary }]}>{task.title}</Text>
                  <Text style={[styles.taskMeta, { color: theme.colors.textSecondary }]}>
                    {task.priority.toUpperCase()} • {task.type.replace('_', ' ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#10b981' }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: theme.colors.textPrimary }]}>Estimate EST-001 sent</Text>
                <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#3b82f6' }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: theme.colors.textPrimary }]}>Work order WO-123 completed</Text>
                <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>Yesterday</Text>
              </View>
            </View>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  activityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
});