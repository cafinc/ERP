#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Customer Creation and Management
Tests all customer CRUD operations, file attachments, communication preferences, and company linking
"""

import requests
import json
import base64
import time
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend/.env
BASE_URL = "https://admin-dash-restore.preview.emergentagent.com/api"

class CustomerManagementTests:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_customers = []
        self.created_sites = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
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

    def create_sample_base64_file(self, filename: str, content: str) -> dict:
        """Create a sample base64 encoded file for testing"""
        file_content = base64.b64encode(content.encode()).decode()
        return {
            "name": filename,
            "type": "text/plain" if filename.endswith('.txt') else "application/pdf",
            "size": len(content),
            "data": file_content
        }

    def test_customer_creation_contact_type(self):
        """Test 1: Customer Creation - Contact Type with all fields"""
        print("=== Test 1: Customer Creation - Contact Type ===")
        
        # Test 1a: Contact with SMS preference (mobile required)
        customer_data = {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@email.com",
            "phone": "555-0123",
            "mobile": "555-0124",
            "address": "123 Main Street, Toronto, ON M5V 3A8",
            "customer_type": "individual",
            "communication_preference": "sms",
            "custom_fields": [
                {
                    "field_name": "property_size",
                    "field_value": "2500",
                    "field_type": "number"
                },
                {
                    "field_name": "gate_code",
                    "field_value": "1234",
                    "field_type": "text"
                },
                {
                    "field_name": "service_start_date",
                    "field_value": "2024-01-15",
                    "field_type": "date"
                }
            ],
            "attachments": [
                self.create_sample_base64_file("property_photo.txt", "Sample property photo content"),
                self.create_sample_base64_file("contract.txt", "Sample contract document content")
            ],
            "tags": ["VIP", "Seasonal"],
            "notes": "Prefers early morning service. Has two driveways."
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=customer_data)
            if response.status_code == 201:
                customer = response.json()
                self.created_customers.append(customer["id"])
                
                # Verify all fields are properly saved
                required_fields = ["name", "email", "phone", "mobile", "address", "communication_preference"]
                missing_fields = [field for field in required_fields if not customer.get(field)]
                
                if not missing_fields and customer.get("custom_fields") and customer.get("attachments"):
                    self.log_result(
                        "Customer Creation - Contact Type (SMS preference)",
                        True,
                        f"Customer created with ID: {customer['id']}. All fields including custom_fields and attachments saved correctly."
                    )
                else:
                    self.log_result(
                        "Customer Creation - Contact Type (SMS preference)",
                        False,
                        f"Missing fields: {missing_fields}. Custom fields: {len(customer.get('custom_fields', []))}. Attachments: {len(customer.get('attachments', []))}"
                    )
            else:
                self.log_result(
                    "Customer Creation - Contact Type (SMS preference)",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Customer Creation - Contact Type (SMS preference)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 1b: Contact with InApp preference (mobile optional)
        customer_data_inapp = {
            "name": "Michael Chen",
            "email": "michael.chen@email.com", 
            "phone": "555-0125",
            "address": "456 Oak Avenue, Vancouver, BC V6B 2N9",
            "customer_type": "individual",
            "communication_preference": "inapp",
            "custom_fields": [
                {
                    "field_name": "preferred_time",
                    "field_value": "morning",
                    "field_type": "text"
                }
            ],
            "notes": "Prefers in-app notifications only"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=customer_data_inapp)
            if response.status_code == 201:
                customer = response.json()
                self.created_customers.append(customer["id"])
                
                if (customer.get("communication_preference") == "inapp" and 
                    not customer.get("mobile") and 
                    customer.get("name") == "Michael Chen"):
                    self.log_result(
                        "Customer Creation - Contact Type (InApp preference)",
                        True,
                        f"Customer created with ID: {customer['id']}. InApp preference set, mobile not required."
                    )
                else:
                    self.log_result(
                        "Customer Creation - Contact Type (InApp preference)",
                        False,
                        f"InApp preference not properly set or unexpected mobile field"
                    )
            else:
                self.log_result(
                    "Customer Creation - Contact Type (InApp preference)",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Customer Creation - Contact Type (InApp preference)",
                False,
                f"Exception: {str(e)}"
            )

    def test_customer_creation_company_type(self):
        """Test 2: Customer Creation - Company Type"""
        print("=== Test 2: Customer Creation - Company Type ===")
        
        company_data = {
            "name": "Maple Leaf Properties Inc.",
            "email": "admin@mapleleafproperties.com",
            "phone": "416-555-0100",
            "address": "789 Business District, Toronto, ON M5H 2N2",
            "customer_type": "company",
            "accounting": {
                "tax_id": "123456789RT0001",
                "billing_email": "billing@mapleleafproperties.com",
                "billing_phone": "416-555-0101",
                "payment_terms": "net_30",
                "credit_limit": 50000.00,
                "preferred_payment_method": "ach",
                "po_required": True,
                "billing_address": "789 Business District, Accounting Dept, Toronto, ON M5H 2N2",
                "notes": "Requires PO for all services over $1000"
            },
            "custom_fields": [
                {
                    "field_name": "account_manager",
                    "field_value": "Jennifer Smith",
                    "field_type": "text"
                },
                {
                    "field_name": "contract_renewal_date",
                    "field_value": "2024-12-31",
                    "field_type": "date"
                }
            ],
            "tags": ["Commercial", "High-Value"],
            "notes": "Large commercial client with multiple properties"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=company_data)
            if response.status_code == 201:
                company = response.json()
                self.created_customers.append(company["id"])
                
                # Verify company-specific fields
                if (company.get("customer_type") == "company" and 
                    company.get("accounting") and 
                    company["accounting"].get("tax_id") == "123456789RT0001"):
                    self.log_result(
                        "Customer Creation - Company Type",
                        True,
                        f"Company created with ID: {company['id']}. Accounting fields properly saved."
                    )
                else:
                    self.log_result(
                        "Customer Creation - Company Type",
                        False,
                        f"Company type or accounting fields not properly saved"
                    )
            else:
                self.log_result(
                    "Customer Creation - Company Type",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Customer Creation - Company Type",
                False,
                f"Exception: {str(e)}"
            )

    def test_site_creation_integration(self):
        """Test 3: Site Creation Integration (if createSite=true functionality exists)"""
        print("=== Test 3: Site Creation Integration ===")
        
        # Note: Based on the server.py code, there's no direct createSite parameter in customer creation
        # This would need to be implemented or tested via separate site creation
        
        # First create a customer
        customer_data = {
            "name": "Site Test Customer",
            "email": "sitetest@email.com",
            "phone": "555-0130",
            "address": "100 Site Test Road, Calgary, AB T2P 2M5",
            "customer_type": "individual"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=customer_data)
            if response.status_code == 201:
                customer = response.json()
                customer_id = customer["id"]
                self.created_customers.append(customer_id)
                
                # Try to create a site for this customer (if site endpoint exists)
                site_data = {
                    "name": "Customer Primary Site",
                    "address": "100 Site Test Road, Calgary, AB T2P 2M5",
                    "customer_id": customer_id,
                    "site_type": "residential"
                }
                
                site_response = self.session.post(f"{BASE_URL}/sites", json=site_data)
                if site_response.status_code == 201:
                    site = site_response.json()
                    self.created_sites.append(site["id"])
                    
                    # Update customer with site_id
                    update_response = self.session.put(
                        f"{BASE_URL}/customers/{customer_id}",
                        json={"site_ids": [site["id"]]}
                    )
                    
                    if update_response.status_code == 200:
                        self.log_result(
                            "Site Creation Integration",
                            True,
                            f"Site created and linked to customer. Site ID: {site['id']}"
                        )
                    else:
                        self.log_result(
                            "Site Creation Integration",
                            False,
                            f"Site created but failed to link to customer: {update_response.text}"
                        )
                else:
                    self.log_result(
                        "Site Creation Integration",
                        False,
                        f"Site creation failed: HTTP {site_response.status_code}: {site_response.text}"
                    )
            else:
                self.log_result(
                    "Site Creation Integration",
                    False,
                    f"Customer creation failed: HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Site Creation Integration",
                False,
                f"Exception: {str(e)}"
            )

    def test_user_access_creation(self):
        """Test 4: User Access Creation (require_access flow)"""
        print("=== Test 4: User Access Creation ===")
        
        customer_with_access_data = {
            "customer": {
                "name": "Access Test User",
                "email": "accesstest@email.com",
                "phone": "555-0140",
                "address": "200 Access Test Lane, Edmonton, AB T5J 2R4",
                "customer_type": "individual"
            },
            "require_access": True,
            "access_web": True,
            "access_inapp": True,
            "user_role": "customer"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers/with-access", json=customer_with_access_data)
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("customer") and result.get("user_account"):
                    customer = result["customer"]
                    user_account = result["user_account"]
                    self.created_customers.append(customer["id"])
                    
                    self.log_result(
                        "User Access Creation",
                        True,
                        f"Customer with access created. Customer ID: {customer['id']}, User ID: {user_account['id']}"
                    )
                else:
                    self.log_result(
                        "User Access Creation",
                        False,
                        f"Response missing expected fields: {result}"
                    )
            else:
                self.log_result(
                    "User Access Creation",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "User Access Creation",
                False,
                f"Exception: {str(e)}"
            )

    def test_link_to_company(self):
        """Test 5: Link to Company functionality"""
        print("=== Test 5: Link to Company ===")
        
        # First create a company
        company_data = {
            "name": "Test Company for Linking",
            "email": "company@testlinking.com",
            "phone": "555-0150",
            "address": "300 Company Plaza, Montreal, QC H3A 0G4",
            "customer_type": "company"
        }
        
        try:
            company_response = self.session.post(f"{BASE_URL}/customers", json=company_data)
            if company_response.status_code == 201:
                company = company_response.json()
                company_id = company["id"]
                self.created_customers.append(company_id)
                
                # Create an individual customer linked to the company
                individual_data = {
                    "name": "John Doe",
                    "email": "john.doe@testlinking.com",
                    "phone": "555-0151",
                    "address": "300 Company Plaza, Montreal, QC H3A 0G4",
                    "customer_type": "individual",
                    "company_id": company_id,
                    "company_name": company["name"]
                }
                
                individual_response = self.session.post(f"{BASE_URL}/customers", json=individual_data)
                if individual_response.status_code == 201:
                    individual = individual_response.json()
                    self.created_customers.append(individual["id"])
                    
                    # Verify the link
                    if (individual.get("company_id") == company_id and 
                        individual.get("company_name") == company["name"]):
                        self.log_result(
                            "Link to Company",
                            True,
                            f"Individual {individual['id']} successfully linked to company {company_id}"
                        )
                    else:
                        self.log_result(
                            "Link to Company",
                            False,
                            f"Company link not properly saved in individual record"
                        )
                else:
                    self.log_result(
                        "Link to Company",
                        False,
                        f"Individual creation failed: HTTP {individual_response.status_code}: {individual_response.text}"
                    )
            else:
                self.log_result(
                    "Link to Company",
                    False,
                    f"Company creation failed: HTTP {company_response.status_code}: {company_response.text}"
                )
        except Exception as e:
            self.log_result(
                "Link to Company",
                False,
                f"Exception: {str(e)}"
            )

    def test_file_upload(self):
        """Test 6: File Upload (attachments field with base64 data)"""
        print("=== Test 6: File Upload ===")
        
        # Create customer with multiple file attachments
        customer_data = {
            "name": "File Upload Test Customer",
            "email": "filetest@email.com",
            "phone": "555-0160",
            "address": "400 Upload Test Street, Ottawa, ON K1A 0A6",
            "customer_type": "individual",
            "attachments": [
                self.create_sample_base64_file("document1.txt", "This is the first test document with some content."),
                self.create_sample_base64_file("document2.txt", "This is the second test document with different content."),
                {
                    "name": "image.jpg",
                    "type": "image/jpeg",
                    "size": 1024,
                    "data": base64.b64encode(b"fake image data for testing").decode()
                }
            ]
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=customer_data)
            if response.status_code == 201:
                customer = response.json()
                self.created_customers.append(customer["id"])
                
                attachments = customer.get("attachments", [])
                if len(attachments) == 3:
                    # Verify all attachments have required fields
                    valid_attachments = all(
                        att.get("name") and att.get("type") and att.get("size") and att.get("data")
                        for att in attachments
                    )
                    
                    if valid_attachments:
                        self.log_result(
                            "File Upload",
                            True,
                            f"Customer created with {len(attachments)} attachments. All have required fields (name, type, size, data)."
                        )
                    else:
                        self.log_result(
                            "File Upload",
                            False,
                            f"Some attachments missing required fields"
                        )
                else:
                    self.log_result(
                        "File Upload",
                        False,
                        f"Expected 3 attachments, got {len(attachments)}"
                    )
            else:
                self.log_result(
                    "File Upload",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "File Upload",
                False,
                f"Exception: {str(e)}"
            )

    def test_customer_retrieval(self):
        """Test 7: Customer Retrieval (GET operations)"""
        print("=== Test 7: Customer Retrieval ===")
        
        # Test 7a: Get all customers
        try:
            response = self.session.get(f"{BASE_URL}/customers")
            if response.status_code == 200:
                customers = response.json()
                if isinstance(customers, list) and len(customers) > 0:
                    self.log_result(
                        "Customer Retrieval - List All",
                        True,
                        f"Retrieved {len(customers)} customers"
                    )
                else:
                    self.log_result(
                        "Customer Retrieval - List All",
                        False,
                        f"Expected list of customers, got: {type(customers)}"
                    )
            else:
                self.log_result(
                    "Customer Retrieval - List All",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Customer Retrieval - List All",
                False,
                f"Exception: {str(e)}"
            )

        # Test 7b: Get specific customer (if we have created customers)
        if self.created_customers:
            customer_id = self.created_customers[0]
            try:
                response = self.session.get(f"{BASE_URL}/customers/{customer_id}")
                if response.status_code == 200:
                    customer = response.json()
                    if customer.get("id") == customer_id:
                        self.log_result(
                            "Customer Retrieval - Get Specific",
                            True,
                            f"Retrieved customer {customer_id} with all fields"
                        )
                    else:
                        self.log_result(
                            "Customer Retrieval - Get Specific",
                            False,
                            f"Customer ID mismatch: expected {customer_id}, got {customer.get('id')}"
                        )
                else:
                    self.log_result(
                        "Customer Retrieval - Get Specific",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_result(
                    "Customer Retrieval - Get Specific",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_customer_update(self):
        """Test 8: Customer Update (PUT operations)"""
        print("=== Test 8: Customer Update ===")
        
        if not self.created_customers:
            self.log_result(
                "Customer Update",
                False,
                "No customers available for update testing"
            )
            return
        
        customer_id = self.created_customers[0]
        
        # Test updating various fields
        update_data = {
            "phone": "555-9999",
            "communication_preference": "inapp",
            "notes": "Updated notes for testing",
            "tags": ["Updated", "Test"]
        }
        
        try:
            response = self.session.put(f"{BASE_URL}/customers/{customer_id}", json=update_data)
            if response.status_code == 200:
                updated_customer = response.json()
                
                # Verify updates
                updates_applied = (
                    updated_customer.get("phone") == "555-9999" and
                    updated_customer.get("communication_preference") == "inapp" and
                    updated_customer.get("notes") == "Updated notes for testing"
                )
                
                if updates_applied:
                    self.log_result(
                        "Customer Update",
                        True,
                        f"Customer {customer_id} successfully updated with new phone, preference, and notes"
                    )
                else:
                    self.log_result(
                        "Customer Update",
                        False,
                        f"Updates not properly applied: {updated_customer}"
                    )
            else:
                self.log_result(
                    "Customer Update",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Customer Update",
                False,
                f"Exception: {str(e)}"
            )

        # Test adding/removing attachments
        if len(self.created_customers) > 1:
            customer_id = self.created_customers[1]
            
            new_attachment = self.create_sample_base64_file("updated_document.txt", "This is an updated document")
            
            try:
                response = self.session.put(
                    f"{BASE_URL}/customers/{customer_id}",
                    json={"attachments": [new_attachment]}
                )
                
                if response.status_code == 200:
                    updated_customer = response.json()
                    attachments = updated_customer.get("attachments", [])
                    
                    if len(attachments) == 1 and attachments[0].get("name") == "updated_document.txt":
                        self.log_result(
                            "Customer Update - Attachments",
                            True,
                            f"Customer attachments successfully updated"
                        )
                    else:
                        self.log_result(
                            "Customer Update - Attachments",
                            False,
                            f"Attachment update failed: {attachments}"
                        )
                else:
                    self.log_result(
                        "Customer Update - Attachments",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_result(
                    "Customer Update - Attachments",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_duplicate_customer_check(self):
        """Test 9: Duplicate Customer Check Endpoint"""
        print("=== Test 9: Duplicate Customer Check Endpoint ===")
        
        # First, get existing customers for testing
        existing_customers = []
        try:
            response = self.session.get(f"{BASE_URL}/customers")
            if response.status_code == 200:
                existing_customers = response.json()[:5]  # Use first 5 for testing
        except Exception as e:
            print(f"Warning: Could not get existing customers: {e}")
        
        # Create some test customers for duplicate testing
        test_customers = [
            {
                "name": "John Smith Duplicate Test",
                "email": "john.duplicate@example.com",
                "phone": "(555) 123-4567",
                "customer_type": "individual",
                "address": "123 Duplicate Test St, Test City, ST 12345"
            },
            {
                "name": "Jane Doe Duplicate Test",
                "email": "jane.duplicate@example.com", 
                "phone": "555-987-6543",
                "customer_type": "individual",
                "address": "456 Duplicate Test Ave, Test City, ST 67890"
            }
        ]
        
        created_test_customers = []
        for customer_data in test_customers:
            try:
                response = self.session.post(f"{BASE_URL}/customers", json=customer_data)
                if response.status_code in [200, 201]:
                    created_customer = response.json()
                    created_test_customers.append(created_customer)
                    self.created_customers.append(created_customer["id"])
            except Exception as e:
                print(f"Error creating test customer: {e}")
        
        # Test 9a: Exact Email Match
        if created_test_customers:
            test_email = created_test_customers[0].get('email', '')
            if test_email:
                test_data = {
                    "email": test_email,
                    "name": "Different Name",
                    "phone": "555-999-8888"
                }
                
                try:
                    response = self.session.post(f"{BASE_URL}/customers/check-duplicate", json=test_data)
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('count', 0) > 0:
                            email_match_found = any('email' in dup.get('match_reason', []) for dup in result.get('duplicates', []))
                            if email_match_found:
                                self.log_result(
                                    "Duplicate Check - Exact Email Match",
                                    True,
                                    f"Found {result['count']} duplicate(s) with email match"
                                )
                            else:
                                self.log_result(
                                    "Duplicate Check - Exact Email Match",
                                    False,
                                    "Duplicates found but no email match reason"
                                )
                        else:
                            self.log_result(
                                "Duplicate Check - Exact Email Match",
                                False,
                                "No duplicates found for existing email"
                            )
                    else:
                        self.log_result(
                            "Duplicate Check - Exact Email Match",
                            False,
                            f"HTTP {response.status_code}: {response.text}"
                        )
                except Exception as e:
                    self.log_result(
                        "Duplicate Check - Exact Email Match",
                        False,
                        f"Exception: {str(e)}"
                    )
        
        # Test 9b: Exact Phone Match
        if created_test_customers:
            test_phone = created_test_customers[0].get('phone', '')
            if test_phone:
                test_data = {
                    "email": "different@email.com",
                    "name": "Different Name",
                    "phone": test_phone
                }
                
                try:
                    response = self.session.post(f"{BASE_URL}/customers/check-duplicate", json=test_data)
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('count', 0) > 0:
                            phone_match_found = any('phone' in dup.get('match_reason', []) for dup in result.get('duplicates', []))
                            if phone_match_found:
                                self.log_result(
                                    "Duplicate Check - Exact Phone Match",
                                    True,
                                    f"Found {result['count']} duplicate(s) with phone match"
                                )
                            else:
                                self.log_result(
                                    "Duplicate Check - Exact Phone Match",
                                    False,
                                    "Duplicates found but no phone match reason"
                                )
                        else:
                            self.log_result(
                                "Duplicate Check - Exact Phone Match",
                                False,
                                "No duplicates found for existing phone"
                            )
                    else:
                        self.log_result(
                            "Duplicate Check - Exact Phone Match",
                            False,
                            f"HTTP {response.status_code}: {response.text}"
                        )
                except Exception as e:
                    self.log_result(
                        "Duplicate Check - Exact Phone Match",
                        False,
                        f"Exception: {str(e)}"
                    )
        
        # Test 9c: Name Similarity Match
        if created_test_customers:
            full_name = created_test_customers[0].get('name', '')
            if len(full_name) > 6:
                partial_name = full_name[:len(full_name)//2]
                test_data = {
                    "email": "different@email.com",
                    "name": partial_name,
                    "phone": "555-999-7777"
                }
                
                try:
                    response = self.session.post(f"{BASE_URL}/customers/check-duplicate", json=test_data)
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('count', 0) > 0:
                            name_match_found = any('name' in dup.get('match_reason', []) for dup in result.get('duplicates', []))
                            if name_match_found:
                                self.log_result(
                                    "Duplicate Check - Name Similarity Match",
                                    True,
                                    f"Found {result['count']} duplicate(s) with name match"
                                )
                            else:
                                self.log_result(
                                    "Duplicate Check - Name Similarity Match",
                                    False,
                                    "Duplicates found but no name match reason"
                                )
                        else:
                            self.log_result(
                                "Duplicate Check - Name Similarity Match",
                                False,
                                "No duplicates found for partial name"
                            )
                    else:
                        self.log_result(
                            "Duplicate Check - Name Similarity Match",
                            False,
                            f"HTTP {response.status_code}: {response.text}"
                        )
                except Exception as e:
                    self.log_result(
                        "Duplicate Check - Name Similarity Match",
                        False,
                        f"Exception: {str(e)}"
                    )
        
        # Test 9d: No Matches - Unique Customer
        test_data = {
            "email": "unique.customer.test@nonexistent.domain",
            "name": "Unique Test Customer Name 12345",
            "phone": "555-000-9999"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers/check-duplicate", json=test_data)
            if response.status_code == 200:
                result = response.json()
                if result.get('count', 0) == 0 and len(result.get('duplicates', [])) == 0:
                    self.log_result(
                        "Duplicate Check - No Matches (Unique Customer)",
                        True,
                        "No duplicates found for unique customer data"
                    )
                else:
                    self.log_result(
                        "Duplicate Check - No Matches (Unique Customer)",
                        False,
                        f"Unexpected duplicates found: {result['count']}"
                    )
            else:
                self.log_result(
                    "Duplicate Check - No Matches (Unique Customer)",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Duplicate Check - No Matches (Unique Customer)",
                False,
                f"Exception: {str(e)}"
            )
        
        # Test 9e: Empty/Missing Parameters
        try:
            response = self.session.post(f"{BASE_URL}/customers/check-duplicate", json={})
            if response.status_code == 200:
                result = response.json()
                if result.get('count', 0) == 0 and len(result.get('duplicates', [])) == 0:
                    self.log_result(
                        "Duplicate Check - Empty Parameters",
                        True,
                        "Empty request handled correctly"
                    )
                else:
                    self.log_result(
                        "Duplicate Check - Empty Parameters",
                        False,
                        "Empty request returned unexpected results"
                    )
            else:
                self.log_result(
                    "Duplicate Check - Empty Parameters",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Duplicate Check - Empty Parameters",
                False,
                f"Exception: {str(e)}"
            )
        
        # Test 9f: Response Format Validation
        test_data = {
            "email": "format.test@example.com",
            "name": "Format Test Customer",
            "phone": "555-123-4567"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers/check-duplicate", json=test_data)
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ['duplicates', 'count']
                missing_fields = [field for field in required_fields if field not in result]
                
                if not missing_fields:
                    # Check duplicates array structure
                    if isinstance(result.get('duplicates'), list):
                        if len(result['duplicates']) > 0:
                            duplicate = result['duplicates'][0]
                            expected_duplicate_fields = ['id', 'name', 'email', 'phone', 'customer_type', 'address', 'match_reason']
                            missing_duplicate_fields = [field for field in expected_duplicate_fields if field not in duplicate]
                            
                            if not missing_duplicate_fields and isinstance(duplicate.get('match_reason'), list):
                                if result.get('count') == len(result.get('duplicates', [])):
                                    self.log_result(
                                        "Duplicate Check - Response Format",
                                        True,
                                        "Response format is correct"
                                    )
                                else:
                                    self.log_result(
                                        "Duplicate Check - Response Format",
                                        False,
                                        f"Count mismatch: count={result.get('count')}, array length={len(result.get('duplicates', []))}"
                                    )
                            else:
                                self.log_result(
                                    "Duplicate Check - Response Format",
                                    False,
                                    f"Duplicate structure issues: missing fields={missing_duplicate_fields}, match_reason type={type(duplicate.get('match_reason'))}"
                                )
                        else:
                            # Empty duplicates array is valid
                            self.log_result(
                                "Duplicate Check - Response Format",
                                True,
                                "Response format is correct (empty duplicates)"
                            )
                    else:
                        self.log_result(
                            "Duplicate Check - Response Format",
                            False,
                            "duplicates should be an array"
                        )
                else:
                    self.log_result(
                        "Duplicate Check - Response Format",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
            else:
                self.log_result(
                    "Duplicate Check - Response Format",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Duplicate Check - Response Format",
                False,
                f"Exception: {str(e)}"
            )

    def test_error_handling(self):
        """Test error handling for missing required fields"""
        print("=== Test 10: Error Handling ===")
        
        # Test missing required fields
        invalid_customer_data = {
            "name": "Test Customer",
            # Missing email, phone, address
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=invalid_customer_data)
            if response.status_code in [400, 422]:  # Bad Request or Unprocessable Entity
                self.log_result(
                    "Error Handling - Missing Required Fields",
                    True,
                    f"Properly rejected invalid data with HTTP {response.status_code}"
                )
            else:
                self.log_result(
                    "Error Handling - Missing Required Fields",
                    False,
                    f"Expected 400/422 error, got HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Error Handling - Missing Required Fields",
                False,
                f"Exception: {str(e)}"
            )

        # Test invalid email format
        invalid_email_data = {
            "name": "Test Customer",
            "email": "invalid-email-format",
            "phone": "555-0000",
            "address": "Test Address"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/customers", json=invalid_email_data)
            if response.status_code in [400, 422]:
                self.log_result(
                    "Error Handling - Invalid Email Format",
                    True,
                    f"Properly rejected invalid email with HTTP {response.status_code}"
                )
            else:
                self.log_result(
                    "Error Handling - Invalid Email Format",
                    False,
                    f"Expected 400/422 error, got HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_result(
                "Error Handling - Invalid Email Format",
                False,
                f"Exception: {str(e)}"
            )

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("=== Cleanup Test Data ===")
        
        # Delete created customers
        for customer_id in self.created_customers:
            try:
                response = self.session.delete(f"{BASE_URL}/customers/{customer_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted customer {customer_id}")
                else:
                    print(f"❌ Failed to delete customer {customer_id}: {response.status_code}")
            except Exception as e:
                print(f"❌ Error deleting customer {customer_id}: {str(e)}")
        
        # Delete created sites
        for site_id in self.created_sites:
            try:
                response = self.session.delete(f"{BASE_URL}/sites/{site_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted site {site_id}")
                else:
                    print(f"❌ Failed to delete site {site_id}: {response.status_code}")
            except Exception as e:
                print(f"❌ Error deleting site {site_id}: {str(e)}")

    def run_all_tests(self):
        """Run all customer management tests"""
        print("🚀 Starting Comprehensive Customer Management Backend API Tests")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all tests
        self.test_customer_creation_contact_type()
        self.test_customer_creation_company_type()
        self.test_site_creation_integration()
        self.test_user_access_creation()
        self.test_link_to_company()
        self.test_file_upload()
        self.test_customer_retrieval()
        self.test_customer_update()
        self.test_duplicate_customer_check()
        self.test_error_handling()
        
        end_time = time.time()
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Execution Time: {end_time - start_time:.2f} seconds")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🧹 Cleaning up test data...")
        self.cleanup_test_data()
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "execution_time": end_time - start_time,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = CustomerManagementTests()
    results = tester.run_all_tests()