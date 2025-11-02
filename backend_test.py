#!/usr/bin/env python3
"""
Backend API Testing Script for Calendar Event CRUD Operations
Tests all calendar endpoints comprehensively as requested in the review.
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://fieldservice-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class CalendarEventTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.created_event_ids = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()

    def test_get_all_events(self):
        """Test GET /api/calendar/events - Retrieve all calendar events"""
        try:
            response = self.session.get(f"{API_BASE}/calendar/events")
            
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list):
                    self.log_test(
                        "GET /api/calendar/events - Basic retrieval",
                        True,
                        f"Successfully retrieved {len(events)} events. Response structure is valid list.",
                        {"event_count": len(events), "sample_event": events[0] if events else None}
                    )
                    
                    # Verify event structure
                    if events:
                        event = events[0]
                        required_fields = ['id', 'title', 'start', 'end']
                        missing_fields = [field for field in required_fields if field not in event]
                        
                        if not missing_fields:
                            self.log_test(
                                "GET /api/calendar/events - Event structure validation",
                                True,
                                f"Event structure contains all required fields: {required_fields}",
                                {"event_structure": list(event.keys())}
                            )
                        else:
                            self.log_test(
                                "GET /api/calendar/events - Event structure validation",
                                False,
                                f"Missing required fields: {missing_fields}",
                                {"event_structure": list(event.keys())}
                            )
                else:
                    self.log_test(
                        "GET /api/calendar/events - Basic retrieval",
                        False,
                        f"Expected list response, got {type(events)}",
                        events
                    )
            else:
                self.log_test(
                    "GET /api/calendar/events - Basic retrieval",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/calendar/events - Basic retrieval",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_get_events_with_date_filters(self):
        """Test GET /api/calendar/events with date range filters"""
        try:
            # Test with start date filter
            start_date = datetime.now().isoformat()
            response = self.session.get(f"{API_BASE}/calendar/events?start={start_date}")
            
            if response.status_code == 200:
                events = response.json()
                self.log_test(
                    "GET /api/calendar/events - With start date filter",
                    True,
                    f"Successfully retrieved events with start date filter. Found {len(events)} events.",
                    {"filter_applied": f"start={start_date}", "event_count": len(events)}
                )
            else:
                self.log_test(
                    "GET /api/calendar/events - With start date filter",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
            
            # Test with both start and end date filters
            end_date = (datetime.now() + timedelta(days=7)).isoformat()
            response = self.session.get(f"{API_BASE}/calendar/events?start={start_date}&end={end_date}")
            
            if response.status_code == 200:
                events = response.json()
                self.log_test(
                    "GET /api/calendar/events - With date range filter",
                    True,
                    f"Successfully retrieved events with date range filter. Found {len(events)} events.",
                    {"filter_applied": f"start={start_date}&end={end_date}", "event_count": len(events)}
                )
            else:
                self.log_test(
                    "GET /api/calendar/events - With date range filter",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/calendar/events - Date filters",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_create_event_required_fields(self):
        """Test POST /api/calendar/events - Create event with required fields only"""
        try:
            event_data = {
                "title": "Test Event - Required Fields Only",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            response = self.session.post(f"{API_BASE}/calendar/events", json=event_data)
            
            if response.status_code in [200, 201]:
                created_event = response.json()
                if 'id' in created_event:
                    self.created_event_ids.append(created_event['id'])
                    self.log_test(
                        "POST /api/calendar/events - Required fields only",
                        True,
                        f"Successfully created event with ID: {created_event['id']}",
                        {"created_event": created_event}
                    )
                else:
                    self.log_test(
                        "POST /api/calendar/events - Required fields only",
                        False,
                        "Event created but no ID returned",
                        created_event
                    )
            else:
                self.log_test(
                    "POST /api/calendar/events - Required fields only",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/calendar/events - Required fields only",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_create_event_all_fields(self):
        """Test POST /api/calendar/events - Create event with all optional fields"""
        try:
            event_data = {
                "title": "Comprehensive Test Event",
                "description": "This is a test event with all possible fields populated",
                "start": (datetime.now() + timedelta(hours=2)).isoformat(),
                "end": (datetime.now() + timedelta(hours=3)).isoformat(),
                "location": "123 Test Street, Test City",
                "attendees": ["john@example.com", "jane@example.com"],
                "type": "meeting",
                "status": "confirmed",
                "color": "green"
            }
            
            response = self.session.post(f"{API_BASE}/calendar/events", json=event_data)
            
            if response.status_code in [200, 201]:
                created_event = response.json()
                if 'id' in created_event:
                    self.created_event_ids.append(created_event['id'])
                    
                    # Verify all fields were preserved
                    fields_preserved = all(
                        created_event.get(key) == value 
                        for key, value in event_data.items()
                    )
                    
                    self.log_test(
                        "POST /api/calendar/events - All optional fields",
                        True,
                        f"Successfully created comprehensive event with ID: {created_event['id']}. All fields preserved: {fields_preserved}",
                        {"created_event": created_event, "fields_preserved": fields_preserved}
                    )
                else:
                    self.log_test(
                        "POST /api/calendar/events - All optional fields",
                        False,
                        "Event created but no ID returned",
                        created_event
                    )
            else:
                self.log_test(
                    "POST /api/calendar/events - All optional fields",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/calendar/events - All optional fields",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_create_event_validation(self):
        """Test POST /api/calendar/events - Validation for missing required fields"""
        try:
            # Test missing title
            invalid_event = {
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            response = self.session.post(f"{API_BASE}/calendar/events", json=invalid_event)
            
            if response.status_code == 422:
                self.log_test(
                    "POST /api/calendar/events - Missing title validation",
                    True,
                    "Correctly returned 422 for missing title field",
                    {"status_code": response.status_code, "response": response.text}
                )
            else:
                self.log_test(
                    "POST /api/calendar/events - Missing title validation",
                    False,
                    f"Expected 422, got {response.status_code}",
                    response.text
                )
            
            # Test missing start time
            invalid_event = {
                "title": "Test Event",
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            response = self.session.post(f"{API_BASE}/calendar/events", json=invalid_event)
            
            if response.status_code == 422:
                self.log_test(
                    "POST /api/calendar/events - Missing start time validation",
                    True,
                    "Correctly returned 422 for missing start time",
                    {"status_code": response.status_code, "response": response.text}
                )
            else:
                self.log_test(
                    "POST /api/calendar/events - Missing start time validation",
                    False,
                    f"Expected 422, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/calendar/events - Validation tests",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_update_event(self):
        """Test PUT /api/calendar/events/{event_id} - Update existing event"""
        if not self.created_event_ids:
            self.log_test(
                "PUT /api/calendar/events/{event_id} - Update event",
                False,
                "No events available to update. Create events first.",
                None
            )
            return
        
        try:
            event_id = self.created_event_ids[0]
            
            # Update event data
            updated_data = {
                "title": "Updated Test Event Title",
                "description": "This event has been updated via PUT request",
                "start": (datetime.now() + timedelta(hours=4)).isoformat(),
                "end": (datetime.now() + timedelta(hours=5)).isoformat(),
                "location": "Updated Location - 456 New Street",
                "type": "appointment",
                "status": "tentative",
                "color": "red"
            }
            
            response = self.session.put(f"{API_BASE}/calendar/events/{event_id}", json=updated_data)
            
            if response.status_code == 200:
                updated_event = response.json()
                
                # Verify the event was updated
                if updated_event.get('id') == event_id and updated_event.get('title') == updated_data['title']:
                    self.log_test(
                        "PUT /api/calendar/events/{event_id} - Update event",
                        True,
                        f"Successfully updated event {event_id}. Title changed to: {updated_event.get('title')}",
                        {"updated_event": updated_event}
                    )
                else:
                    self.log_test(
                        "PUT /api/calendar/events/{event_id} - Update event",
                        False,
                        "Event update response doesn't match expected values",
                        updated_event
                    )
            else:
                self.log_test(
                    "PUT /api/calendar/events/{event_id} - Update event",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "PUT /api/calendar/events/{event_id} - Update event",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_update_nonexistent_event(self):
        """Test PUT /api/calendar/events/{event_id} - Update non-existent event"""
        try:
            fake_event_id = "nonexistent_event_123"
            
            updated_data = {
                "title": "This Should Fail",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            response = self.session.put(f"{API_BASE}/calendar/events/{fake_event_id}", json=updated_data)
            
            if response.status_code == 404:
                self.log_test(
                    "PUT /api/calendar/events/{event_id} - Non-existent event",
                    True,
                    "Correctly returned 404 for non-existent event",
                    {"status_code": response.status_code, "response": response.text}
                )
            else:
                self.log_test(
                    "PUT /api/calendar/events/{event_id} - Non-existent event",
                    False,
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "PUT /api/calendar/events/{event_id} - Non-existent event",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_delete_event(self):
        """Test DELETE /api/calendar/events/{event_id} - Delete event"""
        if not self.created_event_ids:
            self.log_test(
                "DELETE /api/calendar/events/{event_id} - Delete event",
                False,
                "No events available to delete. Create events first.",
                None
            )
            return
        
        try:
            event_id = self.created_event_ids[-1]  # Use the last created event
            
            response = self.session.delete(f"{API_BASE}/calendar/events/{event_id}")
            
            if response.status_code == 200:
                delete_response = response.json()
                
                if delete_response.get('success') == True:
                    self.log_test(
                        "DELETE /api/calendar/events/{event_id} - Delete event",
                        True,
                        f"Successfully deleted event {event_id}",
                        delete_response
                    )
                    
                    # Remove from our tracking list
                    self.created_event_ids.remove(event_id)
                    
                    # Verify deletion by trying to update the deleted event
                    verify_response = self.session.put(f"{API_BASE}/calendar/events/{event_id}", json={
                        "title": "This should fail",
                        "start": datetime.now().isoformat(),
                        "end": (datetime.now() + timedelta(hours=1)).isoformat()
                    })
                    
                    if verify_response.status_code == 404:
                        self.log_test(
                            "DELETE /api/calendar/events/{event_id} - Deletion verification",
                            True,
                            f"Verified deletion: Event {event_id} no longer exists (404 on update attempt)",
                            {"verification_status": verify_response.status_code}
                        )
                    else:
                        self.log_test(
                            "DELETE /api/calendar/events/{event_id} - Deletion verification",
                            False,
                            f"Event may not be properly deleted. Update attempt returned {verify_response.status_code}",
                            verify_response.text
                        )
                else:
                    self.log_test(
                        "DELETE /api/calendar/events/{event_id} - Delete event",
                        False,
                        "Delete response doesn't indicate success",
                        delete_response
                    )
            else:
                self.log_test(
                    "DELETE /api/calendar/events/{event_id} - Delete event",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "DELETE /api/calendar/events/{event_id} - Delete event",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_delete_nonexistent_event(self):
        """Test DELETE /api/calendar/events/{event_id} - Delete non-existent event"""
        try:
            fake_event_id = "nonexistent_event_456"
            
            response = self.session.delete(f"{API_BASE}/calendar/events/{fake_event_id}")
            
            if response.status_code == 404:
                self.log_test(
                    "DELETE /api/calendar/events/{event_id} - Non-existent event",
                    True,
                    "Correctly returned 404 for non-existent event",
                    {"status_code": response.status_code, "response": response.text}
                )
            else:
                self.log_test(
                    "DELETE /api/calendar/events/{event_id} - Non-existent event",
                    False,
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "DELETE /api/calendar/events/{event_id} - Non-existent event",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_google_calendar_status(self):
        """Test GET /api/calendar/google/status - Google Calendar integration status"""
        try:
            response = self.session.get(f"{API_BASE}/calendar/google/status")
            
            if response.status_code == 200:
                status_data = response.json()
                
                # Verify response structure
                required_fields = ['connected']
                has_required_fields = all(field in status_data for field in required_fields)
                
                if has_required_fields:
                    connection_status = "connected" if status_data.get('connected') else "not connected"
                    self.log_test(
                        "GET /api/calendar/google/status - Integration status",
                        True,
                        f"Successfully retrieved Google Calendar status: {connection_status}",
                        status_data
                    )
                else:
                    self.log_test(
                        "GET /api/calendar/google/status - Integration status",
                        False,
                        f"Response missing required fields: {required_fields}",
                        status_data
                    )
            else:
                self.log_test(
                    "GET /api/calendar/google/status - Integration status",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/calendar/google/status - Integration status",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_google_calendar_auth_url(self):
        """Test GET /api/calendar/google/auth-url - Google Calendar OAuth URL"""
        try:
            response = self.session.get(f"{API_BASE}/calendar/google/auth-url")
            
            if response.status_code == 200:
                auth_data = response.json()
                
                # Check if auth URL is provided or setup is required
                if auth_data.get('setup_required'):
                    self.log_test(
                        "GET /api/calendar/google/auth-url - OAuth URL",
                        True,
                        "Google Calendar integration not configured (expected in test environment)",
                        auth_data
                    )
                elif auth_data.get('auth_url'):
                    self.log_test(
                        "GET /api/calendar/google/auth-url - OAuth URL",
                        True,
                        "Successfully retrieved Google OAuth URL",
                        {"has_auth_url": True, "message": auth_data.get('message')}
                    )
                else:
                    self.log_test(
                        "GET /api/calendar/google/auth-url - OAuth URL",
                        False,
                        "No auth URL or setup message provided",
                        auth_data
                    )
            else:
                self.log_test(
                    "GET /api/calendar/google/auth-url - OAuth URL",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/calendar/google/auth-url - OAuth URL",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def test_event_conflict_check(self):
        """Test POST /api/calendar/events/check-conflicts - Event conflict detection"""
        try:
            # Create a test event for conflict checking
            test_event = {
                "title": "Conflict Test Event",
                "start": (datetime.now() + timedelta(hours=6)).isoformat(),
                "end": (datetime.now() + timedelta(hours=7)).isoformat(),
                "type": "meeting"
            }
            
            response = self.session.post(f"{API_BASE}/calendar/events/check-conflicts", json=test_event)
            
            if response.status_code == 200:
                conflict_data = response.json()
                
                # Verify response structure
                required_fields = ['has_conflicts', 'conflicts', 'message']
                has_required_fields = all(field in conflict_data for field in required_fields)
                
                if has_required_fields:
                    conflicts_found = conflict_data.get('has_conflicts', False)
                    conflict_count = len(conflict_data.get('conflicts', []))
                    
                    self.log_test(
                        "POST /api/calendar/events/check-conflicts - Conflict detection",
                        True,
                        f"Successfully checked for conflicts. Found conflicts: {conflicts_found}, Count: {conflict_count}",
                        conflict_data
                    )
                else:
                    self.log_test(
                        "POST /api/calendar/events/check-conflicts - Conflict detection",
                        False,
                        f"Response missing required fields: {required_fields}",
                        conflict_data
                    )
            else:
                self.log_test(
                    "POST /api/calendar/events/check-conflicts - Conflict detection",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/calendar/events/check-conflicts - Conflict detection",
                False,
                f"Exception occurred: {str(e)}",
                str(e)
            )

    def run_all_tests(self):
        """Run all calendar event CRUD tests"""
        print("🗓️  CALENDAR EVENT CRUD OPERATIONS - COMPREHENSIVE BACKEND TESTING")
        print("=" * 80)
        print(f"Testing against: {API_BASE}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Test sequence following the review request priorities
        print("📋 PHASE 1: CORE CRUD OPERATIONS")
        print("-" * 40)
        
        # GET operations
        self.test_get_all_events()
        self.test_get_events_with_date_filters()
        
        # POST operations
        self.test_create_event_required_fields()
        self.test_create_event_all_fields()
        self.test_create_event_validation()
        
        # PUT operations
        self.test_update_event()
        self.test_update_nonexistent_event()
        
        # DELETE operations
        self.test_delete_event()
        self.test_delete_nonexistent_event()
        
        print("📋 PHASE 2: ADDITIONAL FEATURES")
        print("-" * 40)
        
        # Google Calendar Integration
        self.test_google_calendar_status()
        self.test_google_calendar_auth_url()
        
        # Event conflict checking
        self.test_event_conflict_check()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}")
        
        print("\n" + "=" * 80)
        print(f"Calendar Event CRUD Testing completed at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Save detailed results to file
        with open('/app/calendar_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'success_rate': success_rate,
                    'test_completed_at': datetime.now().isoformat()
                },
                'detailed_results': self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/calendar_test_results.json")

if __name__ == "__main__":
    tester = CalendarEventTester()
    tester.run_all_tests()