import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTask, Task } from '../../contexts/TaskContext';
import api from '../../utils/api';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { refreshTasks } = useTask();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchTask();
    fetchComments();
    fetchActivities();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/comments`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/tasks/${id}/activities`);
      setActivities(response.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentUser || !task) return;
    
    try {
      setUpdating(true);
      await api.put(`/tasks/${id}?user_id=${currentUser.id}&user_name=${currentUser.name || currentUser.email}`, {
        status: newStatus,
      });
      await fetchTask();
      await refreshTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !currentUser) return;
    
    try {
      await api.post(`/tasks/${id}/comments?user_id=${currentUser.id}&user_name=${currentUser.name || currentUser.email}`, {
        task_id: id as string,
        content: comment,
        attachments: [],
        mentions: [],
      });
      setComment('');
      await fetchComments();
      await fetchActivities();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

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
      default: return theme.colors.textSecondary;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const statusOptions = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>Task not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Task Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Task Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.taskTitle, { color: theme.colors.textPrimary }]}>{task.title}</Text>
          
          {task.description && (
            <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
              {task.description}
            </Text>
          )}

          {/* Metadata */}
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>Priority</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>Type</Text>
              <Text style={[styles.metadataValue, { color: theme.colors.textPrimary }]}>
                {task.type.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>Created</Text>
              <Text style={[styles.metadataValue, { color: theme.colors.textPrimary }]}>
                {formatDate(task.created_at).split(',')[0]}
              </Text>
            </View>

            {task.due_date && (
              <View style={styles.metadataItem}>
                <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.metadataValue, { color: theme.colors.textPrimary }]}>
                  {formatDate(task.due_date).split(',')[0]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Update */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Status</Text>
          <View style={styles.statusGrid}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: task.status === status ? getStatusColor(status) : theme.colors.background,
                    borderColor: task.status === status ? getStatusColor(status) : theme.colors.border,
                  },
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={updating}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    { color: task.status === status ? 'white' : theme.colors.textPrimary },
                  ]}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comments */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Comments ({comments.length})
          </Text>

          {/* Comment Input */}
          <View style={styles.commentInput}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.colors.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.colors.primary, opacity: comment.trim() ? 1 : 0.5 }]}
              onPress={handleAddComment}
              disabled={!comment.trim()}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.map((commentItem) => (
            <View key={commentItem.id} style={[styles.commentItem, { borderTopColor: theme.colors.border }]}>
              <View style={styles.commentHeader}>
                <Text style={[styles.commentAuthor, { color: theme.colors.textPrimary }]}>
                  {commentItem.user_name}
                </Text>
                <Text style={[styles.commentTime, { color: theme.colors.textTertiary }]}>
                  {formatDate(commentItem.created_at)}
                </Text>
              </View>
              <Text style={[styles.commentContent, { color: theme.colors.textSecondary }]}>
                {commentItem.content}
              </Text>
            </View>
          ))}
        </View>

        {/* Activity Log */}
        {activities.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Activity Log</Text>
            {activities.map((activity, index) => (
              <View key={index} style={[styles.activityItem, { borderLeftColor: theme.colors.primary }]}>
                <Text style={[styles.activityText, { color: theme.colors.textPrimary }]}>
                  <Text style={{ fontWeight: '600' }}>{activity.user_name}</Text> {activity.action}
                </Text>
                <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>
                  {formatDate(activity.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  taskDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metadataItem: {
    minWidth: '45%',
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 48,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityItem: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginBottom: 12,
    paddingBottom: 12,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
