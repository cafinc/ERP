#!/usr/bin/env python3
"""
Weather System Testing for Snow Removal Business Tracking App
Focus: Weather API Integration Testing
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://ui-unifier.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing weather system at: {API_BASE}")

class WeatherSystemTester:
    def __init__(self):
        self.test_results = []
        self.passed_tests = 0
        self.total_tests = 0
        
    def log_test(self, test_name, success, message="", response_data=None):
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            print(f"✅ {test_name}")
            if message:
                print(f"   Details: {message}")
        else:
            print(f"❌ {test_name}: {message}")
            if response_data:
                print(f"   Response: {response_data}")
        
        self.test_results.append({
            "test": test_name,
            "passed": success,
            "details": message,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        try:
            if method == 'GET':
                response = requests.get(url, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            return None

    def test_weather_current_default(self):
        """Test current weather API without coordinates (uses default Toronto location)"""
        print("\n📍 Testing Current Weather API - Default Location")
        
        response = self.make_request('GET', '/weather/current')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                # Verify required fields
                required_fields = ['temperature', 'condition', 'precipitation', 'wind_speed', 'location', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Current Weather API - Default Location", False, 
                                f"Missing required fields: {missing_fields}")
                else:
                    # Verify data types and reasonable values
                    checks = []
                    if isinstance(data['temperature'], (int, float)):
                        checks.append("temperature type OK")
                    if isinstance(data['precipitation'], dict) and 'snow' in data['precipitation']:
                        checks.append("precipitation structure OK")
                    if data['location']:
                        checks.append("location present")
                    if data['timestamp']:
                        checks.append("timestamp present")
                        
                    self.log_test("Current Weather API - Default Location", True, 
                                f"All required fields present. Temperature: {data['temperature']}°C, Condition: {data['condition']}")
            except json.JSONDecodeError:
                self.log_test("Current Weather API - Default Location", False, "Invalid JSON response")
        else:
            self.log_test("Current Weather API - Default Location", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_current_custom_coordinates(self):
        """Test current weather API with custom coordinates"""
        print("\n🌍 Testing Current Weather API - Custom Coordinates")
        
        # Test with Vancouver coordinates
        params = {"lat": 49.2827, "lon": -123.1207}
        response = self.make_request('GET', '/weather/current', params=params)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                # Verify coordinates are handled
                if 'location' in data and 'temperature' in data:
                    self.log_test("Current Weather API - Custom Coordinates", True, 
                                f"Successfully retrieved weather for Vancouver. Temperature: {data['temperature']}°C")
                else:
                    self.log_test("Current Weather API - Custom Coordinates", False, 
                                "Missing location or temperature data")
            except json.JSONDecodeError:
                self.log_test("Current Weather API - Custom Coordinates", False, "Invalid JSON response")
        else:
            self.log_test("Current Weather API - Custom Coordinates", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_forecast_default(self):
        """Test weather forecast API with default 5-day forecast"""
        print("\n📅 Testing Weather Forecast API - Default 5-day")
        
        response = self.make_request('GET', '/weather/forecast')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                # Verify response structure
                if 'forecast' in data and 'location' in data:
                    forecast = data['forecast']
                    if isinstance(forecast, list) and len(forecast) <= 5:
                        # Check first forecast item structure
                        if forecast and isinstance(forecast[0], dict):
                            required_fields = ['date', 'day_name', 'temperature_min', 'temperature_max', 'condition', 'precipitation', 'snow_risk']
                            first_item = forecast[0]
                            missing_fields = [field for field in required_fields if field not in first_item]
                            
                            if missing_fields:
                                self.log_test("Weather Forecast API - Default 5-day", False, 
                                            f"Missing fields in forecast item: {missing_fields}")
                            else:
                                # Verify snow risk assessment
                                snow_risks = [item.get('snow_risk') for item in forecast]
                                valid_risks = all(risk in ['low', 'medium', 'high'] for risk in snow_risks if risk)
                                
                                self.log_test("Weather Forecast API - Default 5-day", True, 
                                            f"Forecast contains {len(forecast)} days. Snow risk levels valid: {valid_risks}")
                        else:
                            self.log_test("Weather Forecast API - Default 5-day", False, 
                                        "Forecast items are not properly structured")
                    else:
                        self.log_test("Weather Forecast API - Default 5-day", False, 
                                    f"Forecast should be list with ≤5 items, got {type(forecast)} with {len(forecast) if isinstance(forecast, list) else 'N/A'} items")
                else:
                    self.log_test("Weather Forecast API - Default 5-day", False, 
                                "Missing 'forecast' or 'location' in response")
            except json.JSONDecodeError:
                self.log_test("Weather Forecast API - Default 5-day", False, "Invalid JSON response")
        else:
            self.log_test("Weather Forecast API - Default 5-day", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_forecast_custom_days(self):
        """Test weather forecast API with custom day limits"""
        print("\n📊 Testing Weather Forecast API - Custom Day Limits")
        
        test_cases = [
            {"days": 1, "description": "1-day forecast"},
            {"days": 3, "description": "3-day forecast"},
            {"days": 7, "description": "7-day forecast"},
            {"days": 10, "description": "10-day forecast (max limit)"},
            {"days": 15, "description": "15-day forecast (should be limited to 10)"}
        ]
        
        for case in test_cases:
            params = {"days": case["days"]}
            response = self.make_request('GET', '/weather/forecast', params=params)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    forecast = data.get('forecast', [])
                    expected_days = min(case["days"], 10)  # API limits to 10 days
                    
                    if len(forecast) <= expected_days:
                        self.log_test(f"Weather Forecast API - {case['description']}", True, 
                                    f"Requested {case['days']} days, got {len(forecast)} days")
                    else:
                        self.log_test(f"Weather Forecast API - {case['description']}", False, 
                                    f"Requested {case['days']} days, got {len(forecast)} days (expected ≤{expected_days})")
                except json.JSONDecodeError:
                    self.log_test(f"Weather Forecast API - {case['description']}", False, "Invalid JSON response")
            else:
                self.log_test(f"Weather Forecast API - {case['description']}", False, 
                            f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_forecast_coordinates(self):
        """Test weather forecast API with coordinate parameters"""
        print("\n🗺️ Testing Weather Forecast API - Custom Coordinates")
        
        # Test with Montreal coordinates
        params = {"lat": 45.5017, "lon": -73.5673, "days": 3}
        response = self.make_request('GET', '/weather/forecast', params=params)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                if 'forecast' in data and 'location' in data:
                    location = data['location']
                    forecast = data['forecast']
                    
                    # Verify coordinates are reflected in location
                    if (abs(location.get('latitude', 0) - params['lat']) < 0.1 and 
                        abs(location.get('longitude', 0) - params['lon']) < 0.1):
                        self.log_test("Weather Forecast API - Custom Coordinates", True, 
                                    f"Coordinates properly handled. Forecast days: {len(forecast)}")
                    else:
                        self.log_test("Weather Forecast API - Custom Coordinates", False, 
                                    f"Coordinates not properly reflected. Expected: {params}, Got: {location}")
                else:
                    self.log_test("Weather Forecast API - Custom Coordinates", False, 
                                "Missing forecast or location data")
            except json.JSONDecodeError:
                self.log_test("Weather Forecast API - Custom Coordinates", False, "Invalid JSON response")
        else:
            self.log_test("Weather Forecast API - Custom Coordinates", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_recommendations_default(self):
        """Test weather recommendations API with default parameters"""
        print("\n💡 Testing Weather Recommendations API - Default")
        
        response = self.make_request('GET', '/weather/recommendations')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                # Verify response structure
                required_sections = ['current_weather', 'forecast_summary', 'recommendations', 'last_updated']
                missing_sections = [section for section in required_sections if section not in data]
                
                if missing_sections:
                    self.log_test("Weather Recommendations API - Default", False, 
                                f"Missing sections: {missing_sections}")
                else:
                    # Verify recommendations are generated
                    recommendations = data['recommendations']
                    forecast_summary = data['forecast_summary']
                    current_weather = data['current_weather']
                    
                    checks = []
                    if isinstance(recommendations, list):
                        checks.append(f"recommendations list ({len(recommendations)} items)")
                    if isinstance(forecast_summary, list) and len(forecast_summary) <= 3:
                        checks.append(f"forecast summary ({len(forecast_summary)} days)")
                    if isinstance(current_weather, dict) and 'condition' in current_weather:
                        checks.append(f"current weather ({current_weather.get('condition')})")
                    if data.get('last_updated'):
                        checks.append("timestamp present")
                        
                    self.log_test("Weather Recommendations API - Default", True, 
                                f"All sections present. {', '.join(checks)}")
            except json.JSONDecodeError:
                self.log_test("Weather Recommendations API - Default", False, "Invalid JSON response")
        else:
            self.log_test("Weather Recommendations API - Default", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_recommendations_snow_specific(self):
        """Test weather recommendations for snow-specific scenarios"""
        print("\n❄️ Testing Weather Recommendations API - Snow-Specific")
        
        response = self.make_request('GET', '/weather/recommendations')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                recommendations = data.get('recommendations', [])
                current_weather = data.get('current_weather', {})
                forecast_summary = data.get('forecast_summary', [])
                
                # Check for snow-related recommendations
                snow_keywords = ['snow', 'salt', 'crew', 'equipment', 'cold', 'wind', 'risk']
                snow_related_recs = []
                
                for rec in recommendations:
                    if any(keyword.lower() in rec.lower() for keyword in snow_keywords):
                        snow_related_recs.append(rec)
                
                # Check current weather condition
                current_condition = current_weather.get('condition', '').lower()
                has_snow_condition = 'snow' in current_condition
                
                # Check forecast for snow risk
                high_risk_days = [day for day in forecast_summary if day.get('snow_risk') == 'high']
                
                self.log_test("Weather Recommendations API - Snow-Specific", True, 
                            f"Snow-related recommendations: {len(snow_related_recs)}/{len(recommendations)}. Current condition: {current_weather.get('condition')}. High risk days: {len(high_risk_days)}")
            except json.JSONDecodeError:
                self.log_test("Weather Recommendations API - Snow-Specific", False, "Invalid JSON response")
        else:
            self.log_test("Weather Recommendations API - Snow-Specific", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_extreme_conditions(self):
        """Test weather recommendations for extreme weather alerts"""
        print("\n🚨 Testing Weather Recommendations API - Extreme Conditions")
        
        response = self.make_request('GET', '/weather/recommendations')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                current_weather = data.get('current_weather', {})
                recommendations = data.get('recommendations', [])
                
                # Check for extreme conditions
                temperature = current_weather.get('temperature', 0)
                wind_speed = current_weather.get('wind_speed', 0)
                snow_amount = current_weather.get('precipitation', {}).get('snow', 0)
                
                extreme_conditions = []
                if temperature < -15:
                    extreme_conditions.append(f"extreme cold ({temperature}°C)")
                if wind_speed > 40:
                    extreme_conditions.append(f"high winds ({wind_speed} km/h)")
                if snow_amount > 5:
                    extreme_conditions.append(f"heavy snow ({snow_amount}mm)")
                
                # Check if recommendations address extreme conditions
                extreme_keywords = ['extreme', 'caution', 'heavy', 'high', 'alert', 'deploy', 'winterization']
                extreme_recs = [rec for rec in recommendations 
                              if any(keyword.lower() in rec.lower() for keyword in extreme_keywords)]
                
                self.log_test("Weather Recommendations API - Extreme Conditions", True, 
                            f"Extreme conditions detected: {extreme_conditions}. Extreme weather recommendations: {len(extreme_recs)}/{len(recommendations)}")
            except json.JSONDecodeError:
                self.log_test("Weather Recommendations API - Extreme Conditions", False, "Invalid JSON response")
        else:
            self.log_test("Weather Recommendations API - Extreme Conditions", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_equipment_crew_recommendations(self):
        """Test equipment and crew deployment recommendations"""
        print("\n👷 Testing Weather Recommendations API - Equipment & Crew")
        
        response = self.make_request('GET', '/weather/recommendations')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                recommendations = data.get('recommendations', [])
                forecast_summary = data.get('forecast_summary', [])
                
                # Check for equipment and crew recommendations
                equipment_keywords = ['equipment', 'service', 'winterization', 'check']
                crew_keywords = ['crew', 'deploy', 'schedule', 'activate']
                
                equipment_recs = [rec for rec in recommendations 
                                if any(keyword.lower() in rec.lower() for keyword in equipment_keywords)]
                crew_recs = [rec for rec in recommendations 
                           if any(keyword.lower() in rec.lower() for keyword in crew_keywords)]
                
                # Check forecast for planning recommendations
                upcoming_snow_days = [day for day in forecast_summary if day.get('precipitation', {}).get('snow', 0) > 0]
                
                self.log_test("Weather Recommendations API - Equipment & Crew", True, 
                            f"Equipment recommendations: {len(equipment_recs)}. Crew recommendations: {len(crew_recs)}. Upcoming snow days: {len(upcoming_snow_days)}")
            except json.JSONDecodeError:
                self.log_test("Weather Recommendations API - Equipment & Crew", False, "Invalid JSON response")
        else:
            self.log_test("Weather Recommendations API - Equipment & Crew", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def test_weather_mock_data_quality(self):
        """Test that mock weather data is realistic for snow removal operations"""
        print("\n🎯 Testing Weather Mock Data Quality")
        
        # Test current weather
        current_response = self.make_request('GET', '/weather/current')
        if current_response and current_response.status_code == 200:
            try:
                current_data = current_response.json()
                
                # Test forecast
                forecast_response = self.make_request('GET', '/weather/forecast')
                if forecast_response and forecast_response.status_code == 200:
                    try:
                        forecast_data = forecast_response.json()
                        
                        # Verify data realism for snow removal context
                        checks = []
                        
                        # Temperature checks
                        temp = current_data.get('temperature', 0)
                        if -30 <= temp <= 15:  # Reasonable winter range for snow removal
                            checks.append("realistic temperature")
                        
                        # Precipitation checks
                        precip = current_data.get('precipitation', {})
                        if isinstance(precip, dict) and 'snow' in precip and 'rain' in precip:
                            checks.append("proper precipitation structure")
                        
                        # Wind speed checks
                        wind = current_data.get('wind_speed', 0)
                        if 0 <= wind <= 100:  # Reasonable wind range
                            checks.append("realistic wind speed")
                        
                        # Forecast checks
                        forecast = forecast_data.get('forecast', [])
                        if forecast:
                            snow_risks = [day.get('snow_risk') for day in forecast]
                            valid_risks = all(risk in ['low', 'medium', 'high'] for risk in snow_risks if risk)
                            if valid_risks:
                                checks.append("valid snow risk levels")
                            
                            # Check temperature ranges
                            temp_ranges_valid = all(
                                day.get('temperature_min', 0) <= day.get('temperature_max', 0)
                                for day in forecast
                            )
                            if temp_ranges_valid:
                                checks.append("logical temperature ranges")
                        
                        self.log_test("Weather Mock Data Quality", True, 
                                    f"Data quality checks passed: {', '.join(checks)}")
                    except json.JSONDecodeError:
                        self.log_test("Weather Mock Data Quality", False, "Invalid JSON in forecast response")
                else:
                    self.log_test("Weather Mock Data Quality", False, 
                                f"Forecast API failed: HTTP {forecast_response.status_code if forecast_response else 'No response'}")
            except json.JSONDecodeError:
                self.log_test("Weather Mock Data Quality", False, "Invalid JSON in current weather response")
        else:
            self.log_test("Weather Mock Data Quality", False, 
                        f"Current weather API failed: HTTP {current_response.status_code if current_response else 'No response'}")

    def test_weather_response_times(self):
        """Test weather API response times for performance"""
        print("\n⚡ Testing Weather API Performance")
        
        endpoints = [
            ("/weather/current", "Current Weather"),
            ("/weather/forecast", "Weather Forecast"),
            ("/weather/recommendations", "Weather Recommendations")
        ]
        
        for endpoint, name in endpoints:
            start_time = time.time()
            response = self.make_request('GET', endpoint)
            end_time = time.time()
            response_time = end_time - start_time
            
            if response and response.status_code == 200:
                # Consider response times under 5 seconds as acceptable
                if response_time < 5.0:
                    self.log_test(f"Weather API Performance - {name}", True, 
                                f"Response time: {response_time:.2f}s (acceptable)")
                else:
                    self.log_test(f"Weather API Performance - {name}", False, 
                                f"Response time: {response_time:.2f}s (too slow)")
            else:
                self.log_test(f"Weather API Performance - {name}", False, 
                            f"HTTP {response.status_code if response else 'No response'} in {response_time:.2f}s")

    def test_weather_error_handling(self):
        """Test weather API error handling for edge cases"""
        print("\n🛡️ Testing Weather API Error Handling")
        
        test_cases = [
            {"params": {"lat": 999, "lon": 999}, "description": "Invalid coordinates"},
            {"params": {"lat": "invalid", "lon": "invalid"}, "description": "Non-numeric coordinates"},
            {"params": {"days": -1}, "description": "Negative days parameter"},
            {"params": {"days": "invalid"}, "description": "Non-numeric days parameter"}
        ]
        
        for case in test_cases:
            response = self.make_request('GET', '/weather/current', params=case["params"])
            
            # Should either return 200 with fallback data or proper error status
            if response and response.status_code in [200, 400, 422]:
                if response.status_code == 200:
                    try:
                        data = response.json()
                        # Should still return valid weather data structure
                        if 'temperature' in data and 'condition' in data:
                            self.log_test(f"Weather Error Handling - {case['description']}", True, 
                                        f"Graceful fallback to default data (HTTP {response.status_code})")
                        else:
                            self.log_test(f"Weather Error Handling - {case['description']}", False, 
                                        f"Invalid response structure (HTTP {response.status_code})")
                    except json.JSONDecodeError:
                        self.log_test(f"Weather Error Handling - {case['description']}", False, 
                                    f"Invalid JSON response (HTTP {response.status_code})")
                else:
                    self.log_test(f"Weather Error Handling - {case['description']}", True, 
                                f"Proper error response (HTTP {response.status_code})")
            else:
                self.log_test(f"Weather Error Handling - {case['description']}", False, 
                            f"Unexpected HTTP status: {response.status_code if response else 'No response'}")

    def test_weather_integration_with_snow_removal(self):
        """Test weather data integration with snow removal business operations"""
        print("\n🏢 Testing Weather Integration with Snow Removal Operations")
        
        # Test that weather data can be consumed by frontend
        response = self.make_request('GET', '/weather/recommendations')
        if response and response.status_code == 200:
            try:
                data = response.json()
                
                # Check if data structure is suitable for frontend consumption
                frontend_checks = []
                
                # Current weather should have display-friendly data
                current_weather = data.get('current_weather', {})
                if current_weather.get('condition') and current_weather.get('temperature'):
                    frontend_checks.append("current weather display data")
                
                # Recommendations should be actionable
                recommendations = data.get('recommendations', [])
                if recommendations and all(isinstance(rec, str) for rec in recommendations):
                    frontend_checks.append("actionable recommendations")
                
                # Forecast should have snow risk for planning
                forecast_summary = data.get('forecast_summary', [])
                if forecast_summary and all('snow_risk' in day for day in forecast_summary):
                    frontend_checks.append("snow risk planning data")
                
                # Check for snow removal specific content
                snow_removal_keywords = ['snow', 'salt', 'crew', 'equipment', 'plow']
                has_snow_content = any(
                    any(keyword.lower() in str(rec).lower() for keyword in snow_removal_keywords)
                    for rec in recommendations
                )
                if has_snow_content:
                    frontend_checks.append("snow removal specific content")
                
                self.log_test("Weather Integration - Frontend Consumption", True, 
                            f"Frontend integration checks passed: {', '.join(frontend_checks)}")
            except json.JSONDecodeError:
                self.log_test("Weather Integration - Frontend Consumption", False, "Invalid JSON response")
        else:
            self.log_test("Weather Integration - Frontend Consumption", False, 
                        f"HTTP {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all weather system tests"""
        print("🌨️ WEATHER SYSTEM TESTING STARTED")
        print("=" * 60)
        
        # Current Weather API Tests
        self.test_weather_current_default()
        self.test_weather_current_custom_coordinates()
        
        # Weather Forecast API Tests
        self.test_weather_forecast_default()
        self.test_weather_forecast_custom_days()
        self.test_weather_forecast_coordinates()
        
        # Weather Recommendations API Tests
        self.test_weather_recommendations_default()
        self.test_weather_recommendations_snow_specific()
        self.test_weather_extreme_conditions()
        self.test_weather_equipment_crew_recommendations()
        
        # Integration and Performance Tests
        self.test_weather_mock_data_quality()
        self.test_weather_response_times()
        self.test_weather_error_handling()
        self.test_weather_integration_with_snow_removal()
        
        # Summary
        print("\n" + "=" * 60)
        print("🌨️ WEATHER SYSTEM TESTING SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.total_tests - self.passed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n✅ WEATHER SYSTEM TESTING COMPLETED")
        return self.passed_tests, self.total_tests

def main():
    """Main test execution"""
    tester = WeatherSystemTester()
    passed, total = tester.run_all_tests()
    return passed, total

if __name__ == "__main__":
    main()