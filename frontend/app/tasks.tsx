import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import WebAdminLayout from '../components/WebAdminLayout';
import { Colors } from '../utils/theme';
import api from '../utils/api';

interface TaskList {
  id: string;
  title: string;
  updated: string;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
  parent?: string;
  position: string;
}

interface GoogleTaskData {
  list_info: TaskList;
  tasks: Task[];
}

interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  status: 'todo' | 'in_progress' | 'done';
  google_tasks_id?: string;
  google_tasks_list_id?: string;
  created_at: string;
  completed_at?: string;
}

interface Project {
  id: string;
  project_number: string;
  name: string;
  customer_id: string;
  customer_name: string;
  tasks: ProjectTask[];
  status: string;
  google_tasks_project_list_id?: string;
}

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Google Tasks connection
  const [connected, setConnected] = useState(false);
  const [googleTasksData, setGoogleTasksData] = useState<Record<string, GoogleTaskData>>({});
  
  // Projects with tasks
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'personal' | string>('all'); // 'all', 'personal', or project_id
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check Google Tasks connection status
      const statusRes = await api.get('/google-tasks/status');
      setConnected(statusRes.data.connected);
      
      // If connected, load Google Tasks
      if (statusRes.data.connected) {
        await loadGoogleTasks();
      }
      
      // Load projects with tasks
      await loadProjects();
      
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleTasks = async () => {
    try {
      const res = await api.post('/google-tasks/sync');
      if (res.data.success) {
        setGoogleTasksData(res.data.data || {});
      }
    } catch (error: any) {
      console.error('Error loading Google Tasks:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (error: any) {
      console.error('Error loading projects:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await loadGoogleTasks();
      Alert.alert('Success', 'Tasks synced successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sync tasks');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectGoogleTasks = async () => {
    try {
      const res = await api.get('/google-tasks/connect');
      if (res.data.authorization_url) {
        // Open authorization URL in browser
        if (Platform.OS === 'web') {
          window.open(res.data.authorization_url, '_blank');
        } else {
          Alert.alert('Connect Google Tasks', 'Please open this URL in your browser to connect Google Tasks.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to initiate Google Tasks connection');
    }
  };

  const handleToggleTaskStatus = async (task: any, isProjectTask: boolean, projectId?: string) => {
    try {
      if (isProjectTask && projectId) {
        // Toggle project task status
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        await api.put(`/projects/${projectId}/tasks/${task.id}`, { status: newStatus });
        await loadProjects();
      } else {
        // Toggle Google Tasks status
        // Note: This would require implementing a direct Google Tasks update endpoint
        Alert.alert('Info', 'Update Google Tasks status directly in Google Tasks for now');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  // Filter and combine all tasks
  const getAllTasks = (): any[] => {
    let allTasks: any[] = [];
    
    // Add Google Tasks (personal tasks)
    if (connected && googleTasksData) {
      Object.entries(googleTasksData).forEach(([listId, data]) => {
        data.tasks.forEach(task => {
          // Skip if it's a project-linked task list
          const isProjectList = projects.some(p => p.google_tasks_project_list_id === listId);
          if (!isProjectList) {
            allTasks.push({
              ...task,
              type: 'personal',
              listName: data.list_info.title,
              listId: listId,
              // Normalize status for filtering
              normalizedStatus: task.status === 'completed' ? 'done' : 'todo',
            });
          }
        });
      });
    }
    
    // Add project tasks
    projects.forEach(project => {
      project.tasks?.forEach(task => {
        allTasks.push({
          ...task,
          type: 'project',
          projectName: project.name,
          projectId: project.id,
          normalizedStatus: task.status,
        });
      });
    });
    
    // Apply filters
    if (filterType !== 'all') {
      if (filterType === 'personal') {
        allTasks = allTasks.filter(t => t.type === 'personal');
      } else {
        // Filter by project ID
        allTasks = allTasks.filter(t => t.projectId === filterType);
      }
    }
    
    if (filterStatus !== 'all') {
      allTasks = allTasks.filter(t => t.normalizedStatus === filterStatus);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allTasks = allTasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.notes && t.notes.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }
    
    // Sort by status (todo first, then in_progress, then done)
    allTasks.sort((a, b) => {
      const statusOrder = { todo: 0, in_progress: 1, needsAction: 0, completed: 2, done: 2 };
      return statusOrder[a.normalizedStatus] - statusOrder[b.normalizedStatus];
    });
    
    return allTasks;
  };

  const tasks = getAllTasks();

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.normalizedStatus === 'todo' || t.normalizedStatus === 'needsAction');
  const inProgressTasks = tasks.filter(t => t.normalizedStatus === 'in_progress');
  const doneTasks = tasks.filter(t => t.normalizedStatus === 'done' || t.normalizedStatus === 'completed');

  const renderTask = (task: any) => {
    const isPersonal = task.type === 'personal';
    const isDone = task.normalizedStatus === 'done' || task.normalizedStatus === 'completed';
    
    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskCard, isDone && styles.taskCardDone]}
        onPress={() => handleToggleTaskStatus(task, !isPersonal, task.projectId)}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskCheckbox}>
            {isDone ? (
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            ) : (
              <Ionicons name="radio-button-off" size={24} color={Colors.textSecondary} />
            )}
          </View>
          <View style={styles.taskContent}>
            <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>
            {(task.notes || task.description) && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.notes || task.description}
              </Text>
            )}
            <View style={styles.taskMeta}>
              <View style={[styles.taskBadge, isPersonal ? styles.personalBadge : styles.projectBadge]}>
                <Ionicons 
                  name={isPersonal ? "person" : "briefcase"} 
                  size={12} 
                  color={isPersonal ? Colors.primary : Colors.secondary}
                />
                <Text style={[styles.taskBadgeText, isPersonal ? styles.personalBadgeText : styles.projectBadgeText]}>
                  {isPersonal ? task.listName : task.projectName}
                </Text>
              </View>
              {task.assignee_name && (
                <View style={styles.assigneeBadge}>
                  <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.assigneeText}>{task.assignee_name}</Text>
                </View>
              )}
              {(task.due || task.due_date) && (
                <View style={styles.dueDateBadge}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.dueDateText}>
                    {new Date(task.due || task.due_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterOptions = () => {
    const filterOptions = [
      { label: 'All Tasks', value: 'all' },
      { label: 'Personal', value: 'personal' },
      ...projects.map(p => ({ label: p.name, value: p.id })),
    ];
    
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                filterType === option.value && styles.filterChipActive,
              ]}
              onPress={() => setFilterType(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.statusFilterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          {['all', 'todo', 'in_progress', 'done'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilterChip,
                filterStatus === status && styles.statusFilterChipActive,
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  filterStatus === status && styles.statusFilterTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 Tasks</Text>
        <View style={styles.headerActions}>
          {connected && (
            <TouchableOpacity 
              style={styles.syncButton} 
              onPress={handleSync}
              disabled={syncing}
            >
              <Ionicons 
                name="sync" 
                size={20} 
                color={Colors.primary} 
              />
              {syncing && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="filter" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status */}
      {!connected && (
        <TouchableOpacity style={styles.connectBanner} onPress={handleConnectGoogleTasks}>
          <Ionicons name="link-outline" size={24} color={Colors.primary} />
          <View style={styles.connectBannerText}>
            <Text style={styles.connectBannerTitle}>Connect Google Tasks</Text>
            <Text style={styles.connectBannerSubtitle}>Sync your tasks with Google Tasks for two-way sync</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      {showFilters && renderFilterOptions()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* TODO Section */}
          {todoTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: Colors.warning }]} />
                <Text style={styles.sectionTitle}>TO DO ({todoTasks.length})</Text>
              </View>
              {todoTasks.map(renderTask)}
            </View>
          )}

          {/* IN PROGRESS Section */}
          {inProgressTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: Colors.info }]} />
                <Text style={styles.sectionTitle}>IN PROGRESS ({inProgressTasks.length})</Text>
              </View>
              {inProgressTasks.map(renderTask)}
            </View>
          )}

          {/* DONE Section */}
          {doneTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: Colors.success }]} />
                <Text style={styles.sectionTitle}>DONE ({doneTasks.length})</Text>
              </View>
              {doneTasks.map(renderTask)}
            </View>
          )}

          {tasks.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No tasks found</Text>
              <Text style={styles.emptyStateSubtext}>
                {connected ? 'Create tasks in your projects or Google Tasks' : 'Connect Google Tasks to get started'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  // Render with layout based on platform
  if (Platform.OS === 'web' && user?.role === 'admin') {
    return <WebAdminLayout>{content}</WebAdminLayout>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  connectBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  connectBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  connectBannerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  filterContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statusFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  statusFilterChipActive: {
    backgroundColor: Colors.secondary,
  },
  statusFilterText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  statusIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  taskCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskCardDone: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  personalBadge: {
    backgroundColor: Colors.primaryLight,
  },
  projectBadge: {
    backgroundColor: Colors.secondaryLight,
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  personalBadgeText: {
    color: Colors.primary,
  },
  projectBadgeText: {
    color: Colors.secondary,
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.backgroundSecondary,
    gap: 4,
  },
  assigneeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.backgroundSecondary,
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
