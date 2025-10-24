'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  RefreshCw,
  Bell,
  CheckCircle,
} from 'lucide-react';

interface WeatherData {
  location: string;
  current: {
    temp: number;
    feels_like: number;
    conditions: string;
    humidity: number;
    wind_speed: number;
    visibility: number;
    precipitation: number;
  };
  forecast: Array<{
    date: string;
    day: string;
    high: number;
    low: number;
    conditions: string;
    precipitation_chance: number;
    snow_amount?: number;
    wind_speed: number;
  }>;
  alerts?: Array<{
    event: string;
    severity: string;
    description: string;
    start: string;
    end: string;
  }>;
}

export default function WeatherPlanningPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Boston, MA');
  const [crewAlerts, setCrewAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadWeather();
  }, [location]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      // Mock weather data for now - in production would call weather API
      const mockData: WeatherData = {
        location: location,
        current: {
          temp: 28,
          feels_like: 22,
          conditions: 'Snow',
          humidity: 85,
          wind_speed: 15,
          visibility: 2,
          precipitation: 0.5
        },
        forecast: [
          {
            date: new Date().toISOString(),
            day: 'Today',
            high: 30,
            low: 22,
            conditions: 'Heavy Snow',
            precipitation_chance: 90,
            snow_amount: 8,
            wind_speed: 20
          },
          {
            date: new Date(Date.now() + 86400000).toISOString(),
            day: 'Tomorrow',
            high: 25,
            low: 18,
            conditions: 'Light Snow',
            precipitation_chance: 60,
            snow_amount: 3,
            wind_speed: 12
          },
          {
            date: new Date(Date.now() + 172800000).toISOString(),
            day: 'Wed',
            high: 32,
            low: 24,
            conditions: 'Cloudy',
            precipitation_chance: 20,
            wind_speed: 8
          },
          {
            date: new Date(Date.now() + 259200000).toISOString(),
            day: 'Thu',
            high: 35,
            low: 28,
            conditions: 'Partly Cloudy',
            precipitation_chance: 10,
            wind_speed: 6
          },
          {
            date: new Date(Date.now() + 345600000).toISOString(),
            day: 'Fri',
            high: 28,
            low: 20,
            conditions: 'Snow Showers',
            precipitation_chance: 70,
            snow_amount: 2,
            wind_speed: 15
          }
        ],
        alerts: [
          {
            event: 'Winter Storm Warning',
            severity: 'Severe',
            description: 'Heavy snow expected. Total accumulations of 6 to 10 inches.',
            start: new Date().toISOString(),
            end: new Date(Date.now() + 43200000).toISOString()
          }
        ]
      };
      setWeather(mockData);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConditionIcon = (conditions: string) => {
    const lower = conditions.toLowerCase();
    if (lower.includes('snow')) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Weather"
        subtitle="Manage weather"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Weather" }]}
      />
      <CloudSnow className="w-6 h-6" />;
    if (lower.includes('rain')) return <CloudRain className="w-6 h-6" />;
    return <Cloud className="w-6 h-6" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe': return 'bg-red-100 border-red-500 text-red-900';
      case 'moderate': return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'minor': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default: return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const handleSendCrewAlert = async () => {
    const message = prompt('Enter crew alert message:');
    if (!message) return;
    
    try {
      // In production, would call API to send SMS/notifications
      setCrewAlerts([...crewAlerts, message]);
      alert('Crew alert sent successfully!');
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send crew alert');
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  if (!weather) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load weather data</p>
        </div>
      );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weather Planning</h1>
            <p className="text-gray-600 mt-1">Monitor conditions and plan operations</p>
          </div>
          <div className="flex gap-3">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Boston, MA">Boston, MA</option>
              <option value="New York, NY">New York, NY</option>
              <option value="Chicago, IL">Chicago, IL</option>
              <option value="Minneapolis, MN">Minneapolis, MN</option>
            </select>
            <button
              onClick={handleSendCrewAlert}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 "
            >
              <Bell className="w-5 h-5 " />
              Alert Crew
            </button>
            <button
              onClick={loadWeather}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 "
            >
              <RefreshCw className="w-5 h-5 " />
              Refresh
            </button>
          </div>
        </div>

        {/* Weather Alerts */}
        {weather.alerts && weather.alerts.length > 0 && (
          <div className="space-y-3">
            {weather.alerts.map((alert, index) => (
              <div key={index} className={`border-l-4 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{alert.event}</h3>
                    <p className="text-sm mt-1">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span>Starts: {new Date(alert.start).toLocaleString()}</span>
                      <span>Ends: {new Date(alert.end).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Conditions */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 " />
                <h2 className="text-2xl font-semibold">{weather.location}</h2>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {getConditionIcon(weather.current.conditions)}
                  <span className="text-lg">{weather.current.conditions}</span>
                </div>
              </div>
              <div className="text-6xl font-bold mb-2">{weather.current.temp}°F</div>
              <p className="text-lg opacity-90">Feels like {weather.current.feels_like}°F</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 " />
                  <span className="text-sm">Humidity</span>
                </div>
                <p className="text-2xl font-bold">{weather.current.humidity}%</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-5 h-5 " />
                  <span className="text-sm">Wind</span>
                </div>
                <p className="text-2xl font-bold">{weather.current.wind_speed} mph</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 " />
                  <span className="text-sm">Visibility</span>
                </div>
                <p className="text-2xl font-bold">{weather.current.visibility} mi</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CloudSnow className="w-5 h-5 " />
                  <span className="text-sm">Precip Rate</span>
                </div>
                <p className="text-2xl font-bold">{weather.current.precipitation} in/hr</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weather.forecast.map((day, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{day.day}</h3>
                <div className="flex justify-center mb-3">
                  {getConditionIcon(day.conditions)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{day.conditions}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{day.high}°</span>
                  </div>
                  <span className="text-gray-400">/</span>
                  <div className="flex items-center gap-1 text-[#3f72af]">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-semibold">{day.low}°</span>
                  </div>
                </div>
                {day.snow_amount && (
                  <div className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs font-medium mb-2">
                    ❄️ {day.snow_amount} " snow
                  </div>
                )}
                <div className="text-xs text-gray-600">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Droplets className="w-3 h-3 " />
                    {day.precipitation_chance}% precip
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 " />
                    {day.wind_speed} mph
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crew Alerts Sent */}
        {crewAlerts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Crew Alerts</h2>
            <div className="space-y-2">
              {crewAlerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">{alert}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
}
