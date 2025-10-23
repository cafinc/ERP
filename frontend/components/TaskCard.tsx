import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Task } from '../contexts/TaskContext';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      case 'overdue': return '#ef4444';
      default: return theme.colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work_order': return 'construct';
      case 'estimate': return 'document-text';
      case 'invoice': return 'receipt';
      case 'form': return 'clipboard';
      case 'project': return 'briefcase';
      case 'maintenance': return 'build';
      case 'inspection': return 'checkmark-circle';
      default: return 'document';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => router.push(`/tasks/${task.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Priority Indicator */}
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={getTypeIcon(task.type) as any} size={20} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {task.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
            {task.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Description */}
      {task.description && (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {task.due_date && (
            <View style={[styles.dateContainer, isOverdue && styles.overdueContainer]}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={isOverdue ? '#ef4444' : theme.colors.textSecondary} 
              />
              <Text style={[styles.dateText, { color: isOverdue ? '#ef4444' : theme.colors.textSecondary }]}>
                {formatDate(task.due_date)}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueContainer: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
});