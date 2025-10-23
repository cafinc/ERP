#!/usr/bin/env python3
"""
Site Geofencing Routes
Enhanced geofencing with polygon support for property boundaries
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sites", tags=["Site Geofencing"])

# MongoDB collections (imported from main)
from server import db

sites_collection = db.sites
geofences_collection = db.site_geofences

# ========== Request Models ==========

class GeoPoint(BaseModel):
    lat: float
    lng: float


class GeofencePolygonCreate(BaseModel):
    site_id: str
    name: str = "Property Boundary"
    polygon_coordinates: List[GeoPoint]  # Array of lat/lng points
    center_point: GeoPoint
    area_square_meters: Optional[float] = None
    perimeter_meters: Optional[float] = None
    color: str = "#3B82F6"
    opacity: float = 0.3
    stroke_color: str = "#1E40AF"
    stroke_weight: int = 2


class GeofencePolygonUpdate(BaseModel):
    name: Optional[str] = None
    polygon_coordinates: Optional[List[GeoPoint]] = None
    center_point: Optional[GeoPoint] = None
    area_square_meters: Optional[float] = None
    perimeter_meters: Optional[float] = None
    color: Optional[str] = None
    opacity: Optional[float] = None
    stroke_color: Optional[str] = None
    stroke_weight: Optional[int] = None
    is_active: Optional[bool] = None


# ========== Create Geofence Polygon ==========

@router.post("/{site_id}/geofence")
async def create_site_geofence(site_id: str, geofence: GeofencePolygonCreate):
    """
    Create geofence polygon for a site
    Supports complex property boundaries with multiple points
    """
    try:
        # Verify site exists
        site = await sites_collection.find_one({"_id": ObjectId(site_id)})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        # Check if geofence already exists
        existing = await geofences_collection.find_one({"site_id": site_id})
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Geofence already exists for this site. Use update endpoint to modify."
            )
        
        # Create geofence document
        geofence_data = {
            "site_id": site_id,
            "site_name": site.get("name"),
            "name": geofence.name,
            "polygon_coordinates": [point.dict() for point in geofence.polygon_coordinates],
            "center_point": geofence.center_point.dict(),
            "area_square_meters": geofence.area_square_meters,
            "perimeter_meters": geofence.perimeter_meters,
            "color": geofence.color,
            "opacity": geofence.opacity,
            "stroke_color": geofence.stroke_color,
            "stroke_weight": geofence.stroke_weight,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = await geofences_collection.insert_one(geofence_data)
        
        # Update site with geofence reference
        await sites_collection.update_one(
            {"_id": ObjectId(site_id)},
            {"$set": {"has_geofence": True}}
        )
        
        logger.info(f"Created geofence for site {site_id}")
        
        return {
            "success": True,
            "geofence_id": str(result.inserted_id),
            "message": "Geofence created successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Geofence ==========

@router.get("/{site_id}/geofence")
async def get_site_geofence(site_id: str):
    """Get geofence for a site"""
    try:
        geofence = await geofences_collection.find_one({"site_id": site_id})
        
        if not geofence:
            return {
                "success": True,
                "has_geofence": False,
                "geofence": None
            }
        
        return {
            "success": True,
            "has_geofence": True,
            "geofence": {
                "id": str(geofence["_id"]),
                "site_id": geofence.get("site_id"),
                "name": geofence.get("name"),
                "polygon_coordinates": geofence.get("polygon_coordinates"),
                "center_point": geofence.get("center_point"),
                "area_square_meters": geofence.get("area_square_meters"),
                "perimeter_meters": geofence.get("perimeter_meters"),
                "color": geofence.get("color"),
                "opacity": geofence.get("opacity"),
                "stroke_color": geofence.get("stroke_color"),
                "stroke_weight": geofence.get("stroke_weight"),
                "is_active": geofence.get("is_active", True),
                "created_at": geofence.get("created_at").isoformat() if geofence.get("created_at") else None,
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Update Geofence ==========

@router.put("/{site_id}/geofence")
async def update_site_geofence(site_id: str, geofence_update: GeofencePolygonUpdate):
    """Update geofence for a site"""
    try:
        geofence = await geofences_collection.find_one({"site_id": site_id})
        if not geofence:
            raise HTTPException(status_code=404, detail="Geofence not found")
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if geofence_update.name is not None:
            update_data["name"] = geofence_update.name
        
        if geofence_update.polygon_coordinates is not None:
            update_data["polygon_coordinates"] = [
                point.dict() for point in geofence_update.polygon_coordinates
            ]
        
        if geofence_update.center_point is not None:
            update_data["center_point"] = geofence_update.center_point.dict()
        
        if geofence_update.area_square_meters is not None:
            update_data["area_square_meters"] = geofence_update.area_square_meters
        
        if geofence_update.perimeter_meters is not None:
            update_data["perimeter_meters"] = geofence_update.perimeter_meters
        
        if geofence_update.color is not None:
            update_data["color"] = geofence_update.color
        
        if geofence_update.opacity is not None:
            update_data["opacity"] = geofence_update.opacity
        
        if geofence_update.stroke_color is not None:
            update_data["stroke_color"] = geofence_update.stroke_color
        
        if geofence_update.stroke_weight is not None:
            update_data["stroke_weight"] = geofence_update.stroke_weight
        
        if geofence_update.is_active is not None:
            update_data["is_active"] = geofence_update.is_active
        
        result = await geofences_collection.update_one(
            {"site_id": site_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Updated geofence for site {site_id}")
        
        return {
            "success": True,
            "message": "Geofence updated successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Delete Geofence ==========

@router.delete("/{site_id}/geofence")
async def delete_site_geofence(site_id: str):
    """Delete geofence for a site"""
    try:
        result = await geofences_collection.delete_one({"site_id": site_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Geofence not found")
        
        # Update site
        await sites_collection.update_one(
            {"_id": ObjectId(site_id)},
            {"$set": {"has_geofence": False}}
        )
        
        return {
            "success": True,
            "message": "Geofence deleted successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Calculate Measurements ==========

@router.post("/{site_id}/calculate-measurements")
async def calculate_property_measurements(site_id: str, coordinates: List[GeoPoint]):
    """
    Calculate area and perimeter from polygon coordinates
    Uses Haversine formula for accurate calculations
    """
    try:
        import math
        
        if len(coordinates) < 3:
            raise HTTPException(
                status_code=400,
                detail="At least 3 points required to calculate area"
            )
        
        # Calculate area using Shoelace formula (for lat/lng)
        def calculate_area(points):
            """Calculate area in square meters"""
            # Convert to radians
            R = 6371000  # Earth radius in meters
            
            area = 0
            n = len(points)
            
            for i in range(n):
                j = (i + 1) % n
                lat1, lng1 = math.radians(points[i].lat), math.radians(points[i].lng)
                lat2, lng2 = math.radians(points[j].lat), math.radians(points[j].lng)
                
                area += (lng2 - lng1) * (2 + math.sin(lat1) + math.sin(lat2))
            
            area = abs(area * R * R / 2.0)
            return area
        
        # Calculate perimeter
        def haversine_distance(point1, point2):
            """Calculate distance between two points in meters"""
            R = 6371000  # Earth radius in meters
            
            lat1, lng1 = math.radians(point1.lat), math.radians(point1.lng)
            lat2, lng2 = math.radians(point2.lat), math.radians(point2.lng)
            
            dlat = lat2 - lat1
            dlng = lng2 - lng1
            
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
            c = 2 * math.asin(math.sqrt(a))
            
            return R * c
        
        def calculate_perimeter(points):
            """Calculate perimeter in meters"""
            perimeter = 0
            n = len(points)
            
            for i in range(n):
                j = (i + 1) % n
                perimeter += haversine_distance(points[i], points[j])
            
            return perimeter
        
        # Calculate center point
        def calculate_center(points):
            """Calculate geometric center"""
            lat_sum = sum(p.lat for p in points)
            lng_sum = sum(p.lng for p in points)
            n = len(points)
            return {"lat": lat_sum / n, "lng": lng_sum / n}
        
        area_sqm = calculate_area(coordinates)
        perimeter_m = calculate_perimeter(coordinates)
        center = calculate_center(coordinates)
        
        # Convert to other units
        area_sqft = area_sqm * 10.764  # Square feet
        area_acres = area_sqm * 0.000247105  # Acres
        perimeter_ft = perimeter_m * 3.28084  # Feet
        
        return {
            "success": True,
            "measurements": {
                "area_square_meters": round(area_sqm, 2),
                "area_square_feet": round(area_sqft, 2),
                "area_acres": round(area_acres, 4),
                "perimeter_meters": round(perimeter_m, 2),
                "perimeter_feet": round(perimeter_ft, 2),
                "center_point": center,
                "num_points": len(coordinates),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating measurements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


logger.info("Site geofencing routes initialized successfully")
