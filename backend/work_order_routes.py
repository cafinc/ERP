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
sites_collection = db["sites"]
services_collection = db["services"]

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

# Invoice Generation from Work Order
@router.post("/{work_order_id}/generate-invoice")
async def generate_invoice_from_work_order(work_order_id: str):
    """Generate an invoice from a completed work order"""
    try:
        object_id = validate_object_id(work_order_id, "Work Order")
        work_order = await work_orders_collection.find_one({"_id": object_id})
        
        if not work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        # Check if work order is completed
        if work_order.get("status") != "completed":
            raise HTTPException(
                status_code=400, 
                detail="Work order must be completed before generating an invoice"
            )
        
        # Check if invoice already exists for this work order
        invoices_collection = db["invoices"]
        existing_invoice = await invoices_collection.find_one({"work_order_id": work_order_id})
        if existing_invoice:
            return {
                "success": False,
                "message": "Invoice already exists for this work order",
                "invoice_id": str(existing_invoice["_id"])
            }
        
        # Get customer
        customer = await customers_collection.find_one({"_id": ObjectId(work_order["customer_id"])})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Build line items
        line_items = []
        
        # Main service line item
        service_description = f"{work_order.get('service_type', 'Service')} - {work_order.get('description', '')}"
        service_cost = work_order.get('service_cost', 0) or work_order.get('estimated_cost', 0) or 0
        
        line_items.append({
            "description": service_description,
            "quantity": 1,
            "unit_price": service_cost,
            "total": service_cost
        })
        
        # Add labor if actual hours are tracked
        if work_order.get('actual_hours'):
            labor_rate = work_order.get('labor_rate', 50.0)  # Default $50/hour
            labor_cost = work_order['actual_hours'] * labor_rate
            line_items.append({
                "description": f"Labor ({work_order['actual_hours']} hours @ ${labor_rate}/hr)",
                "quantity": work_order['actual_hours'],
                "unit_price": labor_rate,
                "total": labor_cost
            })
        
        # Add consumables used
        if work_order.get('consumables_used'):
            for consumable in work_order['consumables_used']:
                line_items.append({
                    "description": f"{consumable.get('name', 'Material')}",
                    "quantity": consumable.get('quantity', 1),
                    "unit_price": consumable.get('cost', 0),
                    "total": consumable.get('quantity', 1) * consumable.get('cost', 0)
                })
        
        # Calculate totals
        subtotal = sum(item['total'] for item in line_items)
        tax_rate = 5.0  # 5% GST
        tax_amount = subtotal * (tax_rate / 100)
        total_amount = subtotal + tax_amount
        
        # Generate invoice number
        from datetime import datetime
        invoice_count = await invoices_collection.count_documents({})
        invoice_number = f"INV-{datetime.utcnow().year}-{invoice_count + 1:04d}"
        
        # Create invoice
        invoice_dict = {
            "invoice_number": invoice_number,
            "work_order_id": work_order_id,
            "customer_id": work_order["customer_id"],
            "customer_name": customer.get("name"),
            "site_id": work_order.get("site_id"),
            "line_items": line_items,
            "subtotal": subtotal,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "amount_paid": 0.0,
            "amount_due": total_amount,
            "status": "unpaid",
            "issue_date": datetime.utcnow(),
            "due_date": datetime.utcnow().replace(day=datetime.utcnow().day + 30) if datetime.utcnow().day <= 28 else datetime.utcnow().replace(month=datetime.utcnow().month + 1, day=1),
            "payment_terms": "net_30",
            "notes": f"Invoice generated from Work Order {work_order.get('work_order_number', work_order_id)}",
            "created_at": datetime.utcnow()
        }
        
        result = await invoices_collection.insert_one(invoice_dict)
        invoice_dict["id"] = str(result.inserted_id)
        
        # Update work order to mark it as invoiced
        await work_orders_collection.update_one(
            {"_id": object_id},
            {"$set": {"invoice_id": str(result.inserted_id), "invoiced": True}}
        )
        
        return {
            "success": True,
            "message": "Invoice generated successfully",
            "invoice": serialize_doc(invoice_dict)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invoice from work order: {e}")
        raise HTTPException(status_code=500, detail=str(e))
