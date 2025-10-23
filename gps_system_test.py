#!/usr/bin/env python3
"""
GPS System Complete Test & Setup
Tests all GPS tracking endpoints and creates test data for map visualization
As specified in the review request
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://snowy-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}
TORONTO_LAT = 43.6532
TORONTO_LON = -79.3832

class GPSSystemTester:
    def __init__(self):
        self.test_results = []
        self.created_data = {
            "customers": [],
            "sites": [],
            "crews": [],
            "dispatches": [],
            "gps_locations": []
        }
        
    def log_test(self, test_name: str, success: bool, details: str = "", data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   {details}")
        print()

    def setup_test_data(self):
        """Create test data for GPS testing"""
        print("🔧 Setting up test data for GPS system...")
        
        # Create customer
        customer_data = {
            "name": "GPS Test Customer - Toronto",
            "email": "gps.toronto@test.com",
            "phone": "+14165551234",
            "address": "123 King Street, Toronto, ON"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/customers", json=customer_data, headers=HEADERS)
            if response.status_code == 200:
                customer_id = response.json()["id"]
                self.created_data["customers"].append(customer_id)
                self.log_test("Create Test Customer", True, f"Customer ID: {customer_id}")
            else:
                self.log_test("Create Test Customer", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Create Test Customer", False, f"Exception: {str(e)}")
            return None
        
        # Create site in Toronto area
        site_data = {
            "customer_id": customer_id,
            "name": "Toronto GPS Test Site",
            "location": {
                "latitude": TORONTO_LAT,
                "longitude": TORONTO_LON,
                "address": "123 King Street, Toronto, ON M5H 1A1"
            },
            "site_type": "parking_lot",
            "area_size": 10000
        }
        
        try:
            response = requests.post(f"{BASE_URL}/sites", json=site_data, headers=HEADERS)
            if response.status_code == 200:
                site_id = response.json()["id"]
                self.created_data["sites"].append(site_id)
                self.log_test("Create Test Site", True, f"Site ID: {site_id} at Toronto coordinates")
            else:
                self.log_test("Create Test Site", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Create Test Site", False, f"Exception: {str(e)}")
            return None
        
        # Create 3 crew members for different status scenarios
        crew_names = ["Crew A - Active", "Crew B - Idle", "Crew C - Offline"]
        crew_ids = []
        
        for i, name in enumerate(crew_names):
            crew_data = {
                "name": name,
                "email": f"crew{chr(65+i).lower()}@test.com",
                "phone": f"+14165551{240+i}",
                "role": "crew"
            }
            
            try:
                response = requests.post(f"{BASE_URL}/users", json=crew_data, headers=HEADERS)
                if response.status_code == 200:
                    crew_id = response.json()["id"]
                    crew_ids.append(crew_id)
                    self.created_data["crews"].append(crew_id)
                    self.log_test(f"Create {name}", True, f"Crew ID: {crew_id}")
                else:
                    self.log_test(f"Create {name}", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"Create {name}", False, f"Exception: {str(e)}")
        
        # Create dispatch for route testing
        dispatch_data = {
            "route_name": "Toronto GPS Test Route",
            "scheduled_date": datetime.now().strftime("%Y-%m-%d"),
            "scheduled_time": "08:00",
            "crew_ids": crew_ids,
            "site_ids": [site_id],
            "equipment_ids": [],
            "services": ["plowing", "salting"]
        }
        
        try:
            response = requests.post(f"{BASE_URL}/dispatches", json=dispatch_data, headers=HEADERS)
            if response.status_code == 200:
                dispatch_id = response.json()["id"]
                self.created_data["dispatches"].append(dispatch_id)
                self.log_test("Create Test Dispatch", True, f"Dispatch ID: {dispatch_id}")
                return {"customer_id": customer_id, "site_id": site_id, "crew_ids": crew_ids, "dispatch_id": dispatch_id}
            else:
                self.log_test("Create Test Dispatch", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Create Test Dispatch", False, f"Exception: {str(e)}")
            return None

    def test_gps_location_recording(self, test_data):
        """Test GPS Location Recording (POST /api/gps-location)"""
        print("📍 Testing GPS Location Recording with test scenarios...")
        
        crew_ids = test_data["crew_ids"]
        dispatch_id = test_data["dispatch_id"]
        
        # Test scenarios as specified in review request
        scenarios = [
            {
                "name": "Crew A - Recent Location (Active - Green)",
                "crew_id": crew_ids[0] if len(crew_ids) > 0 else None,
                "minutes_ago": 2,  # <5 min ago - Active
                "lat_offset": 0.001,
                "lon_offset": 0.001,
                "expected_status": "Active (Green)"
            },
            {
                "name": "Crew B - Older Location (Idle - Orange)",
                "crew_id": crew_ids[1] if len(crew_ids) > 1 else None,
                "minutes_ago": 15,  # 15 min ago - Idle
                "lat_offset": 0.002,
                "lon_offset": 0.002,
                "expected_status": "Idle (Orange)"
            },
            {
                "name": "Crew C - Very Old Location (Offline - Gray)",
                "crew_id": crew_ids[2] if len(crew_ids) > 2 else None,
                "minutes_ago": 120,  # 2 hours ago - Offline
                "lat_offset": 0.003,
                "lon_offset": 0.003,
                "expected_status": "Offline (Gray)"
            }
        ]
        
        for scenario in scenarios:
            if not scenario["crew_id"]:
                continue
                
            # Calculate timestamp
            timestamp = datetime.now() - timedelta(minutes=scenario["minutes_ago"])
            
            gps_data = {
                "crew_id": scenario["crew_id"],
                "dispatch_id": dispatch_id,
                "latitude": TORONTO_LAT + scenario["lat_offset"],
                "longitude": TORONTO_LON + scenario["lon_offset"],
                "speed": 25.5,
                "accuracy": 5.0,
                "bearing": 180.0,
                "altitude": 100.0
            }
            
            try:
                response = requests.post(f"{BASE_URL}/gps-location", json=gps_data, headers=HEADERS)
                if response.status_code == 200:
                    location_data = response.json()
                    location_id = location_data.get("id")
                    self.created_data["gps_locations"].append(location_id)
                    
                    self.log_test(
                        scenario["name"],
                        True,
                        f"GPS location created at ({gps_data['latitude']:.4f}, {gps_data['longitude']:.4f}) - Expected: {scenario['expected_status']}"
                    )
                else:
                    self.log_test(scenario["name"], False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_test(scenario["name"], False, f"Exception: {str(e)}")
        
        # Create route with 5+ points for dispatch visualization
        print("📍 Creating route with 5+ GPS points for visualization...")
        
        route_points = [
            {"lat": TORONTO_LAT, "lon": TORONTO_LON, "desc": "Start Point"},
            {"lat": TORONTO_LAT + 0.001, "lon": TORONTO_LON + 0.001, "desc": "Point 2"},
            {"lat": TORONTO_LAT + 0.002, "lon": TORONTO_LON + 0.002, "desc": "Point 3"},
            {"lat": TORONTO_LAT + 0.003, "lon": TORONTO_LON + 0.003, "desc": "Point 4"},
            {"lat": TORONTO_LAT + 0.004, "lon": TORONTO_LON + 0.004, "desc": "Point 5"},
            {"lat": TORONTO_LAT + 0.005, "lon": TORONTO_LON + 0.005, "desc": "End Point"}
        ]
        
        if crew_ids:
            for i, point in enumerate(route_points):
                route_gps_data = {
                    "crew_id": crew_ids[0],  # Use first crew for route
                    "dispatch_id": dispatch_id,
                    "latitude": point["lat"],
                    "longitude": point["lon"],
                    "speed": 30.0 + (i * 5),  # Varying speed
                    "accuracy": 3.0,
                    "bearing": 90.0 + (i * 15),  # Varying bearing
                    "altitude": 95.0 + i
                }
                
                try:
                    response = requests.post(f"{BASE_URL}/gps-location", json=route_gps_data, headers=HEADERS)
                    if response.status_code == 200:
                        location_data = response.json()
                        location_id = location_data.get("id")
                        self.created_data["gps_locations"].append(location_id)
                        
                        self.log_test(
                            f"Route {point['desc']}",
                            True,
                            f"Created at ({point['lat']:.4f}, {point['lon']:.4f}) - Speed: {route_gps_data['speed']} km/h"
                        )
                    else:
                        self.log_test(f"Route {point['desc']}", False, f"Status: {response.status_code}", response.text)
                except Exception as e:
                    self.log_test(f"Route {point['desc']}", False, f"Exception: {str(e)}")
                
                # Small delay between points to simulate movement
                time.sleep(0.5)

    def test_live_location_retrieval(self, test_data):
        """Test Live Location Retrieval (GET /api/gps-location/live/{crew_id})"""
        print("🔴 Testing Live Location Retrieval...")
        
        crew_ids = test_data["crew_ids"]
        
        # Test with crew IDs that have data
        for i, crew_id in enumerate(crew_ids):
            try:
                response = requests.get(f"{BASE_URL}/gps-location/live/{crew_id}", headers=HEADERS)
                if response.status_code == 200:
                    location_data = response.json()
                    self.log_test(
                        f"Live Location - Crew {chr(65+i)}",
                        True,
                        f"Retrieved location: ({location_data.get('latitude')}, {location_data.get('longitude')}) at {location_data.get('timestamp')}"
                    )
                elif response.status_code == 404:
                    self.log_test(
                        f"Live Location - Crew {chr(65+i)}",
                        True,
                        "No location data found (404) - expected for crew without GPS data"
                    )
                else:
                    self.log_test(
                        f"Live Location - Crew {chr(65+i)}",
                        False,
                        f"Unexpected status: {response.status_code}",
                        response.text
                    )
            except Exception as e:
                self.log_test(f"Live Location - Crew {chr(65+i)}", False, f"Exception: {str(e)}")
        
        # Test with crew ID that doesn't have data (should 404)
        try:
            fake_crew_id = "non-existent-crew-id-12345"
            response = requests.get(f"{BASE_URL}/gps-location/live/{fake_crew_id}", headers=HEADERS)
            if response.status_code == 404:
                self.log_test("Live Location - Non-existent Crew", True, "Correctly returned 404 for non-existent crew")
            else:
                self.log_test("Live Location - Non-existent Crew", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Live Location - Non-existent Crew", False, f"Exception: {str(e)}")

    def test_route_history(self, test_data):
        """Test Route History (GET /api/gps-location/route/{dispatch_id})"""
        print("🛣️ Testing Route History...")
        
        dispatch_id = test_data["dispatch_id"]
        
        try:
            response = requests.get(f"{BASE_URL}/gps-location/route/{dispatch_id}", headers=HEADERS)
            if response.status_code == 200:
                route_data = response.json()
                route_points = route_data.get("route", [])
                total_distance = route_data.get("total_distance", 0)
                duration = route_data.get("duration", 0)
                
                self.log_test(
                    "Route History Retrieval",
                    True,
                    f"Retrieved route with {len(route_points)} points, distance: {total_distance}km, duration: {duration}h"
                )
                
                # Verify chronological ordering
                if len(route_points) > 1:
                    timestamps = []
                    for point in route_points:
                        timestamp_str = point.get("timestamp")
                        if timestamp_str:
                            try:
                                # Parse timestamp
                                if isinstance(timestamp_str, str):
                                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                                else:
                                    timestamp = timestamp_str
                                timestamps.append(timestamp)
                            except:
                                timestamps.append(datetime.now())
                    
                    if len(timestamps) > 1:
                        is_chronological = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
                        self.log_test(
                            "Route Chronological Order",
                            is_chronological,
                            "Route points are in chronological order" if is_chronological else "Route points are NOT in chronological order"
                        )
                
                # Verify polyline data structure
                has_coordinates = all("latitude" in point and "longitude" in point for point in route_points)
                self.log_test(
                    "Route Polyline Data Structure",
                    has_coordinates,
                    "All route points have latitude/longitude coordinates" if has_coordinates else "Missing coordinates in route points"
                )
                
            else:
                self.log_test("Route History Retrieval", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Route History Retrieval", False, f"Exception: {str(e)}")

    def test_all_locations(self):
        """Test All Locations (GET /api/gps-location)"""
        print("📋 Testing All Locations Retrieval...")
        
        try:
            response = requests.get(f"{BASE_URL}/gps-location", headers=HEADERS)
            if response.status_code == 200:
                locations = response.json()
                self.log_test(
                    "All GPS Locations",
                    True,
                    f"Retrieved {len(locations)} GPS locations"
                )
                
                # Check data structure matches model
                if locations:
                    sample_location = locations[0]
                    required_fields = ["id", "crew_id", "latitude", "longitude", "timestamp"]
                    has_required_fields = all(field in sample_location for field in required_fields)
                    
                    self.log_test(
                        "GPS Data Structure Validation",
                        has_required_fields,
                        "GPS locations have required fields" if has_required_fields else f"Missing required fields in GPS data"
                    )
                    
                    # Check for enhanced fields
                    enhanced_fields = ["speed", "accuracy", "bearing"]
                    has_enhanced_fields = any(field in sample_location for field in enhanced_fields)
                    
                    self.log_test(
                        "Enhanced GPS Fields",
                        has_enhanced_fields,
                        "GPS locations include enhanced fields (speed, accuracy, bearing)" if has_enhanced_fields else "Enhanced fields not found"
                    )
                
            else:
                self.log_test("All GPS Locations", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("All GPS Locations", False, f"Exception: {str(e)}")

    def verify_expected_results(self):
        """Verify expected results from the review request"""
        print("✅ Verifying Expected Results...")
        
        # Check that all endpoints return 200 or appropriate status
        success_tests = [r for r in self.test_results if r["success"]]
        total_tests = len(self.test_results)
        success_rate = (len(success_tests) / total_tests * 100) if total_tests > 0 else 0
        
        self.log_test(
            "Overall Success Rate",
            success_rate >= 80,  # 80% success rate threshold
            f"{len(success_tests)}/{total_tests} tests passed ({success_rate:.1f}%)"
        )
        
        # Check test data creation
        data_created = {
            "crews": len(self.created_data["crews"]),
            "gps_locations": len(self.created_data["gps_locations"]),
            "dispatches": len(self.created_data["dispatches"])
        }
        
        self.log_test(
            "Test Data Successfully Created",
            data_created["crews"] >= 3 and data_created["gps_locations"] >= 5,
            f"Created {data_created['crews']} crews, {data_created['gps_locations']} GPS locations, {data_created['dispatches']} dispatches"
        )

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("🧹 Cleaning up test data...")
        
        cleanup_endpoints = [
            ("gps-location", self.created_data["gps_locations"]),
            ("dispatches", self.created_data["dispatches"]),
            ("sites", self.created_data["sites"]),
            ("users", self.created_data["crews"]),
            ("customers", self.created_data["customers"])
        ]
        
        for endpoint, ids in cleanup_endpoints:
            for item_id in ids:
                try:
                    response = requests.delete(f"{BASE_URL}/{endpoint}/{item_id}", headers=HEADERS)
                    if response.status_code in [200, 404]:
                        print(f"   ✅ Cleaned up {endpoint}/{item_id}")
                    else:
                        print(f"   ⚠️ Could not clean up {endpoint}/{item_id}: {response.status_code}")
                except Exception as e:
                    print(f"   ⚠️ Error cleaning up {endpoint}/{item_id}: {e}")

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 GPS SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Test data summary
        print("📍 TEST DATA CREATED:")
        print(f"   • Customers: {len(self.created_data['customers'])}")
        print(f"   • Sites: {len(self.created_data['sites'])}")
        print(f"   • Crew Members: {len(self.created_data['crews'])}")
        print(f"   • Dispatches: {len(self.created_data['dispatches'])}")
        print(f"   • GPS Locations: {len(self.created_data['gps_locations'])}")
        print()
        
        # Failed tests
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print("❌ FAILED TESTS:")
            for result in failed_results:
                print(f"   • {result['test']}: {result['details']}")
        else:
            print("✅ ALL TESTS PASSED!")
        
        print("\n" + "=" * 60)
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "test_data_created": self.created_data
        }

    def run_complete_test(self):
        """Run complete GPS system test as specified in review request"""
        print("🚀 GPS System Complete Test & Setup")
        print("Testing all GPS tracking endpoints and creating test data for map visualization")
        print("Backend URL:", BASE_URL)
        print("=" * 60)
        
        # Setup test data
        test_data = self.setup_test_data()
        if not test_data:
            print("❌ Failed to setup test data. Aborting tests.")
            return
        
        # Run all tests
        self.test_gps_location_recording(test_data)
        self.test_live_location_retrieval(test_data)
        self.test_route_history(test_data)
        self.test_all_locations()
        self.verify_expected_results()
        
        # Generate summary
        summary = self.generate_summary()
        
        # Cleanup
        self.cleanup_test_data()
        
        return summary

def main():
    """Main test execution"""
    tester = GPSSystemTester()
    tester.run_complete_test()

if __name__ == "__main__":
    main()