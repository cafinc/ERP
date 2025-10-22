"""
WebSocket Service for Real-Time Communication
Handles real-time message delivery, online status, and delivery confirmations
"""

import logging
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time communication"""
    
    def __init__(self):
        # Active connections: {user_id: {websocket1, websocket2, ...}}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # User status: {user_id: "online" | "offline"}
        self.user_status: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's websocket"""
        await websocket.accept()
        
        # Add connection
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.user_status[user_id] = "online"
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        # Broadcast online status
        await self.broadcast_status_update(user_id, "online")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a user's websocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # If no more connections, mark as offline
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.user_status[user_id] = "offline"
                logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            disconnected = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast_status_update(self, user_id: str, status: str):
        """Broadcast user status update to all connected users"""
        message = {
            "type": "status_update",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected users
        for uid in list(self.active_connections.keys()):
            await self.send_personal_message(message, uid)
    
    async def notify_new_message(self, customer_id: str, communication_id: str, message_data: dict):
        """Notify relevant users about new message"""
        notification = {
            "type": "new_message",
            "customer_id": customer_id,
            "communication_id": communication_id,
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected users (in real app, filter by permissions)
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(notification, user_id)
    
    async def notify_message_delivered(self, communication_id: str, delivered_to: str):
        """Notify sender that message was delivered"""
        notification = {
            "type": "message_delivered",
            "communication_id": communication_id,
            "delivered_to": delivered_to,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Find sender and notify
        # In real app, get sender_id from communication record
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(notification, user_id)
    
    async def notify_message_read(self, communication_id: str, read_by: str):
        """Notify sender that message was read"""
        notification = {
            "type": "message_read",
            "communication_id": communication_id,
            "read_by": read_by,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Find sender and notify
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(notification, user_id)
    
    def get_online_users(self) -> list:
        """Get list of currently online users"""
        return [uid for uid, status in self.user_status.items() if status == "online"]
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a specific user is online"""
        return user_id in self.active_connections


# Singleton instance
connection_manager = ConnectionManager()
