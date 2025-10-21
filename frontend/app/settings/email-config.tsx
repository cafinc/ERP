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

interface EmailStatus {
  enabled: boolean;
  smtp_server: string;
  smtp_port: number;
  sender_email: string | null;
  password_configured: boolean;
  configuration_status: 'configured' | 'not_configured';
}

export default function EmailConfigScreen() {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchEmailStatus();
  }, []);

  const fetchEmailStatus = async () => {
    try {
      const response = await api.get('/email/status');
      setEmailStatus(response.data);
    } catch (error) {
      console.error('Error fetching email status:', error);
      Alert.alert('Error', 'Failed to load email configuration status');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      Alert.alert('Error', 'Please enter a test email address');
      return;
    }

    setSendingTest(true);
    try {
      const response = await api.post('/email/test', null, {
        params: { recipient_email: testEmail }
      });

      if (response.data.success) {
        setSuccessMessage(`Test email sent successfully to ${testEmail}`);
        setSuccessVisible(true);
      } else {
        Alert.alert('Test Failed', response.data.message);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      Alert.alert('Error', 'Failed to send test email. Please check your email configuration.');
    } finally {
      setSendingTest(false);
    }
  };

  const sendOnboardingTest = async () => {
    if (!testEmail.trim()) {
      Alert.alert('Error', 'Please enter a test email address');
      return;
    }

    setSendingTest(true);
    try {
      const response = await api.post('/email/onboarding', null, {
        params: {
          email: testEmail,
          name: 'Test User',
          username: testEmail,
          password: 'TempPass123!',
          role: 'crew'
        }
      });

      if (response.data.success) {
        setSuccessMessage(`Onboarding email sent successfully to ${testEmail}`);
        setSuccessVisible(true);
      } else {
        Alert.alert('Test Failed', response.data.message);
      }
    } catch (error) {
      console.error('Error sending onboarding test:', error);
      Alert.alert('Error', 'Failed to send onboarding test email.');
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
        <Text style={styles.loadingText}>Loading email configuration...</Text>
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
        <Text style={styles.headerTitle}>Email Configuration</Text>
        <TouchableOpacity onPress={fetchEmailStatus} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {emailStatus && (
          <>
            {/* Configuration Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuration Status</Text>
              <View style={[styles.statusCard, { borderLeftColor: getStatusColor(emailStatus.configuration_status) }]}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={getStatusIcon(emailStatus.configuration_status)} 
                    size={32} 
                    color={getStatusColor(emailStatus.configuration_status)} 
                  />
                  <View style={styles.statusText}>
                    <Text style={styles.statusTitle}>
                      {emailStatus.configuration_status === 'configured' ? 'Email Service Active' : 'Email Service Not Configured'}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      {emailStatus.configuration_status === 'configured' 
                        ? 'Email notifications are working'
                        : 'SMTP credentials required'
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
                  <Text style={styles.configLabel}>SMTP Server:</Text>
                  <Text style={styles.configValue}>{emailStatus.smtp_server}</Text>
                </View>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>SMTP Port:</Text>
                  <Text style={styles.configValue}>{emailStatus.smtp_port}</Text>
                </View>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Sender Email:</Text>
                  <Text style={styles.configValue}>
                    {emailStatus.sender_email || 'Not configured'}
                  </Text>
                </View>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Password:</Text>
                  <Text style={[styles.configValue, { color: emailStatus.password_configured ? Colors.success : Colors.error }]}>
                    {emailStatus.password_configured ? '••••••••' : 'Not configured'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Configuration Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Setup Instructions</Text>
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>To configure email notifications:</Text>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Set Environment Variables</Text>
                    <Text style={styles.stepText}>Configure SMTP_SENDER and SMTP_PASSWORD in your environment</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Gmail Setup</Text>
                    <Text style={styles.stepText}>Use an App Password, not your regular Gmail password</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Test Configuration</Text>
                    <Text style={styles.stepText}>Send a test email to verify everything is working</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Email Test Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Email Configuration</Text>
              <View style={styles.testCard}>
                <Text style={styles.testDescription}>
                  Send test emails to verify your email configuration is working correctly.
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Test Email Address:</Text>
                  <TextInput
                    style={styles.input}
                    value={testEmail}
                    onChangeText={setTestEmail}
                    placeholder="Enter email address to test"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>

                <View style={styles.testButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.testButton,
                      (!emailStatus.enabled || sendingTest) && styles.testButtonDisabled
                    ]}
                    onPress={sendTestEmail}
                    disabled={!emailStatus.enabled || sendingTest}
                  >
                    {sendingTest ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="mail" size={20} color={Colors.white} />
                    )}
                    <Text style={styles.testButtonText}>
                      {sendingTest ? 'Sending...' : 'Basic Test'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.onboardingTestButton,
                      (!emailStatus.enabled || sendingTest) && styles.testButtonDisabled
                    ]}
                    onPress={sendOnboardingTest}
                    disabled={!emailStatus.enabled || sendingTest}
                  >
                    {sendingTest ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="person-add" size={20} color={Colors.white} />
                    )}
                    <Text style={styles.testButtonText}>
                      Onboarding Test
                    </Text>
                  </TouchableOpacity>
                </View>

                {!emailStatus.enabled && (
                  <Text style={styles.warningText}>
                    ⚠️ Email service is not configured. Please set SMTP credentials first.
                  </Text>
                )}
              </View>
            </View>

            {/* Email Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email Notifications</Text>
              <View style={styles.emailTypesCard}>
                <Text style={styles.emailTypesDescription}>
                  The system sends the following types of email notifications:
                </Text>
                
                <View style={styles.emailType}>
                  <Ionicons name="warning" size={20} color={Colors.warning} />
                  <Text style={styles.emailTypeText}>
                    <Text style={styles.emailTypeTitle}>Negative Feedback Alerts</Text>
                    {'\n'}Sent to ps@cafinc.ca when customers submit low ratings
                  </Text>
                </View>

                <View style={styles.emailType}>
                  <Ionicons name="document-text" size={20} color={Colors.primary} />
                  <Text style={styles.emailTypeText}>
                    <Text style={styles.emailTypeTitle}>Dispatch Notifications</Text>
                    {'\n'}Job assignments sent to crew members
                  </Text>
                </View>

                <View style={styles.emailType}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.emailTypeText}>
                    <Text style={styles.emailTypeTitle}>Service Completion</Text>
                    {'\n'}Completion notifications sent to customers
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <SuccessOverlay
        visible={successVisible}
        title="Test Email Sent!"
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
  onboardingTestButton: {
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
  emailTypesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailTypesDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  emailType: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  emailTypeText: {
    marginLeft: 12,
    flex: 1,
  },
  emailTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});