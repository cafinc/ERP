"""
Leads Management Routes
"""

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os

router = APIRouter(prefix="/leads", tags=["leads"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_name = os.getenv("DB_NAME", "snow_removal_db")
db = client[db_name]

@router.get("")
async def get_leads():
    """Get all leads"""
    try:
        leads = []
        async for lead in db.leads.find():
            lead["_id"] = str(lead["_id"])
            lead["id"] = lead["_id"]
            leads.append(lead)
        return leads
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{lead_id}")
async def get_lead(lead_id: str):
    """Get a specific lead"""
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        lead["_id"] = str(lead["_id"])
        lead["id"] = lead["_id"]
        return lead
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_lead(lead_data: dict):
    """Create a new lead"""
    try:
        lead_data["created_at"] = datetime.utcnow()
        lead_data["updated_at"] = datetime.utcnow()
        result = await db.leads.insert_one(lead_data)
        lead = await db.leads.find_one({"_id": result.inserted_id})
        lead["_id"] = str(lead["_id"])
        lead["id"] = lead["_id"]
        return lead
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{lead_id}")
async def update_lead(lead_id: str, lead_data: dict):
    """Update a lead"""
    try:
        lead_data["updated_at"] = datetime.utcnow()
        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": lead_data}
        )
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        lead["_id"] = str(lead["_id"])
        lead["id"] = lead["_id"]
        return lead
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete a lead"""
    try:
        result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        return {"message": "Lead deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
