import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function TimeTracking() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTimeEntries();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimeEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/time-entries?user_id=${currentUser?.id}&date=${today}`);
      const entries = response.data || [];
      
      const active = entries.find((e: any) => !e.clock_out);
      setCurrentEntry(active || null);
      setTodayEntries(entries);

      const hours = entries.reduce((sum: number, entry: any) => {
        if (entry.clock_out) {
          const diff = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          return sum + (diff / (1000 * 60 * 60));
        }
        return sum;
      }, 0);
      setTotalHours(hours);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      await api.post('/time-entries/clock-in', {
        user_id: currentUser?.id,
        user_name: currentUser?.name,
        clock_in: new Date().toISOString(),
      });
      await fetchTimeEntries();
      Alert.alert('Success', 'Clocked in successfully!');
    } catch (error) {
      console.error('Error clocking in:', error);
      Alert.alert('Error', 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;
    
    try {
      await api.post('/time-entries/clock-out', {
        entry_id: currentEntry.id,
        clock_out: new Date().toISOString(),
      });
      await fetchTimeEntries();
      Alert.alert('Success', 'Clocked out successfully!');
    } catch (error) {
      console.error('Error clocking out:', error);
      Alert.alert('Error', 'Failed to clock out');
    }
  };

  const formatDuration = (start: string) => {
    const diff = currentTime.getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Time Clock</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Status */}
        <View style={[
          styles.statusCard,
          { 
            backgroundColor: currentEntry ? '#10b981' + '20' : theme.colors.surface,
            borderColor: currentEntry ? '#10b981' : theme.colors.border 
          }
        ]}>
          <View style={[styles.statusIcon, { backgroundColor: currentEntry ? '#10b981' : '#6b7280' }]}>
            <Ionicons name="time" size={48} color="white" />
          </View>
          <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
            {currentEntry ? 'Currently Clocked In' : 'Not Clocked In'}
          </Text>
          {currentEntry && (
            <>
              <Text style={[styles.duration, { color: theme.colors.primary }]}>
                {formatDuration(currentEntry.clock_in)}
              </Text>
              <Text style={[styles.clockInTime, { color: theme.colors.textSecondary }]}>
                Since {formatTime(currentEntry.clock_in)}
              </Text>
            </>
          )}
          
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: currentEntry ? '#ef4444' : '#10b981' }]}
            onPress={currentEntry ? handleClockOut : handleClockIn}
          >
            <Ionicons name={currentEntry ? 'stop-circle' : 'play-circle'} size={24} color="white" />
            <Text style={styles.mainButtonText}>
              {currentEntry ? 'Clock Out' : 'Clock In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Today's Summary</Text>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Hours</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {totalHours.toFixed(2)} hrs
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Clock Events</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
                {todayEntries.length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Status</Text>
              <View style={[styles.statusDot, { backgroundColor: currentEntry ? '#10b981' : '#6b7280' }]} />
            </View>
          </View>
        </View>

        {/* Today's Entries */}
        {todayEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Today's Entries</Text>
            {todayEntries.map((entry, index) => (
              <View
                key={index}
                style={[styles.entryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={styles.entryRow}>
                  <View style={styles.entryTime}>
                    <Ionicons name="log-in" size={20} color="#10b981" />
                    <Text style={[styles.entryTimeText, { color: theme.colors.textPrimary }]}>
                      {formatTime(entry.clock_in)}
                    </Text>
                  </View>
                  {entry.clock_out && (
                    <>
                      <Ionicons name="arrow-forward" size={16} color={theme.colors.textTertiary} />
                      <View style={styles.entryTime}>
                        <Ionicons name="log-out" size={20} color="#ef4444" />
                        <Text style={[styles.entryTimeText, { color: theme.colors.textPrimary }]}>
                          {formatTime(entry.clock_out)}
                        </Text>
                      </View>
                    </>
                  )}
                  {!entry.clock_out && (
                    <View style={[styles.activeBadge, { backgroundColor: '#10b981' + '20' }]}>
                      <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                {entry.clock_out && (
                  <Text style={[styles.entryDuration, { color: theme.colors.textSecondary }]}>
                    Duration: {((new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60)).toFixed(2)} hours
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textPrimary }]}>
            Make sure to clock in when you start work and clock out when you finish.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    margin: 20,
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  statusIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  duration: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  clockInTime: {
    fontSize: 14,
    marginBottom: 24,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  entryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTimeText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entryDuration: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});