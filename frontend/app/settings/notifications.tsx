import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import SuccessOverlay from '../../components/SuccessOverlay';

interface NotificationPreference {
  key: string;
  title: string;
  description: string;
  icon: any;
  category: string;
}

const NOTIFICATION_TYPES: NotificationPreference[] = [
  {
    key: 'dispatch_assignments',
    title: 'Dispatch Assignments',
    description: 'New route assignments and dispatch notifications',
    icon: 'navigate-circle',
    category: 'Work & Routes',
  },
  {
    key: 'route_updates',
    title: 'Route Updates',
    description: 'Changes to your assigned routes',
    icon: 'swap-horizontal',
    category: 'Work & Routes',
  },
  {
    key: 'shift_reminders',
    title: 'Shift Reminders',
    description: 'Upcoming shift start and end reminders',
    icon: 'time',
    category: 'Work & Routes',
  },
  {
    key: 'weather_alerts',
    title: 'Weather Alerts',
    description: 'Severe weather and snow storm warnings',
    icon: 'rainy',
    category: 'Alerts',
  },
  {
    key: 'emergency_notifications',
    title: 'Emergency Notifications',
    description: 'Critical urgent alerts (always recommended)',
    icon: 'warning',
    category: 'Alerts',
  },
  {
    key: 'equipment_alerts',
    title: 'Equipment Alerts',
    description: 'Equipment maintenance and status updates',
    icon: 'construct',
    category: 'System',
  },
  {
    key: 'customer_messages',
    title: 'Customer Messages',
    description: 'New messages and feedback from customers',
    icon: 'chatbubbles',
    category: 'System',
  },
  {
    key: 'system_updates',
    title: 'System Updates',
    description: 'App updates and new features',
    icon: 'notifications',
    category: 'System',
  },
];

export default function NotificationCenterScreen() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [preferences, setPreferences] = useState<any>({});

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get(`/users/${currentUser?.id}/notification-preferences`);
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string, channel: 'email' | 'sms' | 'inapp') => {
    const prefKey = `${key}_${channel}`;
    setPreferences({
      ...preferences,
      [prefKey]: !preferences[prefKey],
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/users/${currentUser?.id}/notification-preferences`, preferences);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Work & Routes':
        return 'briefcase';
      case 'Alerts':
        return 'alert-circle';
      case 'System':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Work & Routes':
        return '#3b82f6';
      case 'Alerts':
        return '#f59e0b';
      case 'System':
        return '#8b5cf6';
      default:
        return Colors.primary;
    }
  };

  const groupedNotifications = NOTIFICATION_TYPES.reduce((acc, notif) => {
    if (!acc[notif.category]) {
      acc[notif.category] = [];
    }
    acc[notif.category].push(notif);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Manage how you receive notifications. You can enable or disable notifications by Email, SMS, or In-App for each alert type.
          </Text>
        </View>

        {Object.entries(groupedNotifications).map(([category, notifications]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Ionicons
                name={getCategoryIcon(category)}
                size={20}
                color={getCategoryColor(category)}
              />
              <Text style={[styles.categoryTitle, { color: getCategoryColor(category) }]}>
                {category}
              </Text>
            </View>

            {notifications.map((notif) => (
              <View key={notif.key} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={notif.icon} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                    <Text style={styles.notificationDescription}>{notif.description}</Text>
                  </View>
                </View>

                <View style={styles.togglesContainer}>
                  <View style={styles.toggleRow}>
                    <Ionicons name="mail" size={18} color={Colors.textSecondary} />
                    <Text style={styles.toggleLabel}>Email</Text>
                    <Switch
                      value={preferences[`${notif.key}_email`]}
                      onValueChange={() => handleToggle(notif.key, 'email')}
                      trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
                      thumbColor={preferences[`${notif.key}_email`] ? Colors.primary : Colors.gray400}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <Ionicons name="chatbubble" size={18} color={Colors.textSecondary} />
                    <Text style={styles.toggleLabel}>SMS</Text>
                    <Switch
                      value={preferences[`${notif.key}_sms`]}
                      onValueChange={() => handleToggle(notif.key, 'sms')}
                      trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
                      thumbColor={preferences[`${notif.key}_sms`] ? Colors.primary : Colors.gray400}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <Ionicons name="notifications" size={18} color={Colors.textSecondary} />
                    <Text style={styles.toggleLabel}>In-App</Text>
                    <Switch
                      value={preferences[`${notif.key}_inapp`]}
                      onValueChange={() => handleToggle(notif.key, 'inapp')}
                      trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
                      thumbColor={preferences[`${notif.key}_inapp`] ? Colors.primary : Colors.gray400}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <SuccessOverlay
        visible={showSuccess}
        title="Preferences Saved!"
        message="Your notification preferences have been updated"
        onClose={() => setShowSuccess(false)}
      />
    </View>
  );
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  togglesContainer: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    gap: 8,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray400,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
