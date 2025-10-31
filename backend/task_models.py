#!/usr/bin/env python3
"""
Task Assignment System Models
Comprehensive task management with notifications
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TaskType(str, Enum):
    """Types of tasks that can be created"""
    WORK_ORDER = "work_order"
    ESTIMATE = "estimate"
    INVOICE = "invoice"
    FORM = "form"
    GENERAL = "general"
    PROJECT = "project"
    MAINTENANCE = "maintenance"
    INSPECTION = "inspection"

class TaskStatus(str, Enum):
    """Task lifecycle statuses"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"
    OVERDUE = "overdue"

class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationType(str, Enum):
    """Types of notifications"""
    ASSIGNMENT = "assignment"
    UPDATE = "update"
    COMMENT = "comment"
    COMPLETION = "completion"
    REMINDER = "reminder"
    MENTION = "mention"
    STATUS_CHANGE = "status_change"

# ==================== Task Attachment ====================
class TaskAttachment(BaseModel):
    """File attachment for a task"""
    id: str
    filename: str
    url: str
    mime_type: str
    size: int
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.now)

# ==================== Task Comment ====================
class TaskComment(BaseModel):
    """Comment on a task"""
    id: Optional[str] = None
    task_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    attachments: List[TaskAttachment] = []
    mentions: List[str] = []  # List of user IDs mentioned
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    is_edited: bool = False

class TaskCommentCreate(BaseModel):
    """Create a new task comment"""
    task_id: str
    content: str
    attachments: List[Dict] = []
    mentions: List[str] = []

# ==================== Task Activity Log ====================
class TaskActivity(BaseModel):
    """Activity log entry for a task"""
    id: Optional[str] = None
    task_id: str
    user_id: str
    user_name: str
    action: str  # e.g., "created", "updated", "assigned", "completed", "commented"
    details: Dict[str, Any] = {}  # Additional details about the action
    timestamp: datetime = Field(default_factory=datetime.now)

# ==================== Main Task Model ====================
class Task(BaseModel):
    """Main task model with all features"""
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    
    # Task Classification
    type: TaskType
    related_id: Optional[str] = None  # ID of related work order, estimate, etc.
    related_type: Optional[str] = None  # Type of related object
    
    # Enhanced Relations
    site_id: Optional[str] = None
    customer_id: Optional[str] = None
    work_order_id: Optional[str] = None
    project_id: Optional[str] = None
    service_ids: List[str] = []
    form_ids: List[str] = []
    equipment_ids: List[str] = []
    
    # Assignment with notification preferences
    assigned_to: List[Dict[str, Any]] = []  # [{user_id, name, role, notify_email, notify_app}]
    assigned_by: str
    assigned_by_name: str
    
    # Status & Priority
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    
    # Dates
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    # Additional Data
    attachments: List[TaskAttachment] = []
    photos: List[Dict[str, Any]] = []  # Photo gallery with tags
    tags: List[str] = []
    checklist: List[Dict[str, Any]] = []  # Subtasks/checklist items with required flag
    
    # Metadata & Billing
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    billable: bool = True
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    invoice_id: Optional[str] = None
    completion_notes: Optional[str] = None
    
    # Time Tracking
    time_entries: List[Dict[str, Any]] = []  # [{user_id, start, end, hours, billable}]
    
    # Collaboration
    watchers: List[str] = []  # Users watching this task
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    template_id: Optional[str] = None
    
    # Activities
    activities: List[Dict[str, Any]] = []  # Activity log
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TaskCreate(BaseModel):
    """Create a new task"""
    title: str
    description: Optional[str] = None
    type: TaskType
    
    # Legacy relation fields
    related_id: Optional[str] = None
    related_type: Optional[str] = None
    
    # Enhanced relation fields
    site_id: Optional[str] = None
    customer_id: Optional[str] = None
    work_order_id: Optional[str] = None
    project_id: Optional[str] = None
    service_ids: List[str] = []
    form_ids: List[str] = []
    equipment_ids: List[str] = []
    
    # Assignment with notification preferences
    assigned_to: List[Dict[str, Any]] = []  # [{user_id, name, role, notify_email, notify_app}]
    assigned_by: str
    assigned_by_name: str
    
    priority: TaskPriority = TaskPriority.MEDIUM
    status: Optional[TaskStatus] = TaskStatus.PENDING
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    tags: List[str] = []
    
    # Checklist with required flag
    checklist: List[Dict[str, Any]] = []  # [{id, text, completed, required}]
    
    # Time & Billing
    estimated_hours: Optional[float] = None
    billable: bool = True
    
    # Recurrence
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    
    # Template
    template_id: Optional[str] = None

class TaskUpdate(BaseModel):
    """Update an existing task"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    checklist: Optional[List[Dict[str, Any]]] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    completion_notes: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None

# ==================== Task Notification ====================
class TaskNotification(BaseModel):
    """Notification for task events"""
    id: Optional[str] = None
    task_id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = {}  # Additional context data
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class NotificationUpdate(BaseModel):
    """Update notification read status"""
    read: bool = True

# ==================== Task Filters ====================
class TaskFilter(BaseModel):
    """Filter options for task queries"""
    status: Optional[List[TaskStatus]] = None
    priority: Optional[List[TaskPriority]] = None
    type: Optional[List[TaskType]] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    created_after: Optional[datetime] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None  # Search in title and description

# ==================== Task Statistics ====================
class TaskStats(BaseModel):
    """Statistics about tasks"""
    total: int
    pending: int
    in_progress: int
    completed: int
    cancelled: int
    overdue: int
    by_priority: Dict[str, int]
    by_type: Dict[str, int]
    completion_rate: float
    avg_completion_time: Optional[float] = None  # in hours

# ==================== Bulk Operations ====================
class BulkTaskAssignment(BaseModel):
    """Assign multiple tasks at once"""
    task_ids: List[str]
    assigned_to: List[str]
    notify: bool = True

class BulkTaskStatusUpdate(BaseModel):
    """Update status of multiple tasks"""
    task_ids: List[str]
    status: TaskStatus
    completion_notes: Optional[str] = None

# ==================== Task Template ====================
class TaskTemplate(BaseModel):
    """Template for creating common tasks"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: TaskType
    priority: TaskPriority = TaskPriority.MEDIUM
    tags: List[str] = []
    checklist: List[Dict[str, Any]] = []
    estimated_hours: Optional[float] = None
    default_assignees: List[str] = []
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

class TaskTemplateCreate(BaseModel):
    """Create a task template"""
    name: str
    description: Optional[str] = None
    type: TaskType
    priority: TaskPriority = TaskPriority.MEDIUM
    tags: List[str] = []
    checklist: List[Dict[str, Any]] = []
    estimated_hours: Optional[float] = None
    default_assignees: List[str] = []
