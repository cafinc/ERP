"""
Event Emitter System for Workflow Automation
Allows various parts of the application to emit events that trigger custom workflows
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class EventEmitter:
    """
    Centralized event emitter that triggers custom workflows based on system events
    """
    
    def __init__(self, db, custom_workflow_executor):
        self.db = db
        self.custom_workflow_executor = custom_workflow_executor
        
    async def emit(self, event_type: str, context: Dict[str, Any]):
        """
        Emit an event and trigger all workflows listening for that event type
        
        Args:
            event_type: The type of event (e.g., 'dispatch_completed', 'invoice_sent')
            context: Context data to pass to the workflow execution
        """
        try:
            logger.info(f"Event emitted: {event_type}")
            
            # Find all enabled workflows with event trigger matching this event type
            workflows = await self.db.custom_workflows.find({
                'enabled': True,
                'trigger.trigger_type': 'event',
                'trigger.event_type': event_type
            }).to_list(length=100)
            
            if not workflows:
                logger.debug(f"No workflows listening for event: {event_type}")
                return
            
            logger.info(f"Found {len(workflows)} workflow(s) listening for event: {event_type}")
            
            # Execute each matching workflow
            for workflow in workflows:
                try:
                    workflow_id = str(workflow['_id'])
                    workflow_name = workflow.get('name', 'Unnamed Workflow')
                    
                    logger.info(f"Triggering workflow '{workflow_name}' (ID: {workflow_id}) for event: {event_type}")
                    
                    # Add event metadata to context
                    execution_context = {
                        **context,
                        'trigger_type': 'event',
                        'event_type': event_type,
                        'event_timestamp': datetime.utcnow().isoformat(),
                    }
                    
                    # Execute the workflow asynchronously
                    result = await self.custom_workflow_executor.execute(
                        workflow_id,
                        execution_context
                    )
                    
                    logger.info(f"Workflow '{workflow_name}' completed with result: {result.get('status')}")
                    
                except Exception as e:
                    logger.error(f"Error executing workflow {workflow.get('_id')} for event {event_type}: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error in event emitter for event {event_type}: {str(e)}")

# Global event emitter instance (will be initialized in server.py)
event_emitter: Optional[EventEmitter] = None

def get_event_emitter() -> Optional[EventEmitter]:
    """Get the global event emitter instance"""
    return event_emitter

def set_event_emitter(emitter: EventEmitter):
    """Set the global event emitter instance"""
    global event_emitter
    event_emitter = emitter
