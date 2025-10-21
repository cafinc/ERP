import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';

interface Shift {
  id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time?: string;
  status: string;
  notes?: string;
}

export default function ShiftHistoryScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await api.get(`/shifts?user_id=${currentUser?.id}`);
      // Sort by date, newest first
      const sortedShifts = response.data.sort((a: Shift, b: Shift) => {
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      });
      setShifts(sortedShifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShifts();
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In Progress';
    
    try {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      const minutes = differenceInMinutes(end, start);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      return 'N/A';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? Colors.success : Colors.gray500;
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
        <Text style={styles.headerTitle}>My Shifts</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {shifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyText}>No shift history</Text>
            <Text style={styles.emptySubtext}>Your past shifts will appear here</Text>
          </View>
        ) : (
          shifts.map((shift) => (
            <View key={shift.id} style={styles.shiftCard}>
              <View style={styles.shiftHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                  <Text style={styles.dateText}>{formatDate(shift.start_time)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
                  <Text style={styles.statusText}>
                    {shift.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                  </Text>
                </View>
              </View>

              <View style={styles.shiftDetails}>
                <View style={styles.timeRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Clock In</Text>
                    <View style={styles.timeValueContainer}>
                      <Ionicons name="log-in" size={18} color={Colors.success} />
                      <Text style={styles.timeValue}>{formatTime(shift.start_time)}</Text>
                    </View>
                  </View>

                  <Ionicons name="arrow-forward" size={20} color={Colors.gray400} />

                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Clock Out</Text>
                    <View style={styles.timeValueContainer}>
                      <Ionicons 
                        name={shift.end_time ? "log-out" : "time"} 
                        size={18} 
                        color={shift.end_time ? Colors.error : Colors.warning} 
                      />
                      <Text style={styles.timeValue}>
                        {shift.end_time ? formatTime(shift.end_time) : 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.durationContainer}>
                  <Ionicons name="timer" size={18} color={Colors.primary} />
                  <Text style={styles.durationLabel}>Duration:</Text>
                  <Text style={styles.durationValue}>
                    {calculateDuration(shift.start_time, shift.end_time)}
                  </Text>
                </View>

                {shift.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="document-text" size={16} color={Colors.gray500} />
                    <Text style={styles.notesText}>{shift.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 8,
  },
  shiftCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  shiftDetails: {
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray500,
    marginBottom: 6,
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray600,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
  },
});
