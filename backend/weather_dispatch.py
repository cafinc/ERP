#!/usr/bin/env python3
"""
Weather-Driven Dispatch Automation
Automatically creates work orders and assigns crews based on weather forecasts
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from realtime_service import realtime_service, EventType
from fleet_tracking import fleet_tracking

load_dotenv()

logger = logging.getLogger(__name__)

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Collections
customers_collection = db["customers"]
projects_collection = db["projects"]
work_orders_collection = db["work_orders"]
weather_forecasts_collection = db["weather_forecasts"]
dispatch_queue_collection = db["dispatch_queue"]
notifications_collection = db["notifications"]

class WeatherDispatchAutomation:
    """Automates crew dispatch based on weather conditions"""
    
    # Snow accumulation thresholds (inches)
    THRESHOLDS = {
        "light": 1.0,      # 1 inch - monitoring
        "moderate": 2.0,   # 2 inches - prepare
        "heavy": 4.0,      # 4 inches - dispatch
        "severe": 8.0      # 8+ inches - all hands
    }
    
    @staticmethod
    async def process_weather_forecast(forecast_data: Dict) -> Dict:
        """
        Process weather forecast and trigger automatic dispatching
        Called by background scheduler when new forecast received
        """
        try:
            snow_forecast = forecast_data.get("snow_accumulation_inches", 0)
            forecast_time = forecast_data.get("forecast_time", datetime.utcnow())
            location = forecast_data.get("location", "Unknown")
            
            logger.info(f"Processing forecast: {snow_forecast}\" snow at {location}")
            
            # Store forecast
            await weather_forecasts_collection.insert_one({
                **forecast_data,
                "processed_at": datetime.utcnow(),
                "status": "processed"
            })
            
            # Determine action based on snow amount
            if snow_forecast >= WeatherDispatchAutomation.THRESHOLDS["heavy"]:
                # Heavy snow - auto-dispatch
                result = await WeatherDispatchAutomation._auto_dispatch_crews(
                    snow_forecast, forecast_time, location
                )
                severity = "high"
            elif snow_forecast >= WeatherDispatchAutomation.THRESHOLDS["moderate"]:
                # Moderate snow - prepare and notify
                result = await WeatherDispatchAutomation._prepare_dispatch(
                    snow_forecast, forecast_time, location
                )
                severity = "medium"
            elif snow_forecast >= WeatherDispatchAutomation.THRESHOLDS["light"]:
                # Light snow - monitor and alert customers
                result = await WeatherDispatchAutomation._send_customer_alerts(
                    snow_forecast, forecast_time, location
                )
                severity = "low"
            else:
                # No action needed
                return {
                    "success": True,
                    "action": "none",
                    "snow_forecast": snow_forecast,
                    "message": "No dispatch required"
                }
            
            # Broadcast weather alert
            await realtime_service.emit_weather_alert({
                "snow_forecast": snow_forecast,
                "location": location,
                "severity": severity,
                "action": result.get("action"),
                "dispatch_count": result.get("dispatches_created", 0)
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing weather forecast: {e}")
            raise
    
    @staticmethod
    async def _auto_dispatch_crews(snow_forecast: float, forecast_time: datetime, location: str) -> Dict:
        """
        Automatically create work orders and assign crews for heavy snow
        """
        try:
            # Get all active seasonal contracts in the affected area
            contracts = await projects_collection.find({
                "status": "active",
                "project_type": {"$in": ["seasonal_contract", "recurring"]},
                "service_types": {"$in": ["snow_plowing", "snow_removal", "full_service"]}
            }).to_list(1000)
            
            dispatches_created = 0
            crews_assigned = 0
            customers_notified = []
            
            for contract in contracts:
                # Check if already has pending work order
                existing_wo = await work_orders_collection.find_one({
                    "project_id": str(contract["_id"]),
                    "status": {"$in": ["pending", "in_progress"]},
                    "scheduled_date": {
                        "$gte": datetime.utcnow(),
                        "$lte": forecast_time + timedelta(hours=24)
                    }
                })
                
                if existing_wo:
                    logger.info(f"Work order already exists for project {contract['_id']}")
                    continue
                
                # Create automatic work order
                work_order = {
                    "customer_id": contract["customer_id"],
                    "customer_name": contract.get("customer_name", "Unknown"),
                    "project_id": str(contract["_id"]),
                    "project_name": contract["name"],
                    "service_type": "snow_plowing",
                    "property_address": contract.get("properties", [""])[0],
                    "description": f"Auto-dispatch: {snow_forecast}\" snow forecast",
                    "status": "pending",
                    "priority": "high" if snow_forecast >= WeatherDispatchAutomation.THRESHOLDS["severe"] else "medium",
                    "scheduled_date": forecast_time,
                    "estimated_amount": contract.get("budget", 0) / contract.get("work_orders_count", 1) if contract.get("work_orders_count") else 0,
                    "assigned_crew": [],
                    "auto_created": True,
                    "weather_triggered": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = await work_orders_collection.insert_one(work_order)
                work_order_id = str(result.inserted_id)
                dispatches_created += 1
                
                # Update project
                await projects_collection.update_one(
                    {"_id": contract["_id"]},
                    {
                        "$push": {"work_orders": work_order_id},
                        "$inc": {"work_orders_count": 1}
                    }
                )
                
                # Try to auto-assign nearest available crew
                property_coords = await WeatherDispatchAutomation._get_property_coordinates(
                    contract.get("properties", [""])[0]
                )
                
                if property_coords:
                    nearest_crew = await fleet_tracking.get_nearest_available_crew(
                        latitude=property_coords["latitude"],
                        longitude=property_coords["longitude"],
                        max_distance_km=30.0
                    )
                    
                    if nearest_crew:
                        # Assign crew
                        await work_orders_collection.update_one(
                            {"_id": result.inserted_id},
                            {
                                "$set": {
                                    "assigned_crew": [nearest_crew["crew_id"]],
                                    "assigned_at": datetime.utcnow()
                                }
                            }
                        )
                        crews_assigned += 1
                        
                        # Notify crew
                        await realtime_service.emit_task_event(
                            EventType.WORK_ORDER_ASSIGNED,
                            {
                                "work_order_id": work_order_id,
                                "customer_name": work_order["customer_name"],
                                "service_type": work_order["service_type"],
                                "scheduled_date": forecast_time.isoformat()
                            },
                            affected_users=[nearest_crew["crew_id"]]
                        )
                
                # Notify customer
                customer = await customers_collection.find_one({"_id": ObjectId(contract["customer_id"])})
                if customer and customer.get("email"):
                    customers_notified.append(customer["email"])
                    # Would send email here
                
                # Broadcast work order created
                await realtime_service.emit_work_order_event(
                    EventType.WORK_ORDER_CREATED,
                    {
                        "id": work_order_id,
                        "customer_name": work_order["customer_name"],
                        "service_type": work_order["service_type"],
                        "auto_created": True,
                        "weather_triggered": True
                    }
                )
            
            logger.info(f"Auto-dispatch complete: {dispatches_created} work orders, {crews_assigned} crews assigned")
            
            return {
                "success": True,
                "action": "auto_dispatch",
                "snow_forecast": snow_forecast,
                "dispatches_created": dispatches_created,
                "crews_assigned": crews_assigned,
                "customers_notified": len(customers_notified),
                "message": f"Automatically created {dispatches_created} work orders"
            }
            
        except Exception as e:
            logger.error(f"Error in auto-dispatch: {e}")
            raise
    
    @staticmethod
    async def _prepare_dispatch(snow_forecast: float, forecast_time: datetime, location: str) -> Dict:
        """
        Prepare for dispatch - alert admins and crews, don't auto-create yet
        """
        try:
            # Get count of customers needing service
            contract_count = await projects_collection.count_documents({
                "status": "active",
                "project_type": {"$in": ["seasonal_contract", "recurring"]},
                "service_types": {"$in": ["snow_plowing", "snow_removal"]}
            })
            
            # Get available crew count
            fleet_overview = await fleet_tracking.get_fleet_overview()
            available_crews = fleet_overview.get("summary", {}).get("available", 0)
            
            # Send alert to admins
            await realtime_service.emit_system_alert({
                "message": f"⚠️ {snow_forecast}\" snow forecast - Prepare for dispatch",
                "snow_forecast": snow_forecast,
                "forecast_time": forecast_time.isoformat(),
                "contracts_affected": contract_count,
                "available_crews": available_crews,
                "recommended_action": "Review dispatch queue and pre-assign crews"
            }, severity="warning")
            
            # Create dispatch queue items
            contracts = await projects_collection.find({
                "status": "active",
                "project_type": {"$in": ["seasonal_contract", "recurring"]}
            }).to_list(100)
            
            queue_items = []
            for contract in contracts:
                queue_item = {
                    "project_id": str(contract["_id"]),
                    "customer_id": contract["customer_id"],
                    "customer_name": contract.get("customer_name", "Unknown"),
                    "snow_forecast": snow_forecast,
                    "forecast_time": forecast_time,
                    "priority": contract.get("priority", "medium"),
                    "status": "pending",
                    "created_at": datetime.utcnow()
                }
                queue_items.append(queue_item)
            
            if queue_items:
                await dispatch_queue_collection.insert_many(queue_items)
            
            logger.info(f"Dispatch preparation: {len(queue_items)} items queued")
            
            return {
                "success": True,
                "action": "prepare_dispatch",
                "snow_forecast": snow_forecast,
                "queued_items": len(queue_items),
                "available_crews": available_crews,
                "message": f"Prepared dispatch queue with {len(queue_items)} customers"
            }
            
        except Exception as e:
            logger.error(f"Error preparing dispatch: {e}")
            raise
    
    @staticmethod
    async def _send_customer_alerts(snow_forecast: float, forecast_time: datetime, location: str) -> Dict:
        """
        Send proactive alerts to customers about upcoming snow
        """
        try:
            # Get customers with active contracts
            contracts = await projects_collection.find({
                "status": "active",
                "project_type": {"$in": ["seasonal_contract", "recurring"]}
            }).to_list(1000)
            
            alerts_sent = 0
            
            for contract in contracts:
                customer = await customers_collection.find_one({
                    "_id": ObjectId(contract["customer_id"])
                })
                
                if not customer:
                    continue
                
                # Create notification
                notification = {
                    "user_id": contract["customer_id"],
                    "type": "weather_alert",
                    "title": f"Snow Forecast: {snow_forecast}\"",
                    "message": f"Light snow expected at {forecast_time.strftime('%I:%M %p')}. Your property will be monitored.",
                    "data": {
                        "snow_forecast": snow_forecast,
                        "forecast_time": forecast_time.isoformat(),
                        "project_id": str(contract["_id"])
                    },
                    "read": False,
                    "created_at": datetime.utcnow()
                }
                
                await notifications_collection.insert_one(notification)
                
                # Send real-time notification if customer is online
                await realtime_service.emit_notification(
                    user_id=contract["customer_id"],
                    notification_data=notification
                )
                
                alerts_sent += 1
            
            logger.info(f"Customer alerts sent: {alerts_sent}")
            
            return {
                "success": True,
                "action": "customer_alerts",
                "snow_forecast": snow_forecast,
                "alerts_sent": alerts_sent,
                "message": f"Sent alerts to {alerts_sent} customers"
            }
            
        except Exception as e:
            logger.error(f"Error sending customer alerts: {e}")
            raise
    
    @staticmethod
    async def _get_property_coordinates(address: str) -> Optional[Dict]:
        """
        Get latitude/longitude for property address
        In production, would use Google Maps Geocoding API
        For now, returns mock data
        """
        # TODO: Implement real geocoding
        # This is a placeholder
        return {
            "latitude": 43.6532,  # Toronto
            "longitude": -79.3832
        }
    
    @staticmethod
    async def get_dispatch_queue() -> Dict:
        """Get current dispatch queue for admin review"""
        try:
            queue_items = await dispatch_queue_collection.find({
                "status": "pending"
            }).sort("priority", -1).to_list(1000)
            
            return {
                "success": True,
                "queue": [
                    {
                        "id": str(item["_id"]),
                        "customer_name": item.get("customer_name"),
                        "snow_forecast": item.get("snow_forecast"),
                        "forecast_time": item.get("forecast_time").isoformat() if item.get("forecast_time") else None,
                        "priority": item.get("priority"),
                        "created_at": item.get("created_at").isoformat() if item.get("created_at") else None
                    }
                    for item in queue_items
                ],
                "total": len(queue_items)
            }
            
        except Exception as e:
            logger.error(f"Error getting dispatch queue: {e}")
            raise

# Export singleton instance
weather_dispatch = WeatherDispatchAutomation()

logger.info("Weather-driven dispatch automation initialized successfully")
