import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';

interface InspectionStatusItem {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  status: 'current' | 'due_soon' | 'overdue' | 'never_inspected';
  days_since_inspection: number | null;
  last_inspection_date: string | null;
}

interface InspectionSummary {
  total_equipment: number;
  current: number;
  due_soon: number;
  overdue: number;
  never_inspected: number;
  equipment_list: InspectionStatusItem[];
}

export default function EquipmentInspectionsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isCrew = currentUser?.role === 'crew' || currentUser?.role === 'subcontractor';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspectionData, setInspectionData] = useState<InspectionSummary | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    fetchInspectionStatus();
  }, []);

  const fetchInspectionStatus = async () => {
    try {
      const response = await api.get('/equipment/inspection-status');
      setInspectionData(response.data);
    } catch (error) {
      console.error('Error fetching inspection status:', error);
      // Set empty data structure on error to prevent undefined errors
      setInspectionData({
        total_equipment: 0,
        current: 0,
        due_soon: 0,
        overdue: 0,
        never_inspected: 0,
        equipment_list: [],
      });
      Alert.alert('Error', 'Failed to load inspection data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInspectionStatus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return Colors.success;
      case 'due_soon':
        return Colors.warning;
      case 'overdue':
        return Colors.error;
      case 'never_inspected':
        return Colors.gray400;
      default:
        return Colors.gray400;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current':
        return 'checkmark-circle';
      case 'due_soon':
        return 'time';
      case 'overdue':
        return 'alert-circle';
      case 'never_inspected':
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'current':
        return 'Current';
      case 'due_soon':
        return 'Due Soon';
      case 'overdue':
        return 'Overdue';
      case 'never_inspected':
        return 'Never Inspected';
      default:
        return 'Unknown';
    }
  };

  const getDaysText = (item: InspectionStatusItem) => {
    if (item.status === 'never_inspected') {
      return 'No inspections recorded';
    }
    if (item.days_since_inspection === null) {
      return 'No recent inspection';
    }
    if (item.days_since_inspection === 0) {
      return 'Inspected today';
    }
    if (item.days_since_inspection === 1) {
      return '1 day ago';
    }
    return `${item.days_since_inspection} days ago`;
  };

  const handleScheduleInspection = (equipmentId: string, equipmentName: string) => {
    Alert.alert(
      'Schedule Inspection',
      `Schedule an inspection for ${equipmentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fill Inspection Form',
          onPress: () => {
            // Navigate to forms with equipment pre-selected
            router.push('/forms/fill-form');
          },
        },
      ]
    );
  };

  const filterEquipment = () => {
    if (!inspectionData || !inspectionData.equipment_list) return [];
    if (selectedFilter === 'all') return inspectionData.equipment_list || [];
    return inspectionData.equipment_list.filter(item => item.status === selectedFilter) || [];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filteredEquipment = filterEquipment();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Inspections</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        {inspectionData && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardLarge]}>
                <Ionicons name="construct" size={32} color={Colors.primary} />
                <Text style={styles.summaryNumber}>{inspectionData.total_equipment}</Text>
                <Text style={styles.summaryLabel}>Total Equipment</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardSmall]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={[styles.summaryNumber, { color: Colors.success }]}>
                  {inspectionData.current}
                </Text>
                <Text style={styles.summaryLabel}>Current</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardSmall]}>
                <Ionicons name="time" size={24} color={Colors.warning} />
                <Text style={[styles.summaryNumber, { color: Colors.warning }]}>
                  {inspectionData.due_soon}
                </Text>
                <Text style={styles.summaryLabel}>Due Soon</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardSmall]}>
                <Ionicons name="alert-circle" size={24} color={Colors.error} />
                <Text style={[styles.summaryNumber, { color: Colors.error }]}>
                  {inspectionData.overdue}
                </Text>
                <Text style={styles.summaryLabel}>Overdue</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardSmall]}>
                <Ionicons name="help-circle" size={24} color={Colors.gray400} />
                <Text style={[styles.summaryNumber, { color: Colors.gray400 }]}>
                  {inspectionData.never_inspected}
                </Text>
                <Text style={styles.summaryLabel}>Never Inspected</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All', count: inspectionData?.total_equipment || 0 },
              { key: 'overdue', label: 'Overdue', count: inspectionData?.overdue || 0 },
              { key: 'due_soon', label: 'Due Soon', count: inspectionData?.due_soon || 0 },
              { key: 'current', label: 'Current', count: inspectionData?.current || 0 },
              { key: 'never_inspected', label: 'Never Inspected', count: inspectionData?.never_inspected || 0 },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.key && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter.key && styles.filterTabTextActive,
                  ]}
                >
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Equipment List */}
        <View style={styles.listContainer}>
          {filteredEquipment.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={64} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No Equipment Found</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'all'
                  ? 'No equipment registered yet'
                  : `No equipment with status: ${getStatusLabel(selectedFilter)}`}
              </Text>
            </View>
          ) : (
            filteredEquipment.map((item) => (
              <View key={item.equipment_id} style={styles.equipmentCard}>
                <View style={styles.equipmentHeader}>
                  <View style={styles.equipmentInfo}>
                    <View style={styles.equipmentTitleRow}>
                      <Text style={styles.equipmentName}>{item.equipment_name}</Text>
                      <Ionicons
                        name={getStatusIcon(item.status)}
                        size={24}
                        color={getStatusColor(item.status)}
                      />
                    </View>
                    <Text style={styles.equipmentType}>
                      {item.equipment_type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: getStatusColor(item.status) }]}
                    >
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                  <Text style={styles.daysText}>{getDaysText(item)}</Text>
                </View>

                {item.last_inspection_date && (
                  <View style={styles.lastInspection}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.lastInspectionText}>
                      Last inspection: {new Date(item.last_inspection_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      router.push(`/equipment/history?equipmentId=${item.equipment_id}`)
                    }
                  >
                    <Ionicons name="time-outline" size={18} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>History</Text>
                  </TouchableOpacity>

                  {(isAdmin || isCrew) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      onPress={() =>
                        handleScheduleInspection(item.equipment_id, item.equipment_name)
                      }
                    >
                      <Ionicons name="clipboard" size={18} color={Colors.white} />
                      <Text style={styles.actionButtonTextPrimary}>Inspect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryCardLarge: {
    flex: 1,
  },
  summaryCardSmall: {
    flex: 1,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  listContainer: {
    gap: 12,
  },
  equipmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentHeader: {
    marginBottom: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  equipmentType: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  lastInspection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lastInspectionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
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
