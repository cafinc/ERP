"""
Webhook Routes - Real-time Communication Listeners
Receives webhooks from RingCentral (SMS/Calls) and Gmail (Emails)
"""

from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging
import json
import hmac
import hashlib
import base64
import os
from motor.motor_asyncio import AsyncIOMotorClient

from gmail_service import gmail_service

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "snow_removal_db")]

# Collections
communications_collection = db["communications"]
customers_collection = db["customers"]

# Webhook secrets for validation
RINGCENTRAL_WEBHOOK_SECRET = os.getenv("RINGCENTRAL_WEBHOOK_SECRET", "")
GMAIL_WEBHOOK_SECRET = os.getenv("GMAIL_WEBHOOK_SECRET", "")


# ========== RingCentral Webhooks ==========

def verify_ringcentral_signature(payload: str, signature: str) -> bool:
    """Verify RingCentral webhook signature"""
    if not RINGCENTRAL_WEBHOOK_SECRET:
        logger.warning("RingCentral webhook secret not configured, skipping validation")
        return True
    
    expected_signature = hmac.new(
        RINGCENTRAL_WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)


@router.post("/webhooks/ringcentral/sms")
async def receive_ringcentral_sms_webhook(
    request: Request,
    validation_token: Optional[str] = Header(None, alias="Validation-Token")
):
    """
    Receive incoming SMS from RingCentral
    Webhook setup: https://developers.ringcentral.com/guide/notifications/webhooks
    """
    try:
        # Handle webhook validation (first-time setup)
        if validation_token:
            logger.info("RingCentral SMS webhook validation request received")
            return {
                "validation_token": validation_token
            }
        
        # Get raw body for signature verification
        body = await request.body()
        payload = body.decode('utf-8')
        
        # Verify signature
        signature = request.headers.get("X-RingCentral-Signature", "")
        if not verify_ringcentral_signature(payload, signature):
            logger.error("Invalid RingCentral webhook signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse webhook data
        data = json.loads(payload)
        
        # Extract SMS data
        event = data.get("event")
        body_data = data.get("body", {})
        
        logger.info(f"RingCentral SMS webhook received: {event}")
        
        # Only process incoming SMS
        if event == "/restapi/v1.0/account/~/extension/~/message-store" or event == "instant-message-event-filters":
            message = body_data
            
            # Check if it's an SMS (not voicemail or other message types)
            if message.get("type") != "SMS":
                logger.info(f"Skipping non-SMS message type: {message.get('type')}")
                return {"status": "ignored", "reason": "not_sms"}
            
            # Extract sender info
            from_number = message.get("from", {}).get("phoneNumber", "Unknown")
            to_number = message.get("to", [{}])[0].get("phoneNumber", "Unknown")
            message_text = message.get("subject", "")
            message_id = message.get("id")
            
            # Find customer by phone number
            customer = await customers_collection.find_one({
                "$or": [
                    {"phone": from_number},
                    {"mobile": from_number}
                ]
            })
            
            customer_id = str(customer["_id"]) if customer else None
            
            # Save to communications
            communication = {
                "customer_id": customer_id,
                "type": "sms",
                "direction": "inbound",
                "content": message_text,
                "message": message_text,
                "from": from_number,
                "to": to_number,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "status": "received",
                "integration": "ringcentral",
                "external_id": message_id,
                "read": False
            }
            
            result = await communications_collection.insert_one(communication)
            
            logger.info(f"Incoming SMS saved: {from_number} -> {to_number}")
            
            return {
                "status": "success",
                "message": "SMS received and saved",
                "communication_id": str(result.inserted_id)
            }
        
        return {"status": "ignored", "event": event}
    
    except Exception as e:
        logger.error(f"Error processing RingCentral SMS webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks/ringcentral/call")
async def receive_ringcentral_call_webhook(
    request: Request,
    validation_token: Optional[str] = Header(None, alias="Validation-Token")
):
    """
    Receive call notifications from RingCentral
    """
    try:
        # Handle webhook validation
        if validation_token:
            logger.info("RingCentral Call webhook validation request received")
            return {
                "validation_token": validation_token
            }
        
        # Get raw body
        body = await request.body()
        payload = body.decode('utf-8')
        
        # Verify signature
        signature = request.headers.get("X-RingCentral-Signature", "")
        if not verify_ringcentral_signature(payload, signature):
            logger.error("Invalid RingCentral webhook signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse webhook data
        data = json.loads(payload)
        event = data.get("event")
        body_data = data.get("body", {})
        
        logger.info(f"RingCentral Call webhook received: {event}")
        
        # Process call events
        if "telephony/sessions" in event:
            call = body_data
            
            # Extract call data
            from_number = call.get("from", {}).get("phoneNumber", "Unknown")
            to_number = call.get("to", {}).get("phoneNumber", "Unknown")
            call_id = call.get("id")
            direction = call.get("direction", "Inbound")
            status = call.get("telephonyStatus", "Unknown")
            
            # Find customer by phone number
            search_number = from_number if direction == "Inbound" else to_number
            customer = await customers_collection.find_one({
                "$or": [
                    {"phone": search_number},
                    {"mobile": search_number}
                ]
            })
            
            customer_id = str(customer["_id"]) if customer else None
            
            # Only log completed calls
            if status in ["NoCall", "Disconnected"]:
                # Save to communications
                communication = {
                    "customer_id": customer_id,
                    "type": "phone",
                    "direction": "inbound" if direction == "Inbound" else "outbound",
                    "phone": from_number,
                    "to": to_number,
                    "notes": f"Call {status.lower()}",
                    "timestamp": datetime.utcnow(),
                    "created_at": datetime.utcnow(),
                    "status": "completed",
                    "integration": "ringcentral",
                    "external_id": call_id
                }
                
                result = await communications_collection.insert_one(communication)
                
                logger.info(f"Call logged: {from_number} -> {to_number} ({status})")
                
                return {
                    "status": "success",
                    "message": "Call logged",
                    "communication_id": str(result.inserted_id)
                }
        
        return {"status": "ignored", "event": event}
    
    except Exception as e:
        logger.error(f"Error processing RingCentral call webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Gmail Webhooks (Push Notifications) ==========

@router.post("/webhooks/gmail/push")
async def receive_gmail_push_notification(request: Request):
    """
    Receive Gmail push notifications (Cloud Pub/Sub)
    Setup: https://developers.google.com/gmail/api/guides/push
    """
    try:
        # Parse Cloud Pub/Sub message
        data = await request.json()
        message = data.get("message", {})
        
        # Decode the message data
        message_data = message.get("data", "")
        decoded_data = base64.b64decode(message_data).decode('utf-8') if message_data else "{}"
        notification_data = json.loads(decoded_data)
        
        email_address = notification_data.get("emailAddress")
        history_id = notification_data.get("historyId")
        
        logger.info(f"Gmail push notification received for {email_address}, historyId: {history_id}")
        
        # Find user with this Gmail connection
        user = await db.users.find_one({"gmail_email": email_address})
        
        if not user:
            logger.warning(f"No user found for Gmail address: {email_address}")
            return {"status": "ignored", "reason": "user_not_found"}
        
        # Get user's Gmail credentials
        gmail_creds = user.get("gmail_token")
        if not gmail_creds:
            logger.warning(f"No Gmail token for user: {user.get('email')}")
            return {"status": "ignored", "reason": "no_credentials"}
        
        # Fetch new messages using Gmail API
        try:
            # Get messages since last history_id (stored in user document)
            last_history_id = user.get("gmail_last_history_id", history_id)
            
            # Fetch history changes
            new_messages = await gmail_service.get_history_changes(
                credentials=gmail_creds,
                start_history_id=last_history_id
            )
            
            # Process each new message
            for msg in new_messages:
                # Extract email details
                from_email = msg.get("from", "Unknown")
                subject = msg.get("subject", "No subject")
                body = msg.get("body", "")
                message_id = msg.get("id")
                thread_id = msg.get("threadId")
                
                # Find customer by email
                customer = await customers_collection.find_one({"email": from_email})
                customer_id = str(customer["_id"]) if customer else None
                
                # Save to communications
                communication = {
                    "customer_id": customer_id,
                    "user_id": str(user["_id"]),
                    "type": "email",
                    "direction": "inbound",
                    "content": body,
                    "body": body,
                    "subject": subject,
                    "from": from_email,
                    "to": email_address,
                    "timestamp": datetime.utcnow(),
                    "created_at": datetime.utcnow(),
                    "status": "received",
                    "integration": "gmail",
                    "external_id": message_id,
                    "thread_id": thread_id,
                    "read": False
                }
                
                result = await communications_collection.insert_one(communication)
                
                logger.info(f"Incoming email saved: {from_email} - {subject}")
            
            # Update user's last history_id
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"gmail_last_history_id": history_id}}
            )
            
            return {
                "status": "success",
                "message": f"Processed {len(new_messages)} new emails",
                "count": len(new_messages)
            }
        
        except Exception as e:
            logger.error(f"Error fetching Gmail messages: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    except Exception as e:
        logger.error(f"Error processing Gmail webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Health Check ==========

@router.get("/webhooks/health")
async def webhook_health_check():
    """Health check endpoint for webhooks"""
    return {
        "status": "healthy",
        "webhooks": {
            "ringcentral_sms": "/api/webhooks/ringcentral/sms",
            "ringcentral_call": "/api/webhooks/ringcentral/call",
            "gmail_push": "/api/webhooks/gmail/push"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
