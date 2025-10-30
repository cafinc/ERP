#!/usr/bin/env python3
"""
Focused Backend API Testing for Snow Removal Management System
Tests key working endpoints and handles errors properly
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://mapforge-20.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class FocusedAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Test data storage
        self.test_data = {
            'users': [],
            'customers': [],
            'sites': [],
            'equipment': [],
            'estimates': [],
            'session_token': None
        }
        
        # Test results
        self.results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': []
        }

    def log_test(self, test_name: str, success: bool, details: str = "", response_code: int = None):
        """Log test results"""
        self.results['total_tests'] += 1
        if success:
            self.results['passed_tests'] += 1
            status = "✅ PASS"
        else:
            self.results['failed_tests'] += 1
            status = "❌ FAIL"
        
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'response_code': response_code,
            'timestamp': datetime.now().isoformat()
        }
        self.results['test_details'].append(result)
        print(f"{status}: {test_name} - {details}")

    def make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None, timeout: int = 10) -> tuple:
        """Make HTTP request with shorter timeout and better error handling"""
        try:
            url = f"{self.base_url}{endpoint}"
            
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=timeout)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=timeout)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, params=params, timeout=timeout)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params, timeout=timeout)
            else:
                return None, False, "Unsupported method"
            
            return response, True, None
        except requests.exceptions.Timeout:
            return None, False, "Request timeout"
        except requests.exceptions.ConnectionError:
            return None, False, "Connection error"
        except Exception as e:
            return None, False, f"Request error: {str(e)}"

    def test_core_working_endpoints(self):
        """Test the core endpoints that we know are working"""
        print("\n🔧 TESTING CORE WORKING ENDPOINTS")
        
        # Test root endpoint
        response, success, error = self.make_request('GET', '/')
        if success and response.status_code == 200:
            self.log_test("Root API Endpoint", True, f"Status: {response.status_code}", response.status_code)
        else:
            self.log_test("Root API Endpoint", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test GET endpoints that are working
        working_get_endpoints = [
            ('/users', 'Get Users'),
            ('/customers', 'Get Customers'),
            ('/sites', 'Get Sites'),
            ('/equipment', 'Get Equipment'),
            ('/dispatches', 'Get Dispatches'),
            ('/estimates', 'Get Estimates'),
            ('/invoices', 'Get Invoices'),
            ('/projects', 'Get Projects'),
            ('/services', 'Get Services'),
            ('/contracts', 'Get Contracts'),
            ('/form-templates', 'Get Form Templates'),
            ('/form-responses', 'Get Form Responses'),
            ('/gps-location', 'Get GPS Locations'),
            ('/inspection-schedules', 'Get Inspection Schedules'),
            ('/equipment-inspections', 'Get Equipment Inspections')
        ]
        
        for endpoint, test_name in working_get_endpoints:
            response, success, error = self.make_request('GET', endpoint)
            if success and response.status_code == 200:
                try:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else "data"
                    self.log_test(test_name, True, f"Retrieved {count} items", response.status_code)
                except:
                    self.log_test(test_name, True, f"Status: {response.status_code}", response.status_code)
            else:
                self.log_test(test_name, False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

    def test_authentication_working_endpoints(self):
        """Test authentication endpoints that are working"""
        print("\n🔐 TESTING AUTHENTICATION ENDPOINTS")
        
        # Create test user first
        admin_user_data = {
            "name": "Test Admin User",
            "email": f"admin{int(time.time())}@snowtest.com",
            "phone": "+15551234567",
            "role": "admin",
            "password": "admin123"
        }
        
        response, success, error = self.make_request('POST', '/users', admin_user_data)
        if success and response.status_code == 200:
            admin_user = response.json()
            self.test_data['users'].append(admin_user)
            self.log_test("Create Test Admin User", True, f"Created user: {admin_user.get('name')}", response.status_code)
            
            # Test login with the created user
            login_data = {
                "email": admin_user_data["email"],
                "password": admin_user_data["password"]
            }
            
            response, success, error = self.make_request('POST', '/auth/login-email', login_data)
            if success and response.status_code == 200:
                try:
                    result = response.json()
                    if 'session_token' in result:
                        self.test_data['session_token'] = result['session_token']
                        self.session.headers.update({'Authorization': f"Bearer {result['session_token']}"})
                    self.log_test("Login with Email", True, f"Login successful", response.status_code)
                except:
                    self.log_test("Login with Email", True, f"Status: {response.status_code}", response.status_code)
            else:
                self.log_test("Login with Email", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)
        else:
            self.log_test("Create Test Admin User", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test /auth/me endpoint
        response, success, error = self.make_request('GET', '/auth/me')
        if success and response.status_code == 200:
            self.log_test("Get Current User (/auth/me)", True, f"Status: {response.status_code}", response.status_code)
        else:
            self.log_test("Get Current User (/auth/me)", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

    def test_crud_operations(self):
        """Test CRUD operations on working endpoints"""
        print("\n📝 TESTING CRUD OPERATIONS")
        
        # Test Customer CRUD
        customer_data = {
            "name": f"Test Customer {int(time.time())}",
            "email": f"customer{int(time.time())}@test.com",
            "phone": "+14165551234",
            "address": "123 Test Street, Toronto, ON M5H 3T9",
            "contact_person": "John Doe",
            "payment_terms": "Net 30"
        }
        
        response, success, error = self.make_request('POST', '/customers', customer_data)
        if success and response.status_code == 200:
            customer = response.json()
            self.test_data['customers'].append(customer)
            self.log_test("Create Customer", True, f"Created: {customer.get('name')}", response.status_code)
            
            # Test get specific customer
            customer_id = customer.get('id')
            if customer_id:
                response, success, error = self.make_request('GET', f'/customers/{customer_id}')
                if success and response.status_code == 200:
                    self.log_test("Get Specific Customer", True, f"Retrieved customer {customer_id}", response.status_code)
                else:
                    self.log_test("Get Specific Customer", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)
                
                # Test update customer
                update_data = {"notes": "Updated via API test"}
                response, success, error = self.make_request('PUT', f'/customers/{customer_id}', update_data)
                if success and response.status_code == 200:
                    self.log_test("Update Customer", True, f"Updated customer {customer_id}", response.status_code)
                else:
                    self.log_test("Update Customer", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)
        else:
            self.log_test("Create Customer", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test Equipment CRUD
        equipment_data = {
            "name": f"Test Equipment {int(time.time())}",
            "equipment_type": "plow_truck",
            "vehicle_number": f"TEST-{int(time.time())}",
            "make": "Ford",
            "model": "F-350",
            "year": 2022
        }
        
        response, success, error = self.make_request('POST', '/equipment', equipment_data)
        if success and response.status_code == 200:
            equipment = response.json()
            self.test_data['equipment'].append(equipment)
            self.log_test("Create Equipment", True, f"Created: {equipment.get('name')}", response.status_code)
        else:
            self.log_test("Create Equipment", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test Estimate CRUD
        if self.test_data['customers']:
            customer_id = self.test_data['customers'][0]['id']
            estimate_data = {
                "customer_id": customer_id,
                "estimate_number": f"EST-{int(time.time())}",
                "title": "Test Snow Removal Estimate",
                "line_items": [
                    {
                        "description": "Snow Plowing Service",
                        "quantity": 5,
                        "unit_price": 150.0,
                        "total": 750.0
                    }
                ],
                "subtotal": 750.0,
                "tax_rate": 0.13,
                "tax_amount": 97.50,
                "total_amount": 847.50,
                "valid_until": (datetime.now() + timedelta(days=30)).isoformat()
            }
            
            response, success, error = self.make_request('POST', '/estimates', estimate_data)
            if success and response.status_code == 200:
                estimate = response.json()
                self.test_data['estimates'].append(estimate)
                self.log_test("Create Estimate", True, f"Created: {estimate.get('estimate_number')}", response.status_code)
            else:
                self.log_test("Create Estimate", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

    def test_gps_endpoints(self):
        """Test GPS tracking endpoints"""
        print("\n📍 TESTING GPS TRACKING ENDPOINTS")
        
        # Test GPS location creation
        if self.test_data['users']:
            crew_id = self.test_data['users'][0]['id']
            gps_data = {
                "crew_id": crew_id,
                "latitude": 43.6532,
                "longitude": -79.3832,
                "speed": 25.5,
                "accuracy": 5.0,
                "bearing": 180.0,
                "timestamp": datetime.now().isoformat()
            }
            
            response, success, error = self.make_request('POST', '/gps-location', gps_data)
            if success and response.status_code == 200:
                self.log_test("Create GPS Location", True, f"Created GPS location for crew {crew_id}", response.status_code)
            else:
                self.log_test("Create GPS Location", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test GPS map endpoints
        gps_map_endpoints = [
            ('/gps-location/map/all-active', 'GPS Map All Active'),
            ('/gps-location/map/equipment', 'GPS Map Equipment'),
            ('/gps-location/map/sites', 'GPS Map Sites')
        ]
        
        for endpoint, test_name in gps_map_endpoints:
            response, success, error = self.make_request('GET', endpoint)
            if success and response.status_code == 200:
                self.log_test(test_name, True, f"Status: {response.status_code}", response.status_code)
            else:
                self.log_test(test_name, False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

    def test_equipment_inspection_endpoints(self):
        """Test Equipment Inspection endpoints"""
        print("\n🔍 TESTING EQUIPMENT INSPECTION ENDPOINTS")
        
        # Test inspection dashboard
        response, success, error = self.make_request('GET', '/equipment-inspections/dashboard/overview')
        if success and response.status_code == 200:
            self.log_test("Equipment Inspection Dashboard", True, f"Retrieved dashboard overview", response.status_code)
        else:
            self.log_test("Equipment Inspection Dashboard", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test inspection status endpoint
        response, success, error = self.make_request('GET', '/equipment/inspection-status')
        if success and response.status_code == 200:
            self.log_test("Equipment Inspection Status", True, f"Retrieved inspection status", response.status_code)
        else:
            self.log_test("Equipment Inspection Status", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

    def test_communication_endpoints(self):
        """Test Communication endpoints"""
        print("\n💬 TESTING COMMUNICATION ENDPOINTS")
        
        # Test unified conversations
        response, success, error = self.make_request('GET', '/unified-conversations')
        if success and response.status_code == 200:
            self.log_test("Get Unified Conversations", True, f"Status: {response.status_code}", response.status_code)
        else:
            self.log_test("Get Unified Conversations", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

        # Test messageable users
        response, success, error = self.make_request('GET', '/users/messageable')
        if success and response.status_code == 200:
            try:
                users = response.json()
                self.log_test("Get Messageable Users", True, f"Retrieved {len(users)} messageable users", response.status_code)
            except:
                self.log_test("Get Messageable Users", True, f"Status: {response.status_code}", response.status_code)
        else:
            self.log_test("Get Messageable Users", False, f"Status: {response.status_code if response else error}", response.status_code if response else None)

    def test_error_handling_with_valid_ids(self):
        """Test error handling with properly formatted but non-existent IDs"""
        print("\n🚨 TESTING ERROR HANDLING")
        
        # Use valid ObjectId format but non-existent IDs
        fake_object_id = "507f1f77bcf86cd799439011"
        
        error_tests = [
            (f'/customers/{fake_object_id}', 'GET', 'Customer 404'),
            (f'/sites/{fake_object_id}', 'GET', 'Site 404'),
            (f'/equipment/{fake_object_id}', 'GET', 'Equipment 404'),
            (f'/dispatches/{fake_object_id}', 'GET', 'Dispatch 404')
        ]
        
        for endpoint, method, test_name in error_tests:
            response, success, error = self.make_request(method, endpoint)
            if success and response.status_code == 404:
                self.log_test(f"404 Error Handling - {test_name}", True, f"Correctly returned 404", response.status_code)
            else:
                self.log_test(f"404 Error Handling - {test_name}", False, f"Expected 404, got {response.status_code if response else error}", response.status_code if response else None)

        # Test 400/422 errors with invalid data
        invalid_customer = {"name": ""}  # Missing required fields
        response, success, error = self.make_request('POST', '/customers', invalid_customer)
        if success and response.status_code in [400, 422]:
            self.log_test("400/422 Error Handling - Invalid Data", True, f"Correctly returned {response.status_code}", response.status_code)
        else:
            self.log_test("400/422 Error Handling - Invalid Data", False, f"Expected 400/422, got {response.status_code if response else error}", response.status_code if response else None)

    def run_focused_test(self):
        """Run focused tests on working endpoints"""
        print("🎯 STARTING FOCUSED BACKEND API TESTING")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run test suites
        self.test_core_working_endpoints()
        self.test_authentication_working_endpoints()
        self.test_crud_operations()
        self.test_gps_endpoints()
        self.test_equipment_inspection_endpoints()
        self.test_communication_endpoints()
        self.test_error_handling_with_valid_ids()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 FOCUSED TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"Passed: {self.results['passed_tests']} ✅")
        print(f"Failed: {self.results['failed_tests']} ❌")
        print(f"Success Rate: {(self.results['passed_tests'] / self.results['total_tests'] * 100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Print failed tests
        if self.results['failed_tests'] > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.results['test_details']:
                if test['status'] == "❌ FAIL":
                    print(f"  - {test['test']}: {test['details']}")
        
        print("\n🎯 FOCUSED TESTING COMPLETE")
        return self.results

if __name__ == "__main__":
    tester = FocusedAPITester()
    results = tester.run_focused_test()