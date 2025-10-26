from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging

from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

measurements_collection = db.site_measurements

class MeasurementPoint(BaseModel):
    lat: float
    lng: float

class MeasurementCreate(BaseModel):
    site_id: str
    measurement_type: str  # 'distance' or 'area'
    points: List[MeasurementPoint]
    distance_meters: Optional[float] = None
    distance_feet: Optional[float] = None
    area_square_meters: Optional[float] = None
    area_square_feet: Optional[float] = None
    notes: Optional[str] = None

class MeasurementResponse(BaseModel):
    id: str
    site_id: str
    measurement_type: str
    points: List[MeasurementPoint]
    distance_meters: Optional[float] = None
    distance_feet: Optional[float] = None
    area_square_meters: Optional[float] = None
    area_square_feet: Optional[float] = None
    notes: Optional[str] = None
    created_at: str

# Create measurement
@router.post("/sites/{site_id}/measurements")
async def create_measurement(site_id: str, measurement: MeasurementCreate):
    """
    Create a new measurement for a site
    """
    try:
        measurement_data = {
            "site_id": site_id,
            "measurement_type": measurement.measurement_type,
            "points": [point.dict() for point in measurement.points],
            "distance_meters": measurement.distance_meters,
            "distance_feet": measurement.distance_feet,
            "area_square_meters": measurement.area_square_meters,
            "area_square_feet": measurement.area_square_feet,
            "notes": measurement.notes,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = await measurements_collection.insert_one(measurement_data)
        logger.info(f"Created measurement for site {site_id}")
        
        return {
            "message": "Measurement created successfully",
            "measurement_id": str(result.inserted_id),
        }
    except Exception as e:
        logger.error(f"Error creating measurement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get measurements for a site
@router.get("/sites/{site_id}/measurements")
async def get_site_measurements(site_id: str):
    """
    Get all measurements for a site
    """
    try:
        measurements = await measurements_collection.find({"site_id": site_id}).to_list(100)
        
        for measurement in measurements:
            measurement["id"] = str(measurement.pop("_id"))
        
        return measurements
    except Exception as e:
        logger.error(f"Error getting measurements: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Delete measurement
@router.delete("/sites/{site_id}/measurements/{measurement_id}")
async def delete_measurement(site_id: str, measurement_id: str):
    """
    Delete a measurement
    """
    try:
        result = await measurements_collection.delete_one({"_id": ObjectId(measurement_id), "site_id": site_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Measurement not found")
        
        logger.info(f"Deleted measurement {measurement_id}")
        return {"message": "Measurement deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting measurement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("Site measurements routes initialized successfully")
