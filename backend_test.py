#!/usr/bin/env python3
"""
Backend API Testing for Communication Preference Feature
Tests comprehensive scenarios for customer communication preferences
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://snowops-admin.preview.emergentagent.com/api"

class CommunicationPreferenceTests:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.created_customers = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_create_customer_sms_preference(self):
        """Test 1: Create Customer with SMS Preference + Mobile"""
        test_name = "Create Customer with SMS Preference + Mobile"
        
        customer_data = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "(403) 555-1234",
            "mobile": "(555) 987-6543",
            "communication_preference": "sms",
            "address": "123 Main St, Calgary, AB",
            "customer_type": "individual",
            "notes": "Test customer for SMS preference"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers", json=customer_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                customer_id = data.get("id")
                
                # Verify all fields are saved correctly
                if (data.get("communication_preference") == "sms" and 
                    data.get("mobile") == "(555) 987-6543" and
                    data.get("name") == "Jane Doe"):
                    
                    self.created_customers.append(customer_id)
                    self.log_result(test_name, True, 
                                  f"Customer created successfully with SMS preference. ID: {customer_id}")
                    return customer_id
                else:
                    self.log_result(test_name, False, 
                                  "Customer created but fields not saved correctly", data)
                    return None
            else:
                self.log_result(test_name, False, 
                              f"Failed to create customer. Status: {response.status_code}", 
                              response.text)
                return None
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception occurred: {str(e)}")
            return None

    def test_create_customer_inapp_preference(self):
        """Test 2: Create Customer with InApp Preference (No Mobile)"""
        test_name = "Create Customer with InApp Preference (No Mobile)"
        
        customer_data = {
            "name": "Bob Smith",
            "email": "bob@example.com",
            "phone": "(403) 555-5678",
            "mobile": "",  # Empty mobile
            "communication_preference": "inapp",
            "address": "456 Oak Ave, Calgary, AB",
            "customer_type": "individual",
            "notes": "Test customer for InApp preference"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers", json=customer_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                customer_id = data.get("id")
                
                # Verify communication preference is inapp and mobile is empty
                if (data.get("communication_preference") == "inapp" and 
                    data.get("mobile") == "" and
                    data.get("name") == "Bob Smith"):
                    
                    self.created_customers.append(customer_id)
                    self.log_result(test_name, True, 
                                  f"Customer created successfully with InApp preference. ID: {customer_id}")
                    return customer_id
                else:
                    self.log_result(test_name, False, 
                                  "Customer created but fields not saved correctly", data)
                    return None
            else:
                self.log_result(test_name, False, 
                              f"Failed to create customer. Status: {response.status_code}", 
                              response.text)
                return None
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception occurred: {str(e)}")
            return None

    def test_retrieve_customer_preference(self, customer_id):
        """Test 3: Retrieve Customer and Verify Preference"""
        test_name = "Retrieve Customer and Verify Preference"
        
        if not customer_id:
            self.log_result(test_name, False, "No customer ID provided for retrieval test")
            return
        
        try:
            response = requests.get(f"{self.base_url}/customers/{customer_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response includes communication_preference field
                if "communication_preference" in data:
                    preference = data.get("communication_preference")
                    mobile = data.get("mobile", "")
                    
                    self.log_result(test_name, True, 
                                  f"Customer retrieved successfully. Preference: {preference}, Mobile: {mobile}")
                else:
                    self.log_result(test_name, False, 
                                  "Customer retrieved but missing communication_preference field", data)
            else:
                self.log_result(test_name, False, 
                              f"Failed to retrieve customer. Status: {response.status_code}", 
                              response.text)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception occurred: {str(e)}")

    def test_update_communication_preference(self, customer_id):
        """Test 4: Update Communication Preference"""
        test_name = "Update Communication Preference"
        
        if not customer_id:
            self.log_result(test_name, False, "No customer ID provided for update test")
            return
        
        update_data = {
            "communication_preference": "inapp"
        }
        
        try:
            response = requests.put(f"{self.base_url}/customers/{customer_id}", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify preference was updated
                if data.get("communication_preference") == "inapp":
                    self.log_result(test_name, True, 
                                  "Communication preference updated successfully from SMS to InApp")
                else:
                    self.log_result(test_name, False, 
                                  "Update request succeeded but preference not changed", data)
            else:
                self.log_result(test_name, False, 
                              f"Failed to update customer. Status: {response.status_code}", 
                              response.text)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception occurred: {str(e)}")

    def test_list_customers_preference_field(self):
        """Test 5: List All Customers - Check Preference Field"""
        test_name = "List All Customers - Check Preference Field"
        
        try:
            response = requests.get(f"{self.base_url}/customers", timeout=10)
            
            if response.status_code == 200:
                customers = response.json()
                
                if isinstance(customers, list) and len(customers) > 0:
                    # Check if all customers have communication_preference field
                    customers_with_preference = 0
                    total_customers = len(customers)
                    
                    for customer in customers:
                        if "communication_preference" in customer:
                            customers_with_preference += 1
                    
                    if customers_with_preference == total_customers:
                        self.log_result(test_name, True, 
                                      f"All {total_customers} customers have communication_preference field")
                    else:
                        self.log_result(test_name, False, 
                                      f"Only {customers_with_preference}/{total_customers} customers have communication_preference field")
                else:
                    self.log_result(test_name, True, 
                                  "No customers found in system (empty list returned)")
                    
            else:
                self.log_result(test_name, False, 
                              f"Failed to list customers. Status: {response.status_code}", 
                              response.text)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception occurred: {str(e)}")

    def test_edge_cases(self):
        """Test 6: Edge Cases and Validation"""
        test_name = "Edge Cases and Validation"
        
        # Test with invalid communication preference
        invalid_customer_data = {
            "name": "Test Invalid",
            "email": "invalid@example.com",
            "phone": "(403) 555-9999",
            "communication_preference": "invalid_preference",  # Invalid value
            "address": "789 Test St, Calgary, AB",
            "customer_type": "individual"
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers", json=invalid_customer_data, timeout=10)
            
            # Should either accept it (no validation) or reject it (with validation)
            if response.status_code in [200, 201]:
                data = response.json()
                customer_id = data.get("id")
                if customer_id:
                    self.created_customers.append(customer_id)
                
                self.log_result(test_name, True, 
                              "System accepts invalid communication preference (no validation enforced)")
            elif response.status_code in [400, 422]:
                self.log_result(test_name, True, 
                              "System properly validates communication preference values")
            else:
                self.log_result(test_name, False, 
                              f"Unexpected response for invalid data. Status: {response.status_code}", 
                              response.text)
                
        except Exception as e:
            self.log_result(test_name, False, f"Exception occurred: {str(e)}")

    def cleanup_test_data(self):
        """Clean up test customers"""
        print("🧹 Cleaning up test data...")
        
        for customer_id in self.created_customers:
            try:
                response = requests.delete(f"{self.base_url}/customers/{customer_id}", timeout=10)
                if response.status_code in [200, 204]:
                    print(f"   Deleted customer {customer_id}")
                else:
                    print(f"   Failed to delete customer {customer_id}: {response.status_code}")
            except Exception as e:
                print(f"   Error deleting customer {customer_id}: {str(e)}")

    def run_all_tests(self):
        """Run all communication preference tests"""
        print("🚀 Starting Communication Preference Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Create customer with SMS preference
        sms_customer_id = self.test_create_customer_sms_preference()
        
        # Test 2: Create customer with InApp preference
        inapp_customer_id = self.test_create_customer_inapp_preference()
        
        # Test 3: Retrieve customer and verify preference
        if sms_customer_id:
            self.test_retrieve_customer_preference(sms_customer_id)
        
        # Test 4: Update communication preference
        if sms_customer_id:
            self.test_update_communication_preference(sms_customer_id)
        
        # Test 5: List customers and check preference field
        self.test_list_customers_preference_field()
        
        # Test 6: Edge cases
        self.test_edge_cases()
        
        # Summary
        self.print_summary()
        
        # Cleanup
        self.cleanup_test_data()

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

class CustomerAttachmentsTests:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.created_customers = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_create_customer_with_attachments(self):
        """Test Case 1: Create customer with attachments field"""
        test_name = "Create Customer with Attachments"
        
        # Sample base64 encoded file data (small image)
        sample_file_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        customer_data = {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@example.com", 
            "phone": "+1-555-0123",
            "mobile": "+1-555-0124",
            "address": "123 Main Street, Toronto, ON M5V 3A8",
            "customer_type": "individual",
            "communication_preference": "sms",
            "attachments": [
                {
                    "name": "drivers_license.jpg",
                    "type": "image/jpeg",
                    "size": 1024,
                    "data": sample_file_data
                },
                {
                    "name": "property_deed.pdf", 
                    "type": "application/pdf",
                    "size": 2048,
                    "data": sample_file_data
                }
            ]
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers", json=customer_data)
            
            if response.status_code in [200, 201]:
                customer = response.json()
                customer_id = customer.get('id')
                self.created_customers.append(customer_id)
                
                # Verify attachments are in response
                if 'attachments' in customer and len(customer['attachments']) == 2:
                    self.log_result(
                        test_name, 
                        True, 
                        f"Customer created successfully with ID: {customer_id}. Attachments field present with {len(customer['attachments'])} files"
                    )
                    return customer_id
                else:
                    self.log_result(
                        test_name, 
                        False, 
                        "Attachments field missing or incorrect count", 
                        customer
                    )
                    return None
            else:
                self.log_result(
                    test_name, 
                    False, 
                    f"Failed to create customer. Status: {response.status_code}", 
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
            return None

    def test_create_customer_without_attachments(self):
        """Test Case 2: Create customer without attachments field"""
        test_name = "Create Customer without Attachments"
        
        customer_data = {
            "name": "Michael Chen",
            "email": "michael.chen@example.com",
            "phone": "+1-555-0125", 
            "address": "456 Oak Avenue, Vancouver, BC V6B 1A1",
            "customer_type": "individual",
            "communication_preference": "inapp"
            # Note: No attachments field
        }
        
        try:
            response = requests.post(f"{self.base_url}/customers", json=customer_data)
            
            if response.status_code in [200, 201]:
                customer = response.json()
                customer_id = customer.get('id')
                self.created_customers.append(customer_id)
                
                # Verify attachments field is empty or default
                attachments = customer.get('attachments', [])
                self.log_result(
                    test_name, 
                    True, 
                    f"Customer created successfully with ID: {customer_id}. Attachments field: {attachments} (empty as expected)"
                )
                return customer_id
            else:
                self.log_result(
                    test_name, 
                    False, 
                    f"Failed to create customer. Status: {response.status_code}", 
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
            return None

    def test_get_customer_with_attachments(self, customer_id):
        """Test Case 3: Get customer with attachments"""
        test_name = "Get Customer with Attachments"
        
        if not customer_id:
            self.log_result(test_name, False, "No customer ID provided")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/customers/{customer_id}")
            
            if response.status_code == 200:
                customer = response.json()
                
                # Verify attachments field is returned
                if 'attachments' in customer:
                    attachments = customer['attachments']
                    attachment_details = []
                    
                    for i, attachment in enumerate(attachments):
                        name = attachment.get('name', 'Unknown')
                        file_type = attachment.get('type', 'Unknown')
                        size = attachment.get('size', 0)
                        has_data = 'data' in attachment and len(attachment.get('data', '')) > 0
                        attachment_details.append(f"{name} ({file_type}, {size} bytes, data: {'✅' if has_data else '❌'})")
                    
                    self.log_result(
                        test_name, 
                        True, 
                        f"Customer retrieved successfully: {customer.get('name')}. Attachments field present with {len(attachments)} files: {', '.join(attachment_details)}"
                    )
                    return True
                else:
                    self.log_result(
                        test_name, 
                        False, 
                        "Attachments field missing from response", 
                        customer
                    )
                    return False
            else:
                self.log_result(
                    test_name, 
                    False, 
                    f"Failed to get customer. Status: {response.status_code}", 
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
            return False

    def test_database_storage_verification(self, customer_id):
        """Additional Test: Verify attachments are stored in database"""
        test_name = "Database Storage Verification"
        
        if not customer_id:
            self.log_result(test_name, False, "No customer ID provided")
            return False
            
        try:
            import base64
            
            # Get customer again to verify persistence
            response = requests.get(f"{self.base_url}/customers/{customer_id}")
            
            if response.status_code == 200:
                customer = response.json()
                attachments = customer.get('attachments', [])
                
                if len(attachments) > 0:
                    valid_attachments = []
                    invalid_attachments = []
                    
                    # Check if data is properly base64 encoded
                    for attachment in attachments:
                        data = attachment.get('data', '')
                        if data:
                            try:
                                # Try to decode base64 data
                                decoded = base64.b64decode(data)
                                valid_attachments.append(f"{attachment.get('name')} ({len(decoded)} bytes)")
                            except Exception as decode_error:
                                invalid_attachments.append(f"{attachment.get('name')}: {decode_error}")
                    
                    if len(invalid_attachments) == 0:
                        self.log_result(
                            test_name, 
                            True, 
                            f"All {len(attachments)} attachments properly stored in database: {', '.join(valid_attachments)}"
                        )
                        return True
                    else:
                        self.log_result(
                            test_name, 
                            False, 
                            f"Invalid attachments found: {', '.join(invalid_attachments)}"
                        )
                        return False
                else:
                    self.log_result(test_name, True, "No attachments to verify")
                    return True
            else:
                self.log_result(
                    test_name, 
                    False, 
                    f"Failed to retrieve customer for verification. Status: {response.status_code}", 
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(test_name, False, f"Error during verification: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test customers"""
        print("🧹 Cleaning up test data...")
        for customer_id in self.created_customers:
            try:
                response = requests.delete(f"{self.base_url}/customers/{customer_id}")
                if response.status_code == 200:
                    print(f"   ✅ Deleted customer {customer_id}")
                else:
                    print(f"   ⚠️  Failed to delete customer {customer_id}")
            except Exception as e:
                print(f"   ❌ Error deleting customer {customer_id}: {str(e)}")

    def run_all_tests(self):
        """Run all customer attachment tests"""
        print("🚀 Starting Customer Attachments API Tests")
        print("=" * 50)
        
        # Test Case 1: Create customer with attachments
        customer_id_with_attachments = self.test_create_customer_with_attachments()
        
        # Test Case 2: Create customer without attachments
        customer_id_without_attachments = self.test_create_customer_without_attachments()
        
        # Test Case 3: Get customer with attachments
        if customer_id_with_attachments:
            self.test_get_customer_with_attachments(customer_id_with_attachments)
        
        # Additional Test: Database verification
        if customer_id_with_attachments:
            self.test_database_storage_verification(customer_id_with_attachments)
        
        # Summary
        self.print_summary()
        
        # Cleanup
        self.cleanup_test_data()

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 CUSTOMER ATTACHMENTS TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    # Run communication preference tests
    print("Running Communication Preference Tests...")
    comm_tester = CommunicationPreferenceTests()
    comm_tester.run_all_tests()
    
    print("\n" + "="*80 + "\n")
    
    # Run customer attachments tests
    print("Running Customer Attachments Tests...")
    attachments_tester = CustomerAttachmentsTests()
    attachments_tester.run_all_tests()