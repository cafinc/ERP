#!/usr/bin/env python3
"""
Focused Backend Testing for Geofence System & Route Optimization
Tests the newly implemented geofence and route optimization features as specified in the review request
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://admin-jsx-fixes.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class GeofenceRouteTestSuite:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Test data storage
        self.test_data = {
            'sites': [],
            'crew': [],
            'dispatches': [],
            'customers': []
        }
        
        # Test results
        self.results = []
        
    def log_test(self, test_name: str, success: bool, details: str, status_code: int = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'status_code': status_code
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> tuple:
        """Make HTTP request and return response and success status"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)
            else:
                return None, False
                
            return response, True
        except Exception as e:
            print(f"Request failed: {e}")
            return None, False
            
    def setup_test_data(self):
        """Setup test data for geofence and route optimization testing"""
        print("🔧 Setting up test data...")
        
        # Get existing sites with GPS coordinates
        response, success = self.make_request('GET', '/sites')
        if success and response.status_code == 200:
            all_sites = response.json()
            sites_with_coords = [s for s in all_sites if s.get('location', {}).get('latitude')]
            self.test_data['sites'] = sites_with_coords[:5]  # Use up to 5 sites
            print(f"✅ Found {len(self.test_data['sites'])} sites with GPS coordinates")
            
            for site in self.test_data['sites']:
                print(f"   - {site['name']}: {site['location']['latitude']}, {site['location']['longitude']}")
        else:
            print("❌ Failed to get sites")
            return False
            
        # Get existing crew members
        response, success = self.make_request('GET', '/users?role=crew')
        if success and response.status_code == 200:
            all_crew = response.json()
            self.test_data['crew'] = all_crew[:2]  # Use up to 2 crew members
            print(f"✅ Found {len(self.test_data['crew'])} crew members")
            
            for crew in self.test_data['crew']:
                print(f"   - {crew['name']} ({crew['id']})")
        else:
            print("❌ Failed to get crew members")
            return False
            
        # Get existing customers
        response, success = self.make_request('GET', '/customers')
        if success and response.status_code == 200:
            all_customers = response.json()
            self.test_data['customers'] = all_customers[:1]  # Use 1 customer
            print(f"✅ Found {len(self.test_data['customers'])} customers")
        else:
            print("❌ Failed to get customers")
            return False
            
        return len(self.test_data['sites']) >= 2 and len(self.test_data['crew']) >= 1
        
    def test_geofence_configuration_endpoints(self):
        """Test geofence configuration endpoints"""
        print("\n🎯 Testing Geofence Configuration Endpoints...")
        
        if not self.test_data['sites']:
            print("⚠️ No test sites available")
            return
            
        site = self.test_data['sites'][0]
        site_id = site['id']
        
        # Test 1: Create geofence with custom radius
        print("1️⃣ Testing POST /api/site-geofences - Create geofence")
        geofence_data = {
            "site_id": site_id,
            "radius_meters": 150.0
        }
        
        response, success = self.make_request('POST', '/site-geofences', geofence_data)
        if success and response.status_code in [200, 201]:
            geofence = response.json()
            
            # Verify geofence properties
            if (geofence.get('site_id') == site_id and 
                geofence.get('radius_meters') == 150.0 and
                geofence.get('latitude') == site['location']['latitude'] and
                geofence.get('longitude') == site['location']['longitude']):
                self.log_test("Create Geofence", True, f"Created geofence with 150m radius for site {site['name']}", response.status_code)
            else:
                self.log_test("Create Geofence", False, "Geofence properties don't match expected values", response.status_code)
        else:
            self.log_test("Create Geofence", False, f"HTTP {response.status_code}: {response.text if response else 'No response'}", response.status_code if response else None)
            
        # Test 2: Try creating duplicate geofence (should update existing)
        print("2️⃣ Testing duplicate geofence creation (should update)")
        duplicate_data = {
            "site_id": site_id,
            "radius_meters": 200.0
        }
        
        response, success = self.make_request('POST', '/site-geofences', duplicate_data)
        if success and response.status_code in [200, 201]:
            updated_geofence = response.json()
            if updated_geofence.get('radius_meters') == 200.0:
                self.log_test("Update Existing Geofence", True, "Duplicate creation updated existing geofence radius to 200m", response.status_code)
            else:
                self.log_test("Update Existing Geofence", False, "Radius not updated correctly", response.status_code)
        else:
            self.log_test("Update Existing Geofence", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
        # Test 3: Get all site geofences
        print("3️⃣ Testing GET /api/site-geofences - Get all geofences")
        response, success = self.make_request('GET', '/site-geofences')
        if success and response.status_code == 200:
            data = response.json()
            geofences = data.get('geofences', [])
            if len(geofences) > 0:
                self.log_test("Get All Geofences", True, f"Retrieved {len(geofences)} geofences", response.status_code)
            else:
                self.log_test("Get All Geofences", False, "No geofences returned", response.status_code)
        else:
            self.log_test("Get All Geofences", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
        # Test 4: Get specific site geofence
        print("4️⃣ Testing GET /api/site-geofences/{site_id} - Get specific geofence")
        response, success = self.make_request('GET', f'/site-geofences/{site_id}')
        if success and response.status_code == 200:
            geofence = response.json()
            if geofence.get('site_id') == site_id:
                self.log_test("Get Specific Geofence", True, f"Retrieved geofence for site {site['name']}", response.status_code)
            else:
                self.log_test("Get Specific Geofence", False, "Wrong site_id in response", response.status_code)
        else:
            self.log_test("Get Specific Geofence", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
        # Test 5: Update geofence
        print("5️⃣ Testing PUT /api/site-geofences/{site_id} - Update geofence")
        update_data = {
            "radius_meters": 175.0,
            "is_active": True
        }
        
        response, success = self.make_request('PUT', f'/site-geofences/{site_id}', update_data)
        if success and response.status_code == 200:
            updated = response.json()
            if updated.get('radius_meters') == 175.0:
                self.log_test("Update Geofence", True, "Updated geofence radius to 175m", response.status_code)
            else:
                self.log_test("Update Geofence", False, "Radius not updated correctly", response.status_code)
        else:
            self.log_test("Update Geofence", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
    def test_geofence_logging_endpoints(self):
        """Test geofence logging endpoints"""
        print("\n🎯 Testing Geofence Logging Endpoints...")
        
        if not (self.test_data['sites'] and self.test_data['crew']):
            print("⚠️ Missing test data for geofence logging")
            return
            
        site = self.test_data['sites'][0]
        crew = self.test_data['crew'][0]
        
        # Create a test dispatch for geofence testing
        dispatch_data = {
            "route_name": "Geofence Test Route",
            "scheduled_date": datetime.now().strftime("%Y-%m-%d"),
            "scheduled_time": "08:00",
            "crew_ids": [crew['id']],
            "site_ids": [site['id']],
            "equipment_ids": [],
            "services": ["plowing"],
            "status": "scheduled",
            "priority": "high"
        }
        
        response, success = self.make_request('POST', '/dispatches', dispatch_data)
        if success and response.status_code in [200, 201]:
            dispatch = response.json()
            self.test_data['dispatches'].append(dispatch)
            print(f"✅ Created test dispatch: {dispatch['id']}")
        else:
            print("⚠️ Failed to create test dispatch for geofence testing")
            return
            
        # Test 6: Create entry event log
        print("6️⃣ Testing POST /api/geofence-logs - Create entry log")
        entry_log_data = {
            "crew_id": crew['id'],
            "site_id": site['id'],
            "dispatch_id": dispatch['id'],
            "event_type": "entry",
            "latitude": site['location']['latitude'],
            "longitude": site['location']['longitude'],
            "manual_click": True,
            "notes": "Manual entry via crew button"
        }
        
        response, success = self.make_request('POST', '/geofence-logs', entry_log_data)
        if success and response.status_code in [200, 201]:
            entry_log = response.json()
            
            # Verify log properties
            if (entry_log.get('event_type') == 'entry' and
                entry_log.get('crew_id') == crew['id'] and
                entry_log.get('site_id') == site['id'] and
                entry_log.get('manual_click') == True):
                self.log_test("Create Entry Log", True, f"Created entry log for {crew['name']} at {site['name']}", response.status_code)
            else:
                self.log_test("Create Entry Log", False, "Entry log properties don't match", response.status_code)
        else:
            self.log_test("Create Entry Log", False, f"HTTP {response.status_code if response else 'No response'}: {response.text if response else ''}", response.status_code if response else None)
            
        # Test 7: Create exit event log
        print("7️⃣ Testing POST /api/geofence-logs - Create exit log")
        exit_log_data = {
            "crew_id": crew['id'],
            "site_id": site['id'],
            "dispatch_id": dispatch['id'],
            "event_type": "exit",
            "latitude": site['location']['latitude'] + 0.001,  # Slightly different location
            "longitude": site['location']['longitude'] + 0.001,
            "manual_click": False,
            "notes": "Auto-detected exit from geofence"
        }
        
        response, success = self.make_request('POST', '/geofence-logs', exit_log_data)
        if success and response.status_code in [200, 201]:
            exit_log = response.json()
            
            if (exit_log.get('event_type') == 'exit' and
                exit_log.get('manual_click') == False):
                self.log_test("Create Exit Log", True, f"Created exit log for {crew['name']} at {site['name']}", response.status_code)
            else:
                self.log_test("Create Exit Log", False, "Exit log properties don't match", response.status_code)
        else:
            self.log_test("Create Exit Log", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
        # Test 8: Get geofence logs with filters
        print("8️⃣ Testing GET /api/geofence-logs - Get logs with filters")
        response, success = self.make_request('GET', f'/geofence-logs?crew_id={crew["id"]}&site_id={site["id"]}')
        if success and response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            if len(logs) >= 2:  # Should have at least entry and exit logs
                self.log_test("Get Filtered Logs", True, f"Retrieved {len(logs)} filtered logs", response.status_code)
            else:
                self.log_test("Get Filtered Logs", False, f"Expected at least 2 logs, got {len(logs)}", response.status_code)
        else:
            self.log_test("Get Filtered Logs", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
        # Test 9: Get site geofence history
        print("9️⃣ Testing GET /api/geofence-logs/site/{site_id}/history - Site history")
        response, success = self.make_request('GET', f'/geofence-logs/site/{site["id"]}/history')
        if success and response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            crew_summary = data.get('crew_summary', [])
            
            if len(logs) > 0 and len(crew_summary) > 0:
                # Verify crew summary structure
                crew_data = crew_summary[0]
                if ('crew_id' in crew_data and 'entries' in crew_data and 'exits' in crew_data):
                    self.log_test("Site History", True, f"Retrieved site history: {len(logs)} logs, {len(crew_summary)} crew summaries", response.status_code)
                else:
                    self.log_test("Site History", False, "Crew summary structure invalid", response.status_code)
            else:
                self.log_test("Site History", False, "No logs or crew summary returned", response.status_code)
        else:
            self.log_test("Site History", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
    def test_gps_geofence_integration(self):
        """Test GPS tracking integration with geofence checks"""
        print("\n🎯 Testing GPS Tracking Integration with Geofencing...")
        
        if not (self.test_data['sites'] and self.test_data['crew'] and self.test_data['dispatches']):
            print("⚠️ Missing test data for GPS integration")
            return
            
        site = self.test_data['sites'][0]
        crew = self.test_data['crew'][0]
        dispatch = self.test_data['dispatches'][0]
        
        # Test 10: Create GPS location within geofence radius (should trigger entry)
        print("🔟 Testing GPS location within geofence (should trigger entry)")
        
        # Get current geofence logs count
        response, success = self.make_request('GET', f'/geofence-logs?crew_id={crew["id"]}&site_id={site["id"]}')
        initial_logs_count = 0
        if success and response.status_code == 200:
            initial_logs_count = len(response.json().get('logs', []))
            
        # Create GPS location within site geofence (< 100m from site)
        gps_data = {
            "crew_id": crew['id'],
            "dispatch_id": dispatch['id'],
            "latitude": site['location']['latitude'] + 0.0005,  # ~55m north
            "longitude": site['location']['longitude'] + 0.0005,  # ~55m east
            "speed": 15.5,
            "accuracy": 5.0,
            "bearing": 90.0,
            "altitude": 100.0
        }
        
        response, success = self.make_request('POST', '/gps-location', gps_data)
        if success and response.status_code in [200, 201]:
            gps_location = response.json()
            
            # Wait a moment for geofence processing
            time.sleep(2)
            
            # Check if geofence entry was logged
            response, success = self.make_request('GET', f'/geofence-logs?crew_id={crew["id"]}&site_id={site["id"]}')
            if success and response.status_code == 200:
                new_logs = response.json().get('logs', [])
                if len(new_logs) > initial_logs_count:
                    # Check if latest log is an entry
                    latest_log = new_logs[0]  # Logs are sorted by timestamp desc
                    if latest_log.get('event_type') == 'entry' and not latest_log.get('manual_click'):
                        self.log_test("GPS Geofence Entry", True, "GPS location within geofence triggered automatic entry log", response.status_code)
                    else:
                        self.log_test("GPS Geofence Entry", False, "Entry log not created or incorrect type", response.status_code)
                else:
                    self.log_test("GPS Geofence Entry", False, "No new geofence log created", response.status_code)
            else:
                self.log_test("GPS Geofence Entry", False, "Failed to retrieve geofence logs", response.status_code if response else None)
        else:
            self.log_test("GPS Geofence Entry", False, f"Failed to create GPS location: {response.status_code if response else 'No response'}", response.status_code if response else None)
            
        # Test 11: Create GPS location outside geofence radius (should trigger exit)
        print("1️⃣1️⃣ Testing GPS location outside geofence (should trigger exit)")
        
        # Get current logs count
        response, success = self.make_request('GET', f'/geofence-logs?crew_id={crew["id"]}&site_id={site["id"]}')
        initial_logs_count = 0
        if success and response.status_code == 200:
            initial_logs_count = len(response.json().get('logs', []))
            
        # Create GPS location outside geofence (> 200m from site)
        gps_data = {
            "crew_id": crew['id'],
            "dispatch_id": dispatch['id'],
            "latitude": site['location']['latitude'] + 0.002,  # ~220m north
            "longitude": site['location']['longitude'] + 0.002,  # ~220m east
            "speed": 25.0,
            "accuracy": 8.0,
            "bearing": 45.0,
            "altitude": 95.0
        }
        
        response, success = self.make_request('POST', '/gps-location', gps_data)
        if success and response.status_code in [200, 201]:
            # Wait for geofence processing
            time.sleep(2)
            
            # Check if geofence exit was logged
            response, success = self.make_request('GET', f'/geofence-logs?crew_id={crew["id"]}&site_id={site["id"]}')
            if success and response.status_code == 200:
                new_logs = response.json().get('logs', [])
                if len(new_logs) > initial_logs_count:
                    # Check if latest log is an exit
                    latest_log = new_logs[0]
                    if latest_log.get('event_type') == 'exit' and not latest_log.get('manual_click'):
                        self.log_test("GPS Geofence Exit", True, "GPS location outside geofence triggered automatic exit log", response.status_code)
                    else:
                        self.log_test("GPS Geofence Exit", False, "Exit log not created or incorrect type", response.status_code)
                else:
                    self.log_test("GPS Geofence Exit", False, "No new geofence log created", response.status_code)
            else:
                self.log_test("GPS Geofence Exit", False, "Failed to retrieve geofence logs", response.status_code if response else None)
        else:
            self.log_test("GPS Geofence Exit", False, f"Failed to create GPS location: {response.status_code if response else 'No response'}", response.status_code if response else None)
            
    def test_route_optimization(self):
        """Test route optimization endpoint"""
        print("\n🎯 Testing Route Optimization System...")
        
        if not self.test_data['sites'] or len(self.test_data['sites']) < 2:
            print("⚠️ Need at least 2 sites for optimization")
            return
            
        # Test 12: Optimize route with 2 sites (minimum)
        print("1️⃣2️⃣ Testing POST /api/routes/optimize - 2 sites minimum")
        site_ids = [self.test_data['sites'][0]['id'], self.test_data['sites'][1]['id']]
        
        response, success = self.make_request('POST', '/routes/optimize', site_ids)
        if success and response.status_code == 200:
            optimization = response.json()
            
            # Verify response structure
            required_fields = ['optimized_order', 'estimated_distance_km', 'estimated_time_minutes', 'savings_percentage', 'route_details']
            missing_fields = [field for field in required_fields if field not in optimization]
            
            if not missing_fields:
                if (len(optimization['optimized_order']) == 2 and
                    optimization['estimated_distance_km'] >= 0 and
                    optimization['estimated_time_minutes'] >= 0):
                    self.log_test("Route Optimization 2 Sites", True, 
                                f"Optimized 2 sites: {optimization['estimated_distance_km']}km, {optimization['estimated_time_minutes']}min, {optimization['savings_percentage']}% savings", 
                                response.status_code)
                else:
                    self.log_test("Route Optimization 2 Sites", False, "Invalid optimization values", response.status_code)
            else:
                self.log_test("Route Optimization 2 Sites", False, f"Missing fields: {missing_fields}", response.status_code)
        else:
            self.log_test("Route Optimization 2 Sites", False, f"HTTP {response.status_code if response else 'No response'}: {response.text if response else ''}", response.status_code if response else None)
            
        # Test 13: Optimize route with 5+ sites
        if len(self.test_data['sites']) >= 5:
            print("1️⃣3️⃣ Testing POST /api/routes/optimize - 5+ sites")
            site_ids = [site['id'] for site in self.test_data['sites']]
            
            response, success = self.make_request('POST', '/routes/optimize', site_ids)
            if success and response.status_code == 200:
                optimization = response.json()
                
                if (len(optimization['optimized_order']) == len(site_ids) and
                    optimization['estimated_distance_km'] > 0 and
                    len(optimization['route_details']) == len(site_ids)):
                    self.log_test("Route Optimization 5+ Sites", True, 
                                f"Optimized {len(site_ids)} sites: {optimization['estimated_distance_km']}km, {optimization['savings_percentage']}% savings", 
                                response.status_code)
                else:
                    self.log_test("Route Optimization 5+ Sites", False, "Invalid optimization for multiple sites", response.status_code)
            else:
                self.log_test("Route Optimization 5+ Sites", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
        else:
            print(f"⏭️ Skipping 5+ sites test (only {len(self.test_data['sites'])} sites available)")
            
        # Test 14: Test route details structure
        print("1️⃣4️⃣ Testing route details array structure")
        if len(self.test_data['sites']) >= 3:
            site_ids = [site['id'] for site in self.test_data['sites'][:3]]
            
            response, success = self.make_request('POST', '/routes/optimize', site_ids)
            if success and response.status_code == 200:
                optimization = response.json()
                route_details = optimization.get('route_details', [])
                
                if len(route_details) > 0:
                    # Check structure of first route detail
                    detail = route_details[0]
                    required_detail_fields = ['position', 'site_id', 'site_name', 'priority']
                    missing_detail_fields = [field for field in required_detail_fields if field not in detail]
                    
                    if not missing_detail_fields:
                        self.log_test("Route Details Structure", True, f"Route details properly structured with {len(route_details)} stops", response.status_code)
                    else:
                        self.log_test("Route Details Structure", False, f"Missing detail fields: {missing_detail_fields}", response.status_code)
                else:
                    self.log_test("Route Details Structure", False, "No route details returned", response.status_code)
            else:
                self.log_test("Route Details Structure", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
        else:
            print(f"⏭️ Skipping route details test (need 3+ sites)")
            
        # Test 15: Test with invalid site IDs
        print("1️⃣5️⃣ Testing route optimization with invalid site IDs")
        invalid_site_ids = ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]  # Valid ObjectId format but non-existent
        
        response, success = self.make_request('POST', '/routes/optimize', invalid_site_ids)
        if success and response.status_code == 200:
            optimization = response.json()
            
            # Should handle gracefully - either return message about no valid sites or empty optimization
            if ('message' in optimization and 'coordinates' in optimization['message'].lower()) or optimization['estimated_distance_km'] == 0:
                self.log_test("Route Optimization Invalid Sites", True, "Handled invalid site IDs gracefully", response.status_code)
            else:
                self.log_test("Route Optimization Invalid Sites", False, "Did not handle invalid sites properly", response.status_code)
        else:
            self.log_test("Route Optimization Invalid Sites", False, f"HTTP {response.status_code if response else 'No response'}", response.status_code if response else None)
            
    def run_all_tests(self):
        """Run all geofence and route optimization tests"""
        print("🚀 Starting Geofence System & Route Optimization Backend Testing")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Setup test data
        setup_success = self.setup_test_data()
        if not setup_success:
            print("❌ Failed to setup test data. Aborting tests.")
            return
            
        # Run all test suites
        self.test_geofence_configuration_endpoints()
        self.test_geofence_logging_endpoints()
        self.test_gps_geofence_integration()
        self.test_route_optimization()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        self.print_summary(duration)
        
    def print_summary(self, duration):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("📊 GEOFENCE & ROUTE OPTIMIZATION TEST RESULTS SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.results if r['status'] == '✅ PASS'])
        failed = len([r for r in self.results if r['status'] == '❌ FAIL'])
        total = len(self.results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/total*100):.1f}% ({passed}/{total})")
        print(f"⏱️ DURATION: {duration:.2f} seconds")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if result['status'] == '❌ FAIL':
                    print(f"   • {result['test']}: {result['details']}")
                    
        if passed > 0:
            print(f"\n✅ PASSED TESTS:")
            for result in self.results:
                if result['status'] == '✅ PASS':
                    print(f"   • {result['test']}: {result['details']}")
                    
        print("\n" + "=" * 80)

if __name__ == "__main__":
    test_suite = GeofenceRouteTestSuite()
    test_suite.run_all_tests()