#!/usr/bin/env python3
"""
Communication Center Backend API Testing
Tests all Communication Center endpoints as requested in the review.
"""

import requests
import json
import os
import tempfile
from datetime import datetime
import uuid

# Backend URL from environment
BACKEND_URL = "https://snowconnect.preview.emergentagent.com/api"

class CommunicationCenterTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.test_customer_id = None
        self.test_user_id = None
        self.test_project_id = None
        self.test_communication_id = None
        self.test_template_id = None
        
    def log_result(self, test_name, success, details="", priority="medium"):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "priority": priority
        })
        print(f"{status} - {test_name}: {details}")
    
    def setup_test_data(self):
        """Create test customer and user for testing"""
        try:
            # Create test customer
            customer_data = {
                "name": "Communication Test Customer",
                "email": "test.customer@example.com",
                "phone": "+1234567890",
                "address": "123 Test Street, Test City, TC 12345"
            }
            
            response = self.session.post(f"{self.base_url}/customers", json=customer_data)
            if response.status_code == 200:
                self.test_customer_id = response.json()["id"]
                print(f"✅ Created test customer: {self.test_customer_id}")
            else:
                print(f"❌ Failed to create test customer: {response.status_code}")
                return False
            
            # Create test user
            user_data = {
                "name": "Test Communication User",
                "email": "test.user@example.com",
                "phone": "+1987654321",
                "role": "admin"
            }
            
            response = self.session.post(f"{self.base_url}/users", json=user_data)
            if response.status_code == 200:
                self.test_user_id = response.json()["id"]
                print(f"✅ Created test user: {self.test_user_id}")
            else:
                print(f"❌ Failed to create test user: {response.status_code}")
                return False
            
            # Create test project for crew communication
            project_data = {
                "name": "Test Communication Project",
                "customer_id": self.test_customer_id,
                "project_number": f"PROJ-{uuid.uuid4().hex[:8].upper()}",
                "status": "active"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            if response.status_code == 200:
                self.test_project_id = response.json()["id"]
                print(f"✅ Created test project: {self.test_project_id}")
            else:
                print(f"❌ Failed to create test project: {response.status_code}")
                # Continue without project for other tests
                
            return True
            
        except Exception as e:
            print(f"❌ Error setting up test data: {str(e)}")
            return False
    
    def test_get_communications(self):
        """Test GET /api/communications - Fetch messages with filters"""
        try:
            # Test basic fetch
            response = self.session.get(f"{self.base_url}/communications")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "GET /api/communications - Basic fetch",
                    True,
                    f"Retrieved {len(data)} communications",
                    "high"
                )
            else:
                self.log_result(
                    "GET /api/communications - Basic fetch",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "high"
                )
                return
            
            # Test with customer_id filter
            if self.test_customer_id:
                response = self.session.get(f"{self.base_url}/communications?customer_id={self.test_customer_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "GET /api/communications - Customer filter",
                        True,
                        f"Retrieved {len(data)} communications for customer",
                        "high"
                    )
                else:
                    self.log_result(
                        "GET /api/communications - Customer filter",
                        False,
                        f"Status: {response.status_code}",
                        "high"
                    )
            
            # Test with type filter
            response = self.session.get(f"{self.base_url}/communications?type=inapp")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "GET /api/communications - Type filter",
                    True,
                    f"Retrieved {len(data)} inapp communications",
                    "high"
                )
            else:
                self.log_result(
                    "GET /api/communications - Type filter",
                    False,
                    f"Status: {response.status_code}",
                    "high"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications",
                False,
                f"Exception: {str(e)}",
                "high"
            )
    
    def test_send_inapp_message(self):
        """Test POST /api/messages/send - Send InApp message"""
        try:
            if not self.test_customer_id:
                self.log_result(
                    "POST /api/messages/send",
                    False,
                    "No test customer available",
                    "high"
                )
                return
            
            message_data = {
                "customer_id": self.test_customer_id,
                "message": "This is a test in-app message from the Communication Center testing suite.",
                "type": "inapp",
                "attachments": []
            }
            
            response = self.session.post(f"{self.base_url}/messages/send", json=message_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.test_communication_id = data.get("communication_id")
                    self.log_result(
                        "POST /api/messages/send - InApp message",
                        True,
                        f"Message sent successfully, ID: {self.test_communication_id}",
                        "high"
                    )
                else:
                    self.log_result(
                        "POST /api/messages/send - InApp message",
                        False,
                        f"Success=False in response: {data}",
                        "high"
                    )
            elif response.status_code == 401:
                self.log_result(
                    "POST /api/messages/send - InApp message",
                    False,
                    "Authentication required - endpoint exists but needs auth",
                    "high"
                )
            else:
                self.log_result(
                    "POST /api/messages/send - InApp message",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "high"
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/messages/send",
                False,
                f"Exception: {str(e)}",
                "high"
            )
    
    def test_upload_file(self):
        """Test POST /api/communications/upload - Upload a test file"""
        try:
            # Create a temporary test file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
                temp_file.write("This is a test file for communication center upload testing.")
                temp_file_path = temp_file.name
            
            try:
                with open(temp_file_path, 'rb') as file:
                    files = {'file': ('test_communication.txt', file, 'text/plain')}
                    data = {'customer_id': self.test_customer_id} if self.test_customer_id else {}
                    
                    response = self.session.post(f"{self.base_url}/communications/upload", files=files, data=data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_result(
                            "POST /api/communications/upload - Single file",
                            True,
                            f"File uploaded successfully: {data.get('file', {}).get('filename')}",
                            "high"
                        )
                    else:
                        self.log_result(
                            "POST /api/communications/upload - Single file",
                            False,
                            f"Success=False in response: {data}",
                            "high"
                        )
                else:
                    self.log_result(
                        "POST /api/communications/upload - Single file",
                        False,
                        f"Status: {response.status_code}, Response: {response.text}",
                        "high"
                    )
            finally:
                # Clean up temp file
                os.unlink(temp_file_path)
                
        except Exception as e:
            self.log_result(
                "POST /api/communications/upload",
                False,
                f"Exception: {str(e)}",
                "high"
            )
    
    def test_upload_batch_files(self):
        """Test POST /api/communications/upload-batch - Batch upload multiple files"""
        try:
            # Create multiple temporary test files
            temp_files = []
            file_paths = []
            
            for i in range(3):
                temp_file = tempfile.NamedTemporaryFile(mode='w', suffix=f'_batch_{i}.txt', delete=False)
                temp_file.write(f"This is test file {i+1} for batch upload testing.")
                temp_file.close()
                temp_files.append(temp_file)
                file_paths.append(temp_file.name)
            
            try:
                files = []
                for i, file_path in enumerate(file_paths):
                    with open(file_path, 'rb') as file:
                        files.append(('files', (f'test_batch_{i+1}.txt', file.read(), 'text/plain')))
                
                data = {'customer_id': self.test_customer_id} if self.test_customer_id else {}
                
                response = self.session.post(f"{self.base_url}/communications/upload-batch", files=files, data=data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_result(
                            "POST /api/communications/upload-batch - Multiple files",
                            True,
                            f"Batch upload successful: {data.get('succeeded')}/{data.get('total')} files",
                            "high"
                        )
                    else:
                        self.log_result(
                            "POST /api/communications/upload-batch - Multiple files",
                            False,
                            f"Success=False: {data.get('failed_count')} failed uploads",
                            "high"
                        )
                else:
                    self.log_result(
                        "POST /api/communications/upload-batch - Multiple files",
                        False,
                        f"Status: {response.status_code}, Response: {response.text}",
                        "high"
                    )
            finally:
                # Clean up temp files
                for file_path in file_paths:
                    try:
                        os.unlink(file_path)
                    except:
                        pass
                        
        except Exception as e:
            self.log_result(
                "POST /api/communications/upload-batch",
                False,
                f"Exception: {str(e)}",
                "high"
            )
    
    def test_mark_read(self):
        """Test POST /api/communications/{id}/mark-read - Mark message as read"""
        try:
            # If we don't have a test communication ID, try to get an existing one
            if not self.test_communication_id:
                try:
                    response = self.session.get(f"{self.base_url}/communications?limit=1")
                    if response.status_code == 200:
                        communications = response.json()
                        if communications and len(communications) > 0:
                            self.test_communication_id = communications[0]["_id"]
                        else:
                            self.log_result(
                                "POST /api/communications/{id}/mark-read",
                                False,
                                "No communications available for testing",
                                "medium"
                            )
                            return
                    else:
                        self.log_result(
                            "POST /api/communications/{id}/mark-read",
                            False,
                            "Could not fetch existing communications",
                            "medium"
                        )
                        return
                except:
                    self.log_result(
                        "POST /api/communications/{id}/mark-read",
                        False,
                        "Error fetching existing communications",
                        "medium"
                    )
                    return
            
            response = self.session.post(f"{self.base_url}/communications/{self.test_communication_id}/mark-read")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result(
                        "POST /api/communications/{id}/mark-read",
                        True,
                        "Communication marked as read successfully",
                        "medium"
                    )
                else:
                    self.log_result(
                        "POST /api/communications/{id}/mark-read",
                        False,
                        f"Success=False in response: {data}",
                        "medium"
                    )
            else:
                self.log_result(
                    "POST /api/communications/{id}/mark-read",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "medium"
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/communications/{id}/mark-read",
                False,
                f"Exception: {str(e)}",
                "medium"
            )
    
    def test_mark_delivered(self):
        """Test POST /api/communications/{id}/mark-delivered - Mark as delivered"""
        try:
            # If we don't have a test communication ID, try to get an existing one
            if not self.test_communication_id:
                try:
                    response = self.session.get(f"{self.base_url}/communications?limit=1")
                    if response.status_code == 200:
                        communications = response.json()
                        if communications and len(communications) > 0:
                            self.test_communication_id = communications[0]["_id"]
                        else:
                            self.log_result(
                                "POST /api/communications/{id}/mark-delivered",
                                False,
                                "No communications available for testing",
                                "medium"
                            )
                            return
                    else:
                        self.log_result(
                            "POST /api/communications/{id}/mark-delivered",
                            False,
                            "Could not fetch existing communications",
                            "medium"
                        )
                        return
                except:
                    self.log_result(
                        "POST /api/communications/{id}/mark-delivered",
                        False,
                        "Error fetching existing communications",
                        "medium"
                    )
                    return
            
            response = self.session.post(f"{self.base_url}/communications/{self.test_communication_id}/mark-delivered")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result(
                        "POST /api/communications/{id}/mark-delivered",
                        True,
                        "Communication marked as delivered successfully",
                        "medium"
                    )
                else:
                    self.log_result(
                        "POST /api/communications/{id}/mark-delivered",
                        False,
                        f"Success=False in response: {data}",
                        "medium"
                    )
            else:
                self.log_result(
                    "POST /api/communications/{id}/mark-delivered",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "medium"
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/communications/{id}/mark-delivered",
                False,
                f"Exception: {str(e)}",
                "medium"
            )
    
    def test_get_status(self):
        """Test GET /api/communications/{id}/status - Get message status"""
        try:
            # If we don't have a test communication ID, try to get an existing one
            if not self.test_communication_id:
                try:
                    response = self.session.get(f"{self.base_url}/communications?limit=1")
                    if response.status_code == 200:
                        communications = response.json()
                        if communications and len(communications) > 0:
                            self.test_communication_id = communications[0]["_id"]
                        else:
                            self.log_result(
                                "GET /api/communications/{id}/status",
                                False,
                                "No communications available for testing",
                                "medium"
                            )
                            return
                    else:
                        self.log_result(
                            "GET /api/communications/{id}/status",
                            False,
                            "Could not fetch existing communications",
                            "medium"
                        )
                        return
                except:
                    self.log_result(
                        "GET /api/communications/{id}/status",
                        False,
                        "Error fetching existing communications",
                        "medium"
                    )
                    return
            
            response = self.session.get(f"{self.base_url}/communications/{self.test_communication_id}/status")
            
            if response.status_code == 200:
                data = response.json()
                if "communication_id" in data and "status" in data:
                    self.log_result(
                        "GET /api/communications/{id}/status",
                        True,
                        f"Status retrieved: {data.get('status')}, Read: {data.get('read')}",
                        "medium"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/{id}/status",
                        False,
                        f"Missing expected fields in response: {data}",
                        "medium"
                    )
            else:
                self.log_result(
                    "GET /api/communications/{id}/status",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "medium"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/{id}/status",
                False,
                f"Exception: {str(e)}",
                "medium"
            )
    
    def test_search_messages(self):
        """Test POST /api/communications/search - Search messages with query"""
        try:
            search_data = {
                "query": "test",
                "customer_id": self.test_customer_id,
                "type": "inapp"
            }
            
            response = self.session.post(f"{self.base_url}/communications/search", json=search_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result(
                        "POST /api/communications/search",
                        True,
                        f"Search completed: {data.get('count')} results found",
                        "medium"
                    )
                else:
                    self.log_result(
                        "POST /api/communications/search",
                        False,
                        f"Success=False in response: {data}",
                        "medium"
                    )
            else:
                self.log_result(
                    "POST /api/communications/search",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "medium"
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/communications/search",
                False,
                f"Exception: {str(e)}",
                "medium"
            )
    
    def test_create_template(self):
        """Test POST /api/communications/templates - Create message template"""
        try:
            template_data = {
                "name": "Test Communication Template",
                "content": "Hello {customer_name}, this is a test template message.",
                "type": "inapp",
                "category": "general"
            }
            
            response = self.session.post(f"{self.base_url}/communications/templates", json=template_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.test_template_id = data.get("template", {}).get("_id")
                    self.log_result(
                        "POST /api/communications/templates",
                        True,
                        f"Template created successfully: {template_data['name']}",
                        "medium"
                    )
                else:
                    self.log_result(
                        "POST /api/communications/templates",
                        False,
                        f"Success=False in response: {data}",
                        "medium"
                    )
            else:
                self.log_result(
                    "POST /api/communications/templates",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "medium"
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/communications/templates",
                False,
                f"Exception: {str(e)}",
                "medium"
            )
    
    def test_get_templates(self):
        """Test GET /api/communications/templates - Get templates"""
        try:
            response = self.session.get(f"{self.base_url}/communications/templates")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/communications/templates",
                        True,
                        f"Retrieved {len(data)} templates",
                        "medium"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/templates",
                        False,
                        f"Expected list, got: {type(data)}",
                        "medium"
                    )
            else:
                self.log_result(
                    "GET /api/communications/templates",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "medium"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/templates",
                False,
                f"Exception: {str(e)}",
                "medium"
            )
    
    def test_analytics_overview(self):
        """Test GET /api/communications/analytics/overview - Get analytics overview"""
        try:
            response = self.session.get(f"{self.base_url}/communications/analytics/overview")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "total_messages" in data:
                    self.log_result(
                        "GET /api/communications/analytics/overview",
                        True,
                        f"Analytics retrieved: {data.get('total_messages')} total messages",
                        "low"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/analytics/overview",
                        False,
                        f"Missing expected fields in response: {data}",
                        "low"
                    )
            else:
                self.log_result(
                    "GET /api/communications/analytics/overview",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "low"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/analytics/overview",
                False,
                f"Exception: {str(e)}",
                "low"
            )
    
    def test_customer_analytics(self):
        """Test GET /api/communications/analytics/customer/{customer_id} - Get customer stats"""
        try:
            if not self.test_customer_id:
                self.log_result(
                    "GET /api/communications/analytics/customer/{customer_id}",
                    False,
                    "No test customer ID available",
                    "low"
                )
                return
            
            response = self.session.get(f"{self.base_url}/communications/analytics/customer/{self.test_customer_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "customer_id" in data:
                    self.log_result(
                        "GET /api/communications/analytics/customer/{customer_id}",
                        True,
                        f"Customer analytics retrieved: {data.get('total_messages')} messages",
                        "low"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/analytics/customer/{customer_id}",
                        False,
                        f"Missing expected fields in response: {data}",
                        "low"
                    )
            else:
                self.log_result(
                    "GET /api/communications/analytics/customer/{customer_id}",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "low"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/analytics/customer/{customer_id}",
                False,
                f"Exception: {str(e)}",
                "low"
            )
    
    def test_crew_send_message(self):
        """Test POST /api/communications/crew/send - Send crew message with project_id"""
        try:
            if not self.test_project_id:
                self.log_result(
                    "POST /api/communications/crew/send",
                    False,
                    "No test project ID available",
                    "low"
                )
                return
            
            crew_message_data = {
                "project_id": self.test_project_id,
                "message": "This is a test crew message from the field.",
                "crew_id": self.test_user_id or "test_crew_001",
                "location": {"lat": 43.6532, "lng": -79.3832}
            }
            
            response = self.session.post(f"{self.base_url}/communications/crew/send", json=crew_message_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result(
                        "POST /api/communications/crew/send",
                        True,
                        f"Crew message sent successfully for project {self.test_project_id}",
                        "low"
                    )
                else:
                    self.log_result(
                        "POST /api/communications/crew/send",
                        False,
                        f"Success=False in response: {data}",
                        "low"
                    )
            else:
                self.log_result(
                    "POST /api/communications/crew/send",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "low"
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/communications/crew/send",
                False,
                f"Exception: {str(e)}",
                "low"
            )
    
    def test_get_project_messages(self):
        """Test GET /api/communications/crew/project/{project_id} - Get project messages"""
        try:
            if not self.test_project_id:
                self.log_result(
                    "GET /api/communications/crew/project/{project_id}",
                    False,
                    "No test project ID available",
                    "low"
                )
                return
            
            response = self.session.get(f"{self.base_url}/communications/crew/project/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/communications/crew/project/{project_id}",
                        True,
                        f"Retrieved {len(data)} project messages",
                        "low"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/crew/project/{project_id}",
                        False,
                        f"Expected list, got: {type(data)}",
                        "low"
                    )
            else:
                self.log_result(
                    "GET /api/communications/crew/project/{project_id}",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "low"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/crew/project/{project_id}",
                False,
                f"Exception: {str(e)}",
                "low"
            )
    
    def test_get_online_users(self):
        """Test GET /api/communications/online-users - Get online users list"""
        try:
            response = self.session.get(f"{self.base_url}/communications/online-users")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "count" in data and "users" in data:
                    self.log_result(
                        "GET /api/communications/online-users",
                        True,
                        f"Online users retrieved: {data.get('count')} users online",
                        "low"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/online-users",
                        False,
                        f"Missing expected fields in response: {data}",
                        "low"
                    )
            else:
                self.log_result(
                    "GET /api/communications/online-users",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "low"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/online-users",
                False,
                f"Exception: {str(e)}",
                "low"
            )
    
    def test_check_user_status(self):
        """Test GET /api/communications/user/{user_id}/status - Check user online status"""
        try:
            test_user_id = self.test_user_id or "test_user_001"
            
            response = self.session.get(f"{self.base_url}/communications/user/{test_user_id}/status")
            
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data and "online" in data and "status" in data:
                    self.log_result(
                        "GET /api/communications/user/{user_id}/status",
                        True,
                        f"User status retrieved: {data.get('status')} for user {test_user_id}",
                        "low"
                    )
                else:
                    self.log_result(
                        "GET /api/communications/user/{user_id}/status",
                        False,
                        f"Missing expected fields in response: {data}",
                        "low"
                    )
            else:
                self.log_result(
                    "GET /api/communications/user/{user_id}/status",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                    "low"
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/communications/user/{user_id}/status",
                False,
                f"Exception: {str(e)}",
                "low"
            )
    
    def run_all_tests(self):
        """Run all Communication Center tests in priority order"""
        print("=" * 80)
        print("COMMUNICATION CENTER BACKEND API TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Setup test data
        print("Setting up test data...")
        if not self.setup_test_data():
            print("❌ Failed to setup test data. Some tests may fail.")
        print()
        
        # Priority 1 - Core Messaging
        print("🔥 PRIORITY 1 - CORE MESSAGING")
        print("-" * 40)
        self.test_get_communications()
        self.test_send_inapp_message()
        self.test_upload_file()
        self.test_upload_batch_files()
        print()
        
        # Priority 2 - Read Receipts & Status
        print("📋 PRIORITY 2 - READ RECEIPTS & STATUS")
        print("-" * 40)
        self.test_mark_read()
        self.test_mark_delivered()
        self.test_get_status()
        print()
        
        # Priority 3 - Search & Templates
        print("🔍 PRIORITY 3 - SEARCH & TEMPLATES")
        print("-" * 40)
        self.test_search_messages()
        self.test_create_template()
        self.test_get_templates()
        print()
        
        # Priority 4 - Analytics
        print("📊 PRIORITY 4 - ANALYTICS")
        print("-" * 40)
        self.test_analytics_overview()
        self.test_customer_analytics()
        print()
        
        # Priority 5 - Crew Communication
        print("👷 PRIORITY 5 - CREW COMMUNICATION")
        print("-" * 40)
        self.test_crew_send_message()
        self.test_get_project_messages()
        print()
        
        # Priority 6 - WebSocket & Online Status
        print("🌐 PRIORITY 6 - WEBSOCKET & ONLINE STATUS")
        print("-" * 40)
        self.test_get_online_users()
        self.test_check_user_status()
        print()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Group by priority
        high_priority = [r for r in self.test_results if r["priority"] == "high"]
        medium_priority = [r for r in self.test_results if r["priority"] == "medium"]
        low_priority = [r for r in self.test_results if r["priority"] == "low"]
        
        print("HIGH PRIORITY TESTS:")
        for result in high_priority:
            print(f"  {result['status']} {result['test']}")
        print()
        
        print("MEDIUM PRIORITY TESTS:")
        for result in medium_priority:
            print(f"  {result['status']} {result['test']}")
        print()
        
        print("LOW PRIORITY TESTS:")
        for result in low_priority:
            print(f"  {result['status']} {result['test']}")
        print()
        
        # Failed tests details
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print("FAILED TESTS DETAILS:")
            for result in failed_results:
                print(f"❌ {result['test']}")
                print(f"   Details: {result['details']}")
                print()
        
        print(f"Test completed at: {datetime.now().isoformat()}")
        print("=" * 80)


if __name__ == "__main__":
    tester = CommunicationCenterTester()
    tester.run_all_tests()