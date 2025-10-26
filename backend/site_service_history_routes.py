from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging

from server import db

logger = logging.getLogger(__name__)
router = APIRouter()

service_history_collection = db.site_service_history

class ServiceHistoryCreate(BaseModel):
    site_id: str
    service_date: str
    service_type: str
    crew_members: Optional[List[str]] = []
    crew_lead: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: str = "completed"  # completed, in_progress, scheduled
    duration_hours: Optional[float] = None
    photos: Optional[List[str]] = []  # URLs or base64
    weather_conditions: Optional[str] = None
    equipment_used: Optional[List[str]] = []

class ServiceHistoryUpdate(BaseModel):
    service_date: Optional[str] = None
    service_type: Optional[str] = None
    crew_members: Optional[List[str]] = None
    crew_lead: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    duration_hours: Optional[float] = None
    photos: Optional[List[str]] = None
    weather_conditions: Optional[str] = None
    equipment_used: Optional[List[str]] = None

# Create service history entry
@router.post("/sites/{site_id}/service-history")
async def create_service_history(site_id: str, service: ServiceHistoryCreate):
    """
    Create a new service history entry for a site
    """
    try:
        service_data = {
            "site_id": site_id,
            "service_date": service.service_date,
            "service_type": service.service_type,
            "crew_members": service.crew_members,
            "crew_lead": service.crew_lead,
            "description": service.description,
            "notes": service.notes,
            "status": service.status,
            "duration_hours": service.duration_hours,
            "photos": service.photos,
            "weather_conditions": service.weather_conditions,
            "equipment_used": service.equipment_used,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        result = await service_history_collection.insert_one(service_data)
        logger.info(f"Created service history entry for site {site_id}")
        
        return {
            "success": True,
            "message": "Service history created successfully",
            "service_history_id": str(result.inserted_id),
        }
    except Exception as e:
        logger.error(f"Error creating service history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get service history for a site
@router.get("/sites/{site_id}/service-history")
async def get_site_service_history(
    site_id: str,
    limit: int = 100,
    service_type: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Get all service history entries for a site
    """
    try:
        query = {"site_id": site_id}
        
        if service_type:
            query["service_type"] = service_type
        if status:
            query["status"] = status
        
        history = await service_history_collection.find(query).sort("service_date", -1).limit(limit).to_list(limit)
        
        for entry in history:
            entry["id"] = str(entry.pop("_id"))
        
        return {
            "success": True,
            "count": len(history),
            "service_history": history
        }
    except Exception as e:
        logger.error(f"Error getting service history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get service history statistics
@router.get("/sites/{site_id}/service-history/stats")
async def get_service_history_stats(site_id: str):
    """
    Get statistics about service history for a site
    """
    try:
        pipeline = [
            {"$match": {"site_id": site_id}},
            {"$group": {
                "_id": "$service_type",
                "count": {"$sum": 1},
                "total_hours": {"$sum": "$duration_hours"}
            }}
        ]
        
        stats = await service_history_collection.aggregate(pipeline).to_list(100)
        
        total_services = await service_history_collection.count_documents({"site_id": site_id})
        
        return {
            "success": True,
            "total_services": total_services,
            "by_type": stats
        }
    except Exception as e:
        logger.error(f"Error getting service history stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get single service history entry
@router.get("/sites/{site_id}/service-history/{history_id}")
async def get_service_history_entry(site_id: str, history_id: str):
    """
    Get a specific service history entry
    """
    try:
        entry = await service_history_collection.find_one({"_id": ObjectId(history_id), "site_id": site_id})
        
        if not entry:
            raise HTTPException(status_code=404, detail="Service history entry not found")
        
        entry["id"] = str(entry.pop("_id"))
        
        return {
            "success": True,
            "service_history": entry
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting service history entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Update service history entry
@router.patch("/sites/{site_id}/service-history/{history_id}")
async def update_service_history(site_id: str, history_id: str, update: ServiceHistoryUpdate):
    """
    Update a service history entry
    """
    try:
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await service_history_collection.update_one(
            {"_id": ObjectId(history_id), "site_id": site_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Service history entry not found")
        
        logger.info(f"Updated service history entry {history_id}")
        
        return {
            "success": True,
            "message": "Service history updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating service history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Delete service history entry
@router.delete("/sites/{site_id}/service-history/{history_id}")
async def delete_service_history(site_id: str, history_id: str):
    """
    Delete a service history entry
    """
    try:
        result = await service_history_collection.delete_one({"_id": ObjectId(history_id), "site_id": site_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Service history entry not found")
        
        logger.info(f"Deleted service history entry {history_id}")
        
        return {
            "success": True,
            "message": "Service history deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting service history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("Site service history routes initialized successfully")
