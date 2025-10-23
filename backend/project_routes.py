#!/usr/bin/env python3
"""
Project Routes - API Endpoints for Project Management
Projects sit between Estimates and Work Orders in the service lifecycle
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/projects", tags=["projects"])

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

projects_collection = db["projects"]
customers_collection = db["customers"]
estimates_collection = db["estimates"]

# Helper functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def validate_object_id(id_string: str, resource_name: str = "Resource") -> ObjectId:
    """Validate and convert string to ObjectId, raise 404 if invalid"""
    try:
        return ObjectId(id_string)
    except Exception:
        raise HTTPException(status_code=404, detail=f"{resource_name} not found")

# Request Models
class ProjectCreate(BaseModel):
    customer_id: str
    estimate_id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    project_type: str  # seasonal_contract, one_time, recurring
    service_types: List[str]  # snow_plowing, salting, removal, etc.
    start_date: str
    end_date: Optional[str] = None
    budget: Optional[float] = None
    status: str = "active"  # active, on_hold, completed, cancelled
    priority: str = "medium"
    properties: List[str] = []  # List of property/site IDs
    assigned_manager: Optional[str] = None
    notes: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[str] = None
    service_types: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    properties: Optional[List[str]] = None
    assigned_manager: Optional[str] = None
    notes: Optional[str] = None

# Routes
@router.post("")
async def create_project(project: ProjectCreate):
    """Create a new project"""
    try:
        # Validate customer exists
        customer_id = validate_object_id(project.customer_id, "Customer")
        customer = await customers_collection.find_one({"_id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Validate estimate if provided
        if project.estimate_id:
            estimate_id = validate_object_id(project.estimate_id, "Estimate")
            estimate = await estimates_collection.find_one({"_id": estimate_id})
            if not estimate:
                raise HTTPException(status_code=404, detail="Estimate not found")
        
        project_dict = project.dict()
        project_dict["customer_name"] = customer.get("name", "Unknown")
        project_dict["created_at"] = datetime.utcnow()
        project_dict["updated_at"] = datetime.utcnow()
        project_dict["work_orders"] = []  # Track associated work orders
        project_dict["total_spent"] = 0.0
        project_dict["work_orders_count"] = 0
        project_dict["completed_work_orders"] = 0
        
        result = await projects_collection.insert_one(project_dict)
        project_dict["_id"] = result.inserted_id
        
        logger.info(f"Project created: {result.inserted_id}")
        
        return {"success": True, "project": serialize_doc(project_dict)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def list_projects(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    assigned_manager: Optional[str] = None,
    limit: int = Query(50, le=100),
    skip: int = 0
):
    """List projects with filters"""
    try:
        query = {}
        if customer_id:
            query["customer_id"] = customer_id
        if status:
            query["status"] = status
        if project_type:
            query["project_type"] = project_type
        if assigned_manager:
            query["assigned_manager"] = assigned_manager
        
        cursor = projects_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        projects = await cursor.to_list(length=limit)
        
        serialized = [serialize_doc(proj) for proj in projects]
        total = await projects_collection.count_documents(query)
        
        return {
            "success": True,
            "projects": serialized,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get a specific project with associated work orders"""
    try:
        object_id = validate_object_id(project_id, "Project")
        project = await projects_collection.find_one({"_id": object_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get associated work orders
        work_orders = await db.work_orders.find({
            "project_id": project_id
        }).to_list(100)
        
        project["work_orders_details"] = [serialize_doc(wo) for wo in work_orders]
        
        return {"success": True, "project": serialize_doc(project)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{project_id}")
async def update_project(project_id: str, updates: ProjectUpdate):
    """Update a project"""
    try:
        object_id = validate_object_id(project_id, "Project")
        
        update_dict = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await projects_collection.update_one(
            {"_id": object_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        updated_project = await projects_collection.find_one({"_id": object_id})
        
        return {"success": True, "project": serialize_doc(updated_project)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project (soft delete - marks as cancelled)"""
    try:
        object_id = validate_object_id(project_id, "Project")
        
        # Soft delete - mark as cancelled
        result = await projects_collection.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"success": True, "message": "Project cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/stats")
async def get_project_stats(project_id: str):
    """Get project statistics and progress"""
    try:
        object_id = validate_object_id(project_id, "Project")
        project = await projects_collection.find_one({"_id": object_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get work order statistics
        work_orders = await db.work_orders.find({
            "project_id": project_id
        }).to_list(1000)
        
        total_work_orders = len(work_orders)
        completed = sum(1 for wo in work_orders if wo.get("status") == "completed")
        in_progress = sum(1 for wo in work_orders if wo.get("status") == "in_progress")
        pending = sum(1 for wo in work_orders if wo.get("status") == "pending")
        
        # Calculate total spent
        total_spent = sum(wo.get("actual_cost", 0) for wo in work_orders if wo.get("status") == "completed")
        
        # Calculate budget utilization
        budget = project.get("budget", 0)
        budget_utilization = (total_spent / budget * 100) if budget > 0 else 0
        
        stats = {
            "total_work_orders": total_work_orders,
            "completed_work_orders": completed,
            "in_progress_work_orders": in_progress,
            "pending_work_orders": pending,
            "completion_rate": (completed / total_work_orders * 100) if total_work_orders > 0 else 0,
            "total_spent": total_spent,
            "budget": budget,
            "budget_utilization": budget_utilization,
            "remaining_budget": budget - total_spent if budget > 0 else 0,
            "project_status": project.get("status"),
            "start_date": project.get("start_date"),
            "end_date": project.get("end_date")
        }
        
        return {"success": True, "stats": stats}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("Project routes initialized successfully")
