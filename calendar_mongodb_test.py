#!/usr/bin/env python3
"""
Enhanced Calendar Event CRUD Testing - MongoDB Persistence Focus
Tests the specific requirements from the review request including seed endpoint
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://admin-dashboard-374.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"

class EnhancedCalendarTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.created_event_ids = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
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

    def test_seed_events_endpoint(self):
        """Test POST /api/calendar/seed-events - Seed initial test events"""
        print("🌱 TESTING SEED ENDPOINT")
        print("-" * 40)
        
        try:
            response = requests.post(f"{self.base_url}/calendar/seed-events", timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                
                if data.get("success"):
                    event_ids = data.get("event_ids", [])
                    self.created_event_ids.extend(event_ids)
                    self.log_result(
                        "POST /api/calendar/seed-events - Create initial events", 
                        True, 
                        f"Successfully seeded {len(event_ids)} events. IDs: {event_ids}"
                    )
                    return event_ids
                else:
                    # Check if events already exist
                    existing_count = data.get("existing_events", 0)
                    if existing_count > 0:
                        self.log_result(
                            "POST /api/calendar/seed-events - Events already exist", 
                            True, 
                            f"Database already contains {existing_count} events, seed skipped as expected"
                        )
                        return []
                    else:
                        self.log_result(
                            "POST /api/calendar/seed-events - Unexpected response", 
                            False, 
                            "Success flag false but no existing events count", 
                            data
                        )
                        return []
            else:
                self.log_result(
                    "POST /api/calendar/seed-events - HTTP Error", 
                    False, 
                    f"HTTP {response.status_code}", 
                    response.text
                )
                return []
                
        except Exception as e:
            self.log_result("POST /api/calendar/seed-events - Exception", False, f"Exception: {str(e)}")
            return []

    def test_mongodb_persistence(self):
        """Test that events are actually persisted in MongoDB"""
        print("🗄️ TESTING MONGODB PERSISTENCE")
        print("-" * 40)
        
        try:
            # Create a unique event
            unique_title = f"MongoDB Persistence Test - {datetime.now().strftime('%Y%m%d_%H%M%S')}"
            event_data = {
                "title": unique_title,
                "description": "Testing MongoDB persistence",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat(),
                "location": "Test Location",
                "type": "test",
                "status": "confirmed",
                "color": "purple"
            }
            
            # Create event
            create_response = requests.post(f"{self.base_url}/calendar/events", json=event_data, timeout=10)
            
            if create_response.status_code not in [200, 201]:
                self.log_result(
                    "MongoDB Persistence - Event Creation Failed", 
                    False, 
                    f"Failed to create test event: {create_response.status_code}"
                )
                return False
            
            created_event = create_response.json()
            event_id = created_event.get("id")
            
            if not event_id:
                self.log_result(
                    "MongoDB Persistence - No ID Returned", 
                    False, 
                    "Created event has no ID"
                )
                return False
            
            self.created_event_ids.append(event_id)
            
            # Verify persistence by retrieving all events
            get_response = requests.get(f"{self.base_url}/calendar/events", timeout=10)
            
            if get_response.status_code != 200:
                self.log_result(
                    "MongoDB Persistence - Retrieval Failed", 
                    False, 
                    f"Failed to retrieve events: {get_response.status_code}"
                )
                return False
            
            events = get_response.json()
            
            # Find our created event
            found_event = None
            for event in events:
                if event.get("id") == event_id:
                    found_event = event
                    break
            
            if found_event:
                # Verify all fields are preserved
                fields_match = (
                    found_event.get("title") == unique_title and
                    found_event.get("description") == event_data["description"] and
                    found_event.get("location") == event_data["location"] and
                    found_event.get("type") == event_data["type"] and
                    found_event.get("status") == event_data["status"] and
                    found_event.get("color") == event_data["color"]
                )
                
                if fields_match:
                    self.log_result(
                        "MongoDB Persistence - Data Integrity", 
                        True, 
                        f"Event persisted correctly with all fields intact. ID: {event_id}"
                    )
                else:
                    self.log_result(
                        "MongoDB Persistence - Data Mismatch", 
                        False, 
                        "Event found but some fields don't match", 
                        {"expected": event_data, "found": found_event}
                    )
                    return False
            else:
                self.log_result(
                    "MongoDB Persistence - Event Not Found", 
                    False, 
                    f"Created event with ID {event_id} not found in database"
                )
                return False
            
            # Test persistence across requests by making another request
            second_get_response = requests.get(f"{self.base_url}/calendar/events", timeout=10)
            
            if second_get_response.status_code == 200:
                second_events = second_get_response.json()
                second_found = any(event.get("id") == event_id for event in second_events)
                
                if second_found:
                    self.log_result(
                        "MongoDB Persistence - Cross-Request Persistence", 
                        True, 
                        "Event persists across multiple API requests"
                    )
                    return True
                else:
                    self.log_result(
                        "MongoDB Persistence - Cross-Request Failure", 
                        False, 
                        "Event disappeared between requests"
                    )
                    return False
            else:
                self.log_result(
                    "MongoDB Persistence - Second Request Failed", 
                    False, 
                    f"Second retrieval failed: {second_get_response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result("MongoDB Persistence - Exception", False, f"Exception: {str(e)}")
            return False

    def test_proper_404_handling(self):
        """Test that 404 errors are returned for non-existent events (not 200)"""
        print("🚫 TESTING PROPER 404 ERROR HANDLING")
        print("-" * 40)
        
        try:
            # Test with valid ObjectId format but non-existent
            fake_id = "507f1f77bcf86cd799439011"
            
            # Test UPDATE with non-existent ID
            update_data = {
                "title": "Should return 404",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            update_response = requests.put(f"{self.base_url}/calendar/events/{fake_id}", json=update_data, timeout=10)
            
            if update_response.status_code == 404:
                self.log_result(
                    "404 Handling - UPDATE non-existent event", 
                    True, 
                    "Correctly returned 404 for UPDATE on non-existent event"
                )
            else:
                self.log_result(
                    "404 Handling - UPDATE non-existent event", 
                    False, 
                    f"Expected 404, got {update_response.status_code}", 
                    update_response.text
                )
            
            # Test DELETE with non-existent ID
            delete_response = requests.delete(f"{self.base_url}/calendar/events/{fake_id}", timeout=10)
            
            if delete_response.status_code == 404:
                self.log_result(
                    "404 Handling - DELETE non-existent event", 
                    True, 
                    "Correctly returned 404 for DELETE on non-existent event"
                )
            else:
                self.log_result(
                    "404 Handling - DELETE non-existent event", 
                    False, 
                    f"Expected 404, got {delete_response.status_code}", 
                    delete_response.text
                )
            
            # Test with invalid ObjectId format
            invalid_id = "invalid-object-id-format"
            
            update_response_invalid = requests.put(f"{self.base_url}/calendar/events/{invalid_id}", json=update_data, timeout=10)
            
            if update_response_invalid.status_code == 404:
                self.log_result(
                    "404 Handling - Invalid ObjectId format", 
                    True, 
                    "Correctly returned 404 for invalid ObjectId format"
                )
                return True
            else:
                self.log_result(
                    "404 Handling - Invalid ObjectId format", 
                    False, 
                    f"Expected 404, got {update_response_invalid.status_code}", 
                    update_response_invalid.text
                )
                return False
                
        except Exception as e:
            self.log_result("404 Handling - Exception", False, f"Exception: {str(e)}")
            return False

    def test_actual_deletion_from_database(self):
        """Test that deleted events are actually removed from database"""
        print("🗑️ TESTING ACTUAL DATABASE DELETION")
        print("-" * 40)
        
        try:
            # Create an event to delete
            event_data = {
                "title": "Event to be deleted",
                "description": "This event will be deleted to test database removal",
                "start": (datetime.now() + timedelta(hours=1)).isoformat(),
                "end": (datetime.now() + timedelta(hours=2)).isoformat(),
                "type": "test"
            }
            
            create_response = requests.post(f"{self.base_url}/calendar/events", json=event_data, timeout=10)
            
            if create_response.status_code not in [200, 201]:
                self.log_result(
                    "Database Deletion - Event Creation Failed", 
                    False, 
                    f"Failed to create event for deletion test: {create_response.status_code}"
                )
                return False
            
            created_event = create_response.json()
            event_id = created_event.get("id")
            
            if not event_id:
                self.log_result(
                    "Database Deletion - No ID Returned", 
                    False, 
                    "Created event has no ID"
                )
                return False
            
            # Verify event exists
            get_before_response = requests.get(f"{self.base_url}/calendar/events", timeout=10)
            
            if get_before_response.status_code != 200:
                self.log_result(
                    "Database Deletion - Pre-deletion Check Failed", 
                    False, 
                    f"Failed to verify event exists before deletion: {get_before_response.status_code}"
                )
                return False
            
            events_before = get_before_response.json()
            event_exists_before = any(event.get("id") == event_id for event in events_before)
            
            if not event_exists_before:
                self.log_result(
                    "Database Deletion - Event Not Found Before Deletion", 
                    False, 
                    "Event not found in database before deletion attempt"
                )
                return False
            
            # Delete the event
            delete_response = requests.delete(f"{self.base_url}/calendar/events/{event_id}", timeout=10)
            
            if delete_response.status_code != 200:
                self.log_result(
                    "Database Deletion - Delete Request Failed", 
                    False, 
                    f"Delete request failed: {delete_response.status_code}", 
                    delete_response.text
                )
                return False
            
            delete_result = delete_response.json()
            
            if not delete_result.get("success"):
                self.log_result(
                    "Database Deletion - Delete Not Successful", 
                    False, 
                    "Delete response doesn't indicate success", 
                    delete_result
                )
                return False
            
            # Verify event is actually removed from database
            get_after_response = requests.get(f"{self.base_url}/calendar/events", timeout=10)
            
            if get_after_response.status_code != 200:
                self.log_result(
                    "Database Deletion - Post-deletion Check Failed", 
                    False, 
                    f"Failed to verify deletion: {get_after_response.status_code}"
                )
                return False
            
            events_after = get_after_response.json()
            event_exists_after = any(event.get("id") == event_id for event in events_after)
            
            if not event_exists_after:
                self.log_result(
                    "Database Deletion - Successful Removal", 
                    True, 
                    f"Event {event_id} successfully removed from database"
                )
            else:
                self.log_result(
                    "Database Deletion - Event Still Exists", 
                    False, 
                    f"Event {event_id} still exists in database after deletion"
                )
                return False
            
            # Verify deleted event cannot be updated
            update_data = {
                "title": "This should fail",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            update_response = requests.put(f"{self.base_url}/calendar/events/{event_id}", json=update_data, timeout=10)
            
            if update_response.status_code == 404:
                self.log_result(
                    "Database Deletion - Update After Delete Fails", 
                    True, 
                    "Correctly returned 404 when trying to update deleted event"
                )
                return True
            else:
                self.log_result(
                    "Database Deletion - Update After Delete Succeeds", 
                    False, 
                    f"Update on deleted event returned {update_response.status_code} instead of 404", 
                    update_response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Database Deletion - Exception", False, f"Exception: {str(e)}")
            return False

    def test_conflict_detection_with_database(self):
        """Test conflict detection using database queries"""
        print("⚔️ TESTING CONFLICT DETECTION WITH DATABASE")
        print("-" * 40)
        
        try:
            # Create a base event
            base_start = datetime.now() + timedelta(hours=3)
            base_end = base_start + timedelta(hours=2)
            
            base_event_data = {
                "title": "Base Event for Conflict Test",
                "description": "This event will be used to test conflict detection",
                "start": base_start.isoformat(),
                "end": base_end.isoformat(),
                "type": "meeting",
                "status": "confirmed"
            }
            
            create_response = requests.post(f"{self.base_url}/calendar/events", json=base_event_data, timeout=10)
            
            if create_response.status_code not in [200, 201]:
                self.log_result(
                    "Conflict Detection - Base Event Creation Failed", 
                    False, 
                    f"Failed to create base event: {create_response.status_code}"
                )
                return False
            
            base_event = create_response.json()
            base_event_id = base_event.get("id")
            
            if base_event_id:
                self.created_event_ids.append(base_event_id)
            
            # Test overlapping event (should detect conflict)
            overlapping_start = base_start + timedelta(minutes=30)  # Starts 30 min after base starts
            overlapping_end = base_end + timedelta(minutes=30)      # Ends 30 min after base ends
            
            overlapping_event_data = {
                "title": "Overlapping Event",
                "start": overlapping_start.isoformat(),
                "end": overlapping_end.isoformat(),
                "type": "appointment"
            }
            
            conflict_response = requests.post(f"{self.base_url}/calendar/events/check-conflicts", json=overlapping_event_data, timeout=10)
            
            if conflict_response.status_code != 200:
                self.log_result(
                    "Conflict Detection - Check Request Failed", 
                    False, 
                    f"Conflict check request failed: {conflict_response.status_code}"
                )
                return False
            
            conflict_result = conflict_response.json()
            
            if conflict_result.get("has_conflicts") and len(conflict_result.get("conflicts", [])) > 0:
                conflicts = conflict_result.get("conflicts", [])
                found_base_event = any(conflict.get("id") == base_event_id for conflict in conflicts)
                
                if found_base_event:
                    self.log_result(
                        "Conflict Detection - Overlapping Event Detected", 
                        True, 
                        f"Successfully detected conflict with base event. Found {len(conflicts)} conflicting event(s)"
                    )
                else:
                    self.log_result(
                        "Conflict Detection - Wrong Conflict Detected", 
                        False, 
                        "Conflicts detected but not the expected base event", 
                        conflicts
                    )
            else:
                self.log_result(
                    "Conflict Detection - No Conflicts Detected", 
                    False, 
                    "Expected conflict not detected", 
                    conflict_result
                )
                return False
            
            # Test non-overlapping event (should not detect conflict)
            non_overlapping_start = base_end + timedelta(hours=1)  # Starts 1 hour after base ends
            non_overlapping_end = non_overlapping_start + timedelta(hours=1)
            
            non_overlapping_event_data = {
                "title": "Non-overlapping Event",
                "start": non_overlapping_start.isoformat(),
                "end": non_overlapping_end.isoformat(),
                "type": "appointment"
            }
            
            no_conflict_response = requests.post(f"{self.base_url}/calendar/events/check-conflicts", json=non_overlapping_event_data, timeout=10)
            
            if no_conflict_response.status_code != 200:
                self.log_result(
                    "Conflict Detection - No Conflict Check Failed", 
                    False, 
                    f"No conflict check request failed: {no_conflict_response.status_code}"
                )
                return False
            
            no_conflict_result = no_conflict_response.json()
            
            if not no_conflict_result.get("has_conflicts"):
                self.log_result(
                    "Conflict Detection - No False Positives", 
                    True, 
                    "Correctly identified no conflicts for non-overlapping event"
                )
                return True
            else:
                self.log_result(
                    "Conflict Detection - False Positive", 
                    False, 
                    "Incorrectly detected conflicts for non-overlapping event", 
                    no_conflict_result
                )
                return False
                
        except Exception as e:
            self.log_result("Conflict Detection - Exception", False, f"Exception: {str(e)}")
            return False

    def test_mongodb_id_conversion(self):
        """Test that MongoDB _id is properly converted to id field"""
        print("🔄 TESTING MONGODB ID CONVERSION")
        print("-" * 40)
        
        try:
            # Create an event
            event_data = {
                "title": "ID Conversion Test Event",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat()
            }
            
            create_response = requests.post(f"{self.base_url}/calendar/events", json=event_data, timeout=10)
            
            if create_response.status_code not in [200, 201]:
                self.log_result(
                    "ID Conversion - Event Creation Failed", 
                    False, 
                    f"Failed to create event: {create_response.status_code}"
                )
                return False
            
            created_event = create_response.json()
            
            # Check that response has 'id' field and not '_id'
            has_id = "id" in created_event
            has_underscore_id = "_id" in created_event
            
            if has_id and not has_underscore_id:
                event_id = created_event["id"]
                self.created_event_ids.append(event_id)
                
                # Verify ID is a valid ObjectId string (24 hex characters)
                is_valid_objectid = len(event_id) == 24 and all(c in '0123456789abcdef' for c in event_id.lower())
                
                if is_valid_objectid:
                    self.log_result(
                        "ID Conversion - Create Response Format", 
                        True, 
                        f"Event created with properly converted ID: {event_id}"
                    )
                else:
                    self.log_result(
                        "ID Conversion - Invalid ID Format", 
                        False, 
                        f"ID format is not valid ObjectId: {event_id}"
                    )
                    return False
            else:
                self.log_result(
                    "ID Conversion - Create Response Format", 
                    False, 
                    f"Response has _id: {has_underscore_id}, has id: {has_id}", 
                    created_event
                )
                return False
            
            # Test that GET requests also return proper ID format
            get_response = requests.get(f"{self.base_url}/calendar/events", timeout=10)
            
            if get_response.status_code != 200:
                self.log_result(
                    "ID Conversion - GET Request Failed", 
                    False, 
                    f"GET request failed: {get_response.status_code}"
                )
                return False
            
            events = get_response.json()
            
            if events:
                # Check first event for proper ID format
                first_event = events[0]
                get_has_id = "id" in first_event
                get_has_underscore_id = "_id" in first_event
                
                if get_has_id and not get_has_underscore_id:
                    self.log_result(
                        "ID Conversion - GET Response Format", 
                        True, 
                        "GET response properly converts MongoDB _id to id field"
                    )
                    return True
                else:
                    self.log_result(
                        "ID Conversion - GET Response Format", 
                        False, 
                        f"GET response has _id: {get_has_underscore_id}, has id: {get_has_id}", 
                        first_event
                    )
                    return False
            else:
                self.log_result(
                    "ID Conversion - No Events in GET Response", 
                    False, 
                    "No events returned by GET request"
                )
                return False
                
        except Exception as e:
            self.log_result("ID Conversion - Exception", False, f"Exception: {str(e)}")
            return False

    def cleanup_test_events(self):
        """Clean up any events created during testing"""
        cleaned_count = 0
        for event_id in self.created_event_ids:
            try:
                response = requests.delete(f"{self.base_url}/calendar/events/{event_id}", timeout=10)
                if response.status_code == 200:
                    cleaned_count += 1
            except:
                pass  # Ignore cleanup errors
        
        if cleaned_count > 0:
            print(f"🧹 Cleaned up {cleaned_count} test events")

    def run_enhanced_tests(self):
        """Run enhanced MongoDB-focused calendar tests"""
        print("🗓️ ENHANCED CALENDAR EVENT CRUD OPERATIONS - MONGODB PERSISTENCE TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Test 1: Seed endpoint
        seeded_ids = self.test_seed_events_endpoint()
        
        # Test 2: MongoDB persistence
        self.test_mongodb_persistence()
        
        # Test 3: Proper 404 handling
        self.test_proper_404_handling()
        
        # Test 4: Actual database deletion
        self.test_actual_deletion_from_database()
        
        # Test 5: Conflict detection with database
        self.test_conflict_detection_with_database()
        
        # Test 6: MongoDB ID conversion
        self.test_mongodb_id_conversion()
        
        # Cleanup
        self.cleanup_test_events()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 ENHANCED CALENDAR TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  - {result['test']}")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = EnhancedCalendarTester()
    success = tester.run_enhanced_tests()
    
    if success:
        print("\n🎉 ENHANCED CALENDAR TESTING COMPLETED SUCCESSFULLY!")
    else:
        print("\n⚠️  ENHANCED CALENDAR TESTING COMPLETED WITH ISSUES")
    
    return success

if __name__ == "__main__":
    main()