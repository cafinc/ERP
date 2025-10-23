import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useTask } from '../contexts/TaskContext';

export default function NotificationCenter() {
  const router = useRouter();
  const { theme } = useTheme();
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useTask();
  const [visible, setVisible] = useState(false);

  const handleNotificationPress = async (notification: any) => {
    await markNotificationRead(notification.id);
    setVisible(false);
    // Navigate to the task
    if (notification.task_id) {
      router.push(`/tasks/${notification.task_id}` as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment': return 'add-circle';
      case 'update': return 'create';
      case 'comment': return 'chatbubble';
      case 'completion': return 'checkmark-circle';
      case 'mention': return 'at';
      case 'status_change': return 'swap-horizontal';
      default: return 'notifications';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Button */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="notifications" size={24} color={theme.colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Notifications
              </Text>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllNotificationsRead}
                    style={styles.markAllButton}
                  >
                    <Text style={[styles.markAllText, { color: theme.colors.primary }]}>
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>
                    No notifications
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                    You're all caught up!
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      {
                        backgroundColor: notification.read ? 'transparent' : theme.colors.primary + '10',
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.textPrimary }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: theme.colors.textTertiary }]}>
                        {formatTime(notification.created_at)}
                      </Text>
                    </View>
                    {!notification.read && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
