#!/usr/bin/env python3
"""
Site Maps API Re-Testing After Fixes
Comprehensive testing of all Site Maps endpoints as requested in review
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, List

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://service-history-app.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class SiteMapsAPITester:
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
        """Create test customer and site for Site Maps testing"""
        print("\n🔧 Setting up test data for Site Maps...")
        
        # Create test customer
        customer_data = {
            "name": "Site Maps Test Customer",
            "email": "sitemaps.test@example.com",
            "phone": "+1-555-0199",
            "address": "456 Maps Test Street, Test City, TC 12345",
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
            "name": "Site Maps Test Site",
            "customer_id": self.test_data["customer_id"],
            "site_type": "parking_lot",
            "location": {
                "latitude": 51.0447,
                "longitude": -114.0719,
                "address": "789 Site Maps Avenue, Calgary, AB T2P 1J9"
            },
            "site_reference": "SM-TEST-001",
            "area_size": 8000.0,
            "internal_notes": "Test site for Site Maps API testing",
            "crew_notes": "Site Maps testing - handle with care"
        }
        
        success, response, status = await self.make_request("POST", "/sites", site_data)
        if success and response.get("id"):
            self.test_data["site_id"] = response["id"]
            print(f"✅ Created test site: {self.test_data['site_id']}")
        else:
            print(f"❌ Failed to create test site: {response}")
            return False
        
        return True
    
    async def test_site_maps_create_api(self):
        """Test POST /api/site-maps - Create new site map"""
        print("\n🗺️ Testing Site Maps Creation API...")
        
        site_id = self.test_data["site_id"]
        
        # Test 1: Create site map with complete data structure matching frontend format
        print("\n1️⃣ Testing POST /api/site-maps - Complete data structure")
        
        site_map_data = {
            "site_id": site_id,
            "name": "Test Map v1",
            "base_map_type": "google_maps",
            "base_map_data": "data:image/png;base64,test",
            "base_map_url": "Test Location",
            "annotations": [
                {
                    "id": "ann_123456",
                    "type": "polygon",
                    "category": "plowing_zone",
                    "color": "#3B82F6",
                    "coordinates": [{"x": -114.0719, "y": 51.0447}],
                    "properties": {"strokeWeight": 2}
                }
            ],
            "legend_items": [
                {"category": "plowing_zone", "label": "Plowing Zone", "color": "#3B82F6", "icon": "▭"}
            ]
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", site_map_data)
        if success and response.get("id"):
            self.test_data["map_id_1"] = response["id"]
            version = response.get("version", 0)
            is_current = response.get("is_current", False)
            
            # Verify version auto-increment and is_current flag
            if version == 1 and is_current:
                self.log_test("Create site map with annotations", True, 
                             f"Version: {version}, Current: {is_current}, ID: {response['id']}")
            else:
                self.log_test("Create site map with annotations", False, 
                             f"Version or current flag incorrect: v{version}, current={is_current}")
        else:
            self.log_test("Create site map with annotations", False, 
                         f"HTTP {status}: {response}")
        
        # Test 2: Verify version auto-increment works
        print("\n2️⃣ Testing version auto-increment")
        
        site_map_data_v2 = {
            "site_id": site_id,
            "name": "Test Map v2",
            "base_map_type": "google_maps",
            "base_map_data": "data:image/png;base64,test2",
            "base_map_url": "Test Location 2",
            "annotations": []
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", site_map_data_v2)
        if success and response.get("id"):
            self.test_data["map_id_2"] = response["id"]
            version = response.get("version", 0)
            is_current = response.get("is_current", False)
            
            if version == 2 and is_current:
                self.log_test("Version auto-increment", True, 
                             f"Version: {version}, Current: {is_current}")
            else:
                self.log_test("Version auto-increment", False, 
                             f"Expected version 2, got {version}")
        else:
            self.log_test("Version auto-increment", False, 
                         f"HTTP {status}: {response}")
        
        # Test 3: Test with empty annotations array
        print("\n3️⃣ Testing create with empty annotations")
        
        site_map_empty = {
            "site_id": site_id,
            "name": "Empty Annotations Map",
            "base_map_type": "uploaded_image",
            "annotations": []
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", site_map_empty)
        if success and response.get("id"):
            self.test_data["map_id_3"] = response["id"]
            self.log_test("Create with empty annotations", True, "Successfully created")
        else:
            self.log_test("Create with empty annotations", False, 
                         f"HTTP {status}: {response}")
    
    async def test_site_maps_get_by_site_api(self):
        """Test GET /api/site-maps/site/{site_id} - Get all maps for a site"""
        print("\n📋 Testing Site Maps Get by Site API...")
        
        site_id = self.test_data["site_id"]
        
        # Test 4: Get all maps without query parameters
        print("\n4️⃣ Testing GET /api/site-maps/site/{site_id} - All versions")
        
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}")
        if success and isinstance(response, list):
            count = len(response)
            if count >= 3:  # Should have at least 3 maps we created
                self.log_test("Get all maps for site", True, f"Found {count} maps")
            else:
                self.log_test("Get all maps for site", False, f"Expected >=3 maps, got {count}")
        else:
            self.log_test("Get all maps for site", False, 
                         f"HTTP {status}: {response}")
        
        # Test 5: Get with current_only=true
        print("\n5️⃣ Testing GET with current_only=true")
        
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": "true"})
        if success and isinstance(response, list):
            count = len(response)
            if count == 1 and response[0].get("is_current"):
                self.log_test("Get current only maps", True, f"Found 1 current map")
            else:
                self.log_test("Get current only maps", False, 
                             f"Expected 1 current map, got {count}")
        else:
            self.log_test("Get current only maps", False, 
                         f"HTTP {status}: {response}")
        
        # Test 6: Get with current_only=false
        print("\n6️⃣ Testing GET with current_only=false")
        
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": "false"})
        if success and isinstance(response, list):
            count = len(response)
            if count >= 3:
                self.log_test("Get all versions with current_only=false", True, f"Found {count} maps")
            else:
                self.log_test("Get all versions with current_only=false", False, 
                             f"Expected >=3 maps, got {count}")
        else:
            self.log_test("Get all versions with current_only=false", False, 
                         f"HTTP {status}: {response}")
        
        # Test 7: Verify sorting by version descending
        print("\n7️⃣ Testing sorting by version descending")
        
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}")
        if success and isinstance(response, list) and len(response) >= 2:
            versions = [m.get("version", 0) for m in response]
            is_sorted = all(versions[i] >= versions[i+1] for i in range(len(versions)-1))
            if is_sorted:
                self.log_test("Sorting by version descending", True, f"Versions: {versions}")
            else:
                self.log_test("Sorting by version descending", False, f"Not sorted: {versions}")
        else:
            self.log_test("Sorting by version descending", False, "Not enough maps to test sorting")
    
    async def test_site_maps_get_specific_api(self):
        """Test GET /api/site-maps/{map_id} - Get specific map"""
        print("\n🎯 Testing Site Maps Get Specific API...")
        
        # Test 8: Get specific map with valid ID
        print("\n8️⃣ Testing GET /api/site-maps/{map_id} - Valid ID")
        
        if "map_id_1" in self.test_data:
            map_id = self.test_data["map_id_1"]
            success, response, status = await self.make_request("GET", f"/site-maps/{map_id}")
            if success and response.get("id") == map_id:
                annotations_count = len(response.get("annotations", []))
                self.log_test("Get specific map by ID", True, 
                             f"Full map structure returned with {annotations_count} annotations")
            else:
                self.log_test("Get specific map by ID", False, "ID mismatch or missing data")
        else:
            self.log_test("Get specific map by ID", False, "No map ID available for testing")
        
        # Test 9: Get with invalid map_id (should return 404, not 500)
        print("\n9️⃣ Testing GET with invalid map_id")
        
        invalid_id = "invalid_map_id_123"
        success, response, status = await self.make_request("GET", f"/site-maps/{invalid_id}")
        if status == 404:
            self.log_test("Invalid map_id returns 404", True, "Proper error handling")
        elif status == 500:
            self.log_test("Invalid map_id returns 404", False, "Returns 500 instead of 404")
        else:
            self.log_test("Invalid map_id returns 404", False, 
                         f"Unexpected status: {status}")
    
    async def test_site_maps_update_api(self):
        """Test PUT /api/site-maps/{map_id} - Update map"""
        print("\n✏️ Testing Site Maps Update API...")
        
        if "map_id_1" not in self.test_data:
            self.log_test("Update tests skipped", False, "No map ID available")
            return
        
        map_id = self.test_data["map_id_1"]
        
        # Test 10: Update name only
        print("\n🔟 Testing PUT /api/site-maps/{map_id} - Update name")
        
        update_data = {"name": "Updated Test Map Name"}
        success, response, status = await self.make_request("PUT", f"/site-maps/{map_id}", update_data)
        if success and response.get("name") == "Updated Test Map Name":
            self.log_test("Update map name", True, "Name updated successfully")
        else:
            self.log_test("Update map name", False, f"HTTP {status}: {response}")
        
        # Test 11: Update annotations array
        print("\n1️⃣1️⃣ Testing PUT - Update annotations array")
        
        new_annotations = [
            {
                "id": "ann_updated",
                "type": "circle",
                "category": "fire_hydrant",
                "color": "#FF0000",
                "coordinates": [{"x": -114.0720, "y": 51.0448}],
                "properties": {"radius": 5}
            }
        ]
        update_data = {"annotations": new_annotations}
        success, response, status = await self.make_request("PUT", f"/site-maps/{map_id}", update_data)
        if success and len(response.get("annotations", [])) == 1:
            self.log_test("Update annotations array", True, "Annotations updated")
        else:
            self.log_test("Update annotations array", False, f"HTTP {status}: {response}")
        
        # Test 12: Verify updated_at timestamp changes
        print("\n1️⃣2️⃣ Testing updated_at timestamp changes")
        
        # Get current timestamp
        success1, response1, status1 = await self.make_request("GET", f"/site-maps/{map_id}")
        if success1:
            original_updated_at = response1.get("updated_at")
            
            # Update the map
            update_data = {"name": "Timestamp Test Map"}
            success2, response2, status2 = await self.make_request("PUT", f"/site-maps/{map_id}", update_data)
            if success2:
                new_updated_at = response2.get("updated_at")
                if new_updated_at != original_updated_at:
                    self.log_test("Updated_at timestamp changes", True, "Timestamp updated")
                else:
                    self.log_test("Updated_at timestamp changes", False, "Timestamp not changed")
            else:
                self.log_test("Updated_at timestamp changes", False, "Update failed")
        else:
            self.log_test("Updated_at timestamp changes", False, "Could not get original map")
    
    async def test_site_maps_set_current_api(self):
        """Test POST /api/site-maps/{map_id}/set-current - Set current version"""
        print("\n🎯 Testing Site Maps Set Current API...")
        
        if len([k for k in self.test_data.keys() if k.startswith("map_id_")]) < 2:
            self.log_test("Set current tests skipped", False, "Need at least 2 maps")
            return
        
        site_id = self.test_data["site_id"]
        map_id_1 = self.test_data["map_id_1"]
        
        # Test 13: Set current version
        print("\n1️⃣3️⃣ Testing POST /api/site-maps/{map_id}/set-current")
        
        success, response, status = await self.make_request("POST", f"/site-maps/{map_id_1}/set-current")
        if success:
            # Verify the change
            success_check, response_check, status_check = await self.make_request("GET", f"/site-maps/{map_id_1}")
            if success_check and response_check.get("is_current"):
                self.log_test("Set current version", True, "Version set as current")
            else:
                self.log_test("Set current version", False, "Version not set as current")
        else:
            self.log_test("Set current version", False, f"HTTP {status}: {response}")
        
        # Test 14: Verify previous current becomes false
        print("\n1️⃣4️⃣ Testing previous current becomes false")
        
        if "map_id_2" in self.test_data:
            map_id_2 = self.test_data["map_id_2"]
            success, response, status = await self.make_request("GET", f"/site-maps/{map_id_2}")
            if success:
                is_current = response.get("is_current")
                if not is_current:
                    self.log_test("Previous current becomes false", True, "Previous current updated")
                else:
                    self.log_test("Previous current becomes false", False, "Previous current still true")
            else:
                self.log_test("Previous current becomes false", False, f"HTTP {status}: {response}")
        
        # Test 15: Verify new current is true
        print("\n1️⃣5️⃣ Testing new current is true")
        
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": "true"})
        if success and isinstance(response, list) and len(response) == 1:
            current_map = response[0]
            if current_map.get("id") == map_id_1 and current_map.get("is_current"):
                self.log_test("Verify new current is true", True, "Correct map is current")
            else:
                self.log_test("Verify new current is true", False, "Wrong map is current")
        else:
            self.log_test("Verify new current is true", False, "Could not verify current map")
    
    async def test_site_maps_delete_api(self):
        """Test DELETE /api/site-maps/{map_id} - Delete map"""
        print("\n🗑️ Testing Site Maps Delete API...")
        
        if "map_id_3" not in self.test_data:
            self.log_test("Delete tests skipped", False, "No map ID available for deletion")
            return
        
        map_id = self.test_data["map_id_3"]
        
        # Test 16: Delete map
        print("\n1️⃣6️⃣ Testing DELETE /api/site-maps/{map_id}")
        
        success, response, status = await self.make_request("DELETE", f"/site-maps/{map_id}")
        if success:
            self.log_test("Delete site map", True, "Map deleted successfully")
            
            # Verify map is removed
            success_check, response_check, status_check = await self.make_request("GET", f"/site-maps/{map_id}")
            if status_check == 404:
                self.log_test("Verify map deletion", True, "Map correctly removed")
            else:
                self.log_test("Verify map deletion", False, f"Map still exists, status: {status_check}")
        else:
            self.log_test("Delete site map", False, f"HTTP {status}: {response}")
    
    async def test_error_handling(self):
        """Test error handling for invalid ObjectIds"""
        print("\n⚠️ Testing Error Handling...")
        
        # Test 17: ObjectId validation errors should return 404, not 500
        print("\n1️⃣7️⃣ Testing ObjectId validation error handling")
        
        invalid_ids = ["not_an_objectid", "123", "invalid_format"]
        
        for invalid_id in invalid_ids:
            # Test GET endpoint
            success, response, status = await self.make_request("GET", f"/site-maps/{invalid_id}")
            if status == 404:
                self.log_test(f"GET invalid ObjectId ({invalid_id}) returns 404", True, "Proper error handling")
            elif status == 500:
                self.log_test(f"GET invalid ObjectId ({invalid_id}) returns 404", False, "Returns 500 instead of 404")
            else:
                self.log_test(f"GET invalid ObjectId ({invalid_id}) returns 404", False, f"Unexpected status: {status}")
            
            # Test PUT endpoint
            update_data = {"name": "Test Update"}
            success, response, status = await self.make_request("PUT", f"/site-maps/{invalid_id}", update_data)
            if status == 404:
                self.log_test(f"PUT invalid ObjectId ({invalid_id}) returns 404", True, "Proper error handling")
            elif status == 500:
                self.log_test(f"PUT invalid ObjectId ({invalid_id}) returns 404", False, "Returns 500 instead of 404")
            else:
                self.log_test(f"PUT invalid ObjectId ({invalid_id}) returns 404", False, f"Unexpected status: {status}")
            
            # Test POST set-current endpoint
            success, response, status = await self.make_request("POST", f"/site-maps/{invalid_id}/set-current")
            if status == 404:
                self.log_test(f"POST set-current invalid ObjectId ({invalid_id}) returns 404", True, "Proper error handling")
            elif status == 500:
                self.log_test(f"POST set-current invalid ObjectId ({invalid_id}) returns 404", False, "Returns 500 instead of 404")
            else:
                self.log_test(f"POST set-current invalid ObjectId ({invalid_id}) returns 404", False, f"Unexpected status: {status}")
            
            # Test DELETE endpoint
            success, response, status = await self.make_request("DELETE", f"/site-maps/{invalid_id}")
            if status == 404:
                self.log_test(f"DELETE invalid ObjectId ({invalid_id}) returns 404", True, "Proper error handling")
            elif status == 500:
                self.log_test(f"DELETE invalid ObjectId ({invalid_id}) returns 404", False, "Returns 500 instead of 404")
            else:
                self.log_test(f"DELETE invalid ObjectId ({invalid_id}) returns 404", False, f"Unexpected status: {status}")
    
    async def test_annotation_model_flexibility(self):
        """Test annotation model accepts flexible coordinate structures"""
        print("\n🔧 Testing Annotation Model Flexibility...")
        
        site_id = self.test_data["site_id"]
        
        # Test 18: Flexible coordinate structures
        print("\n1️⃣8️⃣ Testing flexible coordinate structures")
        
        flexible_map_data = {
            "site_id": site_id,
            "name": "Flexible Coordinates Test",
            "base_map_type": "google_maps",
            "annotations": [
                {
                    "id": "flex_1",
                    "type": "polygon",
                    "category": "custom",
                    "coordinates": [
                        {"x": 1.0, "y": 2.0},
                        {"x": 3.0, "y": 4.0},
                        {"x": 5.0, "y": 6.0}
                    ],
                    "properties": {
                        "strokeWeight": 3,
                        "fillOpacity": 0.5,
                        "custom_field": "test_value"
                    }
                },
                {
                    "id": "flex_2",
                    "type": "polyline",
                    "category": "custom",
                    "coordinates": [
                        {"lat": 51.0447, "lng": -114.0719},
                        {"lat": 51.0448, "lng": -114.0720}
                    ],
                    "properties": {"strokeWeight": 2}
                }
            ]
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", flexible_map_data)
        if success and response.get("id"):
            self.test_data["flexible_map_id"] = response["id"]
            
            # Check if annotation structure is preserved
            annotations = response.get("annotations", [])
            if len(annotations) >= 2:
                first_annotation = annotations[0]
                custom_field = first_annotation.get("properties", {}).get("custom_field")
                if custom_field == "test_value":
                    self.log_test("Flexible coordinate structures", True, "Custom fields and coordinates preserved")
                else:
                    self.log_test("Flexible coordinate structures", False, "Custom fields not preserved")
            else:
                self.log_test("Flexible coordinate structures", False, "Annotations not preserved")
        else:
            self.log_test("Flexible coordinate structures", False, f"HTTP {status}: {response}")
    
    async def test_boolean_parameter_parsing(self):
        """Test boolean parameter parsing for current_only"""
        print("\n🔢 Testing Boolean Parameter Parsing...")
        
        site_id = self.test_data["site_id"]
        
        # Test 19: Boolean parameter parsing
        print("\n1️⃣9️⃣ Testing boolean parameter parsing")
        
        # Test with boolean true
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": True})
        if success:
            self.log_test("Boolean parameter (True) parsing", True, "Successfully parsed boolean True")
        else:
            self.log_test("Boolean parameter (True) parsing", False, f"HTTP {status}: {response}")
        
        # Test with boolean false
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": False})
        if success:
            self.log_test("Boolean parameter (False) parsing", True, "Successfully parsed boolean False")
        else:
            self.log_test("Boolean parameter (False) parsing", False, f"HTTP {status}: {response}")
        
        # Test with string "true"
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": "true"})
        if success:
            self.log_test("String parameter ('true') parsing", True, "Successfully parsed string 'true'")
        else:
            self.log_test("String parameter ('true') parsing", False, f"HTTP {status}: {response}")
        
        # Test with string "false"
        success, response, status = await self.make_request("GET", f"/site-maps/site/{site_id}", 
                                                           params={"current_only": "false"})
        if success:
            self.log_test("String parameter ('false') parsing", True, "Successfully parsed string 'false'")
        else:
            self.log_test("String parameter ('false') parsing", False, f"HTTP {status}: {response}")
    
    async def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test maps
        for key in list(self.test_data.keys()):
            if key.startswith("map_id_") or key == "flexible_map_id":
                map_id = self.test_data[key]
                try:
                    await self.make_request("DELETE", f"/site-maps/{map_id}")
                    print(f"✅ Deleted map: {map_id}")
                except:
                    print(f"⚠️ Could not delete map: {map_id}")
        
        # Delete test site
        if "site_id" in self.test_data:
            try:
                await self.make_request("DELETE", f"/sites/{self.test_data['site_id']}")
                print(f"✅ Deleted site: {self.test_data['site_id']}")
            except:
                print(f"⚠️ Could not delete site: {self.test_data['site_id']}")
        
        # Delete test customer
        if "customer_id" in self.test_data:
            try:
                await self.make_request("DELETE", f"/customers/{self.test_data['customer_id']}")
                print(f"✅ Deleted customer: {self.test_data['customer_id']}")
            except:
                print(f"⚠️ Could not delete customer: {self.test_data['customer_id']}")
    
    async def run_all_tests(self):
        """Run all Site Maps API tests"""
        print("🚀 Starting Site Maps API Re-Testing After Fixes")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Setup test data
        if not await self.setup_test_data():
            print("❌ Failed to setup test data. Aborting tests.")
            return
        
        try:
            # Run all test suites
            await self.test_site_maps_create_api()
            await self.test_site_maps_get_by_site_api()
            await self.test_site_maps_get_specific_api()
            await self.test_site_maps_update_api()
            await self.test_site_maps_set_current_api()
            await self.test_site_maps_delete_api()
            await self.test_error_handling()
            await self.test_annotation_model_flexibility()
            await self.test_boolean_parameter_parsing()
        finally:
            # Always cleanup
            await self.cleanup_test_data()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*80)
        print("📊 SITE MAPS API TEST RESULTS SUMMARY")
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
            print("🎉 EXCELLENT: Site Maps APIs working correctly after fixes!")
        elif success_rate >= 75:
            print("✅ GOOD: Most Site Maps APIs working with minor issues")
        elif success_rate >= 50:
            print("⚠️ WARNING: Significant issues detected in Site Maps APIs")
        else:
            print("🚨 CRITICAL: Major Site Maps API failures detected")
        
        return success_rate >= 75  # Return True if mostly working

async def main():
    """Main test runner"""
    async with SiteMapsAPITester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())