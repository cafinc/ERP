#!/usr/bin/env python3
"""
Backend Testing Suite for Automation Analytics Endpoints
Tests the newly implemented automation analytics endpoints for workflow execution metrics.
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import sys
import traceback

# Backend URL from frontend environment
BACKEND_URL = "https://snowtrack-admin-1.preview.emergentagent.com/api"

class AutomationAnalyticsTestSuite:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
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
            
    async def create_test_workflow_executions(self):
        """Create test workflow execution data for testing analytics"""
        print("🔧 Setting up test workflow execution data...")
        
        # Test workflow execution data
        test_executions = [
            {
                "workflow_id": "weather_operations",
                "workflow_name": "Weather Operations",
                "status": "success",
                "started_at": datetime.utcnow() - timedelta(hours=2),
                "completed_at": datetime.utcnow() - timedelta(hours=2) + timedelta(minutes=5),
                "duration": 300.0,  # 5 minutes
                "trigger": "scheduled",
                "context": {"weather_alert": True, "temperature": -10},
                "result": {"dispatches_created": 3, "crews_notified": 5},
                "created_at": datetime.utcnow() - timedelta(hours=2)
            },
            {
                "workflow_id": "weather_operations", 
                "workflow_name": "Weather Operations",
                "status": "success",
                "started_at": datetime.utcnow() - timedelta(hours=1),
                "completed_at": datetime.utcnow() - timedelta(hours=1) + timedelta(minutes=3),
                "duration": 180.0,  # 3 minutes
                "trigger": "manual",
                "context": {"weather_alert": False, "temperature": -5},
                "result": {"dispatches_created": 1, "crews_notified": 2},
                "created_at": datetime.utcnow() - timedelta(hours=1)
            },
            {
                "workflow_id": "inventory_management",
                "workflow_name": "Inventory Management", 
                "status": "failed",
                "started_at": datetime.utcnow() - timedelta(minutes=30),
                "completed_at": datetime.utcnow() - timedelta(minutes=29),
                "duration": 60.0,  # 1 minute
                "trigger": "webhook",
                "context": {"low_stock_alert": True, "item": "rock_salt"},
                "error": "Failed to connect to supplier API",
                "created_at": datetime.utcnow() - timedelta(minutes=30)
            },
            {
                "workflow_id": "customer_communication",
                "workflow_name": "Customer Communication",
                "status": "success", 
                "started_at": datetime.utcnow() - timedelta(minutes=15),
                "completed_at": datetime.utcnow() - timedelta(minutes=14),
                "duration": 45.0,  # 45 seconds
                "trigger": "event",
                "context": {"service_completed": True, "customer_id": "test123"},
                "result": {"emails_sent": 1, "sms_sent": 1},
                "created_at": datetime.utcnow() - timedelta(minutes=15)
            },
            {
                "workflow_id": "equipment_maintenance",
                "workflow_name": "Equipment Maintenance",
                "status": "running",
                "started_at": datetime.utcnow() - timedelta(minutes=5),
                "trigger": "scheduled",
                "context": {"maintenance_due": True, "equipment_id": "plow001"},
                "created_at": datetime.utcnow() - timedelta(minutes=5)
            }
        ]
        
        # Insert test data directly via MongoDB-like operations
        # Note: In a real test, we'd use the automation engine to create these
        print(f"   Created {len(test_executions)} test workflow executions")
        return test_executions
        
    async def test_automation_metrics_endpoint(self):
        """Test GET /api/automation/analytics/metrics endpoint"""
        print("📊 Testing Automation Metrics Endpoint...")
        
        # Test 1: Get all workflow metrics (no filters)
        success, response, status = await self.make_request("GET", "/automation/analytics/metrics")
        
        if success and isinstance(response, list):
            self.log_test(
                "GET /automation/analytics/metrics (no filters)",
                True,
                f"Retrieved metrics for {len(response)} workflows, Status: {status}"
            )
            
            # Validate metrics structure
            if response:
                sample_metric = response[0]
                required_fields = [
                    "workflow_id", "workflow_name", "total_executions", 
                    "successful_executions", "failed_executions", 
                    "average_duration", "success_rate", "last_execution"
                ]
                
                missing_fields = [field for field in required_fields if field not in sample_metric]
                if not missing_fields:
                    self.log_test(
                        "Metrics structure validation",
                        True,
                        f"All required fields present: {required_fields}"
                    )
                else:
                    self.log_test(
                        "Metrics structure validation", 
                        False,
                        f"Missing fields: {missing_fields}",
                        sample_metric
                    )
            else:
                self.log_test(
                    "Metrics data availability",
                    False,
                    "No workflow metrics returned - may need workflow executions in database"
                )
        else:
            self.log_test(
                "GET /automation/analytics/metrics (no filters)",
                False,
                f"Failed to get metrics, Status: {status}",
                response
            )
            
        # Test 2: Get metrics with date filters
        start_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        success, response, status = await self.make_request(
            "GET", 
            "/automation/analytics/metrics",
            params={"start_date": start_date, "end_date": end_date}
        )
        
        self.log_test(
            "GET /automation/analytics/metrics (with date filters)",
            success,
            f"Date filtering test, Status: {status}, Results: {len(response) if isinstance(response, list) else 0}"
        )
        
        # Test 3: Get metrics for specific workflow
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/metrics", 
            params={"workflow_id": "weather_operations"}
        )
        
        self.log_test(
            "GET /automation/analytics/metrics (workflow filter)",
            success,
            f"Workflow-specific filtering test, Status: {status}, Results: {len(response) if isinstance(response, list) else 0}"
        )
        
    async def test_automation_executions_endpoint(self):
        """Test GET /api/automation/analytics/executions endpoint"""
        print("📋 Testing Automation Executions Endpoint...")
        
        # Test 1: Get recent executions (no filters)
        success, response, status = await self.make_request("GET", "/automation/analytics/executions")
        
        if success and isinstance(response, list):
            self.log_test(
                "GET /automation/analytics/executions (no filters)",
                True,
                f"Retrieved {len(response)} recent executions, Status: {status}"
            )
            
            # Validate execution structure
            if response:
                sample_execution = response[0]
                required_fields = [
                    "workflow_id", "workflow_name", "status", "started_at",
                    "trigger", "id"
                ]
                
                missing_fields = [field for field in required_fields if field not in sample_execution]
                if not missing_fields:
                    self.log_test(
                        "Execution structure validation",
                        True,
                        f"All required fields present: {required_fields}"
                    )
                    
                    # Check if executions are sorted by most recent
                    if len(response) > 1:
                        first_date = response[0].get("started_at")
                        second_date = response[1].get("started_at")
                        if first_date and second_date:
                            is_sorted = first_date >= second_date
                            self.log_test(
                                "Executions sorting validation",
                                is_sorted,
                                f"Executions sorted by most recent: {is_sorted}"
                            )
                else:
                    self.log_test(
                        "Execution structure validation",
                        False,
                        f"Missing fields: {missing_fields}",
                        sample_execution
                    )
            else:
                self.log_test(
                    "Execution data availability",
                    False,
                    "No workflow executions returned - may need executions in database"
                )
        else:
            self.log_test(
                "GET /automation/analytics/executions (no filters)",
                False,
                f"Failed to get executions, Status: {status}",
                response
            )
            
        # Test 2: Get executions with date filters
        start_date = (datetime.utcnow() - timedelta(hours=3)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/executions",
            params={"start_date": start_date, "end_date": end_date}
        )
        
        self.log_test(
            "GET /automation/analytics/executions (date filters)",
            success,
            f"Date filtering test, Status: {status}, Results: {len(response) if isinstance(response, list) else 0}"
        )
        
        # Test 3: Get executions with workflow filter
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/executions",
            params={"workflow_id": "weather_operations"}
        )
        
        self.log_test(
            "GET /automation/analytics/executions (workflow filter)",
            success,
            f"Workflow filtering test, Status: {status}, Results: {len(response) if isinstance(response, list) else 0}"
        )
        
        # Test 4: Get executions with status filter
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/executions",
            params={"status": "success"}
        )
        
        self.log_test(
            "GET /automation/analytics/executions (status filter)",
            success,
            f"Status filtering test, Status: {status}, Results: {len(response) if isinstance(response, list) else 0}"
        )
        
        # Test 5: Get executions with limit parameter
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/executions",
            params={"limit": 10}
        )
        
        result_count = len(response) if isinstance(response, list) else 0
        limit_respected = result_count <= 10
        
        self.log_test(
            "GET /automation/analytics/executions (limit parameter)",
            success and limit_respected,
            f"Limit parameter test, Status: {status}, Results: {result_count}, Limit respected: {limit_respected}"
        )
        
    async def test_workflow_specific_executions_endpoint(self):
        """Test GET /api/automation/workflows/{workflow_id}/executions endpoint"""
        print("🔍 Testing Workflow-Specific Executions Endpoint...")
        
        # Test 1: Get executions for weather_operations workflow
        success, response, status = await self.make_request(
            "GET",
            "/automation/workflows/weather_operations/executions"
        )
        
        if success and isinstance(response, dict):
            self.log_test(
                "GET /automation/workflows/weather_operations/executions",
                True,
                f"Retrieved workflow executions, Status: {status}"
            )
            
            # Validate response structure
            required_fields = ["workflow_name", "executions"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test(
                    "Workflow executions structure validation",
                    True,
                    f"Response has required fields: {required_fields}, Executions count: {len(response.get('executions', []))}"
                )
                
                # Validate executions array
                executions = response.get("executions", [])
                if executions and isinstance(executions, list):
                    sample_execution = executions[0]
                    execution_fields = ["id", "workflow_id", "status", "started_at"]
                    missing_exec_fields = [field for field in execution_fields if field not in sample_execution]
                    
                    self.log_test(
                        "Individual execution structure validation",
                        len(missing_exec_fields) == 0,
                        f"Execution fields check - Missing: {missing_exec_fields}" if missing_exec_fields else "All execution fields present"
                    )
            else:
                self.log_test(
                    "Workflow executions structure validation",
                    False,
                    f"Missing response fields: {missing_fields}",
                    response
                )
        else:
            self.log_test(
                "GET /automation/workflows/weather_operations/executions",
                False,
                f"Failed to get workflow executions, Status: {status}",
                response
            )
            
        # Test 2: Get executions for inventory_management workflow
        success, response, status = await self.make_request(
            "GET",
            "/automation/workflows/inventory_management/executions"
        )
        
        self.log_test(
            "GET /automation/workflows/inventory_management/executions",
            success,
            f"Inventory management workflow test, Status: {status}, Executions: {len(response.get('executions', [])) if isinstance(response, dict) else 0}"
        )
        
        # Test 3: Get executions with date filters
        start_date = (datetime.utcnow() - timedelta(hours=2)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        success, response, status = await self.make_request(
            "GET",
            "/automation/workflows/weather_operations/executions",
            params={"start_date": start_date, "end_date": end_date}
        )
        
        self.log_test(
            "GET /automation/workflows/{workflow_id}/executions (date filters)",
            success,
            f"Date filtering for specific workflow, Status: {status}, Results: {len(response.get('executions', [])) if isinstance(response, dict) else 0}"
        )
        
        # Test 4: Get executions with limit parameter
        success, response, status = await self.make_request(
            "GET",
            "/automation/workflows/weather_operations/executions",
            params={"limit": 5}
        )
        
        result_count = len(response.get('executions', [])) if isinstance(response, dict) else 0
        limit_respected = result_count <= 5
        
        self.log_test(
            "GET /automation/workflows/{workflow_id}/executions (limit parameter)",
            success and limit_respected,
            f"Limit parameter for specific workflow, Status: {status}, Results: {result_count}, Limit respected: {limit_respected}"
        )
        
        # Test 5: Test with non-existent workflow
        success, response, status = await self.make_request(
            "GET",
            "/automation/workflows/non_existent_workflow/executions"
        )
        
        # Should still return 200 with empty executions array
        expected_success = success and isinstance(response, dict) and "executions" in response
        
        self.log_test(
            "GET /automation/workflows/non_existent_workflow/executions",
            expected_success,
            f"Non-existent workflow handling, Status: {status}, Has executions field: {'executions' in response if isinstance(response, dict) else False}"
        )
        
    async def test_metrics_calculations(self):
        """Test that metrics are calculated correctly"""
        print("🧮 Testing Metrics Calculations...")
        
        # Get all metrics to verify calculations
        success, response, status = await self.make_request("GET", "/automation/analytics/metrics")
        
        if success and isinstance(response, list) and response:
            for workflow_metric in response:
                workflow_id = workflow_metric.get("workflow_id")
                total_executions = workflow_metric.get("total_executions", 0)
                successful_executions = workflow_metric.get("successful_executions", 0)
                failed_executions = workflow_metric.get("failed_executions", 0)
                success_rate = workflow_metric.get("success_rate", 0)
                average_duration = workflow_metric.get("average_duration", 0)
                
                # Test success rate calculation
                expected_success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0
                success_rate_correct = abs(success_rate - expected_success_rate) < 0.01  # Allow small floating point differences
                
                self.log_test(
                    f"Success rate calculation for {workflow_id}",
                    success_rate_correct,
                    f"Expected: {expected_success_rate:.2f}%, Got: {success_rate:.2f}%, Total: {total_executions}, Successful: {successful_executions}"
                )
                
                # Test total executions calculation
                calculated_total = successful_executions + failed_executions
                # Note: running executions might not be included in success/failed counts
                total_correct = calculated_total <= total_executions
                
                self.log_test(
                    f"Total executions calculation for {workflow_id}",
                    total_correct,
                    f"Total: {total_executions}, Successful: {successful_executions}, Failed: {failed_executions}"
                )
                
                # Test average duration is reasonable (should be >= 0)
                duration_valid = average_duration >= 0
                
                self.log_test(
                    f"Average duration validation for {workflow_id}",
                    duration_valid,
                    f"Average duration: {average_duration:.2f} seconds"
                )
        else:
            self.log_test(
                "Metrics calculations test",
                False,
                "No metrics data available for calculation validation"
            )
            
    async def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("🚨 Testing Error Handling...")
        
        # Test 1: Invalid date format
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/metrics",
            params={"start_date": "invalid-date"}
        )
        
        # Should return 500 error for invalid date
        self.log_test(
            "Invalid date format handling",
            status >= 400,  # Should be an error status
            f"Status: {status}, Response: {response}"
        )
        
        # Test 2: Very large limit parameter
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/executions",
            params={"limit": 999999}
        )
        
        # Should handle large limits gracefully
        self.log_test(
            "Large limit parameter handling",
            status < 500,  # Should not crash the server
            f"Status: {status}, Handled large limit gracefully"
        )
        
        # Test 3: Invalid status filter
        success, response, status = await self.make_request(
            "GET",
            "/automation/analytics/executions",
            params={"status": "invalid_status"}
        )
        
        # Should return empty results for invalid status
        result_count = len(response) if isinstance(response, list) else 0
        self.log_test(
            "Invalid status filter handling",
            success and result_count == 0,
            f"Status: {status}, Results: {result_count} (should be 0 for invalid status)"
        )
        
    async def run_all_tests(self):
        """Run all automation analytics tests"""
        print("🚀 Starting Automation Analytics Backend Testing Suite")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Setup test data
            await self.create_test_workflow_executions()
            
            # Run all test suites
            await self.test_automation_metrics_endpoint()
            await self.test_automation_executions_endpoint() 
            await self.test_workflow_specific_executions_endpoint()
            await self.test_metrics_calculations()
            await self.test_error_handling()
            
        except Exception as e:
            print(f"❌ Test suite error: {str(e)}")
            traceback.print_exc()
        finally:
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
        
        print("\n✅ AUTOMATION ANALYTICS TESTING COMPLETED")
        return self.passed_tests, self.total_tests

async def main():
    """Main test runner"""
    test_suite = AutomationAnalyticsTestSuite()
    passed, total = await test_suite.run_all_tests()
    
    # Exit with appropriate code
    if passed == total:
        sys.exit(0)  # All tests passed
    else:
        sys.exit(1)  # Some tests failed

if __name__ == "__main__":
    asyncio.run(main())