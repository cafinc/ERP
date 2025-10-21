import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface Project {
  id: string;
  project_number: string;
  name: string;
  customer_name: string;
  estimate_id: string;
  description?: string;
  tasks: Task[];
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      Alert.alert('Error', 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    
    try {
      setSaving(true);
      await api.post(`/projects/${id}/tasks`, newTask);
      setNewTask({ title: '', description: '' });
      setShowAddTask(false);
      fetchProject();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/projects/${id}/tasks/${taskId}`, { status: newStatus });
      fetchProject();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/projects/${id}/tasks/${taskId}`);
              fetchProject();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#fbbf24';
      case 'active': return Colors.success;
      case 'on_hold': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'cancelled': return Colors.error;
      default: return Colors.gray400;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return Colors.gray400;
      case 'in_progress': return '#3b82f6';
      case 'done': return Colors.success;
      default: return Colors.gray400;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const todoTasks = project.tasks.filter(t => t.status === 'todo');
  const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress');
  const doneTasks = project.tasks.filter(t => t.status === 'done');

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View>
            <Text style={styles.headerSubtitle}>{project.project_number}</Text>
            <Text style={styles.headerTitle}>{project.name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(project.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(project.status) },
              ]}
            >
              {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{project.tasks.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{inProgressTasks.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{doneTasks.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={Colors.gray500} />
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{project.customer_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={20} color={Colors.gray500} />
              <Text style={styles.infoLabel}>From Estimate:</Text>
              <TouchableOpacity onPress={() => router.push(`/estimates/${project.estimate_id}`)}>
                <Text style={[styles.infoValue, { color: Colors.primary }]}>View Estimate</Text>
              </TouchableOpacity>
            </View>
            {project.description && (
              <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                <Ionicons name="information-circle" size={20} color={Colors.gray500} />
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={[styles.infoValue, { flex: 1 }]}>{project.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks ({project.tasks.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddTask(!showAddTask)}
            >
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {/* Add Task Form */}
          {showAddTask && (
            <View style={styles.addTaskCard}>
              <TextInput
                style={styles.input}
                placeholder="Task title *"
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                multiline
                numberOfLines={3}
              />
              <View style={styles.addTaskActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddTask(false);
                    setNewTask({ title: '', description: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddTask}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Add Task</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Task Lists */}
          {project.tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>No tasks yet. Add your first task!</Text>
            </View>
          ) : (
            <>
              {/* To Do */}
              {todoTasks.length > 0 && (
                <View style={styles.taskSection}>
                  <Text style={styles.taskSectionTitle}>📋 To Do ({todoTasks.length})</Text>
                  {todoTasks.map((task) => (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.taskActions}>
                          <TouchableOpacity
                            onPress={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          >
                            <Ionicons name="play-circle" size={24} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                            <Ionicons name="trash" size={20} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* In Progress */}
              {inProgressTasks.length > 0 && (
                <View style={styles.taskSection}>
                  <Text style={styles.taskSectionTitle}>🔄 In Progress ({inProgressTasks.length})</Text>
                  {inProgressTasks.map((task) => (
                    <View key={task.id} style={[styles.taskCard, styles.taskCardInProgress]}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.taskActions}>
                          <TouchableOpacity
                            onPress={() => handleUpdateTaskStatus(task.id, 'done')}
                          >
                            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                            <Ionicons name="trash" size={20} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Done */}
              {doneTasks.length > 0 && (
                <View style={styles.taskSection}>
                  <Text style={styles.taskSectionTitle}>✅ Done ({doneTasks.length})</Text>
                  {doneTasks.map((task) => (
                    <View key={task.id} style={[styles.taskCard, styles.taskCardDone]}>
                      <View style={styles.taskHeader}>
                        <Text style={[styles.taskTitle, styles.taskTitleDone]}>{task.title}</Text>
                        <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                          <Ionicons name="trash" size={20} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                      {task.description && (
                        <Text style={[styles.taskDescription, styles.taskDescriptionDone]}>
                          {task.description}
                        </Text>
                      )}
                      {task.completed_at && (
                        <Text style={styles.completedDate}>
                          Completed: {new Date(task.completed_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );

  if (isWeb) {
    return <WebAdminLayout>{content}</WebAdminLayout>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '10',
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addTaskCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  input: {
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addTaskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  taskSection: {
    marginBottom: 20,
  },
  taskSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskCardInProgress: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  taskCardDone: {
    backgroundColor: Colors.gray50,
    opacity: 0.8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  taskDescriptionDone: {
    color: Colors.gray500,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  completedDate: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 8,
    fontStyle: 'italic',
  },
});