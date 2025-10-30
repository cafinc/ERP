#!/usr/bin/env python3
"""
Enhanced Photo Management and GPS Tracking Backend API Testing
Focused testing for the enhanced features as requested
"""

import requests
import json
import time
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid

# Configuration
BASE_URL = "https://webadmin-rescue.preview.emergentagent.com/api"
TIMEOUT = 30

class EnhancedBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_data = {}
        self.results = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.results.append(result)
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
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.Timeout:
            return {"status_code": 408, "data": {"error": "Request timeout"}, "success": False}
        except requests.exceptions.RequestException as e:
            return {"status_code": 500, "data": {"error": str(e)}, "success": False}
        except json.JSONDecodeError:
            return {"status_code": response.status_code, "data": {"error": "Invalid JSON response"}, "success": False}

    def setup_test_data(self):
        """Create test data for enhanced photo and GPS testing"""
        print("🔧 Setting up test data...")
        
        # Create test customer
        customer_data = {
            "name": "Enhanced Test Customer",
            "email": "enhanced.test@example.com",
            "phone": "+1234567890",
            "address": "123 Enhanced Test St"
        }
        response = self.make_request("POST", "/customers", customer_data)
        if response["success"]:
            self.test_data["customer_id"] = response["data"]["id"]
            print(f"✅ Created test customer: {self.test_data['customer_id']}")
        else:
            print(f"❌ Failed to create customer: {response}")
            return False

        # Create test site
        site_data = {
            "name": "Enhanced Test Site",
            "customer_id": self.test_data["customer_id"],
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "123 Enhanced Test St, Toronto, ON"
            },
            "site_type": "commercial",
            "area_size": 5000
        }
        response = self.make_request("POST", "/sites", site_data)
        if response["success"]:
            self.test_data["site_id"] = response["data"]["id"]
            print(f"✅ Created test site: {self.test_data['site_id']}")
        else:
            print(f"❌ Failed to create site: {response}")
            return False

        # Create test crew member
        crew_data = {
            "name": "Enhanced Test Crew",
            "email": "enhanced.crew@example.com",
            "phone": "+1987654321",
            "role": "crew"
        }
        response = self.make_request("POST", "/users", crew_data)
        if response["success"]:
            self.test_data["crew_id"] = response["data"]["id"]
            print(f"✅ Created test crew: {self.test_data['crew_id']}")
        else:
            print(f"❌ Failed to create crew: {response}")
            return False

        # Create test equipment first
        equipment_data = {
            "name": "Test Snow Plow",
            "equipment_type": "plow_truck",
            "vehicle_number": "TEST-001"
        }
        response = self.make_request("POST", "/equipment", equipment_data)
        if response["success"]:
            self.test_data["equipment_id"] = response["data"]["id"]
            print(f"✅ Created test equipment: {self.test_data['equipment_id']}")
        else:
            print(f"❌ Failed to create equipment: {response}")
            return False

        # Create test dispatch
        dispatch_data = {
            "route_name": "Enhanced Test Route",
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
            print(f"✅ Created test dispatch: {self.test_data['dispatch_id']}")
        else:
            print(f"❌ Failed to create dispatch: {response}")
            return False

        print("✅ Test data setup complete\n")
        return True

    def test_enhanced_photo_creation(self):
        """Test enhanced photo creation with all new metadata fields"""
        print("📸 Testing Enhanced Photo Creation...")
        
        # Create sample base64 image data
        sample_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        thumbnail_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Test enhanced before photo
        before_photo_data = {
            "dispatch_id": self.test_data["dispatch_id"],
            "site_id": self.test_data["site_id"],
            "crew_id": self.test_data["crew_id"],
            "crew_name": "Enhanced Test Crew",
            "photo_type": "before",
            "category": "snow_removal",
            "image_data": sample_image,
            "thumbnail_data": thumbnail_data,
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "123 Enhanced Test St, Toronto, ON"
            },
            "weather_conditions": "snowy",
            "temperature": -5,
            "file_size": 1024,
            "image_width": 1920,
            "image_height": 1080,
            "device_info": "iPhone 14 Pro",
            "is_required": True,
            "is_verified": False,
            "notes": "Initial snow conditions before removal"
        }
        
        response = self.make_request("POST", "/photos", before_photo_data)
        if response["success"]:
            self.test_data["before_photo_id"] = response["data"]["id"]
            photo = response["data"]
            
            # Verify all enhanced fields are present
            required_fields = ["crew_id", "crew_name", "category", "weather_conditions", 
                             "temperature", "file_size", "image_width", "image_height", 
                             "device_info", "is_required", "is_verified"]
            
            missing_fields = [field for field in required_fields if field not in photo]
            if missing_fields:
                self.log_result("Enhanced Photo Creation - Before Photo", False, 
                              f"Missing enhanced fields: {missing_fields}", photo)
            else:
                self.log_result("Enhanced Photo Creation - Before Photo", True, 
                              "All enhanced metadata fields present", photo)
        else:
            self.log_result("Enhanced Photo Creation - Before Photo", False, 
                          f"Failed to create photo: {response['data']}", response)

        # Test enhanced after photo
        after_photo_data = {
            "dispatch_id": self.test_data["dispatch_id"],
            "site_id": self.test_data["site_id"],
            "crew_id": self.test_data["crew_id"],
            "crew_name": "Enhanced Test Crew",
            "photo_type": "after",
            "category": "snow_removal",
            "image_data": sample_image,
            "thumbnail_data": thumbnail_data,
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "123 Enhanced Test St, Toronto, ON"
            },
            "weather_conditions": "clear",
            "temperature": -3,
            "file_size": 2048,
            "image_width": 1920,
            "image_height": 1080,
            "device_info": "iPhone 14 Pro",
            "is_required": True,
            "is_verified": False,
            "notes": "Completed snow removal work"
        }
        
        response = self.make_request("POST", "/photos", after_photo_data)
        if response["success"]:
            self.test_data["after_photo_id"] = response["data"]["id"]
            self.log_result("Enhanced Photo Creation - After Photo", True, 
                          "After photo created with enhanced metadata", response["data"])
        else:
            self.log_result("Enhanced Photo Creation - After Photo", False, 
                          f"Failed to create after photo: {response['data']}", response)

    def test_photo_analytics_endpoint(self):
        """Test photo analytics endpoint for dispatch summary"""
        print("📊 Testing Photo Analytics Endpoint...")
        
        endpoint = f"/photos/dispatch/{self.test_data['dispatch_id']}/summary"
        response = self.make_request("GET", endpoint)
        
        if response["success"]:
            summary = response["data"]
            
            # Verify summary structure
            required_keys = ["total_photos", "verified_photos", "by_type", "by_category", "completion_status"]
            missing_keys = [key for key in required_keys if key not in summary]
            
            if missing_keys:
                self.log_result("Photo Analytics Endpoint", False, 
                              f"Missing summary keys: {missing_keys}", summary)
            else:
                # Verify completion status logic
                completion = summary["completion_status"]
                expected_keys = ["has_before_photos", "has_after_photos", "is_complete", "missing_photos"]
                
                if all(key in completion for key in expected_keys):
                    # Check if logic is correct
                    has_before = completion["has_before_photos"]
                    has_after = completion["has_after_photos"]
                    is_complete = completion["is_complete"]
                    
                    if is_complete == (has_before and has_after):
                        self.log_result("Photo Analytics Endpoint", True, 
                                      f"Analytics working correctly. Total: {summary['total_photos']}, Complete: {is_complete}", summary)
                    else:
                        self.log_result("Photo Analytics Endpoint", False, 
                                      "Completion logic incorrect", summary)
                else:
                    self.log_result("Photo Analytics Endpoint", False, 
                                  f"Missing completion status keys: {[k for k in expected_keys if k not in completion]}", summary)
        else:
            self.log_result("Photo Analytics Endpoint", False, 
                          f"Failed to get analytics: {response['data']}", response)

    def test_enhanced_photo_filtering(self):
        """Test enhanced photo filtering options"""
        print("🔍 Testing Enhanced Photo Filtering...")
        
        # Test filtering by crew_id
        response = self.make_request("GET", "/photos", params={"crew_id": self.test_data["crew_id"]})
        if response["success"]:
            photos = response["data"]
            crew_filtered = all(photo.get("crew_id") == self.test_data["crew_id"] for photo in photos)
            self.log_result("Photo Filtering - By Crew ID", crew_filtered, 
                          f"Found {len(photos)} photos for crew", photos)
        else:
            self.log_result("Photo Filtering - By Crew ID", False, 
                          f"Failed to filter by crew_id: {response['data']}", response)

        # Test filtering by photo_type
        response = self.make_request("GET", "/photos", params={"photo_type": "before"})
        if response["success"]:
            photos = response["data"]
            type_filtered = all(photo.get("photo_type") == "before" for photo in photos)
            self.log_result("Photo Filtering - By Photo Type", type_filtered, 
                          f"Found {len(photos)} before photos", photos)
        else:
            self.log_result("Photo Filtering - By Photo Type", False, 
                          f"Failed to filter by photo_type: {response['data']}", response)

        # Test filtering by category
        response = self.make_request("GET", "/photos", params={"category": "snow_removal"})
        if response["success"]:
            photos = response["data"]
            category_filtered = all(photo.get("category") == "snow_removal" for photo in photos)
            self.log_result("Photo Filtering - By Category", category_filtered, 
                          f"Found {len(photos)} snow_removal photos", photos)
        else:
            self.log_result("Photo Filtering - By Category", False, 
                          f"Failed to filter by category: {response['data']}", response)

        # Test filtering by verification status
        response = self.make_request("GET", "/photos", params={"is_verified": False})
        if response["success"]:
            photos = response["data"]
            verification_filtered = all(photo.get("is_verified") == False for photo in photos)
            self.log_result("Photo Filtering - By Verification Status", verification_filtered, 
                          f"Found {len(photos)} unverified photos", photos)
        else:
            self.log_result("Photo Filtering - By Verification Status", False, 
                          f"Failed to filter by is_verified: {response['data']}", response)

    def test_admin_photo_verification(self):
        """Test admin photo verification workflow"""
        print("✅ Testing Admin Photo Verification Workflow...")
        
        if "before_photo_id" not in self.test_data:
            self.log_result("Admin Photo Verification", False, "No photo ID available for testing")
            return

        # Test photo verification update
        verification_data = {
            "is_verified": True,
            "notes": "Photo verified by admin - good quality and shows proper work completion"
        }
        
        endpoint = f"/photos/{self.test_data['before_photo_id']}"
        response = self.make_request("PUT", endpoint, verification_data)
        
        if response["success"]:
            updated_photo = response["data"]
            if updated_photo.get("is_verified") == True:
                self.log_result("Admin Photo Verification", True, 
                              "Photo successfully verified by admin", updated_photo)
            else:
                self.log_result("Admin Photo Verification", False, 
                              "Photo verification status not updated", updated_photo)
        else:
            self.log_result("Admin Photo Verification", False, 
                          f"Failed to verify photo: {response['data']}", response)

    def test_enhanced_gps_location_creation(self):
        """Test enhanced GPS location creation with new fields"""
        print("🗺️ Testing Enhanced GPS Location Creation...")
        
        # Test enhanced GPS location with all new fields
        gps_data = {
            "crew_id": self.test_data["crew_id"],
            "dispatch_id": self.test_data["dispatch_id"],
            "latitude": 43.6532,
            "longitude": -79.3832,
            "speed": 45.5,
            "accuracy": 5.0,
            "bearing": 180.0
        }
        
        response = self.make_request("POST", "/gps-location", gps_data)
        if response["success"]:
            location = response["data"]
            self.test_data["gps_location_id"] = location["id"]
            
            # Verify enhanced fields are present
            enhanced_fields = ["speed", "accuracy", "bearing"]
            missing_fields = [field for field in enhanced_fields if field not in location]
            
            if missing_fields:
                self.log_result("Enhanced GPS Location Creation", False, 
                              f"Missing enhanced GPS fields: {missing_fields}", location)
            else:
                self.log_result("Enhanced GPS Location Creation", True, 
                              "GPS location created with enhanced fields", location)
        else:
            self.log_result("Enhanced GPS Location Creation", False, 
                          f"Failed to create GPS location: {response['data']}", response)

        # Create additional GPS points for route testing
        for i in range(3):
            additional_gps = {
                "crew_id": self.test_data["crew_id"],
                "dispatch_id": self.test_data["dispatch_id"],
                "latitude": 43.6532 + (i * 0.001),
                "longitude": -79.3832 + (i * 0.001),
                "speed": 30.0 + (i * 5),
                "accuracy": 3.0 + i,
                "bearing": 90.0 + (i * 30)
            }
            self.make_request("POST", "/gps-location", additional_gps)
            time.sleep(0.1)  # Small delay to ensure different timestamps

    def test_live_crew_location_endpoint(self):
        """Test live crew location endpoint"""
        print("📍 Testing Live Crew Location Endpoint...")
        
        endpoint = f"/gps-location/live/{self.test_data['crew_id']}"
        response = self.make_request("GET", endpoint)
        
        if response["success"]:
            location = response["data"]
            
            # Verify it's the most recent location
            required_fields = ["crew_id", "latitude", "longitude", "timestamp", "speed", "accuracy", "bearing"]
            missing_fields = [field for field in required_fields if field not in location]
            
            if missing_fields:
                self.log_result("Live Crew Location Endpoint", False, 
                              f"Missing fields in live location: {missing_fields}", location)
            else:
                if location["crew_id"] == self.test_data["crew_id"]:
                    self.log_result("Live Crew Location Endpoint", True, 
                                  "Live location retrieved successfully", location)
                else:
                    self.log_result("Live Crew Location Endpoint", False, 
                                  "Wrong crew_id in live location", location)
        else:
            self.log_result("Live Crew Location Endpoint", False, 
                          f"Failed to get live location: {response['data']}", response)

    def test_route_analytics_endpoint(self):
        """Test route analytics with distance calculation"""
        print("📈 Testing Route Analytics Endpoint...")
        
        endpoint = f"/gps-location/route/{self.test_data['dispatch_id']}"
        response = self.make_request("GET", endpoint)
        
        if response["success"]:
            route_data = response["data"]
            
            # Verify route analytics structure
            required_keys = ["route", "total_distance", "duration", "start_time", "end_time"]
            missing_keys = [key for key in required_keys if key not in route_data]
            
            if missing_keys:
                self.log_result("Route Analytics Endpoint", False, 
                              f"Missing route analytics keys: {missing_keys}", route_data)
            else:
                route = route_data["route"]
                total_distance = route_data["total_distance"]
                duration = route_data["duration"]
                
                if len(route) > 0 and isinstance(total_distance, (int, float)) and isinstance(duration, (int, float)):
                    self.log_result("Route Analytics Endpoint", True, 
                                  f"Route analytics working. Points: {len(route)}, Distance: {total_distance}km, Duration: {duration}h", route_data)
                else:
                    self.log_result("Route Analytics Endpoint", False, 
                                  "Invalid route analytics data types", route_data)
        else:
            self.log_result("Route Analytics Endpoint", False, 
                          f"Failed to get route analytics: {response['data']}", response)

    def test_geofencing_automation(self):
        """Test geofencing automation and proximity detection"""
        print("🎯 Testing Geofencing Automation...")
        
        # Create GPS location very close to the site (within 100m)
        site_lat = 43.6532
        site_lon = -79.3832
        
        # Create location within geofence (same coordinates as site)
        geofence_gps = {
            "crew_id": self.test_data["crew_id"],
            "dispatch_id": self.test_data["dispatch_id"],
            "latitude": site_lat,
            "longitude": site_lon,
            "speed": 0.0,
            "accuracy": 2.0,
            "bearing": 0.0
        }
        
        response = self.make_request("POST", "/gps-location", geofence_gps)
        if response["success"]:
            self.log_result("Geofencing - GPS Location Creation", True, 
                          "GPS location created within geofence", response["data"])
            
            # Wait a moment for geofencing logic to process
            time.sleep(2)
            
            # Check if dispatch status was updated
            dispatch_response = self.make_request("GET", f"/dispatches/{self.test_data['dispatch_id']}")
            if dispatch_response["success"]:
                dispatch = dispatch_response["data"]
                
                # Check if status changed to in_progress and arrived_at was set
                if dispatch.get("status") == "in_progress" and dispatch.get("arrived_at"):
                    self.log_result("Geofencing - Dispatch Status Update", True, 
                                  "Dispatch status updated to in_progress with arrival time", dispatch)
                else:
                    self.log_result("Geofencing - Dispatch Status Update", False, 
                                  f"Dispatch status not updated correctly. Status: {dispatch.get('status')}, Arrived: {dispatch.get('arrived_at')}", dispatch)
            else:
                self.log_result("Geofencing - Dispatch Status Update", False, 
                              f"Failed to retrieve dispatch: {dispatch_response['data']}", dispatch_response)
        else:
            self.log_result("Geofencing - GPS Location Creation", False, 
                          f"Failed to create geofence GPS location: {response['data']}", response)

    def test_integration_features(self):
        """Test integration features between photo and GPS systems"""
        print("🔗 Testing Integration Features...")
        
        # Test that photo upload triggers notification creation
        # Check messages for photo upload notifications
        response = self.make_request("GET", "/messages", params={"type": "photo_upload"})
        if response["success"]:
            messages = response["data"]
            photo_messages = [msg for msg in messages if msg.get("source_type") == "photo_upload"]
            
            if len(photo_messages) >= 2:  # Should have messages for before and after photos
                self.log_result("Integration - Photo Upload Notifications", True, 
                              f"Found {len(photo_messages)} photo upload notifications", photo_messages)
            else:
                self.log_result("Integration - Photo Upload Notifications", False, 
                              f"Expected at least 2 photo notifications, found {len(photo_messages)}", photo_messages)
        else:
            self.log_result("Integration - Photo Upload Notifications", False, 
                          f"Failed to retrieve photo notifications: {response['data']}", response)

        # Test geofencing system message creation
        response = self.make_request("GET", "/messages", params={"type": "system_alert"})
        if response["success"]:
            messages = response["data"]
            geofence_messages = [msg for msg in messages if msg.get("source_type") == "gps_geofence"]
            
            if len(geofence_messages) > 0:
                self.log_result("Integration - Geofencing System Messages", True, 
                              f"Found {len(geofence_messages)} geofencing system messages", geofence_messages)
            else:
                self.log_result("Integration - Geofencing System Messages", False, 
                              "No geofencing system messages found", messages)
        else:
            self.log_result("Integration - Geofencing System Messages", False, 
                          f"Failed to retrieve system messages: {response['data']}", response)

    def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        cleanup_items = [
            ("photos", self.test_data.get("before_photo_id")),
            ("photos", self.test_data.get("after_photo_id")),
            ("dispatches", self.test_data.get("dispatch_id")),
            ("equipment", self.test_data.get("equipment_id")),
            ("users", self.test_data.get("crew_id")),
            ("sites", self.test_data.get("site_id")),
            ("customers", self.test_data.get("customer_id"))
        ]
        
        for endpoint, item_id in cleanup_items:
            if item_id:
                response = self.make_request("DELETE", f"/{endpoint}/{item_id}")
                if response["success"]:
                    print(f"✅ Deleted {endpoint}/{item_id}")
                else:
                    print(f"⚠️ Failed to delete {endpoint}/{item_id}: {response}")

    def run_all_tests(self):
        """Run all enhanced photo and GPS tests"""
        print("🚀 Starting Enhanced Photo Management and GPS Tracking Backend Tests")
        print("=" * 80)
        
        # Setup
        if not self.setup_test_data():
            print("❌ Test setup failed. Aborting tests.")
            return
        
        # Enhanced Photo Management Tests
        print("\n📸 ENHANCED PHOTO MANAGEMENT TESTS")
        print("-" * 50)
        self.test_enhanced_photo_creation()
        self.test_photo_analytics_endpoint()
        self.test_enhanced_photo_filtering()
        self.test_admin_photo_verification()
        
        # Enhanced GPS Tracking Tests
        print("\n🗺️ ENHANCED GPS TRACKING TESTS")
        print("-" * 50)
        self.test_enhanced_gps_location_creation()
        self.test_live_crew_location_endpoint()
        self.test_route_analytics_endpoint()
        self.test_geofencing_automation()
        
        # Integration Tests
        print("\n🔗 INTEGRATION TESTS")
        print("-" * 50)
        self.test_integration_features()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = EnhancedBackendTester()
    tester.run_all_tests()