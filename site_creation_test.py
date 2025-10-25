#!/usr/bin/env python3
"""
Site Creation API Testing Script
Tests POST /api/sites endpoint comprehensively as requested in the review
"""

import requests
import json
import sys
import time
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://erp-modernizer.preview.emergentagent.com/api"

def test_site_creation_api():
    """Test the POST /api/sites endpoint comprehensively"""
    
    print("=" * 60)
    print("🏢 TESTING SITE CREATION API ENDPOINT")
    print("=" * 60)
    
    results = {
        "total_tests": 0,
        "passed": 0,
        "failed": 0,
        "errors": [],
        "created_sites": [],
        "created_customers": []
    }
    
    # First, create a test customer to link sites to
    print("\n🔧 Setting up test customer...")
    customer_data = {
        "name": "Site Test Customer",
        "email": "sitetest@example.com",
        "phone": "555-SITE-001",
        "customer_type": "individual",
        "address": "123 Site Test Street, Toronto, ON"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/customers", json=customer_data, timeout=10)
        if response.status_code in [200, 201]:
            customer = response.json()
            test_customer_id = customer.get('id')
            results["created_customers"].append(test_customer_id)
            print(f"✅ Created test customer: {test_customer_id}")
        else:
            print(f"❌ Failed to create test customer: {response.status_code}")
            print(f"Response: {response.text}")
            return results
    except Exception as e:
        print(f"❌ Error creating test customer: {str(e)}")
        return results
    
    # Test 1: Successful site creation with all required fields
    print("\n1. Testing successful site creation with all required fields...")
    results["total_tests"] += 1
    
    try:
        site_data = {
            "customer_id": test_customer_id,
            "name": "Main Office Parking Lot",
            "site_type": "parking_lot",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "123 Main Street, Toronto, ON M5V 3A8"
            }
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=site_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if "id" in data and data.get("name") == site_data["name"]:
                results["created_sites"].append(data.get("id"))
                print("✅ PASS: Site created successfully with proper response structure")
                results["passed"] += 1
                
                # Verify all fields are returned
                required_fields = ["id", "customer_id", "name", "site_type", "location", "active", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    print(f"⚠️  WARNING: Missing fields in response: {missing_fields}")
                else:
                    print("✅ All required fields present in response")
                    
                # Verify location data structure
                location = data.get("location", {})
                if all(key in location for key in ["latitude", "longitude", "address"]):
                    print("✅ Location data properly structured")
                else:
                    print("❌ Location data incomplete")
                    
                # Verify ObjectId serialization
                site_id = data.get("id")
                if isinstance(site_id, str) and len(site_id) == 24 and "_id" not in data:
                    print("✅ ObjectId properly serialized to string")
                else:
                    print("⚠️  WARNING: ObjectId serialization issue")
                    
            else:
                print(f"❌ FAIL: Invalid response structure: {data}")
                results["failed"] += 1
                results["errors"].append("Test 1: Invalid response structure")
        else:
            print(f"❌ FAIL: Expected 200/201, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 1: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 1: {str(e)}")
    
    # Test 2: Site creation with optional fields
    print("\n2. Testing site creation with optional fields...")
    results["total_tests"] += 1
    
    try:
        site_data_with_optionals = {
            "customer_id": test_customer_id,
            "name": "Secondary Driveway Site",
            "site_reference": "SITE-001",
            "site_type": "driveway",
            "area_size": 2500.5,
            "location": {
                "latitude": 43.7532,
                "longitude": -79.4832,
                "address": "456 Oak Avenue, Toronto, ON M4B 1B3"
            },
            "internal_notes": "Admin only notes here",
            "crew_notes": "Crew can see these notes",
            "services": [],
            "access_fields": []
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=site_data_with_optionals, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if (data.get("site_reference") == "SITE-001" and 
                data.get("area_size") == 2500.5 and
                data.get("internal_notes") == "Admin only notes here"):
                results["created_sites"].append(data.get("id"))
                print("✅ PASS: Site created with optional fields")
                results["passed"] += 1
            else:
                print(f"❌ FAIL: Optional fields not properly saved: {data}")
                results["failed"] += 1
                results["errors"].append("Test 2: Optional fields not saved")
        else:
            print(f"❌ FAIL: Expected 200/201, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 2: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 2: {str(e)}")
    
    # Test 3: Validation error - missing required field (name)
    print("\n3. Testing validation error - missing name field...")
    results["total_tests"] += 1
    
    try:
        invalid_data = {
            "customer_id": test_customer_id,
            "site_type": "parking_lot",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "789 Pine Street, Toronto, ON"
            }
            # Missing required 'name' field
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=invalid_data, timeout=10)
        
        if response.status_code in [400, 422]:
            print("✅ PASS: Proper validation error for missing name field")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Expected 400/422, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 3: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 3: {str(e)}")
    
    # Test 4: Validation error - missing required field (customer_id)
    print("\n4. Testing validation error - missing customer_id field...")
    results["total_tests"] += 1
    
    try:
        invalid_data = {
            "name": "Test Site Without Customer",
            "site_type": "sidewalk",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "321 Elm Street, Toronto, ON"
            }
            # Missing required 'customer_id' field
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=invalid_data, timeout=10)
        
        if response.status_code in [400, 422]:
            print("✅ PASS: Proper validation error for missing customer_id field")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Expected 400/422, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 4: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 4: {str(e)}")
    
    # Test 5: Validation error - missing required field (site_type)
    print("\n5. Testing validation error - missing site_type field...")
    results["total_tests"] += 1
    
    try:
        invalid_data = {
            "customer_id": test_customer_id,
            "name": "Site Without Type",
            "location": {
                "latitude": 43.6532,
                "longitude": -79.3832,
                "address": "654 Maple Drive, Toronto, ON"
            }
            # Missing required 'site_type' field
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=invalid_data, timeout=10)
        
        if response.status_code in [400, 422]:
            print("✅ PASS: Proper validation error for missing site_type field")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Expected 400/422, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 5: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 5: {str(e)}")
    
    # Test 6: Validation error - missing location data
    print("\n6. Testing validation error - missing location field...")
    results["total_tests"] += 1
    
    try:
        invalid_data = {
            "customer_id": test_customer_id,
            "name": "Site Without Location",
            "site_type": "parking_lot"
            # Missing required 'location' field
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=invalid_data, timeout=10)
        
        if response.status_code in [400, 422]:
            print("✅ PASS: Proper validation error for missing location field")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Expected 400/422, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 6: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 6: {str(e)}")
    
    # Test 7: Validation error - incomplete location data (missing latitude)
    print("\n7. Testing validation error - incomplete location data...")
    results["total_tests"] += 1
    
    try:
        invalid_data = {
            "customer_id": test_customer_id,
            "name": "Site With Incomplete Location",
            "site_type": "driveway",
            "location": {
                "longitude": -79.3832,
                "address": "987 Cedar Lane, Toronto, ON"
                # Missing required 'latitude' field
            }
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=invalid_data, timeout=10)
        
        if response.status_code in [400, 422]:
            print("✅ PASS: Proper validation error for incomplete location data")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Expected 400/422, got {response.status_code}")
            print(f"Response: {response.text}")
            results["failed"] += 1
            results["errors"].append(f"Test 7: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 7: {str(e)}")
    
    # Test 8: Test different site types
    print("\n8. Testing different site types...")
    results["total_tests"] += 1
    
    try:
        site_types = ["parking_lot", "driveway", "sidewalk", "commercial_lot", "residential"]
        success_count = 0
        
        for i, site_type in enumerate(site_types):
            site_data = {
                "customer_id": test_customer_id,
                "name": f"Test {site_type.replace('_', ' ').title()} Site",
                "site_type": site_type,
                "location": {
                    "latitude": 43.6532 + (i * 0.01),
                    "longitude": -79.3832 + (i * 0.01),
                    "address": f"{100 + i*10} Test Street, Toronto, ON"
                }
            }
            
            response = requests.post(f"{BACKEND_URL}/sites", json=site_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("site_type") == site_type:
                    success_count += 1
                    results["created_sites"].append(data.get("id"))
                    
        if success_count == len(site_types):
            print(f"✅ PASS: All {len(site_types)} site types created successfully")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Only {success_count}/{len(site_types)} site types created successfully")
            results["failed"] += 1
            results["errors"].append(f"Test 8: {success_count}/{len(site_types)} site types successful")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 8: {str(e)}")
    
    # Test 9: Test response time and performance
    print("\n9. Testing API response time...")
    results["total_tests"] += 1
    
    try:
        site_data = {
            "customer_id": test_customer_id,
            "name": "Performance Test Site",
            "site_type": "parking_lot",
            "location": {
                "latitude": 43.9532,
                "longitude": -79.6832,
                "address": "999 Performance Drive, Toronto, ON M9P 9P9"
            }
        }
        
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/sites", json=site_data, timeout=10)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        if response.status_code == 201 and response_time < 5.0:
            data = response.json()
            results["created_sites"].append(data.get("id"))
            print(f"✅ PASS: API responded in {response_time:.2f} seconds (< 5s)")
            results["passed"] += 1
        elif response.status_code == 201:
            data = response.json()
            results["created_sites"].append(data.get("id"))
            print(f"⚠️  SLOW: API responded in {response_time:.2f} seconds (> 5s)")
            results["passed"] += 1
        else:
            print(f"❌ FAIL: Expected 200/201, got {response.status_code}")
            results["failed"] += 1
            results["errors"].append(f"Test 9: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 9: {str(e)}")
    
    # Test 10: Test toast notification compatibility (response structure)
    print("\n10. Testing response structure for toast notifications...")
    results["total_tests"] += 1
    
    try:
        site_data = {
            "customer_id": test_customer_id,
            "name": "Toast Notification Test Site",
            "site_type": "sidewalk",
            "location": {
                "latitude": 43.8532,
                "longitude": -79.5832,
                "address": "147 Toast Road, Toronto, ON M1P 2K5"
            }
        }
        
        response = requests.post(f"{BACKEND_URL}/sites", json=site_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            
            # Check if response has proper structure for toast notifications
            has_id = "id" in data
            has_name = "name" in data
            is_json_serializable = True
            
            try:
                json.dumps(data)
            except:
                is_json_serializable = False
            
            if has_id and has_name and is_json_serializable:
                results["created_sites"].append(data.get("id"))
                print("✅ PASS: Response structure compatible with toast notifications")
                results["passed"] += 1
            else:
                print("❌ FAIL: Response structure not compatible with toast notifications")
                results["failed"] += 1
                results["errors"].append("Test 10: Response structure incompatible")
        else:
            print(f"❌ FAIL: Expected 200/201, got {response.status_code}")
            results["failed"] += 1
            results["errors"].append(f"Test 10: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"Test 10: {str(e)}")
    
    # Cleanup test data
    print("\n🧹 Cleaning up test data...")
    
    # Delete created sites
    for site_id in results["created_sites"]:
        try:
            response = requests.delete(f"{BACKEND_URL}/sites/{site_id}", timeout=10)
            if response.status_code == 200:
                print(f"✅ Deleted site {site_id}")
            else:
                print(f"⚠️  Failed to delete site {site_id}: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Error deleting site {site_id}: {str(e)}")
    
    # Delete created customers
    for customer_id in results["created_customers"]:
        try:
            response = requests.delete(f"{BACKEND_URL}/customers/{customer_id}", timeout=10)
            if response.status_code == 200:
                print(f"✅ Deleted customer {customer_id}")
            else:
                print(f"⚠️  Failed to delete customer {customer_id}: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Error deleting customer {customer_id}: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 SITE CREATION API TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {(results['passed']/results['total_tests']*100):.1f}%")
    
    if results['errors']:
        print(f"\n❌ ERRORS ENCOUNTERED:")
        for error in results['errors']:
            print(f"  - {error}")
    else:
        print(f"\n🎉 ALL TESTS PASSED!")
    
    return results

if __name__ == "__main__":
    try:
        results = test_site_creation_api()
        
        # Exit with error code if any tests failed
        if results['failed'] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n\nTesting interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
        sys.exit(1)