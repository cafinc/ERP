"""
Communications Routes - Unified Communication Center
Handles InApp messages, SMS (RingCentral), Email (Gmail), and Phone logs
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId
import logging

import os
from motor.motor_asyncio import AsyncIOMotorClient
from ringcentral_service import ringcentral_service
from gmail_service import gmail_service
from auth_endpoints import get_current_user_endpoint
from fastapi import Request
from file_storage_service import file_storage_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency function for getting current user
async def get_current_user(request: Request):
    """Dependency to get current authenticated user"""
    return await get_current_user_endpoint(db, request)

# MongoDB connection (same as server.py)
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "snow_removal_db")]

# Collections
communications_collection = db["communications"]
customers_collection = db["customers"]
users_collection = db["users"]


# ========== Request Models ==========

class SendInAppMessageRequest(BaseModel):
    customer_id: str
    message: str
    type: str = "inapp"


class SendSMSRequest(BaseModel):
    to: str
    message: str
    customer_id: str


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    customer_id: str


class LogCallRequest(BaseModel):
    phone: str
    notes: str
    customer_id: str
    duration: Optional[int] = None
    direction: str = "outbound"  # outbound or inbound


# ========== In-App Messaging ==========

@router.post("/messages/send")
async def send_inapp_message(request: SendInAppMessageRequest, current_user: dict = Depends(get_current_user)):
    """Send an in-app message to a customer"""
    try:
        # Create communication record
        communication = {
            "customer_id": request.customer_id,
            "user_id": current_user["id"],
            "type": "inapp",
            "direction": "outbound",
            "content": request.message,
            "message": request.message,
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "read": False,
            "status": "sent"
        }
        
        result = await db.communications.insert_one(communication)
        communication["_id"] = str(result.inserted_id)
        
        logger.info(f"In-app message sent to customer {request.customer_id}")
        
        return {
            "success": True,
            "message": "Message sent successfully",
            "communication_id": str(result.inserted_id)
        }
    
    except Exception as e:
        logger.error(f"Error sending in-app message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== RingCentral SMS ==========

@router.post("/integrations/ringcentral/sms")
async def send_sms_via_ringcentral(request: SendSMSRequest, current_user: dict = Depends(get_current_user)):
    """Send SMS via RingCentral"""
    try:
        # Check if RingCentral is enabled
        if not ringcentral_service.enabled:
            raise HTTPException(status_code=400, detail="RingCentral integration not configured. Please set RINGCENTRAL_CLIENT_ID and RINGCENTRAL_CLIENT_SECRET")
        
        # Get user's RingCentral token
        user = await users_collection.find_one({"_id": ObjectId(current_user["id"])})
        if not user or not user.get("ringcentral_token"):
            raise HTTPException(status_code=400, detail="RingCentral not connected. Please connect your RingCentral account first")
        
        # Send SMS via RingCentral
        ringcentral_token = user["ringcentral_token"]
        
        # Call RingCentral API to send SMS
        result = await ringcentral_service.send_sms(
            token=ringcentral_token,
            to=request.to,
            text=request.message
        )
        
        # Log communication
        communication = {
            "customer_id": request.customer_id,
            "user_id": current_user["id"],
            "type": "sms",
            "direction": "outbound",
            "content": request.message,
            "message": request.message,
            "to": request.to,
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "status": "sent",
            "integration": "ringcentral",
            "external_id": result.get("id")
        }
        
        result = await db.communications.insert_one(communication)
        
        logger.info(f"SMS sent to {request.to} via RingCentral")
        
        return {
            "success": True,
            "message": "SMS sent successfully",
            "communication_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")


# ========== Gmail Email ==========

@router.post("/integrations/gmail/send")
async def send_email_via_gmail(request: SendEmailRequest, current_user: dict = Depends(get_current_user)):
    """Send email via Gmail"""
    try:
        # Check if Gmail is enabled
        if not gmail_service.enabled:
            raise HTTPException(status_code=400, detail="Gmail integration not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET")
        
        # Get user's Gmail token
        user = await users_collection.find_one({"_id": ObjectId(current_user["id"])})
        if not user or not user.get("gmail_token"):
            raise HTTPException(status_code=400, detail="Gmail not connected. Please connect your Gmail account first")
        
        # Send email via Gmail
        gmail_creds = user["gmail_token"]
        
        result = await gmail_service.send_email(
            credentials=gmail_creds,
            to=request.to,
            subject=request.subject,
            body=request.body
        )
        
        # Log communication
        communication = {
            "customer_id": request.customer_id,
            "user_id": current_user["id"],
            "type": "email",
            "direction": "outbound",
            "content": request.body,
            "body": request.body,
            "subject": request.subject,
            "to": request.to,
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "status": "sent",
            "integration": "gmail",
            "external_id": result.get("id")
        }
        
        result = await db.communications.insert_one(communication)
        
        logger.info(f"Email sent to {request.to} via Gmail")
        
        return {
            "success": True,
            "message": "Email sent successfully",
            "communication_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


# ========== Phone Call Logging ==========

@router.post("/integrations/ringcentral/call-log")
async def log_phone_call(request: LogCallRequest, current_user: dict = Depends(get_current_user)):
    """Log a phone call"""
    try:
        # Log communication
        communication = {
            "customer_id": request.customer_id,
            "user_id": current_user["id"],
            "type": "phone",
            "direction": request.direction,
            "content": request.notes,
            "message": request.notes,
            "notes": request.notes,
            "phone": request.phone,
            "duration": request.duration,
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "status": "completed",
            "integration": "ringcentral"
        }
        
        result = await db.communications.insert_one(communication)
        
        logger.info(f"Phone call logged for {request.phone}")
        
        return {
            "success": True,
            "message": "Call logged successfully",
            "communication_id": str(result.inserted_id)
        }
    
    except Exception as e:
        logger.error(f"Error logging phone call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log call: {str(e)}")


# ========== Get Communications ==========

@router.get("/communications")
async def get_communications(
    customer_id: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 100
):
    """Get communications for a customer"""
    try:
        query = {}
        
        if customer_id:
            query["customer_id"] = customer_id
        
        if type:
            query["type"] = type
        
        communications = await db.communications.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
        
        # Convert ObjectId to string
        for comm in communications:
            comm["_id"] = str(comm["_id"])
            if "created_at" in comm:
                comm["created_at"] = comm["created_at"].isoformat() if isinstance(comm["created_at"], datetime) else comm["created_at"]
            if "timestamp" in comm:
                comm["timestamp"] = comm["timestamp"].isoformat() if isinstance(comm["timestamp"], datetime) else comm["timestamp"]
        
        return communications
    
    except Exception as e:
        logger.error(f"Error fetching communications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== File Upload & Download ==========

@router.post("/communications/upload")
async def upload_file(
    file: UploadFile = File(...),
    customer_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload file attachment for communication"""
    try:
        # Read file data
        file_data = await file.read()
        
        # Save file using storage service
        file_metadata = file_storage_service.save_file(file_data, file.filename)
        
        # Store file metadata in database
        file_record = {
            "file_id": file_metadata["file_id"],
            "filename": file_metadata["filename"],
            "unique_filename": file_metadata["unique_filename"],
            "file_type": file_metadata["file_type"],
            "file_category": file_metadata["file_category"],
            "file_size": file_metadata["file_size"],
            "file_hash": file_metadata["file_hash"],
            "url": file_metadata["url"],
            "thumbnail_url": file_metadata.get("thumbnail_url"),
            "storage_type": file_metadata["storage_type"],
            "uploaded_by": current_user["id"],
            "customer_id": customer_id,
            "created_at": datetime.utcnow()
        }
        
        result = await db.file_attachments.insert_one(file_record)
        file_record["_id"] = str(result.inserted_id)
        
        logger.info(f"File uploaded: {file.filename} by user {current_user['id']}")
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file": file_record
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.get("/communications/file/{filename}")
async def download_file(filename: str):
    """Download file attachment"""
    try:
        file_path = file_storage_service.get_file_path(filename)
        
        if not file_storage_service.file_exists(filename):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")


@router.get("/communications/file/thumbnails/{filename}")
async def download_thumbnail(filename: str):
    """Download thumbnail"""
    try:
        thumbnail_path = os.path.join(file_storage_service.upload_dir, "thumbnails", filename)
        
        if not os.path.exists(thumbnail_path):
            raise HTTPException(status_code=404, detail="Thumbnail not found")
        
        return FileResponse(thumbnail_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading thumbnail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download thumbnail: {str(e)}")


# ========== Read Receipts ==========

@router.post("/communications/{communication_id}/mark-read")
async def mark_communication_read(
    communication_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a communication as read"""
    try:
        result = await db.communications.update_one(
            {"_id": ObjectId(communication_id)},
            {
                "$set": {
                    "read": True,
                    "read_at": datetime.utcnow(),
                    "read_by": current_user["id"]
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        logger.info(f"Communication {communication_id} marked as read by {current_user['id']}")
        
        return {
            "success": True,
            "message": "Communication marked as read"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking communication as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/communications/{communication_id}/mark-delivered")
async def mark_communication_delivered(communication_id: str):
    """Mark a communication as delivered"""
    try:
        result = await db.communications.update_one(
            {"_id": ObjectId(communication_id)},
            {
                "$set": {
                    "status": "delivered",
                    "delivered_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        logger.info(f"Communication {communication_id} marked as delivered")
        
        return {
            "success": True,
            "message": "Communication marked as delivered"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking communication as delivered: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/communications/{communication_id}/status")
async def get_communication_status(communication_id: str):
    """Get read/delivery status of a communication"""
    try:
        communication = await db.communications.find_one({"_id": ObjectId(communication_id)})
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        return {
            "communication_id": str(communication["_id"]),
            "status": communication.get("status", "sent"),
            "read": communication.get("read", False),
            "delivered_at": communication.get("delivered_at"),
            "read_at": communication.get("read_at"),
            "read_by": communication.get("read_by")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching communication status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
