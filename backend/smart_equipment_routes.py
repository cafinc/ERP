#!/usr/bin/env python3
"""
Smart Equipment Ecosystem
IoT integration for equipment monitoring and predictive maintenance
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from realtime_service import realtime_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/equipment", tags=["Smart Equipment"])

# MongoDB collections (imported from main)
from server import db

equipment_collection = db.equipment
equipment_readings_collection = db.equipment_readings
maintenance_log_collection = db.maintenance_log

# ========== Request Models ==========

class EquipmentCreateRequest(BaseModel):
    name: str
    type: str  # plow, truck, spreader, shovel, blower
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    serial_number: Optional[str] = None
    iot_device_id: Optional[str] = None
    status: str = "active"  # active, maintenance, retired


class IoTReadingRequest(BaseModel):
    equipment_id: str
    reading_type: str  # temperature, fuel_level, engine_hours, location, vibration
    value: float
    unit: str
    metadata: Optional[Dict] = None


class MaintenanceScheduleRequest(BaseModel):
    equipment_id: str
    maintenance_type: str  # routine, repair, inspection
    scheduled_date: str
    description: str
    estimated_cost: Optional[float] = None


# ========== Create Equipment ==========

@router.post("/")
async def create_equipment(request: EquipmentCreateRequest):
    """Register new equipment in the system"""
    try:
        equipment_data = {
            "name": request.name,
            "type": request.type,
            "make": request.make,
            "model": request.model,
            "year": request.year,
            "serial_number": request.serial_number,
            "iot_device_id": request.iot_device_id,
            "status": request.status,
            "health_score": 100.0,  # Initial perfect health
            "total_hours": 0.0,
            "last_maintenance": None,
            "next_maintenance_due": datetime.utcnow() + timedelta(days=90),  # 3 months
            "alerts": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = await equipment_collection.insert_one(equipment_data)
        
        logger.info(f"Created equipment: {request.name} ({result.inserted_id})")
        
        return {
            "success": True,
            "equipment_id": str(result.inserted_id),
            "message": "Equipment registered successfully",
        }
        
    except Exception as e:
        logger.error(f"Error creating equipment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get All Equipment ==========

@router.get("/")
async def get_all_equipment(
    status: Optional[str] = None,
    type: Optional[str] = None,
    health_threshold: Optional[float] = None,
):
    """Get all equipment with optional filters"""
    try:
        query = {}
        
        if status:
            query["status"] = status
        
        if type:
            query["type"] = type
        
        if health_threshold:
            query["health_score"] = {"$lt": health_threshold}
        
        equipment_cursor = equipment_collection.find(query).sort("name", 1)
        equipment_list = await equipment_cursor.to_list(None)
        
        formatted = []
        for eq in equipment_list:
            formatted.append({
                "id": str(eq["_id"]),
                "name": eq.get("name"),
                "type": eq.get("type"),
                "make": eq.get("make"),
                "model": eq.get("model"),
                "year": eq.get("year"),
                "status": eq.get("status"),
                "health_score": eq.get("health_score", 100.0),
                "total_hours": eq.get("total_hours", 0.0),
                "iot_device_id": eq.get("iot_device_id"),
                "last_maintenance": eq.get("last_maintenance").isoformat() if eq.get("last_maintenance") else None,
                "next_maintenance_due": eq.get("next_maintenance_due").isoformat() if eq.get("next_maintenance_due") else None,
                "alerts": eq.get("alerts", []),
            })
        
        # Calculate summary stats
        total = len(formatted)
        active = sum(1 for e in formatted if e["status"] == "active")
        needs_maintenance = sum(1 for e in formatted if e["health_score"] < 70)
        
        return {
            "success": True,
            "equipment": formatted,
            "summary": {
                "total": total,
                "active": active,
                "maintenance": sum(1 for e in formatted if e["status"] == "maintenance"),
                "retired": sum(1 for e in formatted if e["status"] == "retired"),
                "needs_maintenance": needs_maintenance,
                "average_health": sum(e["health_score"] for e in formatted) / total if total > 0 else 0,
            },
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Equipment Details ==========

@router.get("/{equipment_id}")
async def get_equipment_details(equipment_id: str):
    """Get detailed equipment information"""
    try:
        equipment = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        # Get recent readings
        readings_cursor = equipment_readings_collection.find({
            "equipment_id": equipment_id
        }).sort("timestamp", -1).limit(100)
        readings = await readings_cursor.to_list(100)
        
        # Get maintenance history
        maintenance_cursor = maintenance_log_collection.find({
            "equipment_id": equipment_id
        }).sort("date", -1).limit(20)
        maintenance_history = await maintenance_cursor.to_list(20)
        
        return {
            "success": True,
            "equipment": {
                "id": str(equipment["_id"]),
                "name": equipment.get("name"),
                "type": equipment.get("type"),
                "make": equipment.get("make"),
                "model": equipment.get("model"),
                "year": equipment.get("year"),
                "serial_number": equipment.get("serial_number"),
                "iot_device_id": equipment.get("iot_device_id"),
                "status": equipment.get("status"),
                "health_score": equipment.get("health_score", 100.0),
                "total_hours": equipment.get("total_hours", 0.0),
                "last_maintenance": equipment.get("last_maintenance").isoformat() if equipment.get("last_maintenance") else None,
                "next_maintenance_due": equipment.get("next_maintenance_due").isoformat() if equipment.get("next_maintenance_due") else None,
                "alerts": equipment.get("alerts", []),
            },
            "recent_readings": [
                {
                    "reading_type": r.get("reading_type"),
                    "value": r.get("value"),
                    "unit": r.get("unit"),
                    "timestamp": r.get("timestamp").isoformat() if r.get("timestamp") else None,
                }
                for r in readings
            ],
            "maintenance_history": [
                {
                    "type": m.get("maintenance_type"),
                    "description": m.get("description"),
                    "cost": m.get("cost"),
                    "date": m.get("date").isoformat() if m.get("date") else None,
                }
                for m in maintenance_history
            ],
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting equipment details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Log IoT Reading ==========

@router.post("/readings")
async def log_iot_reading(request: IoTReadingRequest, background_tasks: BackgroundTasks):
    """
    Log sensor reading from IoT device
    Analyzes reading and generates alerts if needed
    """
    try:
        reading_data = {
            "equipment_id": request.equipment_id,
            "reading_type": request.reading_type,
            "value": request.value,
            "unit": request.unit,
            "metadata": request.metadata or {},
            "timestamp": datetime.utcnow(),
        }
        
        await equipment_readings_collection.insert_one(reading_data)
        
        # Analyze reading for anomalies
        background_tasks.add_task(
            analyze_equipment_reading,
            request.equipment_id,
            request.reading_type,
            request.value
        )
        
        return {
            "success": True,
            "message": "Reading logged successfully",
        }
        
    except Exception as e:
        logger.error(f"Error logging IoT reading: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Analyze Equipment Reading ==========

async def analyze_equipment_reading(equipment_id: str, reading_type: str, value: float):
    """
    Background task to analyze readings and generate alerts
    """
    try:
        equipment = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
        if not equipment:
            return
        
        alerts = []
        health_impact = 0
        
        # Define thresholds
        thresholds = {
            "temperature": {"warning": 90, "critical": 105, "unit": "°C"},
            "fuel_level": {"warning": 25, "critical": 10, "unit": "%", "inverted": True},
            "vibration": {"warning": 5.0, "critical": 8.0, "unit": "mm/s"},
            "engine_hours": {"milestone": 1000},  # Every 1000 hours
        }
        
        if reading_type in thresholds:
            config = thresholds[reading_type]
            
            if reading_type == "engine_hours":
                # Check for maintenance milestone
                if value % config["milestone"] < 10:  # Within 10 hours of milestone
                    alerts.append({
                        "type": "maintenance_due",
                        "severity": "warning",
                        "message": f"Approaching {value} engine hours - maintenance recommended",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                    
                # Update total hours
                await equipment_collection.update_one(
                    {"_id": ObjectId(equipment_id)},
                    {"$set": {"total_hours": value}}
                )
            else:
                # Check thresholds
                inverted = config.get("inverted", False)
                
                if inverted:
                    # Lower is worse (e.g., fuel level)
                    if value <= config["critical"]:
                        alerts.append({
                            "type": "critical",
                            "severity": "critical",
                            "message": f"{reading_type.replace('_', ' ').title()} critically low: {value}{config['unit']}",
                            "timestamp": datetime.utcnow().isoformat(),
                        })
                        health_impact = -15
                    elif value <= config["warning"]:
                        alerts.append({
                            "type": "warning",
                            "severity": "warning",
                            "message": f"{reading_type.replace('_', ' ').title()} low: {value}{config['unit']}",
                            "timestamp": datetime.utcnow().isoformat(),
                        })
                        health_impact = -5
                else:
                    # Higher is worse (e.g., temperature, vibration)
                    if value >= config["critical"]:
                        alerts.append({
                            "type": "critical",
                            "severity": "critical",
                            "message": f"{reading_type.replace('_', ' ').title()} critically high: {value}{config['unit']}",
                            "timestamp": datetime.utcnow().isoformat(),
                        })
                        health_impact = -20
                    elif value >= config["warning"]:
                        alerts.append({
                            "type": "warning",
                            "severity": "warning",
                            "message": f"{reading_type.replace('_', ' ').title()} high: {value}{config['unit']}",
                            "timestamp": datetime.utcnow().isoformat(),
                        })
                        health_impact = -10
        
        # Update equipment if alerts generated
        if alerts or health_impact != 0:
            new_health = max(0, min(100, equipment.get("health_score", 100) + health_impact))
            
            update_data = {
                "updated_at": datetime.utcnow(),
                "health_score": new_health,
            }
            
            if alerts:
                # Add new alerts to existing ones (keep last 10)
                existing_alerts = equipment.get("alerts", [])
                all_alerts = alerts + existing_alerts
                update_data["alerts"] = all_alerts[:10]  # Keep only recent 10
            
            await equipment_collection.update_one(
                {"_id": ObjectId(equipment_id)},
                {"$set": update_data}
            )
            
            # Send real-time alert for critical issues
            if any(a["severity"] == "critical" for a in alerts):
                await realtime_service.emit_event({
                    "type": "equipment_alert",
                    "equipment_id": equipment_id,
                    "equipment_name": equipment.get("name"),
                    "alerts": alerts,
                    "health_score": new_health,
                })
            
            logger.info(f"Equipment {equipment_id} health updated to {new_health}% with {len(alerts)} new alerts")
        
    except Exception as e:
        logger.error(f"Error analyzing equipment reading: {e}")


# ========== Schedule Maintenance ==========

@router.post("/maintenance/schedule")
async def schedule_maintenance(request: MaintenanceScheduleRequest):
    """Schedule maintenance for equipment"""
    try:
        scheduled_date = datetime.fromisoformat(request.scheduled_date)
        
        maintenance_data = {
            "equipment_id": request.equipment_id,
            "maintenance_type": request.maintenance_type,
            "description": request.description,
            "scheduled_date": scheduled_date,
            "estimated_cost": request.estimated_cost,
            "status": "scheduled",
            "created_at": datetime.utcnow(),
        }
        
        result = await maintenance_log_collection.insert_one(maintenance_data)
        
        # Update equipment next maintenance date
        await equipment_collection.update_one(
            {"_id": ObjectId(request.equipment_id)},
            {"$set": {"next_maintenance_due": scheduled_date}}
        )
        
        return {
            "success": True,
            "maintenance_id": str(result.inserted_id),
            "message": "Maintenance scheduled successfully",
        }
        
    except Exception as e:
        logger.error(f"Error scheduling maintenance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Complete Maintenance ==========

@router.post("/maintenance/{maintenance_id}/complete")
async def complete_maintenance(
    maintenance_id: str,
    actual_cost: Optional[float] = None,
    notes: Optional[str] = None
):
    """Mark maintenance as complete"""
    try:
        update_data = {
            "status": "completed",
            "completed_at": datetime.utcnow(),
        }
        
        if actual_cost is not None:
            update_data["actual_cost"] = actual_cost
        
        if notes:
            update_data["notes"] = notes
        
        result = await maintenance_log_collection.update_one(
            {"_id": ObjectId(maintenance_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Maintenance record not found")
        
        # Get maintenance record to update equipment
        maintenance = await maintenance_log_collection.find_one({"_id": ObjectId(maintenance_id)})
        
        # Update equipment health and last maintenance
        await equipment_collection.update_one(
            {"_id": ObjectId(maintenance["equipment_id"])},
            {
                "$set": {
                    "last_maintenance": datetime.utcnow(),
                    "health_score": min(100, await get_equipment_health(maintenance["equipment_id"]) + 20),  # Boost health
                    "alerts": [],  # Clear alerts
                }
            }
        )
        
        return {
            "success": True,
            "message": "Maintenance completed successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing maintenance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Equipment Health Score ==========

async def get_equipment_health(equipment_id: str) -> float:
    """Helper to get current equipment health score"""
    equipment = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
    return equipment.get("health_score", 100.0) if equipment else 100.0


# ========== Equipment Dashboard ==========

@router.get("/dashboard/stats")
async def get_equipment_dashboard():
    """Get equipment dashboard statistics"""
    try:
        # Get all equipment
        equipment_cursor = equipment_collection.find({})
        all_equipment = await equipment_cursor.to_list(None)
        
        total_equipment = len(all_equipment)
        active_equipment = sum(1 for e in all_equipment if e.get("status") == "active")
        
        # Equipment needing maintenance (health < 70 or overdue)
        needs_maintenance = 0
        overdue_maintenance = 0
        now = datetime.utcnow()
        
        for eq in all_equipment:
            if eq.get("health_score", 100) < 70:
                needs_maintenance += 1
            
            next_maintenance = eq.get("next_maintenance_due")
            if next_maintenance and next_maintenance < now:
                overdue_maintenance += 1
        
        # Get recent alerts
        recent_alerts = []
        for eq in all_equipment:
            for alert in eq.get("alerts", [])[:3]:  # Top 3 alerts per equipment
                recent_alerts.append({
                    "equipment_id": str(eq["_id"]),
                    "equipment_name": eq.get("name"),
                    "alert": alert,
                })
        
        # Sort by timestamp (most recent first)
        recent_alerts.sort(key=lambda x: x["alert"]["timestamp"], reverse=True)
        
        # Average health
        avg_health = sum(e.get("health_score", 100) for e in all_equipment) / total_equipment if total_equipment > 0 else 100
        
        # Total operating hours
        total_hours = sum(e.get("total_hours", 0) for e in all_equipment)
        
        return {
            "success": True,
            "stats": {
                "total_equipment": total_equipment,
                "active_equipment": active_equipment,
                "needs_maintenance": needs_maintenance,
                "overdue_maintenance": overdue_maintenance,
                "average_health": round(avg_health, 1),
                "total_operating_hours": round(total_hours, 1),
            },
            "recent_alerts": recent_alerts[:10],  # Top 10 most recent
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Predictive Maintenance ==========

@router.get("/{equipment_id}/predict-maintenance")
async def predict_maintenance_needs(equipment_id: str):
    """
    Predict when maintenance will be needed
    Based on current health trend and usage patterns
    """
    try:
        equipment = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        current_health = equipment.get("health_score", 100)
        total_hours = equipment.get("total_hours", 0)
        
        # Simple prediction model
        # In production, use ML models
        
        # Calculate health degradation rate (assume 5 points per 100 hours)
        degradation_rate = 5 / 100  # points per hour
        
        # Calculate hours until maintenance needed (health < 70)
        if current_health > 70:
            hours_until_maintenance = (current_health - 70) / degradation_rate
            days_until_maintenance = hours_until_maintenance / 8  # Assuming 8 hours per day
            
            predicted_date = datetime.utcnow() + timedelta(days=days_until_maintenance)
            
            return {
                "success": True,
                "equipment_id": equipment_id,
                "current_health": current_health,
                "predicted_maintenance_date": predicted_date.isoformat(),
                "days_until_maintenance": round(days_until_maintenance, 1),
                "confidence": "medium",  # Would be calculated by ML model
                "recommendation": f"Schedule maintenance in approximately {round(days_until_maintenance)} days",
            }
        else:
            return {
                "success": True,
                "equipment_id": equipment_id,
                "current_health": current_health,
                "predicted_maintenance_date": datetime.utcnow().isoformat(),
                "days_until_maintenance": 0,
                "confidence": "high",
                "recommendation": "Immediate maintenance required",
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting maintenance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Equipment Availability Status ==========

@router.get("/availability-status")
async def get_equipment_availability_status():
    """
    Get real-time availability status for all equipment
    Returns status: available, in_use, maintenance for each equipment
    """
    try:
        # Get all equipment
        all_equipment = await equipment_collection.find({}).to_list(length=None)
        
        # Get active work orders to check which equipment is in use
        work_orders_collection = db["work_orders"]
        active_work_orders = await work_orders_collection.find({
            "status": {"$in": ["pending", "in_progress"]}
        }).to_list(length=None)
        
        # Build set of equipment IDs that are currently in use
        equipment_in_use = set()
        for wo in active_work_orders:
            if wo.get("equipment_needed"):
                for eq in wo["equipment_needed"]:
                    equipment_in_use.add(eq)
        
        # Get maintenance schedules
        upcoming_maintenance = await maintenance_log_collection.find({
            "status": {"$in": ["scheduled", "in_progress"]},
            "scheduled_date": {"$gte": datetime.utcnow().isoformat()[:10]}
        }).to_list(length=None)
        
        equipment_in_maintenance = set()
        for maint in upcoming_maintenance:
            equipment_in_maintenance.add(maint.get("equipment_id"))
        
        # Build availability status for each equipment
        availability_status = []
        for equipment in all_equipment:
            equipment_id = str(equipment["_id"])
            equipment_name = equipment.get("name")
            
            # Determine status
            if equipment_id in equipment_in_maintenance or equipment.get("status") == "maintenance":
                status = "maintenance"
                available_in = "Unknown"
                current_location = "Maintenance Shop"
            elif equipment_id in equipment_in_use:
                status = "in_use"
                # Try to find which work order is using it
                current_wo = next((wo for wo in active_work_orders 
                                  if equipment_id in wo.get("equipment_needed", [])), None)
                if current_wo:
                    available_in = "2-4 hours"  # Estimate
                    current_location = current_wo.get("site_address", "On Job Site")
                else:
                    available_in = "Unknown"
                    current_location = "In Use"
            else:
                status = "available"
                available_in = None
                current_location = "Equipment Yard"
            
            availability_status.append({
                "equipment_id": equipment_id,
                "name": equipment_name,
                "type": equipment.get("type"),
                "status": status,
                "available_in": available_in,
                "current_location": current_location,
                "last_used": equipment.get("last_used"),
                "health_score": equipment.get("health_score", 100.0)
            })
        
        return {
            "success": True,
            "equipment": availability_status,
            "summary": {
                "total": len(availability_status),
                "available": len([e for e in availability_status if e["status"] == "available"]),
                "in_use": len([e for e in availability_status if e["status"] == "in_use"]),
                "maintenance": len([e for e in availability_status if e["status"] == "maintenance"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{equipment_id}/availability")
async def get_single_equipment_availability(equipment_id: str):
    """Get availability status for a single equipment item"""
    try:
        # Get all statuses
        all_status = await get_equipment_availability_status()
        
        # Find specific equipment
        equipment_status = next(
            (e for e in all_status["equipment"] if e["equipment_id"] == equipment_id),
            None
        )
        
        if not equipment_status:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        return {
            "success": True,
            "equipment": equipment_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting single equipment availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))


logger.info("Smart equipment ecosystem routes initialized successfully")
