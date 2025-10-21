import React, { useEffect, useState } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../utils/theme';
import SuccessOverlay from '../../components/SuccessOverlay';

interface Message {
  id: string;
  type: string;
  status: string;
  priority: string;
  source_id?: string;
  source_type: string;
  from_user_id?: string;
  from_user_name?: string;
  to_user_id?: string;
  to_user_name?: string;
  assigned_crew_id?: string;
  assigned_crew_name?: string;
  title: string;
  content: string;
  admin_response?: string;
  crew_feedback?: string;
  resolution_notes?: string;
  created_at: string;
  admin_responded_at?: string;
  crew_assigned_at?: string;
  crew_acknowledged_at?: string;
  resolved_at?: string;
  response_time_hours?: number;
  acknowledgment_time_hours?: number;
  requires_follow_up: boolean;
  follow_up_date?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams();
  const { isAdmin, isCrew, isCustomer, currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Admin response form
  const [adminResponse, setAdminResponse] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [showCrewSelector, setShowCrewSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Crew acknowledgment form
  const [crewFeedback, setCrewFeedback] = useState('');
  const [acknowledgingTask, setAcknowledgingTask] = useState(false);
  
  // Success overlay states
  const [successVisible, setSuccessVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMessageDetails();
    if (isAdmin) {
      fetchTeamMembers();
    }
  }, [id]);

  const fetchMessageDetails = async () => {
    try {
      const response = await api.get(`/messages/${id}`);
      setMessage(response.data);
      
      // Pre-populate fields if message has existing data
      if (response.data.admin_response) {
        setAdminResponse(response.data.admin_response);
      }
      if (response.data.resolution_notes) {
        setResolutionNotes(response.data.resolution_notes);
      }
      if (response.data.crew_feedback) {
        setCrewFeedback(response.data.crew_feedback);
      }
    } catch (error) {
      console.error('Error fetching message:', error);
      Alert.alert('Error', 'Failed to load message details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/team-members');
      setTeamMembers(response.data.filter((member: TeamMember) => 
        member.active && member.role === 'crew'
      ));
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAdminResponse = async () => {
    if (!adminResponse.trim()) {
      Alert.alert('Error', 'Please enter a response before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const updateData: any = {
        status: 'in_progress',
        admin_response: adminResponse.trim(),
      };

      // If crew is selected, assign the task
      if (selectedCrewId) {
        const selectedCrew = teamMembers.find(m => m.id === selectedCrewId);
        updateData.assigned_crew_id = selectedCrewId;
        updateData.assigned_crew_name = selectedCrew?.name;
      }

      await api.put(`/messages/${id}`, updateData);
      
      setSuccessTitle('Response Sent!');
      setSuccessMessage('Your response has been sent successfully');
      setSuccessVisible(true);
      
      setAdminResponse('');
      setSelectedCrewId('');
      fetchMessageDetails();
    } catch (error) {
      console.error('Error sending response:', error);
      Alert.alert('Error', 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrewAcknowledgment = async () => {
    if (!crewFeedback.trim()) {
      Alert.alert('Error', 'Please provide your feedback before acknowledging.');
      return;
    }

    Alert.alert(
      'Confirm Acknowledgment',
      'Do you acknowledge this feedback and commit to addressing the issue moving forward?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I Commit',
          onPress: async () => {
            setAcknowledgingTask(true);
            try {
              await api.put(`/messages/${id}`, {
                status: 'acknowledged',
                crew_feedback: crewFeedback.trim(),
              });
              
              setSuccessTitle('Task Acknowledged!');
              setSuccessMessage('You have successfully acknowledged this task and committed to addressing it');
              setSuccessVisible(true);
              fetchMessageDetails();
            } catch (error) {
              console.error('Error acknowledging task:', error);
              Alert.alert('Error', 'Failed to acknowledge task');
            } finally {
              setAcknowledgingTask(false);
            }
          }
        }
      ]
    );
  };

  const handleResolveIssue = async () => {
    if (!resolutionNotes.trim()) {
      Alert.alert('Error', 'Please enter resolution notes before marking as resolved.');
      return;
    }

    Alert.alert(
      'Mark as Resolved',
      'This will mark the issue as resolved and send a notification to the customer. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Resolved',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.put(`/messages/${id}`, {
                status: 'resolved',
                resolution_notes: resolutionNotes.trim(),
              });
              
              setSuccessTitle('Issue Resolved!');
              setSuccessMessage('The issue has been marked as resolved and the customer will be notified');
              setSuccessVisible(true);
              
            } catch (error) {
              console.error('Error resolving issue:', error);
              Alert.alert('Error', 'Failed to resolve issue');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return Colors.primary;
      case 'low': return Colors.gray500;
      default: return Colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return Colors.primary;
      case 'acknowledged': return '#10b981';
      case 'resolved': return '#6b7280';
      default: return Colors.gray500;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!message) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Message not found</Text>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Message Details</Text>
          <View style={styles.headerBadges}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(message.status) }]}>
              <Text style={styles.statusText}>{message.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
            {message.priority !== 'normal' && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(message.priority) }]}>
                <Text style={styles.priorityText}>{message.priority.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Message Details */}
        <View style={styles.messageSection}>
          <Text style={styles.messageTitle}>{message.title}</Text>
          <Text style={styles.messageContent}>{message.content}</Text>
          
          <View style={styles.messageMetadata}>
            <Text style={styles.metadataText}>
              From: {message.from_user_name || 'Unknown User'}
            </Text>
            <Text style={styles.metadataText}>
              Submitted: {formatDateTime(message.created_at)}
            </Text>
            {message.assigned_crew_name && (
              <Text style={styles.metadataText}>
                Assigned to: {message.assigned_crew_name}
              </Text>
            )}
          </View>
        </View>

        {/* Admin Response (if exists) */}
        {message.admin_response && (
          <View style={styles.responseSection}>
            <Text style={styles.sectionTitle}>Admin Response</Text>
            <Text style={styles.responseText}>{message.admin_response}</Text>
            {message.admin_responded_at && (
              <Text style={styles.timestampText}>
                Responded: {formatDateTime(message.admin_responded_at)}
              </Text>
            )}
          </View>
        )}

        {/* Crew Feedback (if exists) */}
        {message.crew_feedback && (
          <View style={styles.responseSection}>
            <Text style={styles.sectionTitle}>Crew Feedback</Text>
            <Text style={styles.responseText}>{message.crew_feedback}</Text>
            {message.crew_acknowledged_at && (
              <Text style={styles.timestampText}>
                Acknowledged: {formatDateTime(message.crew_acknowledged_at)}
              </Text>
            )}
          </View>
        )}

        {/* Resolution Notes (if exists) */}
        {message.resolution_notes && (
          <View style={styles.responseSection}>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <Text style={styles.responseText}>{message.resolution_notes}</Text>
            {message.resolved_at && (
              <Text style={styles.timestampText}>
                Resolved: {formatDateTime(message.resolved_at)}
              </Text>
            )}
          </View>
        )}

        {/* Admin Action Panel */}
        {isAdmin && message.status !== 'resolved' && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Admin Response</Text>
            
            <TextInput
              style={styles.responseInput}
              multiline
              numberOfLines={4}
              placeholder="Enter your response to the customer..."
              placeholderTextColor={Colors.gray400}
              value={adminResponse}
              onChangeText={setAdminResponse}
              textAlignVertical="top"
            />

            {/* Crew Assignment */}
            <View style={styles.assignmentSection}>
              <Text style={styles.assignmentLabel}>Assign to Crew Member (Optional)</Text>
              <TouchableOpacity
                style={styles.crewSelector}
                onPress={() => setShowCrewSelector(true)}
              >
                <Text style={styles.crewSelectorText}>
                  {selectedCrewId 
                    ? teamMembers.find(m => m.id === selectedCrewId)?.name || 'Select Crew'
                    : 'Select Crew Member'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            {message.status === 'in_progress' && (
              <>
                <Text style={styles.sectionTitle}>Resolution Notes</Text>
                <TextInput
                  style={styles.responseInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Enter resolution details for the customer..."
                  placeholderTextColor={Colors.gray400}
                  value={resolutionNotes}
                  onChangeText={setResolutionNotes}
                  textAlignVertical="top"
                />
              </>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.respondButton]}
                onPress={handleAdminResponse}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Send Response</Text>
                  </>
                )}
              </TouchableOpacity>

              {message.status === 'in_progress' && resolutionNotes.trim() && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.resolveButton]}
                  onPress={handleResolveIssue}
                  disabled={submitting}
                >
                  <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Mark Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Crew Action Panel */}
        {isCrew && message.assigned_crew_id === currentUser?.id && message.status === 'in_progress' && !message.crew_acknowledged_at && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Your Response Required</Text>
            <Text style={styles.actionDescription}>
              Please provide your feedback and acknowledge that you will address this issue.
            </Text>
            
            <TextInput
              style={styles.responseInput}
              multiline
              numberOfLines={4}
              placeholder="Enter your feedback and commitment to fix this issue..."
              placeholderTextColor={Colors.gray400}
              value={crewFeedback}
              onChangeText={setCrewFeedback}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.actionButton, styles.acknowledgeButton]}
              onPress={handleCrewAcknowledgment}
              disabled={acknowledgingTask}
            >
              {acknowledgingTask ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Acknowledge & Commit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <SuccessOverlay
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onClose={() => {
          setSuccessVisible(false);
          // Navigate back only for resolve action
          if (successTitle === 'Issue Resolved!') {
            router.back();
          }
        }}
      />

      {/* Crew Selection Modal */}
      <Modal
        visible={showCrewSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCrewSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCrewSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assign to Crew</Text>
            <TouchableOpacity onPress={() => {
              setSelectedCrewId('');
              setShowCrewSelector(false);
            }}>
              <Text style={styles.modalClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {teamMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.crewOption,
                  selectedCrewId === member.id && styles.crewOptionSelected,
                ]}
                onPress={() => {
                  setSelectedCrewId(member.id);
                  setShowCrewSelector(false);
                }}
              >
                <View style={styles.crewOptionContent}>
                  <Text style={styles.crewOptionName}>{member.name}</Text>
                  <Text style={styles.crewOptionRole}>{member.role}</Text>
                </View>
                {selectedCrewId === member.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray600,
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
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  messageSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  messageContent: {
    fontSize: 16,
    color: Colors.gray700,
    lineHeight: 24,
    marginBottom: 16,
  },
  messageMetadata: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  metadataText: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 4,
  },
  responseSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  responseText: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.gray500,
    fontStyle: 'italic',
  },
  actionSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 16,
    lineHeight: 20,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: 16,
  },
  assignmentSection: {
    marginBottom: 16,
  },
  assignmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  crewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
  },
  crewSelectorText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  respondButton: {
    backgroundColor: Colors.primary,
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  acknowledgeButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalClearText: {
    fontSize: 16,
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  crewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  crewOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  crewOptionContent: {
    flex: 1,
  },
  crewOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  crewOptionRole: {
    fontSize: 14,
    color: Colors.gray600,
    textTransform: 'capitalize',
  },
});