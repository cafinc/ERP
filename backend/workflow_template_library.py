"""
Enterprise Workflow Templates Library
Pre-built, production-ready workflow templates for common business scenarios
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class WorkflowTemplateLibrary:
    """
    Curated library of enterprise workflow templates
    """
    
    def __init__(self, db):
        self.db = db
        
    def get_all_templates(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all workflow templates, optionally filtered by category"""
        templates = self._get_template_definitions()
        
        if category:
            templates = [t for t in templates if category in t.get('categories', [])]
        
        return templates
    
    def get_template_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific template by ID"""
        templates = self._get_template_definitions()
        for template in templates:
            if template['id'] == template_id:
                return template
        return None
    
    async def instantiate_template(
        self, 
        template_id: str, 
        customizations: Dict[str, Any],
        created_by: str
    ) -> Dict[str, Any]:
        """
        Create a new workflow from a template with customizations
        
        Args:
            template_id: ID of the template
            customizations: Custom values (name, description, config overrides)
            created_by: User ID creating the workflow
            
        Returns:
            Created workflow data
        """
        template = self.get_template_by_id(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Create workflow from template
        workflow_data = {
            'name': customizations.get('name', template['name']),
            'description': customizations.get('description', template['description']),
            'trigger': template['trigger'].copy(),
            'actions': template['actions'].copy(),
            'enabled': customizations.get('enabled', False),  # Start disabled by default
            'tags': template.get('tags', []) + customizations.get('tags', []),
            'created_by': created_by,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'execution_count': 0,
            'last_execution': None,
            'template_id': template_id,
            'template_version': template.get('version', '1.0')
        }
        
        # Apply customizations to trigger config
        if 'trigger_config' in customizations:
            workflow_data['trigger']['config'].update(customizations['trigger_config'])
        
        # Apply customizations to actions
        if 'action_customizations' in customizations:
            for i, action_custom in enumerate(customizations['action_customizations']):
                if i < len(workflow_data['actions']):
                    workflow_data['actions'][i]['config'].update(action_custom)
        
        # Insert into database
        from bson import ObjectId
        result = await self.db.custom_workflows.insert_one(workflow_data)
        workflow_data['id'] = str(result.inserted_id)
        
        logger.info(f"Instantiated template {template_id} as workflow {workflow_data['id']}")
        
        return workflow_data
    
    def _get_template_definitions(self) -> List[Dict[str, Any]]:
        """Get all template definitions"""
        return [
            # Customer Communication Templates
            {
                'id': 'template_customer_arrival',
                'name': 'Customer Arrival Notification',
                'description': 'Automatically notify customers when crew arrives at their site via geofence',
                'categories': ['customer_communication', 'geofence', 'notifications'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'event',
                    'event_type': 'geofence_entry'
                },
                'actions': [
                    {
                        'action_type': 'send_notification',
                        'name': 'Send In-App Notification',
                        'config': {
                            'title': 'Crew Arrived',
                            'message': 'Your snow removal crew has arrived at {{site_name}}',
                            'notification_type': 'info',
                            'priority': 'normal'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_sms',
                        'name': 'Send SMS Alert',
                        'config': {
                            'phone': '{{customer_phone}}',
                            'message': 'Your crew has arrived at {{site_name}}! Service will begin shortly.'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['customer', 'geofence', 'notification', 'real-time']
            },
            {
                'id': 'template_service_complete',
                'name': 'Service Completion Workflow',
                'description': 'Full automation for service completion: deduct consumables, create invoice, notify customer',
                'categories': ['service_automation', 'invoicing', 'inventory'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'event',
                    'event_type': 'dispatch_completed'
                },
                'actions': [
                    {
                        'action_type': 'deduct_consumables',
                        'name': 'Deduct Salt Used',
                        'config': {
                            'consumable_id': '{{salt_consumable_id}}',
                            'quantity': '{{quantity_used}}'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'create_invoice',
                        'name': 'Generate Invoice',
                        'config': {
                            'customer_id': '{{customer_id}}',
                            'subtotal': '{{service_cost}}',
                            'tax': '{{tax_amount}}',
                            'total': '{{total_amount}}',
                            'line_items': []
                        },
                        'order': 2,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_email',
                        'name': 'Email Invoice to Customer',
                        'config': {
                            'to_email': '{{customer_email}}',
                            'subject': 'Service Complete - Invoice #{{invoice_number}}',
                            'body': 'Thank you for using our services! Your invoice is attached.'
                        },
                        'order': 3,
                        'enabled': True
                    }
                ],
                'tags': ['service', 'invoice', 'completion', 'automation']
            },
            
            # Equipment & Safety Templates
            {
                'id': 'template_daily_equipment_check',
                'name': 'Daily Equipment Safety Check',
                'description': 'Send daily reminder to crew for equipment inspection',
                'categories': ['equipment', 'safety', 'compliance'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'scheduled',
                    'config': {'schedule': '0 7 * * *'}  # 7 AM daily
                },
                'actions': [
                    {
                        'action_type': 'send_notification',
                        'name': 'Send Equipment Check Reminder',
                        'config': {
                            'title': 'Daily Equipment Check Required',
                            'message': 'Please complete your daily equipment safety inspection before starting work.',
                            'priority': 'high',
                            'recipient_role': 'crew'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'create_task',
                        'name': 'Create Inspection Task',
                        'config': {
                            'title': 'Daily Equipment Inspection',
                            'description': 'Complete safety checklist for all equipment',
                            'priority': 'high',
                            'due_date': '{{today}}'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['equipment', 'safety', 'scheduled', 'daily']
            },
            {
                'id': 'template_equipment_inspection_due',
                'name': 'Equipment Inspection Alert',
                'description': 'Alert when equipment inspection is due based on hours or date',
                'categories': ['equipment', 'maintenance', 'compliance'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'event',
                    'event_type': 'equipment_inspection_due'
                },
                'actions': [
                    {
                        'action_type': 'send_notification',
                        'name': 'Notify Maintenance Team',
                        'config': {
                            'title': 'Equipment Inspection Due',
                            'message': '{{equipment_name}} requires inspection',
                            'priority': 'high',
                            'recipient_role': 'admin'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'update_equipment',
                        'name': 'Update Equipment Status',
                        'config': {
                            'equipment_id': '{{equipment_id}}',
                            'status': 'inspection_due'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['equipment', 'inspection', 'maintenance', 'compliance']
            },
            
            # Inventory Management Templates
            {
                'id': 'template_low_stock_alert',
                'name': 'Low Stock Alert & Auto-Reorder',
                'description': 'Alert admins when stock is low and optionally create purchase order',
                'categories': ['inventory', 'procurement', 'alerts'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'event',
                    'event_type': 'stock_below_threshold'
                },
                'actions': [
                    {
                        'action_type': 'send_notification',
                        'name': 'Alert Admin of Low Stock',
                        'config': {
                            'title': 'Low Stock Alert',
                            'message': '{{item_name}} is running low. Current: {{current_stock}}, Threshold: {{threshold}}',
                            'priority': 'high',
                            'recipient_role': 'admin'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_email',
                        'name': 'Email Procurement Team',
                        'config': {
                            'to_email': 'procurement@company.com',
                            'subject': 'Reorder Required: {{item_name}}',
                            'body': 'Stock level for {{item_name}} has fallen below threshold. Current: {{current_stock}}, Reorder level: {{reorder_level}}'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['inventory', 'stock', 'procurement', 'alerts']
            },
            
            # Weather-Based Templates
            {
                'id': 'template_weather_alert',
                'name': 'Weather Alert & Crew Mobilization',
                'description': 'Alert crew and prepare for incoming weather event',
                'categories': ['weather', 'dispatch', 'alerts'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'event',
                    'event_type': 'weather_alert_received'
                },
                'actions': [
                    {
                        'action_type': 'send_notification',
                        'name': 'Alert All Crew',
                        'config': {
                            'title': 'Weather Alert: {{alert_type}}',
                            'message': 'Potential snow event in {{hours}} hours. Be ready for dispatch.',
                            'priority': 'high',
                            'recipient_role': 'crew'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_sms',
                        'name': 'SMS to On-Call Crew',
                        'config': {
                            'phone': '{{crew_phone}}',
                            'message': 'WEATHER ALERT: {{alert_type}} expected in {{hours}}h. Stand by for dispatch.'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['weather', 'crew', 'dispatch', 'alerts']
            },
            
            # Project Management Templates
            {
                'id': 'template_project_kickoff',
                'name': 'Project Kickoff Automation',
                'description': 'Automate project start: create tasks, notify team, send welcome email',
                'categories': ['project_management', 'team_coordination'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'event',
                    'event_type': 'project_started'
                },
                'actions': [
                    {
                        'action_type': 'create_task',
                        'name': 'Create Initial Site Survey Task',
                        'config': {
                            'title': 'Conduct Site Survey',
                            'description': 'Initial site assessment for {{project_name}}',
                            'assigned_to': '{{project_manager_id}}',
                            'priority': 'high'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_email',
                        'name': 'Send Customer Welcome Email',
                        'config': {
                            'to_email': '{{customer_email}}',
                            'subject': 'Welcome to {{project_name}}',
                            'body': 'Thank you for choosing our services. Your project manager will contact you shortly.'
                        },
                        'order': 2,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_notification',
                        'name': 'Notify Team',
                        'config': {
                            'title': 'New Project Started',
                            'message': '{{project_name}} has been initiated',
                            'recipient_role': 'admin'
                        },
                        'order': 3,
                        'enabled': True
                    }
                ],
                'tags': ['project', 'kickoff', 'team', 'customer']
            },
            
            # Financial Templates
            {
                'id': 'template_invoice_overdue',
                'name': 'Overdue Invoice Reminder',
                'description': 'Automatically send reminders for overdue invoices',
                'categories': ['finance', 'collections', 'customer_communication'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'scheduled',
                    'config': {'schedule': '0 9 * * *'}  # 9 AM daily
                },
                'actions': [
                    {
                        'action_type': 'send_email',
                        'name': 'Send Overdue Notice',
                        'config': {
                            'to_email': '{{customer_email}}',
                            'subject': 'Payment Reminder - Invoice #{{invoice_number}}',
                            'body': 'This is a friendly reminder that Invoice #{{invoice_number}} for ${{amount}} is now {{days_overdue}} days overdue.'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_notification',
                        'name': 'Notify Accounting',
                        'config': {
                            'title': 'Overdue Invoice Alert',
                            'message': 'Invoice #{{invoice_number}} is {{days_overdue}} days overdue',
                            'recipient_role': 'admin'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['finance', 'collections', 'invoices', 'scheduled']
            },
            
            # Integration Templates
            {
                'id': 'template_webhook_integration',
                'name': 'External System Webhook Handler',
                'description': 'Process webhooks from external systems and trigger internal workflows',
                'categories': ['integration', 'webhooks', 'automation'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'webhook',
                    'config': {
                        'webhook_id': 'external_system',
                        'webhook_secret': ''
                    }
                },
                'actions': [
                    {
                        'action_type': 'send_notification',
                        'name': 'Log Webhook Receipt',
                        'config': {
                            'title': 'Webhook Received',
                            'message': 'Received webhook from external system',
                            'recipient_role': 'admin'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'call_webhook',
                        'name': 'Forward to Internal API',
                        'config': {
                            'url': 'https://internal-api.company.com/process',
                            'method': 'POST',
                            'payload': {}
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['integration', 'webhook', 'external']
            },
            
            # Compliance Templates
            {
                'id': 'template_compliance_audit',
                'name': 'Weekly Compliance Audit Report',
                'description': 'Generate and email weekly compliance report to management',
                'categories': ['compliance', 'reporting', 'management'],
                'version': '1.0',
                'trigger': {
                    'trigger_type': 'scheduled',
                    'config': {'schedule': '0 8 * * 1'}  # Monday 8 AM
                },
                'actions': [
                    {
                        'action_type': 'send_email',
                        'name': 'Send Compliance Report',
                        'config': {
                            'to_email': 'management@company.com',
                            'subject': 'Weekly Compliance Report - {{week_of}}',
                            'body': 'Please find attached the weekly compliance report for your review.'
                        },
                        'order': 1,
                        'enabled': True
                    },
                    {
                        'action_type': 'send_notification',
                        'name': 'Notify Admin',
                        'config': {
                            'title': 'Compliance Report Sent',
                            'message': 'Weekly compliance report has been sent to management',
                            'recipient_role': 'admin'
                        },
                        'order': 2,
                        'enabled': True
                    }
                ],
                'tags': ['compliance', 'reporting', 'weekly', 'management']
            }
        ]
    
    def get_template_categories(self) -> List[str]:
        """Get list of all template categories"""
        templates = self._get_template_definitions()
        categories = set()
        for template in templates:
            categories.update(template.get('categories', []))
        return sorted(list(categories))
    
    def search_templates(self, query: str) -> List[Dict[str, Any]]:
        """Search templates by name, description, or tags"""
        query_lower = query.lower()
        templates = self._get_template_definitions()
        
        results = []
        for template in templates:
            if (query_lower in template['name'].lower() or
                query_lower in template['description'].lower() or
                any(query_lower in tag.lower() for tag in template.get('tags', []))):
                results.append(template)
        
        return results
