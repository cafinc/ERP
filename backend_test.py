#!/usr/bin/env python3
"""
Backend API Testing for Unified Communications System
Tests all unified communications endpoints
"""

import requests
import json
import os
from datetime import datetime
import time

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://snowtrack-admin-3.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"

def test_unified_communications():
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
            "job_title": "Snow Plow Operator",
            "department": "Operations",
            "hire_date": datetime.now().isoformat(),
            "employment_type": "full_time",
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