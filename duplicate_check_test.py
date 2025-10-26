#!/usr/bin/env python3
"""
Duplicate Customer Check Endpoint Testing
Tests the POST /api/customers/check-duplicate endpoint functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://glass-admin-dash.preview.emergentagent.com/api"

class DuplicateCustomerTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.existing_customers = []
        self.created_test_customers = []
        
    def log_result(self, test_name, success, details="", response_data=None):
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
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def get_existing_customers(self):
        """Get existing customers to use for testing"""
        try:
            response = requests.get(f"{self.base_url}/customers", timeout=10)
            if response.status_code == 200:
                customers = response.json()
                self.existing_customers = customers[:5]  # Use first 5 for testing
                print(f"Found {len(customers)} existing customers, using {len(self.existing_customers)} for testing")
                return True
            else:
                print(f"Failed to get customers: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error getting customers: {e}")
            return False

    def create_test_customers(self):
        """Create some test customers for duplicate testing"""
        test_customers = [
            {
                "name": "John Smith Duplicate Test",
                "email": "john.duplicate@example.com",
                "phone": "(555) 123-4567",
                "customer_type": "individual",
                "address": "123 Main St, Anytown, ST 12345"
            },
            {
                "name": "Jane Doe Duplicate Test",
                "email": "jane.duplicate@example.com", 
                "phone": "555-987-6543",
                "customer_type": "individual",
                "address": "456 Oak Ave, Somewhere, ST 67890"
            },
            {
                "name": "ABC Company Duplicate Test",
                "email": "contact@abccompany.com",
                "phone": "(555) 555-1234",
                "customer_type": "company",
                "address": "789 Business Blvd, Corporate City, ST 11111"
            }
        ]
        
        created_customers = []
        for customer_data in test_customers:
            try:
                response = requests.post(f"{self.base_url}/customers", json=customer_data, timeout=10)
                if response.status_code in [200, 201]:
                    created_customer = response.json()
                    created_customers.append(created_customer)
                    self.created_test_customers.append(created_customer["id"])
                    print(f"Created test customer: {customer_data['name']}")
                else:
                    print(f"Failed to create customer {customer_data['name']}: {response.status_code}")
            except Exception as e:
                print(f"Error creating customer {customer_data['name']}: {e}")
        
        return created_customers

    def test_exact_email_match(self):
        """Test duplicate check with exact email match"""
        print("Testing exact email match...")
        
        # Use existing customers first
        test_customers = self.existing_customers + [c for c in self.created_test_customers if isinstance(c, dict)]
        
        if not test_customers:
            self.log_result("Exact Email Match", False, "No customers available for testing")
            return
        
        # Use first customer's email
        test_customer = test_customers[0] if isinstance(test_customers[0], dict) else None
        if not test_customer:
            # Try to get customer details
            try:
                customer_id = test_customers[0] if isinstance(test_customers[0], str) else test_customers[0].get('id')
                response = requests.get(f"{self.base_url}/customers/{customer_id}", timeout=10)
                if response.status_code == 200:
                    test_customer = response.json()
            except:
                pass
        
        if not test_customer or not test_customer.get('email'):
            self.log_result("Exact Email Match", False, "No test customer with email found")
            return
        
        test_email = test_customer.get('email', '')
        test_data = {
            "email": test_email,
            "name": "Different Name",
            "phone": "555-999-8888"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if duplicates found
                if result.get('count', 0) > 0:
                    # Check if email match reason is present
                    email_match_found = False
                    for duplicate in result.get('duplicates', []):
                        if 'email' in duplicate.get('match_reason', []):
                            email_match_found = True
                            break
                    
                    if email_match_found:
                        self.log_result("Exact Email Match", True, f"Found {result['count']} duplicate(s) with email match")
                    else:
                        self.log_result("Exact Email Match", False, "Duplicates found but no email match reason", result)
                else:
                    self.log_result("Exact Email Match", False, "No duplicates found for existing email", result)
            else:
                self.log_result("Exact Email Match", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Exact Email Match", False, f"Request failed: {str(e)}")

    def test_exact_phone_match(self):
        """Test duplicate check with exact phone match (10 digits)"""
        print("Testing exact phone match...")
        
        # Use existing customers first
        test_customers = self.existing_customers + [c for c in self.created_test_customers if isinstance(c, dict)]
        
        if not test_customers:
            self.log_result("Exact Phone Match", False, "No customers available for testing")
            return
        
        # Find a customer with a phone number
        test_customer = None
        for customer in test_customers:
            if isinstance(customer, dict) and customer.get('phone'):
                test_customer = customer
                break
            elif isinstance(customer, str):
                # Try to get customer details
                try:
                    response = requests.get(f"{self.base_url}/customers/{customer}", timeout=10)
                    if response.status_code == 200:
                        cust_data = response.json()
                        if cust_data.get('phone'):
                            test_customer = cust_data
                            break
                except:
                    continue
        
        if not test_customer:
            self.log_result("Exact Phone Match", False, "No test customer with phone number found")
            return
        
        test_phone = test_customer.get('phone', '')
        
        test_data = {
            "email": "different@email.com",
            "name": "Different Name",
            "phone": test_phone  # Use exact same phone
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('count', 0) > 0:
                    # Check if phone match reason is present
                    phone_match_found = False
                    for duplicate in result.get('duplicates', []):
                        if 'phone' in duplicate.get('match_reason', []):
                            phone_match_found = True
                            break
                    
                    if phone_match_found:
                        self.log_result("Exact Phone Match", True, f"Found {result['count']} duplicate(s) with phone match")
                    else:
                        self.log_result("Exact Phone Match", False, "Duplicates found but no phone match reason", result)
                else:
                    self.log_result("Exact Phone Match", False, "No duplicates found for existing phone", result)
            else:
                self.log_result("Exact Phone Match", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Exact Phone Match", False, f"Request failed: {str(e)}")

    def test_name_similarity_match(self):
        """Test duplicate check with name similarity"""
        print("Testing name similarity match...")
        
        # Use existing customers first
        test_customers = self.existing_customers + [c for c in self.created_test_customers if isinstance(c, dict)]
        
        if not test_customers:
            self.log_result("Name Similarity Match", False, "No customers available for testing")
            return
        
        # Use first customer's name (partial)
        test_customer = test_customers[0] if isinstance(test_customers[0], dict) else None
        if not test_customer:
            # Try to get customer details
            try:
                customer_id = test_customers[0] if isinstance(test_customers[0], str) else test_customers[0].get('id')
                response = requests.get(f"{self.base_url}/customers/{customer_id}", timeout=10)
                if response.status_code == 200:
                    test_customer = response.json()
            except:
                pass
        
        if not test_customer:
            self.log_result("Name Similarity Match", False, "No test customer found")
            return
        
        full_name = test_customer.get('name', '')
        
        if len(full_name) < 4:
            self.log_result("Name Similarity Match", False, "Test customer name too short")
            return
        
        # Use partial name for similarity test
        partial_name = full_name[:len(full_name)//2] if len(full_name) > 6 else full_name
        
        test_data = {
            "email": "different@email.com",
            "name": partial_name,
            "phone": "555-999-7777"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('count', 0) > 0:
                    # Check if name match reason is present
                    name_match_found = False
                    for duplicate in result.get('duplicates', []):
                        if 'name' in duplicate.get('match_reason', []):
                            name_match_found = True
                            break
                    
                    if name_match_found:
                        self.log_result("Name Similarity Match", True, f"Found {result['count']} duplicate(s) with name match")
                    else:
                        self.log_result("Name Similarity Match", False, "Duplicates found but no name match reason", result)
                else:
                    self.log_result("Name Similarity Match", False, "No duplicates found for partial name", result)
            else:
                self.log_result("Name Similarity Match", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Name Similarity Match", False, f"Request failed: {str(e)}")

    def test_no_matches_unique_customer(self):
        """Test duplicate check with no matches (new unique customer)"""
        print("Testing no matches for unique customer...")
        
        test_data = {
            "email": "unique.customer.test@nonexistent.domain",
            "name": "Unique Test Customer Name 12345",
            "phone": "555-000-9999"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('count', 0) == 0 and len(result.get('duplicates', [])) == 0:
                    self.log_result("No Matches - Unique Customer", True, "No duplicates found for unique customer data")
                else:
                    self.log_result("No Matches - Unique Customer", False, f"Unexpected duplicates found: {result['count']}", result)
            else:
                self.log_result("No Matches - Unique Customer", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("No Matches - Unique Customer", False, f"Request failed: {str(e)}")

    def test_multiple_matches(self):
        """Test duplicate check with multiple matches"""
        print("Testing multiple matches...")
        
        # Create customers with similar data for multiple matches
        similar_customers = [
            {
                "name": "Test Multiple Match 1",
                "email": "test1@multiplematch.com",
                "phone": "555-111-2222",
                "customer_type": "individual"
            },
            {
                "name": "Test Multiple Match 2", 
                "email": "test2@multiplematch.com",
                "phone": "555-111-3333",
                "customer_type": "individual"
            }
        ]
        
        # Create the test customers
        created_ids = []
        for customer_data in similar_customers:
            try:
                response = requests.post(f"{self.base_url}/customers", json=customer_data, timeout=10)
                if response.status_code in [200, 201]:
                    created_customer = response.json()
                    created_ids.append(created_customer.get('id'))
                    self.created_test_customers.append(created_customer.get('id'))
            except Exception as e:
                print(f"Error creating test customer: {e}")
        
        # Now test for duplicates using partial name that should match both
        test_data = {
            "email": "different@email.com",
            "name": "Test Multiple Match",  # Should match both customers
            "phone": "555-999-8888"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('count', 0) >= 2:
                    self.log_result("Multiple Matches", True, f"Found {result['count']} multiple duplicates as expected")
                elif result.get('count', 0) >= 1:
                    self.log_result("Multiple Matches", True, f"Found {result['count']} duplicate(s) - partial success")
                else:
                    self.log_result("Multiple Matches", False, "No duplicates found for similar names", result)
            else:
                self.log_result("Multiple Matches", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Multiple Matches", False, f"Request failed: {str(e)}")

    def test_empty_missing_parameters(self):
        """Test duplicate check with empty/missing parameters"""
        print("Testing empty/missing parameters...")
        
        # Test 1: Empty object
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json={}, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('count', 0) == 0 and len(result.get('duplicates', [])) == 0:
                    self.log_result("Empty Parameters", True, "Empty request handled correctly")
                else:
                    self.log_result("Empty Parameters", False, "Empty request returned unexpected results", result)
            else:
                self.log_result("Empty Parameters", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Empty Parameters", False, f"Request failed: {str(e)}")
        
        # Test 2: Empty strings
        test_data = {
            "email": "",
            "name": "",
            "phone": ""
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('count', 0) == 0 and len(result.get('duplicates', [])) == 0:
                    self.log_result("Empty Strings", True, "Empty strings handled correctly")
                else:
                    self.log_result("Empty Strings", False, "Empty strings returned unexpected results", result)
            else:
                self.log_result("Empty Strings", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Empty Strings", False, f"Request failed: {str(e)}")
        
        # Test 3: Very short values (should be ignored)
        test_data = {
            "email": "a",
            "name": "ab",  # Less than 4 chars, should be ignored
            "phone": "123"  # Less than 10 digits, should be ignored
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('count', 0) == 0 and len(result.get('duplicates', [])) == 0:
                    self.log_result("Short Values", True, "Short values handled correctly (ignored)")
                else:
                    self.log_result("Short Values", False, "Short values returned unexpected results", result)
            else:
                self.log_result("Short Values", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Short Values", False, f"Request failed: {str(e)}")

    def test_phone_format_variations(self):
        """Test phone matching with different formats"""
        print("Testing phone format variations...")
        
        # Use existing customers first
        test_customers = self.existing_customers + [c for c in self.created_test_customers if isinstance(c, dict)]
        
        if not test_customers:
            self.log_result("Phone Format Variations", False, "No customers available for testing")
            return
        
        # Find a customer with a phone number
        test_customer = None
        for customer in test_customers:
            if isinstance(customer, dict) and customer.get('phone'):
                test_customer = customer
                break
            elif isinstance(customer, str):
                # Try to get customer details
                try:
                    response = requests.get(f"{self.base_url}/customers/{customer}", timeout=10)
                    if response.status_code == 200:
                        cust_data = response.json()
                        if cust_data.get('phone'):
                            test_customer = cust_data
                            break
                except:
                    continue
        
        if not test_customer:
            self.log_result("Phone Format Variations", False, "No test customer with phone number found")
            return
        
        original_phone = test_customer.get('phone', '')
        # Extract digits only
        digits_only = ''.join(filter(str.isdigit, original_phone))
        
        if len(digits_only) < 10:
            self.log_result("Phone Format Variations", False, "Test phone number too short")
            return
        
        # Test different formats of the same phone number
        phone_formats = [
            digits_only,  # Raw digits
            f"({digits_only[:3]}) {digits_only[3:6]}-{digits_only[6:]}",  # (555) 123-4567
            f"{digits_only[:3]}-{digits_only[3:6]}-{digits_only[6:]}",  # 555-123-4567
            f"{digits_only[:3]}.{digits_only[3:6]}.{digits_only[6:]}",  # 555.123.4567
        ]
        
        matches_found = 0
        for phone_format in phone_formats:
            test_data = {
                "email": "different@email.com",
                "name": "Different Name",
                "phone": phone_format
            }
            
            try:
                response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('count', 0) > 0:
                        # Check if phone match found
                        for duplicate in result.get('duplicates', []):
                            if 'phone' in duplicate.get('match_reason', []):
                                matches_found += 1
                                break
            except Exception as e:
                print(f"Error testing phone format {phone_format}: {e}")
        
        if matches_found >= 2:  # At least 2 different formats should match
            self.log_result("Phone Format Variations", True, f"Phone matching works across {matches_found} different formats")
        else:
            self.log_result("Phone Format Variations", False, f"Only {matches_found} phone formats matched")

    def test_response_format(self):
        """Test that response format matches expected structure"""
        print("Testing response format...")
        
        test_data = {
            "email": "format.test@example.com",
            "name": "Format Test Customer",
            "phone": "555-123-4567"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers/check-duplicate", json=test_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ['duplicates', 'count']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_result("Response Format", False, f"Missing required fields: {missing_fields}")
                    return
                
                # Check duplicates array structure
                if isinstance(result.get('duplicates'), list):
                    if len(result['duplicates']) > 0:
                        # Check first duplicate structure
                        duplicate = result['duplicates'][0]
                        expected_duplicate_fields = ['id', 'name', 'email', 'phone', 'customer_type', 'address', 'match_reason']
                        missing_duplicate_fields = [field for field in expected_duplicate_fields if field not in duplicate]
                        
                        if missing_duplicate_fields:
                            self.log_result("Response Format", False, f"Duplicate missing fields: {missing_duplicate_fields}")
                            return
                        
                        # Check match_reason is array
                        if not isinstance(duplicate.get('match_reason'), list):
                            self.log_result("Response Format", False, "match_reason should be an array")
                            return
                    
                    # Check count matches array length
                    if result.get('count') == len(result.get('duplicates', [])):
                        self.log_result("Response Format", True, "Response format is correct")
                    else:
                        self.log_result("Response Format", False, f"Count mismatch: count={result.get('count')}, array length={len(result.get('duplicates', []))}")
                else:
                    self.log_result("Response Format", False, "duplicates should be an array")
            else:
                self.log_result("Response Format", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Response Format", False, f"Request failed: {str(e)}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n=== Cleanup Test Data ===")
        
        # Delete created test customers
        for customer_id in self.created_test_customers:
            try:
                response = requests.delete(f"{self.base_url}/customers/{customer_id}", timeout=10)
                if response.status_code == 200:
                    print(f"✅ Deleted customer {customer_id}")
                else:
                    print(f"❌ Failed to delete customer {customer_id}: {response.status_code}")
            except Exception as e:
                print(f"❌ Error deleting customer {customer_id}: {str(e)}")

    def run_all_tests(self):
        """Run all duplicate customer check tests"""
        print("=" * 60)
        print("DUPLICATE CUSTOMER CHECK ENDPOINT TESTING")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print(f"Testing endpoint: POST /customers/check-duplicate")
        print()
        
        # Get existing customers for testing
        if not self.get_existing_customers():
            print("Warning: Could not get existing customers, some tests may fail")
        
        # Create some test customers
        print("Creating test customers...")
        self.create_test_customers()
        print()
        
        # Run all tests
        print("Running duplicate check tests...")
        print()
        
        self.test_exact_email_match()
        self.test_exact_phone_match()
        self.test_name_similarity_match()
        self.test_no_matches_unique_customer()
        self.test_multiple_matches()
        self.test_empty_missing_parameters()
        self.test_phone_format_variations()
        self.test_response_format()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        # Cleanup
        self.cleanup_test_data()
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = DuplicateCustomerTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if failed == 0 else 1)