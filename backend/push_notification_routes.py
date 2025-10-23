#!/usr/bin/env python3
"""
Push Notification Routes
Expo Push Notification integration for mobile app
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import logging
import httpx
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Push Notifications"])

# Expo Push Notification API endpoint
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# In-memory storage for demo (in production, use database)
push_tokens: Dict[str, Dict] = {}

# ========== Request Models ==========

class PushTokenRequest(BaseModel):
    token: str
    platform: str  # 'ios' or 'android'
    device_info: Optional[Dict] = None
    user_id: Optional[str] = None


class NotificationPreferencesRequest(BaseModel):
    preferences: Dict[str, bool]
    user_id: Optional[str] = None


class SendNotificationRequest(BaseModel):
    user_ids: List[str]
    title: str
    body: str
    data: Optional[Dict] = None
    sound: bool = True
    badge: Optional[int] = None
    priority: str = "high"  # 'default', 'normal', 'high'


# ========== Register Push Token ==========

@router.post("/register-token")
async def register_push_token(request: PushTokenRequest):
    """
    Register Expo push token for a device
    Called when user enables push notifications
    """
    try:
        token_data = {
            "token": request.token,
            "platform": request.platform,
            "device_info": request.device_info or {},
            "user_id": request.user_id,
            "registered_at": datetime.utcnow().isoformat(),
            "active": True,
        }
        
        # Store token
        push_tokens[request.token] = token_data
        
        logger.info(f"Registered push token for user {request.user_id}: {request.token[:20]}...")
        
        return {
            "success": True,
            "message": "Push token registered successfully",
            "token": request.token,
        }
        
    except Exception as e:
        logger.error(f"Error registering push token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Unregister Token ==========

@router.delete("/unregister-token/{token}")
async def unregister_push_token(token: str):
    """Unregister/deactivate a push token"""
    try:
        if token in push_tokens:
            push_tokens[token]["active"] = False
            logger.info(f"Unregistered push token: {token[:20]}...")
            return {"success": True, "message": "Token unregistered"}
        else:
            raise HTTPException(status_code=404, detail="Token not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unregistering token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Send Push Notification ==========

@router.post("/send")
async def send_push_notification(
    request: SendNotificationRequest,
    background_tasks: BackgroundTasks
):
    """
    Send push notification to specific users
    Uses Expo Push Notification service
    """
    try:
        # Get tokens for specified users
        user_tokens = []
        for user_id in request.user_ids:
            for token, data in push_tokens.items():
                if data.get("user_id") == user_id and data.get("active"):
                    user_tokens.append(token)
        
        if not user_tokens:
            return {
                "success": False,
                "message": "No active push tokens found for specified users",
                "sent": 0,
            }
        
        # Prepare Expo push messages
        messages = []
        for token in user_tokens:
            message = {
                "to": token,
                "sound": "default" if request.sound else None,
                "title": request.title,
                "body": request.body,
                "data": request.data or {},
                "priority": request.priority,
            }
            
            if request.badge is not None:
                message["badge"] = request.badge
            
            messages.append(message)
        
        # Send in background
        background_tasks.add_task(send_expo_push_notifications, messages)
        
        return {
            "success": True,
            "message": f"Sending notifications to {len(user_tokens)} devices",
            "sent": len(user_tokens),
        }
        
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Send to All Users ==========

@router.post("/broadcast")
async def broadcast_notification(
    title: str,
    body: str,
    data: Optional[Dict] = None,
    background_tasks: BackgroundTasks = None,
):
    """
    Broadcast notification to all registered devices
    Use with caution!
    """
    try:
        # Get all active tokens
        active_tokens = [
            token for token, token_data in push_tokens.items()
            if token_data.get("active")
        ]
        
        if not active_tokens:
            return {
                "success": False,
                "message": "No active push tokens found",
                "sent": 0,
            }
        
        # Prepare messages
        messages = [
            {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {},
                "priority": "high",
            }
            for token in active_tokens
        ]
        
        # Send in background
        if background_tasks:
            background_tasks.add_task(send_expo_push_notifications, messages)
        
        return {
            "success": True,
            "message": f"Broadcasting to {len(active_tokens)} devices",
            "sent": len(active_tokens),
        }
        
    except Exception as e:
        logger.error(f"Error broadcasting notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Helper: Send via Expo API ==========

async def send_expo_push_notifications(messages: List[Dict]):
    """
    Send push notifications via Expo Push Notification service
    Background task
    """
    try:
        async with httpx.AsyncClient() as client:
            # Expo allows up to 100 notifications per request
            chunk_size = 100
            
            for i in range(0, len(messages), chunk_size):
                chunk = messages[i:i + chunk_size]
                
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=chunk,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    timeout=10.0,
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Sent {len(chunk)} push notifications: {result}")
                    
                    # Check for errors in individual tickets
                    if "data" in result:
                        for ticket in result["data"]:
                            if ticket.get("status") == "error":
                                logger.error(f"Push notification error: {ticket.get('message')}")
                else:
                    logger.error(f"Expo API error: {response.status_code} - {response.text}")
                    
    except Exception as e:
        logger.error(f"Error sending expo push notifications: {e}")


# ========== Notification Preferences ==========

@router.post("/preferences")
async def save_notification_preferences(request: NotificationPreferencesRequest):
    """Save notification preferences for a user"""
    try:
        user_id = request.user_id or "default"
        
        # In production, save to database
        # For now, just acknowledge
        
        logger.info(f"Saved notification preferences for user {user_id}")
        
        return {
            "success": True,
            "message": "Preferences saved successfully",
            "preferences": request.preferences,
        }
        
    except Exception as e:
        logger.error(f"Error saving notification preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences")
async def get_notification_preferences(user_id: Optional[str] = None):
    """Get notification preferences for a user"""
    try:
        # Return default preferences (in production, load from database)
        preferences = {
            "pushEnabled": True,
            "workOrders": True,
            "weatherAlerts": True,
            "taskAssignments": True,
            "messages": True,
            "systemAlerts": True,
            "soundEnabled": True,
            "vibrationEnabled": True,
        }
        
        return {
            "success": True,
            "preferences": preferences,
        }
        
    except Exception as e:
        logger.error(f"Error getting notification preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Statistics ==========

@router.get("/stats")
async def get_notification_stats():
    """Get push notification statistics"""
    try:
        total_tokens = len(push_tokens)
        active_tokens = sum(1 for data in push_tokens.values() if data.get("active"))
        
        # Count by platform
        ios_count = sum(
            1 for data in push_tokens.values()
            if data.get("platform") == "ios" and data.get("active")
        )
        android_count = sum(
            1 for data in push_tokens.values()
            if data.get("platform") == "android" and data.get("active")
        )
        
        return {
            "success": True,
            "stats": {
                "total_tokens": total_tokens,
                "active_tokens": active_tokens,
                "ios_devices": ios_count,
                "android_devices": android_count,
            },
        }
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Integration Helper ==========

async def send_notification_to_user(
    user_id: str,
    title: str,
    body: str,
    data: Optional[Dict] = None,
    sound: bool = True,
):
    """
    Helper function to send notification to a specific user
    Can be called from other services
    """
    try:
        # Get tokens for user
        user_tokens = [
            token for token, token_data in push_tokens.items()
            if token_data.get("user_id") == user_id and token_data.get("active")
        ]
        
        if not user_tokens:
            logger.warning(f"No active push tokens found for user {user_id}")
            return
        
        # Prepare messages
        messages = [
            {
                "to": token,
                "sound": "default" if sound else None,
                "title": title,
                "body": body,
                "data": data or {},
                "priority": "high",
            }
            for token in user_tokens
        ]
        
        # Send
        await send_expo_push_notifications(messages)
        
    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {e}")


logger.info("Push notification routes initialized successfully")
