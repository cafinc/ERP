#!/usr/bin/env python3
"""
Task Integration Service
Automatically creates tasks when work orders, estimates, invoices, and forms are assigned
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

from task_models import TaskCreate, TaskType, TaskPriority
from notification_service import notification_service

load_dotenv()

logger = logging.getLogger(__name__)

class TaskIntegrationService:
    """Service for integrating tasks with other modules"""
    
    def __init__(self):
        self.mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        self.db_name = os.getenv("DB_NAME", "snow_removal_db")
        self.client = AsyncIOMotorClient(self.mongo_url)
        self.db = self.client[self.db_name]
        self.tasks_collection = self.db["tasks"]
        
    async def create_work_order_task(
        self,
        work_order_id: str,
        work_order_title: str,
        work_order_description: str,
        assigned_to: List[str],
        assigned_by: str,
        assigned_by_name: str,
        priority: str = "medium",
        scheduled_date: Optional[datetime] = None
    ) -> str:
        """Create a task when a work order is assigned"""
        try:
            task_dict = {
                "title": f"Complete Work Order: {work_order_title}",
                "description": work_order_description or f"Complete the assigned work order: {work_order_title}",
                "type": TaskType.WORK_ORDER,
                "related_id": work_order_id,
                "related_type": "work_order",
                "assigned_to": assigned_to,
                "assigned_by": assigned_by,
                "assigned_by_name": assigned_by_name,
                "priority": priority,
                "status": "pending",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "watchers": list(set(assigned_to + [assigned_by])),
                "tags": ["work_order", "field_work"],
            }
            
            if scheduled_date:
                task_dict["due_date"] = scheduled_date
                task_dict["start_date"] = scheduled_date
            
            result = await self.tasks_collection.insert_one(task_dict)
            task_id = str(result.inserted_id)
            
            # Send notifications
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_dict["title"],
                assigned_to=assigned_to,
                assigned_by_name=assigned_by_name,
                task_priority=priority
            )
            
            logger.info(f"Created work order task {task_id} for work order {work_order_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Error creating work order task: {e}")
            raise
    
    async def create_estimate_review_task(
        self,
        estimate_id: str,
        estimate_number: str,
        customer_id: str,
        customer_name: str,
        created_by: str,
        created_by_name: str,
        amount: float,
        due_date: Optional[datetime] = None
    ) -> str:
        """Create a task when an estimate is sent to customer for review"""
        try:
            if not due_date:
                due_date = datetime.now() + timedelta(days=7)  # Default 7 days to review
            
            task_dict = {
                "title": f"Review Estimate #{estimate_number}",
                "description": f"Please review and approve the estimate for ${amount:,.2f}. If you have any questions, please contact us.",
                "type": TaskType.ESTIMATE,
                "related_id": estimate_id,
                "related_type": "estimate",
                "assigned_to": [customer_id],
                "assigned_by": created_by,
                "assigned_by_name": created_by_name,
                "priority": TaskPriority.MEDIUM,
                "status": "pending",
                "due_date": due_date,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "watchers": [customer_id, created_by],
                "tags": ["estimate", "customer_action", "review"],
            }
            
            result = await self.tasks_collection.insert_one(task_dict)
            task_id = str(result.inserted_id)
            
            # Send notification
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_dict["title"],
                assigned_to=[customer_id],
                assigned_by_name=created_by_name,
                task_priority=TaskPriority.MEDIUM
            )
            
            logger.info(f"Created estimate review task {task_id} for estimate {estimate_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Error creating estimate review task: {e}")
            raise
    
    async def create_invoice_payment_task(
        self,
        invoice_id: str,
        invoice_number: str,
        customer_id: str,
        customer_name: str,
        created_by: str,
        created_by_name: str,
        amount: float,
        due_date: Optional[datetime] = None
    ) -> str:
        """Create a task when an invoice needs to be paid"""
        try:
            if not due_date:
                due_date = datetime.now() + timedelta(days=30)  # Default 30 days net
            
            # Determine priority based on due date
            days_until_due = (due_date - datetime.now()).days
            if days_until_due <= 7:
                priority = TaskPriority.HIGH
            elif days_until_due <= 14:
                priority = TaskPriority.MEDIUM
            else:
                priority = TaskPriority.LOW
            
            task_dict = {
                "title": f"Pay Invoice #{invoice_number}",
                "description": f"Invoice amount: ${amount:,.2f}. Payment is due by {due_date.strftime('%B %d, %Y')}.",
                "type": TaskType.INVOICE,
                "related_id": invoice_id,
                "related_type": "invoice",
                "assigned_to": [customer_id],
                "assigned_by": created_by,
                "assigned_by_name": created_by_name,
                "priority": priority,
                "status": "pending",
                "due_date": due_date,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "watchers": [customer_id, created_by],
                "tags": ["invoice", "payment", "customer_action"],
            }
            
            result = await self.tasks_collection.insert_one(task_dict)
            task_id = str(result.inserted_id)
            
            # Send notification
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_dict["title"],
                assigned_to=[customer_id],
                assigned_by_name=created_by_name,
                task_priority=priority
            )
            
            logger.info(f"Created invoice payment task {task_id} for invoice {invoice_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Error creating invoice payment task: {e}")
            raise
    
    async def create_form_completion_task(
        self,
        form_id: str,
        form_name: str,
        form_description: str,
        assigned_to: List[str],
        assigned_by: str,
        assigned_by_name: str,
        priority: str = "medium",
        due_date: Optional[datetime] = None
    ) -> str:
        """Create a task when a form needs to be completed"""
        try:
            if not due_date:
                due_date = datetime.now() + timedelta(days=3)  # Default 3 days
            
            task_dict = {
                "title": f"Complete Form: {form_name}",
                "description": form_description or f"Please complete the required form: {form_name}",
                "type": TaskType.FORM,
                "related_id": form_id,
                "related_type": "form",
                "assigned_to": assigned_to,
                "assigned_by": assigned_by,
                "assigned_by_name": assigned_by_name,
                "priority": priority,
                "status": "pending",
                "due_date": due_date,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "watchers": list(set(assigned_to + [assigned_by])),
                "tags": ["form", "required", "compliance"],
            }
            
            result = await self.tasks_collection.insert_one(task_dict)
            task_id = str(result.inserted_id)
            
            # Send notifications
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_dict["title"],
                assigned_to=assigned_to,
                assigned_by_name=assigned_by_name,
                task_priority=priority
            )
            
            logger.info(f"Created form completion task {task_id} for form {form_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Error creating form completion task: {e}")
            raise
    
    async def create_project_task(
        self,
        project_id: str,
        project_name: str,
        task_title: str,
        task_description: str,
        assigned_to: List[str],
        assigned_by: str,
        assigned_by_name: str,
        priority: str = "medium",
        due_date: Optional[datetime] = None
    ) -> str:
        """Create a task within a project"""
        try:
            task_dict = {
                "title": task_title,
                "description": task_description,
                "type": TaskType.PROJECT,
                "related_id": project_id,
                "related_type": "project",
                "assigned_to": assigned_to,
                "assigned_by": assigned_by,
                "assigned_by_name": assigned_by_name,
                "priority": priority,
                "status": "pending",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "watchers": list(set(assigned_to + [assigned_by])),
                "tags": ["project", project_name],
            }
            
            if due_date:
                task_dict["due_date"] = due_date
            
            result = await self.tasks_collection.insert_one(task_dict)
            task_id = str(result.inserted_id)
            
            # Send notifications
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_dict["title"],
                assigned_to=assigned_to,
                assigned_by_name=assigned_by_name,
                task_priority=priority
            )
            
            logger.info(f"Created project task {task_id} for project {project_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Error creating project task: {e}")
            raise
    
    async def create_maintenance_task(
        self,
        equipment_id: str,
        equipment_name: str,
        maintenance_type: str,
        maintenance_description: str,
        assigned_to: List[str],
        assigned_by: str,
        assigned_by_name: str,
        priority: str = "medium",
        due_date: Optional[datetime] = None
    ) -> str:
        """Create a task for equipment maintenance"""
        try:
            task_dict = {
                "title": f"{maintenance_type}: {equipment_name}",
                "description": maintenance_description,
                "type": TaskType.MAINTENANCE,
                "related_id": equipment_id,
                "related_type": "equipment",
                "assigned_to": assigned_to,
                "assigned_by": assigned_by,
                "assigned_by_name": assigned_by_name,
                "priority": priority,
                "status": "pending",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "watchers": list(set(assigned_to + [assigned_by])),
                "tags": ["maintenance", "equipment", maintenance_type.lower()],
            }
            
            if due_date:
                task_dict["due_date"] = due_date
            
            result = await self.tasks_collection.insert_one(task_dict)
            task_id = str(result.inserted_id)
            
            # Send notifications
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_dict["title"],
                assigned_to=assigned_to,
                assigned_by_name=assigned_by_name,
                task_priority=priority
            )
            
            logger.info(f"Created maintenance task {task_id} for equipment {equipment_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Error creating maintenance task: {e}")
            raise
    
    async def update_task_on_completion(
        self,
        related_type: str,
        related_id: str,
        completed_by: str,
        completed_by_name: str,
        completion_notes: Optional[str] = None
    ) -> bool:
        """
        Mark related task as completed when the source item is completed
        (e.g., work order completed, invoice paid, form submitted)
        """
        try:
            # Find the task
            task = await self.tasks_collection.find_one({
                "related_type": related_type,
                "related_id": related_id,
                "status": {"$ne": "completed"}
            })
            
            if not task:
                logger.info(f"No active task found for {related_type} {related_id}")
                return False
            
            # Update task to completed
            update_data = {
                "status": "completed",
                "completed_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            
            if completion_notes:
                update_data["completion_notes"] = completion_notes
            
            await self.tasks_collection.update_one(
                {"_id": task["_id"]},
                {"$set": update_data}
            )
            
            # Send completion notification
            await notification_service.notify_task_completion(
                task_id=str(task["_id"]),
                task_title=task["title"],
                completed_by_name=completed_by_name,
                watchers=task.get("watchers", [])
            )
            
            logger.info(f"Marked task {task['_id']} as completed for {related_type} {related_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating task on completion: {e}")
            return False

# Global instance
task_integration_service = TaskIntegrationService()
