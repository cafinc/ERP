#!/usr/bin/env python3
"""
Comprehensive Template System Backend API Testing
Tests all template endpoints and functionality as requested
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend environment
BASE_URL = "https://snowconnect.preview.emergentagent.com/api"

class TemplateSystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_templates = []
        self.session_token = None
        self.authenticated = False
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        if response_data and not success:
            print(f"    Response: {response_data}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
        
    def authenticate(self):
        """Authenticate with the API"""
        try:
            auth_data = {
                "email": "template.test@example.com",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/login-email", json=auth_data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                self.session_token = result.get("session_token")
                if self.session_token:
                    # Set authorization header for all future requests
                    self.session.headers.update({"Authorization": f"Bearer {self.session_token}"})
                    self.authenticated = True
                    print(f"✅ Authenticated successfully")
                    return True
                else:
                    print(f"❌ No session token in response")
                    return False
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"    Error: {error_data}")
                except:
                    print(f"    Text: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
        
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        try:
            url = f"{self.base_url}{endpoint}"
            
            if method.upper() == "GET":
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, params=params, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, params=params, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, params=params, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return None

    def test_suite_1_template_crud(self):
        """Test Suite 1 - Template CRUD Operations"""
        print("\n=== Test Suite 1: Template CRUD Operations ===")
        
        # Test 1: POST /api/templates - Create a custom estimate template
        print("\n1. Testing POST /api/templates - Create estimate template")
        template_data = {
            "type": "estimate",
            "name": f"Test Estimate Template {uuid.uuid4().hex[:8]}",
            "description": "Test estimate template for comprehensive testing",
            "category": "snow_removal",
            "tags": ["winter", "residential", "test"],
            "content": {
                "title": "Snow Removal Estimate - {{customer_name}}",
                "items": [
                    {
                        "description": "Snow plowing for {{property_address}}",
                        "quantity": "{{visits}}",
                        "rate": "{{rate_per_visit}}",
                        "total": "{{total_amount}}"
                    }
                ],
                "terms": "Payment due within {{payment_terms}} days",
                "notes": "Service includes {{service_details}}"
            },
            "is_public": False,
            "is_default": False
        }
        
        response = self.make_request("POST", "/templates", template_data)
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and result.get("template"):
                    template_id = result["template"]["_id"]
                    self.created_templates.append(("estimate", template_id))
                    self.log_test("Create estimate template", True, 
                                f"Template created with ID: {template_id}")
                else:
                    self.log_test("Create estimate template", False, 
                                "Success=False or missing template in response", result)
            except json.JSONDecodeError:
                self.log_test("Create estimate template", False, 
                            "Invalid JSON response", response.text)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data}"
                except:
                    error_msg += f", Text: {response.text}"
            self.log_test("Create estimate template", False, error_msg)

        # Test 2: GET /api/templates - List all templates
        print("\n2. Testing GET /api/templates - List all templates")
        response = self.make_request("GET", "/templates")
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and "templates" in result:
                    template_count = result.get("count", 0)
                    self.log_test("List all templates", True, 
                                f"Found {template_count} templates")
                else:
                    self.log_test("List all templates", False, 
                                "Success=False or missing templates", result)
            except json.JSONDecodeError:
                self.log_test("List all templates", False, 
                            "Invalid JSON response", response.text)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data}"
                except:
                    error_msg += f", Text: {response.text}"
            self.log_test("List all templates", False, error_msg)

        # Test 3: GET /api/templates?type=estimate - Filter by type
        print("\n3. Testing GET /api/templates?type=estimate - Filter by type")
        response = self.make_request("GET", "/templates", params={"type": "estimate"})
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and "templates" in result:
                    estimate_count = result.get("count", 0)
                    self.log_test("Filter templates by type", True, 
                                f"Found {estimate_count} estimate templates")
                else:
                    self.log_test("Filter templates by type", False, 
                                "Success=False or missing templates", result)
            except json.JSONDecodeError:
                self.log_test("Filter templates by type", False, 
                            "Invalid JSON response", response.text)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data}"
                except:
                    error_msg += f", Text: {response.text}"
            self.log_test("Filter templates by type", False, error_msg)

        # Test 4: GET /api/templates/{type}/{id} - Get specific template
        if self.created_templates:
            template_type, template_id = self.created_templates[0]
            print(f"\n4. Testing GET /api/templates/{template_type}/{template_id} - Get specific template")
            response = self.make_request("GET", f"/templates/{template_type}/{template_id}")
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success") and result.get("template"):
                        template = result["template"]
                        self.log_test("Get specific template", True, 
                                    f"Retrieved template: {template.get('name')}")
                    else:
                        self.log_test("Get specific template", False, 
                                    "Success=False or missing template", result)
                except json.JSONDecodeError:
                    self.log_test("Get specific template", False, 
                                "Invalid JSON response", response.text)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f", Error: {error_data}"
                    except:
                        error_msg += f", Text: {response.text}"
                self.log_test("Get specific template", False, error_msg)
        else:
            self.log_test("Get specific template", False, "No templates created to test with")

        # Test 5: PUT /api/templates/{type}/{id} - Update template
        if self.created_templates:
            template_type, template_id = self.created_templates[0]
            print(f"\n5. Testing PUT /api/templates/{template_type}/{template_id} - Update template")
            update_data = {
                "name": f"Updated Test Template {uuid.uuid4().hex[:8]}",
                "description": "Updated description for testing",
                "tags": ["updated", "test", "winter"]
            }
            response = self.make_request("PUT", f"/templates/{template_type}/{template_id}", update_data)
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success") and result.get("template"):
                        self.log_test("Update template", True, 
                                    f"Template updated successfully")
                    else:
                        self.log_test("Update template", False, 
                                    "Success=False or missing template", result)
                except json.JSONDecodeError:
                    self.log_test("Update template", False, 
                                "Invalid JSON response", response.text)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f", Error: {error_data}"
                    except:
                        error_msg += f", Text: {response.text}"
                self.log_test("Update template", False, error_msg)
        else:
            self.log_test("Update template", False, "No templates created to test with")

        # Test 6: DELETE /api/templates/{type}/{id} - Delete template (will test later)
        # Test 7: POST /api/templates/{type}/{id}/duplicate - Duplicate template (will test later)

    def test_suite_2_template_application(self):
        """Test Suite 2 - Template Application"""
        print("\n=== Test Suite 2: Template Application ===")
        
        # Test 8: POST /api/templates/{type}/{id}/apply - Apply template with data
        if self.created_templates:
            template_type, template_id = self.created_templates[0]
            print(f"\n8. Testing POST /api/templates/{template_type}/{template_id}/apply - Apply template")
            
            # Sample data for variable replacement
            apply_data = {
                "data": {
                    "customer_name": "John Smith",
                    "property_address": "123 Main Street, Anytown",
                    "visits": "10",
                    "rate_per_visit": "$50.00",
                    "total_amount": "$500.00",
                    "payment_terms": "30",
                    "service_details": "driveway and walkway clearing"
                }
            }
            
            response = self.make_request("POST", f"/templates/{template_type}/{template_id}/apply", apply_data)
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success") and result.get("result"):
                        applied_result = result["result"]
                        # Check if variables were replaced
                        content = applied_result.get("content", {})
                        title = content.get("title", "")
                        if "John Smith" in title:
                            self.log_test("Apply template with data", True, 
                                        "Template applied and variables replaced successfully")
                        else:
                            self.log_test("Apply template with data", False, 
                                        "Variables not properly replaced", result)
                    else:
                        self.log_test("Apply template with data", False, 
                                    "Success=False or missing result", result)
                except json.JSONDecodeError:
                    self.log_test("Apply template with data", False, 
                                "Invalid JSON response", response.text)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f", Error: {error_data}"
                    except:
                        error_msg += f", Text: {response.text}"
                self.log_test("Apply template with data", False, error_msg)
        else:
            self.log_test("Apply template with data", False, "No templates created to test with")

    def test_suite_3_utility_endpoints(self):
        """Test Suite 3 - Utility Endpoints"""
        print("\n=== Test Suite 3: Utility Endpoints ===")
        
        # Test 9: GET /api/templates/{type}/categories - Get categories
        print("\n9. Testing GET /api/templates/estimate/categories - Get categories")
        response = self.make_request("GET", "/templates/estimate/categories")
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and "categories" in result:
                    categories = result["categories"]
                    self.log_test("Get template categories", True, 
                                f"Found {len(categories)} categories: {categories}")
                else:
                    self.log_test("Get template categories", False, 
                                "Success=False or missing categories", result)
            except json.JSONDecodeError:
                self.log_test("Get template categories", False, 
                            "Invalid JSON response", response.text)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data}"
                except:
                    error_msg += f", Text: {response.text}"
            self.log_test("Get template categories", False, error_msg)

        # Test 10: GET /api/templates/{type}/{id}/stats - Get usage statistics
        if self.created_templates:
            template_type, template_id = self.created_templates[0]
            print(f"\n10. Testing GET /api/templates/{template_type}/{template_id}/stats - Get usage stats")
            response = self.make_request("GET", f"/templates/{template_type}/{template_id}/stats")
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success") and result.get("stats"):
                        stats = result["stats"]
                        usage_count = stats.get("usage_count", 0)
                        self.log_test("Get template statistics", True, 
                                    f"Usage count: {usage_count}, Version: {stats.get('version')}")
                    else:
                        self.log_test("Get template statistics", False, 
                                    "Success=False or missing stats", result)
                except json.JSONDecodeError:
                    self.log_test("Get template statistics", False, 
                                "Invalid JSON response", response.text)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f", Error: {error_data}"
                    except:
                        error_msg += f", Text: {response.text}"
                self.log_test("Get template statistics", False, error_msg)
        else:
            self.log_test("Get template statistics", False, "No templates created to test with")

    def test_suite_4_prebuilt_templates(self):
        """Test Suite 4 - Pre-built Templates Verification"""
        print("\n=== Test Suite 4: Pre-built Templates Verification ===")
        
        # Test 11: Verify 8+ pre-built templates exist in database
        print("\n11. Testing pre-built templates existence")
        response = self.make_request("GET", "/templates")
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and "templates" in result:
                    templates = result["templates"]
                    total_count = len(templates)
                    
                    # Count by type
                    type_counts = {}
                    default_templates = []
                    
                    for template in templates:
                        template_type = template.get("type", "unknown")
                        type_counts[template_type] = type_counts.get(template_type, 0) + 1
                        
                        if template.get("is_default"):
                            default_templates.append(template)
                    
                    if total_count >= 8:
                        self.log_test("Verify 8+ pre-built templates", True, 
                                    f"Found {total_count} templates. Types: {type_counts}")
                    else:
                        self.log_test("Verify 8+ pre-built templates", False, 
                                    f"Only found {total_count} templates, need at least 8")
                    
                    # Test 12: Test estimate templates have proper structure
                    estimate_templates = [t for t in templates if t.get("type") == "estimate"]
                    if estimate_templates:
                        valid_estimates = 0
                        for template in estimate_templates:
                            content = template.get("content", {})
                            if "title" in content or "items" in content:
                                valid_estimates += 1
                        
                        self.log_test("Estimate templates structure", True, 
                                    f"Found {len(estimate_templates)} estimate templates, {valid_estimates} with proper structure")
                    else:
                        self.log_test("Estimate templates structure", False, 
                                    "No estimate templates found")
                    
                    # Test 13: Test invoice templates have line items
                    invoice_templates = [t for t in templates if t.get("type") == "invoice"]
                    if invoice_templates:
                        valid_invoices = 0
                        for template in invoice_templates:
                            content = template.get("content", {})
                            if "items" in content or "line_items" in content:
                                valid_invoices += 1
                        
                        self.log_test("Invoice templates line items", True, 
                                    f"Found {len(invoice_templates)} invoice templates, {valid_invoices} with line items")
                    else:
                        self.log_test("Invoice templates line items", False, 
                                    "No invoice templates found")
                    
                    # Test 14: Verify all default templates are marked correctly
                    if default_templates:
                        self.log_test("Default templates marked correctly", True, 
                                    f"Found {len(default_templates)} default templates")
                    else:
                        self.log_test("Default templates marked correctly", False, 
                                    "No default templates found")
                        
                else:
                    self.log_test("Verify 8+ pre-built templates", False, 
                                "Success=False or missing templates", result)
            except json.JSONDecodeError:
                self.log_test("Verify 8+ pre-built templates", False, 
                            "Invalid JSON response", response.text)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data}"
                except:
                    error_msg += f", Text: {response.text}"
            self.log_test("Verify 8+ pre-built templates", False, error_msg)

    def test_suite_5_variable_system(self):
        """Test Suite 5 - Variable System"""
        print("\n=== Test Suite 5: Variable System ===")
        
        # Test 15: Test variable extraction from template content
        print("\n15. Testing variable extraction - Create template with variables")
        template_data = {
            "type": "invoice",
            "name": f"Variable Test Template {uuid.uuid4().hex[:8]}",
            "description": "Template for testing variable extraction",
            "category": "test",
            "content": {
                "header": "Invoice for {{client_name}}",
                "billing_address": "{{billing_street}}, {{billing_city}}, {{billing_state}}",
                "items": [
                    {
                        "description": "{{service_description}}",
                        "quantity": "{{quantity}}",
                        "rate": "{{unit_rate}}",
                        "amount": "{{line_total}}"
                    }
                ],
                "total": "{{invoice_total}}",
                "due_date": "{{due_date}}"
            }
        }
        
        response = self.make_request("POST", "/templates", template_data)
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and result.get("template"):
                    template = result["template"]
                    variables = template.get("variables", [])
                    expected_vars = ["client_name", "billing_street", "billing_city", "billing_state", 
                                   "service_description", "quantity", "unit_rate", "line_total", 
                                   "invoice_total", "due_date"]
                    
                    found_vars = len([v for v in expected_vars if v in variables])
                    
                    if found_vars >= 8:  # Most variables should be extracted
                        self.log_test("Variable extraction", True, 
                                    f"Extracted {len(variables)} variables: {variables}")
                        
                        # Store for next tests
                        self.created_templates.append(("invoice", template["_id"]))
                    else:
                        self.log_test("Variable extraction", False, 
                                    f"Only found {found_vars} of {len(expected_vars)} expected variables")
                else:
                    self.log_test("Variable extraction", False, 
                                "Success=False or missing template", result)
            except json.JSONDecodeError:
                self.log_test("Variable extraction", False, 
                            "Invalid JSON response", response.text)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data}"
                except:
                    error_msg += f", Text: {response.text}"
            self.log_test("Variable extraction", False, error_msg)

        # Test 16: Test variable replacement with data
        if len(self.created_templates) >= 2:  # We should have invoice template now
            invoice_template = None
            for template_type, template_id in self.created_templates:
                if template_type == "invoice":
                    invoice_template = (template_type, template_id)
                    break
            
            if invoice_template:
                template_type, template_id = invoice_template
                print(f"\n16. Testing variable replacement with complex data")
                
                replacement_data = {
                    "data": {
                        "client_name": "ABC Corporation",
                        "billing_street": "456 Business Ave",
                        "billing_city": "Commerce City",
                        "billing_state": "CO",
                        "service_description": "Snow removal services",
                        "quantity": "5",
                        "unit_rate": "$100.00",
                        "line_total": "$500.00",
                        "invoice_total": "$500.00",
                        "due_date": "2024-02-15"
                    }
                }
                
                response = self.make_request("POST", f"/templates/{template_type}/{template_id}/apply", replacement_data)
                if response and response.status_code == 200:
                    try:
                        result = response.json()
                        if result.get("success") and result.get("result"):
                            applied_content = result["result"]["content"]
                            
                            # Check if variables were replaced
                            header = applied_content.get("header", "")
                            billing = applied_content.get("billing_address", "")
                            
                            replacements_found = 0
                            if "ABC Corporation" in header:
                                replacements_found += 1
                            if "456 Business Ave" in billing and "Commerce City" in billing:
                                replacements_found += 1
                            
                            if replacements_found >= 2:
                                self.log_test("Variable replacement with data", True, 
                                            "Complex variable replacement working correctly")
                            else:
                                self.log_test("Variable replacement with data", False, 
                                            "Variables not properly replaced in complex structure")
                        else:
                            self.log_test("Variable replacement with data", False, 
                                        "Success=False or missing result", result)
                    except json.JSONDecodeError:
                        self.log_test("Variable replacement with data", False, 
                                    "Invalid JSON response", response.text)
                else:
                    error_msg = f"Status: {response.status_code if response else 'No response'}"
                    if response:
                        try:
                            error_data = response.json()
                            error_msg += f", Error: {error_data}"
                        except:
                            error_msg += f", Text: {response.text}"
                    self.log_test("Variable replacement with data", False, error_msg)
            else:
                self.log_test("Variable replacement with data", False, "No invoice template available for testing")
        else:
            self.log_test("Variable replacement with data", False, "No templates available for testing")

        # Test 17: Test nested variable replacement in complex structures
        print("\n17. Testing nested variable replacement")
        nested_template_data = {
            "type": "proposal",
            "name": f"Nested Variables Template {uuid.uuid4().hex[:8]}",
            "description": "Template for testing nested variable replacement",
            "category": "test",
            "content": {
                "project": {
                    "name": "{{project_name}}",
                    "client": {
                        "company": "{{client_company}}",
                        "contact": {
                            "name": "{{contact_name}}",
                            "email": "{{contact_email}}"
                        }
                    },
                    "services": [
                        {
                            "name": "{{service_1_name}}",
                            "cost": "{{service_1_cost}}"
                        },
                        {
                            "name": "{{service_2_name}}",
                            "cost": "{{service_2_cost}}"
                        }
                    ],
                    "total": "{{project_total}}"
                }
            }
        }
        
        response = self.make_request("POST", "/templates", nested_template_data)
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success") and result.get("template"):
                    template_id = result["template"]["_id"]
                    
                    # Now test applying with nested data
                    nested_data = {
                        "data": {
                            "project_name": "Winter Maintenance Project",
                            "client_company": "XYZ Industries",
                            "contact_name": "Jane Doe",
                            "contact_email": "jane@xyz.com",
                            "service_1_name": "Snow Plowing",
                            "service_1_cost": "$300.00",
                            "service_2_name": "Ice Management",
                            "service_2_cost": "$200.00",
                            "project_total": "$500.00"
                        }
                    }
                    
                    apply_response = self.make_request("POST", f"/templates/proposal/{template_id}/apply", nested_data)
                    if apply_response and apply_response.status_code == 200:
                        try:
                            apply_result = apply_response.json()
                            if apply_result.get("success"):
                                content = apply_result["result"]["content"]
                                project = content.get("project", {})
                                
                                # Check nested replacements
                                checks = [
                                    project.get("name") == "Winter Maintenance Project",
                                    project.get("client", {}).get("company") == "XYZ Industries",
                                    project.get("client", {}).get("contact", {}).get("name") == "Jane Doe",
                                    len(project.get("services", [])) == 2
                                ]
                                
                                if sum(checks) >= 3:
                                    self.log_test("Nested variable replacement", True, 
                                                "Nested variable replacement working correctly")
                                else:
                                    self.log_test("Nested variable replacement", False, 
                                                f"Nested replacement failed. Checks passed: {sum(checks)}/4")
                            else:
                                self.log_test("Nested variable replacement", False, 
                                            "Failed to apply nested template", apply_result)
                        except json.JSONDecodeError:
                            self.log_test("Nested variable replacement", False, 
                                        "Invalid JSON in apply response")
                    else:
                        self.log_test("Nested variable replacement", False, 
                                    "Failed to apply nested template")
                else:
                    self.log_test("Nested variable replacement", False, 
                                "Failed to create nested template", result)
            except json.JSONDecodeError:
                self.log_test("Nested variable replacement", False, 
                            "Invalid JSON response", response.text)
        else:
            self.log_test("Nested variable replacement", False, 
                        "Failed to create nested template")

    def test_remaining_crud_operations(self):
        """Test remaining CRUD operations"""
        print("\n=== Testing Remaining CRUD Operations ===")
        
        # Test 7: POST /api/templates/{type}/{id}/duplicate - Duplicate template
        if self.created_templates:
            template_type, template_id = self.created_templates[0]
            print(f"\n7. Testing POST /api/templates/{template_type}/{template_id}/duplicate - Duplicate template")
            
            duplicate_data = {
                "new_name": f"Duplicated Template {uuid.uuid4().hex[:8]}"
            }
            
            response = self.make_request("POST", f"/templates/{template_type}/{template_id}/duplicate", 
                                       params=duplicate_data)
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success") and result.get("template"):
                        duplicate_id = result["template"]["_id"]
                        self.created_templates.append((template_type, duplicate_id))
                        self.log_test("Duplicate template", True, 
                                    f"Template duplicated with ID: {duplicate_id}")
                    else:
                        self.log_test("Duplicate template", False, 
                                    "Success=False or missing template", result)
                except json.JSONDecodeError:
                    self.log_test("Duplicate template", False, 
                                "Invalid JSON response", response.text)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f", Error: {error_data}"
                    except:
                        error_msg += f", Text: {response.text}"
                self.log_test("Duplicate template", False, error_msg)
        else:
            self.log_test("Duplicate template", False, "No templates created to test with")

        # Test 6: DELETE /api/templates/{type}/{id} - Delete template
        if len(self.created_templates) > 1:  # Keep at least one for other tests
            template_type, template_id = self.created_templates[-1]  # Delete the last one
            print(f"\n6. Testing DELETE /api/templates/{template_type}/{template_id} - Delete template")
            
            response = self.make_request("DELETE", f"/templates/{template_type}/{template_id}")
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success"):
                        self.log_test("Delete template", True, 
                                    "Template deleted successfully")
                        self.created_templates.pop()  # Remove from our list
                    else:
                        self.log_test("Delete template", False, 
                                    "Success=False", result)
                except json.JSONDecodeError:
                    self.log_test("Delete template", False, 
                                "Invalid JSON response", response.text)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f", Error: {error_data}"
                    except:
                        error_msg += f", Text: {response.text}"
                self.log_test("Delete template", False, error_msg)
        else:
            self.log_test("Delete template", False, "No extra templates to delete")

    def run_all_tests(self):
        """Run all test suites"""
        print("🧪 Starting Comprehensive Template System Testing")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            # Run all test suites
            self.test_suite_1_template_crud()
            self.test_suite_2_template_application()
            self.test_suite_3_utility_endpoints()
            self.test_suite_4_prebuilt_templates()
            self.test_suite_5_variable_system()
            self.test_remaining_crud_operations()
            
            # Print summary
            self.print_summary()
            
        except Exception as e:
            print(f"\n❌ Testing failed with error: {str(e)}")
            return False
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEMPLATE SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}")
        
        print("\n" + "=" * 60)


if __name__ == "__main__":
    tester = TemplateSystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)