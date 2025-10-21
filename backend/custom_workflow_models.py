"""
Custom Workflow Builder Models and Storage
Allows users to create, edit, and delete custom automation workflows
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class TriggerType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    EVENT = "event"
    WEBHOOK = "webhook"

class ActionType(str, Enum):
    SEND_NOTIFICATION = "send_notification"
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    UPDATE_DISPATCH = "update_dispatch"
    CREATE_INVOICE = "create_invoice"
    DEDUCT_CONSUMABLES = "deduct_consumables"
    UPDATE_EQUIPMENT = "update_equipment"
    CREATE_TASK = "create_task"
    CALL_WEBHOOK = "call_webhook"
    CONDITIONAL = "conditional"
    DELAY = "delay"

class WorkflowAction(BaseModel):
    action_type: ActionType
    name: str
    config: Dict[str, Any] = {}
    order: int
    enabled: bool = True

class WorkflowTrigger(BaseModel):
    trigger_type: TriggerType
    config: Dict[str, Any] = {}
    # For scheduled: {"schedule": "0 6 * * *"} (cron format)
    # For event: {"event": "dispatch_completed", "filters": {...}}
    # For webhook: {"webhook_id": "..."}

class CustomWorkflow(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    trigger: WorkflowTrigger
    actions: List[WorkflowAction]
    enabled: bool = True
    created_by: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    execution_count: int = 0
    last_execution: Optional[datetime] = None
    tags: List[str] = []

class CustomWorkflowCreate(BaseModel):
    name: str
    description: str
    trigger: WorkflowTrigger
    actions: List[WorkflowAction]
    enabled: bool = True
    tags: List[str] = []

class CustomWorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[WorkflowTrigger] = None
    actions: Optional[List[WorkflowAction]] = None
    enabled: Optional[bool] = None
    tags: Optional[List[str]] = None

class WorkflowExecution(BaseModel):
    workflow_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str  # 'running', 'success', 'failed'
    actions_completed: List[str] = []
    actions_failed: List[str] = []
    error: Optional[str] = None
    context: Dict[str, Any] = {}

class WorkflowExecutionLog(BaseModel):
    id: Optional[str] = None
    workflow_id: str
    workflow_name: str
    execution: WorkflowExecution
    created_at: datetime
