import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationPreferences {
  pushEnabled: boolean;
  workOrders: boolean;
  weatherAlerts: boolean;
  taskAssignments: boolean;
  messages: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const NotificationPreferencesScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: false,
    workOrders: true,
    weatherAlerts: true,
    taskAssignments: true,
    messages: true,
    systemAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    registerForPushNotifications();
    loadPreferences();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      alert('Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      setExpoPushToken(token);
      setPreferences((prev) => ({ ...prev, pushEnabled: true }));

      // Send token to backend
      await sendTokenToBackend(token);

      console.log('Push token:', token);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  const sendTokenToBackend = async (token: string) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          device_info: {
            brand: Device.brand,
            model: Device.modelName,
            os_version: Device.osVersion,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register token');
      }

      console.log('Token registered with backend');
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/notifications/preferences`);
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/notifications/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: newPreferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification 🔔",
          body: 'This is a test notification to verify your settings!',
          data: { test: true },
          sound: preferences.soundEnabled,
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const PreferenceItem = ({ 
    title, 
    description, 
    value, 
    onValueChange 
  }: { 
    title: string; 
    description: string; 
    value: boolean; 
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceText}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Manage how you receive notifications
        </Text>
      </View>

      {/* Push Token Status */}
      {expoPushToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>✅ Push notifications enabled</Text>
          <Text style={styles.tokenText} numberOfLines={1}>
            Token: {expoPushToken.substring(0, 20)}...
          </Text>
        </View>
      )}

      {/* Main Toggle */}
      <View style={styles.section}>
        <PreferenceItem
          title="Push Notifications"
          description="Enable push notifications on this device"
          value={preferences.pushEnabled}
          onValueChange={(value) => {
            if (value) {
              registerForPushNotifications();
            } else {
              updatePreference('pushEnabled', value);
            }
          }}
        />
      </View>

      {/* Notification Types */}
      {preferences.pushEnabled && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
          </View>

          <View style={styles.section}>
            <PreferenceItem
              title="Work Orders"
              description="Get notified when work orders are assigned or updated"
              value={preferences.workOrders}
              onValueChange={(value) => updatePreference('workOrders', value)}
            />

            <PreferenceItem
              title="Weather Alerts"
              description="Receive weather alerts and snow forecasts"
              value={preferences.weatherAlerts}
              onValueChange={(value) => updatePreference('weatherAlerts', value)}
            />

            <PreferenceItem
              title="Task Assignments"
              description="Get notified when tasks are assigned to you"
              value={preferences.taskAssignments}
              onValueChange={(value) => updatePreference('taskAssignments', value)}
            />

            <PreferenceItem
              title="Messages"
              description="Receive notifications for new messages"
              value={preferences.messages}
              onValueChange={(value) => updatePreference('messages', value)}
            />

            <PreferenceItem
              title="System Alerts"
              description="Important system announcements and updates"
              value={preferences.systemAlerts}
              onValueChange={(value) => updatePreference('systemAlerts', value)}
            />
          </View>

          {/* Notification Behavior */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notification Behavior</Text>
          </View>

          <View style={styles.section}>
            <PreferenceItem
              title="Sound"
              description="Play sound for notifications"
              value={preferences.soundEnabled}
              onValueChange={(value) => updatePreference('soundEnabled', value)}
            />

            <PreferenceItem
              title="Vibration"
              description="Vibrate for notifications"
              value={preferences.vibrationEnabled}
              onValueChange={(value) => updatePreference('vibrationEnabled', value)}
            />
          </View>

          {/* Test Button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={sendTestNotification}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>
              {isLoading ? 'Saving...' : 'Send Test Notification'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          💡 Tip: You can also manage notifications in your device settings
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tokenContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceText: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  testButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#92400E',
  },
});

export default NotificationPreferencesScreen;
