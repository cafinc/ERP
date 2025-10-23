#!/usr/bin/env python3
"""
HR Module Backend API Testing
Tests all HR-related endpoints to verify current status and identify issues
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Backend URL from frontend/.env
BACKEND_URL = "https://snowtrack-admin-3.preview.emergentagent.com/api"

class HRModuleTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_employees = []
        self.created_time_entries = []
        self.created_pto_requests = []
        self.created_trainings = []
        self.created_reviews = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def test_employee_management(self):
        """Test Employee Management APIs"""
        print("=" * 60)
        print("TEST SUITE 1: Employee Management APIs")
        print("=" * 60)
        
        # Test 1: POST /api/hr/employees - Create employee
        try:
            employee_data = {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@company.com",
                "phone": "+1234567890",
                "department": "Operations",
                "job_title": "Snow Removal Operator",
                "employment_type": "full_time",
                "hire_date": "2025-01-01T00:00:00",
                "hourly_rate": 25.50,
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_phone": "+1234567891",
                "address": "123 Main St, City, State 12345"
            }
            
            response = self.session.post(f"{BACKEND_URL}/hr/employees", json=employee_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success") and data.get("employee"):
                    employee_id = data["employee"]["id"]
                    self.created_employees.append(employee_id)
                    self.log_test("1. POST /api/hr/employees - Create employee", True, 
                                f"Employee created with ID: {employee_id}")
                else:
                    self.log_test("1. POST /api/hr/employees - Create employee", False, 
                                "Response missing success or employee data", data)
            else:
                self.log_test("1. POST /api/hr/employees - Create employee", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("1. POST /api/hr/employees - Create employee", False, str(e))

        # Test 2: GET /api/hr/employees - List employees
        try:
            response = self.session.get(f"{BACKEND_URL}/hr/employees")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("employees"), list):
                    employees = data["employees"]
                    self.log_test("2. GET /api/hr/employees - List employees", True, 
                                f"Found {len(employees)} employees")
                else:
                    self.log_test("2. GET /api/hr/employees - List employees", False, 
                                "Invalid response format", data)
            else:
                self.log_test("2. GET /api/hr/employees - List employees", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("2. GET /api/hr/employees - List employees", False, str(e))

        # Test 3: GET /api/hr/employees/{id} - Get specific employee
        if self.created_employees:
            try:
                employee_id = self.created_employees[0]
                response = self.session.get(f"{BACKEND_URL}/hr/employees/{employee_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("employee"):
                        employee = data["employee"]
                        if employee.get("first_name") == "John":
                            self.log_test("3. GET /api/hr/employees/{id} - Get specific employee", True, 
                                        "Employee retrieved successfully")
                        else:
                            self.log_test("3. GET /api/hr/employees/{id} - Get specific employee", False, 
                                        "Employee data doesn't match")
                    else:
                        self.log_test("3. GET /api/hr/employees/{id} - Get specific employee", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("3. GET /api/hr/employees/{id} - Get specific employee", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("3. GET /api/hr/employees/{id} - Get specific employee", False, str(e))

    def test_time_attendance(self):
        """Test Time & Attendance APIs"""
        print("=" * 60)
        print("TEST SUITE 2: Time & Attendance APIs")
        print("=" * 60)
        
        # Test 4: POST /api/hr/time-entries - Clock in/out
        if self.created_employees:
            try:
                employee_id = self.created_employees[0]
                time_entry_data = {
                    "employee_id": employee_id,
                    "clock_in": datetime.utcnow().isoformat(),
                    "project_id": None,
                    "notes": "Starting morning shift"
                }
                
                response = self.session.post(f"{BACKEND_URL}/hr/time-entries", json=time_entry_data)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get("success") and data.get("time_entry"):
                        entry_id = data["time_entry"]["id"]
                        self.created_time_entries.append(entry_id)
                        self.log_test("4. POST /api/hr/time-entries - Clock in", True, 
                                    f"Time entry created with ID: {entry_id}")
                    else:
                        self.log_test("4. POST /api/hr/time-entries - Clock in", False, 
                                    "Response missing success or time_entry data", data)
                else:
                    self.log_test("4. POST /api/hr/time-entries - Clock in", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("4. POST /api/hr/time-entries - Clock in", False, str(e))
        else:
            self.log_test("4. POST /api/hr/time-entries - Clock in", False, 
                        "No employees available for testing")

        # Test 5: GET /api/hr/time-entries - List time entries
        try:
            response = self.session.get(f"{BACKEND_URL}/hr/time-entries")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("time_entries"), list):
                    entries = data["time_entries"]
                    self.log_test("5. GET /api/hr/time-entries - List time entries", True, 
                                f"Found {len(entries)} time entries")
                else:
                    self.log_test("5. GET /api/hr/time-entries - List time entries", False, 
                                "Invalid response format", data)
            else:
                self.log_test("5. GET /api/hr/time-entries - List time entries", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("5. GET /api/hr/time-entries - List time entries", False, str(e))

        # Test 6: PUT /api/hr/time-entries/{id}/clock-out - Clock out
        if self.created_time_entries:
            try:
                entry_id = self.created_time_entries[0]
                clock_out_data = {
                    "clock_out_time": (datetime.utcnow() + timedelta(hours=8)).isoformat()
                }
                
                response = self.session.put(f"{BACKEND_URL}/hr/time-entries/{entry_id}/clock-out", 
                                          json=clock_out_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_test("6. PUT /api/hr/time-entries/{id}/clock-out - Clock out", True, 
                                    "Successfully clocked out")
                    else:
                        self.log_test("6. PUT /api/hr/time-entries/{id}/clock-out - Clock out", False, 
                                    "Clock out failed", data)
                else:
                    self.log_test("6. PUT /api/hr/time-entries/{id}/clock-out - Clock out", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("6. PUT /api/hr/time-entries/{id}/clock-out - Clock out", False, str(e))

    def test_pto_management(self):
        """Test PTO Management APIs"""
        print("=" * 60)
        print("TEST SUITE 3: PTO Management APIs")
        print("=" * 60)
        
        # Test 7: POST /api/hr/pto-requests - Create PTO request
        if self.created_employees:
            try:
                employee_id = self.created_employees[0]
                pto_data = {
                    "employee_id": employee_id,
                    "pto_type": "vacation",
                    "start_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                    "end_date": (datetime.utcnow() + timedelta(days=32)).isoformat(),
                    "total_days": 3,
                    "reason": "Family vacation",
                    "notes": "Pre-planned vacation"
                }
                
                response = self.session.post(f"{BACKEND_URL}/hr/pto-requests", json=pto_data)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get("success") and data.get("pto_request"):
                        request_id = data["pto_request"]["id"]
                        self.created_pto_requests.append(request_id)
                        self.log_test("7. POST /api/hr/pto-requests - Create PTO request", True, 
                                    f"PTO request created with ID: {request_id}")
                    else:
                        self.log_test("7. POST /api/hr/pto-requests - Create PTO request", False, 
                                    "Response missing success or pto_request data", data)
                else:
                    self.log_test("7. POST /api/hr/pto-requests - Create PTO request", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("7. POST /api/hr/pto-requests - Create PTO request", False, str(e))
        else:
            self.log_test("7. POST /api/hr/pto-requests - Create PTO request", False, 
                        "No employees available for testing")

        # Test 8: GET /api/hr/pto-requests - List PTO requests
        try:
            response = self.session.get(f"{BACKEND_URL}/hr/pto-requests")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("pto_requests"), list):
                    requests = data["pto_requests"]
                    self.log_test("8. GET /api/hr/pto-requests - List PTO requests", True, 
                                f"Found {len(requests)} PTO requests")
                else:
                    self.log_test("8. GET /api/hr/pto-requests - List PTO requests", False, 
                                "Invalid response format", data)
            else:
                self.log_test("8. GET /api/hr/pto-requests - List PTO requests", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("8. GET /api/hr/pto-requests - List PTO requests", False, str(e))

        # Test 9: GET /api/hr/pto-balance/{employee_id} - Get PTO balance
        if self.created_employees:
            try:
                employee_id = self.created_employees[0]
                response = self.session.get(f"{BACKEND_URL}/hr/pto-balance/{employee_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("pto_balance"):
                        balance = data["pto_balance"]
                        self.log_test("9. GET /api/hr/pto-balance/{employee_id} - Get PTO balance", True, 
                                    f"PTO balance retrieved: vacation={balance.get('vacation_balance', 0)}")
                    else:
                        self.log_test("9. GET /api/hr/pto-balance/{employee_id} - Get PTO balance", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test("9. GET /api/hr/pto-balance/{employee_id} - Get PTO balance", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("9. GET /api/hr/pto-balance/{employee_id} - Get PTO balance", False, str(e))

    def test_training_management(self):
        """Test Training & Certifications APIs"""
        print("=" * 60)
        print("TEST SUITE 4: Training & Certifications APIs")
        print("=" * 60)
        
        # Test 10: POST /api/hr/trainings - Create training program
        try:
            training_data = {
                "name": "Snow Removal Safety Training",
                "description": "Comprehensive safety training for snow removal operations",
                "category": "safety",
                "duration_hours": 8,
                "expiration_months": 12,
                "is_mandatory": True,
                "materials": ["Safety manual", "Video training", "Practical assessment"]
            }
            
            response = self.session.post(f"{BACKEND_URL}/hr/trainings", json=training_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success") and data.get("training"):
                    training_id = data["training"]["id"]
                    self.created_trainings.append(training_id)
                    self.log_test("10. POST /api/hr/trainings - Create training program", True, 
                                f"Training created with ID: {training_id}")
                else:
                    self.log_test("10. POST /api/hr/trainings - Create training program", False, 
                                "Response missing success or training data", data)
            else:
                self.log_test("10. POST /api/hr/trainings - Create training program", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("10. POST /api/hr/trainings - Create training program", False, str(e))

        # Test 11: GET /api/hr/trainings - List training programs
        try:
            response = self.session.get(f"{BACKEND_URL}/hr/trainings")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("trainings"), list):
                    trainings = data["trainings"]
                    self.log_test("11. GET /api/hr/trainings - List training programs", True, 
                                f"Found {len(trainings)} training programs")
                else:
                    self.log_test("11. GET /api/hr/trainings - List training programs", False, 
                                "Invalid response format", data)
            else:
                self.log_test("11. GET /api/hr/trainings - List training programs", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("11. GET /api/hr/trainings - List training programs", False, str(e))

        # Test 12: POST /api/hr/employee-trainings - Assign training to employee
        if self.created_employees and self.created_trainings:
            try:
                employee_id = self.created_employees[0]
                training_id = self.created_trainings[0]
                
                assignment_data = {
                    "employee_id": employee_id,
                    "training_id": training_id,
                    "assigned_date": datetime.utcnow().isoformat(),
                    "due_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                    "assigned_by": "HR Manager"
                }
                
                response = self.session.post(f"{BACKEND_URL}/hr/employee-trainings", json=assignment_data)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get("success") and data.get("employee_training"):
                        self.log_test("12. POST /api/hr/employee-trainings - Assign training", True, 
                                    "Training assigned successfully")
                    else:
                        self.log_test("12. POST /api/hr/employee-trainings - Assign training", False, 
                                    "Response missing success or employee_training data", data)
                else:
                    self.log_test("12. POST /api/hr/employee-trainings - Assign training", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("12. POST /api/hr/employee-trainings - Assign training", False, str(e))

    def test_performance_management(self):
        """Test Performance Management APIs"""
        print("=" * 60)
        print("TEST SUITE 5: Performance Management APIs")
        print("=" * 60)
        
        # Test 13: POST /api/hr/performance-reviews - Create performance review
        if len(self.created_employees) >= 2:
            try:
                employee_id = self.created_employees[0]
                reviewer_id = self.created_employees[0]  # Self-review for testing
                
                review_data = {
                    "employee_id": employee_id,
                    "reviewer_id": reviewer_id,
                    "review_period_start": (datetime.utcnow() - timedelta(days=365)).isoformat(),
                    "review_period_end": datetime.utcnow().isoformat(),
                    "scheduled_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
                    "review_type": "annual",
                    "goals": ["Improve safety compliance", "Increase efficiency"]
                }
                
                response = self.session.post(f"{BACKEND_URL}/hr/performance-reviews", json=review_data)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get("success") and data.get("review"):
                        review_id = data["review"]["id"]
                        self.created_reviews.append(review_id)
                        self.log_test("13. POST /api/hr/performance-reviews - Create review", True, 
                                    f"Performance review created with ID: {review_id}")
                    else:
                        self.log_test("13. POST /api/hr/performance-reviews - Create review", False, 
                                    "Response missing success or review data", data)
                else:
                    self.log_test("13. POST /api/hr/performance-reviews - Create review", False, 
                                f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test("13. POST /api/hr/performance-reviews - Create review", False, str(e))
        else:
            self.log_test("13. POST /api/hr/performance-reviews - Create review", False, 
                        "Need at least 2 employees for testing")

        # Test 14: GET /api/hr/performance-reviews - List performance reviews
        try:
            response = self.session.get(f"{BACKEND_URL}/hr/performance-reviews")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("reviews"), list):
                    reviews = data["reviews"]
                    self.log_test("14. GET /api/hr/performance-reviews - List reviews", True, 
                                f"Found {len(reviews)} performance reviews")
                else:
                    self.log_test("14. GET /api/hr/performance-reviews - List reviews", False, 
                                "Invalid response format", data)
            else:
                self.log_test("14. GET /api/hr/performance-reviews - List reviews", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("14. GET /api/hr/performance-reviews - List reviews", False, str(e))

    def test_payroll_settings(self):
        """Test Payroll Settings APIs"""
        print("=" * 60)
        print("TEST SUITE 6: Payroll Settings APIs")
        print("=" * 60)
        
        # Test 15: GET /api/hr/payroll-settings - Get payroll settings
        try:
            response = self.session.get(f"{BACKEND_URL}/hr/payroll-settings")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("settings"):
                    settings = data["settings"]
                    self.log_test("15. GET /api/hr/payroll-settings - Get settings", True, 
                                f"Payroll settings retrieved: pay_frequency={settings.get('pay_frequency')}")
                else:
                    self.log_test("15. GET /api/hr/payroll-settings - Get settings", False, 
                                "Invalid response format", data)
            else:
                self.log_test("15. GET /api/hr/payroll-settings - Get settings", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("15. GET /api/hr/payroll-settings - Get settings", False, str(e))

        # Test 16: PUT /api/hr/payroll-settings - Update payroll settings
        try:
            settings_data = {
                "company_name": "Test Snow Removal Company",
                "pay_frequency": "weekly",
                "overtime_threshold_hours": 40.0,
                "overtime_multiplier": 1.5,
                "double_time_multiplier": 2.0
            }
            
            response = self.session.put(f"{BACKEND_URL}/hr/payroll-settings", json=settings_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("16. PUT /api/hr/payroll-settings - Update settings", True, 
                                "Payroll settings updated successfully")
                else:
                    self.log_test("16. PUT /api/hr/payroll-settings - Update settings", False, 
                                "Update failed", data)
            else:
                self.log_test("16. PUT /api/hr/payroll-settings - Update settings", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("16. PUT /api/hr/payroll-settings - Update settings", False, str(e))

    def run_comprehensive_test(self):
        """Run all HR Module tests"""
        print("🚀 Starting HR Module Backend API Testing")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_employee_management()
        self.test_time_attendance()
        self.test_pto_management()
        self.test_training_management()
        self.test_performance_management()
        self.test_payroll_settings()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        self.generate_summary(duration)

    def generate_summary(self, duration: float):
        """Generate test summary"""
        print("=" * 80)
        print("📊 HR MODULE TEST SUMMARY")
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
            "Employee Management": [r for r in self.test_results if r["test"].startswith(("1.", "2.", "3."))],
            "Time & Attendance": [r for r in self.test_results if r["test"].startswith(("4.", "5.", "6."))],
            "PTO Management": [r for r in self.test_results if r["test"].startswith(("7.", "8.", "9."))],
            "Training Management": [r for r in self.test_results if r["test"].startswith(("10.", "11.", "12."))],
            "Performance Management": [r for r in self.test_results if r["test"].startswith(("13.", "14."))],
            "Payroll Settings": [r for r in self.test_results if r["test"].startswith(("15.", "16."))]
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
        employee_failures = [r for r in self.test_results if not r["success"] and r["test"].startswith(("1.", "2.", "3."))]
        if employee_failures:
            critical_issues.append("Employee Management operations failing")
        
        time_failures = [r for r in self.test_results if not r["success"] and r["test"].startswith(("4.", "5.", "6."))]
        if time_failures:
            critical_issues.append("Time & Attendance operations failing")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   - {issue}")
            print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS:")
        if failed_tests > 0:
            if any("async/sync" in r["details"] for r in failed_results):
                print("   - Fix async/sync mismatch in HR routes")
            if any("ObjectId" in r["details"] for r in failed_results):
                print("   - Fix BSON ObjectId serialization issues")
            if any("500" in r["details"] for r in failed_results):
                print("   - Check server logs for internal errors")
        else:
            print("   - All tests passed! HR Module is working correctly.")

if __name__ == "__main__":
    tester = HRModuleTester()
    tester.run_comprehensive_test()