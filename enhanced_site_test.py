#!/usr/bin/env python3
"""
Enhanced Site Management System Backend Testing
Testing enhanced site fields, services configuration, and manual coordinates support
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://asset-admin-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class EnhancedSiteTestSuite:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.created_resources = {
            'customers': [],
            'sites': [],
            'services': []
        }
    
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
    
    async def cleanup_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response': response_data
        })
    
    async def create_test_customer(self) -> str:
        """Create a test customer for site testing"""
        customer_data = {
            "name": "Enhanced Site Test Customer",
            "email": "enhanced.site.test@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street, Toronto, ON",
            "avatar": "business_avatar"
        }
        
        async with self.session.post(f"{API_BASE}/customers", json=customer_data) as response:
            if response.status == 200:
                data = await response.json()
                customer_id = data['id']
                self.created_resources['customers'].append(customer_id)
                self.log_test("Create Test Customer", True, f"Customer ID: {customer_id}")
                return customer_id
            else:
                error_text = await response.text()
                self.log_test("Create Test Customer", False, f"Status: {response.status}", error_text)
                return None
    
    async def create_test_service(self) -> str:
        """Create a test service for site services configuration"""
        service_data = {
            "name": "Enhanced Plowing Service",
            "service_type": "plowing",
            "description": "Professional snow plowing service",
            "pricing": {
                "per_occurrence": 150.00,
                "hourly": 125.00
            },
            "active": True
        }
        
        async with self.session.post(f"{API_BASE}/services", json=service_data) as response:
            if response.status == 200:
                data = await response.json()
                service_id = data['id']
                self.created_resources['services'].append(service_id)
                self.log_test("Create Test Service", True, f"Service ID: {service_id}")
                return service_id
            else:
                error_text = await response.text()
                self.log_test("Create Test Service", False, f"Status: {response.status}", error_text)
                return None
    
    async def test_scenario_1_create_site_with_all_fields(self, customer_id: str, service_id: str):
        """Test Scenario 1: Create Site with All Enhanced Fields"""
        print("\n=== SCENARIO 1: Create Site with All Enhanced Fields ===")
        
        site_data = {
            "name": "Enhanced Test Site",
            "site_reference": "SITE-ENH-001",
            "customer_id": customer_id,
            "site_type": "parking_lot",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "123 Enhanced Test St, Toronto, ON"
            },
            "area_size": 5000,
            "notes": "Legacy notes field for backward compatibility",
            "internal_notes": "Admin only note - billing code ABC123",
            "crew_notes": "Gate code: 1234, watch for ice patches in northeast corner",
            "services": [
                {
                    "service_id": service_id,
                    "service_name": "Enhanced Plowing",
                    "service_type": "plowing",
                    "unit_type": "per_occurrence",
                    "cost": 150.00,
                    "notes": "Priority site - complete within 2 hours"
                }
            ]
        }
        
        async with self.session.post(f"{API_BASE}/sites", json=site_data) as response:
            if response.status == 200:
                data = await response.json()
                site_id = data['id']
                self.created_resources['sites'].append(site_id)
                
                # Verify all fields are present
                success = True
                missing_fields = []
                
                # Check enhanced fields
                if data.get('site_reference') != "SITE-ENH-001":
                    missing_fields.append('site_reference')
                    success = False
                
                if data.get('internal_notes') != "Admin only note - billing code ABC123":
                    missing_fields.append('internal_notes')
                    success = False
                
                if data.get('crew_notes') != "Gate code: 1234, watch for ice patches in northeast corner":
                    missing_fields.append('crew_notes')
                    success = False
                
                # Check backward compatibility - old notes field
                if data.get('notes') != "Legacy notes field for backward compatibility":
                    missing_fields.append('notes (backward compatibility)')
                    success = False
                
                # Check services array
                services = data.get('services', [])
                if not services or len(services) != 1:
                    missing_fields.append('services array')
                    success = False
                elif services[0].get('service_id') != service_id:
                    missing_fields.append('service_id in services')
                    success = False
                elif services[0].get('unit_type') != 'per_occurrence':
                    missing_fields.append('unit_type in services')
                    success = False
                elif services[0].get('cost') != 150.00:
                    missing_fields.append('cost in services')
                    success = False
                
                details = f"Site ID: {site_id}"
                if missing_fields:
                    details += f", Missing/incorrect fields: {', '.join(missing_fields)}"
                
                self.log_test("Create Site with Enhanced Fields", success, details)
                return site_id if success else None
            else:
                error_text = await response.text()
                self.log_test("Create Site with Enhanced Fields", False, f"Status: {response.status}", error_text)
                return None
    
    async def test_scenario_2_update_site_services(self, site_id: str, service_id: str):
        """Test Scenario 2: Update Site Services Configuration"""
        print("\n=== SCENARIO 2: Update Site Services Configuration ===")
        
        # Create a second service for testing multiple services
        service_data_2 = {
            "name": "Enhanced Salting Service",
            "service_type": "salting",
            "description": "Professional road salt application",
            "pricing": {
                "per_yard": 50.00
            },
            "active": True
        }
        
        async with self.session.post(f"{API_BASE}/services", json=service_data_2) as response:
            if response.status == 200:
                service_2_data = await response.json()
                service_id_2 = service_2_data['id']
                self.created_resources['services'].append(service_id_2)
            else:
                service_id_2 = service_id  # Fallback to original service
        
        # Update site with multiple services
        update_data = {
            "services": [
                {
                    "service_id": service_id,
                    "service_name": "Enhanced Plowing Updated",
                    "service_type": "plowing",
                    "unit_type": "hourly",
                    "cost": 125.00,
                    "notes": "Updated pricing model"
                },
                {
                    "service_id": service_id_2,
                    "service_name": "Enhanced Salting",
                    "service_type": "salting",
                    "unit_type": "per_yard",
                    "cost": 50.00,
                    "notes": "Apply after plowing"
                }
            ]
        }
        
        async with self.session.put(f"{API_BASE}/sites/{site_id}", json=update_data) as response:
            if response.status == 200:
                data = await response.json()
                
                # Verify services update
                services = data.get('services', [])
                success = len(services) == 2
                
                if success:
                    # Check first service update
                    service_1 = next((s for s in services if s['service_id'] == service_id), None)
                    if not service_1 or service_1.get('unit_type') != 'hourly' or service_1.get('cost') != 125.00:
                        success = False
                    
                    # Check second service
                    service_2 = next((s for s in services if s['service_id'] == service_id_2), None)
                    if not service_2 or service_2.get('unit_type') != 'per_yard' or service_2.get('cost') != 50.00:
                        success = False
                
                details = f"Updated {len(services)} services"
                self.log_test("Update Site Services", success, details)
                return success
            else:
                error_text = await response.text()
                self.log_test("Update Site Services", False, f"Status: {response.status}", error_text)
                return False
    
    async def test_scenario_3_manual_coordinates(self, customer_id: str):
        """Test Scenario 3: Manual Coordinates (No Address)"""
        print("\n=== SCENARIO 3: Manual Coordinates Support ===")
        
        site_data = {
            "name": "Remote GPS Site",
            "site_reference": "SITE-GPS-001",
            "customer_id": customer_id,
            "site_type": "roadway",
            "location": {
                "latitude": 45.4215,
                "longitude": -75.6972,
                "address": "45.4215, -75.6972"  # Coordinates as address
            },
            "area_size": 2000,
            "internal_notes": "Remote location - GPS coordinates only",
            "crew_notes": "No street address - use GPS navigation"
        }
        
        async with self.session.post(f"{API_BASE}/sites", json=site_data) as response:
            if response.status == 200:
                data = await response.json()
                site_id = data['id']
                self.created_resources['sites'].append(site_id)
                
                # Verify coordinates and address handling
                location = data.get('location', {})
                success = (
                    location.get('latitude') == 45.4215 and
                    location.get('longitude') == -75.6972 and
                    location.get('address') == "45.4215, -75.6972"
                )
                
                details = f"Site ID: {site_id}, Coordinates: {location.get('latitude')}, {location.get('longitude')}"
                self.log_test("Manual Coordinates Site Creation", success, details)
                return site_id if success else None
            else:
                error_text = await response.text()
                self.log_test("Manual Coordinates Site Creation", False, f"Status: {response.status}", error_text)
                return None
    
    async def test_get_sites_with_new_fields(self):
        """Test GET /api/sites returns all new fields"""
        print("\n=== TEST: GET Sites with Enhanced Fields ===")
        
        async with self.session.get(f"{API_BASE}/sites") as response:
            if response.status == 200:
                sites = await response.json()
                
                if not sites:
                    self.log_test("GET Sites - Enhanced Fields", False, "No sites found")
                    return False
                
                # Check if any site has the enhanced fields
                enhanced_site = None
                for site in sites:
                    if site.get('site_reference') or site.get('internal_notes') or site.get('crew_notes') or site.get('services'):
                        enhanced_site = site
                        break
                
                if enhanced_site:
                    # Verify field presence
                    has_site_reference = 'site_reference' in enhanced_site
                    has_internal_notes = 'internal_notes' in enhanced_site
                    has_crew_notes = 'crew_notes' in enhanced_site
                    has_services = 'services' in enhanced_site
                    has_backward_compat = 'notes' in enhanced_site  # Old field
                    
                    success = has_site_reference and has_internal_notes and has_crew_notes and has_services and has_backward_compat
                    
                    details = f"Found {len(sites)} sites, Enhanced fields present: site_reference={has_site_reference}, internal_notes={has_internal_notes}, crew_notes={has_crew_notes}, services={has_services}, backward_compat_notes={has_backward_compat}"
                    self.log_test("GET Sites - Enhanced Fields", success, details)
                    return success
                else:
                    self.log_test("GET Sites - Enhanced Fields", False, "No sites with enhanced fields found")
                    return False
            else:
                error_text = await response.text()
                self.log_test("GET Sites - Enhanced Fields", False, f"Status: {response.status}", error_text)
                return False
    
    async def test_backward_compatibility(self, customer_id: str):
        """Test backward compatibility with existing sites (old notes field)"""
        print("\n=== TEST: Backward Compatibility ===")
        
        # Create site with only old notes field (no enhanced fields)
        old_site_data = {
            "name": "Legacy Site",
            "customer_id": customer_id,
            "site_type": "driveway",
            "location": {
                "latitude": 43.7000,
                "longitude": -79.4000,
                "address": "456 Legacy St, Toronto, ON"
            },
            "notes": "This is the old notes field only"
        }
        
        async with self.session.post(f"{API_BASE}/sites", json=old_site_data) as response:
            if response.status == 200:
                data = await response.json()
                site_id = data['id']
                self.created_resources['sites'].append(site_id)
                
                # Verify old field works and new fields are null/empty
                success = (
                    data.get('notes') == "This is the old notes field only" and
                    data.get('site_reference') is None and
                    data.get('internal_notes') is None and
                    data.get('crew_notes') is None and
                    (data.get('services') is None or data.get('services') == [])
                )
                
                details = f"Legacy site ID: {site_id}, Old notes preserved, new fields null/empty"
                self.log_test("Backward Compatibility", success, details)
                return success
            else:
                error_text = await response.text()
                self.log_test("Backward Compatibility", False, f"Status: {response.status}", error_text)
                return False
    
    async def test_empty_services_array(self, customer_id: str):
        """Test site creation with empty services array"""
        print("\n=== TEST: Empty Services Array ===")
        
        site_data = {
            "name": "No Services Site",
            "customer_id": customer_id,
            "site_type": "sidewalk",
            "location": {
                "latitude": 43.6500,
                "longitude": -79.3800,
                "address": "789 No Services St, Toronto, ON"
            },
            "services": []  # Explicitly empty
        }
        
        async with self.session.post(f"{API_BASE}/sites", json=site_data) as response:
            if response.status == 200:
                data = await response.json()
                site_id = data['id']
                self.created_resources['sites'].append(site_id)
                
                # Verify empty services array is handled correctly
                services = data.get('services', None)
                success = services is not None and len(services) == 0
                
                details = f"Site ID: {site_id}, Services array: {services}"
                self.log_test("Empty Services Array", success, details)
                return success
            else:
                error_text = await response.text()
                self.log_test("Empty Services Array", False, f"Status: {response.status}", error_text)
                return False
    
    async def test_optional_fields_null(self, customer_id: str):
        """Test that optional fields (site_reference, notes) can be null/empty"""
        print("\n=== TEST: Optional Fields Null/Empty ===")
        
        site_data = {
            "name": "Minimal Site",
            "customer_id": customer_id,
            "site_type": "parking_lot",
            "location": {
                "latitude": 43.6400,
                "longitude": -79.3700,
                "address": "321 Minimal St, Toronto, ON"
            }
            # No optional fields provided
        }
        
        async with self.session.post(f"{API_BASE}/sites", json=site_data) as response:
            if response.status == 200:
                data = await response.json()
                site_id = data['id']
                self.created_resources['sites'].append(site_id)
                
                # Verify optional fields are handled correctly when not provided
                success = (
                    data.get('site_reference') is None and
                    data.get('notes') is None and
                    data.get('internal_notes') is None and
                    data.get('crew_notes') is None
                )
                
                details = f"Site ID: {site_id}, All optional fields null as expected"
                self.log_test("Optional Fields Null/Empty", success, details)
                return success
            else:
                error_text = await response.text()
                self.log_test("Optional Fields Null/Empty", False, f"Status: {response.status}", error_text)
                return False
    
    async def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n=== CLEANUP: Removing Test Data ===")
        
        # Delete sites
        for site_id in self.created_resources['sites']:
            try:
                async with self.session.delete(f"{API_BASE}/sites/{site_id}") as response:
                    if response.status == 200:
                        print(f"✅ Deleted site: {site_id}")
                    else:
                        print(f"⚠️ Failed to delete site: {site_id}")
            except Exception as e:
                print(f"⚠️ Error deleting site {site_id}: {e}")
        
        # Delete customers
        for customer_id in self.created_resources['customers']:
            try:
                async with self.session.delete(f"{API_BASE}/customers/{customer_id}") as response:
                    if response.status == 200:
                        print(f"✅ Deleted customer: {customer_id}")
                    else:
                        print(f"⚠️ Failed to delete customer: {customer_id}")
            except Exception as e:
                print(f"⚠️ Error deleting customer {customer_id}: {e}")
        
        # Delete services
        for service_id in self.created_resources['services']:
            try:
                async with self.session.delete(f"{API_BASE}/services/{service_id}") as response:
                    if response.status == 200:
                        print(f"✅ Deleted service: {service_id}")
                    else:
                        print(f"⚠️ Failed to delete service: {service_id}")
            except Exception as e:
                print(f"⚠️ Error deleting service {service_id}: {e}")
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n{'='*60}")
        print(f"ENHANCED SITE MANAGEMENT TESTING SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print(f"\n✅ SUCCESS CRITERIA VERIFICATION:")
        
        # Check success criteria from review request
        criteria_met = []
        
        # All new fields persist correctly in MongoDB
        create_test = next((r for r in self.test_results if 'Create Site with Enhanced Fields' in r['test']), None)
        if create_test and create_test['success']:
            criteria_met.append("✅ All new fields persist correctly in MongoDB")
        else:
            criteria_met.append("❌ New fields persistence - FAILED")
        
        # Site services array stores and retrieves properly
        services_test = next((r for r in self.test_results if 'Update Site Services' in r['test']), None)
        if services_test and services_test['success']:
            criteria_met.append("✅ Site services array stores and retrieves properly")
        else:
            criteria_met.append("❌ Site services array - FAILED")
        
        # Backward compatibility maintained
        compat_test = next((r for r in self.test_results if 'Backward Compatibility' in r['test']), None)
        if compat_test and compat_test['success']:
            criteria_met.append("✅ Backward compatibility maintained (old sites still work)")
        else:
            criteria_met.append("❌ Backward compatibility - FAILED")
        
        # GET /api/sites returns all new fields
        get_test = next((r for r in self.test_results if 'GET Sites - Enhanced Fields' in r['test']), None)
        if get_test and get_test['success']:
            criteria_met.append("✅ GET /api/sites returns all new fields")
        else:
            criteria_met.append("❌ GET /api/sites new fields - FAILED")
        
        # Manual coordinates work as expected
        coords_test = next((r for r in self.test_results if 'Manual Coordinates' in r['test']), None)
        if coords_test and coords_test['success']:
            criteria_met.append("✅ Manual coordinates work as expected")
        else:
            criteria_met.append("❌ Manual coordinates - FAILED")
        
        for criterion in criteria_met:
            print(f"  {criterion}")
        
        return success_rate >= 80  # Consider 80%+ success rate as overall success

async def main():
    """Main test execution"""
    print("🚀 Starting Enhanced Site Management System Backend Testing")
    print(f"Backend URL: {API_BASE}")
    
    test_suite = EnhancedSiteTestSuite()
    
    try:
        await test_suite.setup_session()
        
        # Setup test data
        print("\n=== SETUP: Creating Test Data ===")
        customer_id = await test_suite.create_test_customer()
        if not customer_id:
            print("❌ Failed to create test customer. Aborting tests.")
            return False
        
        service_id = await test_suite.create_test_service()
        if not service_id:
            print("❌ Failed to create test service. Aborting tests.")
            return False
        
        # Run test scenarios
        site_id_1 = await test_suite.test_scenario_1_create_site_with_all_fields(customer_id, service_id)
        
        if site_id_1:
            await test_suite.test_scenario_2_update_site_services(site_id_1, service_id)
        
        await test_suite.test_scenario_3_manual_coordinates(customer_id)
        
        # Additional verification tests
        await test_suite.test_get_sites_with_new_fields()
        await test_suite.test_backward_compatibility(customer_id)
        await test_suite.test_empty_services_array(customer_id)
        await test_suite.test_optional_fields_null(customer_id)
        
        # Print results
        overall_success = test_suite.print_summary()
        
        # Cleanup
        await test_suite.cleanup_test_data()
        
        return overall_success
        
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return False
    finally:
        await test_suite.cleanup_session()

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)