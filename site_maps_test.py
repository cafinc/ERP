#!/usr/bin/env python3
"""
Site Maps Backend Testing Suite
Tests the newly implemented Site Maps annotation feature endpoints.
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import sys
import traceback

# Backend URL from frontend environment
BACKEND_URL = "https://client-hub-48.preview.emergentagent.com/api"

class SiteMapsTestSuite:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.test_site_id = None
        self.test_customer_id = None
        self.created_map_ids = []
        
    async def setup_session(self):
        """Setup HTTP session for testing"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            
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
        
    async def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BACKEND_URL}{endpoint}"
            
            if method.upper() == "GET":
                async with self.session.get(url, params=params) as response:
                    response_data = await response.json()
                    return response.status < 400, response_data, response.status
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, params=params) as response:
                    response_data = await response.json()
                    return response.status < 400, response_data, response.status
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, params=params) as response:
                    response_data = await response.json()
                    return response.status < 400, response_data, response.status
            elif method.upper() == "DELETE":
                async with self.session.delete(url, params=params) as response:
                    response_data = await response.json()
                    return response.status < 400, response_data, response.status
                    
        except Exception as e:
            return False, {"error": str(e)}, 500
            
    async def setup_test_data(self):
        """Create test customer and site for testing"""
        print("🔧 Setting up test data (customer and site)...")
        
        # Create test customer
        customer_data = {
            "name": "Site Maps Test Customer",
            "email": "sitemaps.test@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street, Test City, TC 12345",
            "customer_type": "commercial"
        }
        
        success, response, status = await self.make_request("POST", "/customers", customer_data)
        if success and "id" in response:
            self.test_customer_id = response["id"]
            print(f"   ✅ Created test customer: {self.test_customer_id}")
        else:
            print(f"   ❌ Failed to create test customer: {response}")
            return False
            
        # Create test site
        site_data = {
            "customer_id": self.test_customer_id,
            "name": "Test Site for Maps",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "456 Site Avenue, Test City, TC 12345"
            },
            "site_type": "commercial"
        }
        
        success, response, status = await self.make_request("POST", "/sites", site_data)
        if success and "id" in response:
            self.test_site_id = response["id"]
            print(f"   ✅ Created test site: {self.test_site_id}")
            return True
        else:
            print(f"   ❌ Failed to create test site: {response}")
            return False
            
    async def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        # Delete created site maps
        for map_id in self.created_map_ids:
            try:
                await self.make_request("DELETE", f"/site-maps/{map_id}")
                print(f"   ✅ Deleted site map: {map_id}")
            except:
                pass
                
        # Delete test site
        if self.test_site_id:
            try:
                await self.make_request("DELETE", f"/sites/{self.test_site_id}")
                print(f"   ✅ Deleted test site: {self.test_site_id}")
            except:
                pass
                
        # Delete test customer
        if self.test_customer_id:
            try:
                await self.make_request("DELETE", f"/customers/{self.test_customer_id}")
                print(f"   ✅ Deleted test customer: {self.test_customer_id}")
            except:
                pass
                
    async def test_create_site_map(self):
        """Test POST /api/site-maps - Create a new site map with annotations"""
        print("📍 Testing Create Site Map Endpoint...")
        
        # Test 1: Create site map with basic annotations
        site_map_data = {
            "site_id": self.test_site_id,
            "name": "Winter 2024 Layout",
            "base_map_type": "google_maps",
            "base_map_url": "123 Test Street, Test City",
            "annotations": [
                {
                    "id": "ann_001",
                    "type": "icon",
                    "category": "fire_hydrant",
                    "label": "Fire Hydrant #1",
                    "color": "#FF0000",
                    "coordinates": [{"x": 100, "y": 150}],
                    "properties": {"icon_type": "fire_hydrant"}
                },
                {
                    "id": "ann_002", 
                    "type": "rectangle",
                    "category": "plowing_zone",
                    "label": "Main Parking Area",
                    "color": "#00FF00",
                    "coordinates": [{"x": 50, "y": 50}, {"x": 200, "y": 150}],
                    "properties": {"fill": True, "stroke_width": 2}
                },
                {
                    "id": "ann_003",
                    "type": "line",
                    "category": "sidewalk",
                    "label": "Main Walkway",
                    "color": "#0000FF",
                    "coordinates": [{"x": 0, "y": 200}, {"x": 250, "y": 200}],
                    "properties": {"stroke_width": 3}
                }
            ],
            "legend_items": [
                {"category": "fire_hydrant", "label": "Fire Hydrants", "color": "#FF0000", "icon": "fire"},
                {"category": "plowing_zone", "label": "Plowing Zones", "color": "#00FF00", "icon": "rectangle"},
                {"category": "sidewalk", "label": "Sidewalks", "color": "#0000FF", "icon": "line"}
            ],
            "created_by": "test_user"
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", site_map_data)
        
        if success and "id" in response:
            map_id = response["id"]
            self.created_map_ids.append(map_id)
            
            # Validate response structure
            required_fields = ["id", "site_id", "version", "name", "base_map_type", "annotations", "is_current", "created_at"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test(
                    "Create site map with annotations",
                    True,
                    f"Created map ID: {map_id}, Version: {response.get('version')}, Annotations: {len(response.get('annotations', []))}"
                )
                
                # Validate version number (should be 1 for first map)
                version_correct = response.get("version") == 1
                self.log_test(
                    "Version number assignment (first map)",
                    version_correct,
                    f"Expected version 1, got {response.get('version')}"
                )
                
                # Validate is_current flag (should be True for new map)
                is_current_correct = response.get("is_current") == True
                self.log_test(
                    "Current flag assignment (new map)",
                    is_current_correct,
                    f"Expected is_current=True, got {response.get('is_current')}"
                )
                
                # Validate annotations preservation
                annotations_preserved = len(response.get("annotations", [])) == 3
                self.log_test(
                    "Annotations preservation",
                    annotations_preserved,
                    f"Expected 3 annotations, got {len(response.get('annotations', []))}"
                )
                
            else:
                self.log_test(
                    "Create site map response structure",
                    False,
                    f"Missing fields: {missing_fields}",
                    response
                )
        else:
            self.log_test(
                "Create site map with annotations",
                False,
                f"Failed to create site map, Status: {status}",
                response
            )
            
        # Test 2: Create second version of site map
        site_map_data_v2 = {
            "site_id": self.test_site_id,
            "name": "Updated Winter Layout",
            "base_map_type": "google_maps",
            "base_map_url": "123 Test Street, Test City",
            "annotations": [
                {
                    "id": "ann_004",
                    "type": "circle",
                    "category": "drain",
                    "label": "Storm Drain",
                    "color": "#FFFF00",
                    "coordinates": [{"x": 75, "y": 75}],
                    "properties": {"radius": 10}
                }
            ],
            "created_by": "test_user"
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", site_map_data_v2)
        
        if success and "id" in response:
            map_id_v2 = response["id"]
            self.created_map_ids.append(map_id_v2)
            
            # Validate version increment
            version_correct = response.get("version") == 2
            self.log_test(
                "Version number increment (second map)",
                version_correct,
                f"Expected version 2, got {response.get('version')}"
            )
            
            # Validate new map is current
            is_current_correct = response.get("is_current") == True
            self.log_test(
                "Current flag for new version",
                is_current_correct,
                f"New version should be current: {response.get('is_current')}"
            )
        else:
            self.log_test(
                "Create second version of site map",
                False,
                f"Failed to create second version, Status: {status}",
                response
            )
            
        # Test 3: Create site map with invalid site_id
        invalid_site_map = {
            "site_id": "invalid_site_id_12345",
            "name": "Invalid Site Map",
            "base_map_type": "google_maps"
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", invalid_site_map)
        
        # Should fail with 404 or 400
        expected_failure = status >= 400
        self.log_test(
            "Create site map with invalid site_id",
            expected_failure,
            f"Expected error status, got {status}: {response.get('detail', 'No error message')}"
        )
        
    async def test_get_site_maps_by_site(self):
        """Test GET /api/site-maps/site/{site_id} - Get all site maps for a specific site"""
        print("📋 Testing Get Site Maps by Site Endpoint...")
        
        # Test 1: Get all site maps for the test site
        success, response, status = await self.make_request("GET", f"/site-maps/site/{self.test_site_id}")
        
        if success and isinstance(response, list):
            self.log_test(
                "Get all site maps for site",
                True,
                f"Retrieved {len(response)} site maps, Status: {status}"
            )
            
            # Validate maps are sorted by version (descending)
            if len(response) > 1:
                versions = [map_data.get("version", 0) for map_data in response]
                is_sorted = all(versions[i] >= versions[i+1] for i in range(len(versions)-1))
                self.log_test(
                    "Site maps sorting by version",
                    is_sorted,
                    f"Versions: {versions}, Sorted descending: {is_sorted}"
                )
                
            # Validate only one map is marked as current
            current_maps = [map_data for map_data in response if map_data.get("is_current")]
            only_one_current = len(current_maps) == 1
            self.log_test(
                "Only one current map per site",
                only_one_current,
                f"Found {len(current_maps)} current maps (should be 1)"
            )
            
        else:
            self.log_test(
                "Get all site maps for site",
                False,
                f"Failed to get site maps, Status: {status}",
                response
            )
            
        # Test 2: Get only current site map
        success, response, status = await self.make_request(
            "GET", 
            f"/site-maps/site/{self.test_site_id}",
            params={"current_only": "true"}
        )
        
        if success and isinstance(response, list):
            current_only_correct = len(response) <= 1
            self.log_test(
                "Get current site map only",
                current_only_correct,
                f"Retrieved {len(response)} maps with current_only=True (should be 0 or 1)"
            )
            
            # If there's a current map, validate it's marked as current
            if response:
                is_current = response[0].get("is_current")
                self.log_test(
                    "Current map flag validation",
                    is_current == True,
                    f"Current map is_current flag: {is_current}"
                )
        else:
            self.log_test(
                "Get current site map only",
                False,
                f"Failed to get current site map, Status: {status}",
                response
            )
            
        # Test 3: Get site maps for non-existent site
        success, response, status = await self.make_request("GET", "/site-maps/site/nonexistent_site_id")
        
        # Should return empty list, not error
        empty_result = success and isinstance(response, list) and len(response) == 0
        self.log_test(
            "Get site maps for non-existent site",
            empty_result,
            f"Expected empty list, got: {len(response) if isinstance(response, list) else 'not a list'}"
        )
        
    async def test_get_specific_site_map(self):
        """Test GET /api/site-maps/{map_id} - Get a specific site map by ID"""
        print("🔍 Testing Get Specific Site Map Endpoint...")
        
        if not self.created_map_ids:
            self.log_test(
                "Get specific site map (no test data)",
                False,
                "No site maps created in previous tests"
            )
            return
            
        # Test 1: Get existing site map
        map_id = self.created_map_ids[0]
        success, response, status = await self.make_request("GET", f"/site-maps/{map_id}")
        
        if success and "id" in response:
            self.log_test(
                "Get specific site map by ID",
                True,
                f"Retrieved map ID: {response.get('id')}, Name: {response.get('name')}"
            )
            
            # Validate response structure
            required_fields = ["id", "site_id", "version", "name", "annotations", "is_current"]
            missing_fields = [field for field in required_fields if field not in response]
            
            self.log_test(
                "Specific site map response structure",
                len(missing_fields) == 0,
                f"Missing fields: {missing_fields}" if missing_fields else "All required fields present"
            )
            
            # Validate annotations structure
            annotations = response.get("annotations", [])
            if annotations:
                sample_annotation = annotations[0]
                annotation_fields = ["id", "type", "coordinates"]
                missing_ann_fields = [field for field in annotation_fields if field not in sample_annotation]
                
                self.log_test(
                    "Annotation structure validation",
                    len(missing_ann_fields) == 0,
                    f"Annotation missing fields: {missing_ann_fields}" if missing_ann_fields else "Annotation structure valid"
                )
        else:
            self.log_test(
                "Get specific site map by ID",
                False,
                f"Failed to get site map, Status: {status}",
                response
            )
            
        # Test 2: Get non-existent site map
        success, response, status = await self.make_request("GET", "/site-maps/nonexistent_map_id")
        
        # Should return 404
        expected_error = status == 404
        self.log_test(
            "Get non-existent site map",
            expected_error,
            f"Expected 404, got {status}: {response.get('detail', 'No error message')}"
        )
        
    async def test_update_site_map(self):
        """Test PUT /api/site-maps/{map_id} - Update a site map"""
        print("✏️ Testing Update Site Map Endpoint...")
        
        if not self.created_map_ids:
            self.log_test(
                "Update site map (no test data)",
                False,
                "No site maps created in previous tests"
            )
            return
            
        # Test 1: Update site map name and annotations
        map_id = self.created_map_ids[0]
        update_data = {
            "name": "Updated Winter Layout - Modified",
            "annotations": [
                {
                    "id": "ann_updated_001",
                    "type": "icon",
                    "category": "entrance",
                    "label": "Main Entrance",
                    "color": "#FF00FF",
                    "coordinates": [{"x": 125, "y": 175}],
                    "properties": {"icon_type": "entrance"}
                },
                {
                    "id": "ann_updated_002",
                    "type": "polygon",
                    "category": "custom",
                    "label": "Special Zone",
                    "color": "#00FFFF",
                    "coordinates": [
                        {"x": 10, "y": 10},
                        {"x": 50, "y": 10},
                        {"x": 50, "y": 50},
                        {"x": 10, "y": 50}
                    ],
                    "properties": {"fill": True}
                }
            ]
        }
        
        success, response, status = await self.make_request("PUT", f"/site-maps/{map_id}", update_data)
        
        if success and "id" in response:
            self.log_test(
                "Update site map name and annotations",
                True,
                f"Updated map ID: {response.get('id')}, New name: {response.get('name')}"
            )
            
            # Validate name was updated
            name_updated = response.get("name") == "Updated Winter Layout - Modified"
            self.log_test(
                "Site map name update",
                name_updated,
                f"Expected 'Updated Winter Layout - Modified', got '{response.get('name')}'"
            )
            
            # Validate annotations were updated
            annotations_updated = len(response.get("annotations", [])) == 2
            self.log_test(
                "Site map annotations update",
                annotations_updated,
                f"Expected 2 annotations, got {len(response.get('annotations', []))}"
            )
            
            # Validate updated_at timestamp was changed
            has_updated_at = "updated_at" in response
            self.log_test(
                "Updated timestamp presence",
                has_updated_at,
                f"updated_at field present: {has_updated_at}"
            )
            
        else:
            self.log_test(
                "Update site map name and annotations",
                False,
                f"Failed to update site map, Status: {status}",
                response
            )
            
        # Test 2: Update with empty data (should fail)
        success, response, status = await self.make_request("PUT", f"/site-maps/{map_id}", {})
        
        # Should return 400 error for no data
        expected_error = status == 400
        self.log_test(
            "Update site map with empty data",
            expected_error,
            f"Expected 400 error, got {status}: {response.get('detail', 'No error message')}"
        )
        
        # Test 3: Update non-existent site map
        success, response, status = await self.make_request(
            "PUT", 
            "/site-maps/nonexistent_map_id",
            {"name": "Should Fail"}
        )
        
        # Should return 404
        expected_error = status == 404
        self.log_test(
            "Update non-existent site map",
            expected_error,
            f"Expected 404, got {status}: {response.get('detail', 'No error message')}"
        )
        
    async def test_set_current_site_map(self):
        """Test POST /api/site-maps/{map_id}/set-current - Set a specific map version as current"""
        print("🎯 Testing Set Current Site Map Endpoint...")
        
        if len(self.created_map_ids) < 2:
            self.log_test(
                "Set current site map (insufficient test data)",
                False,
                "Need at least 2 site maps for this test"
            )
            return
            
        # Test 1: Set first map as current (should change from second map)
        first_map_id = self.created_map_ids[0]
        success, response, status = await self.make_request("POST", f"/site-maps/{first_map_id}/set-current")
        
        if success:
            self.log_test(
                "Set first map as current",
                True,
                f"Successfully set map {first_map_id} as current, Status: {status}"
            )
            
            # Verify the change by getting all maps for the site
            success_verify, maps_response, _ = await self.make_request("GET", f"/site-maps/site/{self.test_site_id}")
            
            if success_verify and isinstance(maps_response, list):
                # Find which map is current
                current_maps = [m for m in maps_response if m.get("is_current")]
                current_map_id = current_maps[0].get("id") if current_maps else None
                
                current_correct = current_map_id == first_map_id
                self.log_test(
                    "Verify current map change",
                    current_correct,
                    f"Expected current map: {first_map_id}, actual: {current_map_id}"
                )
                
                # Verify only one map is current
                only_one_current = len(current_maps) == 1
                self.log_test(
                    "Only one current map after change",
                    only_one_current,
                    f"Found {len(current_maps)} current maps (should be 1)"
                )
        else:
            self.log_test(
                "Set first map as current",
                False,
                f"Failed to set current map, Status: {status}",
                response
            )
            
        # Test 2: Set second map as current
        second_map_id = self.created_map_ids[1]
        success, response, status = await self.make_request("POST", f"/site-maps/{second_map_id}/set-current")
        
        self.log_test(
            "Set second map as current",
            success,
            f"Set map {second_map_id} as current, Status: {status}"
        )
        
        # Test 3: Set non-existent map as current
        success, response, status = await self.make_request("POST", "/site-maps/nonexistent_map_id/set-current")
        
        # Should return 404
        expected_error = status == 404
        self.log_test(
            "Set non-existent map as current",
            expected_error,
            f"Expected 404, got {status}: {response.get('detail', 'No error message')}"
        )
        
    async def test_delete_site_map(self):
        """Test DELETE /api/site-maps/{map_id} - Delete a site map"""
        print("🗑️ Testing Delete Site Map Endpoint...")
        
        if not self.created_map_ids:
            self.log_test(
                "Delete site map (no test data)",
                False,
                "No site maps created in previous tests"
            )
            return
            
        # Test 1: Delete existing site map
        map_to_delete = self.created_map_ids[-1]  # Delete the last one
        success, response, status = await self.make_request("DELETE", f"/site-maps/{map_to_delete}")
        
        if success:
            self.log_test(
                "Delete existing site map",
                True,
                f"Successfully deleted map {map_to_delete}, Status: {status}"
            )
            
            # Remove from our tracking list
            self.created_map_ids.remove(map_to_delete)
            
            # Verify deletion by trying to get the deleted map
            success_verify, verify_response, verify_status = await self.make_request("GET", f"/site-maps/{map_to_delete}")
            
            deletion_verified = verify_status == 404
            self.log_test(
                "Verify site map deletion",
                deletion_verified,
                f"Deleted map should return 404, got {verify_status}"
            )
        else:
            self.log_test(
                "Delete existing site map",
                False,
                f"Failed to delete site map, Status: {status}",
                response
            )
            
        # Test 2: Delete non-existent site map
        success, response, status = await self.make_request("DELETE", "/site-maps/nonexistent_map_id")
        
        # Should return 404
        expected_error = status == 404
        self.log_test(
            "Delete non-existent site map",
            expected_error,
            f"Expected 404, got {status}: {response.get('detail', 'No error message')}"
        )
        
    async def test_error_handling_and_edge_cases(self):
        """Test error handling and edge cases"""
        print("🚨 Testing Error Handling and Edge Cases...")
        
        # Test 1: Create site map with malformed annotations
        malformed_site_map = {
            "site_id": self.test_site_id,
            "name": "Malformed Annotations Test",
            "base_map_type": "google_maps",
            "annotations": [
                {
                    "id": "bad_ann_001",
                    "type": "invalid_type",
                    # Missing required coordinates
                    "color": "#FF0000"
                }
            ]
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", malformed_site_map)
        
        # Should handle gracefully (either accept or reject with proper error)
        handled_gracefully = status < 500  # Should not crash the server
        self.log_test(
            "Handle malformed annotations",
            handled_gracefully,
            f"Server handled malformed data gracefully, Status: {status}"
        )
        
        # Test 2: Create site map with very large annotation data
        large_annotation_data = {
            "site_id": self.test_site_id,
            "name": "Large Annotation Test",
            "base_map_type": "google_maps",
            "annotations": [
                {
                    "id": f"large_ann_{i}",
                    "type": "circle",
                    "coordinates": [{"x": i * 10, "y": i * 10}],
                    "properties": {"description": "A" * 1000}  # Large description
                } for i in range(100)  # 100 annotations
            ]
        }
        
        success, response, status = await self.make_request("POST", "/site-maps", large_annotation_data)
        
        # Should handle large data gracefully
        handled_large_data = status < 500
        self.log_test(
            "Handle large annotation dataset",
            handled_large_data,
            f"Server handled large dataset, Status: {status}, Success: {success}"
        )
        
        if success and "id" in response:
            self.created_map_ids.append(response["id"])
            
        # Test 3: Get site maps with invalid site ID format
        success, response, status = await self.make_request("GET", "/site-maps/site/invalid-id-format-!@#$%")
        
        # Should return empty list or proper error, not crash
        handled_invalid_id = status < 500
        self.log_test(
            "Handle invalid site ID format",
            handled_invalid_id,
            f"Server handled invalid ID format, Status: {status}"
        )
        
    async def run_all_tests(self):
        """Run all site maps tests"""
        print("🚀 Starting Site Maps Backend Testing Suite")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Setup test data
            setup_success = await self.setup_test_data()
            if not setup_success:
                print("❌ Failed to setup test data. Aborting tests.")
                return 0, 1
                
            # Run all test suites
            await self.test_create_site_map()
            await self.test_get_site_maps_by_site()
            await self.test_get_specific_site_map()
            await self.test_update_site_map()
            await self.test_set_current_site_map()
            await self.test_delete_site_map()
            await self.test_error_handling_and_edge_cases()
            
        except Exception as e:
            print(f"❌ Test suite error: {str(e)}")
            traceback.print_exc()
        finally:
            # Cleanup test data
            await self.cleanup_test_data()
            await self.cleanup_session()
            
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests / self.total_tests * 100):.1f}%" if self.total_tests > 0 else "0%")
        
        if self.total_tests - self.passed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
        
        print("\n✅ SITE MAPS TESTING COMPLETED")
        return self.passed_tests, self.total_tests

async def main():
    """Main test runner"""
    test_suite = SiteMapsTestSuite()
    passed, total = await test_suite.run_all_tests()
    
    # Exit with appropriate code
    if passed == total:
        sys.exit(0)  # All tests passed
    else:
        sys.exit(1)  # Some tests failed

if __name__ == "__main__":
    asyncio.run(main())