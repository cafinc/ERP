import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';

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

export default function WeatherWidget() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      const response = await api.get('/dispatch/weather-recommendations');
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Responsive sizing
  const isSmallScreen = width < 600;
  const isMediumScreen = width >= 600 && width < 1024;
  const isLargeScreen = width >= 1024;

  if (loading) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          isLargeScreen && styles.containerLarge,
          isMediumScreen && styles.containerMedium,
        ]}
        onPress={() => router.push('/weather-planning')}
      >
        <ActivityIndicator size="small" color={Colors.primary} />
      </TouchableOpacity>
    );
  }

  const todayForecast = weatherData?.forecast_summary?.[0];
  const location = weatherData?.location || {};
  const highPriorityCount = weatherData?.dispatch_recommendations?.filter(
    (rec: any) => rec.priority_level === 'high'
  ).length || 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isLargeScreen && styles.containerLarge,
        isMediumScreen && styles.containerMedium,
      ]}
      onPress={() => router.push('/weather-planning')}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cloud-outline" size={isSmallScreen ? 24 : 28} color={Colors.primary} />
          <Text style={[styles.title, isLargeScreen && styles.titleLarge]}>Weather</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>

      {todayForecast ? (
        <View style={[styles.content, isLargeScreen && styles.contentLarge]}>
          {/* Main Weather Info */}
          <View style={styles.mainWeather}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#6b7280" />
              <Text style={styles.locationText}>
                {location.city || 'Unknown'}, {location.region || ''}
              </Text>
            </View>
            
            <View style={styles.weatherRow}>
              <Ionicons 
                name={getWeatherIcon(todayForecast.condition)} 
                size={isSmallScreen ? 40 : isLargeScreen ? 56 : 48} 
                color="#0284c7" 
              />
              <View style={styles.tempContainer}>
                <Text style={[styles.temperature, isLargeScreen && styles.temperatureLarge]}>
                  {Math.round(todayForecast.temperature_max)}°
                </Text>
                <Text style={styles.tempRange}>
                  {Math.round(todayForecast.temperature_min)}° - {Math.round(todayForecast.temperature_max)}°
                </Text>
              </View>
              <View style={styles.conditionContainer}>
                <Text style={[styles.condition, isLargeScreen && styles.conditionLarge]}>
                  {todayForecast.condition}
                </Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(todayForecast.snow_risk) + '20' }]}>
                  <Text style={[styles.riskText, { color: getRiskColor(todayForecast.snow_risk) }]}>
                    {todayForecast.snow_risk.toUpperCase()} RISK
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={[styles.statsRow, isLargeScreen && styles.statsRowLarge]}>
            {todayForecast.precipitation.snow > 0 && (
              <View style={styles.stat}>
                <Ionicons name="snow" size={16} color="#6b7280" />
                <Text style={styles.statText}>{todayForecast.precipitation.snow}" snow</Text>
              </View>
            )}
            {todayForecast.precipitation.rain > 0 && (
              <View style={styles.stat}>
                <Ionicons name="rainy" size={16} color="#6b7280" />
                <Text style={styles.statText}>{todayForecast.precipitation.rain}" rain</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Ionicons name="water" size={16} color="#6b7280" />
              <Text style={styles.statText}>{todayForecast.humidity}%</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="speedometer" size={16} color="#6b7280" />
              <Text style={styles.statText}>{todayForecast.wind_speed} mph</Text>
            </View>
          </View>

          {/* Alert for high priority dispatches */}
          {highPriorityCount > 0 && (
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={16} color="#ef4444" />
              <Text style={styles.alertText}>
                {highPriorityCount} high priority {highPriorityCount === 1 ? 'site' : 'sites'} need attention
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>No weather data available</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerMedium: {
    padding: 20,
    borderRadius: 16,
  },
  containerLarge: {
    padding: 24,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  titleLarge: {
    fontSize: 20,
  },
  content: {
    gap: 12,
  },
  contentLarge: {
    gap: 16,
  },
  mainWeather: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempContainer: {
    gap: 2,
  },
  temperature: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  temperatureLarge: {
    fontSize: 42,
  },
  tempRange: {
    fontSize: 12,
    color: '#6b7280',
  },
  conditionContainer: {
    flex: 1,
    gap: 6,
  },
  condition: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  conditionLarge: {
    fontSize: 18,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statsRowLarge: {
    gap: 16,
    paddingTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6b7280',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  noData: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
