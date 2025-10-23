#!/usr/bin/env python3
"""
Real-Time Service - WebSocket Manager for Live Updates
Handles real-time notifications, task updates, crew locations, and system-wide events
"""

import logging
import json
import asyncio
from typing import Dict, Set, Optional, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from enum import Enum

logger = logging.getLogger(__name__)

class EventType(str, Enum):
    # Task events
    TASK_CREATED = "task.created"
    TASK_UPDATED = "task.updated"
    TASK_ASSIGNED = "task.assigned"
    TASK_COMPLETED = "task.completed"
    TASK_COMMENTED = "task.commented"
    
    # Work order events
    WORK_ORDER_CREATED = "work_order.created"
    WORK_ORDER_UPDATED = "work_order.updated"
    WORK_ORDER_ASSIGNED = "work_order.assigned"
    WORK_ORDER_STARTED = "work_order.started"
    WORK_ORDER_COMPLETED = "work_order.completed"
    
    # Crew location events
    CREW_LOCATION_UPDATED = "crew.location_updated"
    CREW_STATUS_CHANGED = "crew.status_changed"
    
    # Communication events
    MESSAGE_RECEIVED = "message.received"
    NOTIFICATION_NEW = "notification.new"
    
    # Weather events
    WEATHER_ALERT = "weather.alert"
    WEATHER_UPDATED = "weather.updated"
    
    # Equipment events
    EQUIPMENT_STATUS_CHANGED = "equipment.status_changed"
    
    # System events
    SYSTEM_ALERT = "system.alert"

class ConnectionManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        # user_id -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> user_id mapping
        self.connection_users: Dict[WebSocket, str] = {}
        # Channel subscriptions: channel_name -> set of user_ids
        self.channels: Dict[str, Set[str]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a new websocket for a user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_users[websocket] = user_id
        
        logger.info(f"User {user_id} connected. Total connections: {len(self.connection_users)}")
        
        # Send welcome message
        await self.send_personal_message(user_id, {
            "type": "connection.established",
            "data": {
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            }
        })
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a websocket"""
        user_id = self.connection_users.get(websocket)
        
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
                # Remove from all channels
                for channel_users in self.channels.values():
                    channel_users.discard(user_id)
        
        if websocket in self.connection_users:
            del self.connection_users[websocket]
        
        logger.info(f"User {user_id} disconnected. Remaining connections: {len(self.connection_users)}")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send a message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            disconnected = []
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected sockets
            for conn in disconnected:
                self.disconnect(conn)
    
    async def broadcast_to_users(self, user_ids: list, message: dict):
        """Send a message to multiple specific users"""
        tasks = []
        for user_id in user_ids:
            if user_id in self.active_connections:
                tasks.append(self.send_personal_message(user_id, message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all connected users"""
        disconnected = []
        
        for websocket, user_id in self.connection_users.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {user_id}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected sockets
        for conn in disconnected:
            self.disconnect(conn)
    
    def subscribe_to_channel(self, user_id: str, channel: str):
        """Subscribe a user to a channel"""
        if channel not in self.channels:
            self.channels[channel] = set()
        
        self.channels[channel].add(user_id)
        logger.info(f"User {user_id} subscribed to channel: {channel}")
    
    def unsubscribe_from_channel(self, user_id: str, channel: str):
        """Unsubscribe a user from a channel"""
        if channel in self.channels:
            self.channels[channel].discard(user_id)
            logger.info(f"User {user_id} unsubscribed from channel: {channel}")
    
    async def broadcast_to_channel(self, channel: str, message: dict):
        """Broadcast a message to all users subscribed to a channel"""
        if channel in self.channels:
            user_ids = list(self.channels[channel])
            await self.broadcast_to_users(user_ids, message)
    
    def get_online_users(self) -> list:
        """Get list of currently online user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is currently online"""
        return user_id in self.active_connections

# Global connection manager instance
connection_manager = ConnectionManager()

class RealtimeService:
    """Service for broadcasting real-time events"""
    
    @staticmethod
    async def emit_task_event(event_type: EventType, task_data: dict, affected_users: list = None):
        """Emit a task-related event"""
        message = {
            "type": event_type.value,
            "data": task_data,
            "timestamp": datetime.now().isoformat()
        }
        
        if affected_users:
            await connection_manager.broadcast_to_users(affected_users, message)
        else:
            # Broadcast to task channel
            await connection_manager.broadcast_to_channel(f"task:{task_data.get('id')}", message)
    
    @staticmethod
    async def emit_work_order_event(event_type: EventType, work_order_data: dict, affected_users: list = None):
        """Emit a work order event"""
        message = {
            "type": event_type.value,
            "data": work_order_data,
            "timestamp": datetime.now().isoformat()
        }
        
        if affected_users:
            await connection_manager.broadcast_to_users(affected_users, message)
        else:
            await connection_manager.broadcast_to_all(message)
    
    @staticmethod
    async def emit_crew_location(crew_id: str, location_data: dict):
        """Emit crew location update"""
        message = {
            "type": EventType.CREW_LOCATION_UPDATED.value,
            "data": {
                "crew_id": crew_id,
                **location_data
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Broadcast to admin users and dispatch channel
        await connection_manager.broadcast_to_channel("dispatch", message)
    
    @staticmethod
    async def emit_weather_alert(alert_data: dict, affected_areas: list = None):
        """Emit weather alert"""
        message = {
            "type": EventType.WEATHER_ALERT.value,
            "data": alert_data,
            "timestamp": datetime.now().isoformat()
        }
        
        await connection_manager.broadcast_to_all(message)
    
    @staticmethod
    async def emit_notification(user_id: str, notification_data: dict):
        """Send a notification to a specific user"""
        message = {
            "type": EventType.NOTIFICATION_NEW.value,
            "data": notification_data,
            "timestamp": datetime.now().isoformat()
        }
        
        await connection_manager.send_personal_message(user_id, message)
    
    @staticmethod
    async def emit_system_alert(alert_data: dict, severity: str = "info"):
        """Broadcast a system-wide alert"""
        message = {
            "type": EventType.SYSTEM_ALERT.value,
            "data": {
                "severity": severity,
                **alert_data
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await connection_manager.broadcast_to_all(message)
    
    @staticmethod
    def get_online_status(user_ids: list) -> dict:
        """Get online status for multiple users"""
        return {
            user_id: connection_manager.is_user_online(user_id)
            for user_id in user_ids
        }

# Export singleton instance
realtime_service = RealtimeService()

logger.info("Real-time service initialized successfully")
