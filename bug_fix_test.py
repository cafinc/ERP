#!/usr/bin/env python3
"""
Backend Bug Fix Testing Script
Tests the 5 specific endpoints that had BSON ObjectId serialization errors and other issues.

Priority Tests:
1. HR Module - Employee Creation (POST /api/hr/employees)
2. HR Module - Time Entry Creation (POST /api/hr/time-entries)  
3. HR Module - PTO Request Creation (POST /api/hr/pto-requests)
4. Integration Hub - Sync Logs (GET /api/integrations/sync-logs)
5. Template System - Categories Endpoint (GET /api/templates/{type}/categories)
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import traceback

# Backend URL from frontend environment
BACKEND_URL = "https://asset-admin-1.preview.emergentagent.com/api"

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(endpoint, method, status_code, success, details=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {method} {endpoint} | Status: {status_code} | {details}")

def test_hr_employee_creation():
    """Test 1: HR Module - Employee Creation (POST /api/hr/employees)"""
    print_test_header("HR Employee Creation - BSON ObjectId Serialization Fix")
    
    endpoint = f"{BACKEND_URL}/hr/employees"
    
    # Test data with all required fields based on the error history
    employee_data = {
        "first_name": "John",
        "last_name": "Smith", 
        "email": "john.smith@testcompany.com",
        "phone": "555-0123",
        "hire_date": "2024-01-15",
        "employment_type": "full_time",
        "job_title": "Snow Removal Technician",
        "department": "Operations"
    }
    
    try:
        response = requests.post(endpoint, json=employee_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "employee" in data:
                employee = data["employee"]
                # Check that ObjectId was properly serialized to string
                if "id" in employee and isinstance(employee["id"], str):
                    print_result(endpoint, "POST", response.status_code, True, 
                               f"Employee created successfully with ID: {employee['id']}")
                    return True, employee["id"]
                else:
                    print_result(endpoint, "POST", response.status_code, False, 
                               "Response missing proper ID field or not serialized as string")
                    return False, None
            else:
                print_result(endpoint, "POST", response.status_code, False, 
                           f"Unexpected response structure: {data}")
                return False, None
        else:
            print_result(endpoint, "POST", response.status_code, False, 
                       f"HTTP Error: {response.text}")
            return False, None
            
    except Exception as e:
        print_result(endpoint, "POST", "ERROR", False, f"Exception: {str(e)}")
        return False, None

def test_hr_time_entry_creation(employee_id):
    """Test 2: HR Module - Time Entry Creation (POST /api/hr/time-entries)"""
    print_test_header("HR Time Entry Creation - BSON ObjectId Serialization Fix")
    
    endpoint = f"{BACKEND_URL}/hr/time-entries"
    
    if not employee_id:
        print_result(endpoint, "POST", "SKIP", False, "No employee ID available from previous test")
        return False
    
    # Test data for time entry
    time_entry_data = {
        "employee_id": employee_id,
        "clock_in": datetime.utcnow().isoformat(),
        "project_id": None,
        "notes": "Testing time entry creation after ObjectId fix"
    }
    
    try:
        response = requests.post(endpoint, json=time_entry_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "time_entry" in data:
                time_entry = data["time_entry"]
                # Check that ObjectId was properly serialized
                if "id" in time_entry and isinstance(time_entry["id"], str):
                    print_result(endpoint, "POST", response.status_code, True, 
                               f"Time entry created successfully with ID: {time_entry['id']}")
                    return True
                else:
                    print_result(endpoint, "POST", response.status_code, False, 
                               "Response missing proper ID field or not serialized as string")
                    return False
            else:
                print_result(endpoint, "POST", response.status_code, False, 
                           f"Unexpected response structure: {data}")
                return False
        else:
            print_result(endpoint, "POST", response.status_code, False, 
                       f"HTTP Error: {response.text}")
            return False
            
    except Exception as e:
        print_result(endpoint, "POST", "ERROR", False, f"Exception: {str(e)}")
        return False

def test_hr_pto_request_creation(employee_id):
    """Test 3: HR Module - PTO Request Creation (POST /api/hr/pto-requests)"""
    print_test_header("HR PTO Request Creation - BSON ObjectId Serialization Fix")
    
    endpoint = f"{BACKEND_URL}/hr/pto-requests"
    
    if not employee_id:
        print_result(endpoint, "POST", "SKIP", False, "No employee ID available from previous test")
        return False
    
    # Test data for PTO request
    start_date = datetime.utcnow() + timedelta(days=30)
    end_date = start_date + timedelta(days=2)
    
    pto_request_data = {
        "employee_id": employee_id,
        "pto_type": "vacation",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_days": 3,
        "reason": "Testing PTO request creation after ObjectId fix"
    }
    
    try:
        response = requests.post(endpoint, json=pto_request_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "pto_request" in data:
                pto_request = data["pto_request"]
                # Check that ObjectId was properly serialized
                if "id" in pto_request and isinstance(pto_request["id"], str):
                    print_result(endpoint, "POST", response.status_code, True, 
                               f"PTO request created successfully with ID: {pto_request['id']}")
                    return True
                else:
                    print_result(endpoint, "POST", response.status_code, False, 
                               "Response missing proper ID field or not serialized as string")
                    return False
            else:
                print_result(endpoint, "POST", response.status_code, False, 
                           f"Unexpected response structure: {data}")
                return False
        else:
            print_result(endpoint, "POST", response.status_code, False, 
                       f"HTTP Error: {response.text}")
            return False
            
    except Exception as e:
        print_result(endpoint, "POST", "ERROR", False, f"Exception: {str(e)}")
        return False

def test_integration_sync_logs():
    """Test 4: Integration Hub - Sync Logs (GET /api/integrations/sync-logs)"""
    print_test_header("Integration Hub Sync Logs - Datetime Serialization Fix")
    
    endpoint = f"{BACKEND_URL}/integrations/sync-logs"
    
    try:
        response = requests.get(endpoint, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "logs" in data:
                logs = data["logs"]
                print_result(endpoint, "GET", response.status_code, True, 
                           f"Sync logs retrieved successfully. Found {len(logs)} logs")
                
                # Check datetime serialization if logs exist
                if logs:
                    first_log = logs[0]
                    datetime_fields = ["started_at", "completed_at"]
                    for field in datetime_fields:
                        if field in first_log:
                            # Should be ISO format string, not datetime object
                            if isinstance(first_log[field], str):
                                try:
                                    # Verify it's valid ISO format
                                    datetime.fromisoformat(first_log[field].replace('Z', '+00:00'))
                                    print(f"  ✅ {field} properly serialized as ISO string")
                                except:
                                    print(f"  ❌ {field} not in valid ISO format: {first_log[field]}")
                                    return False
                            else:
                                print(f"  ❌ {field} not serialized as string: {type(first_log[field])}")
                                return False
                
                return True
            else:
                print_result(endpoint, "GET", response.status_code, False, 
                           f"Unexpected response structure: {data}")
                return False
        else:
            print_result(endpoint, "GET", response.status_code, False, 
                       f"HTTP Error: {response.text}")
            return False
            
    except Exception as e:
        print_result(endpoint, "GET", "ERROR", False, f"Exception: {str(e)}")
        return False

def test_template_categories():
    """Test 5: Template System - Categories Endpoint (GET /api/templates/{type}/categories)"""
    print_test_header("Template Categories - Route Ordering Fix")
    
    # Test with estimate type (mentioned in the issue)
    template_type = "estimate"
    endpoint = f"{BACKEND_URL}/templates/{template_type}/categories"
    
    try:
        response = requests.get(endpoint, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "categories" in data:
                categories = data["categories"]
                print_result(endpoint, "GET", response.status_code, True, 
                           f"Categories retrieved successfully. Found {len(categories)} categories")
                
                # Verify this is actually categories, not a template match
                if isinstance(categories, list):
                    print(f"  ✅ Response is categories list, not template object")
                    return True
                else:
                    print(f"  ❌ Response should be categories list but got: {type(categories)}")
                    return False
            else:
                print_result(endpoint, "GET", response.status_code, False, 
                           f"Unexpected response structure: {data}")
                return False
        else:
            print_result(endpoint, "GET", response.status_code, False, 
                       f"HTTP Error: {response.text}")
            return False
            
    except Exception as e:
        print_result(endpoint, "GET", "ERROR", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all priority bug fix tests"""
    print("🧪 BACKEND BUG FIX TESTING")
    print("Testing 5 specific endpoints that had BSON ObjectId and other serialization issues")
    print(f"Backend URL: {BACKEND_URL}")
    
    results = []
    employee_id = None
    
    # Test 1: HR Employee Creation
    success, emp_id = test_hr_employee_creation()
    results.append(("HR Employee Creation", success))
    if success:
        employee_id = emp_id
    
    # Test 2: HR Time Entry Creation (depends on employee)
    success = test_hr_time_entry_creation(employee_id)
    results.append(("HR Time Entry Creation", success))
    
    # Test 3: HR PTO Request Creation (depends on employee)
    success = test_hr_pto_request_creation(employee_id)
    results.append(("HR PTO Request Creation", success))
    
    # Test 4: Integration Sync Logs
    success = test_integration_sync_logs()
    results.append(("Integration Sync Logs", success))
    
    # Test 5: Template Categories
    success = test_template_categories()
    results.append(("Template Categories", success))
    
    # Summary
    print(f"\n{'='*60}")
    print("FINAL RESULTS SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All bug fixes are working correctly!")
        return 0
    else:
        print("⚠️  Some endpoints still have issues that need attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())