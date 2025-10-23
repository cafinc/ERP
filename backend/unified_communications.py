#!/usr/bin/env python3
"""
Unified Communications Service
Aggregates all communications (SMS, Email, In-App, Phone) into single timeline per customer
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
communications_collection = db["communications"]
customers_collection = db["customers"]
sms_logs_collection = db["sms_logs"]
email_logs_collection = db["email_logs"]
phone_logs_collection = db["phone_logs"]

class UnifiedCommunicationsService:
    """Manages unified communication timeline across all channels"""
    
    CHANNEL_ICONS = {
        "sms": "💬",
        "email": "📧",
        "in_app": "📱",
        "phone": "📞",
        "whatsapp": "💚",
        "system": "🤖"
    }
    
    @staticmethod
    async def send_message(
        customer_id: str,
        channel: str,
        subject: Optional[str] = None,
        content: str = "",
        sender_id: Optional[str] = None,
        sender_name: str = "System",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Send message through specified channel and log in unified timeline
        """
        try:
            # Validate customer
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            # Prepare message
            message = {
                "customer_id": customer_id,
                "customer_name": customer.get("name", "Unknown"),
                "channel": channel,
                "direction": "outbound",
                "subject": subject,
                "content": content,
                "sender_id": sender_id,
                "sender_name": sender_name,
                "status": "pending",
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
                "sent_at": None,
                "delivered_at": None,
                "read_at": None
            }
            
            # Send through appropriate channel
            if channel == "sms":
                result = await UnifiedCommunicationsService._send_sms(customer, content)
            elif channel == "email":
                result = await UnifiedCommunicationsService._send_email(customer, subject, content)
            elif channel == "in_app":
                result = await UnifiedCommunicationsService._send_in_app(customer, content)
            elif channel == "phone":
                # Phone calls are logged, not sent
                result = {"success": True, "call_initiated": True}
            else:
                return {"success": False, "error": f"Unknown channel: {channel}"}
            
            # Update status
            message["status"] = "sent" if result.get("success") else "failed"
            message["sent_at"] = datetime.utcnow() if result.get("success") else None
            
            # Store in unified timeline
            insert_result = await communications_collection.insert_one(message)
            message["_id"] = insert_result.inserted_id
            
            # Broadcast real-time event
            await realtime_service.emit_notification(
                user_id=customer_id,
                notification_data={
                    "type": "message.received",
                    "channel": channel,
                    "subject": subject,
                    "preview": content[:100] if content else ""
                }
            )
            
            logger.info(f"Message sent to {customer_id} via {channel}")
            
            return {
                "success": True,
                "message_id": str(insert_result.inserted_id),
                "channel": channel,
                "status": message["status"]
            }
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise
    
    @staticmethod
    async def get_customer_timeline(
        customer_id: str,
        limit: int = 100,
        channel_filter: Optional[str] = None
    ) -> Dict:
        """
        Get unified communication timeline for customer
        Combines all channels in chronological order
        """
        try:
            query = {"customer_id": customer_id}
            if channel_filter:
                query["channel"] = channel_filter
            
            # Get communications
            cursor = communications_collection.find(query).sort("created_at", -1).limit(limit)
            messages = await cursor.to_list(length=limit)
            
            # Format timeline
            timeline = []
            for msg in messages:
                timeline.append({
                    "id": str(msg["_id"]),
                    "channel": msg.get("channel"),
                    "channel_icon": UnifiedCommunicationsService.CHANNEL_ICONS.get(msg.get("channel"), "💬"),
                    "direction": msg.get("direction", "outbound"),
                    "subject": msg.get("subject"),
                    "content": msg.get("content"),
                    "sender_name": msg.get("sender_name"),
                    "status": msg.get("status"),
                    "created_at": msg.get("created_at").isoformat() if msg.get("created_at") else None,
                    "sent_at": msg.get("sent_at").isoformat() if msg.get("sent_at") else None,
                    "read": msg.get("read_at") is not None,
                    "metadata": msg.get("metadata", {})
                })
            
            # Get customer info
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            
            # Get statistics
            total_messages = await communications_collection.count_documents({"customer_id": customer_id})
            by_channel = await UnifiedCommunicationsService._get_channel_breakdown(customer_id)
            
            return {
                "success": True,
                "customer": {
                    "id": customer_id,
                    "name": customer.get("name", "Unknown") if customer else "Unknown",
                    "email": customer.get("email") if customer else None,
                    "phone": customer.get("phone") if customer else None
                },
                "timeline": timeline,
                "statistics": {
                    "total_messages": total_messages,
                    "by_channel": by_channel,
                    "last_contact": timeline[0]["created_at"] if timeline else None
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting customer timeline: {e}")
            raise
    
    @staticmethod
    async def log_inbound_message(
        customer_id: str,
        channel: str,
        content: str,
        subject: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Log inbound message from customer
        """
        try:
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            
            message = {
                "customer_id": customer_id,
                "customer_name": customer.get("name", "Unknown") if customer else "Unknown",
                "channel": channel,
                "direction": "inbound",
                "subject": subject,
                "content": content,
                "status": "received",
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
                "read_at": None
            }
            
            result = await communications_collection.insert_one(message)
            
            # Notify admins of inbound message
            await realtime_service.emit_system_alert({
                "message": f"New {channel} message from {customer.get('name') if customer else 'customer'}",
                "customer_id": customer_id,
                "channel": channel,
                "preview": content[:100] if content else ""
            }, severity="info")
            
            logger.info(f"Inbound message logged from {customer_id} via {channel}")
            
            return {
                "success": True,
                "message_id": str(result.inserted_id)
            }
            
        except Exception as e:
            logger.error(f"Error logging inbound message: {e}")
            raise
    
    @staticmethod
    async def mark_as_read(message_id: str) -> Dict:
        """Mark message as read"""
        try:
            result = await communications_collection.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": {"read_at": datetime.utcnow()}}
            )
            
            return {
                "success": result.modified_count > 0,
                "message": "Message marked as read" if result.modified_count > 0 else "Message not found"
            }
            
        except Exception as e:
            logger.error(f"Error marking message as read: {e}")
            raise
    
    @staticmethod
    async def get_unread_count(customer_id: str) -> int:
        """Get count of unread messages for customer"""
        try:
            count = await communications_collection.count_documents({
                "customer_id": customer_id,
                "direction": "inbound",
                "read_at": None
            })
            return count
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0
    
    @staticmethod
    async def smart_channel_selection(
        customer_id: str,
        message_content: str,
        urgency: str = "normal"
    ) -> str:
        """
        AI-powered channel selection based on:
        - Message urgency
        - Message length
        - Customer preferences
        - Time of day
        - Customer online status
        """
        try:
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            
            # Check urgency
            if urgency == "urgent":
                return "sms"  # SMS for urgent
            
            # Check message length
            if len(message_content) > 500:
                return "email"  # Email for long messages
            
            # Check if customer is online
            from realtime_service import connection_manager
            if connection_manager.is_user_online(customer_id):
                return "in_app"  # In-app if online
            
            # Check customer preferences
            preferred_channel = customer.get("preferred_communication_channel") if customer else None
            if preferred_channel:
                return preferred_channel
            
            # Default to most responsive channel based on history
            recent_responses = await communications_collection.find({
                "customer_id": customer_id,
                "direction": "inbound"
            }).sort("created_at", -1).limit(10).to_list(10)
            
            if recent_responses:
                # Count responses by channel
                channel_counts = {}
                for resp in recent_responses:
                    channel = resp.get("channel")
                    channel_counts[channel] = channel_counts.get(channel, 0) + 1
                
                # Return most used channel
                return max(channel_counts, key=channel_counts.get)
            
            # Default fallback
            return "email"
            
        except Exception as e:
            logger.error(f"Error in smart channel selection: {e}")
            return "email"  # Default to email on error
    
    @staticmethod
    async def _get_channel_breakdown(customer_id: str) -> Dict:
        """Get message count breakdown by channel"""
        pipeline = [
            {"$match": {"customer_id": customer_id}},
            {"$group": {
                "_id": "$channel",
                "count": {"$sum": 1}
            }}
        ]
        
        results = await communications_collection.aggregate(pipeline).to_list(100)
        
        breakdown = {result["_id"]: result["count"] for result in results}
        return breakdown
    
    @staticmethod
    async def _send_sms(customer: Dict, content: str) -> Dict:
        """Send SMS (placeholder - integrate with Twilio)"""
        # This would integrate with Twilio or similar
        phone = customer.get("phone")
        if not phone:
            return {"success": False, "error": "No phone number"}
        
        # Log to SMS logs
        await sms_logs_collection.insert_one({
            "to": phone,
            "content": content,
            "status": "sent",
            "sent_at": datetime.utcnow()
        })
        
        logger.info(f"SMS sent to {phone}")
        return {"success": True}
    
    @staticmethod
    async def _send_email(customer: Dict, subject: str, content: str) -> Dict:
        """Send Email (placeholder - integrate with SendGrid/AWS SES)"""
        email = customer.get("email")
        if not email:
            return {"success": False, "error": "No email address"}
        
        # Log to email logs
        await email_logs_collection.insert_one({
            "to": email,
            "subject": subject,
            "content": content,
            "status": "sent",
            "sent_at": datetime.utcnow()
        })
        
        logger.info(f"Email sent to {email}")
        return {"success": True}
    
    @staticmethod
    async def _send_in_app(customer: Dict, content: str) -> Dict:
        """Send in-app notification"""
        customer_id = str(customer["_id"])
        
        # Send via WebSocket
        await realtime_service.emit_notification(
            user_id=customer_id,
            notification_data={
                "type": "message",
                "content": content,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"In-app notification sent to {customer_id}")
        return {"success": True}

# Export singleton instance
unified_comms = UnifiedCommunicationsService()

logger.info("Unified communications service initialized successfully")
