#!/usr/bin/env python3
"""
Work Order Routes - API Endpoints for Work Order Management
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
router = APIRouter(prefix="/work-orders", tags=["work-orders"])

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

work_orders_collection = db["work_orders"]
customers_collection = db["customers"]

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
class WorkOrderCreate(BaseModel):
    customer_id: str
    site_id: Optional[str] = None
    service_type: str
    priority: str = "medium"
    scheduled_date: Optional[str] = None
    assigned_crew: Optional[List[str]] = []
    status: str = "pending"
    description: Optional[str] = ""
    estimated_hours: Optional[float] = None
    equipment_needed: Optional[List[str]] = []
    special_instructions: Optional[str] = ""

class WorkOrderUpdate(BaseModel):
    service_type: Optional[str] = None
    priority: Optional[str] = None
    scheduled_date: Optional[str] = None
    assigned_crew: Optional[List[str]] = None
    status: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    equipment_needed: Optional[List[str]] = None
    special_instructions: Optional[str] = None
    actual_hours: Optional[float] = None
    completion_notes: Optional[str] = None
    completed_at: Optional[str] = None

# Routes
@router.post("")
async def create_work_order(work_order: WorkOrderCreate):
    """Create a new work order"""
    try:
        # Validate customer exists
        customer_id = validate_object_id(work_order.customer_id, "Customer")
        customer = await customers_collection.find_one({"_id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        work_order_dict = work_order.dict()
        work_order_dict["created_at"] = datetime.utcnow()
        work_order_dict["updated_at"] = datetime.utcnow()
        work_order_dict["customer_name"] = customer.get("name", "Unknown")
        
        result = await work_orders_collection.insert_one(work_order_dict)
        work_order_dict["_id"] = result.inserted_id
        
        return {"success": True, "work_order": serialize_doc(work_order_dict)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating work order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def list_work_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer_id: Optional[str] = None,
    assigned_crew: Optional[str] = None,
    service_type: Optional[str] = None,
    limit: int = Query(50, le=100),
    skip: int = 0
):
    """List work orders with filters"""
    try:
        query = {}
        if status:
            query["status"] = status
        if priority:
            query["priority"] = priority
        if customer_id:
            query["customer_id"] = customer_id
        if assigned_crew:
            query["assigned_crew"] = assigned_crew
        if service_type:
            query["service_type"] = service_type
        
        cursor = work_orders_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        work_orders = await cursor.to_list(length=limit)
        
        serialized = [serialize_doc(wo) for wo in work_orders]
        total = await work_orders_collection.count_documents(query)
        
        return {
            "success": True,
            "work_orders": serialized,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error listing work orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{work_order_id}")
async def get_work_order(work_order_id: str):
    """Get a specific work order"""
    try:
        object_id = validate_object_id(work_order_id, "Work Order")
        work_order = await work_orders_collection.find_one({"_id": object_id})
        
        if not work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        return {"success": True, "work_order": serialize_doc(work_order)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting work order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{work_order_id}")
async def update_work_order(work_order_id: str, updates: WorkOrderUpdate):
    """Update a work order"""
    try:
        object_id = validate_object_id(work_order_id, "Work Order")
        
        update_dict = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await work_orders_collection.update_one(
            {"_id": object_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        updated_wo = await work_orders_collection.find_one({"_id": object_id})
        
        return {"success": True, "work_order": serialize_doc(updated_wo)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating work order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{work_order_id}")
async def delete_work_order(work_order_id: str):
    """Delete a work order"""
    try:
        object_id = validate_object_id(work_order_id, "Work Order")
        
        result = await work_orders_collection.delete_one({"_id": object_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        return {"success": True, "message": "Work order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting work order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("Work order routes initialized successfully")
