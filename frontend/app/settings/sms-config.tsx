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
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import SuccessOverlay from '../../components/SuccessOverlay';

interface SMSStatus {
  enabled: boolean;
  sender_phone: string;
  account_sid_configured: boolean;
  auth_token_configured: boolean;
  configuration_status: 'configured' | 'not_configured';
}

export default function SMSConfigScreen() {
  const [smsStatus, setSmsStatus] = useState<SMSStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from CAF Property Services');
  const [sendingTest, setSendingTest] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSMSStatus();
  }, []);

  const fetchSMSStatus = async () => {
    try {
      const response = await api.get('/sms/status');
      setSmsStatus(response.data);
    } catch (error) {
      console.error('Error fetching SMS status:', error);
      Alert.alert('Error', 'Failed to load SMS configuration status');
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone.trim()) {
      Alert.alert('Error', 'Please enter a phone number to test');
      return;
    }

    setSendingTest(true);
    try {
      const response = await api.post('/sms/test', null, {
        params: {
          phone_number: testPhone,
          message: testMessage
        }
      });

      if (response.data.success) {
        setSuccessMessage(`Test SMS sent successfully to ${testPhone}`);
        setSuccessVisible(true);
      } else {
        Alert.alert('Test Failed', response.data.message);
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      Alert.alert('Error', 'Failed to send test SMS. Please check your Twilio configuration.');
    } finally {
      setSendingTest(false);
    }
  };

  const sendDispatchTest = async () => {
    if (!testPhone.trim()) {
      Alert.alert('Error', 'Please enter a phone number to test');
      return;
    }

    setSendingTest(true);
    try {
      const response = await api.post('/sms/dispatch', null, {
        params: {
          crew_phone: testPhone,
          dispatch_id: 'test-dispatch-id'
        }
      });

      if (response.data.success || response.data.result?.mock) {
        setSuccessMessage(`Dispatch SMS test sent to ${testPhone}`);
        setSuccessVisible(true);
      } else {
        Alert.alert('Test Failed', response.data.message);
      }
    } catch (error) {
      console.error('Error sending dispatch test:', error);
      Alert.alert('Error', 'Failed to send dispatch test SMS.');
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return Colors.success;
      case 'not_configured':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return 'checkmark-circle';
      case 'not_configured':
        return 'close-circle';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading SMS configuration...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SMS Configuration</Text>
        <TouchableOpacity onPress={fetchSMSStatus} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {smsStatus && (
          <>
            {/* Configuration Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Twilio SMS Status</Text>
              <View style={[styles.statusCard, { borderLeftColor: getStatusColor(smsStatus.configuration_status) }]}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={getStatusIcon(smsStatus.configuration_status)} 
                    size={32} 
                    color={getStatusColor(smsStatus.configuration_status)} 
                  />
                  <View style={styles.statusText}>
                    <Text style={styles.statusTitle}>
                      {smsStatus.configuration_status === 'configured' ? 'SMS Service Active' : 'SMS Service Not Configured'}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      {smsStatus.configuration_status === 'configured' 
                        ? 'Text messaging is working'
                        : 'Twilio credentials required'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Current Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Configuration</Text>
              <View style={styles.configCard}>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Sender Phone:</Text>
                  <Text style={styles.configValue}>{smsStatus.sender_phone}</Text>
                </View>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Account SID:</Text>
                  <Text style={[styles.configValue, { color: smsStatus.account_sid_configured ? Colors.success : Colors.error }]}>
                    {smsStatus.account_sid_configured ? 'Configured' : 'Not configured'}
                  </Text>
                </View>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Auth Token:</Text>
                  <Text style={[styles.configValue, { color: smsStatus.auth_token_configured ? Colors.success : Colors.error }]}>
                    {smsStatus.auth_token_configured ? 'Configured' : 'Not configured'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Twilio Setup Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Twilio Setup</Text>
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>To configure SMS notifications:</Text>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Create Twilio Account</Text>
                    <Text style={styles.stepText}>Sign up at twilio.com/console and verify your account</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Get API Credentials</Text>
                    <Text style={styles.stepText}>Copy Account SID and Auth Token from your Twilio Console Dashboard</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Get Phone Number</Text>
                    <Text style={styles.stepText}>Purchase a Twilio phone number with SMS capabilities</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Configure Environment</Text>
                    <Text style={styles.stepText}>Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>5</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Test Configuration</Text>
                    <Text style={styles.stepText}>Send a test SMS to verify everything is working</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SMS Test Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test SMS Configuration</Text>
              <View style={styles.testCard}>
                <Text style={styles.testDescription}>
                  Send test messages to verify your Twilio SMS configuration is working correctly.
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Test Phone Number:</Text>
                  <TextInput
                    style={styles.input}
                    value={testPhone}
                    onChangeText={setTestPhone}
                    placeholder="e.g., +15551234567"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Test Message:</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={testMessage}
                    onChangeText={setTestMessage}
                    placeholder="Enter test message"
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={Colors.gray400}
                  />
                </View>

                <View style={styles.testButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.testButton,
                      sendingTest && styles.testButtonDisabled
                    ]}
                    onPress={sendTestSMS}
                    disabled={sendingTest}
                  >
                    {sendingTest ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="chatbubble" size={20} color={Colors.white} />
                    )}
                    <Text style={styles.testButtonText}>
                      {sendingTest ? 'Sending...' : 'Basic SMS Test'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dispatchTestButton,
                      sendingTest && styles.testButtonDisabled
                    ]}
                    onPress={sendDispatchTest}
                    disabled={sendingTest}
                  >
                    {sendingTest ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="briefcase" size={20} color={Colors.white} />
                    )}
                    <Text style={styles.testButtonText}>
                      Dispatch Test
                    </Text>
                  </TouchableOpacity>
                </View>

                {!smsStatus.enabled && (
                  <Text style={styles.warningText}>
                    ⚠️ SMS service is not configured. Messages will show as mock/test mode.
                  </Text>
                )}
              </View>
            </View>

            {/* SMS Message Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SMS Notification Types</Text>
              <View style={styles.messageTypesCard}>
                <Text style={styles.messageTypesDescription}>
                  The system sends the following types of SMS notifications:
                </Text>
                
                <View style={styles.messageType}>
                  <Ionicons name="briefcase" size={20} color={Colors.primary} />
                  <Text style={styles.messageTypeText}>
                    <Text style={styles.messageTypeTitle}>Dispatch Notifications</Text>
                    {'\n'}Job assignments sent to crew members with route and timing details
                  </Text>
                </View>

                <View style={styles.messageType}>
                  <Ionicons name="location" size={20} color={Colors.success} />
                  <Text style={styles.messageTypeText}>
                    <Text style={styles.messageTypeTitle}>Arrival Notifications</Text>
                    {'\n'}Customer alerts when crew arrives on-site
                  </Text>
                </View>

                <View style={styles.messageType}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.messageTypeText}>
                    <Text style={styles.messageTypeTitle}>Completion Notifications</Text>
                    {'\n'}Service completion alerts sent to customers
                  </Text>
                </View>

                <View style={styles.messageType}>
                  <Ionicons name="cloud-snow" size={20} color={Colors.warning} />
                  <Text style={styles.messageTypeText}>
                    <Text style={styles.messageTypeTitle}>Weather Alerts</Text>
                    {'\n'}Mass notifications to crew about weather conditions
                  </Text>
                </View>

                <View style={styles.messageType}>
                  <Ionicons name="warning" size={20} color={Colors.error} />
                  <Text style={styles.messageTypeText}>
                    <Text style={styles.messageTypeTitle}>Emergency Messages</Text>
                    {'\n'}Urgent notifications to crew and supervisors
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <SuccessOverlay
        visible={successVisible}
        title="Test SMS Sent!"
        message={successMessage}
        onClose={() => setSuccessVisible(false)}
      />
    </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  configCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  configValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  testCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  dispatchTestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  testButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.warning,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageTypesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageTypesDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  messageType: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  messageTypeText: {
    marginLeft: 12,
    flex: 1,
  },
  messageTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});