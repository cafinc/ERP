import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import SuccessOverlay from '../components/SuccessOverlay';

const ALERT_TYPES = [
  { value: 'general', label: 'General Emergency', icon: 'warning', color: '#f59e0b' },
  { value: 'weather', label: 'Severe Weather', icon: 'rainy', color: '#3b82f6' },
  { value: 'safety', label: 'Safety Alert', icon: 'shield-checkmark', color: '#ef4444' },
  { value: 'equipment', label: 'Equipment Issue', icon: 'construct', color: '#8b5cf6' },
  { value: 'route', label: 'Route Change', icon: 'swap-horizontal', color: '#10b981' },
];

export default function EmergencyAlertScreen() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertType, setAlertType] = useState('general');
  const [message, setMessage] = useState('');
  const [activeShiftsCount, setActiveShiftsCount] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can send emergency alerts');
      router.back();
      return;
    }
    fetchActiveShifts();
  }, []);

  const fetchActiveShifts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shifts/active');
      const uniqueUsers = new Set(response.data.map((shift: any) => shift.user_id));
      setActiveShiftsCount(uniqueUsers.size);
    } catch (error) {
      console.error('Error fetching active shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter an alert message');
      return;
    }

    Alert.alert(
      'Confirm Emergency Alert',
      `Send "${alertType}" alert to ${activeShiftsCount} team member${activeShiftsCount !== 1 ? 's' : ''} on shift?\n\nThis will send both EMAIL and SMS notifications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              setSending(true);
              const response = await api.post(
                `/emergency-alerts/send?alert_message=${encodeURIComponent(message)}&alert_type=${alertType}`
              );
              
              setResult(response.data);
              setMessage('');
              setShowSuccess(true);
              await fetchActiveShifts();
            } catch (error: any) {
              console.error('Error sending alert:', error);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to send emergency alert');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const selectedType = ALERT_TYPES.find(t => t.value === alertType);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Alert</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.warningTitle}>Emergency Alert System</Text>
            <Text style={styles.warningText}>
              Send urgent notifications to all team members currently on shift via Email and SMS.
            </Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Ionicons name="people" size={24} color={Colors.primary} />
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Team Members On Shift</Text>
                <Text style={styles.statValue}>
                  {loading ? 'Loading...' : `${activeShiftsCount} active`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alert Type</Text>
            <View style={styles.alertTypesGrid}>
              {ALERT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.alertTypeCard,
                    alertType === type.value && styles.alertTypeCardSelected,
                    { borderColor: type.color },
                  ]}
                  onPress={() => setAlertType(type.value)}
                >
                  <View style={[styles.alertTypeIcon, { backgroundColor: type.color + '20' }]}>
                    <Ionicons name={type.icon as any} size={24} color={type.color} />
                  </View>
                  <Text style={styles.alertTypeLabel}>{type.label}</Text>
                  {alertType === type.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={type.color}
                      style={styles.checkmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alert Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Enter your emergency alert message..."
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length} characters</Text>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.previewContent}>
              <View style={styles.previewHeader}>
                <Ionicons name={selectedType?.icon as any} size={20} color={selectedType?.color} />
                <Text style={styles.previewType}>{selectedType?.label.toUpperCase()}</Text>
              </View>
              <Text style={styles.previewMessage}>
                {message || 'Your alert message will appear here...'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, (sending || !message.trim()) && styles.sendButtonDisabled]}
            onPress={handleSendAlert}
            disabled={sending || !message.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.white} />
                <Text style={styles.sendButtonText}>
                  Send Emergency Alert to {activeShiftsCount} Team Members
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Alerts are sent via Email and SMS to all team members with active shifts. Recipients can manage their notification preferences in settings.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessOverlay
        visible={showSuccess}
        title="Alert Sent!"
        message={result ? `Emergency alert sent to ${result.recipients_count} team members\n\nEmails sent: ${result.emails_sent}\nSMS sent: ${result.sms_sent}` : 'Emergency alert has been sent successfully'}
        onClose={() => {
          setShowSuccess(false);
          setResult(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  warningCard: {
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  alertTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  alertTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  alertTypeCardSelected: {
    borderWidth: 2,
  },
  alertTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  alertTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  messageInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  previewContent: {
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  previewType: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  previewMessage: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray400,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
