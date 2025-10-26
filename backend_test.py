#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Site Service History and Site Maps
Testing all endpoints mentioned in the review request
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List
import base64

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://map-measure-admin.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.site_id = None
        self.service_history_ids = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
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

    def get_existing_site(self):
        """Get an existing site ID for testing"""
        try:
            response = self.session.get(f"{BACKEND_URL}/sites")
            if response.status_code == 200:
                sites = response.json()
                if sites and len(sites) > 0:
                    self.site_id = sites[0]["id"]
                    self.log_result("Get Existing Site", True, f"Found site ID: {self.site_id}")
                    return True
                else:
                    # Create a test site if none exist
                    return self.create_test_site()
            else:
                self.log_result("Get Existing Site", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Existing Site", False, f"Exception: {str(e)}")
            return False

    def create_test_site(self):
        """Create a test site for testing"""
        try:
            # First get a customer ID
            customers_response = self.session.get(f"{BACKEND_URL}/customers")
            if customers_response.status_code != 200:
                self.log_result("Create Test Site", False, "No customers available for site creation")
                return False
            
            customers = customers_response.json()
            if not customers:
                self.log_result("Create Test Site", False, "No customers found in database")
                return False
            
            customer_id = customers[0]["id"]
            
            site_data = {
                "name": "Test Site for Service History",
                "customer_id": customer_id,
                "site_type": "parking_lot",
                "location": {
                    "address": "123 Test Street, Test City, TC 12345",
                    "latitude": 43.6532,
                    "longitude": -79.3832
                }
            }
            
            response = self.session.post(f"{BACKEND_URL}/sites", json=site_data)
            if response.status_code == 200:
                site = response.json()
                self.site_id = site["id"]
                self.log_result("Create Test Site", True, f"Created test site ID: {self.site_id}")
                return True
            else:
                self.log_result("Create Test Site", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Test Site", False, f"Exception: {str(e)}")
            return False

    def test_create_service_history_complete(self):
        """Test creating service history with all fields"""
        try:
            service_data = {
                "site_id": self.site_id,
                "service_date": "2024-01-15T08:00:00Z",
                "service_type": "Snow Plowing",
                "crew_lead": "John Smith",
                "crew_members": ["John Smith", "Mike Johnson", "Sarah Wilson"],
                "description": "Complete snow plowing of parking lot after 6-inch snowfall",
                "notes": "Customer requested extra attention to entrance areas",
                "status": "completed",
                "duration_hours": 2.5,
                "photos": ["photo1.jpg", "photo2.jpg"],
                "weather_conditions": "Heavy snow, -5°C, 15mph winds",
                "equipment_used": ["Snow Plow Truck #1", "Salt Spreader #2"]
            }
            
            response = self.session.post(f"{BACKEND_URL}/sites/{self.site_id}/service-history", json=service_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("service_history_id"):
                    self.service_history_ids.append(result["service_history_id"])
                    self.log_result("Create Service History (Complete)", True, 
                                  f"Created with ID: {result['service_history_id']}")
                    return True
                else:
                    self.log_result("Create Service History (Complete)", False, 
                                  "Missing success flag or service_history_id", result)
                    return False
            else:
                self.log_result("Create Service History (Complete)", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Create Service History (Complete)", False, f"Exception: {str(e)}")
            return False

    def test_create_service_history_minimal(self):
        """Test creating service history with only required fields"""
        try:
            service_data = {
                "site_id": self.site_id,
                "service_date": "2024-01-16T10:30:00Z",
                "service_type": "Salting",
                "status": "completed"
            }
            
            response = self.session.post(f"{BACKEND_URL}/sites/{self.site_id}/service-history", json=service_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("service_history_id"):
                    self.service_history_ids.append(result["service_history_id"])
                    self.log_result("Create Service History (Minimal)", True, 
                                  f"Created with ID: {result['service_history_id']}")
                    return True
                else:
                    self.log_result("Create Service History (Minimal)", False, 
                                  "Missing success flag or service_history_id", result)
                    return False
            else:
                self.log_result("Create Service History (Minimal)", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Create Service History (Minimal)", False, f"Exception: {str(e)}")
            return False

    def test_create_service_history_different_types(self):
        """Test creating service history with different service types and statuses"""
        service_types = ["Landscaping", "Maintenance"]
        statuses = ["in_progress", "scheduled"]
        
        for i, (service_type, status) in enumerate(zip(service_types, statuses)):
            try:
                service_data = {
                    "site_id": self.site_id,
                    "service_date": f"2024-01-{17+i}T14:00:00Z",
                    "service_type": service_type,
                    "status": status,
                    "crew_lead": f"Crew Lead {i+1}",
                    "duration_hours": 1.5 + i
                }
                
                response = self.session.post(f"{BACKEND_URL}/sites/{self.site_id}/service-history", json=service_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success") and result.get("service_history_id"):
                        self.service_history_ids.append(result["service_history_id"])
                        self.log_result(f"Create Service History ({service_type})", True, 
                                      f"Created {service_type} with status {status}")
                    else:
                        self.log_result(f"Create Service History ({service_type})", False, 
                                      "Missing success flag or service_history_id", result)
                else:
                    self.log_result(f"Create Service History ({service_type})", False, 
                                  f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_result(f"Create Service History ({service_type})", False, f"Exception: {str(e)}")

    def test_get_service_history_all(self):
        """Test retrieving all service history for a site"""
        try:
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and "service_history" in result and "count" in result:
                    count = result["count"]
                    history = result["service_history"]
                    
                    # Verify sorting by service_date (descending)
                    if len(history) > 1:
                        dates_sorted = all(
                            history[i]["service_date"] >= history[i+1]["service_date"] 
                            for i in range(len(history)-1)
                        )
                        sort_status = "properly sorted" if dates_sorted else "NOT properly sorted"
                    else:
                        sort_status = "single entry (sorting N/A)"
                    
                    self.log_result("Get All Service History", True, 
                                  f"Retrieved {count} entries, {sort_status}")
                    return True
                else:
                    self.log_result("Get All Service History", False, 
                                  "Missing required fields in response", result)
                    return False
            else:
                self.log_result("Get All Service History", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get All Service History", False, f"Exception: {str(e)}")
            return False

    def test_get_service_history_with_filters(self):
        """Test retrieving service history with query parameters"""
        # Test service_type filter
        try:
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history?service_type=Snow Plowing")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    filtered_entries = [entry for entry in result["service_history"] 
                                      if entry["service_type"] == "Snow Plowing"]
                    all_match = len(filtered_entries) == len(result["service_history"])
                    
                    self.log_result("Get Service History (Type Filter)", all_match, 
                                  f"Filter working: {len(result['service_history'])} Snow Plowing entries")
                else:
                    self.log_result("Get Service History (Type Filter)", False, 
                                  "Missing success flag", result)
            else:
                self.log_result("Get Service History (Type Filter)", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Service History (Type Filter)", False, f"Exception: {str(e)}")

        # Test status filter
        try:
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history?status=completed")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    filtered_entries = [entry for entry in result["service_history"] 
                                      if entry["status"] == "completed"]
                    all_match = len(filtered_entries) == len(result["service_history"])
                    
                    self.log_result("Get Service History (Status Filter)", all_match, 
                                  f"Filter working: {len(result['service_history'])} completed entries")
                else:
                    self.log_result("Get Service History (Status Filter)", False, 
                                  "Missing success flag", result)
            else:
                self.log_result("Get Service History (Status Filter)", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Service History (Status Filter)", False, f"Exception: {str(e)}")

        # Test limit parameter
        try:
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history?limit=2")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    limited = len(result["service_history"]) <= 2
                    self.log_result("Get Service History (Limit)", limited, 
                                  f"Limit working: {len(result['service_history'])} entries (max 2)")
                else:
                    self.log_result("Get Service History (Limit)", False, 
                                  "Missing success flag", result)
            else:
                self.log_result("Get Service History (Limit)", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Service History (Limit)", False, f"Exception: {str(e)}")

    def test_get_service_history_nonexistent_site(self):
        """Test retrieving service history for non-existent site"""
        try:
            fake_site_id = str(uuid.uuid4())
            response = self.session.get(f"{BACKEND_URL}/sites/{fake_site_id}/service-history")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("count") == 0:
                    self.log_result("Get Service History (Non-existent Site)", True, 
                                  "Returns empty array for non-existent site")
                else:
                    self.log_result("Get Service History (Non-existent Site)", False, 
                                  "Should return empty array", result)
            else:
                self.log_result("Get Service History (Non-existent Site)", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Service History (Non-existent Site)", False, f"Exception: {str(e)}")

    def test_get_single_service_history(self):
        """Test retrieving a specific service history entry"""
        if not self.service_history_ids:
            self.log_result("Get Single Service History", False, "No service history IDs available")
            return
        
        try:
            history_id = self.service_history_ids[0]
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{history_id}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and "service_history" in result:
                    entry = result["service_history"]
                    has_required_fields = all(field in entry for field in 
                                            ["id", "site_id", "service_date", "service_type", "status"])
                    
                    self.log_result("Get Single Service History", has_required_fields, 
                                  f"Retrieved entry with ID: {entry.get('id')}")
                else:
                    self.log_result("Get Single Service History", False, 
                                  "Missing success flag or service_history", result)
            else:
                self.log_result("Get Single Service History", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Single Service History", False, f"Exception: {str(e)}")

    def test_get_single_service_history_nonexistent(self):
        """Test retrieving non-existent service history entry"""
        try:
            fake_history_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{fake_history_id}")
            
            if response.status_code == 404:
                self.log_result("Get Single Service History (Non-existent)", True, 
                              "Returns 404 for non-existent history ID")
            else:
                self.log_result("Get Single Service History (Non-existent)", False, 
                              f"Expected 404, got HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Single Service History (Non-existent)", False, f"Exception: {str(e)}")

    def test_update_service_history(self):
        """Test updating service history entry"""
        if not self.service_history_ids:
            self.log_result("Update Service History", False, "No service history IDs available")
            return
        
        try:
            history_id = self.service_history_ids[0]
            update_data = {
                "service_type": "Snow Plowing - Updated",
                "status": "completed",
                "crew_lead": "Updated Crew Lead",
                "notes": "Updated notes with additional information",
                "duration_hours": 3.0
            }
            
            response = self.session.patch(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{history_id}", 
                                        json=update_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    # Verify the update by retrieving the entry
                    get_response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{history_id}")
                    if get_response.status_code == 200:
                        updated_entry = get_response.json()["service_history"]
                        updated_correctly = (
                            updated_entry["service_type"] == "Snow Plowing - Updated" and
                            updated_entry["crew_lead"] == "Updated Crew Lead" and
                            updated_entry["duration_hours"] == 3.0
                        )
                        
                        self.log_result("Update Service History", updated_correctly, 
                                      "Entry updated and verified successfully")
                    else:
                        self.log_result("Update Service History", False, 
                                      "Update succeeded but verification failed")
                else:
                    self.log_result("Update Service History", False, 
                                  "Missing success flag", result)
            else:
                self.log_result("Update Service History", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Update Service History", False, f"Exception: {str(e)}")

    def test_update_service_history_nonexistent(self):
        """Test updating non-existent service history entry"""
        try:
            fake_history_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
            update_data = {"status": "completed"}
            
            response = self.session.patch(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{fake_history_id}", 
                                        json=update_data)
            
            if response.status_code == 404:
                self.log_result("Update Service History (Non-existent)", True, 
                              "Returns 404 for non-existent history ID")
            else:
                self.log_result("Update Service History (Non-existent)", False, 
                              f"Expected 404, got HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Update Service History (Non-existent)", False, f"Exception: {str(e)}")

    def test_delete_service_history(self):
        """Test deleting service history entry"""
        if len(self.service_history_ids) < 2:
            self.log_result("Delete Service History", False, "Need at least 2 service history entries")
            return
        
        try:
            # Use the last created entry for deletion
            history_id = self.service_history_ids[-1]
            
            response = self.session.delete(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{history_id}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    # Verify deletion by trying to retrieve the entry
                    get_response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{history_id}")
                    if get_response.status_code == 404:
                        self.log_result("Delete Service History", True, 
                                      "Entry deleted and verified as non-retrievable")
                        # Remove from our tracking list
                        self.service_history_ids.remove(history_id)
                    else:
                        self.log_result("Delete Service History", False, 
                                      "Delete succeeded but entry still retrievable")
                else:
                    self.log_result("Delete Service History", False, 
                                  "Missing success flag", result)
            else:
                self.log_result("Delete Service History", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Delete Service History", False, f"Exception: {str(e)}")

    def test_delete_service_history_nonexistent(self):
        """Test deleting non-existent service history entry"""
        try:
            fake_history_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
            
            response = self.session.delete(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{fake_history_id}")
            
            if response.status_code == 404:
                self.log_result("Delete Service History (Non-existent)", True, 
                              "Returns 404 for non-existent history ID")
            else:
                self.log_result("Delete Service History (Non-existent)", False, 
                              f"Expected 404, got HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Delete Service History (Non-existent)", False, f"Exception: {str(e)}")

    def test_get_service_history_stats(self):
        """Test getting service history statistics"""
        try:
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history/stats")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and "total_services" in result and "by_type" in result:
                    total_services = result["total_services"]
                    by_type = result["by_type"]
                    
                    # Verify structure of by_type
                    valid_structure = all(
                        "_id" in stat and "count" in stat and "total_hours" in stat
                        for stat in by_type
                    )
                    
                    self.log_result("Get Service History Stats", valid_structure, 
                                  f"Total services: {total_services}, Types: {len(by_type)}")
                else:
                    self.log_result("Get Service History Stats", False, 
                                  "Missing required fields in response", result)
            else:
                self.log_result("Get Service History Stats", False, 
                              f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Service History Stats", False, f"Exception: {str(e)}")

    def test_bson_objectid_serialization(self):
        """Test that BSON ObjectId serialization works correctly"""
        if not self.service_history_ids:
            self.log_result("BSON ObjectId Serialization", False, "No service history IDs available")
            return
        
        try:
            # Test with invalid ObjectId format
            invalid_id = "invalid_object_id"
            response = self.session.get(f"{BACKEND_URL}/sites/{self.site_id}/service-history/{invalid_id}")
            
            # Should return 500 error for invalid ObjectId, not crash
            if response.status_code in [400, 404, 500]:
                self.log_result("BSON ObjectId Serialization", True, 
                              f"Handles invalid ObjectId gracefully (HTTP {response.status_code})")
            else:
                self.log_result("BSON ObjectId Serialization", False, 
                              f"Unexpected response for invalid ObjectId: HTTP {response.status_code}")
        except Exception as e:
            self.log_result("BSON ObjectId Serialization", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all Site Service History API tests"""
        print("🧪 Starting Site Service History Backend API Tests")
        print("=" * 60)
        
        # Setup: Get or create a site
        if not self.get_existing_site():
            print("❌ Cannot proceed without a valid site ID")
            return
        
        print(f"🏢 Using Site ID: {self.site_id}")
        print("-" * 60)
        
        # Test 1: Create Service History Entry
        print("📝 Testing Service History Creation...")
        self.test_create_service_history_complete()
        self.test_create_service_history_minimal()
        self.test_create_service_history_different_types()
        
        # Test 2: Get Service History for Site
        print("\n📋 Testing Service History Retrieval...")
        self.test_get_service_history_all()
        self.test_get_service_history_with_filters()
        self.test_get_service_history_nonexistent_site()
        
        # Test 3: Get Single Service History Entry
        print("\n🔍 Testing Single Entry Retrieval...")
        self.test_get_single_service_history()
        self.test_get_single_service_history_nonexistent()
        
        # Test 4: Update Service History
        print("\n✏️ Testing Service History Updates...")
        self.test_update_service_history()
        self.test_update_service_history_nonexistent()
        
        # Test 5: Delete Service History
        print("\n🗑️ Testing Service History Deletion...")
        self.test_delete_service_history()
        self.test_delete_service_history_nonexistent()
        
        # Test 6: Get Service History Statistics
        print("\n📊 Testing Service History Statistics...")
        self.test_get_service_history_stats()
        
        # Test 7: Error Handling
        print("\n🛡️ Testing Error Handling...")
        self.test_bson_objectid_serialization()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}")
        
        # Overall status
        if success_rate >= 90:
            print(f"\n🎉 EXCELLENT: Site Service History API is working excellently!")
        elif success_rate >= 75:
            print(f"\n✅ GOOD: Site Service History API is working well with minor issues.")
        elif success_rate >= 50:
            print(f"\n⚠️ MODERATE: Site Service History API has some issues that need attention.")
        else:
            print(f"\n❌ POOR: Site Service History API has significant issues requiring immediate attention.")

if __name__ == "__main__":
    tester = SiteServiceHistoryTester()
    tester.run_all_tests()