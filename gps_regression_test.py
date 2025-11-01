#!/usr/bin/env python3
"""
GPS Location APIs Regression Testing
Focus: Ensure no regressions after WeatherWidget removal and MapLibre integration
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid

# Configuration
BASE_URL = "https://mapbuilder-3.preview.emergentagent.com/api"
TIMEOUT = 30

class GPSRegressionTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_results = []
        self.test_data = {}
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, params=params)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, params=params)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError:
            return {
                "status_code": response.status_code,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }

    def setup_test_data(self):
        """Create minimal test data for GPS testing"""
        print("🔧 Setting up test data...")
        
        # Create test customer
        customer_data = {
            "name": "GPS Regression Test Customer",
            "email": "gpsregression@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street, Toronto, ON"
        }
        
        response = self.make_request("POST", "/customers", customer_data)
        if response["success"]:
            self.test_data["customer_id"] = response["data"]["id"]
            self.log_test("Create Test Customer", True, f"Customer ID: {self.test_data['customer_id']}")
        else:
            self.log_test("Create Test Customer", False, f"Failed to create customer", response["data"])
            return False

        # Create test site
        site_data = {
            "name": "GPS Regression Test Site",
            "customer_id": self.test_data["customer_id"],
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "456 Test Avenue, Toronto, ON"
            },
            "site_type": "commercial",
            "area_size": 1000
        }
        
        response = self.make_request("POST", "/sites", site_data)
        if response["success"]:
            self.test_data["site_id"] = response["data"]["id"]
            self.log_test("Create Test Site", True, f"Site ID: {self.test_data['site_id']}")
        else:
            self.log_test("Create Test Site", False, f"Failed to create site", response["data"])
            return False

        # Create test crew member
        crew_data = {
            "name": "GPS Regression Test Crew",
            "email": "gpsregressioncrew@example.com",
            "phone": "+1234567891",
            "role": "crew"
        }
        
        response = self.make_request("POST", "/users", crew_data)
        if response["success"]:
            self.test_data["crew_id"] = response["data"]["id"]
            self.log_test("Create Test Crew", True, f"Crew ID: {self.test_data['crew_id']}")
        else:
            self.log_test("Create Test Crew", False, f"Failed to create crew", response["data"])
            return False

        # Create test equipment first
        equipment_data = {
            "name": "GPS Test Plow Truck",
            "equipment_type": "plow_truck",
            "vehicle_number": "GPS-001",
            "notes": "Test equipment for GPS regression testing"
        }
        
        response = self.make_request("POST", "/equipment", equipment_data)
        if response["success"]:
            self.test_data["equipment_id"] = response["data"]["id"]
            self.log_test("Create Test Equipment", True, f"Equipment ID: {self.test_data['equipment_id']}")
        else:
            self.log_test("Create Test Equipment", False, f"Failed to create equipment", response["data"])
            return False

        # Create test dispatch
        dispatch_data = {
            "route_name": "GPS Regression Test Route",
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "scheduled_time": "09:00",
            "crew_ids": [self.test_data["crew_id"]],
            "equipment_ids": [self.test_data["equipment_id"]],
            "site_ids": [self.test_data["site_id"]],
            "services": ["plowing", "salting"]
        }
        
        response = self.make_request("POST", "/dispatches", dispatch_data)
        if response["success"]:
            self.test_data["dispatch_id"] = response["data"]["id"]
            self.log_test("Create Test Dispatch", True, f"Dispatch ID: {self.test_data['dispatch_id']}")
        else:
            self.log_test("Create Test Dispatch", False, f"Failed to create dispatch", response["data"])
            return False

        return True

    def test_gps_location_create(self):
        """Test POST /api/gps-location (create GPS location)"""
        print("📍 Testing GPS Location Creation...")
        
        if not self.test_data.get("crew_id") or not self.test_data.get("dispatch_id"):
            self.log_test("GPS Location Create Prerequisites", False, "Missing crew_id or dispatch_id")
            return

        # Create multiple GPS locations to simulate movement
        toronto_coords = [
            {"lat": 43.6532, "lng": -79.3832, "desc": "Starting point"},
            {"lat": 43.6542, "lng": -79.3842, "desc": "Moving north"},
            {"lat": 43.6552, "lng": -79.3852, "desc": "Continuing route"},
            {"lat": 43.6562, "lng": -79.3862, "desc": "Final position"}
        ]
        
        created_locations = []
        
        for i, coord in enumerate(toronto_coords):
            gps_data = {
                "crew_id": self.test_data["crew_id"],
                "dispatch_id": self.test_data["dispatch_id"],
                "latitude": coord["lat"],
                "longitude": coord["lng"],
                "speed": 25.5 + i * 2,  # Varying speed
                "accuracy": 5.0,
                "bearing": 180.0 + i * 10,  # Varying bearing
                "altitude": 100.0 + i * 5   # Varying altitude
            }
            
            response = self.make_request("POST", "/gps-location", gps_data)
            if response["success"]:
                location_id = response["data"]["id"]
                created_locations.append(location_id)
                
                # Verify all fields are stored correctly
                location = response["data"]
                fields_correct = (
                    location.get("crew_id") == self.test_data["crew_id"] and
                    location.get("dispatch_id") == self.test_data["dispatch_id"] and
                    location.get("latitude") == coord["lat"] and
                    location.get("longitude") == coord["lng"] and
                    location.get("speed") == gps_data["speed"] and
                    location.get("accuracy") == gps_data["accuracy"] and
                    location.get("bearing") == gps_data["bearing"] and
                    location.get("altitude") == gps_data["altitude"]
                )
                
                self.log_test(
                    f"Create GPS Location {i+1} - {coord['desc']}",
                    fields_correct,
                    f"Location ID: {location_id}, All fields stored correctly: {fields_correct}"
                )
            else:
                self.log_test(
                    f"Create GPS Location {i+1} - {coord['desc']}",
                    False,
                    f"Failed to create GPS location",
                    response["data"]
                )
        
        self.test_data["gps_locations"] = created_locations
        
        # Small delay to ensure timestamps are different
        time.sleep(1)

    def test_gps_location_live(self):
        """Test GET /api/gps-location/live/{crew_id} (get latest location)"""
        print("📡 Testing Live GPS Location Retrieval...")
        
        if not self.test_data.get("crew_id"):
            self.log_test("Live GPS Location Prerequisites", False, "Missing crew_id")
            return

        # Test with valid crew ID
        response = self.make_request("GET", f"/gps-location/live/{self.test_data['crew_id']}")
        if response["success"]:
            latest_location = response["data"]
            
            # Should return the most recent location (last one created)
            expected_lat = 43.6562  # Last coordinate from creation test
            actual_lat = latest_location.get("latitude")
            
            # Verify it's the most recent location
            is_latest = abs(actual_lat - expected_lat) < 0.001 if actual_lat else False
            
            # Verify all required fields are present
            required_fields = ["id", "crew_id", "latitude", "longitude", "timestamp"]
            has_required_fields = all(field in latest_location for field in required_fields)
            
            # Verify enhanced fields are present
            enhanced_fields = ["speed", "accuracy", "bearing", "altitude"]
            has_enhanced_fields = all(field in latest_location for field in enhanced_fields)
            
            success = is_latest and has_required_fields and has_enhanced_fields
            
            self.log_test(
                "Get Live Crew Location - Valid Crew",
                success,
                f"Latest location: ({actual_lat}, {latest_location.get('longitude')}), "
                f"Required fields: {has_required_fields}, Enhanced fields: {has_enhanced_fields}"
            )
        else:
            self.log_test(
                "Get Live Crew Location - Valid Crew",
                False,
                f"Failed to get live location",
                response["data"]
            )

        # Test with non-existent crew ID
        fake_crew_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but doesn't exist
        response = self.make_request("GET", f"/gps-location/live/{fake_crew_id}")
        if response["status_code"] == 404:
            self.log_test(
                "Get Live Crew Location - Non-existent Crew",
                True,
                "Correctly returns 404 for non-existent crew"
            )
        else:
            self.log_test(
                "Get Live Crew Location - Non-existent Crew",
                False,
                f"Expected 404, got {response['status_code']}"
            )

    def test_gps_location_route(self):
        """Test GET /api/gps-location/route/{dispatch_id} (get route data)"""
        print("🗺️ Testing Route GPS Data Retrieval...")
        
        if not self.test_data.get("dispatch_id"):
            self.log_test("Route GPS Data Prerequisites", False, "Missing dispatch_id")
            return

        # Test with valid dispatch ID
        response = self.make_request("GET", f"/gps-location/route/{self.test_data['dispatch_id']}")
        if response["success"]:
            route_data = response["data"]
            
            # Verify route structure
            required_fields = ["route", "total_distance", "duration", "start_time", "end_time"]
            has_required_fields = all(field in route_data for field in required_fields)
            
            route_points = route_data.get("route", [])
            total_distance = route_data.get("total_distance", 0)
            duration = route_data.get("duration", 0)
            
            # Should have our 4 GPS points
            has_correct_points = len(route_points) >= 4
            
            # Distance should be calculated (should be > 0 for our Toronto coordinates)
            has_distance = total_distance > 0
            
            # Duration should be calculated
            has_duration = duration >= 0
            
            # Verify route points are in chronological order
            timestamps = [point.get("timestamp") for point in route_points if point.get("timestamp")]
            is_chronological = len(timestamps) >= 2 and all(
                timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1)
            )
            
            success = has_required_fields and has_correct_points and has_distance and is_chronological
            
            self.log_test(
                "Get Dispatch Route - Valid Dispatch",
                success,
                f"Route points: {len(route_points)}, Distance: {total_distance}km, "
                f"Duration: {duration}h, Chronological: {is_chronological}"
            )
            
            # Verify individual route point structure
            if route_points:
                first_point = route_points[0]
                point_fields = ["id", "crew_id", "latitude", "longitude", "timestamp", "speed", "accuracy", "bearing"]
                has_point_fields = all(field in first_point for field in point_fields)
                
                self.log_test(
                    "Route Point Structure Validation",
                    has_point_fields,
                    f"Route point has all required fields: {has_point_fields}"
                )
        else:
            self.log_test(
                "Get Dispatch Route - Valid Dispatch",
                False,
                f"Failed to get route data",
                response["data"]
            )

        # Test with non-existent dispatch ID
        fake_dispatch_id = "507f1f77bcf86cd799439012"  # Valid ObjectId format but doesn't exist
        response = self.make_request("GET", f"/gps-location/route/{fake_dispatch_id}")
        if response["success"]:
            route_data = response["data"]
            # Should return empty route for non-existent dispatch
            empty_route = len(route_data.get("route", [])) == 0 and route_data.get("total_distance", 0) == 0
            self.log_test(
                "Get Dispatch Route - Non-existent Dispatch",
                empty_route,
                "Correctly returns empty route for non-existent dispatch"
            )
        else:
            self.log_test(
                "Get Dispatch Route - Non-existent Dispatch",
                False,
                f"Failed to handle non-existent dispatch",
                response["data"]
            )

    def test_gps_location_get_all(self):
        """Test GET /api/gps-location (get all locations)"""
        print("📋 Testing Get All GPS Locations...")
        
        # Test get all locations
        response = self.make_request("GET", "/gps-location")
        if response["success"]:
            all_locations = response["data"]
            
            # Should be a list
            is_list = isinstance(all_locations, list)
            
            # Should have at least our test locations
            has_test_locations = len(all_locations) >= 4
            
            # Verify structure of locations
            if all_locations:
                first_location = all_locations[0]
                required_fields = ["id", "crew_id", "latitude", "longitude", "timestamp"]
                has_required_fields = all(field in first_location for field in required_fields)
                
                # Check for enhanced fields
                enhanced_fields = ["speed", "accuracy", "bearing"]
                has_enhanced_fields = all(field in first_location for field in enhanced_fields)
            else:
                has_required_fields = False
                has_enhanced_fields = False
            
            success = is_list and has_test_locations and has_required_fields and has_enhanced_fields
            
            self.log_test(
                "Get All GPS Locations",
                success,
                f"Total locations: {len(all_locations)}, Is list: {is_list}, "
                f"Required fields: {has_required_fields}, Enhanced fields: {has_enhanced_fields}"
            )
        else:
            self.log_test(
                "Get All GPS Locations",
                False,
                f"Failed to get all locations",
                response["data"]
            )

        # Test filtering by crew_id
        if self.test_data.get("crew_id"):
            response = self.make_request("GET", "/gps-location", params={"crew_id": self.test_data["crew_id"]})
            if response["success"]:
                crew_locations = response["data"]
                
                # Should have our 4 test locations for this crew
                has_crew_locations = len(crew_locations) >= 4
                
                # All locations should belong to our crew
                all_crew_match = all(
                    loc.get("crew_id") == self.test_data["crew_id"] 
                    for loc in crew_locations
                )
                
                success = has_crew_locations and all_crew_match
                
                self.log_test(
                    "Filter GPS Locations by Crew ID",
                    success,
                    f"Crew locations: {len(crew_locations)}, All match crew: {all_crew_match}"
                )
            else:
                self.log_test(
                    "Filter GPS Locations by Crew ID",
                    False,
                    f"Failed to filter by crew_id",
                    response["data"]
                )

        # Test filtering by dispatch_id
        if self.test_data.get("dispatch_id"):
            response = self.make_request("GET", "/gps-location", params={"dispatch_id": self.test_data["dispatch_id"]})
            if response["success"]:
                dispatch_locations = response["data"]
                
                # Should have our 4 test locations for this dispatch
                has_dispatch_locations = len(dispatch_locations) >= 4
                
                # All locations should belong to our dispatch
                all_dispatch_match = all(
                    loc.get("dispatch_id") == self.test_data["dispatch_id"] 
                    for loc in dispatch_locations
                )
                
                success = has_dispatch_locations and all_dispatch_match
                
                self.log_test(
                    "Filter GPS Locations by Dispatch ID",
                    success,
                    f"Dispatch locations: {len(dispatch_locations)}, All match dispatch: {all_dispatch_match}"
                )
            else:
                self.log_test(
                    "Filter GPS Locations by Dispatch ID",
                    False,
                    f"Failed to filter by dispatch_id",
                    response["data"]
                )

    def test_core_apis_health(self):
        """Basic health check on core APIs"""
        print("🏥 Testing Core APIs Health Check...")
        
        # Test Customer Management API
        response = self.make_request("GET", "/customers")
        self.log_test(
            "Customer Management API Health",
            response["success"],
            f"Status: {response['status_code']}, Count: {len(response['data']) if response['success'] else 'N/A'}"
        )

        # Test Site Management API
        response = self.make_request("GET", "/sites")
        self.log_test(
            "Site Management API Health",
            response["success"],
            f"Status: {response['status_code']}, Count: {len(response['data']) if response['success'] else 'N/A'}"
        )

        # Test Dispatch API
        response = self.make_request("GET", "/dispatches")
        self.log_test(
            "Dispatch Management API Health",
            response["success"],
            f"Status: {response['status_code']}, Count: {len(response['data']) if response['success'] else 'N/A'}"
        )

    def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        # Delete test dispatch
        if self.test_data.get("dispatch_id"):
            response = self.make_request("DELETE", f"/dispatches/{self.test_data['dispatch_id']}")
            self.log_test("Cleanup Test Dispatch", response["success"])

        # Delete test equipment
        if self.test_data.get("equipment_id"):
            response = self.make_request("DELETE", f"/equipment/{self.test_data['equipment_id']}")
            self.log_test("Cleanup Test Equipment", response["success"])

        # Delete test crew
        if self.test_data.get("crew_id"):
            response = self.make_request("DELETE", f"/users/{self.test_data['crew_id']}")
            self.log_test("Cleanup Test Crew", response["success"])

        # Delete test site
        if self.test_data.get("site_id"):
            response = self.make_request("DELETE", f"/sites/{self.test_data['site_id']}")
            self.log_test("Cleanup Test Site", response["success"])

        # Delete test customer
        if self.test_data.get("customer_id"):
            response = self.make_request("DELETE", f"/customers/{self.test_data['customer_id']}")
            self.log_test("Cleanup Test Customer", response["success"])

    def run_regression_tests(self):
        """Run GPS regression tests"""
        print("🚀 Starting GPS Location APIs Regression Testing")
        print("=" * 70)
        print(f"Target: {BASE_URL}")
        print("Focus: GPS Location APIs after WeatherWidget removal and MapLibre integration")
        print("=" * 70)
        print()

        # Test API health first
        response = self.make_request("GET", "/")
        if response["success"]:
            self.log_test("API Health Check", True, f"API is responding: {response['data'].get('message', 'OK')}")
        else:
            self.log_test("API Health Check", False, "API is not responding")
            return

        # Run tests
        if self.setup_test_data():
            self.test_gps_location_create()
            self.test_gps_location_live()
            self.test_gps_location_route()
            self.test_gps_location_get_all()
            self.test_core_apis_health()
            self.cleanup_test_data()
        else:
            print("❌ Test data setup failed. Skipping GPS tests.")

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 GPS REGRESSION TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # GPS-specific summary
        gps_tests = [r for r in self.test_results if "GPS" in r["test"] or "Live" in r["test"] or "Route" in r["test"]]
        gps_passed = sum(1 for result in gps_tests if result["success"])
        
        print(f"\n🗺️ GPS Location APIs: {gps_passed}/{len(gps_tests)} passed")
        
        # Core APIs summary
        core_tests = [r for r in self.test_results if "Health" in r["test"]]
        core_passed = sum(1 for result in core_tests if result["success"])
        
        print(f"🏥 Core APIs Health: {core_passed}/{len(core_tests)} passed")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['details']}")
        else:
            print("\n🎉 ALL TESTS PASSED! No regressions detected.")
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    tester = GPSRegressionTester()
    tester.run_regression_tests()