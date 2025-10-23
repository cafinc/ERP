#!/usr/bin/env python3
"""
Fleet Tracking Routes - API Endpoints for real-time fleet management
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from fleet_tracking import fleet_tracking

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/fleet", tags=["fleet"])

# Request Models
class LocationUpdate(BaseModel):
    crew_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None

class StatusUpdate(BaseModel):
    crew_id: str
    status: str  # available, en_route, working, break, off_duty
    work_order_id: Optional[str] = None
    notes: Optional[str] = None

class NearestCrewQuery(BaseModel):
    latitude: float
    longitude: float
    max_distance_km: Optional[float] = 50.0

# Routes
@router.post("/location")
async def update_location(location: LocationUpdate):
    """Update crew member location (called from mobile app)"""
    try:
        result = await fleet_tracking.update_crew_location(
            crew_id=location.crew_id,
            latitude=location.latitude,
            longitude=location.longitude,
            accuracy=location.accuracy,
            speed=location.speed,
            heading=location.heading
        )
        return result
    except Exception as e:
        logger.error(f"Error updating location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/status")
async def update_status(status: StatusUpdate):
    """Update crew member status"""
    try:
        result = await fleet_tracking.update_crew_status(
            crew_id=status.crew_id,
            status=status.status,
            work_order_id=status.work_order_id,
            notes=status.notes
        )
        return result
    except Exception as e:
        logger.error(f"Error updating status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
async def get_fleet_overview():
    """Get complete fleet overview with locations and status"""
    try:
        result = await fleet_tracking.get_fleet_overview()
        return result
    except Exception as e:
        logger.error(f"Error getting fleet overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{crew_id}/history")
async def get_crew_history(crew_id: str, hours: int = 8):
    """Get crew location history for route replay"""
    try:
        result = await fleet_tracking.get_crew_history(crew_id, hours)
        return result
    except Exception as e:
        logger.error(f"Error getting crew history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/nearest")
async def find_nearest_crew(query: NearestCrewQuery):
    """Find nearest available crew member to a location"""
    try:
        result = await fleet_tracking.get_nearest_available_crew(
            latitude=query.latitude,
            longitude=query.longitude,
            max_distance_km=query.max_distance_km
        )
        
        if result:
            return {"success": True, "crew": result}
        else:
            return {"success": False, "message": "No available crew found within range"}
    except Exception as e:
        logger.error(f"Error finding nearest crew: {e}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("Fleet tracking routes initialized successfully")
