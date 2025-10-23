#!/usr/bin/env python3
"""
Unified Communications Routes
API endpoints for the unified communications timeline system
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import logging

from unified_communications import unified_comms

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/unified-communications", tags=["Unified Communications"])

# ========== Request Models ==========

class SendMessageRequest(BaseModel):
    customer_id: str
    channel: str  # sms, email, in_app, phone
    subject: Optional[str] = None
    content: str
    sender_id: Optional[str] = None
    sender_name: str = "System"
    metadata: Optional[Dict] = None


class LogInboundMessageRequest(BaseModel):
    customer_id: str
    channel: str
    content: str
    subject: Optional[str] = None
    metadata: Optional[Dict] = None


class SmartChannelRequest(BaseModel):
    customer_id: str
    message_content: str
    urgency: str = "normal"  # normal, urgent, emergency


# ========== Send Message ==========

@router.post("/send")
async def send_message(request: SendMessageRequest):
    """
    Send message through unified communications system
    Automatically handles channel-specific sending
    """
    try:
        result = await unified_comms.send_message(
            customer_id=request.customer_id,
            channel=request.channel,
            subject=request.subject,
            content=request.content,
            sender_id=request.sender_id,
            sender_name=request.sender_name,
            metadata=request.metadata
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error sending message via unified comms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Customer Timeline ==========

@router.get("/timeline/{customer_id}")
async def get_customer_timeline(
    customer_id: str,
    limit: int = Query(100, le=1000),
    channel_filter: Optional[str] = Query(None, description="Filter by channel: sms, email, in_app, phone")
):
    """
    Get unified communication timeline for a customer
    Returns all messages across all channels in chronological order
    """
    try:
        result = await unified_comms.get_customer_timeline(
            customer_id=customer_id,
            limit=limit,
            channel_filter=channel_filter
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting customer timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Log Inbound Message ==========

@router.post("/log-inbound")
async def log_inbound_message(request: LogInboundMessageRequest):
    """
    Log inbound message from customer
    Used for webhook integrations and incoming messages
    """
    try:
        result = await unified_comms.log_inbound_message(
            customer_id=request.customer_id,
            channel=request.channel,
            content=request.content,
            subject=request.subject,
            metadata=request.metadata
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error logging inbound message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Mark as Read ==========

@router.post("/{message_id}/mark-read")
async def mark_message_as_read(message_id: str):
    """Mark message as read in unified timeline"""
    try:
        result = await unified_comms.mark_as_read(message_id)
        return result
        
    except Exception as e:
        logger.error(f"Error marking message as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Unread Count ==========

@router.get("/{customer_id}/unread-count")
async def get_unread_count(customer_id: str):
    """Get count of unread messages for customer"""
    try:
        count = await unified_comms.get_unread_count(customer_id)
        return {"customer_id": customer_id, "unread_count": count}
        
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Smart Channel Selection ==========

@router.post("/smart-channel")
async def smart_channel_selection(request: SmartChannelRequest):
    """
    AI-powered channel selection
    Recommends best channel based on:
    - Message urgency
    - Message length
    - Customer preferences
    - Customer online status
    - Time of day
    """
    try:
        recommended_channel = await unified_comms.smart_channel_selection(
            customer_id=request.customer_id,
            message_content=request.message_content,
            urgency=request.urgency
        )
        
        return {
            "success": True,
            "recommended_channel": recommended_channel,
            "reason": f"Selected based on urgency={request.urgency}, message_length={len(request.message_content)}"
        }
        
    except Exception as e:
        logger.error(f"Error in smart channel selection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Multi-Customer Overview ==========

@router.get("/overview")
async def get_communications_overview(
    limit: int = Query(50, le=500),
    channel_filter: Optional[str] = None
):
    """
    Get overview of recent communications across all customers
    Useful for admin dashboard
    """
    try:
        from unified_communications import communications_collection
        
        query = {}
        if channel_filter:
            query["channel"] = channel_filter
        
        cursor = communications_collection.find(query).sort("created_at", -1).limit(limit)
        messages = await cursor.to_list(length=limit)
        
        # Format for response
        overview = []
        for msg in messages:
            overview.append({
                "id": str(msg["_id"]),
                "customer_id": msg.get("customer_id"),
                "customer_name": msg.get("customer_name"),
                "channel": msg.get("channel"),
                "channel_icon": unified_comms.CHANNEL_ICONS.get(msg.get("channel"), "💬"),
                "direction": msg.get("direction"),
                "content_preview": msg.get("content", "")[:100] if msg.get("content") else "",
                "subject": msg.get("subject"),
                "status": msg.get("status"),
                "created_at": msg.get("created_at").isoformat() if msg.get("created_at") else None,
                "read": msg.get("read_at") is not None
            })
        
        return {
            "success": True,
            "total": len(overview),
            "messages": overview
        }
        
    except Exception as e:
        logger.error(f"Error getting communications overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Batch Operations ==========

@router.post("/batch-mark-read")
async def batch_mark_as_read(message_ids: List[str]):
    """Mark multiple messages as read"""
    try:
        results = []
        for message_id in message_ids:
            try:
                result = await unified_comms.mark_as_read(message_id)
                results.append({"message_id": message_id, "success": result["success"]})
            except Exception as e:
                results.append({"message_id": message_id, "success": False, "error": str(e)})
        
        success_count = sum(1 for r in results if r["success"])
        
        return {
            "success": True,
            "total": len(message_ids),
            "successful": success_count,
            "failed": len(message_ids) - success_count,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in batch mark as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Analytics ==========

@router.get("/analytics/summary")
async def get_communications_analytics():
    """
    Get analytics summary for unified communications
    - Total messages by channel
    - Response rates
    - Most active customers
    """
    try:
        from unified_communications import communications_collection
        from datetime import timedelta
        
        # Total messages by channel
        pipeline_channel = [
            {"$group": {
                "_id": "$channel",
                "count": {"$sum": 1}
            }}
        ]
        by_channel = await communications_collection.aggregate(pipeline_channel).to_list(100)
        
        # Messages by direction
        pipeline_direction = [
            {"$group": {
                "_id": "$direction",
                "count": {"$sum": 1}
            }}
        ]
        by_direction = await communications_collection.aggregate(pipeline_direction).to_list(100)
        
        # Last 7 days volume
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = await communications_collection.count_documents({
            "created_at": {"$gte": seven_days_ago}
        })
        
        # Most active customers (top 10)
        pipeline_customers = [
            {"$group": {
                "_id": "$customer_id",
                "count": {"$sum": 1},
                "customer_name": {"$first": "$customer_name"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        top_customers = await communications_collection.aggregate(pipeline_customers).to_list(10)
        
        return {
            "success": True,
            "by_channel": {item["_id"]: item["count"] for item in by_channel},
            "by_direction": {item["_id"]: item["count"] for item in by_direction},
            "last_7_days": recent_count,
            "top_customers": [
                {
                    "customer_id": item["_id"],
                    "customer_name": item.get("customer_name", "Unknown"),
                    "message_count": item["count"]
                }
                for item in top_customers
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting communications analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


logger.info("Unified communications routes initialized")
