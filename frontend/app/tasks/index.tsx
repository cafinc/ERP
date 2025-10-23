import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTask } from '../../contexts/TaskContext';
import TaskCard from '../../components/TaskCard';

export default function TasksScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { tasks, loading, fetchTasks, refreshTasks } = useTask();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter]);

  const loadTasks = () => {
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (priorityFilter !== 'all') filters.priority = priorityFilter;
    if (searchQuery) filters.search = searchQuery;
    fetchTasks(filters);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadTasks();
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const statusOptions = [
    { value: 'all', label: 'All', count: tasks.length },
    { value: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { value: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'urgent', label: '🚨 Urgent' },
    { value: 'high', label: '⚡ High' },
    { value: 'medium', label: '📋 Medium' },
    { value: 'low', label: '📝 Low' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Tasks</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/tasks/create' as any)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search tasks..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              loadTasks();
            }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: statusFilter === option.value ? theme.colors.primary : theme.colors.surface,
                  borderColor: statusFilter === option.value ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setStatusFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === option.value ? 'white' : theme.colors.textPrimary },
                ]}
              >
                {option.label}
              </Text>
              <View style={[
                styles.countBadge,
                { backgroundColor: statusFilter === option.value ? 'rgba(255,255,255,0.3)' : theme.colors.gray100 }
              ]}>
                <Text style={[
                  styles.countText,
                  { color: statusFilter === option.value ? 'white' : theme.colors.textSecondary }
                ]}>
                  {option.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Priority Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {priorityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: priorityFilter === option.value ? theme.colors.primary : theme.colors.surface,
                  borderColor: priorityFilter === option.value ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setPriorityFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: priorityFilter === option.value ? 'white' : theme.colors.textPrimary },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No tasks found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first task to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push('/tasks/create' as any)}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyButtonText}>Create Task</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
  },
  filtersScroll: {
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});