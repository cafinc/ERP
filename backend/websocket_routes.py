#!/usr/bin/env python3
"""
WebSocket Routes - Real-time connection endpoints
"""

import logging
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from realtime_service import connection_manager, realtime_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time updates
    Connect: ws://host/api/ws?user_id=USER_ID&token=AUTH_TOKEN
    """
    
    if not user_id:
        await websocket.close(code=4000, reason="user_id required")
        return
    
    # TODO: Validate token when auth is fully implemented
    # For now, accept connection with user_id
    
    await connection_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            msg_type = message.get("type")
            
            if msg_type == "subscribe":
                # Subscribe to channel
                channel = message.get("channel")
                if channel:
                    connection_manager.subscribe_to_channel(user_id, channel)
                    await websocket.send_json({
                        "type": "subscribed",
                        "channel": channel
                    })
            
            elif msg_type == "unsubscribe":
                # Unsubscribe from channel
                channel = message.get("channel")
                if channel:
                    connection_manager.unsubscribe_from_channel(user_id, channel)
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "channel": channel
                    })
            
            elif msg_type == "ping":
                # Respond to ping
                await websocket.send_json({"type": "pong"})
            
            elif msg_type == "location_update":
                # Handle crew location update
                location_data = message.get("data", {})
                await realtime_service.emit_crew_location(user_id, location_data)
            
            else:
                logger.warning(f"Unknown message type from {user_id}: {msg_type}")
    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info(f"User {user_id} disconnected")
    
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        connection_manager.disconnect(websocket)

@router.get("/online-users")
async def get_online_users():
    """Get list of currently online users"""
    return {
        "success": True,
        "online_users": connection_manager.get_online_users(),
        "total": len(connection_manager.get_online_users())
    }

@router.post("/broadcast")
async def broadcast_message(message: dict):
    """Admin endpoint to broadcast system messages"""
    await realtime_service.emit_system_alert(
        alert_data=message,
        severity=message.get("severity", "info")
    )
    return {"success": True, "message": "Broadcast sent"}

logger.info("WebSocket routes initialized successfully")
