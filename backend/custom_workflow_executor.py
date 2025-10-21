"""
Custom Workflow Executor
Executes user-defined custom workflows with action steps
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from bson import ObjectId
import logging
import asyncio
from custom_workflow_models import (
    CustomWorkflow, WorkflowAction, WorkflowExecution, 
    ActionType, WorkflowExecutionLog
)

logger = logging.getLogger(__name__)

class CustomWorkflowExecutor:
    """Executes custom user-defined workflows"""
    
    def __init__(self, db):
        self.db = db
    
    async def execute_workflow(self, workflow: CustomWorkflow, context: Dict[str, Any] = None) -> WorkflowExecution:
        """
        Execute a custom workflow with its action steps
        
        Args:
            workflow: The workflow to execute
            context: Execution context data
            
        Returns:
            WorkflowExecution with results
        """
        if context is None:
            context = {}
        
        execution = WorkflowExecution(
            workflow_id=workflow.id or "",
            started_at=datetime.utcnow(),
            status='running',
            context=context
        )
        
        logger.info(f"Starting execution of custom workflow: {workflow.name}")
        
        try:
            # Execute actions in order
            sorted_actions = sorted(workflow.actions, key=lambda a: a.order)
            
            for action in sorted_actions:
                if not action.enabled:
                    logger.info(f"Skipping disabled action: {action.name}")
                    continue
                
                try:
                    logger.info(f"Executing action: {action.name} ({action.action_type})")
                    await self._execute_action(action, context)
                    execution.actions_completed.append(action.name)
                    
                except Exception as e:
                    logger.error(f"Error executing action '{action.name}': {str(e)}")
                    execution.actions_failed.append(action.name)
                    # Continue with other actions even if one fails
            
            execution.status = 'success'
            execution.completed_at = datetime.utcnow()
            
            # Update workflow execution count
            await self.db.custom_workflows.update_one(
                {'_id': ObjectId(workflow.id)},
                {
                    '$inc': {'execution_count': 1},
                    '$set': {'last_execution': datetime.utcnow()}
                }
            )
            
        except Exception as e:
            execution.status = 'failed'
            execution.error = str(e)
            execution.completed_at = datetime.utcnow()
            logger.error(f"Workflow execution failed: {str(e)}")
        
        # Log execution
        await self._log_execution(workflow, execution)
        
        return execution
    
    async def _execute_action(self, action: WorkflowAction, context: Dict[str, Any]):
        """Execute a single action based on its type"""
        
        if action.action_type == ActionType.SEND_NOTIFICATION:
            await self._action_send_notification(action, context)
        
        elif action.action_type == ActionType.SEND_EMAIL:
            await self._action_send_email(action, context)
        
        elif action.action_type == ActionType.SEND_SMS:
            await self._action_send_sms(action, context)
        
        elif action.action_type == ActionType.UPDATE_DISPATCH:
            await self._action_update_dispatch(action, context)
        
        elif action.action_type == ActionType.CREATE_INVOICE:
            await self._action_create_invoice(action, context)
        
        elif action.action_type == ActionType.DEDUCT_CONSUMABLES:
            await self._action_deduct_consumables(action, context)
        
        elif action.action_type == ActionType.UPDATE_EQUIPMENT:
            await self._action_update_equipment(action, context)
        
        elif action.action_type == ActionType.CREATE_TASK:
            await self._action_create_task(action, context)
        
        elif action.action_type == ActionType.CALL_WEBHOOK:
            await self._action_call_webhook(action, context)
        
        elif action.action_type == ActionType.DELAY:
            await self._action_delay(action, context)
        
        else:
            logger.warning(f"Unknown action type: {action.action_type}")
    
    async def _action_send_notification(self, action: WorkflowAction, context: Dict):
        """Send in-app notification"""
        config = action.config
        
        notification = {
            'type': config.get('notification_type', 'info'),
            'title': self._replace_variables(config.get('title', 'Notification'), context),
            'message': self._replace_variables(config.get('message', ''), context),
            'priority': config.get('priority', 'normal'),
            'created_at': datetime.utcnow(),
            'read': False,
        }
        
        # Add recipient
        if config.get('recipient_id'):
            notification['user_id'] = config['recipient_id']
        elif config.get('recipient_role'):
            notification['recipient_role'] = config['recipient_role']
        
        await self.db.notifications.insert_one(notification)
        logger.info(f"Notification sent: {notification['title']}")
    
    async def _action_send_email(self, action: WorkflowAction, context: Dict):
        """Send email (queued for email service)"""
        config = action.config
        
        email = {
            'to': config.get('to_email'),
            'subject': self._replace_variables(config.get('subject', ''), context),
            'body': self._replace_variables(config.get('body', ''), context),
            'status': 'queued',
            'created_at': datetime.utcnow(),
        }
        
        await self.db.email_queue.insert_one(email)
        logger.info(f"Email queued to: {email['to']}")
    
    async def _action_send_sms(self, action: WorkflowAction, context: Dict):
        """Send SMS (queued for SMS service)"""
        config = action.config
        
        sms = {
            'phone': config.get('phone'),
            'message': self._replace_variables(config.get('message', ''), context),
            'status': 'queued',
            'created_at': datetime.utcnow(),
        }
        
        await self.db.sms_queue.insert_one(sms)
        logger.info(f"SMS queued to: {sms['phone']}")
    
    async def _action_update_dispatch(self, action: WorkflowAction, context: Dict):
        """Update dispatch status or fields"""
        config = action.config
        dispatch_id = context.get('dispatch_id') or config.get('dispatch_id')
        
        if not dispatch_id:
            logger.warning("No dispatch_id provided for update")
            return
        
        update_data = {}
        if config.get('status'):
            update_data['status'] = config['status']
        if config.get('priority'):
            update_data['priority'] = config['priority']
        if config.get('notes'):
            update_data['notes'] = self._replace_variables(config['notes'], context)
        
        if update_data:
            await self.db.dispatches.update_one(
                {'_id': ObjectId(dispatch_id)},
                {'$set': update_data}
            )
            logger.info(f"Dispatch {dispatch_id} updated: {update_data}")
    
    async def _action_create_invoice(self, action: WorkflowAction, context: Dict):
        """Create an invoice"""
        config = action.config
        
        invoice = {
            'customer_id': context.get('customer_id') or config.get('customer_id'),
            'dispatch_id': context.get('dispatch_id'),
            'status': 'draft',
            'subtotal': config.get('subtotal', 0),
            'tax': config.get('tax', 0),
            'total': config.get('total', 0),
            'line_items': config.get('line_items', []),
            'created_at': datetime.utcnow(),
        }
        
        result = await self.db.invoices.insert_one(invoice)
        logger.info(f"Invoice created: {result.inserted_id}")
        context['invoice_id'] = str(result.inserted_id)
    
    async def _action_deduct_consumables(self, action: WorkflowAction, context: Dict):
        """Deduct consumables from inventory"""
        config = action.config
        
        consumable_id = config.get('consumable_id')
        quantity = config.get('quantity', 1)
        
        if not consumable_id:
            logger.warning("No consumable_id provided for deduction")
            return
        
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
                'consumable_id': consumable_id,
                'quantity_used': quantity,
                'used_at': datetime.utcnow(),
                'auto_deducted': True,
                'workflow_triggered': True,
            })
            
            logger.info(f"Consumable {consumable_id} deducted: {quantity}")
    
    async def _action_update_equipment(self, action: WorkflowAction, context: Dict):
        """Update equipment hours or status"""
        config = action.config
        
        equipment_id = config.get('equipment_id')
        if not equipment_id:
            logger.warning("No equipment_id provided for update")
            return
        
        update_data = {}
        if config.get('hours_to_add'):
            update_data['$inc'] = {'hours_used': config['hours_to_add']}
        if config.get('status'):
            update_data['$set'] = {'status': config['status']}
        
        if update_data:
            await self.db.equipment.update_one(
                {'_id': ObjectId(equipment_id)},
                update_data
            )
            logger.info(f"Equipment {equipment_id} updated")
    
    async def _action_create_task(self, action: WorkflowAction, context: Dict):
        """Create a task"""
        config = action.config
        
        task = {
            'title': self._replace_variables(config.get('title', 'Task'), context),
            'description': self._replace_variables(config.get('description', ''), context),
            'assigned_to': config.get('assigned_to'),
            'due_date': config.get('due_date'),
            'priority': config.get('priority', 'medium'),
            'status': 'pending',
            'created_at': datetime.utcnow(),
        }
        
        result = await self.db.tasks.insert_one(task)
        logger.info(f"Task created: {result.inserted_id}")
    
    async def _action_call_webhook(self, action: WorkflowAction, context: Dict):
        """Call external webhook"""
        import aiohttp
        
        config = action.config
        url = config.get('url')
        method = config.get('method', 'POST')
        
        if not url:
            logger.warning("No webhook URL provided")
            return
        
        # Prepare payload
        payload = config.get('payload', {})
        # Replace variables in payload
        payload_str = str(payload)
        payload_str = self._replace_variables(payload_str, context)
        
        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, json=payload) as response:
                logger.info(f"Webhook called: {url}, status: {response.status}")
    
    async def _action_delay(self, action: WorkflowAction, context: Dict):
        """Delay execution"""
        config = action.config
        seconds = config.get('seconds', 1)
        
        logger.info(f"Delaying for {seconds} seconds")
        await asyncio.sleep(seconds)
    
    def _replace_variables(self, text: str, context: Dict[str, Any]) -> str:
        """Replace {{variable}} placeholders with context values"""
        if not isinstance(text, str):
            return text
        
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            if placeholder in text:
                text = text.replace(placeholder, str(value))
        
        return text
    
    async def _log_execution(self, workflow: CustomWorkflow, execution: WorkflowExecution):
        """Log workflow execution to database"""
        log = WorkflowExecutionLog(
            workflow_id=workflow.id or "",
            workflow_name=workflow.name,
            execution=execution,
            created_at=datetime.utcnow()
        )
        
        await self.db.workflow_execution_logs.insert_one(log.dict())
