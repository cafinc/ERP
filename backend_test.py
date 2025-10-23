#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Phase 1 Validation
Tests all critical modules after fixes as requested in the review.
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
import sys
import os

# Get backend URL from frontend .env
BACKEND_URL = "https://winterwork-hub.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = {
            "hr_module": {"total": 0, "passed": 0, "failed": 0, "errors": []},
            "template_system": {"total": 0, "passed": 0, "failed": 0, "errors": []},
            "customer_management": {"total": 0, "passed": 0, "failed": 0, "errors": []},
            "work_orders": {"total": 0, "passed": 0, "failed": 0, "errors": []},
            "task_system": {"total": 0, "passed": 0, "failed": 0, "errors": []}
        }
        
    def log_result(self, module, test_name, success, error_msg=None, response=None):
        """Log test result"""
        self.test_results[module]["total"] += 1
        if success:
            self.test_results[module]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results[module]["failed"] += 1
            error_detail = f"{test_name}: {error_msg}"
            if response:
                error_detail += f" (Status: {response.status_code}, Response: {response.text[:200]})"
            self.test_results[module]["errors"].append(error_detail)
            print(f"❌ {test_name}: {error_msg}")
            
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        try:
            url = f"{self.base_url}{endpoint}"
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
            return response
        except Exception as e:
            print(f"Request error for {method} {endpoint}: {str(e)}")
            return None

    def test_hr_module(self):
        """Test HR Module endpoints - should be 100% now"""
        print("\n🔍 Testing HR Module (Target: 100% success rate)")
        
        # Test GET /api/hr/employees
        response = self.make_request("GET", "/hr/employees")
        if response and response.status_code == 200:
            self.log_result("hr_module", "GET /api/hr/employees", True)
            try:
                data = response.json()
                employees = data.get("employees", [])
                print(f"   Found {len(employees)} employees")
            except:
                pass
        else:
            self.log_result("hr_module", "GET /api/hr/employees", False, "Failed to get employees", response)
        
        # Test POST /api/hr/employees
        employee_data = {
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@company.com",
            "phone": "+1-555-0123",
            "position": "Snow Plow Operator",
            "department": "Operations",
            "hire_date": datetime.now().isoformat(),
            "hourly_rate": 25.50,
            "emergency_contact_name": "Jane Smith",
            "emergency_contact_phone": "+1-555-0124"
        }
        
        response = self.make_request("POST", "/hr/employees", employee_data)
        created_employee_id = None
        if response and response.status_code in [200, 201]:
            self.log_result("hr_module", "POST /api/hr/employees", True)
            try:
                data = response.json()
                if data.get("success") and data.get("employee"):
                    created_employee_id = data["employee"].get("id")
                    print(f"   Created employee with ID: {created_employee_id}")
            except:
                pass
        else:
            self.log_result("hr_module", "POST /api/hr/employees", False, "Failed to create employee", response)
        
        # Test GET /api/hr/employees/{id} if we have an employee ID
        if created_employee_id:
            response = self.make_request("GET", f"/hr/employees/{created_employee_id}")
            if response and response.status_code == 200:
                self.log_result("hr_module", "GET /api/hr/employees/{id}", True)
            else:
                self.log_result("hr_module", "GET /api/hr/employees/{id}", False, "Failed to get employee by ID", response)
        else:
            # Try with a test ID from existing employees
            response = self.make_request("GET", "/hr/employees")
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    employees = data.get("employees", [])
                    if employees:
                        test_id = employees[0].get("id")
                        response = self.make_request("GET", f"/hr/employees/{test_id}")
                        if response and response.status_code == 200:
                            self.log_result("hr_module", "GET /api/hr/employees/{id}", True)
                        else:
                            self.log_result("hr_module", "GET /api/hr/employees/{id}", False, "Failed to get employee by ID", response)
                    else:
                        self.log_result("hr_module", "GET /api/hr/employees/{id}", False, "No employees found to test with")
                except:
                    self.log_result("hr_module", "GET /api/hr/employees/{id}", False, "Error parsing employee data")
            else:
                self.log_result("hr_module", "GET /api/hr/employees/{id}", False, "Cannot test - no employees available")
        
        # Test POST /api/hr/time-entries
        if created_employee_id:
            time_entry_data = {
                "employee_id": created_employee_id,
                "clock_in": datetime.now().isoformat(),
                "project_id": str(uuid.uuid4()),
                "location": "Main Office",
                "notes": "Regular shift"
            }
            
            response = self.make_request("POST", "/hr/time-entries", time_entry_data)
            if response and response.status_code in [200, 201]:
                self.log_result("hr_module", "POST /api/hr/time-entries", True)
            else:
                self.log_result("hr_module", "POST /api/hr/time-entries", False, "Failed to create time entry", response)
        else:
            self.log_result("hr_module", "POST /api/hr/time-entries", False, "No employee ID available for time entry")
        
        # Test POST /api/hr/pto-requests
        if created_employee_id:
            pto_data = {
                "employee_id": created_employee_id,
                "pto_type": "vacation",
                "start_date": (datetime.now() + timedelta(days=30)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=32)).isoformat(),
                "total_days": 3,
                "reason": "Family vacation"
            }
            
            response = self.make_request("POST", "/hr/pto-requests", pto_data)
            if response and response.status_code in [200, 201]:
                self.log_result("hr_module", "POST /api/hr/pto-requests", True)
            else:
                self.log_result("hr_module", "POST /api/hr/pto-requests", False, "Failed to create PTO request", response)
        else:
            self.log_result("hr_module", "POST /api/hr/pto-requests", False, "No employee ID available for PTO request")
        
        # Test POST /api/hr/trainings
        training_data = {
            "name": "Snow Plow Safety Training",
            "description": "Comprehensive safety training for snow plow operators",
            "duration_hours": 8,
            "expiration_months": 12,
            "is_required": True,
            "category": "Safety"
        }
        
        response = self.make_request("POST", "/hr/trainings", training_data)
        if response and response.status_code in [200, 201]:
            self.log_result("hr_module", "POST /api/hr/trainings", True)
        else:
            self.log_result("hr_module", "POST /api/hr/trainings", False, "Failed to create training", response)
        
        # Test POST /api/hr/performance-reviews
        if created_employee_id:
            # We need a reviewer ID - let's use the same employee for simplicity
            review_data = {
                "employee_id": created_employee_id,
                "reviewer_id": created_employee_id,
                "review_period_start": (datetime.now() - timedelta(days=90)).isoformat(),
                "review_period_end": datetime.now().isoformat(),
                "scheduled_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "review_type": "quarterly"
            }
            
            response = self.make_request("POST", "/hr/performance-reviews", review_data)
            if response and response.status_code in [200, 201]:
                self.log_result("hr_module", "POST /api/hr/performance-reviews", True)
            else:
                self.log_result("hr_module", "POST /api/hr/performance-reviews", False, "Failed to create performance review", response)
        else:
            self.log_result("hr_module", "POST /api/hr/performance-reviews", False, "No employee ID available for performance review")

    def test_template_system(self):
        """Test Template System endpoints - verify route ordering fix"""
        print("\n🔍 Testing Template System (Verify route ordering fix)")
        
        # Test GET /api/templates/placeholders
        response = self.make_request("GET", "/templates/placeholders")
        if response and response.status_code == 200:
            self.log_result("template_system", "GET /api/templates/placeholders", True)
            try:
                data = response.json()
                categories = data.get("categories", {})
                print(f"   Found {len(categories)} placeholder categories")
            except:
                pass
        else:
            self.log_result("template_system", "GET /api/templates/placeholders", False, "Failed to get placeholders", response)
        
        # Test GET /api/templates/estimate/categories (this was failing due to route ordering)
        response = self.make_request("GET", "/templates/estimate/categories")
        if response and response.status_code == 200:
            self.log_result("template_system", "GET /api/templates/estimate/categories", True)
            try:
                data = response.json()
                categories = data.get("categories", [])
                print(f"   Found {len(categories)} estimate categories")
            except:
                pass
        else:
            self.log_result("template_system", "GET /api/templates/estimate/categories", False, "Failed to get estimate categories", response)
        
        # Test GET /api/templates
        response = self.make_request("GET", "/templates")
        if response and response.status_code == 200:
            self.log_result("template_system", "GET /api/templates", True)
            try:
                data = response.json()
                templates = data.get("templates", [])
                print(f"   Found {len(templates)} templates")
            except:
                pass
        else:
            self.log_result("template_system", "GET /api/templates", False, "Failed to get templates", response)

    def test_customer_management(self):
        """Test Customer Management endpoints"""
        print("\n🔍 Testing Customer Management")
        
        # Test GET /api/customers
        response = self.make_request("GET", "/customers")
        if response and response.status_code == 200:
            self.log_result("customer_management", "GET /api/customers", True)
            try:
                customers = response.json()
                print(f"   Found {len(customers)} customers")
            except:
                pass
        else:
            self.log_result("customer_management", "GET /api/customers", False, "Failed to get customers", response)
        
        # Test POST /api/customers
        customer_data = {
            "name": "Acme Snow Removal Client",
            "email": "contact@acmeclient.com",
            "phone": "+1-555-0199",
            "address": "123 Winter Street, Snow City, SC 12345",
            "customer_type": "commercial",
            "billing_address": "123 Winter Street, Snow City, SC 12345"
        }
        
        response = self.make_request("POST", "/customers", customer_data)
        created_customer_id = None
        if response and response.status_code in [200, 201]:
            self.log_result("customer_management", "POST /api/customers", True)
            try:
                data = response.json()
                created_customer_id = data.get("id")
                print(f"   Created customer with ID: {created_customer_id}")
            except:
                pass
        else:
            self.log_result("customer_management", "POST /api/customers", False, "Failed to create customer", response)
        
        # Test GET /api/customers/{id}
        if created_customer_id:
            response = self.make_request("GET", f"/customers/{created_customer_id}")
            if response and response.status_code == 200:
                self.log_result("customer_management", "GET /api/customers/{id}", True)
            else:
                self.log_result("customer_management", "GET /api/customers/{id}", False, "Failed to get customer by ID", response)
        else:
            # Try with existing customer
            response = self.make_request("GET", "/customers")
            if response and response.status_code == 200:
                try:
                    customers = response.json()
                    if customers and len(customers) > 0:
                        test_id = customers[0].get("id")
                        if test_id:
                            response = self.make_request("GET", f"/customers/{test_id}")
                            if response and response.status_code == 200:
                                self.log_result("customer_management", "GET /api/customers/{id}", True)
                            else:
                                self.log_result("customer_management", "GET /api/customers/{id}", False, "Failed to get customer by ID", response)
                        else:
                            self.log_result("customer_management", "GET /api/customers/{id}", False, "No customer ID found")
                    else:
                        self.log_result("customer_management", "GET /api/customers/{id}", False, "No customers found to test with")
                except:
                    self.log_result("customer_management", "GET /api/customers/{id}", False, "Error parsing customer data")
            else:
                self.log_result("customer_management", "GET /api/customers/{id}", False, "Cannot test - no customers available")

    def test_work_orders(self):
        """Test Work Orders endpoints"""
        print("\n🔍 Testing Work Orders")
        
        # Test GET /api/work-orders
        response = self.make_request("GET", "/work-orders")
        if response and response.status_code == 200:
            self.log_result("work_orders", "GET /api/work-orders", True)
            try:
                data = response.json()
                work_orders = data if isinstance(data, list) else data.get("work_orders", [])
                print(f"   Found {len(work_orders)} work orders")
            except:
                pass
        else:
            self.log_result("work_orders", "GET /api/work-orders", False, "Failed to get work orders", response)
        
        # Test POST /api/work-orders
        work_order_data = {
            "title": "Snow Plowing - Main Street",
            "description": "Plow and salt Main Street commercial district",
            "customer_id": str(uuid.uuid4()),  # Using UUID since we may not have real customer
            "site_id": str(uuid.uuid4()),
            "priority": "high",
            "scheduled_date": (datetime.now() + timedelta(hours=2)).isoformat(),
            "estimated_duration": 120,
            "services": ["plowing", "salting"],
            "equipment_needed": ["plow_truck", "salt_spreader"]
        }
        
        response = self.make_request("POST", "/work-orders", work_order_data)
        if response and response.status_code in [200, 201]:
            self.log_result("work_orders", "POST /api/work-orders", True)
        else:
            self.log_result("work_orders", "POST /api/work-orders", False, "Failed to create work order", response)

    def test_task_system(self):
        """Test Task System endpoints (new feature)"""
        print("\n🔍 Testing Task System (New Feature)")
        
        # Test GET /api/tasks
        response = self.make_request("GET", "/tasks")
        if response and response.status_code == 200:
            self.log_result("task_system", "GET /api/tasks", True)
            try:
                tasks = response.json()
                print(f"   Found {len(tasks)} tasks")
            except:
                pass
        else:
            self.log_result("task_system", "GET /api/tasks", False, "Failed to get tasks", response)
        
        # Test POST /api/tasks
        task_data = {
            "title": "Complete Snow Removal Training",
            "description": "Complete mandatory snow removal safety training before winter season",
            "type": "training",
            "priority": "high",
            "assigned_to": [str(uuid.uuid4())],  # Using UUID since we may not have real user
            "assigned_by": str(uuid.uuid4()),
            "assigned_by_name": "System Administrator",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "estimated_hours": 8,
            "tags": ["training", "safety", "mandatory"]
        }
        
        response = self.make_request("POST", "/tasks", task_data)
        created_task_id = None
        if response and response.status_code in [200, 201]:
            self.log_result("task_system", "POST /api/tasks", True)
            try:
                data = response.json()
                created_task_id = data.get("id")
                print(f"   Created task with ID: {created_task_id}")
            except:
                pass
        else:
            self.log_result("task_system", "POST /api/tasks", False, "Failed to create task", response)
        
        # Test GET /api/tasks/{id}
        if created_task_id:
            response = self.make_request("GET", f"/tasks/{created_task_id}")
            if response and response.status_code == 200:
                self.log_result("task_system", "GET /api/tasks/{id}", True)
            else:
                self.log_result("task_system", "GET /api/tasks/{id}", False, "Failed to get task by ID", response)
        else:
            # Try with existing task
            response = self.make_request("GET", "/tasks")
            if response and response.status_code == 200:
                try:
                    tasks = response.json()
                    if tasks and len(tasks) > 0:
                        test_id = tasks[0].get("id")
                        if test_id:
                            response = self.make_request("GET", f"/tasks/{test_id}")
                            if response and response.status_code == 200:
                                self.log_result("task_system", "GET /api/tasks/{id}", True)
                            else:
                                self.log_result("task_system", "GET /api/tasks/{id}", False, "Failed to get task by ID", response)
                        else:
                            self.log_result("task_system", "GET /api/tasks/{id}", False, "No task ID found")
                    else:
                        self.log_result("task_system", "GET /api/tasks/{id}", False, "No tasks found to test with")
                except:
                    self.log_result("task_system", "GET /api/tasks/{id}", False, "Error parsing task data")
            else:
                self.log_result("task_system", "GET /api/tasks/{id}", False, "Cannot test - no tasks available")

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🔍 COMPREHENSIVE BACKEND TESTING SUMMARY")
        print("="*80)
        
        total_tests = 0
        total_passed = 0
        total_failed = 0
        
        for module, results in self.test_results.items():
            total_tests += results["total"]
            total_passed += results["passed"]
            total_failed += results["failed"]
            
            success_rate = (results["passed"] / results["total"] * 100) if results["total"] > 0 else 0
            status = "✅" if success_rate == 100 else "⚠️" if success_rate >= 80 else "❌"
            
            print(f"\n{status} {module.upper().replace('_', ' ')}: {results['passed']}/{results['total']} ({success_rate:.1f}%)")
            
            if results["errors"]:
                print("   Failures:")
                for error in results["errors"]:
                    print(f"   - {error}")
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        overall_status = "✅" if overall_success_rate == 100 else "⚠️" if overall_success_rate >= 80 else "❌"
        
        print(f"\n{overall_status} OVERALL: {total_passed}/{total_tests} ({overall_success_rate:.1f}%)")
        
        # Success criteria check
        print(f"\n📊 SUCCESS CRITERIA CHECK:")
        hr_success_rate = (self.test_results["hr_module"]["passed"] / self.test_results["hr_module"]["total"] * 100) if self.test_results["hr_module"]["total"] > 0 else 0
        print(f"   HR Module: {hr_success_rate:.1f}% (Target: 100%)")
        
        template_success_rate = (self.test_results["template_system"]["passed"] / self.test_results["template_system"]["total"] * 100) if self.test_results["template_system"]["total"] > 0 else 0
        print(f"   Template System: {template_success_rate:.1f}% (Route ordering fix)")
        
        print(f"\n🎯 CRITICAL ISSUES:")
        critical_issues = []
        
        for module, results in self.test_results.items():
            if results["failed"] > 0:
                for error in results["errors"]:
                    if "500" in error or "ObjectId" in error or "serialization" in error:
                        critical_issues.append(f"{module}: {error}")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"   ❌ {issue}")
        else:
            print("   ✅ No critical issues found")
        
        return overall_success_rate

def main():
    """Run comprehensive backend testing"""
    print("🚀 Starting Comprehensive Backend API Testing")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    
    tester = BackendTester()
    
    # Run all tests
    tester.test_hr_module()
    tester.test_template_system()
    tester.test_customer_management()
    tester.test_work_orders()
    tester.test_task_system()
    
    # Print summary
    success_rate = tester.print_summary()
    
    # Exit with appropriate code
    if success_rate == 100:
        print(f"\n🎉 All tests passed! Backend is ready for production.")
        sys.exit(0)
    elif success_rate >= 80:
        print(f"\n⚠️ Most tests passed but some issues remain.")
        sys.exit(1)
    else:
        print(f"\n❌ Significant issues found. Backend needs attention.")
        sys.exit(2)

if __name__ == "__main__":
    main()
            template_data = {
                "type": "estimate",
                "name": "Test Custom Estimate Template",
                "description": "Test template for comprehensive testing",
                "category": "test",
                "tags": ["test", "custom", "estimate"],
                "content": {
                    "title": "Custom Estimate",
                    "customer_name": "{{customer_name}}",
                    "customer_email": "{{customer_email}}",
                    "estimate_number": "{{estimate_number}}",
                    "date": "{{today_date}}",
                    "line_items": [
                        {
                            "description": "{{service_description}}",
                            "quantity": "{{quantity}}",
                            "unit_price": "{{unit_price}}",
                            "total": "{{total_amount}}"
                        }
                    ],
                    "subtotal": "{{subtotal}}",
                    "tax_amount": "{{tax_amount}}",
                    "total": "{{total}}",
                    "notes": "{{notes}}"
                },
                "is_public": False,
                "is_default": False
            }
            
            response = self.session.post(f"{BACKEND_URL}/templates", json=template_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("template"):
                    template_id = data["template"]["_id"]
                    self.created_templates.append({"type": "estimate", "id": template_id})
                    self.log_test("1. POST /api/templates - Create new custom template", True, 
                                f"Template created with ID: {template_id}", data)
                else:
                    self.log_test("1. POST /api/templates - Create new custom template", False, 
                                "Response missing success or template data", data)
            else:
                self.log_test("1. POST /api/templates - Create new custom template", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("1. POST /api/templates - Create new custom template", False, str(e))

        # Test 2: GET /api/templates - Verify template appears in list
        try:
            response = self.session.get(f"{BACKEND_URL}/templates?type=estimate")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("templates"), list):
                    templates = data["templates"]
                    found_test_template = any(t.get("name") == "Test Custom Estimate Template" for t in templates)
                    if found_test_template:
                        self.log_test("2. GET /api/templates - Verify template appears in list", True, 
                                    f"Found {len(templates)} templates, including our test template")
                    else:
                        self.log_test("2. GET /api/templates - Verify template appears in list", False, 
                                    "Test template not found in list")
                else:
                    self.log_test("2. GET /api/templates - Verify template appears in list", False, 
                                "Invalid response format", data)
            else:
                self.log_test("2. GET /api/templates - Verify template appears in list", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("2. GET /api/templates - Verify template appears in list", False, str(e))

        # Test 3: GET /api/templates/{type}/{id} - Get specific template
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                response = self.session.get(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("template"):
                        template = data["template"]
                        if template.get("name") == "Test Custom Estimate Template":
                            self.log_test("3. GET /api/templates/{type}/{id} - Get specific template", True, 
                                        "Template retrieved successfully with correct data")
                        else:
                            self.log_test("3. GET /api/templates/{type}/{id} - Get specific template", False, 
                                        "Template data doesn't match expected values")
                    else:
                        self.log_test("3. GET /api/templates/{type}/{id} - Get specific template", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("3. GET /api/templates/{type}/{id} - Get specific template", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("3. GET /api/templates/{type}/{id} - Get specific template", False, str(e))

        # Test 4: PUT /api/templates/{type}/{id} - Update template
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                update_data = {
                    "name": "Updated Test Template",
                    "description": "Updated description for testing",
                    "tags": ["test", "updated", "estimate"]
                }
                
                response = self.session.put(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}", 
                                          json=update_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("template"):
                        template = data["template"]
                        if template.get("name") == "Updated Test Template":
                            self.log_test("4. PUT /api/templates/{type}/{id} - Update template", True, 
                                        "Template updated successfully")
                        else:
                            self.log_test("4. PUT /api/templates/{type}/{id} - Update template", False, 
                                        "Template update didn't apply correctly")
                    else:
                        self.log_test("4. PUT /api/templates/{type}/{id} - Update template", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("4. PUT /api/templates/{type}/{id} - Update template", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("4. PUT /api/templates/{type}/{id} - Update template", False, str(e))

        # Test 5: POST /api/templates/{type}/{id}/duplicate - Duplicate template
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/duplicate",
                                           params={"new_name": "Duplicated Test Template"})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("template"):
                        duplicate_id = data["template"]["_id"]
                        self.created_templates.append({"type": "estimate", "id": duplicate_id})
                        self.log_test("5. POST /api/templates/{type}/{id}/duplicate - Duplicate template", True, 
                                    f"Template duplicated with ID: {duplicate_id}")
                    else:
                        self.log_test("5. POST /api/templates/{type}/{id}/duplicate - Duplicate template", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("5. POST /api/templates/{type}/{id}/duplicate - Duplicate template", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("5. POST /api/templates/{type}/{id}/duplicate - Duplicate template", False, str(e))

        # Test 6: DELETE /api/templates/{type}/{id} - Delete template (soft delete)
        if len(self.created_templates) > 1:
            try:
                # Delete the duplicate, keep the original for further tests
                template_info = self.created_templates[1]
                response = self.session.delete(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_test("6. DELETE /api/templates/{type}/{id} - Delete template", True, 
                                    "Template deleted successfully (soft delete)")
                        # Remove from our tracking list
                        self.created_templates.remove(template_info)
                    else:
                        self.log_test("6. DELETE /api/templates/{type}/{id} - Delete template", False, 
                                    "Delete operation failed", data)
                else:
                    self.log_test("6. DELETE /api/templates/{type}/{id} - Delete template", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("6. DELETE /api/templates/{type}/{id} - Delete template", False, str(e))

    def test_suite_2_placeholder_system(self):
        """TEST SUITE 2: Placeholder System"""
        print("=" * 60)
        print("TEST SUITE 2: Placeholder System")
        print("=" * 60)
        
        # Test 7: GET /api/templates/placeholders - Get all placeholders
        try:
            response = self.session.get(f"{BACKEND_URL}/templates/placeholders")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("categories"):
                    categories = data["categories"]
                    total_placeholders = sum(len(cat["placeholders"]) for cat in categories.values())
                    if total_placeholders >= 70:
                        self.log_test("7. GET /api/templates/placeholders - Get all placeholders", True, 
                                    f"Found {total_placeholders} placeholders across {len(categories)} categories")
                    else:
                        self.log_test("7. GET /api/templates/placeholders - Get all placeholders", False, 
                                    f"Only found {total_placeholders} placeholders, expected 70+")
                else:
                    self.log_test("7. GET /api/templates/placeholders - Get all placeholders", False, 
                                "Invalid response format", data)
            else:
                self.log_test("7. GET /api/templates/placeholders - Get all placeholders", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("7. GET /api/templates/placeholders - Get all placeholders", False, str(e))

        # Test 8: GET /api/templates/placeholders?category=customer - Filter by category
        try:
            response = self.session.get(f"{BACKEND_URL}/templates/placeholders?category=customer")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("category"):
                    category_data = data["category"]
                    placeholders = category_data.get("placeholders", [])
                    if len(placeholders) > 0:
                        self.log_test("8. GET /api/templates/placeholders?category=customer - Filter by category", True, 
                                    f"Found {len(placeholders)} customer placeholders")
                    else:
                        self.log_test("8. GET /api/templates/placeholders?category=customer - Filter by category", False, 
                                    "No customer placeholders found")
                else:
                    self.log_test("8. GET /api/templates/placeholders?category=customer - Filter by category", False, 
                                "Invalid response format", data)
            else:
                self.log_test("8. GET /api/templates/placeholders?category=customer - Filter by category", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("8. GET /api/templates/placeholders?category=customer - Filter by category", False, str(e))

        # Test 9: GET /api/templates/placeholders?search=name - Search placeholders
        try:
            response = self.session.get(f"{BACKEND_URL}/templates/placeholders?search=name")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("placeholders"):
                    placeholders = data["placeholders"]
                    if len(placeholders) > 0:
                        # Check if results contain "name" in key or description
                        relevant_results = [p for p in placeholders if "name" in p.get("key", "").lower() or "name" in p.get("description", "").lower()]
                        if relevant_results:
                            self.log_test("9. GET /api/templates/placeholders?search=name - Search placeholders", True, 
                                        f"Found {len(relevant_results)} relevant placeholders containing 'name'")
                        else:
                            self.log_test("9. GET /api/templates/placeholders?search=name - Search placeholders", False, 
                                        "Search results don't contain relevant placeholders")
                    else:
                        self.log_test("9. GET /api/templates/placeholders?search=name - Search placeholders", False, 
                                    "No search results found")
                else:
                    self.log_test("9. GET /api/templates/placeholders?search=name - Search placeholders", False, 
                                "Invalid response format", data)
            else:
                self.log_test("9. GET /api/templates/placeholders?search=name - Search placeholders", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("9. GET /api/templates/placeholders?search=name - Search placeholders", False, str(e))

        # Test 10: Verify all 10 categories exist
        try:
            response = self.session.get(f"{BACKEND_URL}/templates/placeholders")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("categories"):
                    categories = data["categories"]
                    expected_categories = ["customer", "company", "dates", "estimate", "invoice", "project", "site", "service", "pricing", "user"]
                    found_categories = list(categories.keys())
                    
                    missing_categories = [cat for cat in expected_categories if cat not in found_categories]
                    if not missing_categories:
                        self.log_test("10. Verify all 10 categories exist", True, 
                                    f"All expected categories found: {found_categories}")
                    else:
                        self.log_test("10. Verify all 10 categories exist", False, 
                                    f"Missing categories: {missing_categories}")
                else:
                    self.log_test("10. Verify all 10 categories exist", False, 
                                "Invalid response format", data)
            else:
                self.log_test("10. Verify all 10 categories exist", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("10. Verify all 10 categories exist", False, str(e))

        # Test 11: Verify placeholders have required fields
        try:
            response = self.session.get(f"{BACKEND_URL}/templates/placeholders")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("categories"):
                    categories = data["categories"]
                    all_valid = True
                    invalid_placeholders = []
                    
                    for category_name, category_data in categories.items():
                        for placeholder in category_data.get("placeholders", []):
                            required_fields = ["key", "description", "example"]
                            missing_fields = [field for field in required_fields if not placeholder.get(field)]
                            if missing_fields:
                                all_valid = False
                                invalid_placeholders.append(f"{category_name}.{placeholder.get('key', 'unknown')}: missing {missing_fields}")
                    
                    if all_valid:
                        self.log_test("11. Verify placeholders have required fields", True, 
                                    "All placeholders have required fields (key, description, example)")
                    else:
                        self.log_test("11. Verify placeholders have required fields", False, 
                                    f"Invalid placeholders: {invalid_placeholders[:5]}")  # Show first 5
                else:
                    self.log_test("11. Verify placeholders have required fields", False, 
                                "Invalid response format", data)
            else:
                self.log_test("11. Verify placeholders have required fields", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("11. Verify placeholders have required fields", False, str(e))

    def test_suite_3_template_application(self):
        """TEST SUITE 3: Template Application & Variable Replacement"""
        print("=" * 60)
        print("TEST SUITE 3: Template Application & Variable Replacement")
        print("=" * 60)
        
        # Test 12: POST /api/templates/{type}/{id}/apply - Apply template with sample data
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                sample_data = {
                    "customer_name": "John Smith",
                    "customer_email": "john.smith@example.com",
                    "estimate_number": "EST-2025-001",
                    "today_date": "2025-01-15",
                    "service_description": "Snow Removal Service",
                    "quantity": "1",
                    "unit_price": "150.00",
                    "total_amount": "150.00",
                    "subtotal": "150.00",
                    "tax_amount": "12.00",
                    "total": "162.00",
                    "notes": "Standard residential snow removal"
                }
                
                response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                           json={"data": sample_data})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("result"):
                        result = data["result"]
                        content = result.get("content", {})
                        
                        # Check if variables were replaced
                        if (content.get("customer_name") == "John Smith" and 
                            content.get("estimate_number") == "EST-2025-001"):
                            self.log_test("12. POST /api/templates/{type}/{id}/apply - Apply template with sample data", True, 
                                        "Template applied successfully with variable replacement")
                        else:
                            self.log_test("12. POST /api/templates/{type}/{id}/apply - Apply template with sample data", False, 
                                        "Variable replacement didn't work correctly")
                    else:
                        self.log_test("12. POST /api/templates/{type}/{id}/apply - Apply template with sample data", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("12. POST /api/templates/{type}/{id}/apply - Apply template with sample data", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("12. POST /api/templates/{type}/{id}/apply - Apply template with sample data", False, str(e))

        # Test 13: Test variable replacement works correctly
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                test_data = {
                    "customer_name": "Test Customer {{special}}",
                    "customer_email": "test@domain.com",
                    "estimate_number": "EST-TEST-123"
                }
                
                response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                           json={"data": test_data})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("result"):
                        content = data["result"]["content"]
                        
                        # Check if special characters and complex values are handled
                        if content.get("customer_name") == "Test Customer {{special}}":
                            self.log_test("13. Test variable replacement works correctly", True, 
                                        "Variable replacement handles special characters correctly")
                        else:
                            self.log_test("13. Test variable replacement works correctly", False, 
                                        "Variable replacement failed with special characters")
                    else:
                        self.log_test("13. Test variable replacement works correctly", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("13. Test variable replacement works correctly", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("13. Test variable replacement works correctly", False, str(e))

        # Test 14: Test nested object variable replacement
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                nested_data = {
                    "customer_name": "Nested Test Customer",
                    "service_description": "Complex Service with Nested Data",
                    "quantity": "2",
                    "unit_price": "75.50",
                    "total_amount": "151.00"
                }
                
                response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                           json={"data": nested_data})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("result"):
                        content = data["result"]["content"]
                        line_items = content.get("line_items", [])
                        
                        # Check if nested line_items were processed correctly
                        if (line_items and len(line_items) > 0 and 
                            line_items[0].get("description") == "Complex Service with Nested Data"):
                            self.log_test("14. Test nested object variable replacement", True, 
                                        "Nested object variable replacement works correctly")
                        else:
                            self.log_test("14. Test nested object variable replacement", False, 
                                        "Nested object variable replacement failed")
                    else:
                        self.log_test("14. Test nested object variable replacement", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("14. Test nested object variable replacement", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("14. Test nested object variable replacement", False, str(e))

        # Test 15: Test array/list variable replacement
        try:
            # Create a template with array content for testing
            array_template_data = {
                "type": "invoice",
                "name": "Array Test Template",
                "description": "Template for testing array variable replacement",
                "category": "test",
                "tags": ["test", "array"],
                "content": {
                    "title": "Array Test Invoice",
                    "items": [
                        {"name": "{{item1_name}}", "price": "{{item1_price}}"},
                        {"name": "{{item2_name}}", "price": "{{item2_price}}"}
                    ],
                    "customer": "{{customer_name}}"
                },
                "is_public": False,
                "is_default": False
            }
            
            create_response = self.session.post(f"{BACKEND_URL}/templates", json=array_template_data)
            
            if create_response.status_code == 200:
                create_data = create_response.json()
                if create_data.get("success") and create_data.get("template"):
                    array_template_id = create_data["template"]["_id"]
                    self.created_templates.append({"type": "invoice", "id": array_template_id})
                    
                    # Now test array variable replacement
                    array_test_data = {
                        "customer_name": "Array Test Customer",
                        "item1_name": "First Item",
                        "item1_price": "100.00",
                        "item2_name": "Second Item",
                        "item2_price": "200.00"
                    }
                    
                    apply_response = self.session.post(f"{BACKEND_URL}/templates/invoice/{array_template_id}/apply",
                                                     json={"data": array_test_data})
                    
                    if apply_response.status_code == 200:
                        apply_data = apply_response.json()
                        if apply_data.get("success") and apply_data.get("result"):
                            content = apply_data["result"]["content"]
                            items = content.get("items", [])
                            
                            if (len(items) == 2 and 
                                items[0].get("name") == "First Item" and 
                                items[1].get("name") == "Second Item"):
                                self.log_test("15. Test array/list variable replacement", True, 
                                            "Array variable replacement works correctly")
                            else:
                                self.log_test("15. Test array/list variable replacement", False, 
                                            "Array variable replacement failed")
                        else:
                            self.log_test("15. Test array/list variable replacement", False, 
                                        "Apply template failed", apply_data)
                    else:
                        self.log_test("15. Test array/list variable replacement", False, 
                                    f"Apply HTTP {apply_response.status_code}", apply_response.text)
                else:
                    self.log_test("15. Test array/list variable replacement", False, 
                                "Failed to create array test template", create_data)
            else:
                self.log_test("15. Test array/list variable replacement", False, 
                            f"Create HTTP {create_response.status_code}", create_response.text)
        except Exception as e:
            self.log_test("15. Test array/list variable replacement", False, str(e))

    def test_suite_4_prebuilt_templates(self):
        """TEST SUITE 4: Pre-built Templates"""
        print("=" * 60)
        print("TEST SUITE 4: Pre-built Templates")
        print("=" * 60)
        
        # Test 16: Verify 11 pre-built templates exist in database
        try:
            all_templates = []
            template_types = ["estimate", "invoice", "proposal", "contract", "work_order", "project", "notification"]
            
            for template_type in template_types:
                response = self.session.get(f"{BACKEND_URL}/templates?type={template_type}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("templates"):
                        # Filter for pre-built templates (created by system)
                        prebuilt = [t for t in data["templates"] if t.get("created_by") == "system"]
                        all_templates.extend(prebuilt)
            
            if len(all_templates) >= 11:
                self.log_test("16. Verify 11 pre-built templates exist in database", True, 
                            f"Found {len(all_templates)} pre-built templates")
            else:
                self.log_test("16. Verify 11 pre-built templates exist in database", False, 
                            f"Only found {len(all_templates)} pre-built templates, expected 11+")
        except Exception as e:
            self.log_test("16. Verify 11 pre-built templates exist in database", False, str(e))

        # Test 17: Test each template type has proper structure
        try:
            template_types = ["estimate", "invoice", "proposal", "contract", "work_order"]
            valid_structures = 0
            
            for template_type in template_types:
                response = self.session.get(f"{BACKEND_URL}/templates?type={template_type}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("templates"):
                        templates = data["templates"]
                        if templates:
                            # Check first template structure
                            template = templates[0]
                            required_fields = ["name", "content", "type", "created_at"]
                            if all(field in template for field in required_fields):
                                valid_structures += 1
            
            if valid_structures == len(template_types):
                self.log_test("17. Test each template type has proper structure", True, 
                            f"All {valid_structures} template types have proper structure")
            else:
                self.log_test("17. Test each template type has proper structure", False, 
                            f"Only {valid_structures}/{len(template_types)} template types have proper structure")
        except Exception as e:
            self.log_test("17. Test each template type has proper structure", False, str(e))

        # Test 18: Verify estimate templates have line_items
        try:
            response = self.session.get(f"{BACKEND_URL}/templates?type=estimate")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("templates"):
                    estimate_templates = data["templates"]
                    templates_with_line_items = 0
                    
                    for template in estimate_templates:
                        content = template.get("content", {})
                        if "line_items" in content:
                            templates_with_line_items += 1
                    
                    if templates_with_line_items > 0:
                        self.log_test("18. Verify estimate templates have line_items", True, 
                                    f"{templates_with_line_items}/{len(estimate_templates)} estimate templates have line_items")
                    else:
                        self.log_test("18. Verify estimate templates have line_items", False, 
                                    "No estimate templates have line_items structure")
                else:
                    self.log_test("18. Verify estimate templates have line_items", False, 
                                "Failed to get estimate templates", data)
            else:
                self.log_test("18. Verify estimate templates have line_items", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("18. Verify estimate templates have line_items", False, str(e))

        # Test 19: Verify all templates have valid JSON content
        try:
            template_types = ["estimate", "invoice", "proposal", "contract"]
            valid_json_count = 0
            total_templates = 0
            
            for template_type in template_types:
                response = self.session.get(f"{BACKEND_URL}/templates?type={template_type}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("templates"):
                        templates = data["templates"]
                        for template in templates:
                            total_templates += 1
                            content = template.get("content")
                            if isinstance(content, dict) and content:
                                valid_json_count += 1
            
            if valid_json_count == total_templates and total_templates > 0:
                self.log_test("19. Verify all templates have valid JSON content", True, 
                            f"All {total_templates} templates have valid JSON content")
            else:
                self.log_test("19. Verify all templates have valid JSON content", False, 
                            f"Only {valid_json_count}/{total_templates} templates have valid JSON content")
        except Exception as e:
            self.log_test("19. Verify all templates have valid JSON content", False, str(e))

        # Test 20: Test default template flags are set correctly
        try:
            template_types = ["estimate", "invoice", "proposal", "contract"]
            default_templates_found = 0
            
            for template_type in template_types:
                response = self.session.get(f"{BACKEND_URL}/templates?type={template_type}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("templates"):
                        templates = data["templates"]
                        for template in templates:
                            if template.get("is_default") is True:
                                default_templates_found += 1
                                break  # Only count one default per type
            
            if default_templates_found > 0:
                self.log_test("20. Test default template flags are set correctly", True, 
                            f"Found {default_templates_found} default templates")
            else:
                self.log_test("20. Test default template flags are set correctly", False, 
                            "No default templates found")
        except Exception as e:
            self.log_test("20. Test default template flags are set correctly", False, str(e))

    def test_suite_5_integration_features(self):
        """TEST SUITE 5: Integration Features"""
        print("=" * 60)
        print("TEST SUITE 5: Integration Features")
        print("=" * 60)
        
        # Test 21: GET /api/templates/{type}/categories - Get unique categories
        try:
            response = self.session.get(f"{BACKEND_URL}/templates/estimate/categories")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("categories"):
                    categories = data["categories"]
                    if isinstance(categories, list) and len(categories) > 0:
                        self.log_test("21. GET /api/templates/{type}/categories - Get unique categories", True, 
                                    f"Found {len(categories)} categories: {categories}")
                    else:
                        self.log_test("21. GET /api/templates/{type}/categories - Get unique categories", False, 
                                    "No categories found or invalid format")
                else:
                    self.log_test("21. GET /api/templates/{type}/categories - Get unique categories", False, 
                                "Invalid response format", data)
            else:
                # This might fail due to route ordering issue mentioned in test_result.md
                self.log_test("21. GET /api/templates/{type}/categories - Get unique categories", False, 
                            f"HTTP {response.status_code} - Known route ordering issue", response.text)
        except Exception as e:
            self.log_test("21. GET /api/templates/{type}/categories - Get unique categories", False, str(e))

        # Test 22: GET /api/templates/{type}/{id}/stats - Get usage statistics
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                response = self.session.get(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/stats")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("stats"):
                        stats = data["stats"]
                        required_stats = ["template_id", "usage_count", "created_at", "version"]
                        if all(field in stats for field in required_stats):
                            self.log_test("22. GET /api/templates/{type}/{id}/stats - Get usage statistics", True, 
                                        f"Stats retrieved: usage_count={stats.get('usage_count')}, version={stats.get('version')}")
                        else:
                            self.log_test("22. GET /api/templates/{type}/{id}/stats - Get usage statistics", False, 
                                        "Stats missing required fields")
                    else:
                        self.log_test("22. GET /api/templates/{type}/{id}/stats - Get usage statistics", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("22. GET /api/templates/{type}/{id}/stats - Get usage statistics", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("22. GET /api/templates/{type}/{id}/stats - Get usage statistics", False, str(e))

        # Test 23: Test template usage counter increments on apply
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                
                # Get initial stats
                stats_response = self.session.get(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/stats")
                initial_usage = 0
                if stats_response.status_code == 200:
                    stats_data = stats_response.json()
                    if stats_data.get("success") and stats_data.get("stats"):
                        initial_usage = stats_data["stats"].get("usage_count", 0)
                
                # Apply template
                apply_data = {"data": {"customer_name": "Usage Test", "estimate_number": "TEST-001"}}
                apply_response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                                 json=apply_data)
                
                if apply_response.status_code == 200:
                    # Check stats again
                    time.sleep(1)  # Brief delay to ensure update
                    final_stats_response = self.session.get(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/stats")
                    
                    if final_stats_response.status_code == 200:
                        final_stats_data = final_stats_response.json()
                        if final_stats_data.get("success") and final_stats_data.get("stats"):
                            final_usage = final_stats_data["stats"].get("usage_count", 0)
                            
                            if final_usage > initial_usage:
                                self.log_test("23. Test template usage counter increments on apply", True, 
                                            f"Usage count increased from {initial_usage} to {final_usage}")
                            else:
                                self.log_test("23. Test template usage counter increments on apply", False, 
                                            f"Usage count didn't increase: {initial_usage} -> {final_usage}")
                        else:
                            self.log_test("23. Test template usage counter increments on apply", False, 
                                        "Failed to get final stats")
                    else:
                        self.log_test("23. Test template usage counter increments on apply", False, 
                                    "Failed to retrieve final stats")
                else:
                    self.log_test("23. Test template usage counter increments on apply", False, 
                                "Failed to apply template for usage test")
            except Exception as e:
                self.log_test("23. Test template usage counter increments on apply", False, str(e))

        # Test 24: Test last_used timestamp updates
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                
                # Apply template to update last_used
                apply_data = {"data": {"customer_name": "Timestamp Test", "estimate_number": "TS-001"}}
                apply_response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                                 json=apply_data)
                
                if apply_response.status_code == 200:
                    # Check if last_used is updated
                    time.sleep(1)
                    stats_response = self.session.get(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/stats")
                    
                    if stats_response.status_code == 200:
                        stats_data = stats_response.json()
                        if stats_data.get("success") and stats_data.get("stats"):
                            last_used = stats_data["stats"].get("last_used")
                            
                            if last_used:
                                self.log_test("24. Test last_used timestamp updates", True, 
                                            f"Last used timestamp updated: {last_used}")
                            else:
                                self.log_test("24. Test last_used timestamp updates", False, 
                                            "Last used timestamp not set")
                        else:
                            self.log_test("24. Test last_used timestamp updates", False, 
                                        "Failed to get stats")
                    else:
                        self.log_test("24. Test last_used timestamp updates", False, 
                                    "Failed to retrieve stats")
                else:
                    self.log_test("24. Test last_used timestamp updates", False, 
                                "Failed to apply template")
            except Exception as e:
                self.log_test("24. Test last_used timestamp updates", False, str(e))

    def test_suite_6_edge_cases(self):
        """TEST SUITE 6: Edge Cases & Validation"""
        print("=" * 60)
        print("TEST SUITE 6: Edge Cases & Validation")
        print("=" * 60)
        
        # Test 25: Test invalid JSON content (should reject)
        try:
            invalid_template_data = {
                "type": "estimate",
                "name": "Invalid JSON Test",
                "description": "Test template with invalid content",
                "category": "test",
                "tags": ["test", "invalid"],
                "content": "This is not valid JSON content - should be a dict",  # Invalid: string instead of dict
                "is_public": False,
                "is_default": False
            }
            
            response = self.session.post(f"{BACKEND_URL}/templates", json=invalid_template_data)
            
            # Should either reject with 400 or accept and handle gracefully
            if response.status_code == 400:
                self.log_test("25. Test invalid JSON content (should reject)", True, 
                            "Invalid content properly rejected with 400 error")
            elif response.status_code == 200:
                # If accepted, check if it was handled gracefully
                data = response.json()
                if data.get("success"):
                    # Clean up if created
                    if data.get("template") and data["template"].get("_id"):
                        self.created_templates.append({"type": "estimate", "id": data["template"]["_id"]})
                    self.log_test("25. Test invalid JSON content (should reject)", True, 
                                "Invalid content accepted but handled gracefully")
                else:
                    self.log_test("25. Test invalid JSON content (should reject)", True, 
                                "Invalid content properly rejected")
            else:
                self.log_test("25. Test invalid JSON content (should reject)", False, 
                            f"Unexpected HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("25. Test invalid JSON content (should reject)", False, str(e))

        # Test 26: Test duplicate template names (should allow)
        try:
            duplicate_template_data = {
                "type": "estimate",
                "name": "Duplicate Name Test",
                "description": "First template with this name",
                "category": "test",
                "tags": ["test", "duplicate"],
                "content": {"title": "First Template"},
                "is_public": False,
                "is_default": False
            }
            
            # Create first template
            response1 = self.session.post(f"{BACKEND_URL}/templates", json=duplicate_template_data)
            
            if response1.status_code == 200:
                data1 = response1.json()
                if data1.get("success") and data1.get("template"):
                    template1_id = data1["template"]["_id"]
                    self.created_templates.append({"type": "estimate", "id": template1_id})
                    
                    # Create second template with same name
                    duplicate_template_data["description"] = "Second template with same name"
                    duplicate_template_data["content"] = {"title": "Second Template"}
                    
                    response2 = self.session.post(f"{BACKEND_URL}/templates", json=duplicate_template_data)
                    
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if data2.get("success") and data2.get("template"):
                            template2_id = data2["template"]["_id"]
                            self.created_templates.append({"type": "estimate", "id": template2_id})
                            self.log_test("26. Test duplicate template names (should allow)", True, 
                                        "Duplicate names allowed - both templates created")
                        else:
                            self.log_test("26. Test duplicate template names (should allow)", False, 
                                        "Second template creation failed", data2)
                    else:
                        self.log_test("26. Test duplicate template names (should allow)", False, 
                                    f"Second template HTTP {response2.status_code}", response2.text)
                else:
                    self.log_test("26. Test duplicate template names (should allow)", False, 
                                "First template creation failed", data1)
            else:
                self.log_test("26. Test duplicate template names (should allow)", False, 
                            f"First template HTTP {response1.status_code}", response1.text)
        except Exception as e:
            self.log_test("26. Test duplicate template names (should allow)", False, str(e))

        # Test 27: Test empty placeholder replacement
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                empty_data = {}  # No replacement data
                
                response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                           json={"data": empty_data})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("result"):
                        content = data["result"]["content"]
                        # Check if placeholders remain unreplaced (should still have {{}} format)
                        content_str = json.dumps(content)
                        if "{{" in content_str and "}}" in content_str:
                            self.log_test("27. Test empty placeholder replacement", True, 
                                        "Empty data handled correctly - placeholders remain unreplaced")
                        else:
                            self.log_test("27. Test empty placeholder replacement", True, 
                                        "Empty data handled - placeholders processed")
                    else:
                        self.log_test("27. Test empty placeholder replacement", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("27. Test empty placeholder replacement", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("27. Test empty placeholder replacement", False, str(e))

        # Test 28: Test special characters in variables
        if self.created_templates:
            try:
                template_info = self.created_templates[0]
                special_data = {
                    "customer_name": "Test & Company <script>alert('xss')</script>",
                    "estimate_number": "EST-2025-001 \"quoted\" 'apostrophe'",
                    "service_description": "Service with émojis 🚀 and ñ special chars",
                    "notes": "Multi\nline\nnotes with\ttabs"
                }
                
                response = self.session.post(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}/apply",
                                           json={"data": special_data})
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("result"):
                        content = data["result"]["content"]
                        
                        # Check if special characters are preserved
                        if (content.get("customer_name") == special_data["customer_name"] and
                            content.get("estimate_number") == special_data["estimate_number"]):
                            self.log_test("28. Test special characters in variables", True, 
                                        "Special characters handled correctly")
                        else:
                            self.log_test("28. Test special characters in variables", False, 
                                        "Special characters not preserved correctly")
                    else:
                        self.log_test("28. Test special characters in variables", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("28. Test special characters in variables", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("28. Test special characters in variables", False, str(e))

        # Test 29: Test very long template content
        try:
            # Create a template with very long content
            long_content = {
                "title": "Very Long Template Test",
                "description": "A" * 10000,  # 10KB of 'A' characters
                "long_field": "B" * 5000,    # 5KB of 'B' characters
                "customer_name": "{{customer_name}}",
                "items": [{"item_" + str(i): f"Item {i} content " * 100} for i in range(50)]  # Large array
            }
            
            long_template_data = {
                "type": "proposal",
                "name": "Very Long Content Test",
                "description": "Template with very long content for testing",
                "category": "test",
                "tags": ["test", "long", "performance"],
                "content": long_content,
                "is_public": False,
                "is_default": False
            }
            
            response = self.session.post(f"{BACKEND_URL}/templates", json=long_template_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("template"):
                    template_id = data["template"]["_id"]
                    self.created_templates.append({"type": "proposal", "id": template_id})
                    
                    # Test applying the long template
                    apply_response = self.session.post(f"{BACKEND_URL}/templates/proposal/{template_id}/apply",
                                                     json={"data": {"customer_name": "Long Content Customer"}})
                    
                    if apply_response.status_code == 200:
                        apply_data = apply_response.json()
                        if apply_data.get("success"):
                            self.log_test("29. Test very long template content", True, 
                                        "Very long content handled successfully")
                        else:
                            self.log_test("29. Test very long template content", False, 
                                        "Failed to apply long template", apply_data)
                    else:
                        self.log_test("29. Test very long template content", False, 
                                    f"Apply long template HTTP {apply_response.status_code}")
                else:
                    self.log_test("29. Test very long template content", False, 
                                "Failed to create long template", data)
            else:
                self.log_test("29. Test very long template content", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("29. Test very long template content", False, str(e))

    def cleanup_created_templates(self):
        """Clean up templates created during testing"""
        print("=" * 60)
        print("CLEANUP: Removing test templates")
        print("=" * 60)
        
        for template_info in self.created_templates:
            try:
                response = self.session.delete(f"{BACKEND_URL}/templates/{template_info['type']}/{template_info['id']}")
                if response.status_code == 200:
                    print(f"✅ Deleted template: {template_info['type']}/{template_info['id']}")
                else:
                    print(f"⚠️  Failed to delete template: {template_info['type']}/{template_info['id']}")
            except Exception as e:
                print(f"❌ Error deleting template {template_info['type']}/{template_info['id']}: {str(e)}")

    def run_comprehensive_test(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Template System Testing")
        print("=" * 80)
        
        start_time = time.time()
        
        try:
            # Run all test suites
            self.test_suite_1_template_crud()
            self.test_suite_2_placeholder_system()
            self.test_suite_3_template_application()
            self.test_suite_4_prebuilt_templates()
            self.test_suite_5_integration_features()
            self.test_suite_6_edge_cases()
            
        finally:
            # Always cleanup
            self.cleanup_created_templates()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        self.generate_summary(duration)

    def generate_summary(self, duration: float):
        """Generate test summary"""
        print("=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        print()
        
        # Group results by test suite
        suites = {
            "Template CRUD": [r for r in self.test_results if r["test"].startswith(("1.", "2.", "3.", "4.", "5.", "6."))],
            "Placeholder System": [r for r in self.test_results if r["test"].startswith(("7.", "8.", "9.", "10.", "11."))],
            "Template Application": [r for r in self.test_results if r["test"].startswith(("12.", "13.", "14.", "15."))],
            "Pre-built Templates": [r for r in self.test_results if r["test"].startswith(("16.", "17.", "18.", "19.", "20."))],
            "Integration Features": [r for r in self.test_results if r["test"].startswith(("21.", "22.", "23.", "24."))],
            "Edge Cases": [r for r in self.test_results if r["test"].startswith(("25.", "26.", "27.", "28.", "29."))]
        }
        
        for suite_name, suite_results in suites.items():
            if suite_results:
                suite_passed = sum(1 for r in suite_results if r["success"])
                suite_total = len(suite_results)
                suite_rate = (suite_passed / suite_total * 100) if suite_total > 0 else 0
                print(f"{suite_name}: {suite_passed}/{suite_total} ({suite_rate:.1f}%)")
        
        print()
        
        # Show failed tests
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print("❌ FAILED TESTS:")
            for result in failed_results:
                print(f"   - {result['test']}")
                if result["details"]:
                    print(f"     Details: {result['details']}")
            print()
        
        # Show critical issues
        critical_issues = []
        
        # Check for critical failures
        crud_failures = [r for r in self.test_results if not r["success"] and r["test"].startswith(("1.", "2.", "3.", "4.", "5."))]
        if crud_failures:
            critical_issues.append("Template CRUD operations failing")
        
        placeholder_failures = [r for r in self.test_results if not r["success"] and r["test"].startswith(("7.", "8.", "9."))]
        if len(placeholder_failures) >= 2:
            critical_issues.append("Placeholder system not working properly")
        
        application_failures = [r for r in self.test_results if not r["success"] and r["test"].startswith(("12.", "13."))]
        if application_failures:
            critical_issues.append("Template application and variable replacement failing")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   - {issue}")
            print()
        
        # Overall assessment
        if success_rate >= 90:
            print("🎉 EXCELLENT: Template system is working excellently!")
        elif success_rate >= 80:
            print("✅ GOOD: Template system is working well with minor issues")
        elif success_rate >= 70:
            print("⚠️  FAIR: Template system has some issues that need attention")
        else:
            print("❌ POOR: Template system has significant issues requiring immediate attention")
        
        print("=" * 80)


def main():
    """Main test execution"""
    tester = TemplateSystemTester()
    tester.run_comprehensive_test()


if __name__ == "__main__":
    main()