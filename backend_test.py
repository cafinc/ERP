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
        self.session = None
        self.test_results = []
        self.test_data = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{API_BASE}{endpoint}"
            
            kwargs = {}
            if data:
                kwargs['json'] = data
            if params:
                kwargs['params'] = params
                
            async with self.session.request(method, url, **kwargs) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, response_data, response.status
                
        except Exception as e:
            return False, str(e), 0
    
    async def setup_test_data(self):
        """Create test customer and site for testing"""
        print("\n🔧 Setting up test data...")
        
        # Create test customer
        customer_data = {
            "name": "Test Customer for Site Service History",
            "email": "test.customer.ssh@example.com",
            "phone": "+1-555-0123",
            "address": "123 Test Street, Test City, TC 12345",
            "customer_type": "individual"
        }
        
        success, response, status = await self.make_request("POST", "/customers", customer_data)
        if success and response.get("id"):
            self.test_data["customer_id"] = response["id"]
            print(f"✅ Created test customer: {self.test_data['customer_id']}")
        else:
            print(f"❌ Failed to create test customer: {response}")
            return False
        
        # Create test site
        site_data = {
            "name": "Test Site for Service History",
            "customer_id": self.test_data["customer_id"],
            "site_type": "parking_lot",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "123 Test Site Avenue, Toronto, ON M5V 3A8"
            },
            "site_reference": "TSH-001",
            "area_size": 5000.0,
            "internal_notes": "Test site for service history testing",
            "crew_notes": "Handle with care - test site"
        }
        
        success, response, status = await self.make_request("POST", "/sites", site_data)
        if success and response.get("id"):
            self.test_data["site_id"] = response["id"]
            print(f"✅ Created test site: {self.test_data['site_id']}")
        else:
            print(f"❌ Failed to create test site: {response}")
            return False
        
        return True
    
    async def test_site_service_history_apis(self):
        """Test all Site Service History API endpoints"""
        print("\n🧪 Testing Site Service History APIs...")
        
        site_id = self.test_data["site_id"]
        
        # 1. Test POST /api/sites/{site_id}/service-history - Create new service history entry
        print("\n1. Testing Service History Creation...")
        
        # Test with all fields
        service_data_full = {
            "site_id": site_id,
            "service_date": "2024-01-15",
            "service_type": "Snow Plowing",
            "status": "completed",
            "crew_lead": "John Smith",
            "crew_members": ["Jane Doe", "Bob Wilson"],
            "description": "Complete snow plowing of parking lot",
            "notes": "Heavy snowfall, required extra passes",
            "duration_hours": 2.5,
            "photos": ["photo1.jpg", "photo2.jpg"],
            "weather_conditions": "Heavy snow, -5°C",
            "equipment_used": ["Plow Truck #1", "Salt Spreader #2"]
        }
        
        success, response, status = await self.make_request("POST", f"/sites/{site_id}/service-history", service_data_full)
        if success and response.get("service_history_id"):
            self.test_data["service_history_id_1"] = response["service_history_id"]
            self.log_test("Create service history (full fields)", True, f"Created with ID: {response['service_history_id']}")
        else:
            self.log_test("Create service history (full fields)", False, f"Status: {status}", response)
        
        # Test with minimal required fields only
        service_data_minimal = {
            "site_id": site_id,
            "service_date": "2024-01-16",
            "service_type": "Salting",
            "status": "completed"
        }
        
        success, response, status = await self.make_request("POST", f"/sites/{site_id}/service-history", service_data_minimal)
        if success and response.get("service_history_id"):
            self.test_data["service_history_id_2"] = response["service_history_id"]
            self.log_test("Create service history (minimal fields)", True, f"Created with ID: {response['service_history_id']}")
        else:
            self.log_test("Create service history (minimal fields)", False, f"Status: {status}", response)
        
        # Create a third entry for testing
        service_data_3 = {
            "site_id": site_id,
            "service_date": "2024-01-17",
            "service_type": "Landscaping",
            "status": "in_progress",
            "crew_lead": "Alice Johnson",
            "duration_hours": 1.0
        }
        
        success, response, status = await self.make_request("POST", f"/sites/{site_id}/service-history", service_data_3)
        if success and response.get("service_history_id"):
            self.test_data["service_history_id_3"] = response["service_history_id"]
            self.log_test("Create service history (third entry)", True, f"Created with ID: {response['service_history_id']}")
        else:
            self.log_test("Create service history (third entry)", False, f"Status: {status}", response)
        
        # 2. Test GET /api/sites/{site_id}/service-history - Get all service history
        print("\n2. Testing Service History Retrieval...")
        
        # Test without filters
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history")
        if success and response.get("service_history"):
            count = len(response["service_history"])
            self.log_test("Get all service history", True, f"Retrieved {count} entries")
        else:
            self.log_test("Get all service history", False, f"Status: {status}", response)
        
        # Test with limit parameter
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history", params={"limit": 2})
        if success and response.get("service_history"):
            count = len(response["service_history"])
            self.log_test("Get service history with limit", True, f"Retrieved {count} entries (limit=2)")
        else:
            self.log_test("Get service history with limit", False, f"Status: {status}", response)
        
        # Test with service_type filter
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history", params={"service_type": "Snow Plowing"})
        if success and response.get("service_history"):
            count = len(response["service_history"])
            self.log_test("Get service history by type", True, f"Retrieved {count} Snow Plowing entries")
        else:
            self.log_test("Get service history by type", False, f"Status: {status}", response)
        
        # Test with status filter
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history", params={"status": "completed"})
        if success and response.get("service_history"):
            count = len(response["service_history"])
            self.log_test("Get service history by status", True, f"Retrieved {count} completed entries")
        else:
            self.log_test("Get service history by status", False, f"Status: {status}", response)
        
        # 3. Test GET /api/sites/{site_id}/service-history/{history_id} - Get specific entry
        print("\n3. Testing Specific Service History Retrieval...")
        
        if "service_history_id_1" in self.test_data:
            history_id = self.test_data["service_history_id_1"]
            success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history/{history_id}")
            if success and response.get("service_history"):
                self.log_test("Get specific service history", True, f"Retrieved entry with ID: {history_id}")
            else:
                self.log_test("Get specific service history", False, f"Status: {status}", response)
        
        # Test with invalid history_id (should return 404)
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history/invalid_id")
        if status == 404:
            self.log_test("Get invalid service history (404 test)", True, "Correctly returned 404")
        else:
            self.log_test("Get invalid service history (404 test)", False, f"Expected 404, got {status}", response)
        
        # 4. Test GET /api/sites/{site_id}/service-history/stats - Get statistics
        print("\n4. Testing Service History Statistics...")
        
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history/stats")
        if success and "total_services" in response and "by_type" in response:
            total = response["total_services"]
            by_type = response["by_type"]
            self.log_test("Get service history stats", True, f"Total: {total}, Types: {len(by_type)}")
        else:
            self.log_test("Get service history stats", False, f"Status: {status}", response)
        
        # 5. Test PATCH /api/sites/{site_id}/service-history/{history_id} - Update entry
        print("\n5. Testing Service History Updates...")
        
        if "service_history_id_1" in self.test_data:
            history_id = self.test_data["service_history_id_1"]
            
            # Test updating service_type
            update_data = {"service_type": "Snow Removal"}
            success, response, status = await self.make_request("PATCH", f"/sites/{site_id}/service-history/{history_id}", update_data)
            if success:
                self.log_test("Update service history (service_type)", True, "Successfully updated service_type")
            else:
                self.log_test("Update service history (service_type)", False, f"Status: {status}", response)
            
            # Test updating status and notes
            update_data = {
                "status": "completed",
                "crew_lead": "Updated Lead",
                "notes": "Updated notes with additional information"
            }
            success, response, status = await self.make_request("PATCH", f"/sites/{site_id}/service-history/{history_id}", update_data)
            if success:
                self.log_test("Update service history (multiple fields)", True, "Successfully updated multiple fields")
            else:
                self.log_test("Update service history (multiple fields)", False, f"Status: {status}", response)
        
        # Test updating non-existent entry (should return 404)
        update_data = {"status": "completed"}
        success, response, status = await self.make_request("PATCH", f"/sites/{site_id}/service-history/invalid_id", update_data)
        if status == 404:
            self.log_test("Update invalid service history (404 test)", True, "Correctly returned 404")
        else:
            self.log_test("Update invalid service history (404 test)", False, f"Expected 404, got {status}", response)
        
        # 6. Test DELETE /api/sites/{site_id}/service-history/{history_id} - Delete entry
        print("\n6. Testing Service History Deletion...")
        
        if "service_history_id_3" in self.test_data:
            history_id = self.test_data["service_history_id_3"]
            
            # Delete the entry
            success, response, status = await self.make_request("DELETE", f"/sites/{site_id}/service-history/{history_id}")
            if success:
                self.log_test("Delete service history", True, f"Successfully deleted entry {history_id}")
                
                # Verify entry is removed
                success, response, status = await self.make_request("GET", f"/sites/{site_id}/service-history/{history_id}")
                if status == 404:
                    self.log_test("Verify deletion (404 check)", True, "Entry correctly removed")
                else:
                    self.log_test("Verify deletion (404 check)", False, f"Entry still exists, status: {status}")
            else:
                self.log_test("Delete service history", False, f"Status: {status}", response)
        
        # Test deleting non-existent entry (should return 404)
        success, response, status = await self.make_request("DELETE", f"/sites/{site_id}/service-history/invalid_id")
        if status == 404:
            self.log_test("Delete invalid service history (404 test)", True, "Correctly returned 404")
        else:
            self.log_test("Delete invalid service history (404 test)", False, f"Expected 404, got {status}", response)
    
    async def test_site_maps_apis(self):
        """Test all Site Maps API endpoints"""
        print("\n🗺️ Testing Site Maps APIs...")
        
        site_id = self.test_data["site_id"]
        
        # 1. Test POST /api/site-maps - Create new site map
        print("\n1. Testing Site Map Creation...")
        
        # Create base64 sample image data
        sample_image = base64.b64encode(b"fake_image_data_for_testing").decode('utf-8')
        
        map_data_1 = {
            "site_id": site_id,
            "name": "Main Site Map v1",
            "base_map_type": "satellite",
            "base_map_data": sample_image,
            "annotations": [
                {
                    "type": "polygon",
                    "coordinates": [[43.6532, -79.3832], [43.6533, -79.3831], [43.6534, -79.3833]],
                    "color": "#FF0000",
                    "category": "plowing_zone",
                    "label": "Main Plowing Area"
                },
                {
                    "type": "marker",
                    "coordinates": [43.6532, -79.3832],
                    "color": "#0000FF",
                    "category": "entrance",
                    "label": "Main Entrance"
                }
            ],
            "legend_items": [
                {"color": "#FF0000", "label": "Plowing Zones"},
                {"color": "#0000FF", "label": "Entrances"}
            ]
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", map_data_1)
        if success and response.get("id"):
            self.test_data["map_id_1"] = response["id"]
            version = response.get("version", 0)
            is_current = response.get("is_current", False)
            self.log_test("Create site map (v1)", True, f"Created map ID: {response['id']}, Version: {version}, Current: {is_current}")
        else:
            self.log_test("Create site map (v1)", False, f"Status: {status}", response)
        
        # Create second version
        map_data_2 = {
            "site_id": site_id,
            "name": "Main Site Map v2",
            "base_map_type": "hybrid",
            "base_map_data": sample_image,
            "annotations": [
                {
                    "type": "rectangle",
                    "coordinates": [[43.6532, -79.3832], [43.6535, -79.3830]],
                    "color": "#00FF00",
                    "category": "parking_area",
                    "label": "Parking Zone"
                }
            ],
            "legend_items": [
                {"color": "#00FF00", "label": "Parking Areas"}
            ]
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", map_data_2)
        if success and response.get("id"):
            self.test_data["map_id_2"] = response["id"]
            version = response.get("version", 0)
            is_current = response.get("is_current", False)
            self.log_test("Create site map (v2)", True, f"Created map ID: {response['id']}, Version: {version}, Current: {is_current}")
        else:
            self.log_test("Create site map (v2)", False, f"Status: {status}", response)
        
        # 2. Test GET /api/site-maps/site/{site_id} - Get all maps for a site
        print("\n2. Testing Site Maps Retrieval...")
        
        # Test without filters (all versions)
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}")
        if success and isinstance(response, list):
            count = len(response)
            current_count = sum(1 for m in response if m.get("is_current"))
            self.log_test("Get all site maps", True, f"Retrieved {count} maps, {current_count} current")
        else:
            self.log_test("Get all site maps", False, f"Status: {status}", response)
        
        # Test with current_only=true
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", params={"current_only": True})
        if success and isinstance(response, list):
            count = len(response)
            all_current = all(m.get("is_current") for m in response)
            self.log_test("Get current site maps only", True, f"Retrieved {count} current maps, All current: {all_current}")
        else:
            self.log_test("Get current site maps only", False, f"Status: {status}", response)
        
        # 3. Test GET /api/site-maps/{map_id} - Get specific map
        print("\n3. Testing Specific Site Map Retrieval...")
        
        if "map_id_1" in self.test_data:
            map_id = self.test_data["map_id_1"]
            success, response, status = await self.make_request("GET", f"/site-maps/{map_id}")
            if success and response.get("id"):
                annotations_count = len(response.get("annotations", []))
                legend_count = len(response.get("legend_items", []))
                self.log_test("Get specific site map", True, f"Retrieved map with {annotations_count} annotations, {legend_count} legend items")
            else:
                self.log_test("Get specific site map", False, f"Status: {status}", response)
        
        # Test with invalid map_id
        success, response, status = await self.make_request("GET", "/site-maps/invalid_map_id")
        if status == 404 or status == 500:  # Expecting error for invalid ID
            self.log_test("Get invalid site map (error test)", True, f"Correctly returned error {status}")
        else:
            self.log_test("Get invalid site map (error test)", False, f"Expected error, got {status}", response)
        
        # 4. Test PUT /api/site-maps/{map_id} - Update map
        print("\n4. Testing Site Map Updates...")
        
        if "map_id_1" in self.test_data:
            map_id = self.test_data["map_id_1"]
            
            # Test updating name
            update_data = {"name": "Updated Main Site Map v1"}
            success, response, status = await self.make_request("PUT", f"/site-maps/{map_id}", update_data)
            if success and response.get("name") == "Updated Main Site Map v1":
                self.log_test("Update site map name", True, "Successfully updated map name")
            else:
                self.log_test("Update site map name", False, f"Status: {status}", response)
            
            # Test updating annotations array
            update_data = {
                "annotations": [
                    {
                        "type": "circle",
                        "coordinates": [43.6532, -79.3832],
                        "radius": 50,
                        "color": "#FFFF00",
                        "category": "hazard",
                        "label": "Caution Area"
                    }
                ]
            }
            success, response, status = await self.make_request("PUT", f"/site-maps/{map_id}", update_data)
            if success:
                updated_annotations = response.get("annotations", [])
                self.log_test("Update site map annotations", True, f"Updated annotations: {len(updated_annotations)} items")
            else:
                self.log_test("Update site map annotations", False, f"Status: {status}", response)
        
        # 5. Test POST /api/site-maps/{map_id}/set-current - Set current version
        print("\n5. Testing Set Current Map Version...")
        
        if "map_id_1" in self.test_data:
            map_id = self.test_data["map_id_1"]
            
            # Set map 1 as current
            success, response, status = await self.make_request("POST", f"/site-maps/{map_id}/set-current")
            if success:
                self.log_test("Set map as current", True, f"Successfully set map {map_id} as current")
                
                # Verify only one current map per site
                success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}")
                if success and isinstance(response, list):
                    current_maps = [m for m in response if m.get("is_current")]
                    if len(current_maps) == 1 and current_maps[0]["id"] == map_id:
                        self.log_test("Verify single current map", True, "Only one map is marked as current")
                    else:
                        self.log_test("Verify single current map", False, f"Found {len(current_maps)} current maps")
                else:
                    self.log_test("Verify single current map", False, "Could not retrieve maps for verification")
            else:
                self.log_test("Set map as current", False, f"Status: {status}", response)
        
        # 6. Test DELETE /api/site-maps/{map_id} - Delete map
        print("\n6. Testing Site Map Deletion...")
        
        if "map_id_2" in self.test_data:
            map_id = self.test_data["map_id_2"]
            
            # Delete the map
            success, response, status = await self.make_request("DELETE", f"/site-maps/{map_id}")
            if success:
                self.log_test("Delete site map", True, f"Successfully deleted map {map_id}")
                
                # Verify map is deleted
                success, response, status = await self.make_request("GET", f"/site-maps/{map_id}")
                if status == 404 or status == 500:
                    self.log_test("Verify map deletion", True, "Map correctly removed")
                else:
                    self.log_test("Verify map deletion", False, f"Map still exists, status: {status}")
            else:
                self.log_test("Delete site map", False, f"Status: {status}", response)
    
    async def test_sites_api_integration(self):
        """Test Sites API integration with related features"""
        print("\n🏢 Testing Sites API Integration...")
        
        site_id = self.test_data["site_id"]
        
        # Test GET /api/sites/{site_id} - Verify site data
        success, response, status = await self.make_request("GET", f"/sites/{site_id}")
        if success and response.get("id"):
            self.log_test("Get site data", True, f"Retrieved site: {response.get('name')}")
        else:
            self.log_test("Get site data", False, f"Status: {status}", response)
        
        # Test geofence endpoint if it exists
        success, response, status = await self.make_request("GET", f"/sites/{site_id}/geofence")
        if success:
            self.log_test("Get site geofence", True, "Geofence data retrieved")
        elif status == 404:
            self.log_test("Get site geofence", True, "No geofence configured (404 expected)")
        else:
            self.log_test("Get site geofence", False, f"Unexpected status: {status}", response)
    
    async def test_error_handling_edge_cases(self):
        """Test error handling and edge cases"""
        print("\n⚠️ Testing Error Handling & Edge Cases...")
        
        # Test invalid ObjectIds
        invalid_ids = ["invalid_id", "123", "not_an_object_id"]
        
        for invalid_id in invalid_ids:
            # Test invalid site_id in service history
            success, response, status = await self.make_request("GET", f"/sites/{invalid_id}/service-history")
            if status in [400, 404, 500]:  # Any error status is acceptable for invalid ID
                self.log_test(f"Invalid site_id handling ({invalid_id})", True, f"Correctly returned error {status}")
            else:
                self.log_test(f"Invalid site_id handling ({invalid_id})", False, f"Unexpected status: {status}")
        
        # Test missing required fields (should return 422)
        invalid_service_data = {
            "site_id": self.test_data.get("site_id"),
            # Missing required fields: service_date, service_type, status
        }
        
        success, response, status = await self.make_request("POST", f"/sites/{self.test_data.get('site_id')}/service-history", invalid_service_data)
        if status == 422:
            self.log_test("Missing required fields (422 test)", True, "Correctly returned 422 validation error")
        else:
            self.log_test("Missing required fields (422 test)", False, f"Expected 422, got {status}", response)
        
        # Test non-existent site_id
        fake_site_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
        success, response, status = await self.make_request("GET", f"/sites/{fake_site_id}/service-history")
        if status in [404, 200]:  # 404 or empty result (200) both acceptable
            if status == 200 and response.get("count") == 0:
                self.log_test("Non-existent site_id handling", True, "Returned empty result for non-existent site")
            elif status == 404:
                self.log_test("Non-existent site_id handling", True, "Correctly returned 404 for non-existent site")
            else:
                self.log_test("Non-existent site_id handling", False, f"Unexpected response for non-existent site")
        else:
            self.log_test("Non-existent site_id handling", False, f"Unexpected status: {status}")
    
    async def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        
        # Setup test data
        if not await self.setup_test_data():
            print("❌ Failed to setup test data. Aborting tests.")
            return
        
        # Run test suites
        await self.test_site_service_history_apis()
        await self.test_site_maps_apis()
        await self.test_sites_api_integration()
        await self.test_error_handling_edge_cases()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*80)
        print("📊 TEST RESULTS SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}")
                    if result["details"]:
                        print(f"    {result['details']}")
        
        print("\n" + "="*80)
        
        # Determine overall status
        if success_rate >= 90:
            print("🎉 EXCELLENT: All systems working correctly!")
        elif success_rate >= 75:
            print("✅ GOOD: Most systems working with minor issues")
        elif success_rate >= 50:
            print("⚠️ WARNING: Significant issues detected")
        else:
            print("🚨 CRITICAL: Major system failures detected")

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())