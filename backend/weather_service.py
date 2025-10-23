#!/usr/bin/env python3
"""
Weather Service for Snow Removal Operations
Provides weather data for operational planning
"""

import asyncio
import aiohttp
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Import weather dispatch automation
try:
    from weather_dispatch import weather_dispatch
    WEATHER_DISPATCH_ENABLED = True
except ImportError:
    print("Weather dispatch automation not available")
    WEATHER_DISPATCH_ENABLED = False

class WeatherService:
    def __init__(self):
        # Using OpenWeatherMap API (free tier available)
        # In production, you'd get an API key from: https://openweathermap.org/api
        self.api_key = os.getenv('OPENWEATHER_API_KEY', 'demo_key')
        self.base_url = "http://api.openweathermap.org/data/2.5"
        
        # Default coordinates - Red Deer, Alberta, Canada
        self.default_lat = 52.2681
        self.default_lon = -113.8111
        self.location_name = "Red Deer, AB"
        
        # Initialize database connection for history
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        self.db = client[os.getenv("DB_NAME", "snow_removal_db")]
        
        # Tracked locations
        self.locations = []

    async def get_current_weather(self, lat: float = None, lon: float = None) -> Dict:
        """Get current weather conditions"""
        try:
            if lat is None or lon is None:
                lat, lon = self.default_lat, self.default_lon
                
            # For demo purposes, return mock data if no API key
            if self.api_key == 'demo_key':
                return self._get_mock_current_weather()
                
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._format_current_weather(data)
                    else:
                        return self._get_mock_current_weather()
                        
        except Exception as e:
            print(f"Weather API error: {e}")
            return self._get_mock_current_weather()

    async def get_forecast(self, lat: float = None, lon: float = None, days: int = 5) -> List[Dict]:
        """Get weather forecast for next few days"""
        try:
            if lat is None or lon is None:
                lat, lon = self.default_lat, self.default_lon
                
            # For demo purposes, return mock data if no API key
            if self.api_key == 'demo_key':
                return self._get_mock_forecast(days)
                
            url = f"{self.base_url}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': days * 8  # 8 forecasts per day (every 3 hours)
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._format_forecast(data, days)
                    else:
                        return self._get_mock_forecast(days)
                        
        except Exception as e:
            print(f"Weather forecast API error: {e}")
            return self._get_mock_forecast(days)

    def _format_current_weather(self, data: Dict) -> Dict:
        """Format current weather data from API response"""
        return {
            'temperature': round(data['main']['temp']),
            'feels_like': round(data['main']['feels_like']),
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'visibility': data.get('visibility', 10000) / 1000,  # Convert to km
            'wind_speed': data['wind']['speed'] * 3.6,  # Convert m/s to km/h
            'wind_direction': data['wind'].get('deg', 0),
            'condition': data['weather'][0]['main'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon'],
            'precipitation': {
                'rain': data.get('rain', {}).get('1h', 0),
                'snow': data.get('snow', {}).get('1h', 0),
            },
            'location': data['name'],
            'timestamp': datetime.now().isoformat(),
            'sunrise': datetime.fromtimestamp(data['sys']['sunrise']).isoformat(),
            'sunset': datetime.fromtimestamp(data['sys']['sunset']).isoformat(),
        }

    def _format_forecast(self, data: Dict, days: int) -> List[Dict]:
        """Format forecast data from API response"""
        forecasts = []
        daily_data = {}
        
        for item in data['list']:
            date = datetime.fromtimestamp(item['dt']).date()
            if date not in daily_data:
                daily_data[date] = {
                    'temps': [],
                    'conditions': [],
                    'precipitation': {'rain': 0, 'snow': 0},
                    'wind': [],
                    'humidity': []
                }
            
            daily_data[date]['temps'].append(item['main']['temp'])
            daily_data[date]['conditions'].append(item['weather'][0]['main'])
            daily_data[date]['precipitation']['rain'] += item.get('rain', {}).get('3h', 0)
            daily_data[date]['precipitation']['snow'] += item.get('snow', {}).get('3h', 0)
            daily_data[date]['wind'].append(item['wind']['speed'] * 3.6)
            daily_data[date]['humidity'].append(item['main']['humidity'])
        
        for date, day_data in list(daily_data.items())[:days]:
            forecasts.append({
                'date': date.isoformat(),
                'day_name': date.strftime('%A'),
                'temperature_min': round(min(day_data['temps'])),
                'temperature_max': round(max(day_data['temps'])),
                'condition': max(set(day_data['conditions']), key=day_data['conditions'].count),
                'precipitation': {
                    'rain': round(day_data['precipitation']['rain'], 1),
                    'snow': round(day_data['precipitation']['snow'], 1),
                },
                'wind_speed': round(sum(day_data['wind']) / len(day_data['wind']), 1),
                'humidity': round(sum(day_data['humidity']) / len(day_data['humidity'])),
                'snow_risk': self._calculate_snow_risk(day_data),
            })
        
        return forecasts

    def _calculate_snow_risk(self, day_data: Dict) -> str:
        """Calculate snow operation risk level"""
        min_temp = min(day_data['temps'])
        max_temp = max(day_data['temps'])
        snow_amount = day_data['precipitation']['snow']
        wind_speed = sum(day_data['wind']) / len(day_data['wind'])
        
        # Risk calculation logic
        risk_score = 0
        
        # Temperature factors
        if min_temp <= -10:
            risk_score += 3
        elif min_temp <= 0:
            risk_score += 2
        elif max_temp <= 5:
            risk_score += 1
            
        # Snow amount factors
        if snow_amount >= 15:
            risk_score += 4
        elif snow_amount >= 8:
            risk_score += 3
        elif snow_amount >= 3:
            risk_score += 2
        elif snow_amount > 0:
            risk_score += 1
            
        # Wind factors
        if wind_speed >= 50:
            risk_score += 2
        elif wind_speed >= 30:
            risk_score += 1
            
        # Determine risk level
        if risk_score >= 6:
            return "high"
        elif risk_score >= 3:
            return "medium"
        else:
            return "low"

    def _get_mock_current_weather(self) -> Dict:
        """Return mock current weather data for demo"""
        return {
            'temperature': -5,
            'feels_like': -8,
            'humidity': 85,
            'pressure': 1013,
            'visibility': 8.0,
            'wind_speed': 15.5,
            'wind_direction': 225,
            'condition': 'Snow',
            'description': 'light snow',
            'icon': '13n',
            'precipitation': {
                'rain': 0,
                'snow': 2.1,
            },
            'location': 'Red Deer',
            'timestamp': datetime.now().isoformat(),
            'sunrise': (datetime.now().replace(hour=7, minute=30, second=0)).isoformat(),
            'sunset': (datetime.now().replace(hour=17, minute=15, second=0)).isoformat(),
        }

    def _get_mock_forecast(self, days: int) -> List[Dict]:
        """Return mock forecast data for demo"""
        forecasts = []
        base_date = datetime.now().date()
        
        mock_conditions = [
            {'condition': 'Snow', 'temp_min': -8, 'temp_max': -2, 'snow': 5.2, 'risk': 'medium'},
            {'condition': 'Clouds', 'temp_min': -3, 'temp_max': 2, 'snow': 0, 'risk': 'low'},
            {'condition': 'Snow', 'temp_min': -12, 'temp_max': -5, 'snow': 8.7, 'risk': 'high'},
            {'condition': 'Clear', 'temp_min': -6, 'temp_max': 1, 'snow': 0, 'risk': 'low'},
            {'condition': 'Snow', 'temp_min': -4, 'temp_max': 0, 'snow': 3.1, 'risk': 'medium'},
        ]
        
        for i in range(days):
            date = base_date + timedelta(days=i)
            mock_data = mock_conditions[i % len(mock_conditions)]
            
            forecasts.append({
                'date': date.isoformat(),
                'day_name': date.strftime('%A'),
                'temperature_min': mock_data['temp_min'],
                'temperature_max': mock_data['temp_max'],
                'condition': mock_data['condition'],
                'precipitation': {
                    'rain': 0,
                    'snow': mock_data['snow'],
                },
                'wind_speed': 12.5,
                'humidity': 78,
                'snow_risk': mock_data['risk'],
            })
            
        return forecasts

    def get_operational_recommendations(self, current_weather: Dict, forecast: List[Dict]) -> List[str]:
        """Generate operational recommendations based on weather"""
        recommendations = []
        
        # Current conditions recommendations
        if current_weather['condition'] == 'Snow':
            if current_weather['precipitation']['snow'] > 5:
                recommendations.append("🚨 Heavy snow detected - Deploy all available crews")
            elif current_weather['precipitation']['snow'] > 2:
                recommendations.append("⚠️ Moderate snow - Activate primary routes")
            else:
                recommendations.append("❄️ Light snow - Monitor and prepare crews")
        
        if current_weather['temperature'] < -15:
            recommendations.append("🥶 Extreme cold - Check equipment winterization")
            
        if current_weather['wind_speed'] > 40:
            recommendations.append("💨 High winds - Exercise caution with equipment")
        
        # Forecast-based recommendations
        high_risk_days = [f for f in forecast if f['snow_risk'] == 'high']
        if high_risk_days:
            recommendations.append(f"📅 {len(high_risk_days)} high-risk days ahead - Schedule extra crews")
            
        upcoming_snow = [f for f in forecast[:3] if f['precipitation']['snow'] > 0]
        if upcoming_snow:
            recommendations.append("🌨️ Snow expected in next 3 days - Prepare salt/sand inventory")
        
        # Equipment recommendations
        if any(f['temperature_min'] < -20 for f in forecast):
            recommendations.append("🔧 Service equipment for extreme cold conditions")
            
        return recommendations[:5]  # Limit to top 5 recommendations

# Global weather service instance
weather_service = WeatherService()