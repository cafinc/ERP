import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import api from '../../utils/api';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { refreshTasks } = useTask();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium',
    due_date: '',
    assigned_to: [] as string[],
  });

  const taskTypes = [
    { value: 'general', label: 'General', icon: 'document' },
    { value: 'work_order', label: 'Work Order', icon: 'construct' },
    { value: 'estimate', label: 'Estimate', icon: 'document-text' },
    { value: 'invoice', label: 'Invoice', icon: 'receipt' },
    { value: 'form', label: 'Form', icon: 'clipboard' },
    { value: 'project', label: 'Project', icon: 'briefcase' },
    { value: 'maintenance', label: 'Maintenance', icon: 'build' },
    { value: 'inspection', label: 'Inspection', icon: 'checkmark-circle' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#6b7280', icon: '📝' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', icon: '📋' },
    { value: 'high', label: 'High', color: '#f59e0b', icon: '⚡' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', icon: '🚨' },
  ];

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create tasks');
      return;
    }

    try {
      setLoading(true);
      await api.post('/tasks', {
        ...formData,
        assigned_by: currentUser.id,
        assigned_by_name: currentUser.name || currentUser.email,
        assigned_to: formData.assigned_to.length > 0 ? formData.assigned_to : [currentUser.id],
      });

      await refreshTasks();
      Alert.alert('Success', 'Task created successfully');
      router.back();
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Create Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Title *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Enter task title"
            placeholderTextColor={theme.colors.textTertiary}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Description</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Enter task description"
            placeholderTextColor={theme.colors.textTertiary}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Task Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {taskTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: formData.type === type.value ? theme.colors.primary : theme.colors.surface,
                    borderColor: formData.type === type.value ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, type: type.value })}
              >
                <Ionicons
                  name={type.icon as any}
                  size={18}
                  color={formData.type === type.value ? 'white' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: formData.type === type.value ? 'white' : theme.colors.textPrimary },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Priority</Text>
          <View style={styles.priorityGrid}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.priorityCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: formData.priority === priority.value ? priority.color : theme.colors.border,
                    borderWidth: formData.priority === priority.value ? 2 : 1,
                  },
                ]}
                onPress={() => setFormData({ ...formData, priority: priority.value })}
              >
                <Text style={styles.priorityIcon}>{priority.icon}</Text>
                <Text
                  style={[
                    styles.priorityLabel,
                    {
                      color: formData.priority === priority.value ? priority.color : theme.colors.textPrimary,
                      fontWeight: formData.priority === priority.value ? '600' : '400',
                    },
                  ]}
                >
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textPrimary }]}>  
            Task will be assigned to you by default. You can change assignees after creation.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.colors.border }]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.textPrimary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButtonFooter, { backgroundColor: theme.colors.primary, opacity: loading ? 0.6 : 1 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Task</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    gap: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priorityCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  priorityIcon: {
    fontSize: 28,
  },
  priorityLabel: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonFooter: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});