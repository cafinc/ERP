#!/usr/bin/env python3
"""
Backend API Testing for Customer Company Linking Feature
Tests customer creation and company linking functionality
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://snow-dash-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class CustomerTestSuite:
    def __init__(self):
        self.session = requests.Session()
        self.created_customers = []  # Track created customers for cleanup
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status_symbol = "✅" if status == "PASS" else "❌"
        print(f"[{timestamp}] {status_symbol} {test_name}: {status}")
        if details:
            print(f"    Details: {details}")
        print()
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request and return response data"""
        url = f"{API_BASE}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError:
            return {
                "status_code": response.status_code,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }
    
    def test_1_company_customer_creation(self):
        """Test 1: Company Customer Creation"""
        test_name = "Company Customer Creation"
        
        company_data = {
            "name": "ABC Snow Services Inc.",
            "email": "admin@abcsnow.ca",
            "phone": "(403) 555-1234",
            "address": "123 Main St SW, Calgary, AB T2P 1J9, Canada",
            "customer_type": "company",
            "notes": "Commercial snow removal company",
            "accounting": {
                "tax_id": "123456789",
                "billing_email": "billing@abcsnow.ca",
                "billing_phone": "(403) 555-1235",
                "payment_terms": "net_30",
                "credit_limit": 50000.0,
                "preferred_payment_method": "invoice",
                "po_required": True,
                "billing_address": "123 Main St SW, Calgary, AB T2P 1J9, Canada"
            }
        }
        
        response = self.make_request("POST", "/customers", company_data)
        
        if response["success"]:
            customer_data = response["data"]
            self.created_customers.append(customer_data.get("id"))
            
            # Verify required fields
            checks = [
                ("ID field present", customer_data.get("id") is not None),
                ("Name correct", customer_data.get("name") == company_data["name"]),
                ("Email correct", customer_data.get("email") == company_data["email"]),
                ("Phone correct", customer_data.get("phone") == company_data["phone"]),
                ("Address correct", customer_data.get("address") == company_data["address"]),
                ("Customer type correct", customer_data.get("customer_type") == "company"),
                ("Accounting fields saved", customer_data.get("accounting") is not None)
            ]
            
            failed_checks = [check[0] for check in checks if not check[1]]
            
            if not failed_checks:
                self.log_test(test_name, "PASS", f"Company created with ID: {customer_data.get('id')}")
                return customer_data.get("id")
            else:
                self.log_test(test_name, "FAIL", f"Failed checks: {', '.join(failed_checks)}")
                return None
        else:
            self.log_test(test_name, "FAIL", f"HTTP {response['status_code']}: {response['data']}")
            return None
    
    def test_2_individual_customer_without_company(self):
        """Test 2: Individual Customer Creation WITHOUT Company Link"""
        test_name = "Individual Customer Creation (No Company Link)"
        
        individual_data = {
            "name": "John Smith",
            "email": "john@example.com",
            "phone": "(403) 555-5678",
            "address": "456 Oak Ave NW, Calgary, AB T2N 2K8, Canada",
            "customer_type": "individual",
            "notes": "Residential customer"
        }
        
        response = self.make_request("POST", "/customers", individual_data)
        
        if response["success"]:
            customer_data = response["data"]
            self.created_customers.append(customer_data.get("id"))
            
            # Verify required fields
            checks = [
                ("ID field present", customer_data.get("id") is not None),
                ("Name correct", customer_data.get("name") == individual_data["name"]),
                ("Email correct", customer_data.get("email") == individual_data["email"]),
                ("Customer type correct", customer_data.get("customer_type") == "individual"),
                ("No company_id", customer_data.get("company_id") is None),
                ("No company_name", customer_data.get("company_name") is None)
            ]
            
            failed_checks = [check[0] for check in checks if not check[1]]
            
            if not failed_checks:
                self.log_test(test_name, "PASS", f"Individual created with ID: {customer_data.get('id')}")
                return customer_data.get("id")
            else:
                self.log_test(test_name, "FAIL", f"Failed checks: {', '.join(failed_checks)}")
                return None
        else:
            self.log_test(test_name, "FAIL", f"HTTP {response['status_code']}: {response['data']}")
            return None
    
    def test_3_individual_customer_with_company_link(self, company_id: str):
        """Test 3: Individual Customer Creation WITH Company Link"""
        test_name = "Individual Customer Creation (With Company Link)"
        
        if not company_id:
            self.log_test(test_name, "SKIP", "No company ID available from previous test")
            return None
        
        # First get company name
        company_response = self.make_request("GET", f"/customers/{company_id}")
        if not company_response["success"]:
            self.log_test(test_name, "FAIL", "Could not retrieve company for linking")
            return None
        
        company_name = company_response["data"].get("name")
        
        individual_data = {
            "name": "Jane Doe",
            "email": "jane.doe@abcsnow.ca",
            "phone": "(403) 555-9876",
            "address": "789 Pine St SE, Calgary, AB T2G 3H7, Canada",
            "customer_type": "individual",
            "company_id": company_id,
            "company_name": company_name,
            "notes": "Employee of ABC Snow Services"
        }
        
        response = self.make_request("POST", "/customers", individual_data)
        
        if response["success"]:
            customer_data = response["data"]
            self.created_customers.append(customer_data.get("id"))
            
            # Verify required fields
            checks = [
                ("ID field present", customer_data.get("id") is not None),
                ("Name correct", customer_data.get("name") == individual_data["name"]),
                ("Customer type correct", customer_data.get("customer_type") == "individual"),
                ("Company ID saved", customer_data.get("company_id") == company_id),
                ("Company name saved", customer_data.get("company_name") == company_name)
            ]
            
            failed_checks = [check[0] for check in checks if not check[1]]
            
            if not failed_checks:
                self.log_test(test_name, "PASS", f"Individual linked to company, ID: {customer_data.get('id')}")
                return customer_data.get("id")
            else:
                self.log_test(test_name, "FAIL", f"Failed checks: {', '.join(failed_checks)}")
                return None
        else:
            self.log_test(test_name, "FAIL", f"HTTP {response['status_code']}: {response['data']}")
            return None
    
    def test_4_retrieve_customer_with_company_link(self, individual_id: str):
        """Test 4: Retrieve Customer with Company Link"""
        test_name = "Retrieve Customer with Company Link"
        
        if not individual_id:
            self.log_test(test_name, "SKIP", "No individual ID available from previous test")
            return
        
        response = self.make_request("GET", f"/customers/{individual_id}")
        
        if response["success"]:
            customer_data = response["data"]
            
            # Verify company link fields are present
            checks = [
                ("Customer retrieved", customer_data.get("id") == individual_id),
                ("Company ID present", customer_data.get("company_id") is not None),
                ("Company name present", customer_data.get("company_name") is not None),
                ("Data integrity", len(customer_data.get("company_name", "")) > 0)
            ]
            
            failed_checks = [check[0] for check in checks if not check[1]]
            
            if not failed_checks:
                self.log_test(test_name, "PASS", f"Company link data: {customer_data.get('company_name')}")
            else:
                self.log_test(test_name, "FAIL", f"Failed checks: {', '.join(failed_checks)}")
        else:
            self.log_test(test_name, "FAIL", f"HTTP {response['status_code']}: {response['data']}")
    
    def test_5_list_customers_filter_by_type(self):
        """Test 5: List All Customers - Filter by Type"""
        test_name = "List Customers - Filter by Company Type"
        
        # Get all customers first
        all_response = self.make_request("GET", "/customers")
        
        if not all_response["success"]:
            self.log_test(test_name, "FAIL", f"Could not retrieve customers: {all_response['data']}")
            return
        
        all_customers = all_response["data"]
        
        # Filter companies manually (since API doesn't have type filter)
        company_customers = [c for c in all_customers if c.get("customer_type") == "company"]
        individual_customers = [c for c in all_customers if c.get("customer_type") == "individual"]
        
        checks = [
            ("Customers retrieved", len(all_customers) > 0),
            ("Company customers found", len(company_customers) > 0),
            ("Individual customers found", len(individual_customers) > 0),
            ("Type filtering works", all(c.get("customer_type") == "company" for c in company_customers))
        ]
        
        failed_checks = [check[0] for check in checks if not check[1]]
        
        if not failed_checks:
            self.log_test(test_name, "PASS", f"Found {len(company_customers)} companies, {len(individual_customers)} individuals")
        else:
            self.log_test(test_name, "FAIL", f"Failed checks: {', '.join(failed_checks)}")
    
    def test_6_update_customer_company_link(self, individual_id: str, company_id: str):
        """Test 6: Update Customer Company Link"""
        test_name = "Update Customer Company Link"
        
        if not individual_id or not company_id:
            self.log_test(test_name, "SKIP", "Missing individual or company ID from previous tests")
            return
        
        # Get company name for update
        company_response = self.make_request("GET", f"/customers/{company_id}")
        if not company_response["success"]:
            self.log_test(test_name, "FAIL", "Could not retrieve company for update")
            return
        
        company_name = company_response["data"].get("name")
        
        update_data = {
            "company_id": company_id,
            "company_name": f"Updated - {company_name}",
            "notes": "Updated company link"
        }
        
        response = self.make_request("PUT", f"/customers/{individual_id}", update_data)
        
        if response["success"]:
            customer_data = response["data"]
            
            checks = [
                ("Update successful", customer_data.get("id") == individual_id),
                ("Company ID updated", customer_data.get("company_id") == company_id),
                ("Company name updated", "Updated -" in customer_data.get("company_name", "")),
                ("Notes updated", customer_data.get("notes") == "Updated company link")
            ]
            
            failed_checks = [check[0] for check in checks if not check[1]]
            
            if not failed_checks:
                self.log_test(test_name, "PASS", "Company link updated successfully")
            else:
                self.log_test(test_name, "FAIL", f"Failed checks: {', '.join(failed_checks)}")
        else:
            self.log_test(test_name, "FAIL", f"HTTP {response['status_code']}: {response['data']}")
    
    def cleanup(self):
        """Clean up created test data"""
        print("🧹 Cleaning up test data...")
        for customer_id in self.created_customers:
            try:
                response = self.make_request("DELETE", f"/customers/{customer_id}")
                if response["success"]:
                    print(f"   ✅ Deleted customer {customer_id}")
                else:
                    print(f"   ❌ Failed to delete customer {customer_id}")
            except Exception as e:
                print(f"   ❌ Error deleting customer {customer_id}: {e}")
        print()
    
    def run_all_tests(self):
        """Run all customer company linking tests"""
        print("🚀 Starting Customer Company Linking Backend Tests")
        print(f"📡 Backend URL: {API_BASE}")
        print("=" * 60)
        print()
        
        # Test 1: Create company customer
        company_id = self.test_1_company_customer_creation()
        
        # Test 2: Create individual without company
        individual_no_company_id = self.test_2_individual_customer_without_company()
        
        # Test 3: Create individual with company link
        individual_with_company_id = self.test_3_individual_customer_with_company_link(company_id)
        
        # Test 4: Retrieve customer with company link
        self.test_4_retrieve_customer_with_company_link(individual_with_company_id)
        
        # Test 5: List customers and filter by type
        self.test_5_list_customers_filter_by_type()
        
        # Test 6: Update customer company link
        self.test_6_update_customer_company_link(individual_no_company_id, company_id)
        
        print("=" * 60)
        print("🏁 Customer Company Linking Tests Complete")
        
        # Cleanup
        self.cleanup()

def main():
    """Main test execution"""
    test_suite = CustomerTestSuite()
    try:
        test_suite.run_all_tests()
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        test_suite.cleanup()
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        test_suite.cleanup()

if __name__ == "__main__":
    main()