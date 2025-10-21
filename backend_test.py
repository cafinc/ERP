#!/usr/bin/env python3
"""
Backend API Testing for HR Module and Integration Hub
Tests all HR and Integration endpoints with comprehensive CRUD operations
"""

import requests
import json
from datetime import datetime, timedelta
import uuid
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://plowpro-admin-1.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            "hr_module": {},
            "integration_hub": {},
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0
        }
        self.created_resources = {
            "employees": [],
            "time_entries": [],
            "pto_requests": [],
            "trainings": [],
            "employee_trainings": [],
            "performance_reviews": [],
            "integrations": []
        }

    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        self.test_results["total_tests"] += 1
        if success:
            self.test_results["passed_tests"] += 1
            status = "✅ PASS"
        else:
            self.test_results["failed_tests"] += 1
            status = "❌ FAIL"
        
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None

    # ==================== HR MODULE TESTS ====================

    def test_hr_employee_management(self):
        """Test Employee Management APIs"""
        print("=== Testing HR Employee Management ===")
        
        # Test 1: Create Employee
        employee_data = {
            "first_name": "Sarah",
            "last_name": "Johnson",
            "email": "sarah.johnson@company.com",
            "phone": "+1-555-0123",
            "department": "Operations",
            "position": "Snow Removal Specialist",
            "hire_date": "2024-01-15",
            "hourly_rate": 25.50,
            "is_active": True
        }
        
        response = self.make_request("POST", "/hr/employees", employee_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "employee" in data:
                employee_id = data["employee"]["id"]
                self.created_resources["employees"].append(employee_id)
                self.log_test("Create Employee", True, f"Employee ID: {employee_id}")
            else:
                self.log_test("Create Employee", False, "Invalid response structure", data)
        else:
            self.log_test("Create Employee", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Get All Employees
        response = self.make_request("GET", "/hr/employees")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "employees" in data:
                self.log_test("Get All Employees", True, f"Found {len(data['employees'])} employees")
            else:
                self.log_test("Get All Employees", False, "Invalid response structure", data)
        else:
            self.log_test("Get All Employees", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Get Specific Employee
        if self.created_resources["employees"]:
            employee_id = self.created_resources["employees"][0]
            response = self.make_request("GET", f"/hr/employees/{employee_id}")
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success") and "employee" in data:
                    self.log_test("Get Specific Employee", True, f"Retrieved employee: {data['employee']['first_name']} {data['employee']['last_name']}")
                else:
                    self.log_test("Get Specific Employee", False, "Invalid response structure", data)
            else:
                self.log_test("Get Specific Employee", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 4: Update Employee
        if self.created_resources["employees"]:
            employee_id = self.created_resources["employees"][0]
            update_data = {
                "hourly_rate": 27.00,
                "department": "Senior Operations"
            }
            response = self.make_request("PUT", f"/hr/employees/{employee_id}", update_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update Employee", True, "Employee updated successfully")
                else:
                    self.log_test("Update Employee", False, "Update failed", data)
            else:
                self.log_test("Update Employee", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 5: Delete Employee (Soft Delete)
        if self.created_resources["employees"]:
            employee_id = self.created_resources["employees"][0]
            response = self.make_request("DELETE", f"/hr/employees/{employee_id}")
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Employee (Soft Delete)", True, "Employee terminated successfully")
                else:
                    self.log_test("Delete Employee (Soft Delete)", False, "Delete failed", data)
            else:
                self.log_test("Delete Employee (Soft Delete)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_hr_time_attendance(self):
        """Test Time & Attendance APIs"""
        print("=== Testing HR Time & Attendance ===")
        
        # First create an employee for time tracking
        employee_data = {
            "first_name": "Mike",
            "last_name": "Wilson",
            "email": "mike.wilson@company.com",
            "phone": "+1-555-0124",
            "department": "Operations",
            "position": "Equipment Operator",
            "hire_date": "2024-01-20",
            "hourly_rate": 28.00,
            "is_active": True
        }
        
        response = self.make_request("POST", "/hr/employees", employee_data)
        employee_id = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                employee_id = data["employee"]["id"]
                self.created_resources["employees"].append(employee_id)

        if not employee_id:
            self.log_test("Time & Attendance Setup", False, "Could not create employee for time tracking")
            return

        # Test 1: Clock In (Create Time Entry)
        time_entry_data = {
            "employee_id": employee_id,
            "clock_in": datetime.utcnow().isoformat(),
            "location": "Main Office",
            "notes": "Starting morning shift"
        }
        
        response = self.make_request("POST", "/hr/time-entries", time_entry_data)
        time_entry_id = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "time_entry" in data:
                time_entry_id = data["time_entry"]["id"]
                self.created_resources["time_entries"].append(time_entry_id)
                self.log_test("Clock In (Create Time Entry)", True, f"Time Entry ID: {time_entry_id}")
            else:
                self.log_test("Clock In (Create Time Entry)", False, "Invalid response structure", data)
        else:
            self.log_test("Clock In (Create Time Entry)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Clock Out
        if time_entry_id:
            clock_out_time = (datetime.utcnow() + timedelta(hours=8)).isoformat()
            response = self.make_request("PUT", f"/hr/time-entries/{time_entry_id}/clock-out", {"clock_out_time": clock_out_time})
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Clock Out", True, "Successfully clocked out")
                else:
                    self.log_test("Clock Out", False, "Clock out failed", data)
            else:
                self.log_test("Clock Out", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Get Time Entries
        response = self.make_request("GET", "/hr/time-entries", params={"employee_id": employee_id})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "time_entries" in data:
                self.log_test("Get Time Entries", True, f"Found {len(data['time_entries'])} time entries")
            else:
                self.log_test("Get Time Entries", False, "Invalid response structure", data)
        else:
            self.log_test("Get Time Entries", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 4: Approve Time Entry
        if time_entry_id:
            response = self.make_request("PUT", f"/hr/time-entries/{time_entry_id}/approve", {"approved_by": "manager_001"})
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Approve Time Entry", True, "Time entry approved")
                else:
                    self.log_test("Approve Time Entry", False, "Approval failed", data)
            else:
                self.log_test("Approve Time Entry", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 5: Reject Time Entry (create another entry first)
        time_entry_data2 = {
            "employee_id": employee_id,
            "clock_in": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "location": "Remote",
            "notes": "Working from home"
        }
        
        response = self.make_request("POST", "/hr/time-entries", time_entry_data2)
        time_entry_id2 = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                time_entry_id2 = data["time_entry"]["id"]
                self.created_resources["time_entries"].append(time_entry_id2)

        if time_entry_id2:
            response = self.make_request("PUT", f"/hr/time-entries/{time_entry_id2}/reject", {"approved_by": "manager_001"})
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Reject Time Entry", True, "Time entry rejected")
                else:
                    self.log_test("Reject Time Entry", False, "Rejection failed", data)
            else:
                self.log_test("Reject Time Entry", False, f"Status: {response.status_code if response else 'No response'}")

    def test_hr_pto_management(self):
        """Test PTO Management APIs"""
        print("=== Testing HR PTO Management ===")
        
        # Use existing employee or create one
        employee_id = None
        if self.created_resources["employees"]:
            employee_id = self.created_resources["employees"][0]
        else:
            # Create employee for PTO testing
            employee_data = {
                "first_name": "Lisa",
                "last_name": "Chen",
                "email": "lisa.chen@company.com",
                "phone": "+1-555-0125",
                "department": "Administration",
                "position": "HR Coordinator",
                "hire_date": "2024-01-10",
                "hourly_rate": 30.00,
                "is_active": True
            }
            
            response = self.make_request("POST", "/hr/employees", employee_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    employee_id = data["employee"]["id"]
                    self.created_resources["employees"].append(employee_id)

        if not employee_id:
            self.log_test("PTO Management Setup", False, "Could not get employee for PTO testing")
            return

        # Test 1: Create PTO Request
        pto_data = {
            "employee_id": employee_id,
            "pto_type": "vacation",
            "start_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=32)).isoformat(),
            "total_days": 3,
            "reason": "Family vacation",
            "notes": "Pre-planned vacation to Hawaii"
        }
        
        response = self.make_request("POST", "/hr/pto-requests", pto_data)
        pto_request_id = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "pto_request" in data:
                pto_request_id = data["pto_request"]["id"]
                self.created_resources["pto_requests"].append(pto_request_id)
                self.log_test("Create PTO Request", True, f"PTO Request ID: {pto_request_id}")
            else:
                self.log_test("Create PTO Request", False, "Invalid response structure", data)
        else:
            self.log_test("Create PTO Request", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Get PTO Requests
        response = self.make_request("GET", "/hr/pto-requests", params={"employee_id": employee_id})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "pto_requests" in data:
                self.log_test("Get PTO Requests", True, f"Found {len(data['pto_requests'])} PTO requests")
            else:
                self.log_test("Get PTO Requests", False, "Invalid response structure", data)
        else:
            self.log_test("Get PTO Requests", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Approve PTO Request
        if pto_request_id:
            response = self.make_request("PUT", f"/hr/pto-requests/{pto_request_id}/approve", {
                "reviewed_by": "hr_manager",
                "review_notes": "Approved - adequate coverage arranged"
            })
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Approve PTO Request", True, "PTO request approved")
                else:
                    self.log_test("Approve PTO Request", False, "Approval failed", data)
            else:
                self.log_test("Approve PTO Request", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 4: Create and Deny PTO Request
        pto_data2 = {
            "employee_id": employee_id,
            "pto_type": "personal",
            "start_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "total_days": 1,
            "reason": "Personal appointment",
            "notes": "Doctor appointment"
        }
        
        response = self.make_request("POST", "/hr/pto-requests", pto_data2)
        pto_request_id2 = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                pto_request_id2 = data["pto_request"]["id"]
                self.created_resources["pto_requests"].append(pto_request_id2)

        if pto_request_id2:
            response = self.make_request("PUT", f"/hr/pto-requests/{pto_request_id2}/deny", {
                "reviewed_by": "hr_manager",
                "review_notes": "Denied - insufficient notice"
            })
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Deny PTO Request", True, "PTO request denied")
                else:
                    self.log_test("Deny PTO Request", False, "Denial failed", data)
            else:
                self.log_test("Deny PTO Request", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 5: Get PTO Balance
        response = self.make_request("GET", f"/hr/pto-balance/{employee_id}")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "pto_balance" in data:
                balance = data["pto_balance"]
                self.log_test("Get PTO Balance", True, f"Vacation: {balance.get('vacation_balance', 0)}, Sick: {balance.get('sick_balance', 0)}")
            else:
                self.log_test("Get PTO Balance", False, "Invalid response structure", data)
        else:
            self.log_test("Get PTO Balance", False, f"Status: {response.status_code if response else 'No response'}")

    def test_hr_training_certifications(self):
        """Test Training & Certifications APIs"""
        print("=== Testing HR Training & Certifications ===")
        
        # Test 1: Create Training Program
        training_data = {
            "name": "Safety Training 2024",
            "description": "Annual safety training for all field personnel",
            "duration_hours": 8,
            "expiration_months": 12,
            "is_mandatory": True,
            "category": "Safety"
        }
        
        response = self.make_request("POST", "/hr/trainings", training_data)
        training_id = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "training" in data:
                training_id = data["training"]["id"]
                self.created_resources["trainings"].append(training_id)
                self.log_test("Create Training Program", True, f"Training ID: {training_id}")
            else:
                self.log_test("Create Training Program", False, "Invalid response structure", data)
        else:
            self.log_test("Create Training Program", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Get All Trainings
        response = self.make_request("GET", "/hr/trainings")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "trainings" in data:
                self.log_test("Get All Trainings", True, f"Found {len(data['trainings'])} training programs")
            else:
                self.log_test("Get All Trainings", False, "Invalid response structure", data)
        else:
            self.log_test("Get All Trainings", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Assign Training to Employee
        employee_id = None
        if self.created_resources["employees"]:
            employee_id = self.created_resources["employees"][0]
        
        if training_id and employee_id:
            assignment_data = {
                "employee_id": employee_id,
                "training_id": training_id,
                "assigned_date": datetime.utcnow().isoformat(),
                "due_date": (datetime.utcnow() + timedelta(days=30)).isoformat()
            }
            
            response = self.make_request("POST", "/hr/employee-trainings", assignment_data)
            employee_training_id = None
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success") and "employee_training" in data:
                    employee_training_id = data["employee_training"]["id"]
                    self.created_resources["employee_trainings"].append(employee_training_id)
                    self.log_test("Assign Training to Employee", True, f"Assignment ID: {employee_training_id}")
                else:
                    self.log_test("Assign Training to Employee", False, "Invalid response structure", data)
            else:
                self.log_test("Assign Training to Employee", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 4: Get Employee Trainings
        response = self.make_request("GET", "/hr/employee-trainings", params={"employee_id": employee_id} if employee_id else None)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "employee_trainings" in data:
                self.log_test("Get Employee Trainings", True, f"Found {len(data['employee_trainings'])} training assignments")
            else:
                self.log_test("Get Employee Trainings", False, "Invalid response structure", data)
        else:
            self.log_test("Get Employee Trainings", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 5: Update Training Status
        if self.created_resources["employee_trainings"]:
            employee_training_id = self.created_resources["employee_trainings"][0]
            update_data = {
                "status": "completed",
                "completion_date": datetime.utcnow().isoformat(),
                "score": 95,
                "notes": "Excellent performance on safety assessment"
            }
            
            response = self.make_request("PUT", f"/hr/employee-trainings/{employee_training_id}", update_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update Training Status", True, "Training status updated to completed")
                else:
                    self.log_test("Update Training Status", False, "Update failed", data)
            else:
                self.log_test("Update Training Status", False, f"Status: {response.status_code if response else 'No response'}")

    def test_hr_performance_management(self):
        """Test Performance Management APIs"""
        print("=== Testing HR Performance Management ===")
        
        # Need at least 2 employees (employee and reviewer)
        employee_id = None
        reviewer_id = None
        
        if len(self.created_resources["employees"]) >= 2:
            employee_id = self.created_resources["employees"][0]
            reviewer_id = self.created_resources["employees"][1]
        elif len(self.created_resources["employees"]) == 1:
            employee_id = self.created_resources["employees"][0]
            # Create a reviewer
            reviewer_data = {
                "first_name": "David",
                "last_name": "Manager",
                "email": "david.manager@company.com",
                "phone": "+1-555-0126",
                "department": "Management",
                "position": "Operations Manager",
                "hire_date": "2023-01-01",
                "hourly_rate": 45.00,
                "is_active": True
            }
            
            response = self.make_request("POST", "/hr/employees", reviewer_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    reviewer_id = data["employee"]["id"]
                    self.created_resources["employees"].append(reviewer_id)
        else:
            # Create both employee and reviewer
            for i, (first_name, position, rate) in enumerate([("John", "Technician", 25.00), ("Jane", "Supervisor", 35.00)]):
                emp_data = {
                    "first_name": first_name,
                    "last_name": "TestEmployee" + str(i),
                    "email": f"{first_name.lower()}.testemployee{i}@company.com",
                    "phone": f"+1-555-012{7+i}",
                    "department": "Operations",
                    "position": position,
                    "hire_date": "2024-01-01",
                    "hourly_rate": rate,
                    "is_active": True
                }
                
                response = self.make_request("POST", "/hr/employees", emp_data)
                if response and response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        emp_id = data["employee"]["id"]
                        self.created_resources["employees"].append(emp_id)
                        if i == 0:
                            employee_id = emp_id
                        else:
                            reviewer_id = emp_id

        if not employee_id or not reviewer_id:
            self.log_test("Performance Management Setup", False, "Could not create employees for performance review testing")
            return

        # Test 1: Create Performance Review
        review_data = {
            "employee_id": employee_id,
            "reviewer_id": reviewer_id,
            "review_period_start": (datetime.utcnow() - timedelta(days=90)).isoformat(),
            "review_period_end": datetime.utcnow().isoformat(),
            "scheduled_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "review_type": "quarterly"
        }
        
        response = self.make_request("POST", "/hr/performance-reviews", review_data)
        review_id = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "review" in data:
                review_id = data["review"]["id"]
                self.created_resources["performance_reviews"].append(review_id)
                self.log_test("Create Performance Review", True, f"Review ID: {review_id}")
            else:
                self.log_test("Create Performance Review", False, "Invalid response structure", data)
        else:
            self.log_test("Create Performance Review", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Get Performance Reviews
        response = self.make_request("GET", "/hr/performance-reviews", params={"employee_id": employee_id})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "reviews" in data:
                self.log_test("Get Performance Reviews", True, f"Found {len(data['reviews'])} performance reviews")
            else:
                self.log_test("Get Performance Reviews", False, "Invalid response structure", data)
        else:
            self.log_test("Get Performance Reviews", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Update Performance Review
        if review_id:
            update_data = {
                "status": "completed",
                "overall_rating": 4,
                "goals": ["Improve time management", "Complete safety certification"],
                "feedback": "Strong performance with room for growth in leadership skills",
                "completed_date": datetime.utcnow().isoformat()
            }
            
            response = self.make_request("PUT", f"/hr/performance-reviews/{review_id}", update_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update Performance Review", True, "Performance review updated successfully")
                else:
                    self.log_test("Update Performance Review", False, "Update failed", data)
            else:
                self.log_test("Update Performance Review", False, f"Status: {response.status_code if response else 'No response'}")

    def test_hr_payroll_settings(self):
        """Test Payroll Settings APIs"""
        print("=== Testing HR Payroll Settings ===")
        
        # Test 1: Get Payroll Settings
        response = self.make_request("GET", "/hr/payroll-settings")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "settings" in data:
                self.log_test("Get Payroll Settings", True, f"Company: {data['settings'].get('company_name', 'N/A')}")
            else:
                self.log_test("Get Payroll Settings", False, "Invalid response structure", data)
        else:
            self.log_test("Get Payroll Settings", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Update Payroll Settings
        settings_data = {
            "company_name": "Snow Removal Services Inc.",
            "pay_frequency": "bi_weekly",
            "overtime_threshold_hours": 40.0,
            "overtime_multiplier": 1.5,
            "double_time_multiplier": 2.0
        }
        
        response = self.make_request("PUT", "/hr/payroll-settings", settings_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Update Payroll Settings", True, "Payroll settings updated successfully")
            else:
                self.log_test("Update Payroll Settings", False, "Update failed", data)
        else:
            self.log_test("Update Payroll Settings", False, f"Status: {response.status_code if response else 'No response'}")

    # ==================== INTEGRATION HUB TESTS ====================

    def test_integration_management(self):
        """Test Integration Management APIs"""
        print("=== Testing Integration Management ===")
        
        # Test 1: Create Integration
        integration_data = {
            "integration_type": "quickbooks",
            "name": "QuickBooks Online",
            "description": "Accounting and payroll integration",
            "settings": {
                "sync_payroll": True,
                "sync_time_tracking": True,
                "auto_sync": False
            }
        }
        
        response = self.make_request("POST", "/integrations", integration_data)
        integration_id = None
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "integration" in data:
                integration_id = data["integration"]["id"]
                self.created_resources["integrations"].append(integration_id)
                self.log_test("Create Integration", True, f"Integration ID: {integration_id}")
            else:
                self.log_test("Create Integration", False, "Invalid response structure", data)
        else:
            self.log_test("Create Integration", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Get All Integrations
        response = self.make_request("GET", "/integrations")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "integrations" in data:
                self.log_test("Get All Integrations", True, f"Found {len(data['integrations'])} integrations")
            else:
                self.log_test("Get All Integrations", False, "Invalid response structure", data)
        else:
            self.log_test("Get All Integrations", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Get Specific Integration
        if integration_id:
            response = self.make_request("GET", f"/integrations/{integration_id}")
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success") and "integration" in data:
                    self.log_test("Get Specific Integration", True, f"Retrieved integration: {data['integration']['name']}")
                else:
                    self.log_test("Get Specific Integration", False, "Invalid response structure", data)
            else:
                self.log_test("Get Specific Integration", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 4: Update Integration
        if integration_id:
            update_data = {
                "name": "QuickBooks Online Pro",
                "settings": {
                    "sync_payroll": True,
                    "sync_time_tracking": True,
                    "auto_sync": True
                }
            }
            
            response = self.make_request("PUT", f"/integrations/{integration_id}", update_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update Integration", True, "Integration updated successfully")
                else:
                    self.log_test("Update Integration", False, "Update failed", data)
            else:
                self.log_test("Update Integration", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 5: Connect Integration (Mock)
        if integration_id:
            response = self.make_request("POST", f"/integrations/{integration_id}/connect")
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Connect Integration (Mock)", True, f"Connected: {data.get('message', 'Success')}")
                else:
                    self.log_test("Connect Integration (Mock)", False, "Connection failed", data)
            else:
                self.log_test("Connect Integration (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 6: Trigger Sync (Mock)
        if integration_id:
            response = self.make_request("POST", f"/integrations/{integration_id}/sync", {"sync_type": "incremental"})
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Trigger Sync (Mock)", True, f"Sync completed: {data.get('message', 'Success')}")
                else:
                    self.log_test("Trigger Sync (Mock)", False, "Sync failed", data)
            else:
                self.log_test("Trigger Sync (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 7: Disconnect Integration
        if integration_id:
            response = self.make_request("POST", f"/integrations/{integration_id}/disconnect")
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Disconnect Integration", True, "Integration disconnected successfully")
                else:
                    self.log_test("Disconnect Integration", False, "Disconnection failed", data)
            else:
                self.log_test("Disconnect Integration", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 8: Delete Integration
        if integration_id:
            response = self.make_request("DELETE", f"/integrations/{integration_id}")
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Integration", True, "Integration deleted successfully")
                    self.created_resources["integrations"].remove(integration_id)
                else:
                    self.log_test("Delete Integration", False, "Deletion failed", data)
            else:
                self.log_test("Delete Integration", False, f"Status: {response.status_code if response else 'No response'}")

    def test_quickbooks_integration(self):
        """Test QuickBooks Integration APIs"""
        print("=== Testing QuickBooks Integration ===")
        
        # Test 1: Sync QuickBooks Payroll (Mock)
        response = self.make_request("POST", "/integrations/quickbooks/payroll/sync")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Sync QuickBooks Payroll (Mock)", True, f"Payroll sync: {data.get('message', 'Success')}")
            else:
                self.log_test("Sync QuickBooks Payroll (Mock)", False, "Payroll sync failed", data)
        else:
            self.log_test("Sync QuickBooks Payroll (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Sync QuickBooks Time Tracking (Mock)
        response = self.make_request("POST", "/integrations/quickbooks/time-tracking/sync")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Sync QuickBooks Time Tracking (Mock)", True, f"Time tracking sync: {data.get('message', 'Success')}")
            else:
                self.log_test("Sync QuickBooks Time Tracking (Mock)", False, "Time tracking sync failed", data)
        else:
            self.log_test("Sync QuickBooks Time Tracking (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_microsoft365_integration(self):
        """Test Microsoft 365 Integration APIs"""
        print("=== Testing Microsoft 365 Integration ===")
        
        # Test 1: Setup Microsoft 365 SSO (Mock)
        response = self.make_request("POST", "/integrations/microsoft365/sso/setup")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Setup Microsoft 365 SSO (Mock)", True, f"SSO setup: {data.get('message', 'Success')}")
            else:
                self.log_test("Setup Microsoft 365 SSO (Mock)", False, "SSO setup failed", data)
        else:
            self.log_test("Setup Microsoft 365 SSO (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 2: Sync Microsoft Teams (Mock)
        response = self.make_request("POST", "/integrations/microsoft365/teams/sync")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Sync Microsoft Teams (Mock)", True, f"Teams sync: {data.get('message', 'Success')}")
            else:
                self.log_test("Sync Microsoft Teams (Mock)", False, "Teams sync failed", data)
        else:
            self.log_test("Sync Microsoft Teams (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 3: Sync Outlook Calendar (Mock)
        response = self.make_request("POST", "/integrations/microsoft365/outlook/sync")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Sync Outlook Calendar (Mock)", True, f"Outlook sync: {data.get('message', 'Success')}")
            else:
                self.log_test("Sync Outlook Calendar (Mock)", False, "Outlook sync failed", data)
        else:
            self.log_test("Sync Outlook Calendar (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 4: Sync OneDrive (Mock)
        response = self.make_request("POST", "/integrations/microsoft365/onedrive/sync")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Sync OneDrive (Mock)", True, f"OneDrive sync: {data.get('message', 'Success')}")
            else:
                self.log_test("Sync OneDrive (Mock)", False, "OneDrive sync failed", data)
        else:
            self.log_test("Sync OneDrive (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 5: Sync Power BI (Mock)
        response = self.make_request("POST", "/integrations/microsoft365/powerbi/sync")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_test("Sync Power BI (Mock)", True, f"Power BI sync: {data.get('message', 'Success')}")
            else:
                self.log_test("Sync Power BI (Mock)", False, "Power BI sync failed", data)
        else:
            self.log_test("Sync Power BI (Mock)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_sync_logs(self):
        """Test Sync Logs APIs"""
        print("=== Testing Sync Logs ===")
        
        # Test 1: Get Sync Logs
        response = self.make_request("GET", "/integrations/sync-logs")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success") and "logs" in data:
                self.log_test("Get Sync Logs", True, f"Found {len(data['logs'])} sync logs")
            else:
                self.log_test("Get Sync Logs", False, "Invalid response structure", data)
        else:
            self.log_test("Get Sync Logs", False, f"Status: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting HR Module and Integration Hub Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # HR Module Tests
        self.test_hr_employee_management()
        self.test_hr_time_attendance()
        self.test_hr_pto_management()
        self.test_hr_training_certifications()
        self.test_hr_performance_management()
        self.test_hr_payroll_settings()
        
        # Integration Hub Tests
        self.test_integration_management()
        self.test_quickbooks_integration()
        self.test_microsoft365_integration()
        self.test_sync_logs()
        
        # Print final results
        print("=" * 80)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"✅ Passed: {self.test_results['passed_tests']}")
        print(f"❌ Failed: {self.test_results['failed_tests']}")
        
        success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if self.test_results['failed_tests'] > 0:
            print("\n⚠️  Some tests failed. Check the detailed output above for specific issues.")
        else:
            print("\n🎉 All tests passed successfully!")
        
        return self.test_results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results['failed_tests'] == 0 else 1)