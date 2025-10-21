import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';

export default function EquipmentHistoryScreen() {
  const router = useRouter();
  const { equipmentId } = useLocalSearchParams();
  const [equipment, setEquipment] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipmentData();
  }, [equipmentId]);

  const fetchEquipmentData = async () => {
    try {
      const [equipmentRes, responsesRes] = await Promise.all([
        api.get(`/equipment/${equipmentId}`),
        api.get('/form-responses'),
      ]);

      setEquipment(equipmentRes.data);
      
      // Filter responses for this equipment
      const equipmentForms = responsesRes.data.filter(
        (response: any) => response.equipment_id === equipmentId
      );
      
      // Sort by submission date (newest first)
      equipmentForms.sort((a: any, b: any) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
      
      setFormResponses(equipmentForms);
    } catch (error) {
      console.error('Error fetching equipment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormStatus = (response: any) => {
    // Check if any field has "Fail" value
    const hasFails = Object.values(response.responses).some(
      (value: any) => value === 'Fail'
    );
    return hasFails ? 'Issues Found' : 'Passed';
  };

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
        <Text style={styles.headerTitle}>Inspection History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {equipment && (
          <View style={styles.equipmentCard}>
            <View style={styles.equipmentInfo}>
              <Text style={styles.equipmentName}>{equipment.name || equipment.unit_number}</Text>
              <Text style={styles.equipmentType}>{equipment.equipment_type?.replace('_', ' ')}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{formResponses.length}</Text>
                <Text style={styles.statLabel}>Total Inspections</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#10b981' }]}>
                  {formResponses.filter(r => getFormStatus(r) === 'Passed').length}
                </Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                  {formResponses.filter(r => getFormStatus(r) === 'Issues Found').length}
                </Text>
                <Text style={styles.statLabel}>Issues</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Inspection History</Text>

        {formResponses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Inspections Yet</Text>
            <Text style={styles.emptyText}>
              Inspection forms submitted for this equipment will appear here
            </Text>
          </View>
        ) : (
          formResponses.map((response) => {
            const status = getFormStatus(response);
            const date = new Date(response.submitted_at);
            
            return (
              <TouchableOpacity
                key={response.id}
                style={styles.historyCard}
                onPress={() => router.push(`/forms/view-response?responseId=${response.id}`)}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyTitle}>
                    <Ionicons 
                      name={status === 'Passed' ? 'checkmark-circle' : 'alert-circle'} 
                      size={20} 
                      color={status === 'Passed' ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={styles.historyFormName}>{response.template_name}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    status === 'Passed' ? styles.passedBadge : styles.failedBadge
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      status === 'Passed' ? styles.passedBadgeText : styles.failedBadgeText
                    ]}>
                      {status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{response.crew_name || 'Unknown'}</Text>
                  </View>
                </View>

                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  equipmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentInfo: {
    marginBottom: 16,
  },
  equipmentName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  equipmentType: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyFormName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passedBadge: {
    backgroundColor: '#d1fae5',
  },
  failedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passedBadgeText: {
    color: '#10b981',
  },
  failedBadgeText: {
    color: '#ef4444',
  },
  historyDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
