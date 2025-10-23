#!/usr/bin/env python3
"""
Fleet Tracking Service - Real-time crew location and status tracking
Integrates with dispatch board for live fleet visibility
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from realtime_service import realtime_service, EventType

load_dotenv()

logger = logging.getLogger(__name__)

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Collections
crew_locations_collection = db["crew_locations"]
crew_status_collection = db["crew_status"]
work_orders_collection = db["work_orders"]
employees_collection = db["employees"]
equipment_collection = db["equipment"]

class FleetTrackingService:
    """Manages real-time fleet tracking and crew status"""
    
    @staticmethod
    async def update_crew_location(
        crew_id: str,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None
    ) -> Dict:
        """
        Update crew member's current location
        Called from mobile app GPS tracking
        """
        try:
            location_data = {
                "crew_id": crew_id,
                "latitude": latitude,
                "longitude": longitude,
                "accuracy": accuracy,
                "speed": speed,
                "heading": heading,
                "timestamp": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Upsert location (update if exists, insert if new)
            await crew_locations_collection.update_one(
                {"crew_id": crew_id},
                {"$set": location_data},
                upsert=True
            )
            
            # Get crew info for enriched broadcast
            employee = await employees_collection.find_one({"_id": ObjectId(crew_id)})
            crew_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}" if employee else "Unknown"
            
            # Broadcast real-time location update
            await realtime_service.emit_crew_location(crew_id, {
                "latitude": latitude,
                "longitude": longitude,
                "accuracy": accuracy,
                "speed": speed,
                "heading": heading,
                "crew_name": crew_name,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Crew location updated: {crew_id}")
            
            return {"success": True, "message": "Location updated"}
            
        except Exception as e:
            logger.error(f"Error updating crew location: {e}")
            raise
    
    @staticmethod
    async def update_crew_status(
        crew_id: str,
        status: str,
        work_order_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Update crew status: available, en_route, working, break, off_duty
        """
        try:
            status_data = {
                "crew_id": crew_id,
                "status": status,
                "work_order_id": work_order_id,
                "notes": notes,
                "timestamp": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # If status is working, validate work order exists
            if status == "working" and work_order_id:
                work_order = await work_orders_collection.find_one({"_id": ObjectId(work_order_id)})
                if work_order:
                    status_data["work_order_details"] = {
                        "customer_name": work_order.get("customer_name"),
                        "service_type": work_order.get("service_type"),
                        "property_address": work_order.get("property_address")
                    }
            
            # Upsert status
            await crew_status_collection.update_one(
                {"crew_id": crew_id},
                {"$set": status_data},
                upsert=True
            )
            
            # Broadcast status change
            employee = await employees_collection.find_one({"_id": ObjectId(crew_id)})
            crew_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}" if employee else "Unknown"
            
            await realtime_service.emit_system_alert({
                "message": f"{crew_name} status: {status}",
                "crew_id": crew_id,
                "status": status,
                "work_order_id": work_order_id
            }, severity="info")
            
            logger.info(f"Crew status updated: {crew_id} - {status}")
            
            return {"success": True, "message": "Status updated"}
            
        except Exception as e:
            logger.error(f"Error updating crew status: {e}")
            raise
    
    @staticmethod
    async def get_fleet_overview() -> Dict:
        """
        Get complete fleet overview with locations and status
        Used by dispatch dashboard
        """
        try:
            # Get all crew members with recent locations (last 30 minutes)
            recent_threshold = datetime.utcnow() - timedelta(minutes=30)
            
            locations = await crew_locations_collection.find({
                "timestamp": {"$gte": recent_threshold}
            }).to_list(1000)
            
            # Get all crew statuses
            statuses = await crew_status_collection.find({}).to_list(1000)
            status_map = {s["crew_id"]: s for s in statuses}
            
            # Enrich with employee info
            fleet_data = []
            for loc in locations:
                crew_id = loc["crew_id"]
                employee = await employees_collection.find_one({"_id": ObjectId(crew_id)})
                
                if not employee:
                    continue
                
                status_info = status_map.get(crew_id, {})
                
                crew_info = {
                    "crew_id": crew_id,
                    "crew_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                    "location": {
                        "latitude": loc.get("latitude"),
                        "longitude": loc.get("longitude"),
                        "accuracy": loc.get("accuracy"),
                        "speed": loc.get("speed"),
                        "heading": loc.get("heading"),
                        "timestamp": loc.get("timestamp").isoformat() if loc.get("timestamp") else None
                    },
                    "status": status_info.get("status", "unknown"),
                    "work_order_id": status_info.get("work_order_id"),
                    "work_order_details": status_info.get("work_order_details", {}),
                    "phone": employee.get("phone"),
                    "job_title": employee.get("job_title"),
                    "last_update": loc.get("updated_at").isoformat() if loc.get("updated_at") else None
                }
                
                fleet_data.append(crew_info)
            
            # Get summary stats
            total_crews = len(fleet_data)
            available = sum(1 for c in fleet_data if c["status"] == "available")
            working = sum(1 for c in fleet_data if c["status"] == "working")
            en_route = sum(1 for c in fleet_data if c["status"] == "en_route")
            on_break = sum(1 for c in fleet_data if c["status"] == "break")
            
            return {
                "success": True,
                "fleet": fleet_data,
                "summary": {
                    "total": total_crews,
                    "available": available,
                    "working": working,
                    "en_route": en_route,
                    "on_break": on_break,
                    "off_duty": total_crews - (available + working + en_route + on_break)
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting fleet overview: {e}")
            raise
    
    @staticmethod
    async def get_crew_history(crew_id: str, hours: int = 8) -> Dict:
        """
        Get crew location history for route replay
        """
        try:
            start_time = datetime.utcnow() - timedelta(hours=hours)
            
            # This would require storing location history (not just current)
            # For now, return placeholder for implementation
            history = []
            
            return {
                "success": True,
                "crew_id": crew_id,
                "history": history,
                "start_time": start_time.isoformat(),
                "end_time": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting crew history: {e}")
            raise
    
    @staticmethod
    async def get_nearest_available_crew(
        latitude: float,
        longitude: float,
        max_distance_km: float = 50.0
    ) -> Optional[Dict]:
        """
        Find nearest available crew member to a location
        Uses Haversine formula for distance calculation
        """
        try:
            # Get all available crew
            available_statuses = await crew_status_collection.find({
                "status": "available"
            }).to_list(1000)
            
            available_crew_ids = [s["crew_id"] for s in available_statuses]
            
            if not available_crew_ids:
                return None
            
            # Get their locations
            locations = await crew_locations_collection.find({
                "crew_id": {"$in": available_crew_ids}
            }).to_list(1000)
            
            # Calculate distances
            nearest = None
            min_distance = float('inf')
            
            for loc in locations:
                distance = FleetTrackingService._calculate_distance(
                    latitude, longitude,
                    loc["latitude"], loc["longitude"]
                )
                
                if distance < min_distance and distance <= max_distance_km:
                    min_distance = distance
                    nearest = loc
            
            if nearest:
                employee = await employees_collection.find_one({"_id": ObjectId(nearest["crew_id"])})
                return {
                    "crew_id": nearest["crew_id"],
                    "crew_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}" if employee else "Unknown",
                    "distance_km": round(min_distance, 2),
                    "location": {
                        "latitude": nearest["latitude"],
                        "longitude": nearest["longitude"]
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding nearest crew: {e}")
            raise
    
    @staticmethod
    def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = R * c
        return distance
    
    @staticmethod
    async def check_geofence_alerts(crew_id: str, latitude: float, longitude: float) -> List[Dict]:
        """
        Check if crew is near assigned work order location
        Send alerts if crew is approaching or has arrived
        """
        try:
            alerts = []
            
            # Get crew's current work order
            status = await crew_status_collection.find_one({"crew_id": crew_id})
            
            if not status or status.get("status") != "en_route":
                return alerts
            
            work_order_id = status.get("work_order_id")
            if not work_order_id:
                return alerts
            
            work_order = await work_orders_collection.find_one({"_id": ObjectId(work_order_id)})
            
            if not work_order:
                return alerts
            
            # For simplicity, assuming property_address has coordinates (would need geocoding in production)
            # This is placeholder logic
            
            # Distance thresholds
            ARRIVED_THRESHOLD = 0.1  # 100 meters
            APPROACHING_THRESHOLD = 1.0  # 1 km
            
            # Would calculate distance to work order location here
            # If within thresholds, create alerts
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error checking geofence: {e}")
            return []

# Export singleton instance
fleet_tracking = FleetTrackingService()

logger.info("Fleet tracking service initialized successfully")
