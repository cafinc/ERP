#!/usr/bin/env python3
"""
Task Integration Routes
Endpoints to integrate task creation with other modules
"""

import logging
from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from task_integration_service import task_integration_service

logger = logging.getLogger(__name__)

# Initialize router
integration_router = APIRouter(prefix="/api/integrations/tasks", tags=["task-integrations"])

# ==================== Request Models ====================

class WorkOrderTaskRequest(BaseModel):
    """Request to create task from work order"""
    work_order_id: str
    work_order_title: str
    work_order_description: Optional[str] = None
    assigned_to: List[str]
    assigned_by: str
    assigned_by_name: str
    priority: str = "medium"
    scheduled_date: Optional[datetime] = None

class EstimateTaskRequest(BaseModel):
    """Request to create task from estimate"""
    estimate_id: str
    estimate_number: str
    customer_id: str
    customer_name: str
    created_by: str
    created_by_name: str
    amount: float
    due_date: Optional[datetime] = None

class InvoiceTaskRequest(BaseModel):
    """Request to create task from invoice"""
    invoice_id: str
    invoice_number: str
    customer_id: str
    customer_name: str
    created_by: str
    created_by_name: str
    amount: float
    due_date: Optional[datetime] = None

class FormTaskRequest(BaseModel):
    """Request to create task from form"""
    form_id: str
    form_name: str
    form_description: Optional[str] = None
    assigned_to: List[str]
    assigned_by: str
    assigned_by_name: str
    priority: str = "medium"
    due_date: Optional[datetime] = None

class ProjectTaskRequest(BaseModel):
    """Request to create project task"""
    project_id: str
    project_name: str
    task_title: str
    task_description: str
    assigned_to: List[str]
    assigned_by: str
    assigned_by_name: str
    priority: str = "medium"
    due_date: Optional[datetime] = None

class MaintenanceTaskRequest(BaseModel):
    """Request to create maintenance task"""
    equipment_id: str
    equipment_name: str
    maintenance_type: str
    maintenance_description: str
    assigned_to: List[str]
    assigned_by: str
    assigned_by_name: str
    priority: str = "medium"
    due_date: Optional[datetime] = None

class CompletionRequest(BaseModel):
    """Request to mark task complete based on source completion"""
    related_type: str
    related_id: str
    completed_by: str
    completed_by_name: str
    completion_notes: Optional[str] = None

# ==================== Integration Endpoints ====================

@integration_router.post("/work-order")
async def create_work_order_task(request: WorkOrderTaskRequest):
    """
    Create a task when a work order is assigned
    Call this from your work order creation/assignment endpoint
    """
    try:
        task_id = await task_integration_service.create_work_order_task(
            work_order_id=request.work_order_id,
            work_order_title=request.work_order_title,
            work_order_description=request.work_order_description,
            assigned_to=request.assigned_to,
            assigned_by=request.assigned_by,
            assigned_by_name=request.assigned_by_name,
            priority=request.priority,
            scheduled_date=request.scheduled_date
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Work order task created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating work order task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create work order task: {str(e)}")

@integration_router.post("/estimate")
async def create_estimate_task(request: EstimateTaskRequest):
    """
    Create a task when an estimate is sent to customer
    Call this from your estimate creation endpoint
    """
    try:
        task_id = await task_integration_service.create_estimate_review_task(
            estimate_id=request.estimate_id,
            estimate_number=request.estimate_number,
            customer_id=request.customer_id,
            customer_name=request.customer_name,
            created_by=request.created_by,
            created_by_name=request.created_by_name,
            amount=request.amount,
            due_date=request.due_date
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Estimate review task created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating estimate task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create estimate task: {str(e)}")

@integration_router.post("/invoice")
async def create_invoice_task(request: InvoiceTaskRequest):
    """
    Create a task when an invoice is generated
    Call this from your invoice creation endpoint
    """
    try:
        task_id = await task_integration_service.create_invoice_payment_task(
            invoice_id=request.invoice_id,
            invoice_number=request.invoice_number,
            customer_id=request.customer_id,
            customer_name=request.customer_name,
            created_by=request.created_by,
            created_by_name=request.created_by_name,
            amount=request.amount,
            due_date=request.due_date
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Invoice payment task created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating invoice task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice task: {str(e)}")

@integration_router.post("/form")
async def create_form_task(request: FormTaskRequest):
    """
    Create a task when a form is assigned
    Call this from your form assignment endpoint
    """
    try:
        task_id = await task_integration_service.create_form_completion_task(
            form_id=request.form_id,
            form_name=request.form_name,
            form_description=request.form_description,
            assigned_to=request.assigned_to,
            assigned_by=request.assigned_by,
            assigned_by_name=request.assigned_by_name,
            priority=request.priority,
            due_date=request.due_date
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Form completion task created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating form task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create form task: {str(e)}")

@integration_router.post("/project")
async def create_project_task(request: ProjectTaskRequest):
    """
    Create a task within a project
    Call this when creating project tasks
    """
    try:
        task_id = await task_integration_service.create_project_task(
            project_id=request.project_id,
            project_name=request.project_name,
            task_title=request.task_title,
            task_description=request.task_description,
            assigned_to=request.assigned_to,
            assigned_by=request.assigned_by,
            assigned_by_name=request.assigned_by_name,
            priority=request.priority,
            due_date=request.due_date
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Project task created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating project task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project task: {str(e)}")

@integration_router.post("/maintenance")
async def create_maintenance_task(request: MaintenanceTaskRequest):
    """
    Create a maintenance task for equipment
    Call this when scheduling maintenance
    """
    try:
        task_id = await task_integration_service.create_maintenance_task(
            equipment_id=request.equipment_id,
            equipment_name=request.equipment_name,
            maintenance_type=request.maintenance_type,
            maintenance_description=request.maintenance_description,
            assigned_to=request.assigned_to,
            assigned_by=request.assigned_by,
            assigned_by_name=request.assigned_by_name,
            priority=request.priority,
            due_date=request.due_date
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Maintenance task created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating maintenance task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance task: {str(e)}")

@integration_router.post("/complete")
async def mark_task_complete(request: CompletionRequest):
    """
    Mark a task as complete when the source item is completed
    Call this when work order/invoice/form is completed
    """
    try:
        success = await task_integration_service.update_task_on_completion(
            related_type=request.related_type,
            related_id=request.related_id,
            completed_by=request.completed_by,
            completed_by_name=request.completed_by_name,
            completion_notes=request.completion_notes
        )
        
        if success:
            return {
                "success": True,
                "message": "Task marked as completed"
            }
        else:
            return {
                "success": False,
                "message": "No active task found to complete"
            }
        
    except Exception as e:
        logger.error(f"Error marking task complete: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark task complete: {str(e)}")

logger.info("Task integration routes initialized successfully")
