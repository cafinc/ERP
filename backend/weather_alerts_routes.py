#!/usr/bin/env python3
"""
Weather Alerts API Routes
Real-time weather monitoring and alert system
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import logging

from weather_dispatch import weather_dispatch
from weather_service import weather_service
from realtime_service import realtime_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather-alerts", tags=["Weather Alerts"])

# ========== Request Models ==========

class WeatherForecastRequest(BaseModel):
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ManualDispatchRequest(BaseModel):
    snow_forecast: float
    forecast_time: str
    location: str
    customer_ids: Optional[List[str]] = None


class AlertPreferencesRequest(BaseModel):
    user_id: str
    email_alerts: bool = True
    sms_alerts: bool = True
    in_app_alerts: bool = True
    min_snow_threshold: float = 1.0


# ========== Get Current Weather ==========

@router.get("/current")
async def get_current_weather(
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
):
    """
    Get current weather conditions
    Can provide either location name or coordinates
    """
    try:
        if latitude and longitude:
            weather_data = await weather_service.get_weather_by_coordinates(latitude, longitude)
        elif location:
            weather_data = await weather_service.get_weather_by_location(location)
        else:
            # Default to business location
            weather_data = await weather_service.get_current_weather()
        
        return {
            "success": True,
            "weather": weather_data
        }
        
    except Exception as e:
        logger.error(f"Error getting current weather: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Weather Forecast ==========

@router.get("/forecast")
async def get_weather_forecast(
    location: Optional[str] = None,
    days: int = Query(5, ge=1, le=10)
):
    """
    Get multi-day weather forecast
    Includes snow accumulation predictions
    """
    try:
        forecast_data = await weather_service.get_forecast(location=location, days=days)
        
        return {
            "success": True,
            "forecast": forecast_data,
            "days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting weather forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Process Weather Alert ==========

@router.post("/process-forecast")
async def process_weather_forecast(
    request: WeatherForecastRequest,
    background_tasks: BackgroundTasks
):
    """
    Process weather forecast and trigger automatic dispatch if needed
    Called by background scheduler or manually by admin
    """
    try:
        # Get forecast
        if request.latitude and request.longitude:
            forecast = await weather_service.get_weather_by_coordinates(
                request.latitude, 
                request.longitude
            )
        else:
            forecast = await weather_service.get_weather_by_location(request.location)
        
        # Extract snow prediction
        snow_forecast = forecast.get("snow_accumulation_inches", 0)
        
        forecast_data = {
            "location": request.location,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "snow_accumulation_inches": snow_forecast,
            "forecast_time": datetime.utcnow() + timedelta(hours=6),  # 6-hour forecast
            "temperature": forecast.get("temperature"),
            "conditions": forecast.get("conditions")
        }
        
        # Process in background
        background_tasks.add_task(
            weather_dispatch.process_weather_forecast,
            forecast_data
        )
        
        return {
            "success": True,
            "message": "Weather forecast processing initiated",
            "snow_forecast": snow_forecast,
            "location": request.location
        }
        
    except Exception as e:
        logger.error(f"Error processing weather forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Manual Dispatch Trigger ==========

@router.post("/manual-dispatch")
async def trigger_manual_dispatch(request: ManualDispatchRequest):
    """
    Manually trigger weather-based dispatch
    For admin override when automatic dispatch isn't triggered
    """
    try:
        forecast_time = datetime.fromisoformat(request.forecast_time)
        
        forecast_data = {
            "location": request.location,
            "snow_accumulation_inches": request.snow_forecast,
            "forecast_time": forecast_time,
            "manual_trigger": True
        }
        
        result = await weather_dispatch.process_weather_forecast(forecast_data)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in manual dispatch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Dispatch Queue ==========

@router.get("/dispatch-queue")
async def get_dispatch_queue():
    """
    Get current dispatch queue created by weather automation
    Shows pending work orders waiting for crew assignment
    """
    try:
        result = await weather_dispatch.get_dispatch_queue()
        return result
        
    except Exception as e:
        logger.error(f"Error getting dispatch queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Weather Alerts History ==========

@router.get("/alerts-history")
async def get_alerts_history(
    days: int = Query(7, ge=1, le=30),
    severity: Optional[str] = None
):
    """
    Get history of weather alerts sent
    """
    try:
        from weather_dispatch import weather_forecasts_collection
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = {
            "processed_at": {"$gte": start_date}
        }
        
        if severity:
            query["severity"] = severity
        
        alerts = await weather_forecasts_collection.find(query).sort("processed_at", -1).to_list(100)
        
        formatted_alerts = []
        for alert in alerts:
            formatted_alerts.append({
                "id": str(alert["_id"]),
                "location": alert.get("location"),
                "snow_accumulation": alert.get("snow_accumulation_inches"),
                "forecast_time": alert.get("forecast_time").isoformat() if alert.get("forecast_time") else None,
                "processed_at": alert.get("processed_at").isoformat() if alert.get("processed_at") else None,
                "status": alert.get("status")
            })
        
        return {
            "success": True,
            "alerts": formatted_alerts,
            "total": len(formatted_alerts)
        }
        
    except Exception as e:
        logger.error(f"Error getting alerts history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Weather Alert Preferences ==========

@router.post("/preferences")
async def set_alert_preferences(request: AlertPreferencesRequest):
    """
    Set weather alert preferences for a user
    """
    try:
        from weather_dispatch import db
        
        preferences = {
            "user_id": request.user_id,
            "email_alerts": request.email_alerts,
            "sms_alerts": request.sms_alerts,
            "in_app_alerts": request.in_app_alerts,
            "min_snow_threshold": request.min_snow_threshold,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.weather_alert_preferences.update_one(
            {"user_id": request.user_id},
            {"$set": preferences},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Preferences updated",
            "preferences": preferences
        }
        
    except Exception as e:
        logger.error(f"Error setting alert preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences/{user_id}")
async def get_alert_preferences(user_id: str):
    """Get weather alert preferences for a user"""
    try:
        from weather_dispatch import db
        
        preferences = await db.weather_alert_preferences.find_one({"user_id": user_id})
        
        if not preferences:
            # Return defaults
            return {
                "success": True,
                "preferences": {
                    "user_id": user_id,
                    "email_alerts": True,
                    "sms_alerts": True,
                    "in_app_alerts": True,
                    "min_snow_threshold": 1.0
                }
            }
        
        return {
            "success": True,
            "preferences": {
                "user_id": preferences.get("user_id"),
                "email_alerts": preferences.get("email_alerts", True),
                "sms_alerts": preferences.get("sms_alerts", True),
                "in_app_alerts": preferences.get("in_app_alerts", True),
                "min_snow_threshold": preferences.get("min_snow_threshold", 1.0)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting alert preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Send Test Alert ==========

@router.post("/test-alert")
async def send_test_alert(user_id: str, snow_amount: float = 2.0):
    """
    Send test weather alert to verify notification system
    Useful for testing alert preferences
    """
    try:
        # Send test notification
        await realtime_service.emit_weather_alert({
            "snow_forecast": snow_amount,
            "location": "Test Location",
            "severity": "medium",
            "action": "test",
            "test_mode": True
        })
        
        # Also send to specific user
        await realtime_service.emit_notification(
            user_id=user_id,
            notification_data={
                "type": "weather_alert",
                "title": f"Test Weather Alert: {snow_amount}\" Snow",
                "message": "This is a test weather alert. Your alerts are working correctly!",
                "test": True
            }
        )
        
        return {
            "success": True,
            "message": "Test alert sent",
            "user_id": user_id,
            "snow_amount": snow_amount
        }
        
    except Exception as e:
        logger.error(f"Error sending test alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Weather Statistics ==========

@router.get("/statistics")
async def get_weather_statistics(days: int = Query(30, ge=1, le=90)):
    """
    Get weather and dispatch statistics
    Useful for reporting and analysis
    """
    try:
        from weather_dispatch import weather_forecasts_collection, work_orders_collection
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Count forecasts processed
        total_forecasts = await weather_forecasts_collection.count_documents({
            "processed_at": {"$gte": start_date}
        })
        
        # Count weather-triggered work orders
        weather_work_orders = await work_orders_collection.count_documents({
            "weather_triggered": True,
            "created_at": {"$gte": start_date}
        })
        
        # Get average snow per forecast
        pipeline = [
            {"$match": {"processed_at": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "avg_snow": {"$avg": "$snow_accumulation_inches"},
                "max_snow": {"$max": "$snow_accumulation_inches"},
                "total_forecasts": {"$sum": 1}
            }}
        ]
        
        stats = await weather_forecasts_collection.aggregate(pipeline).to_list(1)
        
        if stats:
            stat = stats[0]
            return {
                "success": True,
                "period_days": days,
                "total_forecasts": stat.get("total_forecasts", 0),
                "avg_snow_accumulation": round(stat.get("avg_snow", 0), 2),
                "max_snow_accumulation": round(stat.get("max_snow", 0), 2),
                "weather_triggered_work_orders": weather_work_orders
            }
        else:
            return {
                "success": True,
                "period_days": days,
                "total_forecasts": 0,
                "avg_snow_accumulation": 0,
                "max_snow_accumulation": 0,
                "weather_triggered_work_orders": 0
            }
        
    except Exception as e:
        logger.error(f"Error getting weather statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


logger.info("Weather alerts routes initialized successfully")
