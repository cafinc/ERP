import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import WebAdminLayout from '../components/WebAdminLayout';

interface WeatherRecommendation {
  date: string;
  day_name: string;
  site_id: string;
  site_name: string;
  site_address: string;
  priority: number;
  priority_level: string;
  recommended_services: string[];
  estimated_duration_minutes: number;
  weather_conditions: {
    snow_amount: number;
    temp_min: number;
    temp_max: number;
    risk_level: string;
  };
  reason: string;
}

interface ForecastDay {
  date: string;
  day_name: string;
  temperature_min: number;
  temperature_max: number;
  condition: string;
  precipitation: {
    rain: number;
    snow: number;
  };
  wind_speed: number;
  humidity: number;
  snow_risk: string;
}

export default function WeatherPlanningScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isWeb = Platform.OS === 'web';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [creatingDispatch, setCreatingDispatch] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/dispatch/weather-recommendations');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching weather recommendations:', error);
      Alert.alert('Error', 'Failed to load weather recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const createDispatch = async (recommendation: WeatherRecommendation) => {
    try {
      setCreatingDispatch(recommendation.site_id);
      
      const response = await api.post('/dispatch/create-from-recommendation', recommendation);
      
      Alert.alert(
        'Success',
        'Dispatch created successfully! You can now assign crew and equipment.',
        [
          { text: 'OK' },
          { 
            text: 'View Dispatch', 
            onPress: () => router.push('/dispatch')
          }
        ]
      );
      
      // Refresh to update the list
      fetchData();
    } catch (error) {
      console.error('Error creating dispatch:', error);
      Alert.alert('Error', 'Failed to create dispatch. Please try again.');
    } finally {
      setCreatingDispatch(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'normal': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'snow': return 'snow';
      case 'rain': return 'rainy';
      case 'clouds': return 'cloud';
      case 'clear': return 'sunny';
      default: return 'cloud-outline';
    }
  };

  const filteredRecommendations = data?.dispatch_recommendations?.filter((rec: WeatherRecommendation) => {
    if (filterPriority === 'all') return true;
    return rec.priority_level === filterPriority;
  }) || [];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing weather data...</Text>
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header - Simple, always visible */}
      <View style={styles.header}>
        {!(isWeb && isAdmin) && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>☁️ Weather</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Current Weather */}
        {data?.current_weather && (
          <View style={styles.currentWeatherCard}>
            <View style={styles.weatherHeader}>
              <Ionicons name={getWeatherIcon(data.current_weather.condition)} size={48} color={Colors.primary} />
              <View style={styles.weatherInfo}>
                <Text style={styles.currentTemp}>{data.current_weather.temperature}°C</Text>
                <Text style={styles.currentCondition}>{data.current_weather.description}</Text>
              </View>
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="water" size={16} color={Colors.textSecondary} />
                <Text style={styles.weatherDetailText}>Snow: {data.current_weather.precipitation.snow}cm</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="speedometer" size={16} color={Colors.textSecondary} />
                <Text style={styles.weatherDetailText}>Wind: {data.current_weather.wind_speed.toFixed(1)}km/h</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3-Day Forecast */}
        <Text style={styles.sectionTitle}>3-Day Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {data?.forecast?.map((day: ForecastDay, index: number) => (
            <View key={index} style={styles.forecastCard}>
              <Text style={styles.forecastDay}>{day.day_name}</Text>
              <Ionicons name={getWeatherIcon(day.condition)} size={32} color={Colors.primary} />
              <Text style={styles.forecastTemp}>
                {day.temperature_max}° / {day.temperature_min}°
              </Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(day.snow_risk) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(day.snow_risk) }]}>
                  {day.snow_risk.toUpperCase()}
                </Text>
              </View>
              {day.precipitation.snow > 0 && (
                <Text style={styles.forecastSnow}>❄️ {day.precipitation.snow}cm</Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Operational Recommendations */}
        {data?.operational_recommendations && data.operational_recommendations.length > 0 && (
          <View style={styles.operationalCard}>
            <Text style={styles.operationalTitle}>📋 Operational Recommendations</Text>
            {data.operational_recommendations.map((rec: string, index: number) => (
              <Text key={index} style={styles.operationalItem}>• {rec}</Text>
            ))}
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.total_recommendations || 0}</Text>
            <Text style={styles.statLabel}>Total Recommendations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {data?.high_priority_count || 0}
            </Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[styles.filterChip, filterPriority === 'all' && styles.filterChipActive]}
            onPress={() => setFilterPriority('all')}
          >
            <Text style={[styles.filterChipText, filterPriority === 'all' && styles.filterChipTextActive]}>
              All ({data?.dispatch_recommendations?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterPriority === 'high' && styles.filterChipActive]}
            onPress={() => setFilterPriority('high')}
          >
            <Text style={[styles.filterChipText, filterPriority === 'high' && styles.filterChipTextActive]}>
              High ({data?.high_priority_count || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterPriority === 'medium' && styles.filterChipActive]}
            onPress={() => setFilterPriority('medium')}
          >
            <Text style={[styles.filterChipText, filterPriority === 'medium' && styles.filterChipTextActive]}>
              Medium
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterPriority === 'normal' && styles.filterChipActive]}
            onPress={() => setFilterPriority('normal')}
          >
            <Text style={[styles.filterChipText, filterPriority === 'normal' && styles.filterChipTextActive]}>
              Normal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dispatch Recommendations */}
        <Text style={styles.sectionTitle}>Recommended Dispatches</Text>
        {filteredRecommendations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.emptyText}>No recommendations for this priority level</Text>
          </View>
        ) : (
          filteredRecommendations.map((rec: WeatherRecommendation, index: number) => (
            <View key={`${rec.site_id}-${rec.date}`} style={styles.recommendationCard}>
              <View style={styles.recHeader}>
                <View style={styles.recHeaderLeft}>
                  <Text style={styles.recSiteName}>{rec.site_name}</Text>
                  <Text style={styles.recDate}>{rec.day_name}, {rec.date}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority_level) }]}>
                  <Text style={styles.priorityText}>{rec.priority_level.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.recAddress}>{rec.site_address}</Text>

              <View style={styles.recWeather}>
                <Ionicons name="snow" size={16} color={Colors.textSecondary} />
                <Text style={styles.recWeatherText}>
                  {rec.weather_conditions.snow_amount}cm snow, {rec.weather_conditions.temp_min}° to {rec.weather_conditions.temp_max}°C
                </Text>
              </View>

              <View style={styles.recServices}>
                {rec.recommended_services.map((service, idx) => (
                  <View key={idx} style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{service.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.recFooter}>
                <View style={styles.recDuration}>
                  <Ionicons name="time" size={16} color={Colors.textSecondary} />
                  <Text style={styles.recDurationText}>~{rec.estimated_duration_minutes} min</Text>
                </View>
                <TouchableOpacity
                  style={[styles.createButton, creatingDispatch === rec.site_id && styles.createButtonDisabled]}
                  onPress={() => createDispatch(rec)}
                  disabled={creatingDispatch === rec.site_id}
                >
                  {creatingDispatch === rec.site_id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color={Colors.white} />
                      <Text style={styles.createButtonText}>Create Dispatch</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Wrap with WebAdminLayout for web admin users
  if (isWeb && isAdmin) {
    return <WebAdminLayout>{content}</WebAdminLayout>;
  }

  return content;
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
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  currentWeatherCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  weatherInfo: {
    flex: 1,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  currentCondition: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  forecastScroll: {
    marginBottom: 24,
  },
  forecastCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  forecastSnow: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  operationalCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  operationalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 12,
  },
  operationalItem: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  recommendationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recHeaderLeft: {
    flex: 1,
  },
  recSiteName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  recAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  recWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  recWeatherText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recDurationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
