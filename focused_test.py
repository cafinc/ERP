#!/usr/bin/env python3
"""
Focused test for Consumable Usage Tracking and Equipment Inspection Systems
"""

import requests
import json
from datetime import datetime, timedelta
import os

# Configuration
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://snowtrack-admin-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def make_request(method, endpoint, data=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{API_BASE}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, params=params, timeout=30)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=30)
        elif method == 'PUT':
            response = requests.put(url, json=data, timeout=30)
        elif method == 'DELETE':
            response = requests.delete(url, timeout=30)
        return response
    except Exception as e:
        print(f"Request error: {e}")
        return None

def test_consumable_usage_system():
    """Test the consumable usage tracking system comprehensively"""
    print("🧪 FOCUSED TEST: Consumable Usage Tracking System")
    print("=" * 60)
    
    test_data = {}
    
    # 1. Create test consumable
    print("1. Creating test consumable...")
    consumable_data = {
        "name": "Test Road Salt for Auto-Deduction",
        "consumable_type": "salt",
        "unit": "tons",
        "quantity_available": 50.0,
        "reorder_level": 10.0,
        "cost_per_unit": 100.0,
        "per_yard": 0.5
    }
    
    response = make_request('POST', '/consumables', consumable_data)
    if response and response.status_code == 200:
        consumable = response.json()
        test_data['consumable_id'] = consumable['id']
        print(f"✅ Created consumable: {consumable['id']}")
    else:
        print(f"❌ Failed to create consumable: {response.status_code if response else 'No response'}")
        return
    
    # 2. Create test service linked to consumable
    print("2. Creating test service with consumable link...")
    service_data = {
        "name": "Test Sanding Service with Consumable",
        "service_type": "sanding",
        "description": "Test service for auto-deduction",
        "pricing": {"per_occurrence": 150.0},
        "consumable_id": test_data['consumable_id']
    }
    
    response = make_request('POST', '/services', service_data)
    if response and response.status_code == 200:
        service = response.json()
        test_data['service_id'] = service['id']
        print(f"✅ Created service: {service['id']} linked to consumable")
    else:
        print(f"❌ Failed to create service: {response.status_code if response else 'No response'}")
        return
    
    # 3. Create test customer, site, crew for dispatch
    print("3. Creating test data for dispatch...")
    
    # Customer
    customer_data = {
        "name": "Test Customer for Auto-Deduction",
        "email": "testautodeduct@example.com",
        "phone": "+1234567890",
        "address": "123 Test Street"
    }
    response = make_request('POST', '/customers', customer_data)
    if response and response.status_code == 200:
        test_data['customer_id'] = response.json()['id']
        print(f"✅ Created customer: {test_data['customer_id']}")
    else:
        print(f"❌ Failed to create customer: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Response: {response.text}")
        return
    
    # Site
    site_data = {
        "name": "Test Site",
        "customer_id": test_data['customer_id'],
        "location": {"address": "123 Test St", "latitude": 43.6532, "longitude": -79.3832},
        "site_type": "commercial"
    }
    response = make_request('POST', '/sites', site_data)
    if response and response.status_code == 200:
        test_data['site_id'] = response.json()['id']
        print(f"✅ Created site: {test_data['site_id']}")
    else:
        print(f"❌ Failed to create site: {response.status_code if response else 'No response'}")
        return
    
    # Crew
    crew_data = {"name": "Test Crew", "email": "crew@example.com", "phone": "+1234567891", "role": "crew"}
    response = make_request('POST', '/users', crew_data)
    if response and response.status_code == 200:
        test_data['crew_id'] = response.json()['id']
        print(f"✅ Created crew: {test_data['crew_id']}")
    
    # Equipment
    equipment_data = {"name": "Test Truck", "equipment_type": "plow_truck", "vehicle_number": "TEST-001"}
    response = make_request('POST', '/equipment', equipment_data)
    if response and response.status_code == 200:
        test_data['equipment_id'] = response.json()['id']
        print(f"✅ Created equipment: {test_data['equipment_id']}")
    
    # 4. Create dispatch with sanding service
    print("4. Creating dispatch with sanding service...")
    dispatch_data = {
        "route_name": "Test Auto-Deduction Route",
        "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "scheduled_time": "08:00",
        "crew_ids": [test_data['crew_id']],
        "equipment_ids": [test_data['equipment_id']],
        "site_ids": [test_data['site_id']],
        "services": ["sanding"]  # This should trigger auto-deduction
    }
    
    response = make_request('POST', '/dispatches', dispatch_data)
    if response and response.status_code == 200:
        dispatch = response.json()
        test_data['dispatch_id'] = dispatch['id']
        print(f"✅ Created dispatch: {dispatch['id']} with sanding service")
    else:
        print(f"❌ Failed to create dispatch: {response.status_code if response else 'No response'}")
        return
    
    # 5. Test manual consumable usage recording
    print("5. Testing manual consumable usage recording...")
    usage_data = {
        "consumable_id": test_data['consumable_id'],
        "dispatch_id": test_data['dispatch_id'],
        "site_id": test_data['site_id'],
        "service_type": "sanding",
        "quantity_used": 3.0,
        "notes": "Manual usage test"
    }
    
    response = make_request('POST', '/consumable-usage', usage_data)
    if response and response.status_code == 200:
        usage = response.json()
        print(f"✅ Manual usage recorded: {usage['id']}, Cost: ${usage.get('cost', 0)}")
    else:
        print(f"❌ Failed to record manual usage: {response.status_code if response else 'No response'}")
    
    # 6. Get initial consumable quantity
    print("6. Getting initial consumable quantity...")
    response = make_request('GET', f'/consumables/{test_data["consumable_id"]}')
    if response and response.status_code == 200:
        consumable = response.json()
        initial_quantity = consumable['quantity_available']
        print(f"✅ Initial quantity: {initial_quantity} {consumable['unit']}")
    else:
        print("❌ Failed to get initial quantity")
        return
    
    # 7. Complete dispatch to trigger auto-deduction
    print("7. Completing dispatch to trigger auto-deduction...")
    update_data = {"status": "completed"}
    response = make_request('PUT', f'/dispatches/{test_data["dispatch_id"]}', update_data)
    if response and response.status_code == 200:
        dispatch = response.json()
        print(f"✅ Dispatch completed: {dispatch['status']}")
    else:
        print(f"❌ Failed to complete dispatch: {response.status_code if response else 'No response'}")
        return
    
    # 8. Check for auto-deducted usage records
    print("8. Checking for auto-deducted usage records...")
    response = make_request('GET', '/consumable-usage', params={'dispatch_id': test_data['dispatch_id']})
    if response and response.status_code == 200:
        usage_records = response.json()
        auto_deducted = [r for r in usage_records if "Auto-deducted" in r.get("notes", "")]
        print(f"✅ Found {len(usage_records)} total usage records")
        print(f"✅ Found {len(auto_deducted)} auto-deducted records")
        
        if auto_deducted:
            for record in auto_deducted:
                print(f"   - Auto-deducted: {record['quantity_used']} {record['unit']} for {record['service_type']}")
        else:
            print("⚠️  No auto-deducted records found - checking service configuration...")
            
            # Check if service exists and has consumable_id
            response = make_request('GET', '/services')
            if response and response.status_code == 200:
                services = response.json()
                sanding_services = [s for s in services if s.get('service_type') == 'sanding']
                print(f"   Found {len(sanding_services)} sanding services:")
                for service in sanding_services:
                    consumable_id = service.get('consumable_id')
                    print(f"   - {service['name']}: consumable_id = {consumable_id}")
    else:
        print(f"❌ Failed to get usage records: {response.status_code if response else 'No response'}")
    
    # 9. Check updated consumable quantity
    print("9. Checking updated consumable quantity...")
    response = make_request('GET', f'/consumables/{test_data["consumable_id"]}')
    if response and response.status_code == 200:
        consumable = response.json()
        final_quantity = consumable['quantity_available']
        quantity_used = initial_quantity - final_quantity
        print(f"✅ Final quantity: {final_quantity} {consumable['unit']}")
        print(f"✅ Total quantity used: {quantity_used} {consumable['unit']}")
    else:
        print("❌ Failed to get final quantity")
    
    # 10. Test usage analytics
    print("10. Testing usage analytics...")
    response = make_request('GET', '/consumable-usage/analytics', params={'days': 30})
    if response and response.status_code == 200:
        analytics = response.json()
        print(f"✅ Analytics (30 days): Total cost: ${analytics.get('total_cost', 0)}")
        print(f"   Total usages: {analytics.get('total_usages', 0)}")
        print(f"   Low stock items: {len(analytics.get('low_stock_items', []))}")
    else:
        print(f"❌ Failed to get analytics: {response.status_code if response else 'No response'}")
    
    # Cleanup
    print("\n🧹 Cleaning up test data...")
    cleanup_ids = [
        ('dispatches', test_data.get('dispatch_id')),
        ('equipment', test_data.get('equipment_id')),
        ('users', test_data.get('crew_id')),
        ('sites', test_data.get('site_id')),
        ('customers', test_data.get('customer_id')),
        ('services', test_data.get('service_id')),
        ('consumables', test_data.get('consumable_id'))
    ]
    
    for endpoint, item_id in cleanup_ids:
        if item_id:
            response = make_request('DELETE', f'/{endpoint}/{item_id}')
            if response and response.status_code == 200:
                print(f"✅ Cleaned up {endpoint}: {item_id}")
            else:
                print(f"⚠️  Failed to clean up {endpoint}: {item_id}")

def test_equipment_inspection_system():
    """Test the equipment inspection reminder system"""
    print("\n🧪 FOCUSED TEST: Equipment Inspection Reminder System")
    print("=" * 60)
    
    # 1. Test inspection status endpoint
    print("1. Testing equipment inspection status...")
    response = make_request('GET', '/equipment/inspection-status')
    if response and response.status_code == 200:
        data = response.json()
        equipment_list = data.get('equipment', [])
        summary = data.get('summary', {})
        print(f"✅ Found {len(equipment_list)} equipment items")
        print(f"   Summary: {summary.get('total_equipment', 0)} total, "
              f"{summary.get('overdue', 0)} overdue, "
              f"{summary.get('due_soon', 0)} due soon, "
              f"{summary.get('current', 0)} current, "
              f"{summary.get('never_inspected', 0)} never inspected")
    else:
        print(f"❌ Failed to get inspection status: {response.status_code if response else 'No response'}")
    
    # 2. Test with invalid equipment ID
    print("2. Testing invalid equipment ID handling...")
    response = make_request('GET', '/equipment/invalid_id/inspection-history')
    if response and response.status_code == 404:
        print("✅ Invalid equipment ID correctly returns 404")
    else:
        print(f"❌ Invalid equipment ID handling failed: {response.status_code if response else 'No response'}")
    
    # 3. Test inspection history for existing equipment
    if equipment_list:
        equipment_id = equipment_list[0]['equipment_id']
        print(f"3. Testing inspection history for equipment {equipment_id}...")
        response = make_request('GET', f'/equipment/{equipment_id}/inspection-history')
        if response and response.status_code == 200:
            history = response.json()
            print(f"✅ Got inspection history: {history.get('total_inspections', 0)} inspections")
        else:
            print(f"❌ Failed to get inspection history: {response.status_code if response else 'No response'}")

if __name__ == "__main__":
    print("🎯 FOCUSED TESTING: Consumable Usage & Equipment Inspection Systems")
    print("=" * 80)
    
    test_consumable_usage_system()
    test_equipment_inspection_system()
    
    print("\n✅ Focused testing completed!")