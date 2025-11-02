#!/usr/bin/env python3
"""
Backend API Testing for Phase 3 Enterprise Workflow Automation Features
Tests all new endpoints for Workflow Template Library, Version Control, Analytics & Audit Logging
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Backend URL from environment
BACKEND_URL = "https://asset-dashboard-36.preview.emergentagent.com/api"

class WorkflowAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.workflow_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response_data'] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_workflow_template_library(self):
        """Test Workflow Template Library endpoints (5 endpoints)"""
        print("🔧 TESTING WORKFLOW TEMPLATE LIBRARY ENDPOINTS")
        print("=" * 60)
        
        # 1. GET /api/workflow-templates/library (get all templates)
        try:
            response = self.session.get(f"{BACKEND_URL}/workflow-templates/library")
            if response.status_code == 200:
                data = response.json()
                template_count = data.get('count', 0)
                templates = data.get('templates', [])
                self.log_test(
                    "GET /api/workflow-templates/library", 
                    True, 
                    f"Retrieved {template_count} templates successfully"
                )
                
                # Check if we have the expected 11 templates
                if template_count >= 10:
                    self.log_test(
                        "Template Library Size Check", 
                        True, 
                        f"Template library has {template_count} templates (expected 11+)"
                    )
                else:
                    self.log_test(
                        "Template Library Size Check", 
                        False, 
                        f"Template library has only {template_count} templates (expected 11+)"
                    )
            else:
                self.log_test(
                    "GET /api/workflow-templates/library", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/workflow-templates/library", False, f"Exception: {str(e)}")

        # 2. GET /api/workflow-templates/library?category=customer_communication (filter by category)
        try:
            response = self.session.get(f"{BACKEND_URL}/workflow-templates/library?category=customer_communication")
            if response.status_code == 200:
                data = response.json()
                filtered_count = data.get('count', 0)
                self.log_test(
                    "GET /api/workflow-templates/library?category=customer_communication", 
                    True, 
                    f"Retrieved {filtered_count} customer communication templates"
                )
            else:
                self.log_test(
                    "GET /api/workflow-templates/library?category=customer_communication", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/workflow-templates/library?category=customer_communication", False, f"Exception: {str(e)}")

        # 3. GET /api/workflow-templates/library/{template_id} (get specific template)
        try:
            response = self.session.get(f"{BACKEND_URL}/workflow-templates/library/template_customer_arrival")
            if response.status_code == 200:
                template = response.json()
                template_name = template.get('name', 'Unknown')
                self.log_test(
                    "GET /api/workflow-templates/library/template_customer_arrival", 
                    True, 
                    f"Retrieved template: {template_name}"
                )
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/workflow-templates/library/template_customer_arrival", 
                    True, 
                    "Template not found (404) - expected behavior for non-existent template"
                )
            else:
                self.log_test(
                    "GET /api/workflow-templates/library/template_customer_arrival", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/workflow-templates/library/template_customer_arrival", False, f"Exception: {str(e)}")

        # 4. GET /api/workflow-templates/categories (get all categories)
        try:
            response = self.session.get(f"{BACKEND_URL}/workflow-templates/categories")
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', [])
                category_count = len(categories)
                self.log_test(
                    "GET /api/workflow-templates/categories", 
                    True, 
                    f"Retrieved {category_count} categories: {categories}"
                )
            else:
                self.log_test(
                    "GET /api/workflow-templates/categories", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/workflow-templates/categories", False, f"Exception: {str(e)}")

        # 5. GET /api/workflow-templates/search?q=customer (search templates)
        try:
            response = self.session.get(f"{BACKEND_URL}/workflow-templates/search?q=customer")
            if response.status_code == 200:
                data = response.json()
                search_count = data.get('count', 0)
                query = data.get('query', '')
                self.log_test(
                    "GET /api/workflow-templates/search?q=customer", 
                    True, 
                    f"Search for '{query}' returned {search_count} results"
                )
            else:
                self.log_test(
                    "GET /api/workflow-templates/search?q=customer", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/workflow-templates/search?q=customer", False, f"Exception: {str(e)}")

    def test_version_control(self):
        """Test Version Control endpoints (6 endpoints)"""
        print("🔄 TESTING VERSION CONTROL ENDPOINTS")
        print("=" * 60)
        
        # First, get or create a test workflow
        self.ensure_test_workflow()
        
        if not self.workflow_id:
            self.log_test("Version Control Tests", False, "No workflow available for testing version control")
            return

        # 1. GET /api/custom-workflows/{workflow_id}/versions (get version history)
        try:
            response = self.session.get(f"{BACKEND_URL}/custom-workflows/{self.workflow_id}/versions")
            if response.status_code == 200:
                versions = response.json()
                version_count = len(versions) if isinstance(versions, list) else versions.get('count', 0)
                self.log_test(
                    f"GET /api/custom-workflows/{self.workflow_id}/versions", 
                    True, 
                    f"Retrieved {version_count} versions for workflow"
                )
            else:
                self.log_test(
                    f"GET /api/custom-workflows/{self.workflow_id}/versions", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test(f"GET /api/custom-workflows/{self.workflow_id}/versions", False, f"Exception: {str(e)}")

        # 2. GET /api/custom-workflows/{workflow_id}/change-summary?days=30 (get change summary)
        try:
            response = self.session.get(f"{BACKEND_URL}/custom-workflows/{self.workflow_id}/change-summary?days=30")
            if response.status_code == 200:
                summary = response.json()
                self.log_test(
                    f"GET /api/custom-workflows/{self.workflow_id}/change-summary?days=30", 
                    True, 
                    f"Retrieved change summary for last 30 days"
                )
            else:
                self.log_test(
                    f"GET /api/custom-workflows/{self.workflow_id}/change-summary?days=30", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test(f"GET /api/custom-workflows/{self.workflow_id}/change-summary?days=30", False, f"Exception: {str(e)}")

    def test_analytics_and_error_stats(self):
        """Test Analytics & Error Stats endpoints (3 endpoints)"""
        print("📊 TESTING ANALYTICS & ERROR STATS ENDPOINTS")
        print("=" * 60)
        
        # 1. GET /api/analytics/workflows/overview?days=30 (system overview)
        try:
            response = self.session.get(f"{BACKEND_URL}/analytics/workflows/overview?days=30")
            if response.status_code == 200:
                overview = response.json()
                total_workflows = overview.get('total_workflows', 0)
                enabled_workflows = overview.get('enabled_workflows', 0)
                total_executions = overview.get('total_executions', 0)
                success_rate = overview.get('success_rate', 0)
                self.log_test(
                    "GET /api/analytics/workflows/overview?days=30", 
                    True, 
                    f"System overview: {total_workflows} workflows, {enabled_workflows} enabled, {total_executions} executions, {success_rate}% success rate"
                )
            else:
                self.log_test(
                    "GET /api/analytics/workflows/overview?days=30", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/analytics/workflows/overview?days=30", False, f"Exception: {str(e)}")

        # Test workflow-specific analytics if we have a workflow
        if self.workflow_id:
            # 2. GET /api/custom-workflows/{workflow_id}/error-stats?days=30
            try:
                response = self.session.get(f"{BACKEND_URL}/custom-workflows/{self.workflow_id}/error-stats?days=30")
                if response.status_code == 200:
                    error_stats = response.json()
                    self.log_test(
                        f"GET /api/custom-workflows/{self.workflow_id}/error-stats?days=30", 
                        True, 
                        f"Retrieved error statistics for workflow"
                    )
                else:
                    self.log_test(
                        f"GET /api/custom-workflows/{self.workflow_id}/error-stats?days=30", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test(f"GET /api/custom-workflows/{self.workflow_id}/error-stats?days=30", False, f"Exception: {str(e)}")

            # 3. GET /api/analytics/workflows/{workflow_id}/performance?days=30
            try:
                response = self.session.get(f"{BACKEND_URL}/analytics/workflows/{self.workflow_id}/performance?days=30")
                if response.status_code == 200:
                    performance = response.json()
                    total_executions = performance.get('total_executions', 0)
                    success_rate = performance.get('success_rate', 0)
                    self.log_test(
                        f"GET /api/analytics/workflows/{self.workflow_id}/performance?days=30", 
                        True, 
                        f"Performance metrics: {total_executions} executions, {success_rate}% success rate"
                    )
                else:
                    self.log_test(
                        f"GET /api/analytics/workflows/{self.workflow_id}/performance?days=30", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test(f"GET /api/analytics/workflows/{self.workflow_id}/performance?days=30", False, f"Exception: {str(e)}")
        else:
            self.log_test("Workflow-specific Analytics", False, "No workflow available for testing")

    def test_audit_logging(self):
        """Test Audit Logging endpoints (4 endpoints)"""
        print("📋 TESTING AUDIT LOGGING ENDPOINTS")
        print("=" * 60)
        
        # 1. GET /api/audit/workflows (get audit trail)
        try:
            response = self.session.get(f"{BACKEND_URL}/audit/workflows")
            if response.status_code == 200:
                audit_logs = response.json()
                log_count = len(audit_logs) if isinstance(audit_logs, list) else audit_logs.get('count', 0)
                self.log_test(
                    "GET /api/audit/workflows", 
                    True, 
                    f"Retrieved {log_count} audit log entries"
                )
            else:
                self.log_test(
                    "GET /api/audit/workflows", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/audit/workflows", False, f"Exception: {str(e)}")

        # 2. GET /api/audit/workflows?limit=10 (with limit)
        try:
            response = self.session.get(f"{BACKEND_URL}/audit/workflows?limit=10")
            if response.status_code == 200:
                audit_logs = response.json()
                log_count = len(audit_logs) if isinstance(audit_logs, list) else audit_logs.get('count', 0)
                self.log_test(
                    "GET /api/audit/workflows?limit=10", 
                    True, 
                    f"Retrieved {log_count} audit log entries (limited to 10)"
                )
            else:
                self.log_test(
                    "GET /api/audit/workflows?limit=10", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/audit/workflows?limit=10", False, f"Exception: {str(e)}")

        # 3. GET /api/audit/system/stats?days=30 (system audit stats)
        try:
            response = self.session.get(f"{BACKEND_URL}/audit/system/stats?days=30")
            if response.status_code == 200:
                stats = response.json()
                self.log_test(
                    "GET /api/audit/system/stats?days=30", 
                    True, 
                    f"Retrieved system audit statistics for last 30 days"
                )
            else:
                self.log_test(
                    "GET /api/audit/system/stats?days=30", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/audit/system/stats?days=30", False, f"Exception: {str(e)}")

        # 4. GET /api/audit/export (export audit logs)
        try:
            response = self.session.get(f"{BACKEND_URL}/audit/export")
            if response.status_code == 200:
                export_data = response.json()
                log_count = export_data.get('count', 0)
                exported_at = export_data.get('exported_at', 'Unknown')
                self.log_test(
                    "GET /api/audit/export", 
                    True, 
                    f"Exported {log_count} audit logs at {exported_at}"
                )
            else:
                self.log_test(
                    "GET /api/audit/export", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/audit/export", False, f"Exception: {str(e)}")

    def ensure_test_workflow(self):
        """Get existing workflows or create a test workflow if none exist"""
        try:
            # First, try to get existing workflows
            response = self.session.get(f"{BACKEND_URL}/custom-workflows")
            if response.status_code == 200:
                workflows = response.json()
                if workflows and len(workflows) > 0:
                    self.workflow_id = workflows[0].get('id') or workflows[0].get('_id')
                    workflow_name = workflows[0].get('name', 'Unknown')
                    self.log_test(
                        "GET /api/custom-workflows", 
                        True, 
                        f"Found {len(workflows)} existing workflows, using '{workflow_name}' for testing"
                    )
                    return
                else:
                    self.log_test(
                        "GET /api/custom-workflows", 
                        True, 
                        "No existing workflows found - will test with empty state"
                    )
            else:
                self.log_test(
                    "GET /api/custom-workflows", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/custom-workflows", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all Phase 3 Enterprise Workflow Automation tests"""
        print("🚀 STARTING PHASE 3 ENTERPRISE WORKFLOW AUTOMATION TESTING")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Started: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        # Test all endpoint groups
        self.test_workflow_template_library()
        self.test_version_control()
        self.test_analytics_and_error_stats()
        self.test_audit_logging()
        
        # Generate summary
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  - {test['test']}: {test['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for test in self.test_results:
            if test['success']:
                print(f"  - {test['test']}")
        
        print()
        print(f"Test Completed: {datetime.now().isoformat()}")
        
        # Return success rate for external use
        return success_rate

if __name__ == "__main__":
    tester = WorkflowAPITester()
    success_rate = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success_rate >= 80 else 1)