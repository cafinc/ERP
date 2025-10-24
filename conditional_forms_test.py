#!/usr/bin/env python3
"""
Focused Conditional Forms Backend Testing
Tests only the conditional forms system with sections, Yes/No fields, and conditional logic.
"""

import requests
import json
import os
import uuid
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://snowops-admin.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class ConditionalFormsTest:
    def __init__(self):
        self.test_results = []
        self.created_template_id = None
        self.created_response_id = None
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "status": status
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_create_conditional_form_template(self):
        """Test creating form template with new conditional field structures"""
        print("\n=== Testing Conditional Form Template Creation ===")
        
        # Create the test form template as specified in the review request
        template_data = {
            "name": "Equipment Inspection (Conditional Test)",
            "form_type": "safety_check",
            "description": "Test form with sections and conditional logic",
            "fields": [
                {
                    "field_id": "section_1",
                    "field_type": "section", 
                    "label": "Basic Information",
                    "required": False
                },
                {
                    "field_id": "equipment_name",
                    "field_type": "text",
                    "label": "Equipment Name",
                    "required": True,
                    "section": "Basic Information"
                },
                {
                    "field_id": "damage_found",
                    "field_type": "yes_no",
                    "label": "Any damage found?",
                    "required": True,
                    "options": ["Yes", "No"],
                    "section": "Basic Information"
                },
                {
                    "field_id": "damage_description",
                    "field_type": "text",
                    "label": "Describe the damage",
                    "required": True,
                    "conditional_logic": {
                        "depends_on_field": "damage_found",
                        "depends_on_value": "Yes"
                    }
                },
                {
                    "field_id": "repair_needed",
                    "field_type": "yes_no",
                    "label": "Does it need immediate repair?",
                    "required": False,
                    "options": ["Yes", "No"],
                    "conditional_logic": {
                        "depends_on_field": "damage_found",
                        "depends_on_value": "Yes"
                    }
                }
            ]
        }
        
        try:
            response = requests.post(f"{API_BASE}/form-templates", json=template_data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                self.created_template_id = result.get('id')
                
                # Verify all new field properties are preserved
                fields = result.get('fields', [])
                
                print(f"\nCreated template with {len(fields)} fields:")
                for field in fields:
                    print(f"  - {field.get('field_id')}: {field.get('field_type')}")
                    if field.get('section'):
                        print(f"    Section: {field.get('section')}")
                    if field.get('conditional_logic'):
                        print(f"    Conditional: {field.get('conditional_logic')}")
                
                # Check section field
                section_field = next((f for f in fields if f['field_id'] == 'section_1'), None)
                if section_field and section_field.get('field_type') == 'section':
                    self.log_result("Section field type stored correctly", True)
                else:
                    self.log_result("Section field type storage", False, "Section field_type not preserved")
                
                # Check yes_no field
                yes_no_field = next((f for f in fields if f['field_id'] == 'damage_found'), None)
                if yes_no_field and yes_no_field.get('field_type') == 'yes_no' and yes_no_field.get('options') == ["Yes", "No"]:
                    self.log_result("Yes/No field with options stored correctly", True)
                else:
                    self.log_result("Yes/No field storage", False, "Yes/No field_type or options not preserved")
                
                # Check section property
                equipment_field = next((f for f in fields if f['field_id'] == 'equipment_name'), None)
                if equipment_field and equipment_field.get('section') == 'Basic Information':
                    self.log_result("Section property stored correctly", True)
                else:
                    self.log_result("Section property storage", False, "Section property not preserved")
                
                # Check conditional_logic
                damage_desc_field = next((f for f in fields if f['field_id'] == 'damage_description'), None)
                if damage_desc_field and damage_desc_field.get('conditional_logic'):
                    logic = damage_desc_field['conditional_logic']
                    if logic.get('depends_on_field') == 'damage_found' and logic.get('depends_on_value') == 'Yes':
                        self.log_result("Conditional logic stored correctly", True)
                    else:
                        self.log_result("Conditional logic storage", False, "Conditional logic properties incorrect")
                else:
                    self.log_result("Conditional logic storage", False, "Conditional logic not preserved")
                
                self.log_result("Form template creation", True, f"Template ID: {self.created_template_id}")
                
            else:
                self.log_result("Form template creation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Form template creation", False, f"Exception: {str(e)}")
    
    def test_retrieve_conditional_form_template(self):
        """Test retrieving the created template and verify field structures"""
        print("\n=== Testing Conditional Form Template Retrieval ===")
        
        if not self.created_template_id:
            self.log_result("Template retrieval", False, "No template ID available")
            return
        
        try:
            response = requests.get(f"{API_BASE}/form-templates/{self.created_template_id}", timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                fields = result.get('fields', [])
                
                print(f"\nRetrieved template with {len(fields)} fields:")
                for field in fields:
                    print(f"  - {field.get('field_id')}: {field.get('field_type')}")
                    if field.get('section'):
                        print(f"    Section: {field.get('section')}")
                    if field.get('conditional_logic'):
                        print(f"    Conditional: {field.get('conditional_logic')}")
                
                # Verify all field structures are intact
                expected_fields = {
                    'section_1': {'field_type': 'section', 'section': None},
                    'equipment_name': {'field_type': 'text', 'section': 'Basic Information'},
                    'damage_found': {'field_type': 'yes_no', 'section': 'Basic Information', 'options': ['Yes', 'No']},
                    'damage_description': {'field_type': 'text', 'conditional_logic': True},
                    'repair_needed': {'field_type': 'yes_no', 'conditional_logic': True, 'options': ['Yes', 'No']}
                }
                
                all_correct = True
                for field in fields:
                    field_id = field.get('field_id')
                    if field_id in expected_fields:
                        expected = expected_fields[field_id]
                        
                        # Check field_type
                        if field.get('field_type') != expected['field_type']:
                            all_correct = False
                            self.log_result(f"Field {field_id} type verification", False, 
                                          f"Expected {expected['field_type']}, got {field.get('field_type')}")
                        
                        # Check section if expected
                        if 'section' in expected and expected['section']:
                            if field.get('section') != expected['section']:
                                all_correct = False
                                self.log_result(f"Field {field_id} section verification", False,
                                              f"Expected {expected['section']}, got {field.get('section')}")
                        
                        # Check options if expected
                        if 'options' in expected:
                            if field.get('options') != expected['options']:
                                all_correct = False
                                self.log_result(f"Field {field_id} options verification", False,
                                              f"Expected {expected['options']}, got {field.get('options')}")
                        
                        # Check conditional_logic if expected
                        if expected.get('conditional_logic'):
                            if not field.get('conditional_logic'):
                                all_correct = False
                                self.log_result(f"Field {field_id} conditional logic verification", False,
                                              "Expected conditional_logic, but not found")
                
                if all_correct:
                    self.log_result("Template field structures verification", True, "All field properties preserved correctly")
                else:
                    self.log_result("Template field structures verification", False, "Some field properties not preserved")
                
            else:
                self.log_result("Template retrieval", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Template retrieval", False, f"Exception: {str(e)}")
    
    def test_form_response_submission(self):
        """Test submitting form response with conditional field data"""
        print("\n=== Testing Form Response Submission ===")
        
        if not self.created_template_id:
            self.log_result("Form response submission", False, "No template ID available")
            return
        
        # Create test response data
        response_data = {
            "template_id": self.created_template_id,
            "template_name": "Equipment Inspection (Conditional Test)",
            "crew_id": str(uuid.uuid4()),
            "crew_name": "Test Inspector",
            "dispatch_id": str(uuid.uuid4()),
            "site_id": str(uuid.uuid4()),
            "responses": {
                "equipment_name": "Snow Plow #1",
                "damage_found": "Yes",
                "damage_description": "Scratched paint on left side panel",
                "repair_needed": "No"
            }
        }
        
        try:
            response = requests.post(f"{API_BASE}/form-responses", json=response_data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                self.created_response_id = result.get('id')
                
                # Verify response data is stored correctly
                stored_responses = result.get('responses', {})
                expected_responses = response_data['responses']
                
                if stored_responses == expected_responses:
                    self.log_result("Form response submission", True, f"Response ID: {self.created_response_id}")
                else:
                    self.log_result("Form response submission", False, "Response data not stored correctly")
                
            else:
                self.log_result("Form response submission", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Form response submission", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all conditional forms tests"""
        print("🧪 CONDITIONAL FORMS BACKEND TESTING")
        print("=" * 50)
        
        # Core functionality tests
        self.test_create_conditional_form_template()
        self.test_retrieve_conditional_form_template()
        self.test_form_response_submission()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   └─ {result['details']}")
        
        return success_rate >= 80  # Consider 80%+ as overall success

if __name__ == "__main__":
    tester = ConditionalFormsTest()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 CONDITIONAL FORMS BACKEND TESTING COMPLETED SUCCESSFULLY!")
    else:
        print("\n⚠️  CONDITIONAL FORMS BACKEND TESTING COMPLETED WITH ISSUES!")