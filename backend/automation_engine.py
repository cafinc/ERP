"""
Workflow Automation Engine for Snow Removal Operations
Handles automated workflows for dispatch, customer communication, equipment, and more.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class AutomationEngine:
    """Main automation engine for handling workflow triggers and actions"""
    
    def __init__(self, db):
        self.db = db
        self.workflows = {}
        self._register_workflows()
    
    def _register_workflows(self):
        """Register all available workflow automations"""
        self.workflows = {
            'service_completion': ServiceCompletionWorkflow(self.db),
            'customer_communication': CustomerCommunicationWorkflow(self.db),
            'equipment_maintenance': EquipmentMaintenanceWorkflow(self.db),
            'weather_operations': WeatherOperationsWorkflow(self.db),
            'safety_compliance': SafetyComplianceWorkflow(self.db),
            'inventory_management': InventoryManagementWorkflow(self.db),
        }
    
    async def trigger_workflow(self, workflow_name: str, context: Dict[str, Any]):
        """
        Trigger a specific workflow with given context
        
        Args:
            workflow_name: Name of the workflow to trigger
            context: Context data for the workflow
            
        Returns:
            Dict with workflow execution results
        """
        if workflow_name not in self.workflows:
            logger.error(f"Workflow '{workflow_name}' not found")
            return {'success': False, 'error': f"Workflow '{workflow_name}' not found"}
        
        workflow = self.workflows[workflow_name]
        started_at = datetime.utcnow()
        
        # Create execution log
        execution_log = {
            "workflow_id": workflow_name,
            "workflow_name": workflow_name.replace('_', ' ').title(),
            "status": "running",
            "started_at": started_at,
            "trigger": context.get('trigger_type', 'manual'),
            "context": context,
            "created_at": started_at
        }
        
        try:
            # Insert execution log
            execution_result = await self.db.workflow_executions.insert_one(execution_log)
            execution_id = execution_result.inserted_id
            
            # Execute workflow
            result = await workflow.execute(context)
            completed_at = datetime.utcnow()
            duration = (completed_at - started_at).total_seconds()
            
            # Update execution log with success
            await self.db.workflow_executions.update_one(
                {"_id": execution_id},
                {
                    "$set": {
                        "status": "success",
                        "completed_at": completed_at,
                        "duration": duration,
                        "result": result
                    }
                }
            )
            
            logger.info(f"Workflow '{workflow_name}' executed successfully")
            return {'success': True, 'result': result}
        except Exception as e:
            completed_at = datetime.utcnow()
            duration = (completed_at - started_at).total_seconds()
            
            # Update execution log with failure
            await self.db.workflow_executions.update_one(
                {"_id": execution_id},
                {
                    "$set": {
                        "status": "failed",
                        "completed_at": completed_at,
                        "duration": duration,
                        "error": str(e)
                    }
                }
            )
            
            logger.error(f"Error executing workflow '{workflow_name}': {str(e)}")
            return {'success': False, 'error': str(e)}


class ServiceCompletionWorkflow:
    """
    Workflow 2: Service Completion Automation
    Handles all automation when a service dispatch is completed
    """
    
    def __init__(self, db):
        self.db = db
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute service completion workflow
        
        Expected context:
            - dispatch_id: ID of the completed dispatch
            - crew_id: ID of the crew completing the service
        """
        dispatch_id = context.get('dispatch_id')
        crew_id = context.get('crew_id')
        
        if not dispatch_id:
            raise ValueError("dispatch_id is required")
        
        results = {
            'dispatch_id': dispatch_id,
            'steps_completed': [],
            'errors': []
        }
        
        # Step 1: Auto-request after photos
        try:
            await self._request_after_photos(dispatch_id, crew_id)
            results['steps_completed'].append('after_photos_requested')
        except Exception as e:
            results['errors'].append(f'after_photos: {str(e)}')
        
        # Step 2: Auto-generate service report PDF
        try:
            pdf_id = await self._generate_service_report(dispatch_id)
            results['service_report_id'] = pdf_id
            results['steps_completed'].append('service_report_generated')
        except Exception as e:
            results['errors'].append(f'service_report: {str(e)}')
        
        # Step 3: Auto-send customer notification
        try:
            await self._send_completion_notification(dispatch_id)
            results['steps_completed'].append('customer_notified')
        except Exception as e:
            results['errors'].append(f'customer_notification: {str(e)}')
        
        # Step 4: Auto-deduct consumables
        try:
            consumables_deducted = await self._deduct_consumables(dispatch_id)
            results['consumables_deducted'] = consumables_deducted
            results['steps_completed'].append('consumables_deducted')
        except Exception as e:
            results['errors'].append(f'consumables: {str(e)}')
        
        # Step 5: Auto-update equipment hours
        try:
            await self._update_equipment_hours(dispatch_id)
            results['steps_completed'].append('equipment_hours_updated')
        except Exception as e:
            results['errors'].append(f'equipment_hours: {str(e)}')
        
        # Step 6: Auto-create invoice
        try:
            invoice_id = await self._create_invoice(dispatch_id)
            results['invoice_id'] = invoice_id
            results['steps_completed'].append('invoice_created')
        except Exception as e:
            results['errors'].append(f'invoice_creation: {str(e)}')
        
        return results
    
    async def _request_after_photos(self, dispatch_id: str, crew_id: str):
        """Request after photos from crew"""
        # Create a notification/message for crew to upload after photos
        await self.db.messages.insert_one({
            'type': 'photo_request',
            'priority': 'high',
            'subject': 'After Photos Required',
            'message': f'Please upload after photos for dispatch {dispatch_id}',
            'dispatch_id': dispatch_id,
            'crew_id': crew_id,
            'status': 'pending',
            'created_at': datetime.utcnow(),
        })
    
    async def _generate_service_report(self, dispatch_id: str) -> str:
        """Generate service report PDF"""
        # This would integrate with PDF generation system
        # For now, create a placeholder record
        report = await self.db.service_reports.insert_one({
            'dispatch_id': dispatch_id,
            'generated_at': datetime.utcnow(),
            'status': 'generated',
        })
        return str(report.inserted_id)
    
    async def _send_completion_notification(self, dispatch_id: str):
        """Send completion notification to customer"""
        # Get dispatch and customer details
        dispatch = await self.db.dispatches.find_one({'_id': ObjectId(dispatch_id)})
        if not dispatch:
            return
        
        customer_id = dispatch.get('customer_id')
        if not customer_id:
            return
        
        customer = await self.db.customers.find_one({'_id': ObjectId(customer_id)})
        if not customer:
            return
        
        # Create notification message
        await self.db.notifications.insert_one({
            'customer_id': customer_id,
            'dispatch_id': dispatch_id,
            'type': 'service_completed',
            'title': 'Service Completed',
            'message': f'Your snow removal service has been completed.',
            'created_at': datetime.utcnow(),
            'read': False,
        })
    
    async def _deduct_consumables(self, dispatch_id: str) -> List[Dict]:
        """Auto-deduct consumables based on dispatch"""
        # Get dispatch details
        dispatch = await self.db.dispatches.find_one({'_id': ObjectId(dispatch_id)})
        if not dispatch:
            return []
        
        deductions = []
        service_ids = dispatch.get('service_ids', [])
        
        for service_id in service_ids:
            # Get service details
            service = await self.db.services.find_one({'_id': ObjectId(service_id)})
            if not service or not service.get('consumable_id'):
                continue
            
            consumable_id = service['consumable_id']
            quantity = service.get('consumable_quantity', 1)
            
            # Deduct from inventory
            consumable = await self.db.consumables.find_one({'_id': ObjectId(consumable_id)})
            if consumable:
                new_quantity = max(0, consumable.get('quantity_in_stock', 0) - quantity)
                await self.db.consumables.update_one(
                    {'_id': ObjectId(consumable_id)},
                    {'$set': {'quantity_in_stock': new_quantity}}
                )
                
                # Record usage
                await self.db.consumable_usage.insert_one({
                    'dispatch_id': dispatch_id,
                    'consumable_id': consumable_id,
                    'quantity_used': quantity,
                    'cost': consumable.get('cost_per_unit', 0) * quantity,
                    'used_at': datetime.utcnow(),
                    'auto_deducted': True,
                })
                
                deductions.append({
                    'consumable_id': consumable_id,
                    'quantity': quantity,
                })
        
        return deductions
    
    async def _update_equipment_hours(self, dispatch_id: str):
        """Update equipment usage hours"""
        dispatch = await self.db.dispatches.find_one({'_id': ObjectId(dispatch_id)})
        if not dispatch:
            return
        
        equipment_ids = dispatch.get('equipment_ids', [])
        duration_hours = dispatch.get('duration_hours', 1)  # Default 1 hour if not specified
        
        for equipment_id in equipment_ids:
            await self.db.equipment.update_one(
                {'_id': ObjectId(equipment_id)},
                {
                    '$inc': {'hours_used': duration_hours},
                    '$set': {'last_used': datetime.utcnow()}
                }
            )
    
    async def _create_invoice(self, dispatch_id: str) -> Optional[str]:
        """Auto-create invoice from completed dispatch"""
        dispatch = await self.db.dispatches.find_one({'_id': ObjectId(dispatch_id)})
        if not dispatch:
            return None
        
        customer_id = dispatch.get('customer_id')
        if not customer_id:
            return None
        
        # Calculate total from services
        service_ids = dispatch.get('service_ids', [])
        line_items = []
        subtotal = 0
        
        for service_id in service_ids:
            service = await self.db.services.find_one({'_id': ObjectId(service_id)})
            if service:
                price = service.get('default_price', 0)
                line_items.append({
                    'description': service.get('name', 'Service'),
                    'quantity': 1,
                    'unit_price': price,
                    'total': price,
                })
                subtotal += price
        
        tax = subtotal * 0.05  # 5% GST
        total = subtotal + tax
        
        # Create invoice
        invoice = await self.db.invoices.insert_one({
            'customer_id': customer_id,
            'dispatch_id': dispatch_id,
            'line_items': line_items,
            'subtotal': subtotal,
            'tax': tax,
            'total': total,
            'status': 'draft',
            'created_at': datetime.utcnow(),
        })
        
        return str(invoice.inserted_id)


class CustomerCommunicationWorkflow:
    """
    Workflow 4: Customer Communication Automation
    Handles automated customer notifications at various stages
    """
    
    def __init__(self, db):
        self.db = db
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute customer communication workflow"""
        trigger_type = context.get('trigger_type')
        
        if trigger_type == 'estimate_created':
            return await self._notify_estimate_created(context)
        elif trigger_type == 'project_started':
            return await self._notify_project_started(context)
        elif trigger_type == 'crew_enroute':
            return await self._notify_crew_enroute(context)
        elif trigger_type == 'service_completed':
            return await self._notify_service_completed(context)
        elif trigger_type == 'invoice_sent':
            return await self._notify_invoice_sent(context)
        elif trigger_type == 'invoice_overdue':
            return await self._notify_invoice_overdue(context)
        else:
            raise ValueError(f"Unknown trigger type: {trigger_type}")
    
    async def _notify_estimate_created(self, context: Dict) -> Dict:
        """Send notification when estimate is created"""
        estimate_id = context.get('estimate_id')
        customer_id = context.get('customer_id')
        
        await self.db.notifications.insert_one({
            'customer_id': customer_id,
            'type': 'estimate_created',
            'title': 'New Estimate Available',
            'message': 'Your snow removal estimate is ready for review.',
            'estimate_id': estimate_id,
            'created_at': datetime.utcnow(),
            'read': False,
        })
        
        return {'notification_sent': True, 'type': 'estimate_created'}
    
    async def _notify_project_started(self, context: Dict) -> Dict:
        """Send notification when project starts"""
        project_id = context.get('project_id')
        customer_id = context.get('customer_id')
        
        await self.db.notifications.insert_one({
            'customer_id': customer_id,
            'type': 'project_started',
            'title': 'Project Started',
            'message': 'Your snow removal project has been started.',
            'project_id': project_id,
            'created_at': datetime.utcnow(),
            'read': False,
        })
        
        return {'notification_sent': True, 'type': 'project_started'}
    
    async def _notify_crew_enroute(self, context: Dict) -> Dict:
        """Send SMS notification when crew is en route with ETA"""
        dispatch_id = context.get('dispatch_id')
        customer_id = context.get('customer_id')
        eta_minutes = context.get('eta_minutes', 15)
        
        # Create SMS notification
        customer = await self.db.customers.find_one({'_id': ObjectId(customer_id)})
        if customer and customer.get('phone'):
            # This would integrate with Twilio SMS service
            await self.db.sms_queue.insert_one({
                'phone': customer['phone'],
                'message': f'Our crew is on the way! ETA: {eta_minutes} minutes.',
                'dispatch_id': dispatch_id,
                'type': 'crew_enroute',
                'status': 'pending',
                'created_at': datetime.utcnow(),
            })
        
        return {'sms_queued': True, 'type': 'crew_enroute', 'eta_minutes': eta_minutes}
    
    async def _notify_service_completed(self, context: Dict) -> Dict:
        """Send notification with photos when service is completed"""
        dispatch_id = context.get('dispatch_id')
        customer_id = context.get('customer_id')
        
        # Get before/after photos
        photos = await self.db.photos.find({
            'dispatch_id': dispatch_id,
            'photo_type': {'$in': ['before', 'after']}
        }).to_list(length=10)
        
        await self.db.notifications.insert_one({
            'customer_id': customer_id,
            'dispatch_id': dispatch_id,
            'type': 'service_completed',
            'title': 'Service Completed',
            'message': f'Your service is complete! {len(photos)} photos attached.',
            'photo_count': len(photos),
            'created_at': datetime.utcnow(),
            'read': False,
        })
        
        return {'notification_sent': True, 'photo_count': len(photos)}
    
    async def _notify_invoice_sent(self, context: Dict) -> Dict:
        """Send notification when invoice is sent"""
        invoice_id = context.get('invoice_id')
        customer_id = context.get('customer_id')
        
        await self.db.notifications.insert_one({
            'customer_id': customer_id,
            'invoice_id': invoice_id,
            'type': 'invoice_sent',
            'title': 'Invoice Available',
            'message': 'Your invoice is ready for payment.',
            'created_at': datetime.utcnow(),
            'read': False,
        })
        
        return {'notification_sent': True, 'type': 'invoice_sent'}
    
    async def _notify_invoice_overdue(self, context: Dict) -> Dict:
        """Send reminder for overdue invoice"""
        invoice_id = context.get('invoice_id')
        customer_id = context.get('customer_id')
        days_overdue = context.get('days_overdue', 0)
        
        await self.db.notifications.insert_one({
            'customer_id': customer_id,
            'invoice_id': invoice_id,
            'type': 'invoice_overdue',
            'title': 'Payment Reminder',
            'message': f'Your invoice is {days_overdue} days overdue. Please submit payment.',
            'priority': 'high',
            'created_at': datetime.utcnow(),
            'read': False,
        })
        
        return {'notification_sent': True, 'days_overdue': days_overdue}


class EquipmentMaintenanceWorkflow:
    """
    Workflow 3: Equipment Maintenance Automation
    Handles automated equipment inspection and maintenance scheduling
    """
    
    def __init__(self, db):
        self.db = db
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute equipment maintenance workflow"""
        # Check all equipment for maintenance due
        equipment_list = await self.db.equipment.find({'active': True}).to_list(length=1000)
        
        results = {
            'equipment_checked': len(equipment_list),
            'inspections_due': [],
            'maintenance_scheduled': [],
            'alerts_sent': [],
        }
        
        for equipment in equipment_list:
            equipment_id = str(equipment['_id'])
            
            # Check if inspection is due
            inspection_due = await self._check_inspection_due(equipment)
            if inspection_due:
                results['inspections_due'].append(equipment_id)
                
                # Send reminder to crew
                await self._send_inspection_reminder(equipment)
                results['alerts_sent'].append(equipment_id)
                
                # Auto-schedule maintenance if overdue
                if inspection_due['days_overdue'] > 7:
                    maintenance_id = await self._schedule_maintenance(equipment)
                    results['maintenance_scheduled'].append(maintenance_id)
        
        return results
    
    async def _check_inspection_due(self, equipment: Dict) -> Optional[Dict]:
        """Check if equipment inspection is due"""
        # Get last inspection from form responses
        last_inspection = await self.db.form_responses.find_one(
            {
                'form_type': 'equipment_inspection',
                'equipment_id': str(equipment['_id']),
            },
            sort=[('submitted_at', -1)]
        )
        
        if not last_inspection:
            # Never inspected
            return {'status': 'never_inspected', 'days_overdue': 999}
        
        days_since_inspection = (datetime.utcnow() - last_inspection['submitted_at']).days
        
        if days_since_inspection > 30:
            return {'status': 'overdue', 'days_overdue': days_since_inspection - 30}
        elif days_since_inspection > 21:
            return {'status': 'due_soon', 'days_until_due': 30 - days_since_inspection}
        
        return None
    
    async def _send_inspection_reminder(self, equipment: Dict):
        """Send inspection reminder to crew"""
        await self.db.messages.insert_one({
            'type': 'inspection_reminder',
            'priority': 'medium',
            'subject': f'Inspection Due: {equipment.get("name", "Equipment")}',
            'message': f'Please complete inspection for {equipment.get("vehicle_number", "N/A")}',
            'equipment_id': str(equipment['_id']),
            'status': 'pending',
            'created_at': datetime.utcnow(),
        })
    
    async def _schedule_maintenance(self, equipment: Dict) -> str:
        """Auto-schedule maintenance dispatch"""
        maintenance = await self.db.maintenance_dispatches.insert_one({
            'equipment_id': str(equipment['_id']),
            'type': 'inspection',
            'priority': 'high',
            'scheduled_date': datetime.utcnow() + timedelta(days=1),
            'status': 'scheduled',
            'notes': 'Auto-scheduled due to overdue inspection',
            'created_at': datetime.utcnow(),
        })
        
        return str(maintenance.inserted_id)


class WeatherOperationsWorkflow:
    """
    Workflow 5: Weather-Based Operations
    Handles automated operations based on weather forecasts
    """
    
    def __init__(self, db):
        self.db = db
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute weather-based operations workflow"""
        forecast = context.get('forecast', {})
        snow_risk = forecast.get('snow_risk', 'low')
        
        results = {
            'snow_risk': snow_risk,
            'alerts_sent': 0,
            'dispatches_created': 0,
            'routes_adjusted': 0,
        }
        
        if snow_risk in ['high', 'medium']:
            # Alert all crews
            await self._alert_crews(forecast)
            results['alerts_sent'] = await self.db.users.count_documents({'role': 'crew'})
            
            # Create priority dispatches
            if snow_risk == 'high':
                dispatches = await self._create_priority_dispatches()
                results['dispatches_created'] = len(dispatches)
        
        return results
    
    async def _alert_crews(self, forecast: Dict):
        """Send weather alerts to all crew members"""
        crews = await self.db.users.find({'role': 'crew'}).to_list(length=1000)
        
        for crew in crews:
            await self.db.notifications.insert_one({
                'user_id': str(crew['_id']),
                'type': 'weather_alert',
                'title': 'Snow Forecast Alert',
                'message': f"Snow risk: {forecast.get('snow_risk', 'unknown')}. Prepare equipment.",
                'priority': 'high',
                'created_at': datetime.utcnow(),
                'read': False,
            })
    
    async def _create_priority_dispatches(self) -> List[str]:
        """Create dispatches for high-priority sites"""
        # Get high-priority sites
        sites = await self.db.sites.find({
            'priority': {'$in': ['high', 'critical']},
            'active': True
        }).to_list(length=100)
        
        dispatches_created = []
        
        for site in sites:
            dispatch = await self.db.dispatches.insert_one({
                'site_id': str(site['_id']),
                'customer_id': site.get('customer_id'),
                'status': 'scheduled',
                'scheduled_date': datetime.utcnow(),
                'priority': 'high',
                'notes': 'Auto-created due to snow forecast',
                'created_at': datetime.utcnow(),
            })
            dispatches_created.append(str(dispatch.inserted_id))
        
        return dispatches_created


class SafetyComplianceWorkflow:
    """
    Workflow 6: Safety & Compliance Automation
    Handles automated safety reminders and compliance tracking
    """
    
    def __init__(self, db):
        self.db = db
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute safety compliance workflow"""
        # Daily safety check reminders
        results = {
            'daily_reminders_sent': 0,
            'ppe_verifications_required': 0,
            'training_expiries_flagged': 0,
        }
        
        # Send daily safety check reminders to all active crews
        crews = await self.db.users.find({'role': 'crew', 'active': True}).to_list(length=1000)
        
        for crew in crews:
            await self._send_daily_safety_reminder(crew)
            results['daily_reminders_sent'] += 1
        
        # Check training expiries
        expiring_training = await self._check_training_expiries()
        results['training_expiries_flagged'] = len(expiring_training)
        
        return results
    
    async def _send_daily_safety_reminder(self, crew: Dict):
        """Send daily safety check reminder"""
        await self.db.messages.insert_one({
            'type': 'safety_reminder',
            'priority': 'high',
            'subject': 'Daily Safety Check Required',
            'message': 'Please complete your daily safety check form before starting work.',
            'crew_id': str(crew['_id']),
            'status': 'pending',
            'created_at': datetime.utcnow(),
        })
    
    async def _check_training_expiries(self) -> List[Dict]:
        """Check for expiring training certifications"""
        # This would check training records and flag expiries
        # Placeholder implementation
        return []


class InventoryManagementWorkflow:
    """
    Workflow 7: Inventory & Consumables Automation
    Handles automated inventory tracking and reordering
    """
    
    def __init__(self, db):
        self.db = db
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute inventory management workflow"""
        results = {
            'low_stock_items': [],
            'purchase_orders_created': [],
            'alerts_sent': 0,
        }
        
        # Check all consumables for low stock
        consumables = await self.db.consumables.find({'active': True}).to_list(length=1000)
        
        for consumable in consumables:
            current_stock = consumable.get('quantity_in_stock', 0)
            reorder_level = consumable.get('reorder_level', 10)
            
            if current_stock <= reorder_level:
                results['low_stock_items'].append({
                    'consumable_id': str(consumable['_id']),
                    'name': consumable.get('name'),
                    'current_stock': current_stock,
                    'reorder_level': reorder_level,
                })
                
                # Auto-generate purchase order if below critical level
                if current_stock < reorder_level * 0.5:
                    po_id = await self._create_purchase_order(consumable)
                    results['purchase_orders_created'].append(po_id)
                
                # Send alert
                await self._send_low_stock_alert(consumable)
                results['alerts_sent'] += 1
        
        return results
    
    async def _create_purchase_order(self, consumable: Dict) -> str:
        """Auto-create purchase order for low stock item"""
        reorder_quantity = consumable.get('reorder_quantity', 50)
        
        po = await self.db.purchase_orders.insert_one({
            'consumable_id': str(consumable['_id']),
            'quantity': reorder_quantity,
            'status': 'pending_approval',
            'notes': 'Auto-generated - critical stock level',
            'created_at': datetime.utcnow(),
        })
        
        return str(po.inserted_id)
    
    async def _send_low_stock_alert(self, consumable: Dict):
        """Send low stock alert to admin"""
        await self.db.messages.insert_one({
            'type': 'low_stock_alert',
            'priority': 'high',
            'subject': f'Low Stock: {consumable.get("name")}',
            'message': f'Current stock: {consumable.get("quantity_in_stock", 0)} units',
            'consumable_id': str(consumable['_id']),
            'status': 'pending',
            'recipient_role': 'admin',
            'created_at': datetime.utcnow(),
        })
