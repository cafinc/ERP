from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Request, Response, Depends, Body, File, UploadFile, Form
from fastapi.responses import StreamingResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import base64
import logging
import uuid
import bcrypt
import secrets
import httpx
from pathlib import Path
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime, timedelta, timezone

# Suppress noisy Google API logs
logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.WARNING)
logging.getLogger('google_auth_httplib2').setLevel(logging.WARNING)

from models import (
    User, UserCreate, UserUpdate,
    Customer, CustomerCreate, CustomerUpdate,
    Site, SiteCreate, SiteUpdate,
    # Site Map models
    SiteMap, SiteMapCreate, SiteMapUpdate, SiteMapAnnotation,
    Equipment, EquipmentCreate, EquipmentUpdate,
    Route, RouteCreate, RouteUpdate,
    Dispatch, DispatchCreate, DispatchUpdate,
    Photo, PhotoCreate, PhotoUpdate,
    FormTemplate, FormTemplateCreate,
    FormResponse, FormResponseCreate,
    GPSLocation, GPSLocationCreate,
    Consumable, ConsumableCreate, ConsumableUpdate,
    ConsumableUsage, ConsumableUsageCreate,
    EquipmentMaintenance, MaintenanceCreate, MaintenanceUpdate,
    # Equipment Inspection models
    InspectionSchedule, InspectionScheduleCreate, InspectionScheduleUpdate,
    EquipmentInspection, EquipmentInspectionCreate, EquipmentInspectionUpdate,
    InspectionStatus, InspectionFrequency, ComplianceRule, ComplianceRuleAction,
    Invoice, InvoiceCreate, InvoiceUpdate, InvoiceLineItem,
    ServiceModel, ServiceModelCreate, ServiceModelUpdate,
    Shift, ShiftCreate, ShiftUpdate,
    CustomerFeedback, CustomerFeedbackCreate,
    Message, MessageCreate, MessageUpdate,
    # Communication models
    Communication, CommunicationCreate, CommunicationType, CommunicationDirection,
    # New Authentication models
    UserSession, PasswordResetToken, EmailLoginRequest, ForgotPasswordRequest, ResetPasswordRequest, AuthResponse,
    # Old Authentication models (OTP)
    OTPRequest, OTPVerify, PasswordResetRequest as OTPPasswordResetRequest, PasswordResetVerify,
    PasswordlessLoginRequest, PasswordlessLoginVerify, UserProfileUpdate,
    OTPRecord, MagicLinkToken,
    # Learning Document models
    LearningDocument, DocumentCreate, DocumentUpdate, DocumentCategory,
    # Direct Messaging models
    DirectMessage, DirectMessageCreate, Conversation, UserStatus,
    # Email models
    EmailSendRequest,
    # CRM Models
    Estimate, EstimateCreate, EstimateUpdate, EstimateStatus, CustomerSignature, EstimateLineItem,
    Project, ProjectCreate, ProjectUpdate, ProjectStatus,
    ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, TaskStatus,
    EnhancedInvoice, EnhancedInvoiceCreate, EnhancedInvoiceUpdate,
    InvoicePayment, InvoicePaymentCreate, PaymentStatus, PaymentTerms,
    # Call Note models
    CallNote, CallNoteCreate, CallDisposition,
    # Email Template models
    EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate,
    # Contract/Agreement models
    Contract, ContractCreate, ContractUpdate, ContractStatus, ContractType,
    ContractTemplate, ContractTemplateCreate, ContractTemplateUpdate,
    # CRM Email Link models
    EmailCustomerLink, EmailCustomerLinkCreate, EmailCustomerLinkResponse,
    # Geofence models
    GeofenceLog, GeofenceLogCreate, GeofenceEventType,
    SiteGeofence, SiteGeofenceCreate, SiteGeofenceUpdate,
    # Enhanced Customer models
    CustomerContact, CustomerContactCreate,
    ServiceRequest, ServiceRequestCreate, ServiceRequestSubService,
    CommercialAccounting,
    # Messaging System models
    ConversationCreate, MessageAttachment, MessageReadReceipt, MessageSearchParams,
    # Inventory models
    InventoryItem, InventoryItemCreate, InventoryItemUpdate, InventoryCategory, InventoryStatus,
    # Access Control models
    UserAccess, AccessGroup,
    # Automation Analytics models
    WorkflowExecution, WorkflowExecutionStatus
)
from sms_service import sms_service
from email_service import email_service
from pdf_service import pdf_service
from weather_service import weather_service
from twilio_service import twilio_service
from gmail_service import gmail_service
from google_tasks_service import google_tasks_service
from ringcentral_service import ringcentral_service
from webhook_handler import init_webhook_handler
from automation_engine import AutomationEngine
from background_scheduler import BackgroundScheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Snow Removal Business Tracking API", "version": "1.0.0"}

# ==================== USER ENDPOINTS ====================
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate, background_tasks: BackgroundTasks):
    user_dict = user.dict()
    user_dict["created_at"] = datetime.utcnow()
    
    # Hash password if provided
    if user_dict.get("password"):
        user_dict["password_hash"] = hash_password(user_dict["password"])
        # Remove plain password from dict
        del user_dict["password"]
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    # Send onboarding email for crew members and subcontractors
    if user_dict.get("role") in ["crew", "subcontractor", "admin"] and user_dict.get("email"):
        background_tasks.add_task(
            send_onboarding_email_task,
            user_dict["email"],
            user_dict["name"],
            user_dict["email"],  # Using email as username
            user_dict.get("password", "ChangeMe123!"),  # Default temp password if not provided
            user_dict["role"]
        )
    
    return User(**user_dict)

async def send_onboarding_email_task(
    email: str,
    name: str,
    username: str,
    password: str,
    role: str
):
    """Background task to send onboarding email"""
    try:
        success = email_service.send_onboarding_email(
            email,
            name,
            username,
            password,
            role
        )
        if success:
            logger.info(f"Onboarding email sent successfully to {email}")
        else:
            logger.warning(f"Failed to send onboarding email to {email}")
    except Exception as e:
        logger.error(f"Error sending onboarding email to {email}: {str(e)}")

@api_router.get("/users", response_model=List[User])
async def get_users(role: str = None):
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query).to_list(1000)
    return [User(**serialize_doc(user)) for user in users]

@api_router.get("/users/messageable")
async def get_messageable_users_route(request: Request):
    """Get all users that the current user can message"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        print(f"Messageable users request - session_token present: {bool(session_token)}")
        
        if not session_token:
            print("No session token in request - returning all users")
            # Return all non-customer users if not authenticated
            users = await db.users.find({"role": {"$ne": "customer"}}).to_list(1000)
            result = []
            for user in users:
                result.append({
                    "id": str(user["_id"]),
                    "_id": str(user["_id"]),
                    "name": user["name"],
                    "title": user.get("title", ""),
                    "role": user["role"],
                    "status": user.get("status", "offline"),
                    "avatar": user.get("avatar"),
                    "messaging_enabled": user.get("messaging_enabled", True)
                })
            print(f"Returning {len(result)} users (no auth)")
            return result
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        print(f"Session found: {bool(session)}")
        
        if not session:
            print("Invalid session token - returning all users")
            # Return all non-customer users if session invalid
            users = await db.users.find({"role": {"$ne": "customer"}}).to_list(1000)
            result = []
            for user in users:
                result.append({
                    "id": str(user["_id"]),
                    "_id": str(user["_id"]),
                    "name": user["name"],
                    "title": user.get("title", ""),
                    "role": user["role"],
                    "status": user.get("status", "offline"),
                    "avatar": user.get("avatar"),
                    "messaging_enabled": user.get("messaging_enabled", True)
                })
            print(f"Returning {len(result)} users (invalid session)")
            return result
        
        current_user = await db.users.find_one({"_id": ObjectId(session["user_id"])})
        print(f"Current user: {current_user['name'] if current_user else 'None'}, Role: {current_user['role'] if current_user else 'None'}")
        
        if not current_user:
            # Return all users if current user not found
            users = await db.users.find({"role": {"$ne": "customer"}}).to_list(1000)
            result = []
            for user in users:
                result.append({
                    "id": str(user["_id"]),
                    "_id": str(user["_id"]),
                    "name": user["name"],
                    "title": user.get("title", ""),
                    "role": user["role"],
                    "status": user.get("status", "offline"),
                    "avatar": user.get("avatar"),
                    "messaging_enabled": user.get("messaging_enabled", True)
                })
            return result
        
        # Build query based on current user role
        query = {"_id": {"$ne": ObjectId(session["user_id"])}}
        
        if current_user["role"] == "customer":
            # Customers can only message admins and crew with messaging enabled
            query["$or"] = [
                {"role": "admin"},
                {"role": {"$in": ["crew", "subcontractor"]}, "messaging_enabled": True}
            ]
        elif current_user["role"] in ["crew", "subcontractor"]:
            # Crew can message admins, other crew, and customers with messaging enabled
            query["$or"] = [
                {"role": "admin"},
                {"role": {"$in": ["crew", "subcontractor"]}},
                {"role": "customer", "messaging_enabled": True}
            ]
        # Admins can message everyone (no additional filter)
        
        users = await db.users.find(query).to_list(1000)
        
        # Format users
        result = []
        for user in users:
            result.append({
                "id": str(user["_id"]),
                "_id": str(user["_id"]),
                "name": user["name"],
                "title": user.get("title", ""),
                "role": user["role"],
                "status": user.get("status", "offline"),
                "avatar": user.get("avatar"),
                "messaging_enabled": user.get("messaging_enabled", True)
            })
        
        return result
    except Exception as e:
        print(f"Error fetching messageable users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/access")
async def get_users_with_access():
    """Get all users with access control information"""
    try:
        users = await db.users.find({"role": {"$ne": "customer"}}).to_list(1000)
        
        result = []
        for user in users:
            # Determine access group based on role
            role = user.get("role", "crew")
            if role in ["admin", "internal", "manager"]:
                access_group = AccessGroup.INTERNAL
                permissions = INTERNAL_PERMISSIONS
            else:
                access_group = AccessGroup.SUBCONTRACTOR
                permissions = SUBCONTRACTOR_PERMISSIONS
            
            result.append({
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": role,
                "access_group": access_group.value,
                "status": "active" if user.get("active", True) else "inactive",
                "permissions": permissions,
                "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
                "last_login": user.get("last_login").isoformat() if user.get("last_login") else None
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching users with access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**serialize_doc(user))

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: UserUpdate):
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Handle both ObjectId and custom ID formats
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        query = {"_id": ObjectId(user_id)}
    except:
        user = await db.users.find_one({"id": user_id})
        query = {"id": user_id}
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if driver status is being changed to True
    was_driver = user.get("is_driver", False)
    is_now_driver = update_data.get("is_driver", was_driver)
    
    result = await db.users.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one(query)
    
    # Send notifications if user is newly marked as driver and doesn't have license yet
    if is_now_driver and not was_driver and not user.get("driver_license_photo"):
        user_id_str = user.get("id") or str(user.get("_id"))
        upload_link = f"https://snowtrack-admin-2.preview.emergentagent.com/upload-license/{user_id_str}"
        
        # Send email notification
        try:
            email_sent = await email_service.send_email(
                to_email=user["email"],
                subject="Driver License Upload Required",
                body=f"""
                Hi {user['name']},
                
                You have been designated as a driver in the snow removal system.
                
                Please upload your driver's license photo by clicking the link below:
                {upload_link}
                
                This is required to complete your driver profile setup.
                
                Thank you,
                F Property Services Snow Removal Team
                """
            )
        except Exception as e:
            logger.error(f"Failed to send license upload email: {str(e)}")
        
        # Send SMS notification
        try:
            sms_sent = await sms_service.send_sms(
                to_number=user["phone"],
                message=f"Hi {user['name']}, you've been designated as a driver. Please upload your driver's license at: {upload_link}"
            )
        except Exception as e:
            logger.error(f"Failed to send license upload SMS: {str(e)}")
    
    return User(**serialize_doc(user))

@api_router.post("/users/{user_id}/documents")
async def add_user_document(user_id: str, document: dict):
    """Add a document to user's document list"""
    # Handle both ObjectId and custom ID formats
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        query = {"_id": ObjectId(user_id)}
    except:
        user = await db.users.find_one({"id": user_id})
        query = {"id": user_id}
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add document with metadata
    document["uploaded_at"] = datetime.utcnow()
    document["id"] = secrets.token_urlsafe(16)
    
    await db.users.update_one(
        query,
        {"$push": {"documents": document}}
    )
    
    return {"success": True, "document": document}

@api_router.delete("/users/{user_id}/documents/{document_id}")
async def delete_user_document(user_id: str, document_id: str):
    """Delete a document from user's document list"""
    # Handle both ObjectId and custom ID formats
    try:
        query = {"_id": ObjectId(user_id)}
    except:
        query = {"id": user_id}
    
    result = await db.users.update_one(
        query,
        {"$pull": {"documents": {"id": document_id}}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Document deleted"}

@api_router.get("/users/{user_id}/notification-preferences")
async def get_notification_preferences(user_id: str):
    """Get user's notification preferences"""
    # Handle both ObjectId and custom ID formats
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return existing preferences or default values
    preferences = user.get("notification_preferences", {
        "dispatch_assignments_email": True,
        "dispatch_assignments_sms": True,
        "dispatch_assignments_inapp": True,
        "route_updates_email": True,
        "route_updates_sms": True,
        "route_updates_inapp": True,
        "weather_alerts_email": True,
        "weather_alerts_sms": True,
        "weather_alerts_inapp": True,
        "shift_reminders_email": True,
        "shift_reminders_sms": True,
        "shift_reminders_inapp": True,
        "equipment_alerts_email": True,
        "equipment_alerts_sms": False,
        "equipment_alerts_inapp": True,
        "customer_messages_email": True,
        "customer_messages_sms": False,
        "customer_messages_inapp": True,
        "system_updates_email": True,
        "system_updates_sms": False,
        "system_updates_inapp": True,
        "emergency_notifications_email": True,
        "emergency_notifications_sms": True,
        "emergency_notifications_inapp": True,
    })
    
    return {"success": True, "preferences": preferences}

@api_router.put("/users/{user_id}/notification-preferences")
async def update_notification_preferences(user_id: str, preferences: dict):
    """Update user's notification preferences"""
    # Handle both ObjectId and custom ID formats
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        query = {"_id": ObjectId(user_id)}
    except:
        user = await db.users.find_one({"id": user_id})
        query = {"id": user_id}
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        query,
        {"$set": {"notification_preferences": preferences}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Notification preferences updated", "preferences": preferences}

# ==================== IN-APP NOTIFICATIONS ENDPOINTS ====================
@api_router.get("/notifications/{user_id}")
async def get_user_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get in-app notifications for a user"""
    try:
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        
        notifications = await db.notifications.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        return [serialize_doc(notif) for notif in notifications]
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return []

@api_router.get("/notifications/{user_id}/unread-count")
async def get_unread_count(user_id: str):
    """Get count of unread notifications for a user"""
    try:
        count = await db.notifications.count_documents({"user_id": user_id, "read": False})
        return {"count": count}
    except Exception as e:
        logger.error(f"Error counting unread notifications: {str(e)}")
        return {"count": 0}

@api_router.post("/notifications")
async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "general",
    action_url: str = None
):
    """Create a new in-app notification"""
    try:
        notification = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "action_url": action_url,
            "read": False,
            "created_at": datetime.utcnow()
        }
        result = await db.notifications.insert_one(notification)
        notification["id"] = str(result.inserted_id)
        return {"success": True, "notification": serialize_doc(notification)}
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create notification")

@api_router.put("/notifications/{notification_id}/mark-read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        result = await db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True}
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

@api_router.put("/notifications/{user_id}/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    try:
        result = await db.notifications.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        return {"success": True, "updated_count": result.modified_count}
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notifications")

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    try:
        result = await db.notifications.delete_one({"_id": ObjectId(notification_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ==================== QUICKBOOKS AUTO-SYNC HELPERS ====================
def sync_customer_to_quickbooks(customer_data: dict):
    """Background task to sync customer to QuickBooks - runs synchronously in background"""
    import requests
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio
    import os
    
    async def async_sync():
        try:
            # Get MongoDB connection
            mongo_url = os.environ['MONGO_URL']
            client = AsyncIOMotorClient(mongo_url)
            db_conn = client[os.environ['DB_NAME']]
            
            # Get active QuickBooks connections
            connections = await db_conn.quickbooks_connections.find({"is_active": True}).to_list(100)
            
            for connection in connections:
                # Check if auto-sync is enabled
                if not connection.get("sync_settings", {}).get("auto_sync_customers", True):
                    continue
                
                # Prepare customer data for QuickBooks
                qb_customer_data = {
                    "DisplayName": customer_data.get("name", ""),
                }
                
                # Split name into first and last if not already split
                name = customer_data.get("name", "")
                name_parts = name.split(" ", 1)
                if len(name_parts) == 2:
                    qb_customer_data["GivenName"] = name_parts[0]
                    qb_customer_data["FamilyName"] = name_parts[1]
                else:
                    qb_customer_data["GivenName"] = name
                
                if customer_data.get("email"):
                    qb_customer_data["PrimaryEmailAddr"] = {"Address": customer_data["email"]}
                
                if customer_data.get("phone"):
                    qb_customer_data["PrimaryPhone"] = {"FreeFormNumber": customer_data["phone"]}
                
                if customer_data.get("address"):
                    qb_customer_data["BillAddr"] = {
                        "Line1": customer_data["address"],
                    }
                
                # Make API call to QuickBooks (in thread pool to not block)
                user_id = connection["user_id"]
                
                try:
                    # Use run_in_executor to make blocking requests.post non-blocking
                    loop = asyncio.get_event_loop()
                    response = await loop.run_in_executor(
                        None,
                        lambda: requests.post(
                            f"https://snowtrack-admin-2.preview.emergentagent.com/api/quickbooks/customers?user_id={user_id}",
                            json=qb_customer_data,
                            timeout=10
                        )
                    )
                    
                    if response.status_code == 200:
                        logger.info(f"Successfully synced customer {customer_data.get('name')} to QuickBooks")
                    else:
                        logger.error(f"Failed to sync customer to QuickBooks: {response.status_code} - {response.text}")
                        
                except Exception as e:
                    logger.error(f"Error syncing customer to QuickBooks: {e}")
                    
        except Exception as e:
            logger.error(f"Error in sync_customer_to_quickbooks: {e}")
    
    # Run the async function
    try:
        asyncio.create_task(async_sync())
    except RuntimeError:
        # If no event loop, run in new loop
        asyncio.run(async_sync())

async def sync_invoice_to_quickbooks(invoice_data: dict):
    """Background task to sync invoice to QuickBooks"""
    try:
        connections = await db.quickbooks_connections.find({"is_active": True}).to_list(100)
        
        for connection in connections:
            if not connection.get("sync_settings", {}).get("auto_sync_invoices", True):
                continue
            
            # Get customer ID from invoice
            customer_id = invoice_data.get("customer_id")
            if not customer_id:
                logger.error("Invoice missing customer_id, cannot sync")
                continue
            
            # TODO: Need to map customer to QuickBooks customer ID
            # For now, we'll skip this and let manual sync handle it
            logger.info(f"Invoice {invoice_data.get('invoice_number')} created but requires manual QuickBooks mapping")
            
    except Exception as e:
        logger.error(f"Error in sync_invoice_to_quickbooks: {e}")

async def sync_payment_to_quickbooks(payment_data: dict, invoice_id: str):
    """Background task to sync payment to QuickBooks"""
    try:
        connections = await db.quickbooks_connections.find({"is_active": True}).to_list(100)
        
        for connection in connections:
            if not connection.get("sync_settings", {}).get("auto_sync_payments", True):
                continue
            
            # Get invoice details
            invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
            if not invoice:
                logger.error(f"Invoice {invoice_id} not found for payment sync")
                continue
            
            logger.info(f"Payment for invoice {invoice_id} created but requires manual QuickBooks mapping")
            
    except Exception as e:
        logger.error(f"Error in sync_payment_to_quickbooks: {e}")

async def sync_estimate_to_quickbooks(estimate_data: dict):
    """Background task to sync estimate to QuickBooks"""
    try:
        connections = await db.quickbooks_connections.find({"is_active": True}).to_list(100)
        
        for connection in connections:
            if not connection.get("sync_settings", {}).get("auto_sync_estimates", True):
                continue
            
            logger.info(f"Estimate {estimate_data.get('estimate_number')} created but requires manual QuickBooks mapping")
            
    except Exception as e:
        logger.error(f"Error in sync_estimate_to_quickbooks: {e}")

# ==================== CUSTOMER ENDPOINTS ====================
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_dict = customer.dict()
    customer_dict["created_at"] = datetime.utcnow()
    customer_dict["active"] = True
    result = await db.customers.insert_one(customer_dict)
    customer_dict["id"] = str(result.inserted_id)
    
    # Note: QuickBooks sync can be triggered manually via /api/quickbooks/customers endpoint
    # Removed auto-sync to keep customer creation fast
    
    return Customer(**customer_dict)

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(active: bool = None):
    query = {}
    if active is not None:
        query["active"] = active
    customers = await db.customers.find(query).to_list(1000)
    
    # Filter out customers with invalid data (like invalid emails)
    valid_customers = []
    for customer in customers:
        try:
            valid_customers.append(Customer(**serialize_doc(customer)))
        except Exception as e:
            # Log the error but don't crash - skip invalid customers
            print(f"Skipping invalid customer {customer.get('_id')}: {str(e)}")
            continue
    
    return valid_customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**serialize_doc(customer))

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_update: CustomerUpdate):
    update_data = {k: v for k, v in customer_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.customers.update_one(
        {"_id": ObjectId(customer_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
    return Customer(**serialize_doc(customer))

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"_id": ObjectId(customer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# ==================== CUSTOMER ACTIVITY & STATS ENDPOINTS ====================
@api_router.get("/customers/{customer_id}/activity")
async def get_customer_activity(customer_id: str, limit: int = 50):
    """Get activity timeline for a customer"""
    try:
        # Get activity logs
        activity_logs = await db.activity_logs.find({"customer_id": customer_id}).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Auto-generate activities from estimates, invoices, projects
        activities = []
        
        # Get estimates
        estimates = await db.estimates.find({"customer_id": customer_id}).to_list(100)
        for est in estimates:
            activities.append({
                "activity_type": "estimate_created",
                "title": f"Estimate {est.get('estimate_number')} created",
                "description": f"Amount: ${est.get('total_amount', 0):.2f}",
                "amount": est.get('total_amount'),
                "related_id": str(est.get('_id')),
                "related_type": "estimate",
                "created_at": est.get('created_at')
            })
            if est.get('accepted_at'):
                activities.append({
                    "activity_type": "estimate_accepted",
                    "title": f"Estimate {est.get('estimate_number')} accepted",
                    "amount": est.get('total_amount'),
                    "related_id": str(est.get('_id')),
                    "related_type": "estimate",
                    "created_at": est.get('accepted_at')
                })
        
        # Get invoices
        invoices = await db.invoices.find({"customer_id": customer_id}).to_list(100)
        for inv in invoices:
            activities.append({
                "activity_type": "invoice_created",
                "title": f"Invoice {inv.get('invoice_number')} created",
                "description": f"Amount: ${inv.get('total_amount', 0):.2f}",
                "amount": inv.get('total_amount'),
                "related_id": str(inv.get('_id')),
                "related_type": "invoice",
                "created_at": inv.get('created_at')
            })
            
            # Add payment activities
            for payment in inv.get('payments', []):
                activities.append({
                    "activity_type": "payment_received",
                    "title": f"Payment received for {inv.get('invoice_number')}",
                    "description": f"${payment.get('amount', 0):.2f} via {payment.get('payment_method', 'unknown')}",
                    "amount": payment.get('amount'),
                    "related_id": str(inv.get('_id')),
                    "related_type": "invoice",
                    "created_at": payment.get('payment_date')
                })
        
        # Get projects
        projects = await db.projects.find({"customer_id": customer_id}).to_list(100)
        for proj in projects:
            activities.append({
                "activity_type": "project_created",
                "title": f"Project {proj.get('project_number')} created",
                "description": proj.get('name'),
                "related_id": str(proj.get('_id')),
                "related_type": "project",
                "created_at": proj.get('created_at')
            })
            if proj.get('completed_at'):
                activities.append({
                    "activity_type": "project_completed",
                    "title": f"Project {proj.get('project_number')} completed",
                    "related_id": str(proj.get('_id')),
                    "related_type": "project",
                    "created_at": proj.get('completed_at')
                })
        
        # Add manual activity logs
        for log in activity_logs:
            activities.append(serialize_doc(log))
        
        # Sort by date
        activities.sort(key=lambda x: x.get('created_at') or datetime.min, reverse=True)
        
        return activities[:limit]
    except Exception as e:
        logger.error(f"Error getting customer activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get customer activity")

@api_router.post("/customers/{customer_id}/activity")
async def create_activity_log(customer_id: str, activity: dict):
    """Create a manual activity log entry"""
    try:
        activity_dict = {
            "customer_id": customer_id,
            "activity_type": activity.get("activity_type", "note"),
            "title": activity.get("title"),
            "description": activity.get("description"),
            "created_by": activity.get("created_by"),
            "created_at": datetime.utcnow()
        }
        
        result = await db.activity_logs.insert_one(activity_dict)
        activity_dict["id"] = str(result.inserted_id)
        
        return activity_dict
    except Exception as e:
        logger.error(f"Error creating activity log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create activity log")

@api_router.get("/customers/{customer_id}/stats")
async def get_customer_stats(customer_id: str):
    """Get customer statistics and metrics"""
    try:
        # Calculate total revenue
        invoices = await db.invoices.find({"customer_id": customer_id}).to_list(1000)
        total_revenue = sum(inv.get('total_amount', 0) for inv in invoices)
        total_paid = sum(inv.get('amount_paid', 0) for inv in invoices)
        total_outstanding = sum(inv.get('amount_due', 0) for inv in invoices)
        
        # Count records
        estimates_count = await db.estimates.count_documents({"customer_id": customer_id})
        projects_count = await db.projects.count_documents({"customer_id": customer_id})
        invoices_count = len(invoices)
        
        # Calculate average project value
        avg_project_value = total_revenue / projects_count if projects_count > 0 else 0
        
        # Get first interaction date
        customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
        customer_since = customer.get('created_at') if customer else None
        
        # Update customer total_revenue
        if customer:
            await db.customers.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": {"total_revenue": total_revenue}}
            )
        
        return {
            "total_revenue": total_revenue,
            "total_paid": total_paid,
            "total_outstanding": total_outstanding,
            "estimates_count": estimates_count,
            "projects_count": projects_count,
            "invoices_count": invoices_count,
            "avg_project_value": avg_project_value,
            "customer_since": customer_since
        }
    except Exception as e:
        logger.error(f"Error getting customer stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get customer stats")



# ==================== SERVICE REQUEST ENDPOINTS ====================

@api_router.post("/service-requests", response_model=ServiceRequest)
async def create_service_request(request_data: ServiceRequestCreate):
    """Create a new service request from a customer call"""
    try:
        # Get customer info
        customer = await db.customers.find_one({"_id": ObjectId(request_data.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get site info if provided
        site_name = None
        if request_data.site_id:
            site = await db.sites.find_one({"_id": ObjectId(request_data.site_id)})
            site_name = site.get("name") if site else None
        
        request_dict = {
            "customer_id": request_data.customer_id,
            "customer_name": customer.get("name"),
            "site_id": request_data.site_id,
            "site_name": site_name,
            "service_type": request_data.service_type,
            "sub_services": [s.dict() for s in request_data.sub_services],
            "urgency": request_data.urgency,
            "requested_date": request_data.requested_date,
            "notes": request_data.notes,
            "status": "pending",
            "created_by": request_data.created_by if hasattr(request_data, 'created_by') else None,
            "created_at": datetime.utcnow()
        }
        
        result = await db.service_requests.insert_one(request_dict)
        request_dict["id"] = str(result.inserted_id)
        
        # Create a message for the service request
        await db.messages.insert_one({
            "type": "service_request",
            "title": f"New Service Request: {request_data.service_type}",
            "content": f"{customer.get('name')} requested {request_data.service_type} services",
            "status": "pending",
            "priority": "high" if request_data.urgency in ["high", "emergency"] else "normal",
            "from_user_name": "Service Request System",
            "source_type": "service_request",
            "customer_id": request_data.customer_id,
            "site_id": request_data.site_id,
            "created_at": datetime.utcnow()
        })
        
        return ServiceRequest(**request_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating service request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-requests")
async def get_service_requests(
    customer_id: Optional[str] = None,
    site_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """Get service requests with optional filters"""
    try:
        query = {}
        if customer_id:
            query["customer_id"] = customer_id
        if site_id:
            query["site_id"] = site_id
        if status:
            query["status"] = status
        
        requests = []
        async for req in db.service_requests.find(query).sort("created_at", -1).limit(limit):
            requests.append(ServiceRequest(**serialize_doc(req)))
        
        return {"requests": requests, "total": len(requests)}
    except Exception as e:
        logger.error(f"Error getting service requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-requests/{request_id}")
async def get_service_request(request_id: str):
    """Get a specific service request"""
    try:
        request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
        if not request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        return ServiceRequest(**serialize_doc(request))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting service request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/service-requests/{request_id}/status")
async def update_service_request_status(request_id: str, status: str):
    """Update service request status"""
    try:
        valid_statuses = ["pending", "approved", "scheduled", "completed", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        result = await db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        updated = await db.service_requests.find_one({"_id": ObjectId(request_id)})
        return ServiceRequest(**serialize_doc(updated))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating service request status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/customers/{customer_id}/contacts", response_model=CustomerContact)
async def add_customer_contact(customer_id: str, contact: CustomerContactCreate):
    """Add a contact to a customer (for commercial customers)"""
    try:
        customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        contact_dict = contact.dict()
        contact_dict["id"] = str(ObjectId())
        
        # If this is primary, unset others
        if contact.is_primary:
            await db.customers.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": {"contacts.$[].is_primary": False}}
            )
        
        await db.customers.update_one(
            {"_id": ObjectId(customer_id)},
            {"$push": {"contacts": contact_dict}}
        )
        
        return CustomerContact(**contact_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding customer contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/customers/{customer_id}/contacts/{contact_id}")
async def remove_customer_contact(customer_id: str, contact_id: str):
    """Remove a contact from a customer"""
    try:
        result = await db.customers.update_one(
            {"_id": ObjectId(customer_id)},
            {"$pull": {"contacts": {"id": contact_id}}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return {"message": "Contact removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing customer contact: {e}")

# Company-Individual Relationship Endpoints
@api_router.post("/customers/{company_id}/link-individual/{individual_id}")
async def link_individual_to_company(company_id: str, individual_id: str):
    """Link an individual customer to a company"""
    try:
        # Verify company exists and is of type 'company'
        company = await db.customers.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        if company.get("customer_type") != "company":
            raise HTTPException(status_code=400, detail="Target customer must be of type 'company'")
        
        # Verify individual exists
        individual = await db.customers.find_one({"_id": ObjectId(individual_id)})
        if not individual:
            raise HTTPException(status_code=404, detail="Individual not found")
        
        # Update individual to link to company
        await db.customers.update_one(
            {"_id": ObjectId(individual_id)},
            {"$set": {
                "company_id": company_id,
                "company_name": company.get("name")
            }}
        )
        
        # Add individual to company's contact_ids if not already there
        if individual_id not in company.get("contact_ids", []):
            await db.customers.update_one(
                {"_id": ObjectId(company_id)},
                {"$addToSet": {"contact_ids": individual_id}}
            )
        
        return {"message": "Individual linked to company successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking individual to company: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/customers/{company_id}/unlink-individual/{individual_id}")
async def unlink_individual_from_company(company_id: str, individual_id: str):
    """Unlink an individual from a company"""
    try:
        # Remove company link from individual
        await db.customers.update_one(
            {"_id": ObjectId(individual_id)},
            {"$unset": {"company_id": "", "company_name": ""}}
        )
        
        # Remove individual from company's contact_ids
        await db.customers.update_one(
            {"_id": ObjectId(company_id)},
            {"$pull": {"contact_ids": individual_id}}
        )
        
        return {"message": "Individual unlinked from company successfully"}
    except Exception as e:
        logger.error(f"Error unlinking individual from company: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers/{company_id}/contacts")
async def get_company_contacts(company_id: str):
    """Get all individuals linked to a company"""
    try:
        company = await db.customers.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        contact_ids = company.get("contact_ids", [])
        if not contact_ids:
            return {"contacts": []}
        
        # Get all individuals linked to this company
        contacts = []
        for contact_id in contact_ids:
            try:
                contact = await db.customers.find_one({"_id": ObjectId(contact_id)})
                if contact:
                    contacts.append(serialize_doc(contact))
            except:
                continue
        
        return {"contacts": contacts, "total": len(contacts)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company contacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


        raise HTTPException(status_code=500, detail=str(e))


# ==================== COMMUNICATION CENTER ENDPOINTS ====================
@api_router.get("/customers/{customer_id}/communications")
async def get_customer_communications(
    customer_id: str,
    type: Optional[str] = None,
    read: Optional[bool] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    current_user_id: Optional[str] = None
):
    """Get all communications for a customer with optional filters, respecting privacy settings"""
    try:
        query = {"customer_id": customer_id}
        
        if type:
            query["type"] = type
        if read is not None:
            query["read"] = read
        
        # Date range filter
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                date_query["$lte"] = datetime.fromisoformat(end_date)
            if date_query:
                query["created_at"] = date_query
        
        communications = await db.communications.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Filter based on privacy settings if current_user_id is provided
        if current_user_id:
            try:
                user = await db.users.find_one({"_id": ObjectId(current_user_id)})
            except:
                user = await db.users.find_one({"_id": current_user_id})
            
            is_admin = user and user.get("role") == "admin"
            
            filtered_comms = []
            for comm in communications:
                comm_obj = Communication(**serialize_doc(comm))
                
                # If not private, show as is
                if not comm_obj.is_private:
                    filtered_comms.append(comm_obj)
                # If private and user is owner or has access, show full
                elif is_admin and (comm_obj.private_owner_id == current_user_id or current_user_id in comm_obj.access_granted_to):
                    filtered_comms.append(comm_obj)
                # If private and user doesn't have access, show blurred version
                elif is_admin:
                    # Mark as blurred for frontend
                    comm_dict = comm_obj.dict()
                    comm_dict["content"] = "[PRIVATE - Request Access]"
                    comm_dict["subject"] = "[PRIVATE]" if comm_dict.get("subject") else None
                    comm_dict["is_blurred"] = True
                    filtered_comms.append(Communication(**comm_dict))
                # Non-admin users don't see private messages at all
            
            return filtered_comms
        else:
            # No filtering if no user provided
            return [Communication(**serialize_doc(comm)) for comm in communications]
    except Exception as e:
        logger.error(f"Error fetching communications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch communications")


@api_router.get("/communications/all")
async def get_all_communications(
    type: Optional[str] = None,
    limit: int = 100,
    current_user_id: Optional[str] = None
):
    """Get all communications across all customers with optional filters"""
    try:
        query = {}
        
        if type:
            query["type"] = type
        
        communications = await db.communications.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Filter based on privacy settings if current_user_id is provided
        if current_user_id:
            try:
                user = await db.users.find_one({"_id": ObjectId(current_user_id)})
            except:
                user = await db.users.find_one({"_id": current_user_id})
            
            is_admin = user and user.get("role") == "admin"
            
            filtered_comms = []
            for comm in communications:
                comm_obj = Communication(**serialize_doc(comm))
                
                # If not private, show as is
                if not comm_obj.is_private:
                    filtered_comms.append(comm_obj)
                # If private and user is owner or has access, show full
                elif is_admin and (comm_obj.private_owner_id == current_user_id or current_user_id in comm_obj.access_granted_to):
                    filtered_comms.append(comm_obj)
                # If private and user doesn't have access, show blurred version
                elif is_admin:
                    comm_dict = comm_obj.dict()
                    comm_dict["content"] = "[PRIVATE - Request Access]"
                    comm_dict["subject"] = "[PRIVATE]" if comm_dict.get("subject") else None
                    comm_dict["is_blurred"] = True
                    filtered_comms.append(Communication(**comm_dict))
            
            return filtered_comms
        else:
            return [Communication(**serialize_doc(comm)) for comm in communications]
    except Exception as e:
        logger.error(f"Error fetching all communications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch communications")

@api_router.post("/customers/{customer_id}/communications", response_model=Communication)
async def create_communication(customer_id: str, communication: CommunicationCreate, background_tasks: BackgroundTasks):
    """Send a new communication to a customer"""
    try:
        # Get customer details
        try:
            customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
        except Exception:
            # Invalid ObjectId format
            raise HTTPException(status_code=404, detail="Customer not found")
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get current user from context (you might need to implement auth context)
        # For now, we'll use a placeholder
        current_user_id = "admin"  # TODO: Get from auth context
        current_user_name = "Admin"  # TODO: Get from auth context
        
        comm_dict = {
            "customer_id": customer_id,
            "type": communication.type,
            "direction": CommunicationDirection.SENT,
            "subject": communication.subject,
            "content": communication.content,
            "sent_by": current_user_id,
            "sent_by_name": current_user_name,
            "read": True,  # Sent messages are marked as read by default
            "created_at": datetime.utcnow()
        }
        
        result = await db.communications.insert_one(comm_dict)
        comm_dict["id"] = str(result.inserted_id)
        
        # Send actual message based on type
        if communication.type == CommunicationType.EMAIL:
            background_tasks.add_task(
                send_email_communication,
                customer.get("email"),
                communication.subject or "Message from CAF Property Services",
                communication.content
            )
        elif communication.type == CommunicationType.SMS:
            background_tasks.add_task(
                send_sms_communication,
                customer.get("phone"),
                communication.content
            )
        # APP_MESSAGE type doesn't need external sending
        
        return Communication(**comm_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating communication: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create communication")

async def send_email_communication(email: str, subject: str, body: str):
    """Background task to send email"""
    try:
        if email:
            await email_service.send_email(to_email=email, subject=subject, body=body)
            logger.info(f"Email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")

async def send_sms_communication(phone: str, message: str):
    """Background task to send SMS"""
    try:
        if phone:
            await sms_service.send_sms(to_number=phone, message=message)
            logger.info(f"SMS sent successfully to {phone}")
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")

@api_router.patch("/communications/{communication_id}/read")
async def mark_communication_read(communication_id: str, read: bool = True):
    """Mark a communication as read or unread"""
    try:
        try:
            result = await db.communications.update_one(
                {"_id": ObjectId(communication_id)},
                {"$set": {"read": read}}
            )
        except Exception:
            # Invalid ObjectId format
            raise HTTPException(status_code=404, detail="Communication not found")
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        return {"success": True, "message": "Communication updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating communication: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update communication")


# ==================== COMMUNICATION & MESSAGE PRIVACY/LINKING ENDPOINTS ====================

@api_router.patch("/communications/{communication_id}/privacy")
async def toggle_communication_privacy(
    communication_id: str,
    is_private: bool,
    current_user_id: str
):
    """Mark a communication as private or public"""
    try:
        # Verify user is admin (simple check, can be enhanced)
        try:
            user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        except:
            user = await db.users.find_one({"_id": current_user_id})
        
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can mark communications as private")
        
        update_data = {
            "is_private": is_private,
        }
        
        if is_private:
            update_data["private_owner_id"] = current_user_id
        else:
            # When making public, clear privacy fields
            update_data["private_owner_id"] = None
            update_data["access_granted_to"] = []
            update_data["pending_access_requests"] = []
        
        try:
            result = await db.communications.update_one(
                {"_id": ObjectId(communication_id)},
                {"$set": update_data}
            )
        except Exception:
            result = await db.communications.update_one(
                {"_id": communication_id},
                {"$set": update_data}
            )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        return {"success": True, "is_private": is_private}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling communication privacy: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update privacy")

@api_router.post("/communications/{communication_id}/request-access")
async def request_communication_access(
    communication_id: str,
    requester_id: str,
    requester_name: str,
    
):
    """Request access to a private communication"""
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can request access")
        
        # Get the communication
        try:
            comm = await db.communications.find_one({"_id": ObjectId(communication_id)})
        except Exception:
            comm = await db.communications.find_one({"_id": communication_id})
        
        if not comm:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        # Check if already has access
        if requester_id in comm.get("access_granted_to", []):
            return {"success": True, "message": "Already has access"}
        
        # Check if already requested
        if requester_id in comm.get("pending_access_requests", []):
            return {"success": True, "message": "Access already requested"}
        
        # Add to pending requests
        try:
            await db.communications.update_one(
                {"_id": ObjectId(communication_id)},
                {"$addToSet": {"pending_access_requests": requester_id}}
            )
        except Exception:
            await db.communications.update_one(
                {"_id": communication_id},
                {"$addToSet": {"pending_access_requests": requester_id}}
            )
        
        # Create notification for the owner
        owner_id = comm.get("private_owner_id")
        if owner_id:
            notification = {
                "user_id": owner_id,
                "type": "access_request",
                "title": "Communication Access Request",
                "message": f"{requester_name} requested access to a private communication",
                "data": {
                    "communication_id": communication_id,
                    "requester_id": requester_id,
                    "requester_name": requester_name
                },
                "read": False,
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notification)
        
        return {"success": True, "message": "Access requested"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to request access")

@api_router.post("/communications/{communication_id}/grant-access")
async def grant_communication_access(
    communication_id: str,
    requester_id: str,
    approved: bool,
    
):
    """Grant or deny access to a private communication"""
    try:
        # Get the communication
        try:
            comm = await db.communications.find_one({"_id": ObjectId(communication_id)})
        except Exception:
            comm = await db.communications.find_one({"_id": communication_id})
        
        if not comm:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        # Check if current user is the owner
        current_user_id = str(current_user.get("_id"))
        if comm.get("private_owner_id") != current_user_id:
            raise HTTPException(status_code=403, detail="Only the owner can grant access")
        
        # Remove from pending requests
        try:
            await db.communications.update_one(
                {"_id": ObjectId(communication_id)},
                {"$pull": {"pending_access_requests": requester_id}}
            )
        except Exception:
            await db.communications.update_one(
                {"_id": communication_id},
                {"$pull": {"pending_access_requests": requester_id}}
            )
        
        # If approved, add to access granted list
        if approved:
            try:
                await db.communications.update_one(
                    {"_id": ObjectId(communication_id)},
                    {"$addToSet": {"access_granted_to": requester_id}}
                )
            except Exception:
                await db.communications.update_one(
                    {"_id": communication_id},
                    {"$addToSet": {"access_granted_to": requester_id}}
                )
        
        # Create notification for the requester
        notification = {
            "user_id": requester_id,
            "type": "access_response",
            "title": "Communication Access " + ("Granted" if approved else "Denied"),
            "message": f"Your request to access a private communication was {('approved' if approved else 'denied')}",
            "data": {
                "communication_id": communication_id,
                "approved": approved
            },
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {"success": True, "approved": approved}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error granting access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to grant access")

# Same endpoints for Messages
@api_router.patch("/messages/{message_id}/privacy")
async def toggle_message_privacy(
    message_id: str,
    is_private: bool,
    current_user_id: str,
    
):
    """Mark a message as private or public"""
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can mark messages as private")
        
        update_data = {
            "is_private": is_private,
        }
        
        if is_private:
            update_data["private_owner_id"] = current_user_id
        else:
            update_data["private_owner_id"] = None
            update_data["access_granted_to"] = []
            update_data["pending_access_requests"] = []
        
        try:
            result = await db.messages.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": update_data}
            )
        except Exception:
            result = await db.messages.update_one(
                {"_id": message_id},
                {"$set": update_data}
            )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"success": True, "is_private": is_private}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling message privacy: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update privacy")

@api_router.post("/messages/{message_id}/request-access")
async def request_message_access(
    message_id: str,
    requester_id: str,
    requester_name: str,
    
):
    """Request access to a private message"""
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can request access")
        
        try:
            msg = await db.messages.find_one({"_id": ObjectId(message_id)})
        except Exception:
            msg = await db.messages.find_one({"_id": message_id})
        
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if requester_id in msg.get("access_granted_to", []):
            return {"success": True, "message": "Already has access"}
        
        if requester_id in msg.get("pending_access_requests", []):
            return {"success": True, "message": "Access already requested"}
        
        try:
            await db.messages.update_one(
                {"_id": ObjectId(message_id)},
                {"$addToSet": {"pending_access_requests": requester_id}}
            )
        except Exception:
            await db.messages.update_one(
                {"_id": message_id},
                {"$addToSet": {"pending_access_requests": requester_id}}
            )
        
        owner_id = msg.get("private_owner_id")
        if owner_id:
            notification = {
                "user_id": owner_id,
                "type": "access_request",
                "title": "Message Access Request",
                "message": f"{requester_name} requested access to a private message",
                "data": {
                    "message_id": message_id,
                    "requester_id": requester_id,
                    "requester_name": requester_name
                },
                "read": False,
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notification)
        
        return {"success": True, "message": "Access requested"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to request access")

@api_router.post("/messages/{message_id}/grant-access")
async def grant_message_access(
    message_id: str,
    requester_id: str,
    approved: bool,
    
):
    """Grant or deny access to a private message"""
    try:
        try:
            msg = await db.messages.find_one({"_id": ObjectId(message_id)})
        except Exception:
            msg = await db.messages.find_one({"_id": message_id})
        
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        current_user_id = str(current_user.get("_id"))
        if msg.get("private_owner_id") != current_user_id:
            raise HTTPException(status_code=403, detail="Only the owner can grant access")
        
        try:
            await db.messages.update_one(
                {"_id": ObjectId(message_id)},
                {"$pull": {"pending_access_requests": requester_id}}
            )
        except Exception:
            await db.messages.update_one(
                {"_id": message_id},
                {"$pull": {"pending_access_requests": requester_id}}
            )
        
        if approved:
            try:
                await db.messages.update_one(
                    {"_id": ObjectId(message_id)},
                    {"$addToSet": {"access_granted_to": requester_id}}
                )
            except Exception:
                await db.messages.update_one(
                    {"_id": message_id},
                    {"$addToSet": {"access_granted_to": requester_id}}
                )
        
        notification = {
            "user_id": requester_id,
            "type": "access_response",
            "title": "Message Access " + ("Granted" if approved else "Denied"),
            "message": f"Your request to access a private message was {('approved' if approved else 'denied')}",
            "data": {
                "message_id": message_id,
                "approved": approved
            },
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {"success": True, "approved": approved}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error granting access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to grant access")

# Linking endpoints
@api_router.post("/communications/{communication_id}/link-to-message")
async def link_communication_to_message(
    communication_id: str,
    customer_id: str,
    
):
    """Create a message board entry from a communication"""
    try:
        # Get the communication
        try:
            comm = await db.communications.find_one({"_id": ObjectId(communication_id)})
        except Exception:
            comm = await db.communications.find_one({"_id": communication_id})
        
        if not comm:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        # Check if already linked
        if comm.get("linked_message_id"):
            return {"success": True, "message_id": comm["linked_message_id"], "already_linked": True}
        
        # Create message board entry
        message_data = {
            "type": "customer_feedback",
            "status": "pending",
            "priority": "normal",
            "source_type": "customer_communication",
            "source_id": communication_id,
            "customer_id": customer_id,
            "from_user_name": comm.get("sent_by_name", "Customer"),
            "title": comm.get("subject") or f"{comm.get('type', 'Communication')} from customer",
            "content": comm.get("content", ""),
            "created_at": comm.get("created_at", datetime.utcnow()),
            "is_private": comm.get("is_private", False),
            "private_owner_id": comm.get("private_owner_id"),
            "access_granted_to": comm.get("access_granted_to", []),
            "linked_communication_id": communication_id
        }
        
        result = await db.messages.insert_one(message_data)
        message_id = str(result.inserted_id)
        
        # Update communication with link
        try:
            await db.communications.update_one(
                {"_id": ObjectId(communication_id)},
                {"$set": {"linked_message_id": message_id}}
            )
        except Exception:
            await db.communications.update_one(
                {"_id": communication_id},
                {"$set": {"linked_message_id": message_id}}
            )
        
        return {"success": True, "message_id": message_id, "already_linked": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking communication to message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to link communication")

@api_router.post("/messages/{message_id}/link-to-communication")
async def link_message_to_communication(
    message_id: str,
    customer_id: str,
    
):
    """Create a communication entry from a message board item"""
    try:
        # Get the message
        try:
            msg = await db.messages.find_one({"_id": ObjectId(message_id)})
        except Exception:
            msg = await db.messages.find_one({"_id": message_id})
        
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Check if already linked
        if msg.get("linked_communication_id"):
            return {"success": True, "communication_id": msg["linked_communication_id"], "already_linked": True}
        
        # Create communication entry
        comm_data = {
            "customer_id": customer_id,
            "type": "BOARD",
            "direction": "received",
            "subject": msg.get("title", "Message from board"),
            "content": msg.get("content", ""),
            "sent_by": msg.get("from_user_id"),
            "sent_by_name": msg.get("from_user_name", "Admin"),
            "read": False,
            "created_at": msg.get("created_at", datetime.utcnow()),
            "is_private": msg.get("is_private", False),
            "private_owner_id": msg.get("private_owner_id"),
            "access_granted_to": msg.get("access_granted_to", []),
            "linked_message_id": message_id
        }
        
        result = await db.communications.insert_one(comm_data)
        communication_id = str(result.inserted_id)
        
        # Update message with link
        try:
            await db.messages.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": {"linked_communication_id": communication_id, "customer_id": customer_id}}
            )
        except Exception:
            await db.messages.update_one(
                {"_id": message_id},
                {"$set": {"linked_communication_id": communication_id, "customer_id": customer_id}}
            )
        
        return {"success": True, "communication_id": communication_id, "already_linked": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking message to communication: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to link message")

# ==================== SITE ENDPOINTS ====================
@api_router.post("/sites", response_model=Site)
async def create_site(site: SiteCreate):
    site_dict = site.dict()
    site_dict["created_at"] = datetime.utcnow()
    site_dict["active"] = True
    result = await db.sites.insert_one(site_dict)
    site_dict["id"] = str(result.inserted_id)
    return Site(**site_dict)

@api_router.get("/sites", response_model=List[Site])
async def get_sites(customer_id: str = None, active: bool = None):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if active is not None:
        query["active"] = active
    sites = await db.sites.find(query).to_list(1000)
    return [Site(**serialize_doc(site)) for site in sites]

@api_router.get("/sites/{site_id}", response_model=Site)
async def get_site(site_id: str):
    site = await db.sites.find_one({"_id": ObjectId(site_id)})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return Site(**serialize_doc(site))

@api_router.put("/sites/{site_id}", response_model=Site)
async def update_site(site_id: str, site_update: SiteUpdate):
    update_data = {k: v for k, v in site_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.sites.update_one(
        {"_id": ObjectId(site_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")
    
    site = await db.sites.find_one({"_id": ObjectId(site_id)})
    return Site(**serialize_doc(site))

@api_router.delete("/sites/{site_id}")
async def delete_site(site_id: str):
    result = await db.sites.delete_one({"_id": ObjectId(site_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"message": "Site deleted successfully"}


# ==================== SITE MAPS ENDPOINTS ====================
@api_router.post("/site-maps", response_model=SiteMap)
async def create_site_map(site_map: SiteMapCreate):
    """Create a new annotated site map"""
    try:
        # Verify site exists
        site = await db.sites.find_one({"_id": ObjectId(site_map.site_id)})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        # Mark all existing maps for this site as not current
        await db.site_maps.update_many(
            {"site_id": site_map.site_id, "is_current": True},
            {"$set": {"is_current": False}}
        )
        
        # Get current version number
        latest_map = await db.site_maps.find_one(
            {"site_id": site_map.site_id},
            sort=[("version", -1)]
        )
        next_version = (latest_map.get("version", 0) + 1) if latest_map else 1
        
        site_map_dict = site_map.dict()
        site_map_dict["version"] = next_version
        site_map_dict["is_current"] = True
        site_map_dict["created_at"] = datetime.utcnow()
        site_map_dict["updated_at"] = datetime.utcnow()
        
        result = await db.site_maps.insert_one(site_map_dict)
        site_map_dict["id"] = str(result.inserted_id)
        
        return SiteMap(**site_map_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating site map: {str(e)}")

@api_router.get("/site-maps/site/{site_id}", response_model=List[SiteMap])
async def get_site_maps_by_site(site_id: str, current_only: bool = False):
    """Get all site maps for a specific site"""
    try:
        query = {"site_id": site_id}
        if current_only:
            query["is_current"] = True
        
        maps = await db.site_maps.find(query).sort("version", -1).to_list(100)
        return [SiteMap(**serialize_doc(map_doc)) for map_doc in maps]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching site maps: {str(e)}")

@api_router.get("/site-maps/{map_id}", response_model=SiteMap)
async def get_site_map(map_id: str):
    """Get a specific site map by ID"""
    site_map = await db.site_maps.find_one({"_id": ObjectId(map_id)})
    if not site_map:
        raise HTTPException(status_code=404, detail="Site map not found")
    return SiteMap(**serialize_doc(site_map))

@api_router.put("/site-maps/{map_id}", response_model=SiteMap)
async def update_site_map(map_id: str, map_update: SiteMapUpdate):
    """Update an existing site map"""
    try:
        update_data = {k: v for k, v in map_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.site_maps.update_one(
            {"_id": ObjectId(map_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Site map not found")
        
        updated_map = await db.site_maps.find_one({"_id": ObjectId(map_id)})
        return SiteMap(**serialize_doc(updated_map))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating site map: {str(e)}")

@api_router.delete("/site-maps/{map_id}")
async def delete_site_map(map_id: str):
    """Delete a site map"""
    result = await db.site_maps.delete_one({"_id": ObjectId(map_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Site map not found")
    return {"message": "Site map deleted successfully"}

@api_router.post("/site-maps/{map_id}/set-current")
async def set_current_site_map(map_id: str):
    """Set a specific map version as the current one"""
    try:
        # Get the map to find its site_id
        site_map = await db.site_maps.find_one({"_id": ObjectId(map_id)})
        if not site_map:
            raise HTTPException(status_code=404, detail="Site map not found")
        
        # Mark all maps for this site as not current
        await db.site_maps.update_many(
            {"site_id": site_map["site_id"], "is_current": True},
            {"$set": {"is_current": False}}
        )
        
        # Mark this map as current
        await db.site_maps.update_one(
            {"_id": ObjectId(map_id)},
            {"$set": {"is_current": True}}
        )
        
        return {"message": "Site map set as current successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting current map: {str(e)}")


# ==================== EQUIPMENT ENDPOINTS ====================
@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(equipment: EquipmentCreate):
    equipment_dict = equipment.dict()
    equipment_dict["created_at"] = datetime.utcnow()
    equipment_dict["active"] = True
    equipment_dict["status"] = "available"
    result = await db.equipment.insert_one(equipment_dict)
    equipment_dict["id"] = str(result.inserted_id)
    return Equipment(**equipment_dict)

@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(status: str = None):
    query = {}
    if status:
        query["status"] = status
    equipment = await db.equipment.find(query).to_list(1000)
    return [Equipment(**serialize_doc(eq)) for eq in equipment]

# ==================== Equipment Maintenance ====================
@api_router.post("/equipment-maintenance", response_model=EquipmentMaintenance)
async def create_maintenance(maintenance: MaintenanceCreate):
    """Schedule equipment maintenance"""
    try:
        # Get equipment details
        equipment = await db.equipment.find_one({"_id": ObjectId(maintenance.equipment_id)})
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        # Count dispatches for this equipment
        dispatch_count = await db.dispatches.count_documents({
            "equipment_ids": maintenance.equipment_id,
            "status": "completed"
        })
        
        maintenance_dict = {
            "equipment_id": maintenance.equipment_id,
            "equipment_name": equipment.get("name", "Unknown"),
            "maintenance_type": maintenance.maintenance_type,
            "scheduled_date": maintenance.scheduled_date,
            "description": maintenance.description,
            "cost": maintenance.cost,
            "notes": maintenance.notes,
            "dispatches_at_maintenance": dispatch_count,
            "status": "scheduled",
            "created_at": datetime.utcnow()
        }
        
        result = await db.equipment_maintenance.insert_one(maintenance_dict)
        maintenance_dict["_id"] = result.inserted_id
        
        return EquipmentMaintenance(**serialize_doc(maintenance_dict))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating maintenance: {str(e)}")

@api_router.get("/equipment-maintenance")
async def get_maintenance_records(
    equipment_id: Optional[str] = None,
    status: Optional[str] = None,
    maintenance_type: Optional[str] = None
):
    """Get maintenance records with filtering"""
    query = {}
    
    if equipment_id:
        query["equipment_id"] = equipment_id
    if status:
        query["status"] = status
    if maintenance_type:
        query["maintenance_type"] = maintenance_type
    
    records = []
    async for record in db.equipment_maintenance.find(query).sort("scheduled_date", -1):
        records.append(EquipmentMaintenance(**serialize_doc(record)))
    
    return records

@api_router.get("/equipment-maintenance/{maintenance_id}", response_model=EquipmentMaintenance)
async def get_maintenance(maintenance_id: str):
    """Get specific maintenance record"""
    try:
        record = await db.equipment_maintenance.find_one({"_id": ObjectId(maintenance_id)})
        if not record:
            raise HTTPException(status_code=404, detail="Maintenance record not found")
        return EquipmentMaintenance(**serialize_doc(record))
    except Exception:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

@api_router.put("/equipment-maintenance/{maintenance_id}", response_model=EquipmentMaintenance)
async def update_maintenance(maintenance_id: str, maintenance_update: MaintenanceUpdate):
    """Update maintenance record"""
    try:
        update_data = {k: v for k, v in maintenance_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        result = await db.equipment_maintenance.update_one(
            {"_id": ObjectId(maintenance_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Maintenance record not found")
        
        record = await db.equipment_maintenance.find_one({"_id": ObjectId(maintenance_id)})
        return EquipmentMaintenance(**serialize_doc(record))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating maintenance: {str(e)}")

@api_router.get("/equipment-maintenance/alerts/due-soon")
async def get_maintenance_alerts():
    """Get equipment that needs maintenance soon"""
    try:
        # Get all active equipment
        equipment_list = []
        
        async for equipment in db.equipment.find({"active": True}):
            equipment_doc = serialize_doc(equipment)
            equipment_id = equipment_doc["id"]
            
            # Count completed dispatches since last maintenance
            last_maintenance = await db.equipment_maintenance.find_one(
                {
                    "equipment_id": equipment_id,
                    "status": "completed"
                },
                sort=[("completed_date", -1)]
            )
            
            # Count dispatches since last maintenance
            if last_maintenance:
                dispatches_since = await db.dispatches.count_documents({
                    "equipment_ids": equipment_id,
                    "status": "completed",
                    "completed_at": {"$gte": last_maintenance.get("completed_date", datetime.utcnow())}
                })
            else:
                dispatches_since = await db.dispatches.count_documents({
                    "equipment_ids": equipment_id,
                    "status": "completed"
                })
            
            # Check for scheduled maintenance
            upcoming_maintenance = await db.equipment_maintenance.find_one(
                {
                    "equipment_id": equipment_id,
                    "status": "scheduled",
                    "scheduled_date": {"$gte": datetime.utcnow()}
                },
                sort=[("scheduled_date", 1)]
            )
            
            # Alert if:
            # 1. More than 50 dispatches since last maintenance
            # 2. No scheduled maintenance
            alert_level = "ok"
            message = ""
            
            if dispatches_since >= 75:
                alert_level = "critical"
                message = f"{dispatches_since} dispatches since last maintenance - URGENT"
            elif dispatches_since >= 50:
                alert_level = "warning"
                message = f"{dispatches_since} dispatches since last maintenance"
            elif dispatches_since >= 30 and not upcoming_maintenance:
                alert_level = "info"
                message = f"{dispatches_since} dispatches - Consider scheduling maintenance"
            
            if alert_level != "ok":
                equipment_list.append({
                    "equipment_id": equipment_id,
                    "equipment_name": equipment_doc.get("name", "Unknown"),
                    "equipment_type": equipment_doc.get("equipment_type", "unknown"),
                    "dispatches_since_maintenance": dispatches_since,
                    "last_maintenance_date": serialize_doc(last_maintenance).get("completed_date") if last_maintenance else None,
                    "upcoming_maintenance": serialize_doc(upcoming_maintenance) if upcoming_maintenance else None,
                    "alert_level": alert_level,
                    "message": message
                })
        
        # Sort by alert level and dispatches
        priority_order = {"critical": 0, "warning": 1, "info": 2}
        equipment_list.sort(key=lambda x: (priority_order[x["alert_level"]], -x["dispatches_since_maintenance"]))
        
        return {
            "total_alerts": len(equipment_list),
            "critical_count": sum(1 for e in equipment_list if e["alert_level"] == "critical"),
            "warning_count": sum(1 for e in equipment_list if e["alert_level"] == "warning"),
            "alerts": equipment_list
        }
        
    except Exception as e:
        print(f"Error getting maintenance alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting alerts: {str(e)}")

# ==================== Equipment Inspection Reminders ====================
@api_router.get("/equipment/inspection-status")
async def get_equipment_inspection_status():
    """Get inspection status for all equipment with forms"""
    equipment_list = []
    
    # Get all active equipment
    async for equipment in db.equipment.find({"active": True}):
        equipment_doc = serialize_doc(equipment)
        equipment_id = equipment_doc["id"]
        equipment_type = equipment_doc.get("equipment_type", "unknown")
        
        # Get equipment forms for this type
        form_templates = await db.form_templates.find({
            "form_type": "equipment_form",
            "equipment_type": equipment_type,
            "archived": {"$ne": True}
        }).to_list(100)
        
        if not form_templates:
            continue
        
        # Get last inspection for this equipment
        last_response = await db.form_responses.find_one(
            {"equipment_id": equipment_id},
            sort=[("submitted_at", -1)]
        )
        
        last_inspection_date = None
        days_since_inspection = None
        status = "never_inspected"
        
        if last_response:
            last_inspection_date = last_response.get("submitted_at")
            if last_inspection_date:
                if isinstance(last_inspection_date, str):
                    try:
                        last_inspection_date = datetime.fromisoformat(last_inspection_date.replace('Z', '+00:00'))
                    except:
                        last_inspection_date = None
                
                if last_inspection_date:
                    days_since_inspection = (datetime.utcnow() - last_inspection_date).days
                    
                    # Determine status (customize these thresholds as needed)
                    if days_since_inspection <= 7:
                        status = "current"
                    elif days_since_inspection <= 30:
                        status = "due_soon"
                    else:
                        status = "overdue"
        
        equipment_list.append({
            "equipment_id": equipment_id,
            "equipment_name": equipment_doc.get("name", "Unknown"),
            "equipment_type": equipment_type,
            "last_inspection_date": last_inspection_date.isoformat() if last_inspection_date else None,
            "days_since_inspection": days_since_inspection,
            "status": status,
            "available_forms": len(form_templates),
            "form_templates": [
                {
                    "id": str(template["_id"]),
                    "name": template.get("name", "Unknown")
                }
                for template in form_templates
            ]
        })
    
    # Sort by status (overdue first, then due_soon, then never_inspected, then current)
    status_order = {"overdue": 0, "due_soon": 1, "never_inspected": 2, "current": 3}
    equipment_list.sort(key=lambda x: status_order.get(x["status"], 4))
    
    return {
        "equipment": equipment_list,
        "summary": {
            "total_equipment": len(equipment_list),
            "overdue": sum(1 for e in equipment_list if e["status"] == "overdue"),
            "due_soon": sum(1 for e in equipment_list if e["status"] == "due_soon"),
            "current": sum(1 for e in equipment_list if e["status"] == "current"),
            "never_inspected": sum(1 for e in equipment_list if e["status"] == "never_inspected")
        }
    }

@api_router.get("/equipment/{equipment_id}/inspection-history")
async def get_equipment_inspection_history(equipment_id: str):
    """Get inspection history for a specific equipment"""
    # Get equipment details
    try:
        equipment = await db.equipment.find_one({"_id": ObjectId(equipment_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Get all form responses for this equipment
    responses = await db.form_responses.find(
        {"equipment_id": equipment_id}
    ).sort("submitted_at", -1).to_list(100)
    
    inspections = []
    for response in responses:
        response_doc = serialize_doc(response)
        
        # Get template name
        template_id = response_doc.get("template_id") or response_doc.get("form_template_id")
        template_name = response_doc.get("template_name", "Unknown Form")
        
        if not template_name or template_name == "Unknown Form":
            if template_id:
                try:
                    template = await db.form_templates.find_one({"_id": ObjectId(template_id)})
                    template_name = template.get("name", "Unknown Form") if template else "Unknown Form"
                except:
                    pass
        
        inspections.append({
            "response_id": response_doc["id"],
            "template_name": template_name,
            "crew_id": response_doc.get("crew_id"),
            "crew_name": response_doc.get("crew_name"),
            "submitted_at": response_doc.get("submitted_at"),
            "responses": response_doc.get("responses", {})
        })
    
    return {
        "equipment_id": equipment_id,
        "equipment_name": serialize_doc(equipment).get("name", "Unknown"),
        "equipment_type": serialize_doc(equipment).get("equipment_type", "unknown"),
        "total_inspections": len(inspections),
        "inspections": inspections
    }

@api_router.get("/equipment/analytics")
async def get_equipment_analytics(days: int = 30):
    """Get equipment usage and inspection analytics"""
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all active equipment
    equipment_list = []
    async for equipment in db.equipment.find({"active": True}):
        equipment_doc = serialize_doc(equipment)
        equipment_id = equipment_doc["id"]
        
        # Count dispatches this equipment was used in
        dispatch_count = await db.dispatches.count_documents({
            "equipment_ids": equipment_id,
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Count inspections
        inspection_count = await db.form_responses.count_documents({
            "equipment_id": equipment_id,
            "submitted_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Get last inspection
        last_inspection = await db.form_responses.find_one(
            {"equipment_id": equipment_id},
            sort=[("submitted_at", -1)]
        )
        
        last_inspection_date = None
        days_since_inspection = None
        inspection_status = "never_inspected"
        
        if last_inspection:
            last_inspection_date = last_inspection.get("submitted_at")
            if last_inspection_date:
                if isinstance(last_inspection_date, str):
                    try:
                        last_inspection_date = datetime.fromisoformat(last_inspection_date.replace('Z', '+00:00'))
                    except:
                        last_inspection_date = None
                
                if last_inspection_date:
                    days_since_inspection = (datetime.utcnow() - last_inspection_date).days
                    
                    if days_since_inspection <= 7:
                        inspection_status = "current"
                    elif days_since_inspection <= 30:
                        inspection_status = "due_soon"
                    else:
                        inspection_status = "overdue"
        
        equipment_list.append({
            "equipment_id": equipment_id,
            "name": equipment_doc.get("name", "Unknown"),
            "equipment_type": equipment_doc.get("equipment_type", "unknown"),
            "status": equipment_doc.get("status", "available"),
            "dispatch_count": dispatch_count,
            "inspection_count": inspection_count,
            "last_inspection_date": last_inspection_date.isoformat() if last_inspection_date else None,
            "days_since_inspection": days_since_inspection,
            "inspection_status": inspection_status
        })
    
    # Calculate totals
    total_equipment = len(equipment_list)
    total_dispatches = sum(e["dispatch_count"] for e in equipment_list)
    total_inspections = sum(e["inspection_count"] for e in equipment_list)
    
    # Status breakdown
    inspection_status_counts = {
        "current": sum(1 for e in equipment_list if e["inspection_status"] == "current"),
        "due_soon": sum(1 for e in equipment_list if e["inspection_status"] == "due_soon"),
        "overdue": sum(1 for e in equipment_list if e["inspection_status"] == "overdue"),
        "never_inspected": sum(1 for e in equipment_list if e["inspection_status"] == "never_inspected")
    }
    
    # Most used equipment
    most_used = sorted(equipment_list, key=lambda x: x["dispatch_count"], reverse=True)[:5]
    
    # Least inspected equipment
    needs_inspection = [e for e in equipment_list if e["inspection_status"] in ["overdue", "never_inspected"]]
    needs_inspection.sort(key=lambda x: x["days_since_inspection"] if x["days_since_inspection"] is not None else 999999, reverse=True)
    
    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "summary": {
            "total_equipment": total_equipment,
            "total_dispatches": total_dispatches,
            "total_inspections": total_inspections,
            "inspection_status": inspection_status_counts
        },
        "most_used_equipment": most_used[:5],
        "needs_inspection": needs_inspection[:5],
        "all_equipment": equipment_list
    }

@api_router.get("/equipment/{equipment_id}", response_model=Equipment)
async def get_equipment_by_id(equipment_id: str):
    equipment = await db.equipment.find_one({"_id": ObjectId(equipment_id)})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return Equipment(**serialize_doc(equipment))

@api_router.put("/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(equipment_id: str, equipment_update: EquipmentUpdate):
    update_data = {k: v for k, v in equipment_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.equipment.update_one(
        {"_id": ObjectId(equipment_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    equipment = await db.equipment.find_one({"_id": ObjectId(equipment_id)})
    return Equipment(**serialize_doc(equipment))

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str):
    result = await db.equipment.delete_one({"_id": ObjectId(equipment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted successfully"}

# ==================== EQUIPMENT INSPECTION SYSTEM ====================

# Inspection Schedules Endpoints
@api_router.post("/inspection-schedules", response_model=InspectionSchedule)
async def create_inspection_schedule(schedule: InspectionScheduleCreate):
    """Create a new inspection schedule for equipment"""
    try:
        # Get equipment details
        equipment = await db.equipment.find_one({"_id": ObjectId(schedule.equipment_id)})
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        # Get form template details
        form_template = await db.form_templates.find_one({"_id": ObjectId(schedule.form_template_id)})
        if not form_template:
            raise HTTPException(status_code=404, detail="Form template not found")
        
        # Get assigned inspector details if provided
        assigned_inspector_name = None
        if schedule.assigned_inspector_id:
            try:
                inspector = await db.users.find_one({"_id": ObjectId(schedule.assigned_inspector_id)})
                if inspector:
                    assigned_inspector_name = inspector.get("name", "Unknown")
            except:
                pass
        
        schedule_dict = schedule.dict()
        schedule_dict["equipment_name"] = equipment.get("name", "Unknown")
        schedule_dict["form_template_name"] = form_template.get("name", "Unknown")
        schedule_dict["assigned_inspector_name"] = assigned_inspector_name
        schedule_dict["created_at"] = datetime.utcnow()
        
        result = await db.inspection_schedules.insert_one(schedule_dict)
        schedule_dict["id"] = str(result.inserted_id)
        
        # Auto-create first inspection if enabled
        if schedule.auto_create:
            inspection_data = {
                "schedule_id": schedule_dict["id"],
                "equipment_id": schedule.equipment_id,
                "equipment_name": schedule_dict["equipment_name"],
                "form_template_id": schedule.form_template_id,
                "form_template_name": schedule_dict["form_template_name"],
                "assigned_inspector_id": schedule.assigned_inspector_id,
                "assigned_inspector_name": assigned_inspector_name,
                "due_date": schedule.next_due_date,
                "status": InspectionStatus.SCHEDULED,
                "created_at": datetime.utcnow()
            }
            await db.equipment_inspections.insert_one(inspection_data)
        
        return InspectionSchedule(**schedule_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating inspection schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/inspection-schedules", response_model=List[InspectionSchedule])
async def get_inspection_schedules(
    equipment_id: Optional[str] = None,
    active: Optional[bool] = None
):
    """Get all inspection schedules with optional filtering"""
    try:
        query = {}
        if equipment_id:
            query["equipment_id"] = equipment_id
        if active is not None:
            query["active"] = active
        
        schedules = await db.inspection_schedules.find(query).to_list(1000)
        return [InspectionSchedule(**serialize_doc(s)) for s in schedules]
    except Exception as e:
        logger.error(f"Error fetching inspection schedules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/inspection-schedules/{schedule_id}", response_model=InspectionSchedule)
async def get_inspection_schedule(schedule_id: str):
    """Get specific inspection schedule"""
    try:
        schedule = await db.inspection_schedules.find_one({"_id": ObjectId(schedule_id)})
        if not schedule:
            raise HTTPException(status_code=404, detail="Inspection schedule not found")
        return InspectionSchedule(**serialize_doc(schedule))
    except Exception as e:
        raise HTTPException(status_code=404, detail="Inspection schedule not found")

@api_router.put("/inspection-schedules/{schedule_id}", response_model=InspectionSchedule)
async def update_inspection_schedule(schedule_id: str, schedule_update: InspectionScheduleUpdate):
    """Update inspection schedule"""
    try:
        update_data = {k: v for k, v in schedule_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        # Update form template name if form_template_id changed
        if "form_template_id" in update_data:
            form_template = await db.form_templates.find_one({"_id": ObjectId(update_data["form_template_id"])})
            if form_template:
                update_data["form_template_name"] = form_template.get("name", "Unknown")
        
        # Update inspector name if assigned_inspector_id changed
        if "assigned_inspector_id" in update_data:
            try:
                inspector = await db.users.find_one({"_id": ObjectId(update_data["assigned_inspector_id"])})
                if inspector:
                    update_data["assigned_inspector_name"] = inspector.get("name", "Unknown")
            except:
                pass
        
        result = await db.inspection_schedules.update_one(
            {"_id": ObjectId(schedule_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inspection schedule not found")
        
        schedule = await db.inspection_schedules.find_one({"_id": ObjectId(schedule_id)})
        return InspectionSchedule(**serialize_doc(schedule))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating inspection schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/inspection-schedules/{schedule_id}")
async def delete_inspection_schedule(schedule_id: str):
    """Delete inspection schedule"""
    try:
        result = await db.inspection_schedules.delete_one({"_id": ObjectId(schedule_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Inspection schedule not found")
        return {"message": "Inspection schedule deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Inspection schedule not found")

# Equipment Inspections Endpoints
@api_router.post("/equipment-inspections", response_model=EquipmentInspection)
async def create_equipment_inspection(inspection: EquipmentInspectionCreate):
    """Manually create an equipment inspection"""
    try:
        # Get equipment details
        equipment = await db.equipment.find_one({"_id": ObjectId(inspection.equipment_id)})
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        # Get form template details
        form_template = await db.form_templates.find_one({"_id": ObjectId(inspection.form_template_id)})
        if not form_template:
            raise HTTPException(status_code=404, detail="Form template not found")
        
        # Get assigned inspector details if provided
        assigned_inspector_name = None
        if inspection.assigned_inspector_id:
            try:
                inspector = await db.users.find_one({"_id": ObjectId(inspection.assigned_inspector_id)})
                if inspector:
                    assigned_inspector_name = inspector.get("name", "Unknown")
            except:
                pass
        
        inspection_dict = inspection.dict()
        inspection_dict["equipment_name"] = equipment.get("name", "Unknown")
        inspection_dict["form_template_name"] = form_template.get("name", "Unknown")
        inspection_dict["assigned_inspector_name"] = assigned_inspector_name
        inspection_dict["status"] = InspectionStatus.SCHEDULED
        inspection_dict["created_at"] = datetime.utcnow()
        
        result = await db.equipment_inspections.insert_one(inspection_dict)
        inspection_dict["id"] = str(result.inserted_id)
        
        return EquipmentInspection(**inspection_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating equipment inspection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/equipment-inspections", response_model=List[EquipmentInspection])
async def get_equipment_inspections(
    equipment_id: Optional[str] = None,
    status: Optional[InspectionStatus] = None,
    assigned_inspector_id: Optional[str] = None
):
    """Get all equipment inspections with optional filtering"""
    try:
        query = {}
        if equipment_id:
            query["equipment_id"] = equipment_id
        if status:
            query["status"] = status
        if assigned_inspector_id:
            query["assigned_inspector_id"] = assigned_inspector_id
        
        inspections = await db.equipment_inspections.find(query).sort("due_date", 1).to_list(1000)
        return [EquipmentInspection(**serialize_doc(i)) for i in inspections]
    except Exception as e:
        logger.error(f"Error fetching equipment inspections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/equipment-inspections/{inspection_id}", response_model=EquipmentInspection)
async def get_equipment_inspection(inspection_id: str):
    """Get specific equipment inspection"""
    try:
        inspection = await db.equipment_inspections.find_one({"_id": ObjectId(inspection_id)})
        if not inspection:
            raise HTTPException(status_code=404, detail="Equipment inspection not found")
        return EquipmentInspection(**serialize_doc(inspection))
    except Exception as e:
        raise HTTPException(status_code=404, detail="Equipment inspection not found")

@api_router.put("/equipment-inspections/{inspection_id}", response_model=EquipmentInspection)
async def update_equipment_inspection(inspection_id: str, inspection_update: EquipmentInspectionUpdate):
    """Update equipment inspection"""
    try:
        update_data = {k: v for k, v in inspection_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        # Update inspector name if assigned_inspector_id changed
        if "assigned_inspector_id" in update_data:
            try:
                inspector = await db.users.find_one({"_id": ObjectId(update_data["assigned_inspector_id"])})
                if inspector:
                    update_data["assigned_inspector_name"] = inspector.get("name", "Unknown")
            except:
                pass
        
        # If completing inspection, set completed_date
        if update_data.get("status") == InspectionStatus.COMPLETED and "completed_date" not in update_data:
            update_data["completed_date"] = datetime.utcnow()
        
        result = await db.equipment_inspections.update_one(
            {"_id": ObjectId(inspection_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Equipment inspection not found")
        
        inspection = await db.equipment_inspections.find_one({"_id": ObjectId(inspection_id)})
        
        # If inspection completed, update schedule's last_completed_date and create next inspection
        if update_data.get("status") == InspectionStatus.COMPLETED:
            schedule_id = inspection.get("schedule_id")
            if schedule_id:
                await handle_inspection_completion(str(schedule_id), inspection)
        
        return EquipmentInspection(**serialize_doc(inspection))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating equipment inspection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_inspection_completion(schedule_id: str, inspection: dict):
    """Handle inspection completion - update schedule and create next inspection"""
    try:
        # Get schedule
        schedule = await db.inspection_schedules.find_one({"_id": ObjectId(schedule_id)})
        if not schedule:
            return
        
        # Update schedule's last_completed_date
        completed_date = inspection.get("completed_date") or datetime.utcnow()
        
        # Calculate next due date based on frequency
        frequency = schedule.get("frequency")
        if frequency == InspectionFrequency.DAILY:
            next_due = completed_date + timedelta(days=1)
        elif frequency == InspectionFrequency.WEEKLY:
            next_due = completed_date + timedelta(weeks=1)
        elif frequency == InspectionFrequency.MONTHLY:
            next_due = completed_date + timedelta(days=30)
        elif frequency == InspectionFrequency.QUARTERLY:
            next_due = completed_date + timedelta(days=90)
        elif frequency == InspectionFrequency.YEARLY:
            next_due = completed_date + timedelta(days=365)
        elif frequency == InspectionFrequency.CUSTOM:
            days = schedule.get("custom_interval_days", 30)
            next_due = completed_date + timedelta(days=days)
        else:
            next_due = completed_date + timedelta(days=30)
        
        # Update schedule
        await db.inspection_schedules.update_one(
            {"_id": ObjectId(schedule_id)},
            {"$set": {
                "last_completed_date": completed_date,
                "next_due_date": next_due
            }}
        )
        
        # Auto-create next inspection if enabled
        if schedule.get("auto_create"):
            next_inspection = {
                "schedule_id": schedule_id,
                "equipment_id": schedule.get("equipment_id"),
                "equipment_name": schedule.get("equipment_name"),
                "form_template_id": schedule.get("form_template_id"),
                "form_template_name": schedule.get("form_template_name"),
                "assigned_inspector_id": schedule.get("assigned_inspector_id"),
                "assigned_inspector_name": schedule.get("assigned_inspector_name"),
                "due_date": next_due,
                "status": InspectionStatus.SCHEDULED,
                "created_at": datetime.utcnow()
            }
            await db.equipment_inspections.insert_one(next_inspection)
    except Exception as e:
        logger.error(f"Error handling inspection completion: {e}")

@api_router.get("/equipment-inspections/dashboard/overview")
async def get_inspections_dashboard():
    """Get inspection dashboard overview"""
    try:
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_from_now = now + timedelta(days=7)
        
        # Count inspections by status
        total_scheduled = await db.equipment_inspections.count_documents({"status": InspectionStatus.SCHEDULED})
        total_due_today = await db.equipment_inspections.count_documents({
            "status": {"$in": [InspectionStatus.SCHEDULED, InspectionStatus.DUE]},
            "due_date": {"$gte": today, "$lt": today + timedelta(days=1)}
        })
        total_due_this_week = await db.equipment_inspections.count_documents({
            "status": {"$in": [InspectionStatus.SCHEDULED, InspectionStatus.DUE]},
            "due_date": {"$gte": today, "$lte": week_from_now}
        })
        total_overdue = await db.equipment_inspections.count_documents({
            "status": {"$in": [InspectionStatus.SCHEDULED, InspectionStatus.DUE]},
            "due_date": {"$lt": now}
        })
        total_completed_this_month = await db.equipment_inspections.count_documents({
            "status": InspectionStatus.COMPLETED,
            "completed_date": {"$gte": now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)}
        })
        
        # Get upcoming inspections
        upcoming_inspections = await db.equipment_inspections.find({
            "status": {"$in": [InspectionStatus.SCHEDULED, InspectionStatus.DUE]},
            "due_date": {"$gte": now}
        }).sort("due_date", 1).limit(10).to_list(10)
        
        # Get overdue inspections
        overdue_inspections = await db.equipment_inspections.find({
            "status": {"$in": [InspectionStatus.SCHEDULED, InspectionStatus.DUE]},
            "due_date": {"$lt": now}
        }).sort("due_date", 1).to_list(100)
        
        # Check compliance status
        non_compliant_equipment = []
        for insp in overdue_inspections:
            equipment_id = insp.get("equipment_id")
            # Check if equipment has active compliance rules
            schedule_id = insp.get("schedule_id")
            if schedule_id:
                try:
                    schedule = await db.inspection_schedules.find_one({"_id": ObjectId(schedule_id)})
                    if schedule and schedule.get("compliance_rules"):
                        for rule in schedule.get("compliance_rules", []):
                            if rule.get("enabled") and rule.get("action") == ComplianceRuleAction.BLOCK_USAGE:
                                non_compliant_equipment.append({
                                    "equipment_id": equipment_id,
                                    "equipment_name": insp.get("equipment_name"),
                                    "days_overdue": (now - insp.get("due_date")).days,
                                    "rule": rule.get("rule_name")
                                })
                                break
                except:
                    pass
        
        return {
            "summary": {
                "total_scheduled": total_scheduled,
                "due_today": total_due_today,
                "due_this_week": total_due_this_week,
                "overdue": total_overdue,
                "completed_this_month": total_completed_this_month,
                "non_compliant_equipment_count": len(non_compliant_equipment)
            },
            "upcoming_inspections": [EquipmentInspection(**serialize_doc(i)) for i in upcoming_inspections],
            "overdue_inspections": [EquipmentInspection(**serialize_doc(i)) for i in overdue_inspections],
            "non_compliant_equipment": non_compliant_equipment
        }
    except Exception as e:
        logger.error(f"Error fetching inspections dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/equipment-inspections/{inspection_id}/send-reminder")
async def send_inspection_reminder(inspection_id: str):
    """Manually send inspection reminder"""
    try:
        inspection = await db.equipment_inspections.find_one({"_id": ObjectId(inspection_id)})
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection not found")
        
        # Send reminders to inspector, equipment owner, and admin
        # TODO: Implement actual notification sending
        
        # Update reminder sent status
        await db.equipment_inspections.update_one(
            {"_id": ObjectId(inspection_id)},
            {"$set": {
                "reminder_sent": True,
                "last_reminder_sent": datetime.utcnow()
            }}
        )
        
        return {"message": "Reminder sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending inspection reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ROUTE ENDPOINTS ====================
@api_router.post("/routes", response_model=Route)
async def create_route(route: RouteCreate):
    route_dict = route.dict()
    route_dict["created_at"] = datetime.utcnow()
    result = await db.routes.insert_one(route_dict)
    route_dict["id"] = str(result.inserted_id)
    return Route(**route_dict)

@api_router.get("/routes", response_model=List[Route])
async def get_routes(is_template: bool = None):
    query = {}
    if is_template is not None:
        query["is_template"] = is_template
    routes = await db.routes.find(query).to_list(1000)
    return [Route(**serialize_doc(route)) for route in routes]

@api_router.get("/routes/{route_id}", response_model=Route)
async def get_route(route_id: str):
    route = await db.routes.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return Route(**serialize_doc(route))

@api_router.put("/routes/{route_id}", response_model=Route)
async def update_route(route_id: str, route_update: RouteUpdate):
    update_data = {k: v for k, v in route_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.routes.update_one(
        {"_id": ObjectId(route_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    
    route = await db.routes.find_one({"_id": ObjectId(route_id)})
    return Route(**serialize_doc(route))

@api_router.delete("/routes/{route_id}")
async def delete_route(route_id: str):
    result = await db.routes.delete_one({"_id": ObjectId(route_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"message": "Route deleted successfully"}

# ==================== DISPATCH ENDPOINTS ====================
async def send_dispatch_sms(dispatch_id: str, crew_ids: List[str], route_name: str, scheduled_date: str, scheduled_time: str):
    """Background task to send SMS notifications to crew members"""
    try:
        # Fetch crew member phone numbers
        crew_phones = []
        for crew_id in crew_ids:
            crew = await db.users.find_one({"_id": ObjectId(crew_id)})
            if crew and crew.get("phone"):
                crew_phones.append(crew["phone"])
        
        if not crew_phones:
            logger.warning(f"No phone numbers found for crew members in dispatch {dispatch_id}")
            return
        
        # Format message
        message = f"New Dispatch: {route_name}\nDate: {scheduled_date[:10]}\nTime: {scheduled_time}\nDispatch ID: {dispatch_id}\nPlease check the app for full details."
        
        # Send SMS to all crew members
        results = await sms_service.send_bulk_sms(crew_phones, message)
        
        # Update dispatch with SMS sent status
        sms_success = all(r.get("success", False) for r in results)
        await db.dispatches.update_one(
            {"_id": ObjectId(dispatch_id)},
            {"$set": {"sms_sent": sms_success}}
        )
        
        logger.info(f"SMS notifications sent for dispatch {dispatch_id}. Success: {sms_success}")
        
    except Exception as e:
        logger.error(f"Error sending SMS for dispatch {dispatch_id}: {e}")

@api_router.post("/dispatches", response_model=Dispatch)
async def create_dispatch(dispatch: DispatchCreate, background_tasks: BackgroundTasks):
    dispatch_dict = dispatch.dict()
    dispatch_dict["created_at"] = datetime.utcnow()
    dispatch_dict["status"] = "scheduled"
    dispatch_dict["sms_sent"] = False
    result = await db.dispatches.insert_one(dispatch_dict)
    dispatch_dict["id"] = str(result.inserted_id)
    
    # Schedule SMS notification in background
    background_tasks.add_task(
        send_dispatch_sms,
        dispatch_dict["id"],
        dispatch.crew_ids,
        dispatch.route_name,
        dispatch.scheduled_date.isoformat() if hasattr(dispatch.scheduled_date, 'isoformat') else str(dispatch.scheduled_date),
        dispatch.scheduled_time
    )
    
    return Dispatch(**dispatch_dict)

@api_router.get("/dispatches", response_model=List[Dispatch])
async def get_dispatches(status: str = None, crew_id: str = None):
    query = {}
    if status:
        query["status"] = status
    if crew_id:
        query["crew_ids"] = crew_id
    dispatches = await db.dispatches.find(query).sort("scheduled_date", -1).to_list(1000)
    return [Dispatch(**serialize_doc(dispatch)) for dispatch in dispatches]

@api_router.get("/dispatches/{dispatch_id}", response_model=Dispatch)
async def get_dispatch(dispatch_id: str):
    try:
        dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
        if not dispatch:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        return Dispatch(**serialize_doc(dispatch))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dispatch ID format")

@api_router.put("/dispatches/{dispatch_id}", response_model=Dispatch)
async def update_dispatch(dispatch_id: str, dispatch_update: DispatchUpdate):
    try:
        # Get the existing dispatch before update
        existing_dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
        if not existing_dispatch:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        
        old_status = existing_dispatch.get("status")
        
        update_data = {k: v for k, v in dispatch_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        # Update timestamps based on status
        if "status" in update_data:
            new_status = update_data["status"]
            
            if new_status == "in_progress" and "started_at" not in update_data:
                update_data["started_at"] = datetime.utcnow()
            elif new_status == "completed" and "completed_at" not in update_data:
                update_data["completed_at"] = datetime.utcnow()
                
                # Auto-deduct consumables when dispatch is completed
                # Check if this is a new completion (not already completed)
                if old_status != "completed":
                    await auto_deduct_consumables(dispatch_id, existing_dispatch)
                    
                    # Trigger service completion automation workflow
                    try:
                        crew_ids = existing_dispatch.get("crew_ids", [])
                        crew_id = crew_ids[0] if crew_ids else None
                        
                        workflow_context = {
                            'dispatch_id': dispatch_id,
                            'crew_id': crew_id
                        }
                        automation_result = await automation_engine.trigger_workflow('service_completion', workflow_context)
                        logger.info(f"Service completion workflow triggered for dispatch {dispatch_id}: {automation_result}")
                    except Exception as e:
                        logger.error(f"Error triggering service completion workflow: {str(e)}")
                        # Don't fail the dispatch update if automation fails
            
            # Send customer notifications on status change
            if old_status != new_status:
                await notify_customers_dispatch_update(dispatch_id, existing_dispatch, old_status, new_status)
        
        result = await db.dispatches.update_one(
            {"_id": ObjectId(dispatch_id)},
            {"$set": update_data}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating dispatch: {e}")
        raise HTTPException(status_code=400, detail="Invalid dispatch ID format")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    
    dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
    return Dispatch(**serialize_doc(dispatch))

# Helper function to send customer notifications
async def notify_customers_dispatch_update(dispatch_id: str, dispatch: dict, old_status: str, new_status: str):
    """Send notifications to customers when dispatch status changes"""
    try:
        from twilio_service import twilio_service
        from email_service import email_service
        
        # Get all sites for this dispatch
        site_ids = dispatch.get("site_ids", [])
        if not site_ids:
            return
        
        route_name = dispatch.get("route_name", "Snow Removal Service")
        scheduled_date = dispatch.get("scheduled_date", "today")
        
        # For each site, notify the customer
        for site_id in site_ids:
            try:
                # Get site
                site = await db.sites.find_one({"_id": ObjectId(site_id)})
                if not site:
                    continue
                
                # Get customer
                customer = await db.customers.find_one({"_id": ObjectId(site["customer_id"])})
                if not customer:
                    continue
                
                customer_name = customer.get("name", "Customer")
                site_address = site.get("location", {}).get("address", site.get("name", "your property"))
                
                # Generate message based on status change
                message = ""
                subject = ""
                
                if new_status == "scheduled" and old_status != "scheduled":
                    # Service scheduled
                    subject = f"Service Scheduled - {route_name}"
                    message = f"Hello {customer_name}, \n\nYour snow removal service at {site_address} has been scheduled for {scheduled_date}. Our crew will arrive as scheduled. \n\nCAF Property Services"
                
                elif new_status == "in_progress" and old_status != "in_progress":
                    # Crew en route / started
                    subject = f"Crew En Route - {route_name}"
                    message = f"Hello {customer_name}, \n\nOur crew is on the way to {site_address} for snow removal service. We'll complete the work shortly. \n\nCAF Property Services"
                
                elif new_status == "completed" and old_status != "completed":
                    # Service completed
                    subject = f"Service Completed - {route_name}"
                    
                    # Get photos for this site/dispatch
                    photos = await db.photos.find({
                        "dispatch_id": dispatch_id,
                        "site_id": site_id
                    }).to_list(10)
                    
                    photo_text = ""
                    if photos and len(photos) > 0:
                        photo_text = f"\n\nView service photos: {len(photos)} photo(s) available in your portal."
                    
                    message = f"Hello {customer_name}, \n\nSnow removal service at {site_address} has been completed successfully.{photo_text} \n\nThank you for choosing CAF Property Services!"
                
                # Send SMS if customer has phone
                if message and customer.get("phone"):
                    try:
                        await twilio_service.send_sms(customer["phone"], message)
                        print(f"✅ SMS sent to {customer['phone']} for dispatch {dispatch_id} status: {new_status}")
                    except Exception as sms_error:
                        print(f"❌ Error sending SMS: {sms_error}")
                
                # Send Email if customer has email
                if message and customer.get("email"):
                    try:
                        await email_service.send_email(
                            to_email=customer["email"],
                            subject=subject,
                            body=message
                        )
                        print(f"✅ Email sent to {customer['email']} for dispatch {dispatch_id} status: {new_status}")
                    except Exception as email_error:
                        print(f"❌ Error sending email: {email_error}")
                
            except Exception as site_error:
                print(f"Error notifying customer for site {site_id}: {site_error}")
                continue
        
    except Exception as e:
        print(f"Error in notify_customers_dispatch_update: {e}")
        # Don't raise exception - we don't want to block dispatch update

# Helper function to auto-deduct consumables
async def auto_deduct_consumables(dispatch_id: str, dispatch: dict):
    """Automatically deduct consumables when a dispatch is completed"""
    try:
        # Get all services for this dispatch
        services_list = dispatch.get("services", [])
        site_ids = dispatch.get("site_ids", [])
        
        if not services_list or not site_ids:
            return
        
        # For each service, check if it has an associated consumable
        for service_type in services_list:
            # Find services of this type that have consumable_id
            services = await db.services.find({
                "service_type": service_type, 
                "active": True,
                "consumable_id": {"$exists": True, "$ne": None}
            }).to_list(100)
            
            # Use the first service with a consumable_id
            for service in services:
                consumable_id = service.get("consumable_id")
                if consumable_id:
                    # Get the consumable
                    consumable = await db.consumables.find_one({"_id": ObjectId(consumable_id)})
                    if not consumable or not consumable.get("active"):
                        continue
                    
                    # Calculate quantity to deduct (default: per occurrence = 1 unit per site)
                    # For more complex scenarios, you could look at site area, service pricing, etc.
                    quantity_per_site = consumable.get("per_yard", 1.0)  # Default to 1 unit if not specified
                    total_quantity = quantity_per_site * len(site_ids)
                    
                    # Create usage record for each site
                    for site_id in site_ids:
                        # Calculate cost
                        cost = None
                        if consumable.get("cost_per_unit"):
                            cost = consumable["cost_per_unit"] * quantity_per_site
                        
                        usage_dict = {
                            "consumable_id": consumable_id,
                            "consumable_name": consumable["name"],
                            "dispatch_id": dispatch_id,
                            "site_id": site_id,
                            "service_type": service_type,
                            "quantity_used": quantity_per_site,
                            "unit": consumable["unit"],
                            "cost": cost,
                            "crew_ids": dispatch.get("crew_ids", []),
                            "notes": f"Auto-deducted for dispatch completion",
                            "created_at": datetime.utcnow()
                        }
                        
                        await db.consumable_usage.insert_one(usage_dict)
                    
                    # Deduct from inventory
                    new_quantity = consumable["quantity_available"] - total_quantity
                    await db.consumables.update_one(
                        {"_id": ObjectId(consumable_id)},
                        {"$set": {"quantity_available": max(0, new_quantity)}}
                    )
                    
                    print(f"Auto-deducted {total_quantity} {consumable['unit']} of {consumable['name']} for dispatch {dispatch_id}")
                    break  # Only use the first service with consumable_id for this service type
    
    except Exception as e:
        print(f"Error auto-deducting consumables: {e}")
        # Don't raise exception - we don't want to block dispatch completion

@api_router.delete("/dispatches/{dispatch_id}")
async def delete_dispatch(dispatch_id: str):
    try:
        result = await db.dispatches.delete_one({"_id": ObjectId(dispatch_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        return {"message": "Dispatch deleted successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dispatch ID format")

# ==================== PHOTO ENDPOINTS ====================
@api_router.post("/photos", response_model=Photo)
async def create_photo(photo: PhotoCreate):
    photo_dict = photo.dict()
    photo_dict["timestamp"] = datetime.utcnow()
    
    # Validate dispatch exists
    if photo.dispatch_id:
        dispatch = await db.dispatches.find_one({"_id": ObjectId(photo.dispatch_id)})
        if not dispatch:
            raise HTTPException(status_code=404, detail="Dispatch not found")
    
    # Validate site exists  
    if photo.site_id:
        site = await db.sites.find_one({"_id": ObjectId(photo.site_id)})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
    
    result = await db.photos.insert_one(photo_dict)
    photo_dict["id"] = str(result.inserted_id)
    
    # Create notification for before/after photos
    if photo.photo_type in ["before", "after"]:
        await db.messages.insert_one({
            "type": "photo_upload",
            "title": f"{photo.photo_type.title()} Photo Uploaded",
            "content": f"{photo.photo_type.title()} photo uploaded for {photo.category} work",
            "status": "pending",
            "priority": "normal",
            "source_type": "photo_upload",
            "source_id": str(result.inserted_id),
            "from_user_id": photo.crew_id,
            "from_user_name": photo.crew_name,
            "dispatch_id": photo.dispatch_id,
            "site_id": photo.site_id,
            "created_at": datetime.utcnow()
        })
    
    return Photo(**photo_dict)

@api_router.get("/photos", response_model=List[Photo])
async def get_photos(
    dispatch_id: str = None, 
    site_id: str = None, 
    crew_id: str = None,
    photo_type: str = None,
    category: str = None,
    is_verified: bool = None,
    limit: int = 100
):
    query = {}
    if dispatch_id:
        query["dispatch_id"] = dispatch_id
    if site_id:
        query["site_id"] = site_id
    if crew_id:
        query["crew_id"] = crew_id
    if photo_type:
        query["photo_type"] = photo_type
    if category:
        query["category"] = category
    if is_verified is not None:
        query["is_verified"] = is_verified
    
    photos = await db.photos.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    return [Photo(**serialize_doc(photo)) for photo in photos]

@api_router.get("/photos/{photo_id}", response_model=Photo)
async def get_photo(photo_id: str):
    photo = await db.photos.find_one({"_id": ObjectId(photo_id)})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return Photo(**serialize_doc(photo))

@api_router.put("/photos/{photo_id}", response_model=Photo)
async def update_photo(photo_id: str, photo_update: PhotoUpdate):
    update_dict = {k: v for k, v in photo_update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.photos.update_one(
        {"_id": ObjectId(photo_id)},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    updated_photo = await db.photos.find_one({"_id": ObjectId(photo_id)})
    return Photo(**serialize_doc(updated_photo))

@api_router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str):
    result = await db.photos.delete_one({"_id": ObjectId(photo_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"message": "Photo deleted successfully"}

@api_router.post("/photos/upload")
async def upload_gallery_photos(
    photos: List[UploadFile] = File(...),
    category: str = Form(default="gallery"),
    notes: Optional[str] = Form(default=None),
    tags: Optional[str] = Form(default=None),
    uploaded_by: str = Form(default="Admin"),
    site_id: Optional[str] = Form(default=None),
    project_id: Optional[str] = Form(default=None),
    customer_id: Optional[str] = Form(default=None)
):
    """Upload photos to the gallery with multipart/form-data"""
    uploaded_photos = []
    
    for photo_file in photos:
        try:
            # Read file content
            contents = await photo_file.read()
            
            # Convert to base64
            base64_image = base64.b64encode(contents).decode('utf-8')
            
            # Parse tags if provided
            tag_list = []
            if tags:
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            
            # Create photo document
            photo_dict = {
                "dispatch_id": "gallery",  # Use 'gallery' as placeholder for non-dispatch photos
                "site_id": site_id or "gallery",
                "crew_id": "admin",
                "crew_name": uploaded_by,
                "photo_type": "gallery",
                "category": category,
                "image_data": base64_image,
                "filename": photo_file.filename,
                "content_type": photo_file.content_type,
                "file_size": len(contents),
                "notes": notes,
                "tags": tag_list,
                "project_id": project_id,
                "customer_id": customer_id,
                "timestamp": datetime.utcnow(),
                "is_verified": True,  # Gallery uploads are pre-verified
            }
            
            # Insert into database
            result = await db.photos.insert_one(photo_dict)
            photo_dict["id"] = str(result.inserted_id)
            
            uploaded_photos.append({
                "id": str(result.inserted_id),
                "filename": photo_file.filename,
                "size": len(contents)
            })
            
        except Exception as e:
            logger.error(f"Error uploading photo {photo_file.filename}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error uploading {photo_file.filename}: {str(e)}")
    
    return {
        "message": f"Successfully uploaded {len(uploaded_photos)} photo(s)",
        "photos": uploaded_photos
    }

@api_router.get("/photos/dispatch/{dispatch_id}/summary")
async def get_dispatch_photo_summary(dispatch_id: str):
    """Get photo summary for a dispatch - counts by type and category"""
    try:
        pipeline = [
            {"$match": {"dispatch_id": dispatch_id}},
            {"$group": {
                "_id": {
                    "photo_type": "$photo_type",
                    "category": "$category"
                },
                "count": {"$sum": 1},
                "verified_count": {"$sum": {"$cond": ["$is_verified", 1, 0]}},
                "latest_photo": {"$max": "$timestamp"}
            }},
            {"$sort": {"latest_photo": -1}}
        ]
        
        results = await db.photos.aggregate(pipeline).to_list(100)
        
        summary = {
            "total_photos": 0,
            "verified_photos": 0,
            "by_type": {},
            "by_category": {},
            "completion_status": {}
        }
        
        for result in results:
            photo_type = result["_id"]["photo_type"]
            category = result["_id"]["category"]
            count = result["count"]
            verified = result["verified_count"]
            
            summary["total_photos"] += count
            summary["verified_photos"] += verified
            
            if photo_type not in summary["by_type"]:
                summary["by_type"][photo_type] = 0
            summary["by_type"][photo_type] += count
            
            if category not in summary["by_category"]:
                summary["by_category"][category] = 0
            summary["by_category"][category] += count
        
        # Check completion status
        has_before = "before" in summary["by_type"]
        has_after = "after" in summary["by_type"]
        
        summary["completion_status"] = {
            "has_before_photos": has_before,
            "has_after_photos": has_after,
            "is_complete": has_before and has_after,
            "missing_photos": []
        }
        
        if not has_before:
            summary["completion_status"]["missing_photos"].append("before")
        if not has_after:
            summary["completion_status"]["missing_photos"].append("after")
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting photo summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get photo summary")

# ==================== REPORTS ENDPOINTS ====================
@api_router.post("/reports/generate")
async def generate_report(request: dict = Body(...)):
    """Generate various types of reports"""
    try:
        report_type = request.get("report_type")
        start_date = request.get("start_date")
        end_date = request.get("end_date")
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date) if start_date else datetime.now() - timedelta(days=30)
        end_dt = datetime.fromisoformat(end_date) if end_date else datetime.now()
        
        report_data = {
            "report_type": report_type,
            "generated_at": datetime.utcnow().isoformat(),
            "date_range": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat()
            },
            "data": {}
        }
        
        # Generate report based on type
        if report_type == "daily_operations":
            # Get dispatches, services, crew performance
            dispatches = await db.dispatches.find({
                "scheduled_date": {
                    "$gte": start_dt.isoformat(),
                    "$lte": end_dt.isoformat()
                }
            }).to_list(1000)
            
            report_data["data"] = {
                "total_dispatches": len(dispatches),
                "completed": len([d for d in dispatches if d.get("status") == "completed"]),
                "in_progress": len([d for d in dispatches if d.get("status") == "in_progress"]),
                "scheduled": len([d for d in dispatches if d.get("status") == "scheduled"]),
                "dispatches": dispatches[:50]  # Limit to 50 for JSON size
            }
            
        elif report_type == "weekly_financial":
            # Get invoices and payments
            invoices = await db.invoices.find({
                "issue_date": {
                    "$gte": start_dt.isoformat(),
                    "$lte": end_dt.isoformat()
                }
            }).to_list(1000)
            
            total_revenue = sum(inv.get("total_amount", 0) for inv in invoices)
            total_paid = sum(inv.get("amount_paid", 0) for inv in invoices)
            total_outstanding = sum(inv.get("amount_due", 0) for inv in invoices)
            
            report_data["data"] = {
                "total_invoices": len(invoices),
                "total_revenue": total_revenue,
                "total_paid": total_paid,
                "total_outstanding": total_outstanding,
                "paid_invoices": len([i for i in invoices if i.get("status") == "paid"]),
                "unpaid_invoices": len([i for i in invoices if i.get("status") == "unpaid"]),
                "overdue_invoices": len([i for i in invoices if i.get("status") == "overdue"]),
            }
            
        elif report_type == "monthly_customer":
            # Get customer analytics
            customers = await db.customers.find({}).to_list(1000)
            new_customers = await db.customers.find({
                "created_at": {
                    "$gte": start_dt.isoformat(),
                    "$lte": end_dt.isoformat()
                }
            }).to_list(1000)
            
            report_data["data"] = {
                "total_customers": len(customers),
                "new_customers": len(new_customers),
                "active_customers": len([c for c in customers if c.get("active", True)]),
                "customer_types": {
                    "individual": len([c for c in customers if c.get("customer_type") == "individual"]),
                    "company": len([c for c in customers if c.get("customer_type") == "company"])
                }
            }
            
        elif report_type == "project_performance":
            # Get project metrics
            projects = await db.projects.find({
                "created_at": {
                    "$gte": start_dt.isoformat(),
                    "$lte": end_dt.isoformat()
                }
            }).to_list(1000)
            
            report_data["data"] = {
                "total_projects": len(projects),
                "completed": len([p for p in projects if p.get("status") == "completed"]),
                "active": len([p for p in projects if p.get("status") == "active"]),
                "on_hold": len([p for p in projects if p.get("status") == "on_hold"]),
                "average_completion": sum(p.get("completion_percentage", 0) for p in projects) / len(projects) if projects else 0
            }
            
        elif report_type == "service_analytics":
            # Get service breakdown
            dispatches = await db.dispatches.find({
                "scheduled_date": {
                    "$gte": start_dt.isoformat(),
                    "$lte": end_dt.isoformat()
                }
            }).to_list(1000)
            
            services_count = {}
            for dispatch in dispatches:
                for service in dispatch.get("services", []):
                    services_count[service] = services_count.get(service, 0) + 1
            
            report_data["data"] = {
                "total_services": len(dispatches),
                "services_breakdown": services_count
            }
            
        elif report_type == "crew_productivity":
            # Get crew performance
            shifts = await db.shifts.find({
                "date": {
                    "$gte": start_dt.isoformat(),
                    "$lte": end_dt.isoformat()
                }
            }).to_list(1000)
            
            total_hours = sum(s.get("hours_worked", 0) for s in shifts)
            
            report_data["data"] = {
                "total_shifts": len(shifts),
                "total_hours": total_hours,
                "average_hours_per_shift": total_hours / len(shifts) if shifts else 0
            }
        
        return report_data
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@api_router.post("/reports/schedule")
async def schedule_report(request: dict = Body(...)):
    """Schedule automated report delivery"""
    try:
        report_schedule = {
            "report_type": request.get("report_type"),
            "frequency": request.get("frequency"),
            "email": request.get("email"),
            "active": request.get("active", True),
            "created_at": datetime.utcnow(),
            "last_sent": None,
            "next_send": None
        }
        
        # Calculate next send time based on frequency
        now = datetime.utcnow()
        if request.get("frequency") == "daily":
            report_schedule["next_send"] = now + timedelta(days=1)
        elif request.get("frequency") == "weekly":
            report_schedule["next_send"] = now + timedelta(weeks=1)
        elif request.get("frequency") == "monthly":
            report_schedule["next_send"] = now + timedelta(days=30)
        
        result = await db.report_schedules.insert_one(report_schedule)
        report_schedule["id"] = str(result.inserted_id)
        
        return {
            "message": "Report scheduled successfully",
            "schedule_id": str(result.inserted_id),
            "next_send": report_schedule["next_send"].isoformat() if report_schedule["next_send"] else None
        }
        
    except Exception as e:
        logger.error(f"Error scheduling report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule report: {str(e)}")

@api_router.get("/reports/schedules")
async def get_report_schedules():
    """Get all scheduled reports"""
    try:
        schedules = await db.report_schedules.find({"active": True}).to_list(1000)
        return [serialize_doc(schedule) for schedule in schedules]
    except Exception as e:
        logger.error(f"Error getting report schedules: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get report schedules")

@api_router.delete("/reports/schedules/{schedule_id}")
async def delete_report_schedule(schedule_id: str):
    """Delete a scheduled report"""
    try:
        result = await db.report_schedules.delete_one({"_id": ObjectId(schedule_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return {"message": "Report schedule deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report schedule: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete report schedule")

# ==================== INVENTORY ENDPOINTS ====================

@api_router.get("/inventory")
async def get_inventory(
    category: Optional[str] = None,
    status: Optional[str] = None,
    low_stock_only: bool = False
):
    """Get all inventory items with optional filtering"""
    try:
        query = {}
        
        if category:
            query["category"] = category
        
        if status:
            query["status"] = status
        
        if low_stock_only:
            query["status"] = {"$in": ["low_stock", "out_of_stock"]}
        
        inventory_items = await db.inventory.find(query).to_list(1000)
        
        # Calculate status based on quantity vs min_quantity
        for item in inventory_items:
            if item["quantity"] <= 0:
                item["status"] = "out_of_stock"
            elif item["quantity"] <= item["min_quantity"]:
                item["status"] = "low_stock"
            else:
                item["status"] = "in_stock"
            
            # Update status in database
            await db.inventory.update_one(
                {"_id": item["_id"]},
                {"$set": {"status": item["status"]}}
            )
        
        return [serialize_doc(item) for item in inventory_items]
        
    except Exception as e:
        logger.error(f"Error fetching inventory: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch inventory")

@api_router.post("/inventory")
async def create_inventory_item(item: InventoryItemCreate):
    """Create a new inventory item"""
    try:
        # Calculate initial status
        if item.quantity <= 0:
            status = InventoryStatus.OUT_OF_STOCK
        elif item.quantity <= item.min_quantity:
            status = InventoryStatus.LOW_STOCK
        else:
            status = InventoryStatus.IN_STOCK
        
        item_dict = item.dict()
        item_dict["status"] = status.value
        item_dict["created_at"] = datetime.utcnow()
        item_dict["updated_at"] = datetime.utcnow()
        
        result = await db.inventory.insert_one(item_dict)
        item_dict["id"] = str(result.inserted_id)
        
        return InventoryItem(**item_dict)
        
    except Exception as e:
        logger.error(f"Error creating inventory item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create inventory item")

@api_router.get("/inventory/{item_id}")
async def get_inventory_item(item_id: str):
    """Get a specific inventory item"""
    try:
        item = await db.inventory.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        return serialize_doc(item)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching inventory item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch inventory item")

@api_router.put("/inventory/{item_id}")
async def update_inventory_item(item_id: str, item_update: InventoryItemUpdate):
    """Update an inventory item"""
    try:
        update_data = {k: v for k, v in item_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Get current item to recalculate status
        current_item = await db.inventory.find_one({"_id": ObjectId(item_id)})
        if not current_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        # Update quantity and min_quantity if provided
        quantity = update_data.get("quantity", current_item.get("quantity"))
        min_quantity = update_data.get("min_quantity", current_item.get("min_quantity"))
        
        # Recalculate status
        if quantity <= 0:
            update_data["status"] = "out_of_stock"
        elif quantity <= min_quantity:
            update_data["status"] = "low_stock"
        else:
            update_data["status"] = "in_stock"
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.inventory.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        updated_item = await db.inventory.find_one({"_id": ObjectId(item_id)})
        return serialize_doc(updated_item)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating inventory item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update inventory item")

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str):
    """Delete an inventory item"""
    try:
        result = await db.inventory.delete_one({"_id": ObjectId(item_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        return {"message": "Inventory item deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting inventory item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete inventory item")

# ==================== ACCESS CONTROL ENDPOINTS ====================

# Permission definitions for each access group
INTERNAL_PERMISSIONS = [
    "view_all_customers", "manage_customers", "view_all_projects", "manage_projects",
    "view_all_invoices", "manage_invoices", "view_reports", "manage_users",
    "manage_settings", "view_analytics", "manage_estimates", "manage_dispatch"
]

SUBCONTRACTOR_PERMISSIONS = [
    "view_assigned_projects", "update_project_status", "upload_photos",
    "view_assigned_tasks", "update_task_status", "view_assigned_dispatch", "submit_timesheets"
]

@api_router.patch("/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: str):
    """Toggle user active/inactive status"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_status = not user.get("active", True)
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"active": new_status}}
        )
        
        return {
            "message": f"User {'activated' if new_status else 'deactivated'} successfully",
            "active": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling user status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle user status")

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

# ==================== AUTOMATION ANALYTICS ENDPOINTS ====================

@api_router.get("/automation/analytics/metrics")
async def get_automation_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    workflow_id: Optional[str] = None
):
    """Get workflow execution metrics and statistics"""
    try:
        # Build query
        query = {}
        
        if start_date:
            query["started_at"] = {"$gte": datetime.fromisoformat(start_date)}
        if end_date:
            if "started_at" in query:
                query["started_at"]["$lte"] = datetime.fromisoformat(end_date)
            else:
                query["started_at"] = {"$lte": datetime.fromisoformat(end_date)}
        if workflow_id:
            query["workflow_id"] = workflow_id
        
        # Get all executions
        executions = await db.workflow_executions.find(query).to_list(10000)
        
        # Calculate metrics per workflow
        workflow_metrics = {}
        for execution in executions:
            wf_id = execution["workflow_id"]
            if wf_id not in workflow_metrics:
                workflow_metrics[wf_id] = {
                    "workflow_id": wf_id,
                    "workflow_name": execution["workflow_name"],
                    "total_executions": 0,
                    "successful_executions": 0,
                    "failed_executions": 0,
                    "total_duration": 0,
                    "last_execution": None
                }
            
            workflow_metrics[wf_id]["total_executions"] += 1
            
            if execution["status"] == "success":
                workflow_metrics[wf_id]["successful_executions"] += 1
            elif execution["status"] == "failed":
                workflow_metrics[wf_id]["failed_executions"] += 1
            
            if execution.get("duration"):
                workflow_metrics[wf_id]["total_duration"] += execution["duration"]
            
            if not workflow_metrics[wf_id]["last_execution"] or execution["started_at"] > workflow_metrics[wf_id]["last_execution"]:
                workflow_metrics[wf_id]["last_execution"] = execution["started_at"]
        
        # Calculate average duration and success rate
        result = []
        for wf_id, metrics in workflow_metrics.items():
            total = metrics["total_executions"]
            result.append({
                "workflow_id": wf_id,
                "workflow_name": metrics["workflow_name"],
                "total_executions": total,
                "successful_executions": metrics["successful_executions"],
                "failed_executions": metrics["failed_executions"],
                "average_duration": metrics["total_duration"] / total if total > 0 else 0,
                "last_execution": metrics["last_execution"].isoformat() if metrics["last_execution"] else None,
                "success_rate": (metrics["successful_executions"] / total * 100) if total > 0 else 0
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting automation metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get automation metrics")

@api_router.get("/automation/analytics/executions")
async def get_automation_executions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    workflow_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """Get recent workflow executions"""
    try:
        # Build query
        query = {}
        
        if start_date:
            query["started_at"] = {"$gte": datetime.fromisoformat(start_date)}
        if end_date:
            if "started_at" in query:
                query["started_at"]["$lte"] = datetime.fromisoformat(end_date)
            else:
                query["started_at"] = {"$lte": datetime.fromisoformat(end_date)}
        if workflow_id:
            query["workflow_id"] = workflow_id
        if status:
            query["status"] = status
        
        # Get executions sorted by most recent
        executions = await db.workflow_executions.find(query)\
            .sort("started_at", -1)\
            .limit(limit)\
            .to_list(limit)
        
        return [serialize_doc(exec) for exec in executions]
        
    except Exception as e:
        logger.error(f"Error getting automation executions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get automation executions")

@api_router.get("/automation/workflows/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
):
    """Get execution history for a specific workflow"""
    try:
        query = {"workflow_id": workflow_id}
        
        if start_date:
            query["started_at"] = {"$gte": datetime.fromisoformat(start_date)}
        if end_date:
            if "started_at" in query:
                query["started_at"]["$lte"] = datetime.fromisoformat(end_date)
            else:
                query["started_at"] = {"$lte": datetime.fromisoformat(end_date)}
        
        # Get executions
        executions = await db.workflow_executions.find(query)\
            .sort("started_at", -1)\
            .limit(limit)\
            .to_list(limit)
        
        # Get workflow name from first execution or use workflow_id
        workflow_name = executions[0]["workflow_name"] if executions else workflow_id.replace('_', ' ').title()
        
        return {
            "workflow_name": workflow_name,
            "executions": [serialize_doc(exec) for exec in executions]
        }
        
    except Exception as e:
        logger.error(f"Error getting workflow executions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get workflow executions")

# ==================== FORM TEMPLATE ENDPOINTS ====================
@api_router.post("/form-templates", response_model=FormTemplate)
async def create_form_template(template: FormTemplateCreate):
    template_dict = template.dict()
    template_dict["created_at"] = datetime.utcnow()
    template_dict["active"] = True
    result = await db.form_templates.insert_one(template_dict)
    template_dict["id"] = str(result.inserted_id)
    return FormTemplate(**template_dict)

@api_router.get("/form-templates", response_model=List[FormTemplate])
async def get_form_templates(form_type: str = None):
    query = {"active": True, "archived": {"$ne": True}}  # Exclude archived forms
    if form_type:
        query["form_type"] = form_type
    templates = await db.form_templates.find(query).to_list(1000)
    return [FormTemplate(**serialize_doc(template)) for template in templates]

@api_router.get("/form-templates/{template_id}", response_model=FormTemplate)
async def get_form_template(template_id: str):
    template = await db.form_templates.find_one({"_id": ObjectId(template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    return FormTemplate(**serialize_doc(template))

@api_router.delete("/form-templates/{template_id}")
async def archive_form_template(template_id: str):
    """Archive a form template (soft delete) - will be permanently deleted after 14 days"""
    try:
        result = await db.form_templates.update_one(
            {"_id": ObjectId(template_id)},
            {
                "$set": {
                    "archived": True,
                    "archived_at": datetime.now(),
                    "active": False
                }
            }
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Form template not found")
        return {"message": "Form template archived successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/form-templates/{template_id}/restore")
async def restore_form_template(template_id: str):
    """Restore an archived form template"""
    try:
        result = await db.form_templates.update_one(
            {"_id": ObjectId(template_id), "archived": True},
            {
                "$set": {
                    "archived": False,
                    "archived_at": None,
                    "active": True
                }
            }
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Archived form template not found")
        return {"message": "Form template restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/form-templates-archived")
async def get_archived_form_templates():
    """Get all archived form templates"""
    templates = []
    async for template in db.form_templates.find({"archived": True}):
        templates.append(FormTemplate(**serialize_doc(template)))
    return templates

@api_router.delete("/form-templates/{template_id}/permanent")
async def permanently_delete_form_template(template_id: str):
    """Permanently delete a form template (admin only)"""
    try:
        result = await db.form_templates.delete_one({"_id": ObjectId(template_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Form template not found")
        return {"message": "Form template permanently deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== FORM RESPONSE ENDPOINTS ====================
@api_router.post("/form-responses", response_model=FormResponse)
async def create_form_response(response: FormResponseCreate):
    # Store the form response
    response_doc = response.dict()
    response_doc["submitted_at"] = datetime.now().isoformat()
    
    result = await db.form_responses.insert_one(response_doc)
    created_response = await db.form_responses.find_one({"_id": result.inserted_id})
    form_response = FormResponse(**serialize_doc(created_response))
    
    # Get form template to determine type and create appropriate notification
    form_template = await db.form_templates.find_one({"_id": ObjectId(response.template_id)})
    if form_template:
        # Determine priority based on form type and content
        priority = "normal"
        if form_template.get("form_type") == "customer":
            priority = "high"  # Customer forms get higher priority
        
        # Create message for admin notification
        message_doc = {
            "type": "customer_feedback",
            "status": "pending",
            "priority": priority,
            "source_id": str(result.inserted_id),
            "source_type": "form_response",
            "from_user_id": response.crew_id,
            "from_user_name": response.crew_name or "Unknown User",
            "title": f"New Form Submission: {form_template.get('name', 'Form')}",
            "content": f"A new form has been submitted by {response.crew_name or 'a user'}. Please review and provide feedback if needed.",
            "created_at": datetime.now(),
            "requires_follow_up": False,
        }
        
        await db.messages.insert_one(message_doc)
    
    return form_response

@api_router.get("/form-responses", response_model=List[FormResponse])
async def get_form_responses(dispatch_id: str = None, crew_id: str = None):
    query = {}
    if dispatch_id:
        query["dispatch_id"] = dispatch_id
    if crew_id:
        query["crew_id"] = crew_id
    
    responses = await db.form_responses.find(query).sort("submitted_at", -1).to_list(1000)
    
    # Transform old format to new format for compatibility
    transformed_responses = []
    for response in responses:
        response_doc = serialize_doc(response)
        
        # Handle old field names for compatibility
        if "form_template_id" in response_doc and "template_id" not in response_doc:
            response_doc["template_id"] = response_doc["form_template_id"]
        
        if "template_name" not in response_doc:
            # Try to get template name from template_id
            template_id = response_doc.get("template_id") or response_doc.get("form_template_id")
            if template_id:
                try:
                    template = await db.form_templates.find_one({"_id": ObjectId(template_id)})
                    response_doc["template_name"] = template.get("name", "Unknown Form") if template else "Unknown Form"
                except Exception:
                    response_doc["template_name"] = "Unknown Form"
            else:
                response_doc["template_name"] = "Unknown Form"
                
        # Ensure required fields have defaults
        if "crew_name" not in response_doc:
            response_doc["crew_name"] = None
        if "photos" not in response_doc:
            response_doc["photos"] = []
            
        transformed_responses.append(FormResponse(**response_doc))
    
    return transformed_responses

@api_router.get("/form-responses/{response_id}/pdf")
async def download_form_response_pdf(response_id: str):
    """Generate and download PDF for a form response"""
    try:
        # Get form response
        form_response = await db.form_responses.find_one({"_id": ObjectId(response_id)})
        if not form_response:
            raise HTTPException(status_code=404, detail="Form response not found")
        
        # Get form template (handle both old and new field names)
        template_id = form_response.get("template_id") or form_response.get("form_template_id")
        if not template_id:
            raise HTTPException(status_code=400, detail="Form response has no template_id")
        
        # Get form template (include archived templates for PDF generation)
        form_template = await db.form_templates.find_one({"_id": ObjectId(template_id)})
        if not form_template:
            raise HTTPException(status_code=404, detail="Form template not found")
        
        # Generate PDF
        pdf_bytes = pdf_service.generate_form_response_pdf(form_response, form_template)
        
        # Create filename
        form_name = form_template.get('name', 'Form Response').replace(' ', '_')
        submitted_at = form_response.get('submitted_at', datetime.now())
        if isinstance(submitted_at, str):
            try:
                submitted_at = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
            except:
                submitted_at = datetime.now()
        
        date_str = submitted_at.strftime('%Y%m%d_%H%M%S')
        filename = f"{form_name}_{date_str}.pdf"
        
        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes))
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (404, 400, etc.)
        raise
    except Exception as e:
        if "invalid ObjectId" in str(e).lower() or "not a valid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid response ID format")
        else:
            logger.error(f"Error generating PDF: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate PDF")

# ==================== GPS TRACKING ENDPOINTS ====================
@api_router.post("/gps-location", response_model=GPSLocation)
async def create_gps_location(location: GPSLocationCreate):
    location_dict = location.dict()
    location_dict["timestamp"] = datetime.utcnow()
    
    # Enhanced location data
    location_dict["speed"] = location_dict.get("speed", 0)
    location_dict["accuracy"] = location_dict.get("accuracy", 0)
    location_dict["bearing"] = location_dict.get("bearing", 0)
    
    # Check if crew is within site geofence (basic proximity check)
    if location_dict.get("crew_id") and location_dict.get("dispatch_id"):
        await _check_geofence_alerts(location_dict)
    
    result = await db.gps_locations.insert_one(location_dict)
    location_dict["id"] = str(result.inserted_id)
    return GPSLocation(**location_dict)

@api_router.get("/gps-location", response_model=List[GPSLocation])
async def get_gps_locations(crew_id: str = None, dispatch_id: str = None, limit: int = 100):
    query = {}
    if crew_id:
        query["crew_id"] = crew_id
    if dispatch_id:
        query["dispatch_id"] = dispatch_id
    locations = await db.gps_locations.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    # Filter out invalid locations that don't have required fields
    valid_locations = []
    for location in locations:
        try:
            if 'latitude' in location and 'longitude' in location:
                valid_locations.append(GPSLocation(**serialize_doc(location)))
        except Exception as e:
            print(f"Skipping invalid GPS location: {e}")
            continue
    return valid_locations

@api_router.get("/gps-location/live/{crew_id}")
async def get_live_crew_location(crew_id: str):
    """Get the most recent location for a crew member"""
    location = await db.gps_locations.find_one(
        {"crew_id": crew_id},
        sort=[("timestamp", -1)]
    )
    if not location:
        raise HTTPException(status_code=404, detail="No location data found for crew")
    return GPSLocation(**serialize_doc(location))

@api_router.get("/gps-location/route/{dispatch_id}")
async def get_dispatch_route(dispatch_id: str):
    """Get complete route tracking for a dispatch"""
    locations = await db.gps_locations.find(
        {"dispatch_id": dispatch_id}
    ).sort("timestamp", 1).to_list(1000)
    
    if not locations:
        return {"route": [], "total_distance": 0, "duration": 0}
    
    # Calculate route statistics
    total_distance = 0
    duration = 0
    
    if len(locations) > 1:
        start_time = locations[0]["timestamp"]
        end_time = locations[-1]["timestamp"]
        duration = (end_time - start_time).total_seconds() / 3600  # hours
        
        # Basic distance calculation (simplified)
        for i in range(1, len(locations)):
            prev_loc = locations[i-1]
            curr_loc = locations[i]
            distance = _calculate_distance(
                prev_loc["latitude"], prev_loc["longitude"],
                curr_loc["latitude"], curr_loc["longitude"]
            )
            total_distance += distance
    
    return {
        "route": [GPSLocation(**serialize_doc(loc)) for loc in locations],
        "total_distance": round(total_distance, 2),  # km
        "duration": round(duration, 2),  # hours
        "start_time": locations[0]["timestamp"] if locations else None,
        "end_time": locations[-1]["timestamp"] if locations else None
    }

async def _check_geofence_alerts(location_data):
    """Check if crew location triggers any geofence alerts and log entry/exit events"""
    try:
        dispatch_id = location_data.get("dispatch_id")
        crew_id = location_data.get("crew_id")
        
        if not dispatch_id or not crew_id:
            return
            
        # Get dispatch and associated site
        dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
        if not dispatch or not dispatch.get("site_ids"):
            return
            
        # Get the first site from the dispatch (for simplicity)
        site_id = dispatch["site_ids"][0] if dispatch["site_ids"] else None
        if not site_id:
            return
            
        site = await db.sites.find_one({"_id": ObjectId(site_id)})
        if not site:
            return
            
        # Get geofence configuration for site (or use default 100m)
        geofence = await db.site_geofences.find_one({"site_id": site_id})
        radius_km = (geofence.get("radius_meters", 100.0) / 1000.0) if geofence else 0.1  # Convert to km
        
        # Check proximity
        site_location = site.get("location", {})
        site_lat = site_location.get("latitude", 0)
        site_lon = site_location.get("longitude", 0)
        crew_lat = location_data.get("latitude", 0)
        crew_lon = location_data.get("longitude", 0)
        
        if site_lat and site_lon and crew_lat and crew_lon:
            distance = _calculate_distance(site_lat, site_lon, crew_lat, crew_lon)
            
            # Check if crew is within geofence
            is_inside_geofence = distance <= radius_km
            
            # Get the last geofence log for this crew and site
            last_log = await db.geofence_logs.find_one(
                {"crew_id": crew_id, "site_id": site_id, "dispatch_id": dispatch_id},
                sort=[("timestamp", -1)]
            )
            
            # Get crew info
            crew = await db.users.find_one({"_id": ObjectId(crew_id)})
            crew_name = crew.get("name") if crew else "Unknown Crew"
            
            # Determine if we need to log an event
            if is_inside_geofence:
                # Crew is inside geofence
                if not last_log or last_log.get("event_type") == "exit":
                    # This is an entry event (either first time or after exit)
                    await db.geofence_logs.insert_one({
                        "crew_id": crew_id,
                        "crew_name": crew_name,
                        "site_id": site_id,
                        "site_name": site.get("name", "Unknown Site"),
                        "dispatch_id": dispatch_id,
                        "event_type": "entry",
                        "latitude": crew_lat,
                        "longitude": crew_lon,
                        "timestamp": datetime.utcnow(),
                        "manual_click": False,
                        "notes": f"Auto-detected entry within {radius_km*1000}m radius"
                    })
                    
                    # Update dispatch status if crew just arrived
                    current_status = dispatch.get("status", "")
                    if current_status == "scheduled":
                        await db.dispatches.update_one(
                            {"_id": ObjectId(dispatch_id)},
                            {"$set": {
                                "status": "in_progress",
                                "started_at": datetime.utcnow(),
                                "arrived_at": datetime.utcnow()
                            }}
                        )
                    
                    # Create arrival message
                    await db.messages.insert_one({
                        "type": "system_alert",
                        "title": "Crew Entered Site Geofence",
                        "content": f"{crew_name} entered geofence at {site.get('name', 'the site')}",
                        "status": "pending",
                        "priority": "normal",
                        "from_user_id": crew_id,
                        "from_user_name": "Geofence System",
                        "source_type": "gps_geofence",
                        "dispatch_id": dispatch_id,
                        "site_id": str(site["_id"]),
                        "created_at": datetime.utcnow()
                    })
            else:
                # Crew is outside geofence
                if last_log and last_log.get("event_type") == "entry":
                    # This is an exit event (was inside, now outside)
                    await db.geofence_logs.insert_one({
                        "crew_id": crew_id,
                        "crew_name": crew_name,
                        "site_id": site_id,
                        "site_name": site.get("name", "Unknown Site"),
                        "dispatch_id": dispatch_id,
                        "event_type": "exit",
                        "latitude": crew_lat,
                        "longitude": crew_lon,
                        "timestamp": datetime.utcnow(),
                        "manual_click": False,
                        "notes": f"Auto-detected exit from {radius_km*1000}m radius"
                    })
                    
                    # Create exit message
                    await db.messages.insert_one({
                        "type": "system_alert",
                        "title": "Crew Exited Site Geofence",
                        "content": f"{crew_name} exited geofence at {site.get('name', 'the site')}",
                        "status": "pending",
                        "priority": "normal",
                        "from_user_id": crew_id,
                        "from_user_name": "Geofence System",
                        "source_type": "gps_geofence",
                        "dispatch_id": dispatch_id,
                        "site_id": str(site["_id"]),
                        "created_at": datetime.utcnow()
                    })
    except Exception as e:
        logger.warning(f"Geofence check failed: {str(e)}")

def _calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km using Haversine formula"""
    import math
    
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    return c * r

@api_router.get("/gps-location/latest/{crew_id}", response_model=GPSLocation)
async def get_latest_gps_location(crew_id: str):
    location = await db.gps_locations.find_one(
        {"crew_id": crew_id},
        sort=[("timestamp", -1)]
    )
    if not location:
        raise HTTPException(status_code=404, detail="No GPS location found for this crew")
    return GPSLocation(**serialize_doc(location))

# Enhanced GPS endpoints for MapLibre
@api_router.get("/gps-location/map/all-active")
async def get_all_active_locations():
    """Get latest location for all active crews for map display"""
    try:
        # Get all active users (crew members)
        active_users = await db.users.find({
            "role": {"$in": ["crew", "admin"]},
            "active": True
        }).to_list(1000)
        
        locations = []
        for user in active_users:
            user_id = str(user.get("_id"))
            
            # Get latest location for this user
            latest_location = await db.gps_locations.find_one(
                {"crew_id": user_id},
                sort=[("timestamp", -1)]
            )
            
            if latest_location:
                # Check if location is recent (within last 30 minutes)
                now = datetime.utcnow()
                location_time = latest_location.get("timestamp")
                
                if location_time and (now - location_time).total_seconds() < 1800:  # 30 minutes
                    # Get active dispatch if any
                    active_dispatch = await db.dispatches.find_one({
                        "crew_ids": user_id,
                        "status": {"$in": ["scheduled", "in_progress"]}
                    })
                    
                    locations.append({
                        "crew_id": user_id,
                        "crew_name": user.get("name", "Unknown"),
                        "latitude": latest_location.get("latitude"),
                        "longitude": latest_location.get("longitude"),
                        "speed": latest_location.get("speed", 0),
                        "bearing": latest_location.get("bearing", 0),
                        "accuracy": latest_location.get("accuracy", 0),
                        "timestamp": latest_location.get("timestamp"),
                        "dispatch_id": str(active_dispatch.get("_id")) if active_dispatch else None,
                        "status": user.get("status", "offline"),
                        "avatar": user.get("avatar")
                    })
        
        return {
            "locations": locations,
            "total_count": len(locations),
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error getting active locations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gps-location/map/equipment")
async def get_equipment_locations():
    """Get locations of equipment (via assigned crew)"""
    try:
        equipment_locations = []
        
        # Get all active dispatches
        active_dispatches = await db.dispatches.find({
            "status": {"$in": ["scheduled", "in_progress"]}
        }).to_list(1000)
        
        for dispatch in active_dispatches:
            equipment_ids = dispatch.get("equipment_ids", [])
            crew_ids = dispatch.get("crew_ids", [])
            
            if equipment_ids and crew_ids:
                # Get crew location
                crew_id = crew_ids[0] if crew_ids else None
                if crew_id:
                    latest_location = await db.gps_locations.find_one(
                        {"crew_id": crew_id},
                        sort=[("timestamp", -1)]
                    )
                    
                    if latest_location:
                        # Get equipment details
                        for eq_id in equipment_ids:
                            try:
                                equipment = await db.equipment.find_one({"_id": ObjectId(eq_id)})
                                if equipment:
                                    equipment_locations.append({
                                        "equipment_id": str(equipment.get("_id")),
                                        "equipment_name": equipment.get("name"),
                                        "equipment_type": equipment.get("equipment_type"),
                                        "latitude": latest_location.get("latitude"),
                                        "longitude": latest_location.get("longitude"),
                                        "timestamp": latest_location.get("timestamp"),
                                        "dispatch_id": str(dispatch.get("_id")),
                                        "crew_id": crew_id
                                    })
                            except:
                                continue
        
        return {
            "equipment": equipment_locations,
            "total_count": len(equipment_locations),
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error getting equipment locations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gps-location/map/sites")
async def get_sites_for_map():
    """Get all sites with their coordinates for map display"""
    try:
        sites = await db.sites.find({"active": True}).to_list(1000)
        
        site_markers = []
        for site in sites:
            location = site.get("location", {})
            if location.get("latitude") and location.get("longitude"):
                # Check if site has active dispatch
                active_dispatch = await db.dispatches.find_one({
                    "site_ids": str(site.get("_id")),
                    "status": {"$in": ["scheduled", "in_progress"]}
                })
                
                site_markers.append({
                    "site_id": str(site.get("_id")),
                    "name": site.get("name"),
                    "latitude": location.get("latitude"),
                    "longitude": location.get("longitude"),
                    "address": location.get("address"),
                    "site_type": site.get("site_type"),
                    "has_active_dispatch": active_dispatch is not None,
                    "customer_id": site.get("customer_id")
                })
        
        return {
            "sites": site_markers,
            "total_count": len(site_markers),
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error getting sites for map: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gps-location/map/route/{route_id}")
async def get_route_visualization(route_id: str):
    """Get route template with site coordinates for map visualization"""
    try:
        route = await db.routes.find_one({"_id": ObjectId(route_id)})
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        stops = route.get("stops", [])
        route_points = []
        
        for stop in sorted(stops, key=lambda x: x.get("sequence_order", 0)):
            site_id = stop.get("site_id")
            if site_id:
                try:
                    site = await db.sites.find_one({"_id": ObjectId(site_id)})
                    if site:
                        location = site.get("location", {})
                        if location.get("latitude") and location.get("longitude"):
                            route_points.append({
                                "site_id": str(site.get("_id")),
                                "site_name": site.get("name"),
                                "latitude": location.get("latitude"),
                                "longitude": location.get("longitude"),
                                "sequence_order": stop.get("sequence_order"),
                                "estimated_duration": stop.get("estimated_duration", 30)
                            })
                except:
                    continue
        
        return {
            "route_id": str(route.get("_id")),
            "route_name": route.get("name"),
            "route_points": route_points,
            "total_stops": len(route_points),
            "is_template": route.get("is_template", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting route visualization: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GEOFENCE MANAGEMENT ENDPOINTS ====================

@api_router.post("/geofence-logs", response_model=GeofenceLog)
async def create_geofence_log(log_data: GeofenceLogCreate):
    """Create a geofence entry/exit log"""
    try:
        # Get site info
        site = await db.sites.find_one({"_id": ObjectId(log_data.site_id)})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        # Get crew info
        crew = await db.users.find_one({"_id": ObjectId(log_data.crew_id)})
        crew_name = crew.get("name") if crew else "Unknown Crew"
        
        log_dict = {
            "crew_id": log_data.crew_id,
            "crew_name": crew_name,
            "site_id": log_data.site_id,
            "site_name": site.get("name", "Unknown Site"),
            "dispatch_id": log_data.dispatch_id,
            "event_type": log_data.event_type,
            "latitude": log_data.latitude,
            "longitude": log_data.longitude,
            "timestamp": datetime.utcnow(),
            "manual_click": log_data.manual_click,
            "notes": log_data.notes
        }
        
        result = await db.geofence_logs.insert_one(log_dict)
        log_dict["id"] = str(result.inserted_id)
        
        # Create a notification for the admin
        if log_data.event_type == GeofenceEventType.ENTRY:
            message = f"{crew_name} entered geofence at {site.get('name')}"
        else:
            message = f"{crew_name} exited geofence at {site.get('name')}"
        
        await db.messages.insert_one({
            "type": "system_alert",
            "title": "Geofence Alert",
            "content": message,
            "status": "pending",
            "priority": "normal",
            "from_user_id": log_data.crew_id,
            "from_user_name": crew_name,
            "source_type": "geofence_system",
            "dispatch_id": log_data.dispatch_id,
            "site_id": log_data.site_id,
            "created_at": datetime.utcnow()
        })
        
        # Trigger automation workflows based on geofence event
        try:
            if log_data.event_type == GeofenceEventType.ENTRY and log_data.dispatch_id:
                # Crew arrived at site - send customer notification
                dispatch = await db.dispatches.find_one({"_id": ObjectId(log_data.dispatch_id)})
                if dispatch and dispatch.get("customer_id"):
                    automation_context = {
                        'trigger_type': 'crew_enroute',
                        'dispatch_id': log_data.dispatch_id,
                        'customer_id': dispatch.get("customer_id"),
                        'eta_minutes': 0  # Already arrived
                    }
                    automation_result = await automation_engine.trigger_workflow('customer_communication', automation_context)
                    logger.info(f"Geofence arrival automation triggered: {automation_result}")
        except Exception as e:
            logger.error(f"Error triggering geofence automation: {str(e)}")
            # Don't fail the geofence log if automation fails
        
        return GeofenceLog(**log_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating geofence log: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/geofence-logs")
async def get_geofence_logs(
    crew_id: Optional[str] = None,
    site_id: Optional[str] = None,
    dispatch_id: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 100
):
    """Get geofence logs with optional filters"""
    try:
        query = {}
        if crew_id:
            query["crew_id"] = crew_id
        if site_id:
            query["site_id"] = site_id
        if dispatch_id:
            query["dispatch_id"] = dispatch_id
        if event_type:
            query["event_type"] = event_type
        
        logs = []
        async for log in db.geofence_logs.find(query).sort("timestamp", -1).limit(limit):
            logs.append(GeofenceLog(**serialize_doc(log)))
        
        return {"logs": logs, "total": len(logs)}
    except Exception as e:
        logger.error(f"Error getting geofence logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/geofence-logs/site/{site_id}/history")
async def get_site_geofence_history(site_id: str, days: int = 7):
    """Get geofence history for a specific site"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        logs = []
        async for log in db.geofence_logs.find({
            "site_id": site_id,
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1):
            logs.append(serialize_doc(log))
        
        # Group by crew for summary
        crew_summary = {}
        for log in logs:
            crew_id = log.get("crew_id")
            if crew_id not in crew_summary:
                crew_summary[crew_id] = {
                    "crew_id": crew_id,
                    "crew_name": log.get("crew_name"),
                    "entries": 0,
                    "exits": 0,
                    "last_event": None
                }
            
            if log.get("event_type") == "entry":
                crew_summary[crew_id]["entries"] += 1
            else:
                crew_summary[crew_id]["exits"] += 1
            
            if not crew_summary[crew_id]["last_event"] or log.get("timestamp") > crew_summary[crew_id]["last_event"]:
                crew_summary[crew_id]["last_event"] = log.get("timestamp")
        
        return {
            "logs": logs,
            "crew_summary": list(crew_summary.values()),
            "total_events": len(logs)
        }
    except Exception as e:
        logger.error(f"Error getting site geofence history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/site-geofences", response_model=SiteGeofence)
async def create_site_geofence(geofence_data: SiteGeofenceCreate):
    """Create or update geofence configuration for a site"""
    try:
        # Get site info
        site = await db.sites.find_one({"_id": ObjectId(geofence_data.site_id)})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        location = site.get("location", {})
        if not location.get("latitude") or not location.get("longitude"):
            raise HTTPException(status_code=400, detail="Site must have GPS coordinates")
        
        # Check if geofence already exists for this site
        existing = await db.site_geofences.find_one({"site_id": geofence_data.site_id})
        
        if existing:
            # Update existing
            await db.site_geofences.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "radius_meters": geofence_data.radius_meters,
                    "updated_at": datetime.utcnow()
                }}
            )
            updated = await db.site_geofences.find_one({"_id": existing["_id"]})
            return SiteGeofence(**serialize_doc(updated))
        else:
            # Create new
            geofence_dict = {
                "site_id": geofence_data.site_id,
                "site_name": site.get("name", "Unknown Site"),
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
                "radius_meters": geofence_data.radius_meters,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            result = await db.site_geofences.insert_one(geofence_dict)
            geofence_dict["id"] = str(result.inserted_id)
            return SiteGeofence(**geofence_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating site geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/site-geofences")
async def get_site_geofences(is_active: Optional[bool] = None):
    """Get all site geofences"""
    try:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        geofences = []
        async for geofence in db.site_geofences.find(query):
            geofences.append(SiteGeofence(**serialize_doc(geofence)))
        
        return {"geofences": geofences, "total": len(geofences)}
    except Exception as e:
        logger.error(f"Error getting site geofences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/site-geofences/{site_id}")
async def get_site_geofence(site_id: str):
    """Get geofence configuration for a specific site"""
    try:
        geofence = await db.site_geofences.find_one({"site_id": site_id})
        if not geofence:
            # Return default geofence if none exists
            site = await db.sites.find_one({"_id": ObjectId(site_id)})
            if not site:
                raise HTTPException(status_code=404, detail="Site not found")
            
            location = site.get("location", {})
            return {
                "site_id": site_id,
                "site_name": site.get("name"),
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
                "radius_meters": 100.0,  # Default radius
                "is_active": True,
                "exists": False
            }
        
        return SiteGeofence(**serialize_doc(geofence))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting site geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/site-geofences/{site_id}")
async def update_site_geofence(site_id: str, geofence_update: SiteGeofenceUpdate):
    """Update geofence configuration for a site"""
    try:
        geofence = await db.site_geofences.find_one({"site_id": site_id})
        if not geofence:
            raise HTTPException(status_code=404, detail="Geofence not found for this site")
        
        update_data = {k: v for k, v in geofence_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.site_geofences.update_one(
            {"site_id": site_id},
            {"$set": update_data}
        )
        
        updated = await db.site_geofences.find_one({"site_id": site_id})
        return SiteGeofence(**serialize_doc(updated))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating site geofence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Services Endpoints ====================
@api_router.get("/services")
async def get_services():
    services = []
    async for service in db.services.find({"active": True}):
        services.append(ServiceModel(**serialize_doc(service)))
    return services

@api_router.post("/services", response_model=ServiceModel)
async def create_service(service: ServiceModelCreate):
    service_dict = service.dict()
    service_dict["active"] = True
    service_dict["created_at"] = datetime.utcnow()
    result = await db.services.insert_one(service_dict)
    service_dict["_id"] = result.inserted_id
    return ServiceModel(**serialize_doc(service_dict))

@api_router.get("/services/{service_id}", response_model=ServiceModel)
async def get_service(service_id: str):
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return ServiceModel(**serialize_doc(service))

@api_router.put("/services/{service_id}", response_model=ServiceModel)
async def update_service(service_id: str, service_update: ServiceModelUpdate):
    update_data = {k: v for k, v in service_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    return ServiceModel(**serialize_doc(service))

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    result = await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

@api_router.get("/equipment-types")
async def get_equipment_types():
    """Get list of all equipment types for pricing configuration"""
    from models import EquipmentType
    return [
        {"value": eq_type.value, "label": eq_type.value.replace('_', ' ').title()}
        for eq_type in EquipmentType
    ]

# ==================== EMAIL ENDPOINTS ====================
@api_router.post("/email/test")
async def send_test_email(recipient_email: str = "test@example.com"):
    """Send a test email to verify email configuration"""
    try:
        success = email_service.send_test_email(recipient_email)
        if success:
            return {"message": f"Test email sent successfully to {recipient_email}", "success": True}
        else:
            return {"message": "Failed to send test email. Check email configuration.", "success": False}
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@api_router.get("/email/status")
async def get_email_status():
    """Get email service configuration status"""
    return {
        "enabled": email_service.enabled,
        "smtp_server": email_service.smtp_server,
        "smtp_port": email_service.smtp_port,
        "sender_email": email_service.sender_email,
        "password_configured": bool(email_service.sender_password),
        "configuration_status": "configured" if email_service.enabled else "not_configured"
    }

@api_router.post("/email/dispatch-notification")
async def send_dispatch_email(
    dispatch_id: str,
    crew_email: str,
    crew_name: str
):
    """Send dispatch notification email to crew member"""
    try:
        # Get dispatch details
        dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
        if not dispatch:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        
        dispatch_details = {
            "route_name": dispatch.get("route_name"),
            "scheduled_date": dispatch.get("scheduled_date"),
            "scheduled_time": dispatch.get("scheduled_time"),
            "services": dispatch.get("services", []),
            "status": dispatch.get("status")
        }
        
        success = email_service.send_dispatch_notification(dispatch_details, crew_email, crew_name)
        
        if success:
            return {"message": f"Dispatch notification sent to {crew_email}", "success": True}
        else:
            return {"message": "Failed to send dispatch notification", "success": False}
    except Exception as e:
        logger.error(f"Error sending dispatch notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@api_router.post("/email/completion-notification")
async def send_completion_email(
    customer_email: str,
    customer_name: str,
    dispatch_id: str
):
    """Send service completion notification to customer"""
    try:
        # Get dispatch details
        dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
        if not dispatch:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        
        service_details = {
            "route_name": dispatch.get("route_name"),
            "services": dispatch.get("services", []),
            "crew_name": "CAF Property Services Team"  # Could be enhanced to get actual crew name
        }
        
        success = email_service.send_completion_notification(customer_email, customer_name, service_details)
        
        if success:
            return {"message": f"Completion notification sent to {customer_email}", "success": True}
        else:
            return {"message": "Failed to send completion notification", "success": False}
    except Exception as e:
        logger.error(f"Error sending completion notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@api_router.post("/email/onboarding")
async def send_onboarding_email(
    email: str,
    name: str,
    username: str,
    password: str,
    role: str
):
    """Send onboarding email to new team member"""
    try:
        success = email_service.send_onboarding_email(email, name, username, password, role)
        
        if success:
            return {"message": f"Onboarding email sent successfully to {email}", "success": True}
        else:
            return {"message": "Failed to send onboarding email", "success": False}
    except Exception as e:
        logger.error(f"Error sending onboarding email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send onboarding email: {str(e)}")

# ==================== SMS ENDPOINTS ====================
@api_router.get("/sms/status")
async def get_sms_status():
    """Get Twilio SMS service status"""
    return {
        "enabled": sms_service.enabled,
        "sender_phone": sms_service.phone_number,
        "account_sid_configured": bool(sms_service.account_sid),
        "auth_token_configured": bool(sms_service.auth_token),
        "configuration_status": "configured" if sms_service.enabled else "not_configured"
    }

@api_router.post("/sms/test")
async def send_test_sms(phone_number: str, message: str = "Test SMS from CAF Property Services"):
    """Send a test SMS via Twilio"""
    try:
        result = await sms_service.send_sms(phone_number, message)
        
        if result["success"]:
            return {"message": f"Test SMS sent successfully to {phone_number}", "success": True, "result": result}
        else:
            return {"message": f"Failed to send SMS: {result.get('error', 'Unknown error')}", "success": False, "result": result}
    except Exception as e:
        logger.error(f"Error sending test SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send test SMS: {str(e)}")

@api_router.post("/sms/dispatch")
async def send_dispatch_sms(
    crew_phone: str,
    dispatch_id: str
):
    """Send dispatch notification SMS to crew member"""
    try:
        # Handle test dispatch ID (for testing without real dispatch)
        if dispatch_id == "test-dispatch-id":
            result = await sms_service.send_dispatch_notification(
                crew_phone, 
                "Test Site", 
                "ASAP"
            )
            
            if result["success"]:
                return {"message": f"Dispatch SMS sent successfully to {crew_phone}", "success": True, "result": result}
            else:
                return {"message": f"Failed to send dispatch SMS: {result.get('error', 'Unknown error')}", "success": False, "result": result}
        
        # Get dispatch details for real dispatch
        dispatch = await db.dispatches.find_one({"_id": ObjectId(dispatch_id)})
        if not dispatch:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        
        site_name = dispatch.get("route_name", "Unknown Site")
        scheduled_time = dispatch.get("scheduled_time", "TBD")
        
        result = await sms_service.send_dispatch_notification(crew_phone, site_name, scheduled_time)
        
        if result["success"]:
            return {"message": f"Dispatch SMS sent successfully to {crew_phone}", "success": True, "result": result}
        else:
            return {"message": f"Failed to send dispatch SMS: {result.get('error', 'Unknown error')}", "success": False, "result": result}
    except Exception as e:
        logger.error(f"Error sending dispatch SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send dispatch SMS: {str(e)}")

@api_router.post("/sms/arrival")
async def send_arrival_sms(
    customer_phone: str,
    crew_name: str,
    site_name: str
):
    """Send arrival notification SMS to customer"""
    try:
        result = await sms_service.send_arrival_sms(customer_phone, crew_name, site_name)
        
        if result["success"]:
            return {"message": f"Arrival SMS sent successfully to {customer_phone}", "success": True, "result": result}
        else:
            return {"message": f"Failed to send arrival SMS: {result.get('error', 'Unknown error')}", "success": False, "result": result}
    except Exception as e:
        logger.error(f"Error sending arrival SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send arrival SMS: {str(e)}")

@api_router.post("/sms/completion")
async def send_completion_sms(
    customer_phone: str,
    crew_name: str,
    site_name: str
):
    """Send service completion SMS to customer"""
    try:
        result = await sms_service.send_completion_sms(customer_phone, crew_name, site_name)
        
        if result["success"]:
            return {"message": f"Completion SMS sent successfully to {customer_phone}", "success": True, "result": result}
        else:
            return {"message": f"Failed to send completion SMS: {result.get('error', 'Unknown error')}", "success": False, "result": result}
    except Exception as e:
        logger.error(f"Error sending completion SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send completion SMS: {str(e)}")

@api_router.post("/sms/weather-alert")
async def send_weather_alert_sms(
    phone_numbers: List[str],
    weather_info: str
):
    """Send weather alert SMS to multiple crew members"""
    try:
        results = await sms_service.send_weather_alert_sms(phone_numbers, weather_info)
        
        successful = [r for r in results if r["success"]]
        failed = [r for r in results if not r["success"]]
        
        return {
            "message": f"Weather alert sent to {len(successful)}/{len(phone_numbers)} recipients",
            "success": len(failed) == 0,
            "results": results,
            "summary": {
                "total": len(phone_numbers),
                "successful": len(successful),
                "failed": len(failed)
            }
        }
    except Exception as e:
        logger.error(f"Error sending weather alert SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send weather alert SMS: {str(e)}")

@api_router.post("/sms/emergency")
async def send_emergency_sms(
    phone_numbers: List[str],
    emergency_message: str
):
    """Send emergency notification SMS to crew and supervisors"""
    try:
        results = await sms_service.send_emergency_sms(phone_numbers, emergency_message)
        
        successful = [r for r in results if r["success"]]
        failed = [r for r in results if not r["success"]]
        
        return {
            "message": f"Emergency SMS sent to {len(successful)}/{len(phone_numbers)} recipients",
            "success": len(failed) == 0,
            "results": results,
            "summary": {
                "total": len(phone_numbers),
                "successful": len(successful),
                "failed": len(failed)
            }
        }
    except Exception as e:
        logger.error(f"Error sending emergency SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send emergency SMS: {str(e)}")

# ==================== Consumables Endpoints ====================
@api_router.get("/consumables")
async def get_consumables():
    consumables = []
    async for consumable in db.consumables.find({"active": True}):
        consumables.append(Consumable(**serialize_doc(consumable)))
    return consumables

@api_router.post("/consumables", response_model=Consumable)
async def create_consumable(consumable: ConsumableCreate):
    consumable_dict = consumable.dict()
    consumable_dict["active"] = True
    consumable_dict["created_at"] = datetime.utcnow()
    result = await db.consumables.insert_one(consumable_dict)
    consumable_dict["_id"] = result.inserted_id
    return Consumable(**serialize_doc(consumable_dict))

@api_router.get("/consumables/{consumable_id}", response_model=Consumable)
async def get_consumable(consumable_id: str):
    consumable = await db.consumables.find_one({"_id": ObjectId(consumable_id)})
    if not consumable:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return Consumable(**serialize_doc(consumable))

@api_router.put("/consumables/{consumable_id}", response_model=Consumable)
async def update_consumable(consumable_id: str, consumable_update: ConsumableUpdate):
    update_data = {k: v for k, v in consumable_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.consumables.update_one(
        {"_id": ObjectId(consumable_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Consumable not found")
    
    consumable = await db.consumables.find_one({"_id": ObjectId(consumable_id)})
    return Consumable(**serialize_doc(consumable))

@api_router.delete("/consumables/{consumable_id}")
async def delete_consumable(consumable_id: str):
    result = await db.consumables.update_one(
        {"_id": ObjectId(consumable_id)},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return {"message": "Consumable deleted successfully"}

# ==================== Consumable Usage Tracking Endpoints ====================
@api_router.post("/consumable-usage", response_model=ConsumableUsage)
async def create_consumable_usage(usage: ConsumableUsageCreate):
    # Get consumable details
    consumable = await db.consumables.find_one({"_id": ObjectId(usage.consumable_id)})
    if not consumable:
        raise HTTPException(status_code=404, detail="Consumable not found")
    
    # Get dispatch details
    dispatch = await db.dispatches.find_one({"_id": ObjectId(usage.dispatch_id)})
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    
    # Calculate cost
    cost = None
    if consumable.get("cost_per_unit"):
        cost = consumable["cost_per_unit"] * usage.quantity_used
    
    # Create usage record
    usage_dict = {
        "consumable_id": usage.consumable_id,
        "consumable_name": consumable["name"],
        "dispatch_id": usage.dispatch_id,
        "site_id": usage.site_id,
        "service_type": usage.service_type,
        "quantity_used": usage.quantity_used,
        "unit": consumable["unit"],
        "cost": cost,
        "crew_ids": dispatch.get("crew_ids", []),
        "notes": usage.notes,
        "created_at": datetime.utcnow()
    }
    
    result = await db.consumable_usage.insert_one(usage_dict)
    usage_dict["_id"] = result.inserted_id
    
    # Deduct from inventory
    new_quantity = consumable["quantity_available"] - usage.quantity_used
    await db.consumables.update_one(
        {"_id": ObjectId(usage.consumable_id)},
        {"$set": {"quantity_available": max(0, new_quantity)}}
    )
    
    return ConsumableUsage(**serialize_doc(usage_dict))

@api_router.get("/consumable-usage")
async def get_consumable_usage(
    dispatch_id: Optional[str] = None,
    consumable_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    if dispatch_id:
        query["dispatch_id"] = dispatch_id
    if consumable_id:
        query["consumable_id"] = consumable_id
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            date_query["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query["created_at"] = date_query
    
    usages = []
    async for usage in db.consumable_usage.find(query).sort("created_at", -1):
        usages.append(ConsumableUsage(**serialize_doc(usage)))
    return usages

@api_router.get("/consumable-usage/analytics")
async def get_consumable_usage_analytics(days: int = 30):
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get usage data
    pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {
            "_id": "$consumable_id",
            "consumable_name": {"$first": "$consumable_name"},
            "total_quantity": {"$sum": "$quantity_used"},
            "total_cost": {"$sum": "$cost"},
            "usage_count": {"$sum": 1},
            "unit": {"$first": "$unit"}
        }},
        {"$sort": {"total_quantity": -1}}
    ]
    
    usage_by_consumable = []
    async for item in db.consumable_usage.aggregate(pipeline):
        usage_by_consumable.append({
            "consumable_id": item["_id"],
            "consumable_name": item["consumable_name"],
            "total_quantity": item["total_quantity"],
            "total_cost": item.get("total_cost", 0) or 0,
            "usage_count": item["usage_count"],
            "unit": item["unit"]
        })
    
    # Get total stats
    total_cost = sum(item["total_cost"] for item in usage_by_consumable)
    total_usages = sum(item["usage_count"] for item in usage_by_consumable)
    
    # Get low stock items
    low_stock_items = []
    async for consumable in db.consumables.find({"active": True}):
        if consumable["quantity_available"] <= consumable["reorder_level"]:
            low_stock_items.append({
                "id": str(consumable["_id"]),
                "name": consumable["name"],
                "quantity_available": consumable["quantity_available"],
                "reorder_level": consumable["reorder_level"],
                "unit": consumable["unit"]
            })
    
    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_cost": total_cost,
        "total_usages": total_usages,
        "usage_by_consumable": usage_by_consumable,
        "low_stock_items": low_stock_items
    }

# ==================== Route Optimization ====================
@api_router.post("/routes/optimize")
async def optimize_route(site_ids: List[str]):
    """Optimize route order using nearest neighbor algorithm"""
    try:
        if len(site_ids) < 2:
            return {
                "optimized_order": site_ids,
                "estimated_distance_km": 0,
                "estimated_time_minutes": 0,
                "savings_percentage": 0,
                "message": "Need at least 2 sites to optimize"
            }
        
        # Get all sites with coordinates
        sites_data = []
        for site_id in site_ids:
            site = await db.sites.find_one({"_id": ObjectId(site_id)})
            if site:
                location = site.get("location", {})
                lat = location.get("latitude")
                lon = location.get("longitude")
                
                # If no coordinates, try to use address (for future Google Maps API integration)
                if lat is None or lon is None:
                    # For now, skip sites without coordinates
                    continue
                
                sites_data.append({
                    "id": site_id,
                    "name": site.get("name", "Unknown"),
                    "lat": float(lat),
                    "lon": float(lon),
                    "priority": site.get("priority", 5)
                })
        
        if len(sites_data) < 2:
            return {
                "optimized_order": site_ids,
                "estimated_distance_km": 0,
                "estimated_time_minutes": 0,
                "savings_percentage": 0,
                "message": "Not enough sites with valid coordinates"
            }
        
        # Calculate distance matrix using Haversine formula
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Calculate distance between two points on Earth in km"""
            from math import radians, cos, sin, asin, sqrt
            
            # Convert to radians
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            r = 6371  # Radius of Earth in kilometers
            
            return c * r
        
        # Create distance matrix
        n = len(sites_data)
        distance_matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    distance_matrix[i][j] = haversine_distance(
                        sites_data[i]['lat'], sites_data[i]['lon'],
                        sites_data[j]['lat'], sites_data[j]['lon']
                    )
        
        # Nearest Neighbor Algorithm with priority weighting
        def nearest_neighbor_with_priority(start_idx=0):
            """Find route using nearest neighbor considering priority"""
            unvisited = set(range(n))
            current = start_idx
            route = [current]
            unvisited.remove(current)
            total_distance = 0
            
            while unvisited:
                # Find nearest unvisited site with priority weighting
                best_next = None
                best_score = float('inf')
                
                for next_idx in unvisited:
                    distance = distance_matrix[current][next_idx]
                    priority = sites_data[next_idx]['priority']
                    
                    # Lower score is better (distance weighted by inverse priority)
                    # High priority (10) sites get preference over low priority (1) sites
                    score = distance * (11 - priority) / 10
                    
                    if score < best_score:
                        best_score = score
                        best_next = next_idx
                
                if best_next is not None:
                    total_distance += distance_matrix[current][best_next]
                    current = best_next
                    route.append(current)
                    unvisited.remove(current)
            
            return route, total_distance
        
        # Try different starting points and pick the best
        best_route = None
        best_distance = float('inf')
        
        for start_idx in range(min(n, 5)):  # Try first 5 sites as starting points
            route, distance = nearest_neighbor_with_priority(start_idx)
            if distance < best_distance:
                best_distance = distance
                best_route = route
        
        # Calculate original route distance (in order provided)
        original_distance = 0
        for i in range(n - 1):
            original_distance += distance_matrix[i][i + 1]
        
        # Calculate savings
        savings_km = original_distance - best_distance
        savings_percentage = (savings_km / original_distance * 100) if original_distance > 0 else 0
        
        # Create optimized order
        optimized_site_ids = [sites_data[i]['id'] for i in best_route]
        
        # Estimate time (assume 40 km/h average speed + 15 min per stop)
        estimated_time_minutes = (best_distance / 40 * 60) + (len(sites_data) * 15)
        
        return {
            "optimized_order": optimized_site_ids,
            "original_order": site_ids,
            "estimated_distance_km": round(best_distance, 2),
            "original_distance_km": round(original_distance, 2),
            "savings_km": round(savings_km, 2),
            "savings_percentage": round(savings_percentage, 1),
            "estimated_time_minutes": round(estimated_time_minutes),
            "total_sites": len(sites_data),
            "route_details": [
                {
                    "position": idx + 1,
                    "site_id": sites_data[i]['id'],
                    "site_name": sites_data[i]['name'],
                    "priority": sites_data[i]['priority']
                }
                for idx, i in enumerate(best_route)
            ]
        }
        
    except Exception as e:
        print(f"Error optimizing route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error optimizing route: {str(e)}")

# ==================== Weather-Based Dispatch Planning ====================
@api_router.get("/dispatch/weather-recommendations")
async def get_weather_dispatch_recommendations():
    """Generate dispatch recommendations based on weather forecast"""
    try:
        from weather_service import weather_service
        
        # Get 3-day forecast
        forecast = await weather_service.get_forecast(days=3)
        
        # Get all active sites
        sites = await db.sites.find({"active": True}).to_list(1000)
        
        # Get existing dispatches for the next 3 days
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        three_days_later = today + timedelta(days=3)
        existing_dispatches = await db.dispatches.find({
            "scheduled_date": {
                "$gte": today.strftime("%Y-%m-%d"),
                "$lte": three_days_later.strftime("%Y-%m-%d")
            }
        }).to_list(1000)
        
        # Create a map of existing dispatches by date and site
        existing_map = {}
        for dispatch in existing_dispatches:
            date = dispatch.get("scheduled_date")
            for site_id in dispatch.get("site_ids", []):
                key = f"{date}_{site_id}"
                existing_map[key] = True
        
        # Generate recommendations
        recommendations = []
        
        for day in forecast:
            if day['snow_risk'] in ['medium', 'high']:
                date_str = day['date']
                
                for site in sites:
                    site_id = str(site['_id'])
                    key = f"{date_str}_{site_id}"
                    
                    # Skip if dispatch already exists
                    if key in existing_map:
                        continue
                    
                    # Calculate priority based on multiple factors
                    priority_score = 0
                    
                    # Weather risk factor
                    if day['snow_risk'] == 'high':
                        priority_score += 10
                        recommended_services = ["plowing", "sanding"]
                    elif day['snow_risk'] == 'medium':
                        priority_score += 5
                        recommended_services = ["plowing"]
                    
                    # Site priority factor
                    site_priority = site.get('priority', 5)
                    priority_score += site_priority
                    
                    # Temperature factor (ice risk)
                    if day['temperature_min'] <= -5:
                        recommended_services.append("brining")
                        priority_score += 3
                    
                    # Calculate estimated duration (basic calculation)
                    site_area = site.get('area', 1000)  # default 1000 sqm
                    base_duration = (site_area / 500) * 30  # 30 min per 500 sqm
                    
                    if day['precipitation']['snow'] > 5:
                        estimated_duration = base_duration * 1.5
                    else:
                        estimated_duration = base_duration
                    
                    recommendations.append({
                        "date": date_str,
                        "day_name": day['day_name'],
                        "site_id": site_id,
                        "site_name": site.get("name", "Unknown"),
                        "site_address": site.get("location", {}).get("address", ""),
                        "priority": min(priority_score, 20),  # Cap at 20
                        "priority_level": "high" if priority_score >= 15 else "medium" if priority_score >= 10 else "normal",
                        "recommended_services": recommended_services,
                        "estimated_duration_minutes": round(estimated_duration),
                        "weather_conditions": {
                            "snow_amount": day['precipitation']['snow'],
                            "temp_min": day['temperature_min'],
                            "temp_max": day['temperature_max'],
                            "risk_level": day['snow_risk']
                        },
                        "reason": f"{day['snow_risk'].capitalize()} snow risk - {day['precipitation']['snow']}cm expected"
                    })
        
        # Sort by priority (highest first), then by date
        recommendations.sort(key=lambda x: (-x['priority'], x['date']))
        
        # Get current weather for context
        current_weather = await weather_service.get_current_weather()
        
        # Get operational recommendations
        operational_recommendations = weather_service.get_operational_recommendations(
            current_weather, forecast
        )
        
        return {
            "current_weather": current_weather,
            "forecast": forecast,
            "dispatch_recommendations": recommendations[:50],  # Limit to top 50
            "total_recommendations": len(recommendations),
            "high_priority_count": sum(1 for r in recommendations if r['priority_level'] == 'high'),
            "operational_recommendations": operational_recommendations,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error generating weather recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@api_router.post("/dispatch/create-from-recommendation")
async def create_dispatch_from_recommendation(recommendation: dict):
    """Create a dispatch from a weather recommendation"""
    try:
        # Create dispatch from recommendation
        dispatch_data = {
            "route_name": f"Weather Alert - {recommendation['site_name']}",
            "scheduled_date": recommendation['date'],
            "start_time": "07:00:00",  # Default start time
            "services": recommendation['recommended_services'],
            "site_ids": [recommendation['site_id']],
            "crew_ids": [],
            "equipment_ids": [],
            "status": "scheduled",
            "priority": recommendation['priority_level'],
            "notes": recommendation['reason'],
            "created_at": datetime.utcnow(),
            "created_by": "weather_system"
        }
        
        result = await db.dispatches.insert_one(dispatch_data)
        dispatch_data["_id"] = result.inserted_id
        
        return {
            "success": True,
            "dispatch_id": str(result.inserted_id),
            "message": "Dispatch created successfully from weather recommendation"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating dispatch: {str(e)}")

# ==================== SHIFT ENDPOINTS ====================
@api_router.get("/shifts")
async def get_shifts(user_id: str = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    shifts = []
    async for shift in db.shifts.find(query):
        shift_doc = serialize_doc(shift)
        # Convert datetime objects to ISO strings for compatibility
        if shift_doc.get("end_time") and not isinstance(shift_doc["end_time"], str):
            shift_doc["end_time"] = shift_doc["end_time"].isoformat() if hasattr(shift_doc["end_time"], "isoformat") else str(shift_doc["end_time"])
        if shift_doc.get("start_time") and not isinstance(shift_doc["start_time"], str):
            shift_doc["start_time"] = shift_doc["start_time"].isoformat() if hasattr(shift_doc["start_time"], "isoformat") else str(shift_doc["start_time"])
        shifts.append(Shift(**shift_doc))
    return shifts

@api_router.get("/shifts/active")
async def get_active_shifts():
    """Get all currently active shifts"""
    shifts = await db.shifts.find({"status": "active"}).to_list(1000)
    return [Shift(**serialize_doc(shift)) for shift in shifts]

@api_router.post("/shifts")
async def create_shift(shift: ShiftCreate):
    shift_dict = shift.dict()
    shift_dict["status"] = "active"
    shift_dict["created_at"] = datetime.utcnow()
    result = await db.shifts.insert_one(shift_dict)
    shift_dict["id"] = str(result.inserted_id)
    return Shift(**shift_dict)

@api_router.get("/shifts/{shift_id}")
async def get_shift(shift_id: str):
    shift = await db.shifts.find_one({"_id": ObjectId(shift_id)})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return Shift(**serialize_doc(shift))

@api_router.put("/shifts/{shift_id}")
async def update_shift(shift_id: str, shift_update: ShiftUpdate):
    update_data = {k: v for k, v in shift_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # If completing shift, set end_time as ISO string
    if update_data.get("status") == "completed" and "end_time" not in update_data:
        update_data["end_time"] = datetime.utcnow().isoformat()
    
    result = await db.shifts.update_one(
        {"_id": ObjectId(shift_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    shift = await db.shifts.find_one({"_id": ObjectId(shift_id)})
    shift_doc = serialize_doc(shift)
    # Convert datetime objects to ISO strings for compatibility
    if shift_doc.get("end_time") and not isinstance(shift_doc["end_time"], str):
        shift_doc["end_time"] = shift_doc["end_time"].isoformat() if hasattr(shift_doc["end_time"], "isoformat") else str(shift_doc["end_time"])
    if shift_doc.get("start_time") and not isinstance(shift_doc["start_time"], str):
        shift_doc["start_time"] = shift_doc["start_time"].isoformat() if hasattr(shift_doc["start_time"], "isoformat") else str(shift_doc["start_time"])
    return Shift(**shift_doc)

@api_router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: str):
    result = await db.shifts.delete_one({"_id": ObjectId(shift_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"message": "Shift deleted successfully"}

# ==================== EMERGENCY ALERT ENDPOINTS ====================
@api_router.post("/emergency-alerts/send")
async def send_emergency_alert(alert_message: str, alert_type: str = "general"):
    """Send emergency alert to all team members currently on shift"""
    try:
        # Get all active shifts
        active_shifts = await db.shifts.find({"status": "active"}).to_list(1000)
        
        if not active_shifts:
            return {
                "success": False,
                "message": "No active shifts found",
                "recipients": []
            }
        
        # Get unique user IDs from active shifts
        user_ids = list(set([shift.get("user_id") for shift in active_shifts if shift.get("user_id")]))
        
        # Get user details
        users = []
        for user_id in user_ids:
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if not user:
                    user = await db.users.find_one({"id": user_id})
                if user:
                    users.append(user)
            except:
                user = await db.users.find_one({"id": user_id})
                if user:
                    users.append(user)
        
        recipients = []
        email_sent = 0
        sms_sent = 0
        
        # Send alerts to each user
        for user in users:
            user_name = user.get("name", "Team Member")
            email = user.get("email")
            phone = user.get("phone")
            
            recipient_info = {
                "name": user_name,
                "email": email,
                "phone": phone,
                "email_sent": False,
                "sms_sent": False
            }
            
            # Check notification preferences
            prefs = user.get("notification_preferences", {})
            send_email = prefs.get("emergency_notifications_email", True)
            send_sms = prefs.get("emergency_notifications_sms", True)
            
            # Send email if enabled
            if send_email and email:
                try:
                    email_result = await email_service.send_email(
                        to_email=email,
                        subject=f"🚨 EMERGENCY ALERT - {alert_type.upper()}",
                        body=f"""
EMERGENCY ALERT

Hi {user_name},

{alert_message}

This is an urgent notification. Please acknowledge receipt as soon as possible.

Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

F Property Services Snow Removal Team
                        """
                    )
                    if email_result:
                        recipient_info["email_sent"] = True
                        email_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send emergency email to {email}: {str(e)}")
            
            # Send SMS if enabled
            if send_sms and phone:
                try:
                    sms_result = await sms_service.send_sms(
                        to_number=phone,
                        message=f"🚨 EMERGENCY ALERT: {alert_message} - Please acknowledge. F Property Services"
                    )
                    if sms_result.get("success"):
                        recipient_info["sms_sent"] = True
                        sms_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send emergency SMS to {phone}: {str(e)}")
            
            recipients.append(recipient_info)
        
        # Log the alert
        alert_log = {
            "type": alert_type,
            "message": alert_message,
            "sent_at": datetime.utcnow(),
            "recipients_count": len(recipients),
            "emails_sent": email_sent,
            "sms_sent": sms_sent,
            "recipients": recipients
        }
        await db.emergency_alerts.insert_one(alert_log)
        
        return {
            "success": True,
            "message": f"Emergency alert sent to {len(recipients)} team members",
            "recipients_count": len(recipients),
            "emails_sent": email_sent,
            "sms_sent": sms_sent,
            "recipients": recipients
        }
        
    except Exception as e:
        logger.error(f"Error sending emergency alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send emergency alert: {str(e)}")

@api_router.get("/emergency-alerts/history")
async def get_emergency_alerts_history(limit: int = 20):
    """Get history of emergency alerts sent"""
    alerts = await db.emergency_alerts.find().sort("sent_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(alert) for alert in alerts]

# ==================== GOOGLE PLACES PROXY ENDPOINTS ====================
@api_router.get("/google-places/autocomplete")
async def google_places_autocomplete(input: str):
    """Proxy for Google Places Autocomplete API"""
    try:
        import aiohttp
        google_api_key = os.getenv('GOOGLE_PLACES_API_KEY', '')
        
        if not google_api_key:
            raise HTTPException(status_code=500, detail="Google Maps API key not configured")
        
        url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json"
        params = {
            'input': input,
            'key': google_api_key,
            'components': 'country:ca|country:us'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                data = await response.json()
                return data
    except Exception as e:
        logger.error(f"Error fetching Google Places autocomplete: {str(e)}")
        return {"predictions": []}

@api_router.get("/google-places/details")
async def google_places_details(place_id: str):
    """Proxy for Google Places Details API"""
    try:
        import aiohttp
        google_api_key = os.getenv('GOOGLE_PLACES_API_KEY', '')
        
        if not google_api_key:
            raise HTTPException(status_code=500, detail="Google Maps API key not configured")
        
        url = f"https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'key': google_api_key
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                data = await response.json()
                return data
    except Exception as e:
        logger.error(f"Error fetching Google Places details: {str(e)}")
        return {"result": None}

# ==================== CUSTOMER FEEDBACK ENDPOINTS ====================
async def send_negative_feedback_notification(
    customer_feedback: str,
    customer_email: str = None,
    customer_name: str = None,
    rating: int = None,
    feedback_id: str = None
):
    """Background task to send email notification for negative feedback"""
    try:
        success = email_service.send_feedback_notification(
            customer_feedback=customer_feedback,
            customer_email=customer_email,
            customer_name=customer_name,
            rating=rating
        )
        
        # Update the feedback record to mark notification as sent
        if success and feedback_id:
            await db.customer_feedback.update_one(
                {"_id": ObjectId(feedback_id)},
                {"$set": {"notification_sent": True}}
            )
            logging.info(f"Feedback notification sent successfully for feedback {feedback_id}")
        else:
            logging.warning(f"Failed to send feedback notification for feedback {feedback_id}")
            
    except Exception as e:
        logging.error(f"Error sending feedback notification: {str(e)}")

@api_router.post("/feedback", response_model=CustomerFeedback)
async def submit_feedback(feedback: CustomerFeedbackCreate, background_tasks: BackgroundTasks):
    # Create feedback document
    feedback_doc = feedback.dict()
    feedback_doc["submitted_at"] = datetime.now().isoformat()
    feedback_doc["notification_sent"] = False
    
    result = await db.customer_feedback.insert_one(feedback_doc)
    
    # Get the inserted document
    created_feedback = await db.customer_feedback.find_one({"_id": result.inserted_id})
    response_feedback = serialize_doc(created_feedback)
    
    # Send email notification for negative feedback (rating <= 2)
    if feedback.rating <= 2:
        background_tasks.add_task(
            send_negative_feedback_notification,
            feedback.feedback,
            feedback.customer_email,
            feedback.customer_name,
            feedback.rating,
            str(result.inserted_id)
        )
    
    return CustomerFeedback(**response_feedback)

@api_router.get("/feedback")
async def get_feedback():
    """Get all feedback submissions (admin only)"""
    feedback_list = []
    async for feedback in db.customer_feedback.find({}):
        feedback_list.append(CustomerFeedback(**serialize_doc(feedback)))
    return feedback_list

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Message Portal Endpoints
@api_router.post("/messages", response_model=Message)
async def create_message(message: MessageCreate):
    message_doc = message.dict()
    message_doc["created_at"] = datetime.now()
    
    result = await db.messages.insert_one(message_doc)
    created_message = await db.messages.find_one({"_id": result.inserted_id})
    return Message(**serialize_doc(created_message))

@api_router.get("/admin-messages", response_model=List[Message])
async def get_messages(
    user_id: str = None,
    status: str = None,
    type: str = None,
    assigned_crew_id: str = None
):
    query = {}
    if user_id:
        query["$or"] = [
            {"from_user_id": user_id},
            {"to_user_id": user_id},
            {"assigned_crew_id": user_id}
        ]
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    if assigned_crew_id:
        query["assigned_crew_id"] = assigned_crew_id
        
    messages = await db.messages.find(query).sort("created_at", -1).to_list(1000)
    return [Message(**serialize_doc(msg)) for msg in messages]

@api_router.put("/admin-messages/{message_id}", response_model=Message)
async def update_message(message_id: str, update: MessageUpdate):
    try:
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        
        # Calculate response times if status changes
        if "status" in update_data:
            current_message = await db.messages.find_one({"_id": ObjectId(message_id)})
            if current_message:
                created_at = current_message.get("created_at")
                now = datetime.now()
                
                if update_data["status"] == "in_progress" and not current_message.get("admin_responded_at"):
                    update_data["admin_responded_at"] = now
                    if created_at:
                        update_data["response_time_hours"] = (now - created_at).total_seconds() / 3600
                        
                elif update_data["status"] == "acknowledged" and not current_message.get("crew_acknowledged_at"):
                    update_data["crew_acknowledged_at"] = now
                    crew_assigned_at = current_message.get("crew_assigned_at")
                    if crew_assigned_at:
                        update_data["acknowledgment_time_hours"] = (now - crew_assigned_at).total_seconds() / 3600
                        
                elif update_data["status"] == "resolved":
                    update_data["resolved_at"] = now
        
        # Set crew assignment timestamp
        if "assigned_crew_id" in update_data:
            update_data["crew_assigned_at"] = datetime.now()
            update_data["requires_follow_up"] = True
            update_data["follow_up_date"] = datetime.now() + timedelta(hours=24)  # 24 hour follow-up
        
        result = await db.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        updated_message = await db.messages.find_one({"_id": ObjectId(message_id)})
        return Message(**serialize_doc(updated_message))
    
    except Exception as e:
        if "not a valid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid message ID format")
        elif "Message not found" in str(e):
            raise HTTPException(status_code=404, detail="Message not found")
        else:
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@api_router.get("/admin-messages/pending-admin")
async def get_pending_admin_messages():
    """Get messages requiring admin attention"""
    messages = await db.messages.find({
        "status": "pending",
        "$or": [
            {"type": "customer_feedback"},
            {"type": "crew_assignment"}
        ]
    }).sort("created_at", -1).to_list(1000)
    return [Message(**serialize_doc(msg)) for msg in messages]

@api_router.get("/admin-messages/pending-crew/{crew_id}")
async def get_pending_crew_messages(crew_id: str):
    """Get messages requiring crew acknowledgment"""
    messages = await db.messages.find({
        "assigned_crew_id": crew_id,
        "status": {"$in": ["in_progress", "pending"]}
    }).sort("created_at", -1).to_list(1000)
    return [Message(**serialize_doc(msg)) for msg in messages]

@api_router.get("/admin-messages/overdue")
async def get_overdue_messages():
    """Get messages that need follow-up"""
    now = datetime.now()
    messages = await db.messages.find({
        "requires_follow_up": True,
        "follow_up_date": {"$lte": now},
        "status": {"$ne": "resolved"}
    }).sort("follow_up_date", 1).to_list(1000)
    return [Message(**serialize_doc(msg)) for msg in messages]

@api_router.get("/admin-messages/{message_id}", response_model=Message)
async def get_message(message_id: str):
    """Get a specific message by ID"""
    try:
        message = await db.messages.find_one({"_id": ObjectId(message_id)})
        if message:
            return Message(**serialize_doc(message))
        raise HTTPException(status_code=404, detail="Message not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Team Members Endpoint (for crew assignment)
@api_router.get("/team-members")
async def get_team_members():
    """Get all team members for assignment purposes"""
    members = []
    async for member in db.users.find({"active": True}):
        members.append({
            "id": serialize_doc(member)["id"],
            "name": member.get("name", "Unknown User"),
            "role": member.get("role", "crew"),
            "active": member.get("active", True)
        })
    return members

# Weather endpoints
@api_router.get("/weather/current")
async def get_current_weather(lat: float = None, lon: float = None):
    """Get current weather conditions"""
    weather_data = await weather_service.get_current_weather(lat, lon)
    return weather_data

@api_router.get("/weather/forecast")
async def get_weather_forecast(lat: float = None, lon: float = None, days: int = 5):
    """Get weather forecast for next few days"""
    if days > 10:
        days = 10  # Limit to 10 days max
    
    forecast_data = await weather_service.get_forecast(lat, lon, days)
    return {
        "forecast": forecast_data,
        "location": {"latitude": lat or 43.6532, "longitude": lon or -79.3832}
    }

@api_router.get("/weather/recommendations")
async def get_weather_recommendations(lat: float = None, lon: float = None):
    """Get operational recommendations based on current weather and forecast"""
    current_weather = await weather_service.get_current_weather(lat, lon)
    forecast = await weather_service.get_forecast(lat, lon, 5)
    
    recommendations = weather_service.get_operational_recommendations(current_weather, forecast)
    
    return {
        "current_weather": current_weather,
        "forecast_summary": forecast[:3],  # Next 3 days
        "recommendations": recommendations,
        "last_updated": current_weather["timestamp"]
    }


# ============================================
# AUTHENTICATION & PROFILE ENDPOINTS
# ============================================

# Send OTP for login or verification
@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP code via SMS for login, password reset, or phone verification"""
    try:
        # Generate OTP
        otp_code = twilio_service.generate_otp()
        
        # Send SMS
        result = await twilio_service.send_otp_sms(request.phone_number, otp_code)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=f"Failed to send SMS: {result.get('error')}")
        
        # Store OTP in database
        otp_record = {
            "phone_number": request.phone_number,
            "code": otp_code,
            "purpose": request.purpose,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "attempts": 0
        }
        
        await db.otp_records.insert_one(otp_record)
        
        return {
            "success": True,
            "message": "OTP sent successfully",
            "expires_in_minutes": 10,
            "mock_mode": result["status"] == "mocked",
            "mock_code": otp_code if result["status"] == "mocked" else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Verify OTP code
@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify, response: Response):
    """Verify OTP code"""
    try:
        print(f"=== OTP VERIFY REQUEST ===")
        print(f"Phone: {request.phone_number}")
        print(f"Purpose: {request.purpose}")
        print(f"Code: {request.code}")
        
        # Find the most recent unexpired OTP for this phone number and purpose
        otp_record = await db.otp_records.find_one({
            "phone_number": request.phone_number,
            "purpose": request.purpose,
            "verified": False,
            "expires_at": {"$gt": datetime.utcnow()}
        }, sort=[("created_at", -1)])
        
        if not otp_record:
            raise HTTPException(status_code=404, detail="No valid OTP found or OTP expired")
        
        # Check attempts
        if otp_record["attempts"] >= 3:
            raise HTTPException(status_code=429, detail="Too many attempts. Please request a new OTP")
        
        # Verify code
        if otp_record["code"] != request.code:
            # Increment attempts
            await db.otp_records.update_one(
                {"_id": otp_record["_id"]},
                {"$inc": {"attempts": 1}}
            )
            raise HTTPException(status_code=400, detail="Invalid OTP code")
        
        # Mark as verified
        await db.otp_records.update_one(
            {"_id": otp_record["_id"]},
            {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
        )
        
        print(f"OTP verified! Purpose: {request.purpose}")
        
        # CREATE SESSION FOR LOGIN PURPOSE
        if request.purpose == "login":
            print("Creating session for login purpose...")
            print(f"Searching for user with phone: {request.phone_number}")
            
            # Get user by phone number
            user = await db.users.find_one({"phone": request.phone_number})
            print(f"Database query result: {user}")
            
            if user:
                user_id = str(user["_id"])
                print(f"Found user: {user.get('name', 'unknown')} with ID: {user_id}")
                
                # Create session token
                session_token = secrets.token_urlsafe(32)
                await db.user_sessions.insert_one({
                    "user_id": user_id,
                    "session_token": session_token,
                    "created_at": datetime.utcnow(),
                    "expires_at": datetime.utcnow() + timedelta(days=7)
                })
                
                # Set session cookie
                print(f"Setting session cookie for OTP login: {user.get('name', 'unknown')}")
                print(f"Session token: {session_token[:20]}...")
                response.set_cookie(
                    key="session_token",
                    value=session_token,
                    httponly=True,
                    secure=True,
                    max_age=7 * 24 * 60 * 60,  # 7 days
                    samesite="lax"
                )
                print("Cookie set successfully for OTP login")
                
                # Return user data with session token
                user["id"] = user_id
                del user["_id"]
                
                return {
                    "success": True, 
                    "message": "OTP verified successfully",
                    "user": user,
                    "session_token": session_token
                }
            else:
                print("No user found with phone number!")
        else:
            print(f"Not creating session - purpose is: {request.purpose}")
        
        return {"success": True, "message": "OTP verified successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in verify_otp: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Passwordless login - Send OTP
@api_router.post("/auth/passwordless-login")
async def passwordless_login(request: PasswordlessLoginRequest):
    """Initiate passwordless login by sending OTP"""
    try:
        # Check if user exists with this phone number
        user = await db.users.find_one({"phone": request.phone_number})
        
        if not user:
            raise HTTPException(status_code=404, detail="No user found with this phone number")
        
        # Generate and send OTP
        otp_code = twilio_service.generate_otp()
        result = await twilio_service.send_otp_sms(request.phone_number, otp_code)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=f"Failed to send SMS: {result.get('error')}")
        
        # Store OTP
        otp_record = {
            "phone_number": request.phone_number,
            "code": otp_code,
            "purpose": "passwordless_login",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "attempts": 0,
            "user_id": str(user["_id"])
        }
        
        await db.otp_records.insert_one(otp_record)
        
        return {
            "success": True,
            "message": "OTP sent to your phone",
            "user_name": user["name"],
            "mock_mode": result["status"] == "mocked",
            "mock_code": otp_code if result["status"] == "mocked" else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Verify OTP and login
@api_router.post("/auth/passwordless-login/verify")
async def verify_passwordless_login(request: PasswordlessLoginVerify, response: Response):
    """Verify OTP and complete login"""
    try:
        # Find and verify OTP
        otp_record = await db.otp_records.find_one({
            "phone_number": request.phone_number,
            "purpose": "passwordless_login",
            "verified": False,
            "expires_at": {"$gt": datetime.utcnow()}
        }, sort=[("created_at", -1)])
        
        if not otp_record:
            raise HTTPException(status_code=404, detail="No valid OTP found or OTP expired")
        
        if otp_record["attempts"] >= 3:
            raise HTTPException(status_code=429, detail="Too many attempts. Please request a new OTP")
        
        if otp_record["code"] != request.code:
            await db.otp_records.update_one(
                {"_id": otp_record["_id"]},
                {"$inc": {"attempts": 1}}
            )
            raise HTTPException(status_code=400, detail="Invalid OTP code")
        
        # Mark OTP as verified
        await db.otp_records.update_one(
            {"_id": otp_record["_id"]},
            {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
        )
        
        # Get user details
        user = await db.users.find_one({"_id": ObjectId(otp_record["user_id"])})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user["id"] = str(user["_id"])
        user_id = user["id"]
        del user["_id"]
        
        # CREATE SESSION TOKEN - THIS WAS MISSING!
        session_token = secrets.token_urlsafe(32)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        })
        
        # SET SESSION COOKIE
        print(f"Setting session cookie for phone login: {user.get('name', 'unknown')}")
        print(f"Session token: {session_token[:20]}...")
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            max_age=7 * 24 * 60 * 60,  # 7 days
            samesite="lax"
        )
        print("Cookie set successfully for phone login")
        
        return {
            "success": True,
            "message": "Login successful",
            "user": user,
            "session_token": session_token
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Password reset - Request
@api_router.post("/auth/password-reset-request")
async def password_reset_request(request: OTPPasswordResetRequest):
    """Request password reset via OTP or magic link"""
    try:
        # Find user by email or phone
        user = await db.users.find_one({
            "$or": [
                {"email": request.identifier},
                {"phone": request.identifier}
            ]
        })
        
        if not user:
            # For security, don't reveal if user exists
            return {"success": True, "message": "If a user exists, a reset code has been sent"}
        
        if request.method == "otp":
            # Send OTP via SMS
            if not user.get("phone"):
                raise HTTPException(status_code=400, detail="User has no phone number registered")
            
            otp_code = twilio_service.generate_otp()
            result = await twilio_service.send_otp_sms(user["phone"], otp_code)
            
            if result["status"] == "error":
                raise HTTPException(status_code=500, detail=f"Failed to send SMS: {result.get('error')}")
            
            # Store OTP
            otp_record = {
                "phone_number": user["phone"],
                "code": otp_code,
                "purpose": "password_reset",
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(minutes=10),
                "verified": False,
                "attempts": 0,
                "user_id": str(user["_id"])
            }
            
            await db.otp_records.insert_one(otp_record)
            
            return {
                "success": True,
                "message": "OTP sent to your phone",
                "method": "otp",
                "mock_mode": result["status"] == "mocked",
                "mock_code": otp_code if result["status"] == "mocked" else None
            }
        
        elif request.method == "magic_link":
            # Generate magic link token
            token = secrets.token_urlsafe(32)
            
            # Store token
            magic_link_record = {
                "identifier": request.identifier,
                "token": token,
                "purpose": "password_reset",
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=1),
                "used": False,
                "user_id": str(user["_id"])
            }
            
            await db.magic_link_tokens.insert_one(magic_link_record)
            
            # Create magic link
            # TODO: Replace with actual frontend URL
            magic_link = f"https://yourdomain.com/reset-password?token={token}"
            
            # Send via SMS or email based on identifier
            if "@" in request.identifier:
                # Send email (implementation depends on your email service)
                # await email_service.send_password_reset_email(user["email"], magic_link)
                pass
            else:
                # Send SMS
                result = await twilio_service.send_magic_link_sms(user["phone"], magic_link)
                if result["status"] == "error":
                    raise HTTPException(status_code=500, detail=f"Failed to send SMS: {result.get('error')}")
            
            return {
                "success": True,
                "message": "Password reset link sent",
                "method": "magic_link",
                "mock_mode": result.get("status") == "mocked",
                "mock_link": magic_link if result.get("status") == "mocked" else None
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid reset method. Use 'otp' or 'magic_link'")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Password reset - Verify and reset
@api_router.post("/auth/password-reset-verify")
async def password_reset_verify(request: PasswordResetVerify):
    """Verify OTP/token and reset password"""
    try:
        user_id = None
        
        if request.code:
            # OTP method
            otp_record = await db.otp_records.find_one({
                "purpose": "password_reset",
                "verified": False,
                "expires_at": {"$gt": datetime.utcnow()},
                "code": request.code
            }, sort=[("created_at", -1)])
            
            if not otp_record:
                raise HTTPException(status_code=404, detail="Invalid or expired OTP")
            
            # Mark as verified
            await db.otp_records.update_one(
                {"_id": otp_record["_id"]},
                {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
            )
            
            user_id = otp_record["user_id"]
        
        elif request.token:
            # Magic link method
            token_record = await db.magic_link_tokens.find_one({
                "token": request.token,
                "purpose": "password_reset",
                "used": False,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not token_record:
                raise HTTPException(status_code=404, detail="Invalid or expired token")
            
            # Mark as used
            await db.magic_link_tokens.update_one(
                {"_id": token_record["_id"]},
                {"$set": {"used": True, "used_at": datetime.utcnow()}}
            )
            
            user_id = token_record["user_id"]
        
        else:
            raise HTTPException(status_code=400, detail="Either code or token must be provided")
        
        # Update password
        # Note: In production, you should hash the password
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": request.new_password, "password_updated_at": datetime.utcnow()}}
        )
        
        return {"success": True, "message": "Password reset successful"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NEW AUTHENTICATION ENDPOINTS ====================
from auth_endpoints import (
    email_login_endpoint, forgot_password_endpoint, reset_password_endpoint,
    google_oauth_session_endpoint, get_current_user_endpoint, logout_endpoint,
    hash_password
)

@api_router.post("/auth/login-email", response_model=AuthResponse)
async def login_with_email(request: EmailLoginRequest, response: Response):
    """Login with email and password"""
    result = await email_login_endpoint(db, email_service, request)
    
    # Set session cookie
    print(f"Setting session cookie for: {result.get('user', {}).get('email', 'unknown')}")
    print(f"Session token: {result['session_token'][:20]}...")
    response.set_cookie(
        key="session_token",
        value=result["session_token"],
        httponly=True,
        secure=True,  # Required for HTTPS
        max_age=7 * 24 * 60 * 60,  # 7 days
        samesite="lax"  # Changed back to lax - frontend and backend are on same domain
    )
    print("Cookie set successfully")
    
    return result

@api_router.get("/auth/test-login")
async def test_login(response: Response):
    """TEMPORARY: Test login endpoint - bypass auth for demo"""
    # Get admin user
    user_doc = await db.users.find_one({"email": "admin@test.com"})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check if session already exists for this user
    user_id = str(user_doc["_id"])
    existing_session = await db.user_sessions.find_one({"user_id": user_id})
    
    if existing_session:
        session_token = existing_session["session_token"]
        print(f"[DEBUG] Reusing existing session: {session_token[:20]}...")
    else:
        # Generate new session token
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Store session in database
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session_doc)
        print(f"[DEBUG] Created new session: {session_token[:20]}...")
    
    # Prepare user response
    user_response = {
        "id": str(user_doc["_id"]),
        "email": user_doc.get("email"),
        "name": user_doc.get("name"),
        "full_name": user_doc.get("full_name"),
        "role": user_doc.get("role"),
        "title": user_doc.get("title")
    }
    
    return {
        "user": user_response,
        "session_token": session_token,
        "message": "Test login successful - REMOVE IN PRODUCTION"
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    return await forgot_password_endpoint(db, email_service, request)

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    return await reset_password_endpoint(db, request)

@api_router.get("/auth/session-data", response_model=AuthResponse)
async def get_oauth_session(request: Request, response: Response):
    """Process Emergent Google OAuth session"""
    session_id = request.headers.get("X-Session-ID")
    result = await google_oauth_session_endpoint(db, session_id)
    
    # Set session cookie
    if "session_token" in result:
        response.set_cookie(
            key="session_token",
            value=result["session_token"],
            httponly=True,
            secure=True,  # Required for HTTPS
            max_age=7 * 24 * 60 * 60,  # 7 days
            samesite="lax"  # Changed back to lax
        )
    
    return result

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    return await get_current_user_endpoint(db, request)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout current user"""
    return await logout_endpoint(db, request, response)

@api_router.get("/auth/google/signin")
async def google_signin_initiate():
    """Initiate Google Sign-In OAuth flow"""
    try:
        if not gmail_service.enabled:
            raise HTTPException(status_code=503, detail="Google Sign-In not configured")
        
        # Generate state token for security
        state = secrets.token_urlsafe(32)
        
        # Store state for verification (expires in 10 minutes)
        await db.google_auth_states.insert_one({
            "state": state,
            "purpose": "signin",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        })
        
        # Create authorization URL with openid scope for sign-in
        from google_auth_oauthlib.flow import Flow
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": gmail_service.client_id,
                    "client_secret": gmail_service.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [os.getenv('GOOGLE_SIGNIN_REDIRECT_URI', 'http://localhost:8001/api/auth/google/callback')]
                }
            },
            scopes=[
                'openid',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            redirect_uri=os.getenv('GOOGLE_SIGNIN_REDIRECT_URI', 'http://localhost:8001/api/auth/google/callback')
        )
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'
        )
        
        return {"authorization_url": authorization_url}
        
    except Exception as e:
        print(f"Error initiating Google Sign-In: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/google/callback")
async def google_signin_callback(code: str, state: str, response: Response):
    """Handle Google Sign-In OAuth callback"""
    try:
        # Verify state
        state_doc = await db.google_auth_states.find_one({"state": state, "purpose": "signin"})
        if not state_doc:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        if state_doc["expires_at"] < datetime.utcnow():
            await db.google_auth_states.delete_one({"_id": state_doc["_id"]})
            raise HTTPException(status_code=400, detail="State expired")
        
        # Exchange code for tokens
        from google_auth_oauthlib.flow import Flow
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": gmail_service.client_id,
                    "client_secret": gmail_service.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [os.getenv('GOOGLE_SIGNIN_REDIRECT_URI', 'http://localhost:8001/api/auth/google/callback')]
                }
            },
            scopes=[
                'openid',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            state=state,
            redirect_uri=os.getenv('GOOGLE_SIGNIN_REDIRECT_URI', 'http://localhost:8001/api/auth/google/callback')
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user info from Google
        from googleapiclient.discovery import build
        
        oauth2_service = build('oauth2', 'v2', credentials=credentials)
        user_info = oauth2_service.userinfo().get().execute()
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        google_id = user_info.get('id')
        picture = user_info.get('picture')
        
        # Find or create user
        user = await db.users.find_one({"email": email})
        
        if not user:
            # Create new user
            user_dict = {
                "name": name,
                "email": email,
                "phone": "",
                "role": "customer",  # Default role for Google sign-in
                "active": True,
                "google_id": google_id,
                "avatar": picture,
                "created_at": datetime.utcnow()
            }
            result = await db.users.insert_one(user_dict)
            user_id = str(result.inserted_id)
        else:
            # Update existing user with Google ID if not set
            user_id = str(user["_id"])
            if not user.get("google_id"):
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"google_id": google_id, "avatar": picture}}
                )
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        })
        
        # Delete used state
        await db.google_auth_states.delete_one({"_id": state_doc["_id"]})
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,  # Required for HTTPS
            max_age=7 * 24 * 60 * 60,  # 7 days
            samesite="lax"  # Changed back to lax
        )
        
        # Redirect to app with success
        redirect_base = os.getenv('EXPO_PACKAGER_PROXY_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{redirect_base}/?google_signin=success")
        
    except Exception as e:
        print(f"Error in Google Sign-In callback: {e}")
        redirect_base = os.getenv('EXPO_PACKAGER_PROXY_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{redirect_base}/login?error=google_signin_failed")

# Update user profile
@api_router.put("/users/{user_id}/profile")
async def update_user_profile(user_id: str, profile: UserProfileUpdate):
    """Update user profile (email, phone, name, password)"""
    try:
        # Try to find user by ObjectId or by id field (for non-MongoDB IDs like 'admin-temp')
        user = None
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            logger.info(f"Found user by ObjectId: {user_id}")
        except Exception as e:
            # If not a valid ObjectId, search by id field
            logger.info(f"ObjectId failed for {user_id}: {str(e)}, trying id field")
            query = {"id": user_id}
            logger.info(f"Searching with query: {query}")
            user = await db.users.find_one(query)
            logger.info(f"Query result: {user}")
            if user:
                logger.info(f"Found user by id field: {user_id}")
            else:
                logger.error(f"User not found with id field query")
        
        if not user:
            logger.error(f"User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        update_data = {}
        
        # If changing email or phone, require password verification
        if (profile.email and profile.email != user.get("email")) or \
           (profile.phone and profile.phone != user.get("phone")):
            if not profile.current_password:
                raise HTTPException(status_code=400, detail="Current password required to change email or phone")
            
            # TODO: Verify current password
            # if not verify_password(profile.current_password, user.get("password")):
            #     raise HTTPException(status_code=401, detail="Incorrect current password")
        
        # Update fields
        if profile.name:
            update_data["name"] = profile.name
        
        if profile.email:
            # Check if email is already in use
            existing = await db.users.find_one({
                "email": profile.email, 
                "_id": {"$ne": user.get("_id")} if user.get("_id") else None,
                "id": {"$ne": user_id} if not user.get("_id") else None
            })
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_data["email"] = profile.email
        
        if profile.phone:
            # Check if phone is already in use  
            existing = await db.users.find_one({
                "phone": profile.phone,
                "_id": {"$ne": user.get("_id")} if user.get("_id") else None,
                "id": {"$ne": user_id} if not user.get("_id") else None
            })
            if existing:
                raise HTTPException(status_code=400, detail="Phone number already in use")
            update_data["phone"] = profile.phone
        
        if profile.avatar:
            update_data["avatar"] = profile.avatar
        
        if profile.photo:
            update_data["photo"] = profile.photo
        
        if profile.new_password:
            # TODO: Hash password in production
            update_data["password"] = profile.new_password
            update_data["password_updated_at"] = datetime.utcnow()
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            
            # Update using _id if available, otherwise use id field
            if user.get("_id"):
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": update_data}
                )
            else:
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": update_data}
                )
        
        # Return updated user
        if user.get("_id"):
            updated_user = await db.users.find_one({"_id": user["_id"]})
            updated_user["id"] = str(updated_user["_id"])
            del updated_user["_id"]
        else:
            updated_user = await db.users.find_one({"id": user_id})
        
        # Remove password from response
        if "password" in updated_user:
            del updated_user["password"]
        
        return {"success": True, "user": updated_user}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app (after all endpoints are defined)

# ================== LEARNING DOCUMENTS ENDPOINTS ==================

@api_router.post("/documents")
async def create_document(document: DocumentCreate):
    """Create a new learning document (Admin only)"""
    try:
        print(f"=== DOCUMENT UPLOAD RECEIVED ===")
        print(f"Title: {document.title}")
        print(f"Category: {document.category}")
        print(f"File name: {document.file_name}")
        print(f"File size: {document.file_size}")
        print(f"File data length: {len(document.file_data) if document.file_data else 0}")
        print(f"Visible to roles: {document.visible_to_roles}")
        
        # Check file size (limit to 10MB base64 which is ~7.5MB actual file)
        if document.file_data and len(document.file_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        doc_dict = document.dict()
        doc_dict["id"] = str(uuid.uuid4())
        doc_dict["view_count"] = 0
        doc_dict["created_at"] = datetime.utcnow()
        doc_dict["updated_at"] = datetime.utcnow()
        
        # Convert enum to string for MongoDB
        doc_dict["category"] = doc_dict["category"].value
        doc_dict["visible_to_roles"] = [role.value for role in doc_dict["visible_to_roles"]]
        
        print(f"Inserting document with ID: {doc_dict['id']}")
        await db.learning_documents.insert_one(doc_dict)
        print(f"Document inserted successfully")
        
        return {"id": doc_dict["id"], "message": "Document created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"=== ERROR CREATING DOCUMENT ===")
        print(f"Error: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/documents")
async def get_documents(
    role: Optional[str] = None,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get all documents with optional filters"""
    try:
        query = {}
        
        # Filter by role access
        if role:
            query["visible_to_roles"] = role
        
        # Filter by category
        if category:
            query["category"] = category
        
        # Filter by featured
        if featured is not None:
            query["featured"] = featured
        
        # Search in title and description
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        documents = []
        async for doc in db.learning_documents.find(query).sort("created_at", -1):
            # Keep the UUID id field, just remove MongoDB's _id
            if "_id" in doc:
                del doc["_id"]
            # Don't send file_data in list view to reduce payload size
            if "file_data" in doc:
                doc["has_file"] = True
                del doc["file_data"]
            documents.append(doc)
        
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document by ID with full file data"""
    try:
        document = await db.learning_documents.find_one({"id": document_id})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Keep the UUID id field, just remove MongoDB's _id
        if "_id" in document:
            del document["_id"]
        
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/documents/{document_id}")
async def update_document(document_id: str, document: DocumentUpdate):
    """Update a document (Admin only)"""
    try:
        existing = await db.learning_documents.find_one({"id": document_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")
        
        update_data = {k: v for k, v in document.dict(exclude_unset=True).items() if v is not None}
        
        if update_data:
            # Convert enums to strings
            if "category" in update_data:
                update_data["category"] = update_data["category"].value
            if "visible_to_roles" in update_data:
                update_data["visible_to_roles"] = [role.value for role in update_data["visible_to_roles"]]
            
            update_data["updated_at"] = datetime.utcnow()
            
            await db.learning_documents.update_one(
                {"id": document_id},
                {"$set": update_data}
            )
        
        return {"message": "Document updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document (Admin only)"""
    try:
        result = await db.learning_documents.delete_one({"id": document_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/documents/{document_id}/view")
async def increment_view_count(document_id: str):
    """Increment view count for a document"""
    try:
        result = await db.learning_documents.update_one(
            {"id": document_id},
            {"$inc": {"view_count": 1}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "View count incremented"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/documents/stats/summary")
async def get_document_stats():
    """Get document statistics (Admin only)"""
    try:
        total_docs = await db.learning_documents.count_documents({})
        featured_docs = await db.learning_documents.count_documents({"featured": True})
        
        # Get total views
        pipeline = [
            {"$group": {"_id": None, "total_views": {"$sum": "$view_count"}}}
        ]
        view_stats = await db.learning_documents.aggregate(pipeline).to_list(1)
        total_views = view_stats[0]["total_views"] if view_stats else 0
        
        # Get category counts
        category_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        category_stats = await db.learning_documents.aggregate(category_pipeline).to_list(10)
        
        return {
            "total_documents": total_docs,
            "featured_documents": featured_docs,
            "total_views": total_views,
            "by_category": {stat["_id"]: stat["count"] for stat in category_stats}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DIRECT MESSAGING ENDPOINTS ====================

@api_router.post("/direct-messages")
async def send_direct_message(message_data: DirectMessageCreate, request: Request):
    """Send a direct message to another user"""
    try:
        # Get sender info from session
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        sender = await db.users.find_one({"_id": ObjectId(session["user_id"])})
        receiver = await db.users.find_one({"_id": ObjectId(message_data.receiver_id)})
        
        if not sender or not receiver:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check permissions
        if receiver["role"] == "customer" and not receiver.get("messaging_enabled", True):
            raise HTTPException(status_code=403, detail="Messaging is disabled for this user")
        
        # Create or get conversation ID
        participant_ids = sorted([str(sender["_id"]), str(receiver["_id"])])
        conversation = await db.conversations.find_one({"participant_ids": participant_ids})
        
        if not conversation:
            # Create new conversation
            conversation_data = {
                "participant_ids": participant_ids,
                "participant_names": [sender["name"], receiver["name"]],
                "participant_titles": [sender.get("title", ""), receiver.get("title", "")],
                "last_message": message_data.message,
                "last_message_at": datetime.utcnow(),
                "unread_count": {str(receiver["_id"]): 1, str(sender["_id"]): 0},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await db.conversations.insert_one(conversation_data)
            conversation_id = str(result.inserted_id)
        else:
            conversation_id = str(conversation["_id"])
            # Update conversation
            unread_count = conversation.get("unread_count", {})
            unread_count[str(receiver["_id"])] = unread_count.get(str(receiver["_id"]), 0) + 1
            
            await db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$set": {
                        "last_message": message_data.message,
                        "last_message_at": datetime.utcnow(),
                        "unread_count": unread_count,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Create message
        message = {
            "sender_id": str(sender["_id"]),
            "sender_name": sender["name"],
            "sender_title": sender.get("title"),
            "receiver_id": str(receiver["_id"]),
            "receiver_name": receiver["name"],
            "receiver_title": receiver.get("title"),
            "message": message_data.message,
            "read": False,
            "conversation_id": conversation_id,
            "created_at": datetime.utcnow()
        }
        
        result = await db.direct_messages.insert_one(message)
        message["id"] = str(result.inserted_id)
        message["_id"] = str(result.inserted_id)
        
        return message
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/direct-messages/conversations")
async def get_user_conversations(request: Request):
    """Get all conversations for the current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        print(f"Conversations request - session_token present: {bool(session_token)}")
        
        if not session_token:
            print("No session token - returning empty conversations")
            return []
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        print(f"Session found: {bool(session)}")
        
        if not session:
            print("Invalid session token - returning empty conversations")
            return []
        
        user_id = session["user_id"]
        print(f"Fetching conversations for user: {user_id}")
        
        # Get all conversations where user is a participant
        conversations = await db.conversations.find({
            "participant_ids": user_id
        }).sort("updated_at", -1).to_list(100)
        
        print(f"Found {len(conversations)} conversations")
        
        # Format conversations
        result = []
        for conv in conversations:
            conv["id"] = str(conv["_id"])
            conv["_id"] = str(conv["_id"])
            conv["unread_count_for_user"] = conv.get("unread_count", {}).get(user_id, 0)
            result.append(conv)
        
        return result
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        # Return empty array instead of raising error
        return []


@api_router.get("/direct-messages/conversation/{conversation_id}")
async def get_conversation_messages(conversation_id: str, request: Request):
    """Get all messages in a conversation"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Verify user is part of conversation
        conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if not conversation or user_id not in conversation["participant_ids"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get messages
        messages = await db.direct_messages.find({
            "conversation_id": conversation_id
        }).sort("created_at", 1).to_list(1000)
        
        # Mark messages as read
        await db.direct_messages.update_many(
            {"conversation_id": conversation_id, "receiver_id": user_id, "read": False},
            {"$set": {"read": True}}
        )
        
        # Reset unread count
        unread_count = conversation.get("unread_count", {})
        unread_count[user_id] = 0
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"unread_count": unread_count}}
        )
        
        # Format messages
        for msg in messages:
            msg["id"] = str(msg["_id"])
            msg["_id"] = str(msg["_id"])
        
        return messages
    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, status: dict):
    """Update user's work status"""
    try:
        new_status = status.get("status")
        if new_status not in ["on_shift", "busy", "off_shift", "offline"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": new_status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "status": new_status}
    except Exception as e:
        print(f"Error updating status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/direct-messages/unread-count")
async def get_unread_message_count(request: Request):
    """Get total unread message count for current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            return {"count": 0}
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return {"count": 0}
        
        user_id = session["user_id"]
        
        # Sum all unread counts from conversations
        conversations = await db.conversations.find({
            "participant_ids": user_id
        }).to_list(100)
        
        total_unread = sum(conv.get("unread_count", {}).get(user_id, 0) for conv in conversations)
        
        return {"count": total_unread}
    except Exception as e:
        print(f"Error fetching unread count: {e}")
        return {"count": 0}


@api_router.get("/unified-conversations")
async def get_unified_conversations(request: Request):
    """Get unified conversations including both direct messages and SMS"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        print(f"Unified conversations request - session_token present: {bool(session_token)}")
        
        if not session_token:
            print("No session token - returning empty")
            return []
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            print("Invalid session - returning empty")
            return []
        
        user_id = session["user_id"]
        current_user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not current_user:
            return []
        
        print(f"Fetching unified conversations for user: {current_user.get('name')}")
        
        result = []
        
        # 1. Get Direct Message conversations
        dm_conversations = await db.conversations.find({
            "participant_ids": user_id
        }).sort("updated_at", -1).to_list(100)
        
        for conv in dm_conversations:
            # Get the other user
            other_user_id = [pid for pid in conv["participant_ids"] if pid != user_id][0] if len(conv["participant_ids"]) > 1 else None
            
            if other_user_id:
                other_user = await db.users.find_one({"_id": ObjectId(other_user_id)})
                if other_user:
                    result.append({
                        "id": str(conv["_id"]),
                        "type": "direct_message",
                        "conversation_id": str(conv["_id"]),
                        "other_user": {
                            "id": str(other_user["_id"]),
                            "name": other_user.get("name"),
                            "title": other_user.get("title", ""),
                            "status": other_user.get("status", "offline"),
                            "avatar": other_user.get("avatar"),
                            "role": other_user.get("role")
                        },
                        "last_message": conv.get("last_message", ""),
                        "unread_count": conv.get("unread_count", {}).get(user_id, 0),
                        "updated_at": conv.get("updated_at", conv.get("created_at"))
                    })
        
        # 2. Get SMS conversations (if user is admin or has customer associations)
        if current_user.get("role") == "admin":
            # Get all customers with SMS communications
            customers_with_sms = await db.communications.distinct("customer_id", {"type": "sms"})
            
            for customer_id in customers_with_sms:
                customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
                if customer:
                    # Get last SMS
                    last_sms = await db.communications.find_one(
                        {"customer_id": customer_id, "type": "sms"},
                        sort=[("created_at", -1)]
                    )
                    
                    if last_sms:
                        # Count unread SMS
                        unread_count = await db.communications.count_documents({
                            "customer_id": customer_id,
                            "type": "sms",
                            "direction": "received",
                            "read": False
                        })
                        
                        result.append({
                            "id": f"sms_{customer_id}",
                            "type": "sms",
                            "customer_id": customer_id,
                            "other_user": {
                                "id": customer_id,
                                "name": customer.get("name"),
                                "title": "Customer",
                                "status": "offline",
                                "avatar": customer.get("avatar"),
                                "role": "customer",
                                "phone": customer.get("phone")
                            },
                            "last_message": last_sms.get("content", ""),
                            "unread_count": unread_count,
                            "updated_at": last_sms.get("created_at")
                        })
        
        # Sort all conversations by updated_at
        result.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        
        print(f"Returning {len(result)} unified conversations")
        return result
        
    except Exception as e:
        print(f"Error fetching unified conversations: {e}")
        import traceback
        traceback.print_exc()
        return []


@api_router.get("/sms-conversation/{customer_id}")
async def get_sms_conversation(customer_id: str, request: Request):
    """Get SMS conversation messages for a customer"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            return []
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return []
        
        # Get all SMS communications for this customer
        communications = await db.communications.find({
            "customer_id": customer_id,
            "type": "sms"
        }).sort("created_at", 1).to_list(1000)
        
        # Mark received SMS as read
        await db.communications.update_many(
            {"customer_id": customer_id, "type": "sms", "direction": "received", "read": False},
            {"$set": {"read": True}}
        )
        
        # Format messages
        result = []
        for comm in communications:
            result.append({
                "id": str(comm["_id"]),
                "message": comm["content"],
                "sender_id": comm.get("sent_by") if comm["direction"] == "sent" else customer_id,
                "receiver_id": customer_id if comm["direction"] == "sent" else comm.get("sent_by"),
                "created_at": comm["created_at"].isoformat() if isinstance(comm["created_at"], datetime) else comm["created_at"],
                "read": comm.get("read", False),
                "direction": comm["direction"]
            })
        
        return result
    except Exception as e:
        print(f"Error fetching SMS conversation: {e}")
        return []


@api_router.post("/sms-message")
async def send_sms_message(request: Request, data: dict):
    """Send SMS message to a customer"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        sender = await db.users.find_one({"_id": ObjectId(session["user_id"])})
        customer_id = data.get("customer_id")
        message = data.get("message")
        
        if not customer_id or not message:
            raise HTTPException(status_code=400, detail="Missing customer_id or message")
        
        customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Create communication record
        communication_data = {
            "customer_id": customer_id,
            "type": "sms",
            "direction": "sent",
            "content": message,
            "sent_by": str(sender["_id"]),
            "sent_by_name": sender["name"],
            "read": True,
            "created_at": datetime.utcnow()
        }
        
        await db.communications.insert_one(communication_data)
        
        # TODO: Actually send SMS via Twilio
        # sms_service.send_sms(customer["phone"], message)
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# =============================================================================
# GMAIL API ENDPOINTS
# =============================================================================

@api_router.get("/gmail/connect")
async def gmail_connect(request: Request):
    """Initiate Gmail OAuth connection"""
    try:
        # Debug logging
        print(f"Gmail connect request - cookies: {request.cookies}")
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        print(f"Session token: {session_token}")
        
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        print(f"Gmail connect - user_id: {user_id}")
        
        # Generate state token for security
        state = secrets.token_urlsafe(32)
        
        # Store state with user_id for verification
        await db.gmail_oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        })
        
        # Get authorization URL
        auth_url = gmail_service.create_authorization_url(state)
        print(f"Generated auth URL: {auth_url[:100]}...")
        
        return {"authorization_url": auth_url}
        
    except Exception as e:
        print(f"Error initiating Gmail connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/gmail/oauth/callback")
async def gmail_oauth_callback(code: str, state: str):
    """Handle Gmail OAuth callback"""
    try:
        # Verify state
        state_doc = await db.gmail_oauth_states.find_one({"state": state})
        if not state_doc:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        if state_doc["expires_at"] < datetime.utcnow():
            await db.gmail_oauth_states.delete_one({"_id": state_doc["_id"]})
            raise HTTPException(status_code=400, detail="State expired")
        
        user_id = state_doc["user_id"]
        
        # Exchange code for tokens
        token_data = gmail_service.exchange_code_for_tokens(code, state)
        
        # Get user's email address
        credentials = gmail_service.get_credentials_from_token(token_data)
        email_address = gmail_service.get_user_email(credentials)
        
        # Get Gmail signature
        signature = gmail_service.get_gmail_signature(credentials)
        
        # Check if connection already exists
        existing = await db.gmail_connections.find_one({
            "user_id": user_id,
            "email_address": email_address
        })
        
        connection_data = {
            **token_data,
            "connected_at": datetime.utcnow(),
            "last_synced": None,
            "signature": signature
        }
        
        if existing:
            # Update existing connection
            await db.gmail_connections.update_one(
                {"_id": existing["_id"]},
                {"$set": connection_data}
            )
        else:
            # Create new connection
            await db.gmail_connections.insert_one({
                "user_id": user_id,
                "email_address": email_address,
                "is_shared": email_address == "snow@cafinc.ca",
                **connection_data
            })
        
        # Delete used state
        await db.gmail_oauth_states.delete_one({"_id": state_doc["_id"]})
        
        # Redirect to Gmail page
        redirect_base = "https://snowtrack-admin-2.preview.emergentagent.com"
        return RedirectResponse(url=f"{redirect_base}/gmail?connected=true")
        
    except Exception as e:
        print(f"Error in Gmail OAuth callback: {e}")
        redirect_base = "https://snowtrack-admin-2.preview.emergentagent.com"
        return RedirectResponse(url=f"{redirect_base}/gmail?error=connection_failed")


@api_router.get("/gmail/status")
async def gmail_connection_status(request: Request):
    """Get Gmail connection status for current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            return {"connected": False, "connections": []}
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return {"connected": False, "connections": []}
        
        user_id = session["user_id"]
        
        # Get all connections for this user
        connections = await db.gmail_connections.find({"user_id": user_id}).to_list(100)
        
        # Also get shared connections
        shared_connections = await db.gmail_connections.find({"is_shared": True}).to_list(100)
        
        all_connections = connections + shared_connections
        
        connection_list = []
        for conn in all_connections:
            connection_list.append({
                "id": str(conn["_id"]),
                "email_address": conn["email_address"],
                "is_shared": conn.get("is_shared", False),
                "connected_at": conn["connected_at"].isoformat() if isinstance(conn["connected_at"], datetime) else conn["connected_at"],
                "last_synced": conn["last_synced"].isoformat() if conn.get("last_synced") and isinstance(conn["last_synced"], datetime) else None
            })
        
        return {
            "connected": len(all_connections) > 0,
            "connections": connection_list
        }
        
    except Exception as e:
        print(f"Error getting Gmail status: {e}")
        return {"connected": False, "connections": []}


@api_router.post("/gmail/sync")
async def gmail_sync(request: Request):
    """Manually sync emails for current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get all connections for this user
        connections = await db.gmail_connections.find({"user_id": user_id}).to_list(100)
        
        # Also include shared connections
        shared_connections = await db.gmail_connections.find({"is_shared": True}).to_list(100)
        
        all_connections = connections + shared_connections
        
        if not all_connections:
            return {"synced": 0, "message": "No Gmail accounts connected"}
        
        total_synced = 0
        
        for conn in all_connections:
            try:
                # Get credentials
                token_data = {
                    "access_token": conn["access_token"],
                    "refresh_token": conn["refresh_token"],
                    "token_uri": conn["token_uri"],
                    "client_id": conn["client_id"],
                    "client_secret": conn["client_secret"],
                    "scopes": conn["scopes"],
                    "expiry": conn.get("expiry")
                }
                
                credentials = gmail_service.get_credentials_from_token(token_data)
                
                # Fetch emails
                result = gmail_service.fetch_emails(credentials, max_results=50)
                emails = result["emails"]
                
                # Store emails in database
                for email in emails:
                    # Check if email already exists
                    existing = await db.gmail_emails.find_one({
                        "connection_id": str(conn["_id"]),
                        "message_id": email["id"]
                    })
                    
                    if not existing:
                        # Try to match to customer by email
                        customer_id = None
                        from_email = email["from"]
                        if "<" in from_email:
                            from_email = from_email.split("<")[1].split(">")[0].strip()
                        
                        customer = await db.customers.find_one({"email": from_email})
                        if customer:
                            customer_id = str(customer["_id"])
                        
                        # Insert email
                        await db.gmail_emails.insert_one({
                            "connection_id": str(conn["_id"]),
                            "email_address": conn["email_address"],
                            "message_id": email["id"],
                            "thread_id": email["thread_id"],
                            "subject": email["subject"],
                            "from_email": email["from"],
                            "to_email": email["to"],
                            "snippet": email["snippet"],
                            "body": email["body"],
                            "is_unread": email["is_unread"],
                            "labels": email["labels"],
                            "date": email["date"],
                            "internal_date": email["internal_date"],
                            "customer_id": customer_id,
                            "created_at": datetime.utcnow(),
                            "synced_at": datetime.utcnow()
                        })
                        total_synced += 1
                
                # Update last_synced
                await db.gmail_connections.update_one(
                    {"_id": conn["_id"]},
                    {"$set": {"last_synced": datetime.utcnow()}}
                )
                
            except Exception as e:
                print(f"Error syncing emails for {conn['email_address']}: {e}")
                continue
        
        return {"synced": total_synced, "message": f"Synced {total_synced} new emails"}
        
    except Exception as e:
        print(f"Error syncing Gmail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/gmail/emails")
async def get_gmail_emails(request: Request, customer_only: bool = False, limit: int = 50):
    """Get Gmail emails directly from Gmail API"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            return []
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return []
        
        user_id = session["user_id"]
        print(f"=== FETCHING GMAIL EMAILS ===")
        print(f"User ID: {user_id}")
        
        # Get Gmail connection for this user
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            print("No Gmail connection found")
            return []
        
        print(f"Gmail connection found: {connection.get('email_address')}")
        
        # Fetch emails directly from Gmail API
        try:
            credentials = gmail_service.get_credentials_from_token(connection)
            email_data = gmail_service.fetch_emails(credentials, max_results=limit)
            emails = email_data.get("emails", [])
            
            print(f"Fetched {len(emails)} emails from Gmail API")
            
            return emails
        except Exception as e:
            print(f"Error fetching from Gmail API: {e}")
            import traceback
            traceback.print_exc()
            return []
        
    except Exception as e:
        print(f"Error in get_gmail_emails: {e}")
        import traceback
        traceback.print_exc()
        return []
        
        # Format response
        result = []
        for email in emails:
            result.append({
                "id": str(email["_id"]),
                "message_id": email["message_id"],
                "thread_id": email["thread_id"],
                "email_address": email["email_address"],
                "subject": email["subject"],
                "from": email["from_email"],
                "to": email["to_email"],
                "snippet": email["snippet"],
                "body": email["body"],
                "is_unread": email["is_unread"],
                "date": email["date"],
                "customer_id": email.get("customer_id"),
                "synced_at": email["synced_at"].isoformat() if isinstance(email["synced_at"], datetime) else email["synced_at"]
            })
        
        return result
        
    except Exception as e:
        print(f"Error getting Gmail emails: {e}")
        return []


@api_router.post("/gmail/disconnect/{connection_id}")
async def gmail_disconnect(connection_id: str, request: Request):
    """Disconnect a Gmail account"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Verify ownership
        connection = await db.gmail_connections.find_one({"_id": ObjectId(connection_id)})
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        if connection["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to disconnect this account")
        
        # Delete connection
        await db.gmail_connections.delete_one({"_id": ObjectId(connection_id)})
        
        # Optionally delete associated emails
        # await db.gmail_emails.delete_many({"connection_id": connection_id})
        
        return {"success": True, "message": "Gmail account disconnected"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error disconnecting Gmail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/mark-read/{message_id}")
async def mark_email_as_read(message_id: str, request: Request):
    """Mark an email as read"""
    try:
        print(f"=== MARK AS READ REQUEST ===")
        print(f"Message ID: {message_id}")
        
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        print(f"User ID: {user_id}")
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            print("No Gmail connection found")
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        print(f"Gmail connection found for: {connection.get('email_address')}")
        
        # Get credentials and mark as read
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.mark_as_read(credentials, message_id)
        
        print(f"Mark as read result: {success}")
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to mark email as read")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking email as read: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/mark-unread/{message_id}")
async def mark_email_as_unread(message_id: str, request: Request):
    """Mark an email as unread"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and mark as unread
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.mark_as_unread(credentials, message_id)
        
        if success:
            # Update local database
            await db.gmail_emails.update_one(
                {"message_id": message_id},
                {"$set": {"is_unread": True}}
            )
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to mark email as unread")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking email as unread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/archive/{message_id}")
async def archive_email(message_id: str, request: Request):
    """Archive an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and archive
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.archive_email(credentials, message_id)
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to archive email")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error archiving email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/delete/{message_id}")
async def delete_email(message_id: str, request: Request):
    """Delete an email (move to trash)"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and delete
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.delete_email(credentials, message_id)
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete email")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/send")
async def send_email(email_data: EmailSendRequest, request: Request):
    """Send or reply to an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Append signature to body if available
        body = email_data.body
        if connection.get("signature"):
            body += f"\n\n{connection['signature']}"
        
        # Get credentials and send email
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.send_email(
            credentials, 
            email_data.to, 
            email_data.subject, 
            body,
            email_data.message_id
        )
        
        if success:
            return {"success": True, "message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
    except HTTPException:
        raise


@api_router.get("/gmail/labels")
async def get_gmail_labels(request: Request):
    """Get all Gmail labels for the user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and fetch labels
        credentials = gmail_service.get_credentials_from_token(connection)
        labels = gmail_service.get_labels(credentials)
        
        return {"labels": labels}
    except Exception as e:
        logger.error(f"Error fetching labels: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/labels/create")
async def create_gmail_label(label_data: dict, request: Request):
    """Create a new Gmail label"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and create label
        credentials = gmail_service.get_credentials_from_token(connection)
        label = gmail_service.create_label(
            credentials, 
            label_data.get('name'),
            label_data.get('color')
        )
        
        if label:
            return {"success": True, "label": label}
        else:
            raise HTTPException(status_code=500, detail="Failed to create label")
    except Exception as e:
        logger.error(f"Error creating label: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/labels/add")
async def add_label_to_email(label_data: dict, request: Request):
    """Add labels to an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and add labels
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.add_label_to_email(
            credentials,
            label_data.get('message_id'),
            label_data.get('label_ids', [])
        )
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to add labels")
    except Exception as e:
        logger.error(f"Error adding labels: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/labels/remove")
async def remove_label_from_email(label_data: dict, request: Request):
    """Remove labels from an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and remove labels
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.remove_label_from_email(
            credentials,
            label_data.get('message_id'),
            label_data.get('label_ids', [])
        )
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to remove labels")
    except Exception as e:
        logger.error(f"Error removing labels: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/gmail/labels/{label_id}/emails")
async def get_emails_by_label(label_id: str, request: Request):
    """Get emails filtered by label"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and fetch emails by label
        credentials = gmail_service.get_credentials_from_token(connection)
        emails = gmail_service.get_emails_by_label(credentials, label_id)
        
        return {"emails": emails}
    except Exception as e:
        logger.error(f"Error fetching emails by label: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/gmail/labels/{label_id}")
async def delete_label(label_id: str, request: Request):
    """Delete a Gmail label"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and delete label
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.delete_label(credentials, label_id)
        
        if success:
            return {"success": True, "message": "Label deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete label")
    except Exception as e:
        logger.error(f"Error deleting label: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/star/{message_id}")
async def star_email(message_id: str, request: Request):
    """Star an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and star email
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.add_label_to_email(credentials, message_id, ['STARRED'])
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to star email")
    except Exception as e:
        logger.error(f"Error starring email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/unstar/{message_id}")
async def unstar_email(message_id: str, request: Request):
    """Unstar an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and unstar email
        credentials = gmail_service.get_credentials_from_token(connection)
        success = gmail_service.remove_label_from_email(credentials, message_id, ['STARRED'])
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to unstar email")
    except Exception as e:
        logger.error(f"Error unstarring email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AUTO-LABELING RULES ====================
@api_router.get("/gmail/auto-label-rules")
async def get_auto_label_rules(request: Request):
    """Get all auto-labeling rules for current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get auto-label rules for this user
        rules = await db.gmail_auto_label_rules.find({"user_id": user_id}).to_list(100)
        return {"rules": [serialize_doc(rule) for rule in rules]}
    except Exception as e:
        logger.error(f"Error fetching auto-label rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/auto-label-rules")
async def create_auto_label_rule(rule_data: dict, request: Request):
    """Create a new auto-labeling rule"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Create rule
        rule = {
            "user_id": user_id,
            "name": rule_data.get("name"),
            "condition_type": rule_data.get("condition_type", "from"),  # from, to, subject, contains
            "condition_value": rule_data.get("condition_value"),
            "label_ids": rule_data.get("label_ids", []),
            "active": True,
            "created_at": datetime.utcnow()
        }
        
        result = await db.gmail_auto_label_rules.insert_one(rule)
        rule["id"] = str(result.inserted_id)
        
        return {"success": True, "rule": serialize_doc(rule)}
    except Exception as e:
        logger.error(f"Error creating auto-label rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/gmail/auto-label-rules/{rule_id}")
async def delete_auto_label_rule(rule_id: str, request: Request):
    """Delete an auto-labeling rule"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Delete rule (ensure user owns it)
        result = await db.gmail_auto_label_rules.delete_one({
            "_id": ObjectId(rule_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return {"success": True, "message": "Rule deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting auto-label rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/apply-auto-label-rules")
async def apply_auto_label_rules(request: Request):
    """Apply all active auto-label rules to existing emails"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get all active rules
        rules = await db.gmail_auto_label_rules.find({"user_id": user_id, "active": True}).to_list(100)
        
        if not rules:
            return {"success": True, "message": "No active rules to apply", "applied_count": 0}
        
        # Get credentials
        credentials = gmail_service.get_credentials_from_token(connection)
        
        # Fetch recent emails
        email_data = gmail_service.fetch_emails(credentials, max_results=100)
        emails = email_data.get("emails", [])
        
        applied_count = 0
        for email in emails:
            for rule in rules:
                condition_type = rule.get("condition_type", "from")
                condition_value = rule.get("condition_value", "").lower()
                label_ids = rule.get("label_ids", [])
                
                if not label_ids:
                    continue
                
                # Check if rule matches
                matches = False
                if condition_type == "from" and condition_value in email.get("from", "").lower():
                    matches = True
                elif condition_type == "to" and condition_value in email.get("to", "").lower():
                    matches = True
                elif condition_type == "subject" and condition_value in email.get("subject", "").lower():
                    matches = True
                elif condition_type == "contains" and (
                    condition_value in email.get("body", "").lower() or 
                    condition_value in email.get("snippet", "").lower()
                ):
                    matches = True
                
                # Apply label if matches
                if matches:
                    try:
                        gmail_service.add_label_to_email(credentials, email["id"], label_ids)
                        applied_count += 1
                    except Exception as e:
                        logger.error(f"Error applying label to email {email['id']}: {e}")
        
        return {"success": True, "message": f"Applied rules to {applied_count} emails", "applied_count": applied_count}
    except Exception as e:
        logger.error(f"Error applying auto-label rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GMAIL ATTACHMENT ENDPOINTS ====================

@api_router.get("/gmail/attachments/{message_id}/{attachment_id}")
async def download_attachment(message_id: str, attachment_id: str, request: Request):
    """Download an email attachment"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and download attachment
        credentials = gmail_service.get_credentials_from_token(connection)
        attachment_data = gmail_service.get_attachment(credentials, message_id, attachment_id)
        
        if not attachment_data:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        return {
            "success": True,
            "data": attachment_data['data'],
            "size": attachment_data['size']
        }
    except Exception as e:
        logger.error(f"Error downloading attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GMAIL EMAIL TEMPLATE ENDPOINTS ====================

@api_router.get("/gmail/templates")
async def get_email_templates(request: Request):
    """Get all email templates for current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's own templates and shared templates
        user_templates = await db.email_templates.find({"user_id": user_id}).to_list(100)
        shared_templates = await db.email_templates.find({"is_shared": True, "user_id": {"$ne": user_id}}).to_list(100)
        
        all_templates = user_templates + shared_templates
        
        # Convert ObjectId to string
        for template in all_templates:
            template["id"] = str(template["_id"])
            del template["_id"]
        
        return {"success": True, "templates": all_templates}
    except Exception as e:
        logger.error(f"Error getting email templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/templates")
async def create_email_template(template_data: EmailTemplateCreate, request: Request):
    """Create a new email template"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Create template
        template = EmailTemplate(
            user_id=user_id,
            **template_data.dict()
        )
        
        result = await db.email_templates.insert_one(template.dict(exclude={'id'}))
        template.id = str(result.inserted_id)
        
        return {"success": True, "template": template.dict()}
    except Exception as e:
        logger.error(f"Error creating email template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/gmail/templates/{template_id}")
async def get_email_template(template_id: str, request: Request):
    """Get a specific email template"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get template
        template = await db.email_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check if user has access (own template or shared template)
        if template["user_id"] != user_id and not template.get("is_shared", False):
            raise HTTPException(status_code=403, detail="Access denied")
        
        template["id"] = str(template["_id"])
        del template["_id"]
        
        return {"success": True, "template": template}
    except Exception as e:
        logger.error(f"Error getting email template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/gmail/templates/{template_id}")
async def update_email_template(template_id: str, template_data: EmailTemplateUpdate, request: Request):
    """Update an email template"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get template to verify ownership
        template = await db.email_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        if template["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Can only update your own templates")
        
        # Update template
        update_data = {k: v for k, v in template_data.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.email_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": update_data}
        )
        
        # Get updated template
        updated_template = await db.email_templates.find_one({"_id": ObjectId(template_id)})
        updated_template["id"] = str(updated_template["_id"])
        del updated_template["_id"]
        
        return {"success": True, "template": updated_template}
    except Exception as e:
        logger.error(f"Error updating email template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/gmail/templates/{template_id}")
async def delete_email_template(template_id: str, request: Request):
    """Delete an email template"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get template to verify ownership
        template = await db.email_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        if template["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Can only delete your own templates")
        
        # Delete template
        await db.email_templates.delete_one({"_id": ObjectId(template_id)})
        
        return {"success": True, "message": "Template deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting email template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/templates/{template_id}/use")
async def use_email_template(template_id: str, placeholders: dict, request: Request):
    """Use a template and fill in placeholders"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get template
        template = await db.email_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check access
        if template["user_id"] != user_id and not template.get("is_shared", False):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Replace placeholders in subject and body
        subject = template["subject"]
        body = template["body"]
        
        for key, value in placeholders.items():
            placeholder = f"{{{{{key}}}}}"  # {{key}} format
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
        
        # Increment usage count
        await db.email_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$inc": {"usage_count": 1}}
        )
        
        return {
            "success": True,
            "subject": subject,
            "body": body,
            "template_name": template["name"]
        }
    except Exception as e:
        logger.error(f"Error using email template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GMAIL CRM INTEGRATION ENDPOINTS ====================

@api_router.post("/gmail/link-customer")
async def link_email_to_customer(link_data: EmailCustomerLinkCreate, request: Request):
    """Link an email to a customer"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Verify customer exists
        customer = await db.customers.find_one({"_id": ObjectId(link_data.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Check if link already exists
        existing_link = await db.email_customer_links.find_one({
            "message_id": link_data.message_id,
            "customer_id": link_data.customer_id
        })
        
        if existing_link:
            return {"success": True, "message": "Email already linked to this customer", "link_id": str(existing_link["_id"])}
        
        # Create link
        link = EmailCustomerLink(
            message_id=link_data.message_id,
            customer_id=link_data.customer_id,
            linked_by_user_id=user_id,
            auto_linked=False,
            notes=link_data.notes
        )
        
        result = await db.email_customer_links.insert_one(link.dict(exclude={'id'}))
        link.id = str(result.inserted_id)
        
        return {"success": True, "link": link.dict(), "message": "Email linked to customer successfully"}
    except Exception as e:
        logger.error(f"Error linking email to customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/gmail/email-links/{message_id}")
async def get_email_customer_links(message_id: str, request: Request):
    """Get all customer links for an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Get all links for this email
        links = await db.email_customer_links.find({"message_id": message_id}).to_list(100)
        
        # Enrich with customer data
        enriched_links = []
        for link in links:
            customer = await db.customers.find_one({"_id": ObjectId(link["customer_id"])})
            if customer:
                enriched_links.append({
                    "id": str(link["_id"]),
                    "message_id": link["message_id"],
                    "customer_id": link["customer_id"],
                    "customer_name": customer.get("name", "Unknown"),
                    "customer_email": customer.get("email", ""),
                    "linked_by_user_id": link["linked_by_user_id"],
                    "linked_at": link["linked_at"].isoformat() if isinstance(link["linked_at"], datetime) else link["linked_at"],
                    "auto_linked": link.get("auto_linked", False),
                    "notes": link.get("notes")
                })
        
        return {"success": True, "links": enriched_links}
    except Exception as e:
        logger.error(f"Error getting email customer links: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/gmail/email-links/{link_id}")
async def delete_email_customer_link(link_id: str, request: Request):
    """Remove a customer link from an email"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Delete link
        result = await db.email_customer_links.delete_one({"_id": ObjectId(link_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Link not found")
        
        return {"success": True, "message": "Link removed successfully"}
    except Exception as e:
        logger.error(f"Error deleting email customer link: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/gmail/auto-link-emails")
async def auto_link_emails(request: Request):
    """Automatically link emails to customers based on email address matching"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get user's Gmail connection
        connection = await db.gmail_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="No Gmail connection found")
        
        # Get credentials and fetch recent emails
        credentials = gmail_service.get_credentials_from_token(connection)
        email_data = gmail_service.fetch_emails(credentials, max_results=100)
        emails = email_data.get("emails", [])
        
        # Get all customers
        customers = await db.customers.find({}).to_list(1000)
        
        # Create email to customer mapping
        email_to_customer = {}
        for customer in customers:
            if customer.get("email"):
                email_to_customer[customer["email"].lower()] = str(customer["_id"])
        
        linked_count = 0
        for email in emails:
            # Extract email address from "Name <email>" format
            from_email = email.get("from", "")
            if "<" in from_email and ">" in from_email:
                from_email = from_email.split("<")[1].split(">")[0]
            from_email = from_email.strip().lower()
            
            # Check if we have a matching customer
            if from_email in email_to_customer:
                customer_id = email_to_customer[from_email]
                
                # Check if link already exists
                existing_link = await db.email_customer_links.find_one({
                    "message_id": email["id"],
                    "customer_id": customer_id
                })
                
                if not existing_link:
                    # Create auto link
                    link = EmailCustomerLink(
                        message_id=email["id"],
                        customer_id=customer_id,
                        linked_by_user_id=user_id,
                        auto_linked=True,
                        notes="Automatically linked based on email address"
                    )
                    
                    await db.email_customer_links.insert_one(link.dict(exclude={'id'}))
                    linked_count += 1
        
        return {
            "success": True,
            "message": f"Auto-linked {linked_count} emails to customers",
            "linked_count": linked_count
        }
    except Exception as e:
        logger.error(f"Error auto-linking emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))



app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://snowtrack-admin-2.preview.emergentagent.com",
        "exp://localhost:8081",
        "exp://127.0.0.1:8081"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize webhook handler with database connection
    init_webhook_handler(db)
    logger.info("Webhook handler initialized")
    
    # Start background scheduler for automation workflows
    await background_scheduler.start()
    logger.info("Background scheduler started")

@app.on_event("shutdown")
async def shutdown_db_client():
    await background_scheduler.stop()
    client.close()


# ==================== RINGCENTRAL ENDPOINTS ====================

@api_router.get("/ringcentral/status")
async def ringcentral_status(request: Request):
    """Get RingCentral connection status"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            return {"connected": False}
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return {"connected": False}
        
        user_id = session["user_id"]
        connection = await db.ringcentral_connections.find_one({"user_id": user_id})
        
        return {"connected": bool(connection)}
    except Exception as e:
        logger.error(f"Error getting RingCentral status: {e}")
        return {"connected": False}

@api_router.get("/ringcentral/call-logs")
async def get_call_logs(request: Request):
    """Get call logs from RingCentral"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        connection = await db.ringcentral_connections.find_one({"user_id": user_id})
        
        if not connection:
            raise HTTPException(status_code=404, detail="RingCentral not connected")
        
        access_token = connection.get("access_token")
        
        try:
            records = await ringcentral_service.get_call_logs(access_token)
            return {"records": records}
        except Exception as rc_error:
            # RingCentral API error (likely 401 - token expired)
            logger.warning(f"RingCentral API error for call logs: {rc_error}")
            # Return empty records instead of failing
            return {"records": [], "error": "RingCentral connection may have expired"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching call logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/voicemails")
async def get_voicemails(request: Request):
    """Get voicemails from RingCentral"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        connection = await db.ringcentral_connections.find_one({"user_id": user_id})
        
        if not connection:
            raise HTTPException(status_code=404, detail="RingCentral not connected")
        
        access_token = connection.get("access_token")
        
        try:
            records = await ringcentral_service.get_voicemails(access_token)
            return {"records": records}
        except Exception as rc_error:
            # RingCentral API error (likely 401 - token expired)
            logger.warning(f"RingCentral API error for voicemails: {rc_error}")
            # Return empty records instead of failing
            return {"records": [], "error": "RingCentral connection may have expired"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching voicemails: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/connect")
async def ringcentral_connect(request: Request):
    """Initiate RingCentral OAuth"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        state = secrets.token_urlsafe(32)
        
        # Store state
        await db.ringcentral_oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        })
        
        auth_url = ringcentral_service.get_authorization_url(state)
        return {"authorization_url": auth_url}
    except Exception as e:
        logger.error(f"Error initiating RingCentral connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhooks/ringcentral")
async def ringcentral_webhook(request: Request):
    """Handle RingCentral webhook events"""
    try:
        # Get webhook data
        data = await request.json()
        
        # Verify webhook (optional - implement signature validation if needed)
        event_type = data.get('event')
        
        # Initialize webhook handler
        from webhook_handler import webhook_handler, init_webhook_handler
        if not webhook_handler:
            init_webhook_handler(db)
        
        # Handle different event types
        if event_type == '/restapi/v1.0/account/~/extension/~/presence':
            # Presence event - check telephony status
            telephony_status = data.get('body', {}).get('telephonyStatus')
            if telephony_status == 'Ringing':
                call_info = await webhook_handler.handle_incoming_call(data)
                logger.info(f"Incoming call processed: {call_info}")
            elif telephony_status in ['CallConnected', 'Disconnected', 'NoCall', 'Hold', 'Parked']:
                # Call status change
                await webhook_handler.handle_call_status_change(data)
                logger.info(f"Call status change processed: {telephony_status}")
        elif 'telephonyStatus' in data.get('body', {}):
            # Call status change for other event types
            await webhook_handler.handle_call_status_change(data)
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error handling RingCentral webhook: {e}")
        return {"status": "error", "message": str(e)}

@api_router.get("/ringcentral/call-stream")
async def ringcentral_call_stream(request: Request):
    """Server-Sent Events stream for real-time call notifications"""
    import asyncio
    import json
    
    async def event_generator():
        """Generate SSE events for active calls"""
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Call stream connected'})}\n\n"
            
            # Poll for active calls every 2 seconds
            while True:
                try:
                    # Initialize webhook handler if needed
                    from webhook_handler import webhook_handler, init_webhook_handler
                    if not webhook_handler:
                        init_webhook_handler(db)
                    
                    # Get active calls
                    active_calls = await db.active_calls.find().to_list(100)
                    
                    # Send each active call as an event
                    for call in active_calls:
                        # Convert ObjectId to string
                        if '_id' in call:
                            call['id'] = str(call['_id'])
                            del call['_id']
                        
                        # Convert datetime to ISO string
                        if 'timestamp' in call and isinstance(call['timestamp'], datetime):
                            call['timestamp'] = call['timestamp'].isoformat()
                        if 'updated_at' in call and isinstance(call['updated_at'], datetime):
                            call['updated_at'] = call['updated_at'].isoformat()
                        
                        # Send call event
                        yield f"data: {json.dumps({'type': 'call', 'call': call})}\n\n"
                    
                    # Send heartbeat if no active calls
                    if not active_calls:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                    
                    # Wait before next poll
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error in call stream: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    await asyncio.sleep(5)
                    
        except asyncio.CancelledError:
            logger.info("Call stream disconnected")
            raise
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@api_router.get("/ringcentral/active-calls")
async def get_active_calls(request: Request):
    """Get currently active calls"""
    try:
        active_calls = await db.active_calls.find().to_list(100)
        
        # Convert ObjectId and datetime to strings
        for call in active_calls:
            if '_id' in call:
                call['id'] = str(call['_id'])
                del call['_id']
            if 'timestamp' in call and isinstance(call['timestamp'], datetime):
                call['timestamp'] = call['timestamp'].isoformat()
            if 'updated_at' in call and isinstance(call['updated_at'], datetime):
                call['updated_at'] = call['updated_at'].isoformat()
        
        return {"calls": active_calls}
    except Exception as e:
        logger.error(f"Error getting active calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/calls/{session_id}/notes")
async def create_call_note(session_id: str, note_data: CallNoteCreate, request: Request):
    """Create a note for a call"""
    try:
        # Get user from session
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get call info from active_calls
        call = await db.active_calls.find_one({"session_id": session_id})
        
        # Create note
        note_dict = note_data.dict()
        note_dict["session_id"] = session_id
        note_dict["user_id"] = user_id
        note_dict["created_at"] = datetime.utcnow()
        
        if call:
            note_dict["from_number"] = call.get("from_number")
            note_dict["from_name"] = call.get("from_name")
            note_dict["customer_id"] = call.get("customer_id")
        
        result = await db.call_notes.insert_one(note_dict)
        note_dict["id"] = str(result.inserted_id)
        
        logger.info(f"Call note created for session {session_id} by user {user_id}")
        
        return CallNote(**note_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating call note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/calls/{session_id}/notes")
async def get_call_notes(session_id: str):
    """Get notes for a specific call"""
    try:
        notes = await db.call_notes.find({"session_id": session_id}).to_list(100)
        
        for note in notes:
            if '_id' in note:
                note['id'] = str(note['_id'])
                del note['_id']
            if 'created_at' in note and isinstance(note['created_at'], datetime):
                note['created_at'] = note['created_at'].isoformat()
        
        return {"notes": notes}
    except Exception as e:
        logger.error(f"Error getting call notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/calls/{session_id}/recording")
async def get_call_recording(session_id: str, request: Request):
    """Get call recording URL if available"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        connection = await db.ringcentral_connections.find_one({"user_id": user_id})
        
        if not connection:
            raise HTTPException(status_code=404, detail="RingCentral not connected")
        
        access_token = connection.get("access_token")
        
        # Get call log to find recording ID
        call_logs = await ringcentral_service.get_call_logs(access_token)
        
        # Find the call by session ID
        call_log = None
        for log in call_logs:
            if log.get('sessionId') == session_id:
                call_log = log
                break
        
        if not call_log:
            raise HTTPException(status_code=404, detail="Call not found in call logs")
        
        # Check if recording exists
        recording = call_log.get('recording')
        if not recording:
            return {"has_recording": False}
        
        recording_id = recording.get('id')
        if not recording_id:
            return {"has_recording": False}
        
        # Return recording info
        return {
            "has_recording": True,
            "recording_id": recording_id,
            "recording_type": recording.get('type'),
            "content_uri": recording.get('contentUri'),
            "duration": recording.get('duration')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting call recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ENHANCED RINGCENTRAL ENDPOINTS ====================
# Import enhanced service
from ringcentral_enhanced import rc_enhanced

# -------------------- SMS ENDPOINTS --------------------

@api_router.post("/ringcentral/sms/send")
async def send_sms(
    to: str = Body(...),
    text: str = Body(...),
    from_number: Optional[str] = Body(None)
):
    """Send SMS message"""
    try:
        result = await rc_enhanced.send_sms(to, text, from_number)
        return {"success": True, "message_id": result.get('id'), "data": result}
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/sms/messages")
async def get_sms_messages(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    direction: Optional[str] = None,
    per_page: int = 100,
    page: int = 1
):
    """Get SMS messages"""
    try:
        df = datetime.fromisoformat(date_from) if date_from else None
        dt = datetime.fromisoformat(date_to) if date_to else None
        
        result = await rc_enhanced.get_sms_messages(df, dt, direction, per_page, page)
        return result
    except Exception as e:
        logger.error(f"Error getting SMS messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/sms/messages/{message_id}")
async def get_sms_by_id(message_id: str):
    """Get specific SMS message"""
    try:
        result = await rc_enhanced.get_sms_by_id(message_id)
        return result
    except Exception as e:
        logger.error(f"Error getting SMS message: {e}")
        raise HTTPException(status_code=404, detail=str(e))

# -------------------- ACTIVE CALLS ENDPOINTS --------------------

@api_router.get("/ringcentral/active-calls")
async def get_active_calls_enhanced():
    """Get all active calls"""
    try:
        result = await rc_enhanced.get_active_calls()
        return result
    except Exception as e:
        logger.error(f"Error getting active calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/active-calls/{session_id}")
async def get_active_call_details(session_id: str):
    """Get specific active call details"""
    try:
        result = await rc_enhanced.get_active_call_details(session_id)
        return result
    except Exception as e:
        logger.error(f"Error getting call details: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@api_router.get("/ringcentral/extensions/{extension_id}/active-calls")
async def get_extension_active_calls(extension_id: str):
    """Get active calls for specific extension"""
    try:
        result = await rc_enhanced.get_extension_active_calls(extension_id)
        return {"records": result}
    except Exception as e:
        logger.error(f"Error getting extension active calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- CALL RECORDINGS ENDPOINTS --------------------

@api_router.get("/ringcentral/recordings")
async def get_call_recordings_enhanced(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    per_page: int = 100,
    page: int = 1
):
    """Get call recordings"""
    try:
        df = datetime.fromisoformat(date_from) if date_from else None
        dt = datetime.fromisoformat(date_to) if date_to else None
        
        result = await rc_enhanced.get_call_recordings(df, dt, per_page, page)
        return result
    except Exception as e:
        logger.error(f"Error getting recordings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/recordings/{recording_id}")
async def get_recording_metadata(recording_id: str):
    """Get recording metadata"""
    try:
        result = await rc_enhanced.get_recording_metadata(recording_id)
        return result
    except Exception as e:
        logger.error(f"Error getting recording metadata: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@api_router.get("/ringcentral/recordings/{recording_id}/download")
async def download_recording_enhanced(recording_id: str):
    """Download call recording"""
    try:
        audio_data = await rc_enhanced.download_recording(recording_id)
        
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=recording_{recording_id}.mp3"
            }
        )
    except Exception as e:
        logger.error(f"Error downloading recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- CONTACTS ENDPOINTS --------------------

@api_router.get("/ringcentral/contacts")
async def get_contacts_enhanced(
    contact_type: str = "Personal",
    per_page: int = 100,
    page: int = 1
):
    """Get contacts"""
    try:
        result = await rc_enhanced.get_contacts(contact_type, per_page, page)
        return result
    except Exception as e:
        logger.error(f"Error getting contacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/contacts")
async def create_contact_enhanced(
    first_name: str = Body(...),
    last_name: str = Body(...),
    email: Optional[str] = Body(None),
    phone_numbers: Optional[List[Dict]] = Body(None),
    company: Optional[str] = Body(None),
    job_title: Optional[str] = Body(None)
):
    """Create new contact"""
    try:
        result = await rc_enhanced.create_contact(
            first_name, last_name, email, phone_numbers, company, job_title
        )
        return result
    except Exception as e:
        logger.error(f"Error creating contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/ringcentral/contacts/{contact_id}")
async def update_contact_enhanced(contact_id: str, updates: Dict = Body(...)):
    """Update contact"""
    try:
        result = await rc_enhanced.update_contact(contact_id, updates)
        return result
    except Exception as e:
        logger.error(f"Error updating contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/ringcentral/contacts/{contact_id}")
async def delete_contact_enhanced(contact_id: str):
    """Delete contact"""
    try:
        await rc_enhanced.delete_contact(contact_id)
        return {"success": True, "message": "Contact deleted"}
    except Exception as e:
        logger.error(f"Error deleting contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/contacts/sync")
async def sync_contacts_enhanced(sync_token: Optional[str] = Body(None)):
    """Incremental contact sync"""
    try:
        result = await rc_enhanced.sync_contacts(sync_token)
        return result
    except Exception as e:
        logger.error(f"Error syncing contacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- ANALYTICS ENDPOINTS --------------------

@api_router.post("/ringcentral/analytics/aggregation")
async def get_analytics_aggregation(
    time_from: str = Body(...),
    time_to: str = Body(...),
    grouping: Optional[Dict] = Body(None)
):
    """Get analytics aggregated data"""
    try:
        tf = datetime.fromisoformat(time_from)
        tt = datetime.fromisoformat(time_to)
        
        result = await rc_enhanced.get_call_analytics(tf, tt, grouping)
        return result
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/analytics/timeline")
async def get_analytics_timeline_data(
    time_from: str = Body(...),
    time_to: str = Body(...),
    time_frame: str = Body("Day")
):
    """Get analytics timeline data"""
    try:
        tf = datetime.fromisoformat(time_from)
        tt = datetime.fromisoformat(time_to)
        
        result = await rc_enhanced.get_call_timeline(tf, tt, time_frame)
        return result
    except Exception as e:
        logger.error(f"Error getting timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/analytics/summary")
async def get_analytics_summary(days: int = 7):
    """Get dashboard analytics summary"""
    try:
        time_to = datetime.now()
        time_from = time_to - timedelta(days=days)
        
        result = await rc_enhanced.get_call_analytics(time_from, time_to)
        
        # Process and simplify the data
        total_calls = 0
        for record in result.get('data', []):
            total_calls += record.get('callsCount', 0)
        
        return {
            "period": f"Last {days} days",
            "total_calls": total_calls,
            "raw_data": result
        }
    except Exception as e:
        logger.error(f"Error getting analytics summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- CALL CONTROL ENDPOINTS --------------------

@api_router.post("/ringcentral/calls/{session_id}/parties/{party_id}/hold")
async def hold_call_enhanced(session_id: str, party_id: str):
    """Put call on hold"""
    try:
        result = await rc_enhanced.hold_call(session_id, party_id)
        return result
    except Exception as e:
        logger.error(f"Error holding call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/calls/{session_id}/parties/{party_id}/unhold")
async def unhold_call_enhanced(session_id: str, party_id: str):
    """Resume call from hold"""
    try:
        result = await rc_enhanced.unhold_call(session_id, party_id)
        return result
    except Exception as e:
        logger.error(f"Error unholding call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/calls/{session_id}/parties/{party_id}/transfer")
async def transfer_call_enhanced(
    session_id: str,
    party_id: str,
    target: Dict = Body(...)
):
    """Transfer call"""
    try:
        result = await rc_enhanced.transfer_call(session_id, party_id, target)
        return result
    except Exception as e:
        logger.error(f"Error transferring call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/ringcentral/calls/{session_id}/parties/{party_id}")
async def hangup_call_enhanced(session_id: str, party_id: str):
    """Hangup call"""
    try:
        await rc_enhanced.hangup_call(session_id, party_id)
        return {"success": True, "message": "Call terminated"}
    except Exception as e:
        logger.error(f"Error hanging up call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- TEAM MESSAGING ENDPOINTS --------------------

@api_router.get("/ringcentral/team-messages")
async def get_team_messages_enhanced(
    chat_id: Optional[str] = None,
    per_page: int = 100
):
    """Get team messages"""
    try:
        result = await rc_enhanced.get_team_messages(chat_id, per_page)
        return result
    except httpx.HTTPStatusError as e:
        logger.error(f"Error getting team messages: {e}")
        if e.response.status_code == 403:
            raise HTTPException(
                status_code=403, 
                detail="Team Messaging is not enabled for your RingCentral account. Please contact your administrator to enable this feature."
            )
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting team messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ringcentral/team-messages/{chat_id}")
async def send_team_message_enhanced(
    chat_id: str,
    text: str = Body(...)
):
    """Send team message"""
    try:
        result = await rc_enhanced.send_team_message(chat_id, text)
        return result
    except Exception as e:
        logger.error(f"Error sending team message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- ACCOUNT INFO ENDPOINTS --------------------

@api_router.get("/ringcentral/account")
async def get_account_info_enhanced():
    """Get account information"""
    try:
        result = await rc_enhanced.get_account_info()
        return result
    except Exception as e:
        logger.error(f"Error getting account info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/extensions")
async def get_extensions_list():
    """Get list of extensions"""
    try:
        result = await rc_enhanced.get_extensions_list()
        return {"records": result}
    except Exception as e:
        logger.error(f"Error getting extensions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ringcentral/extensions/{extension_id}")
async def get_extension_info(extension_id: str = "~"):
    """Get extension information"""
    try:
        result = await rc_enhanced.get_extension_info(extension_id)
        return result
    except Exception as e:
        logger.error(f"Error getting extension info: {e}")
        raise HTTPException(status_code=404, detail=str(e))


# ==================== GOOGLE TASKS ENDPOINTS ====================

@api_router.get("/google-tasks/connect")
async def google_tasks_connect(request: Request):
    """Initiate Google Tasks OAuth connection"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Generate state token for security
        state = secrets.token_urlsafe(32)
        
        # Store state with user_id for verification
        await db.google_tasks_oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        })
        
        # Get authorization URL
        auth_url = google_tasks_service.create_authorization_url(state)
        
        return {"authorization_url": auth_url}
        
    except Exception as e:
        logger.error(f"Error initiating Google Tasks connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/google-tasks/oauth/callback")
async def google_tasks_oauth_callback(code: str, state: str):
    """Handle Google Tasks OAuth callback"""
    try:
        # Verify state
        state_doc = await db.google_tasks_oauth_states.find_one({"state": state})
        if not state_doc:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        if state_doc["expires_at"] < datetime.utcnow():
            await db.google_tasks_oauth_states.delete_one({"_id": state_doc["_id"]})
            raise HTTPException(status_code=400, detail="State expired")
        
        user_id = state_doc["user_id"]
        
        # Exchange code for tokens
        token_data = google_tasks_service.exchange_code_for_tokens(code)
        
        # Get user's email address to identify the connection
        credentials = google_tasks_service.get_credentials_from_token(token_data)
        
        # Store connection
        connection_data = {
            "user_id": user_id,
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "token_uri": token_data["token_uri"],
            "client_id": token_data["client_id"],
            "client_secret": token_data["client_secret"],
            "scopes": token_data["scopes"],
            "connected_at": datetime.utcnow(),
            "last_synced": None
        }
        
        # Check if connection already exists
        existing = await db.google_tasks_connections.find_one({"user_id": user_id})
        
        if existing:
            # Update existing connection
            await db.google_tasks_connections.update_one(
                {"_id": existing["_id"]},
                {"$set": connection_data}
            )
        else:
            # Create new connection
            await db.google_tasks_connections.insert_one(connection_data)
        
        # Delete used state
        await db.google_tasks_oauth_states.delete_one({"_id": state_doc["_id"]})
        
        # Redirect to settings page
        redirect_base = "https://snowtrack-admin-2.preview.emergentagent.com"
        return RedirectResponse(url=f"{redirect_base}/settings?google_tasks_connected=true")
        
    except Exception as e:
        logger.error(f"Error in Google Tasks OAuth callback: {e}")
        redirect_base = "https://snowtrack-admin-2.preview.emergentagent.com"
        return RedirectResponse(url=f"{redirect_base}/settings?error=google_tasks_connection_failed")


@api_router.get("/google-tasks/status")
async def google_tasks_connection_status(request: Request):
    """Get Google Tasks connection status for current user"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            return {"connected": False}
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return {"connected": False}
        
        user_id = session["user_id"]
        
        # Get connection for this user
        connection = await db.google_tasks_connections.find_one({"user_id": user_id})
        
        if not connection:
            return {"connected": False}
        
        return {
            "connected": True,
            "connected_at": connection["connected_at"].isoformat() if isinstance(connection["connected_at"], datetime) else connection["connected_at"],
            "last_synced": connection["last_synced"].isoformat() if connection.get("last_synced") and isinstance(connection["last_synced"], datetime) else None
        }
        
    except Exception as e:
        logger.error(f"Error getting Google Tasks status: {e}")
        return {"connected": False}


@api_router.post("/google-tasks/disconnect")
async def google_tasks_disconnect(request: Request):
    """Disconnect Google Tasks account"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Delete connection
        result = await db.google_tasks_connections.delete_one({"user_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="No Google Tasks connection found")
        
        return {"success": True, "message": "Google Tasks disconnected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting Google Tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/google-tasks/lists")
async def get_google_task_lists(request: Request):
    """Get all Google Tasks lists"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get connection
        connection = await db.google_tasks_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="Google Tasks not connected")
        
        credentials = google_tasks_service.get_credentials_from_token(connection)
        task_lists = google_tasks_service.get_task_lists(credentials)
        
        return {"task_lists": task_lists}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task lists: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/google-tasks/sync")
async def sync_google_tasks(request: Request):
    """Manually sync all tasks from Google Tasks"""
    try:
        session_token = request.cookies.get("session_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get connection
        connection = await db.google_tasks_connections.find_one({"user_id": user_id})
        if not connection:
            raise HTTPException(status_code=404, detail="Google Tasks not connected")
        
        credentials = google_tasks_service.get_credentials_from_token(connection)
        all_tasks = google_tasks_service.sync_all_tasks(credentials)
        
        # Update last_synced timestamp
        await db.google_tasks_connections.update_one(
            {"user_id": user_id},
            {"$set": {"last_synced": datetime.utcnow()}}
        )
        
        # Count total tasks
        total_tasks = sum(len(data['tasks']) for data in all_tasks.values())
        
        return {
            "success": True,
            "synced": total_tasks,
            "task_lists": len(all_tasks),
            "data": all_tasks
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing Google Tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ESTIMATE, PROJECT, INVOICE & TASK ENDPOINTS
# ============================================

# ==================== ESTIMATE ENDPOINTS ====================

def generate_estimate_number():
    """Generate unique estimate number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"EST-{timestamp}"

@api_router.post("/estimates", response_model=Estimate)
async def create_estimate(estimate: EstimateCreate, background_tasks: BackgroundTasks):
    """Create a new estimate"""
    try:
        # Get customer details
        customer = await db.customers.find_one({"_id": ObjectId(estimate.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Calculate totals
        subtotal = sum(item.total for item in estimate.line_items)
        
        # Apply discount
        discount_amount = estimate.discount_amount or 0
        if estimate.discount_percentage:
            discount_amount = subtotal * (estimate.discount_percentage / 100)
        
        pre_tax_total = subtotal - discount_amount
        
        # Calculate tax (5% GST)
        tax_amount = pre_tax_total * 0.05
        total_amount = pre_tax_total + tax_amount
        
        # Calculate deposit
        deposit_amount = 0.0
        if estimate.deposit_required and estimate.deposit_percentage:
            deposit_amount = total_amount * (estimate.deposit_percentage / 100)
        
        estimate_dict = {
            "estimate_number": generate_estimate_number(),
            "customer_id": estimate.customer_id,
            "customer_name": customer.get("name"),
            "customer_email": customer.get("email"),
            "line_items": [item.dict() for item in estimate.line_items],
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "discount_percentage": estimate.discount_percentage or 0,
            "pre_tax_total": pre_tax_total,
            "tax_rate": 5.0,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "status": EstimateStatus.DRAFT,
            "expiration_date": estimate.expiration_date,
            "terms_and_conditions": estimate.terms_and_conditions,
            "payment_terms": estimate.payment_terms or 'net_30',
            "deposit_required": estimate.deposit_required or False,
            "deposit_percentage": estimate.deposit_percentage or 0.0,
            "deposit_amount": deposit_amount,
            "template_type": estimate.template_type or 'standard',
            "notes": estimate.notes,
            "attachments": estimate.attachments or [],
            "created_at": datetime.utcnow()
        }
        
        result = await db.estimates.insert_one(estimate_dict)
        estimate_dict["id"] = str(result.inserted_id)
        
        # Auto-sync to QuickBooks if enabled
        background_tasks.add_task(sync_estimate_to_quickbooks, estimate_dict)
        
        return Estimate(**estimate_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating estimate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create estimate")

@api_router.get("/estimates")
async def get_estimates(customer_id: Optional[str] = None, status: Optional[str] = None):
    """Get all estimates with optional filters"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    
    estimates = await db.estimates.find(query).sort("created_at", -1).to_list(1000)
    return [Estimate(**serialize_doc(est)) for est in estimates]

@api_router.get("/estimates/{estimate_id}", response_model=Estimate)
async def get_estimate(estimate_id: str):
    """Get specific estimate"""
    estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return Estimate(**serialize_doc(estimate))

@api_router.put("/estimates/{estimate_id}", response_model=Estimate)
async def update_estimate(estimate_id: str, estimate_update: EstimateUpdate):
    """Update estimate"""
    try:
        estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        update_data = {k: v for k, v in estimate_update.dict().items() if v is not None}
        
        # Recalculate totals if line items changed
        if update_data.get("line_items"):
            subtotal = sum(item["total"] for item in update_data["line_items"])
            discount_amount = update_data.get("discount_amount", estimate.get("discount_amount", 0))
            if update_data.get("discount_percentage"):
                discount_amount = subtotal * (update_data["discount_percentage"] / 100)
            
            pre_tax_total = subtotal - discount_amount
            tax_amount = pre_tax_total * 0.05
            total_amount = pre_tax_total + tax_amount
            
            update_data["subtotal"] = subtotal
            update_data["discount_amount"] = discount_amount
            update_data["pre_tax_total"] = pre_tax_total
            update_data["tax_amount"] = tax_amount
            update_data["total_amount"] = total_amount
        
        result = await db.estimates.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": update_data}
        )
        
        estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
        return Estimate(**serialize_doc(estimate))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating estimate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update estimate")

@api_router.post("/estimates/{estimate_id}/send")
async def send_estimate(estimate_id: str, background_tasks: BackgroundTasks):
    """Send estimate to customer"""
    try:
        estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        # Update status to sent
        await db.estimates.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": {"status": EstimateStatus.SENT, "sent_at": datetime.utcnow()}}
        )
        
        # Send email to customer (background task)
        customer_email = estimate.get("customer_email")
        if customer_email:
            background_tasks.add_task(
                send_estimate_email,
                customer_email,
                estimate.get("customer_name"),
                estimate.get("estimate_number"),
                estimate_id
            )
        
        return {"success": True, "message": "Estimate sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending estimate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send estimate")

async def send_estimate_email(email: str, name: str, estimate_number: str, estimate_id: str):
    """Background task to send estimate email"""
    try:
        # TODO: Generate PDF and attach
        subject = f"Estimate {estimate_number} from CAF Property Services"
        body = f"""
        Dear {name},
        
        Please review your estimate {estimate_number}.
        
        View and accept estimate: https://snow-gmail-sync.ngrok.io/customer-portal/estimates/{estimate_id}
        
        Thank you for your business!
        CAF Property Services
        """
        await email_service.send_email(to_email=email, subject=subject, body=body)
    except Exception as e:
        logger.error(f"Error sending estimate email: {str(e)}")

@api_router.post("/estimates/{estimate_id}/sign")
async def sign_estimate(estimate_id: str, signature: CustomerSignature):
    """Customer signs and accepts estimate"""
    try:
        estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        # Update estimate with signature and accept
        await db.estimates.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": {
                "customer_signature": signature.dict(),
                "status": EstimateStatus.ACCEPTED,
                "accepted_at": datetime.utcnow()
            }}
        )
        
        return {"success": True, "message": "Estimate accepted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error signing estimate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to sign estimate")

@api_router.post("/estimates/{estimate_id}/decline")
async def decline_estimate(estimate_id: str, reason: Optional[str] = None):
    """Customer declines estimate"""
    try:
        await db.estimates.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": {
                "status": EstimateStatus.DECLINED,
                "declined_at": datetime.utcnow(),
                "decline_reason": reason
            }}
        )
        return {"success": True, "message": "Estimate declined"}
    except Exception as e:
        logger.error(f"Error declining estimate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decline estimate")

@api_router.post("/estimates/{estimate_id}/convert-to-project", response_model=Project)
async def convert_estimate_to_project(estimate_id: str):
    """Convert accepted estimate to project"""
    try:
        estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        if estimate.get("status") != EstimateStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Only accepted estimates can be converted to projects")
        
        if estimate.get("project_id"):
            # Already converted, return existing project
            project = await db.projects.find_one({"_id": ObjectId(estimate["project_id"])})
            return Project(**serialize_doc(project))
        
        # Create project
        project_dict = {
            "project_number": f"PRJ-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "name": f"Project for {estimate.get('customer_name')}",
            "customer_id": estimate.get("customer_id"),
            "customer_name": estimate.get("customer_name"),
            "estimate_id": estimate_id,
            "description": f"Project created from estimate {estimate.get('estimate_number')}",
            "tasks": [],
            "status": ProjectStatus.PLANNING,
            "created_at": datetime.utcnow()
        }
        
        result = await db.projects.insert_one(project_dict)
        project_id = str(result.inserted_id)
        project_dict["id"] = project_id
        
        # Update estimate with project link
        await db.estimates.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": {"project_id": project_id, "status": EstimateStatus.CONVERTED}}
        )
        
        return Project(**project_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting estimate to project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to convert estimate")

# ==================== PROJECT ENDPOINTS ====================

@api_router.get("/projects")
async def get_projects(customer_id: Optional[str] = None, status: Optional[str] = None):
    """Get all projects with optional filters"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    
    projects = await db.projects.find(query).sort("created_at", -1).to_list(1000)
    
    # Enrich projects with additional data for list view
    enriched_projects = []
    for proj in projects:
        project_data = serialize_doc(proj)
        
        # Calculate completion percentage
        tasks = project_data.get("tasks", [])
        if tasks:
            completed_tasks = len([t for t in tasks if t.get("status") == "done"])
            project_data["completion_percentage"] = round((completed_tasks / len(tasks)) * 100)
        else:
            project_data["completion_percentage"] = 0
        
        # Get estimate data for total_amount
        estimate_id = project_data.get("estimate_id")
        if estimate_id:
            try:
                estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
                if estimate:
                    project_data["total_amount"] = estimate.get("total_amount", 0)
                    project_data["estimate_number"] = estimate.get("estimate_number")
            except:
                project_data["total_amount"] = 0
        else:
            project_data["total_amount"] = 0
        
        # Get customer data
        customer_id_str = project_data.get("customer_id")
        if customer_id_str:
            try:
                customer = await db.customers.find_one({"_id": ObjectId(customer_id_str)})
                if customer:
                    project_data["customer_email"] = customer.get("email")
                    project_data["customer_phone"] = customer.get("phone")
                    project_data["site_address"] = customer.get("address")
            except:
                pass
        
        enriched_projects.append(project_data)
    
    return {"projects": enriched_projects}

@api_router.post("/projects", response_model=Project)
async def create_project(project_create: ProjectCreate):
    """Create a new project"""
    try:
        # Get customer details
        customer = await db.customers.find_one({"_id": ObjectId(project_create.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get estimate details
        estimate = await db.estimates.find_one({"_id": ObjectId(project_create.estimate_id)})
        if not estimate:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        # Check if estimate is already converted
        if estimate.get("project_id"):
            raise HTTPException(status_code=400, detail="This estimate is already linked to a project")
        
        # Create project
        project_dict = {
            "project_number": f"PRJ-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "name": project_create.name,
            "customer_id": project_create.customer_id,
            "customer_name": customer.get("name"),
            "estimate_id": project_create.estimate_id,
            "description": project_create.description,
            "tasks": [],
            "status": ProjectStatus.PLANNING,
            "start_date": project_create.start_date,
            "created_at": datetime.utcnow()
        }
        
        result = await db.projects.insert_one(project_dict)
        project_id = str(result.inserted_id)
        project_dict["id"] = project_id
        
        # Update estimate with project link
        await db.estimates.update_one(
            {"_id": ObjectId(project_create.estimate_id)},
            {"$set": {"project_id": project_id, "status": EstimateStatus.CONVERTED}}
        )
        
        return Project(**project_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create project")

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get specific project with enriched data"""
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception as e:
        logger.error(f"Invalid project ID: {project_id} - {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = serialize_doc(project)
    
    # Get customer details
    customer_id = project_data.get("customer_id")
    if customer_id:
        try:
            customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
            if customer:
                project_data["customer_email"] = customer.get("email")
                project_data["customer_phone"] = customer.get("phone")
                project_data["customer_address"] = customer.get("address")
        except:
            pass
    
    # Get estimate details
    estimate_id = project_data.get("estimate_id")
    if estimate_id:
        try:
            estimate = await db.estimates.find_one({"_id": ObjectId(estimate_id)})
            if estimate:
                project_data["estimate_number"] = estimate.get("estimate_number")
        except:
            pass
    
    return project_data

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: ProjectUpdate):
    """Update project"""
    try:
        update_data = {k: v for k, v in project_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        result = await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        return Project(**serialize_doc(project))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update project")

# ==================== PROJECT TASK ENDPOINTS ====================

@api_router.get("/tasks")
async def get_tasks(
    customer_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    limit: int = 100
):
    """Get tasks with optional filters"""
    try:
        query = {}
        
        # Build query based on filters
        if customer_id:
            query["customer_id"] = customer_id
        if project_id:
            query["_id"] = ObjectId(project_id)
        
        # Get projects matching query
        projects = await db.projects.find(query).limit(limit).to_list(length=limit)
        
        # Extract tasks from projects
        all_tasks = []
        for project in projects:
            tasks = project.get("tasks", [])
            for task in tasks:
                # Apply task-level filters
                if status and task.get("status") != status:
                    continue
                if assignee_id and task.get("assignee_id") != assignee_id:
                    continue
                
                # Add project info to task
                task_with_project = {
                    **task,
                    "project_id": str(project["_id"]),
                    "project_name": project.get("name"),
                    "customer_id": project.get("customer_id"),
                }
                all_tasks.append(task_with_project)
        
        return all_tasks
        
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/projects/{project_id}/tasks", response_model=ProjectTask)
async def create_task(project_id: str, task: ProjectTaskCreate):
    """Create a new task in project"""
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        task_dict = task.dict()
        task_dict["id"] = str(ObjectId())
        task_dict["status"] = TaskStatus.TODO
        task_dict["created_at"] = datetime.utcnow()
        
        # Get assignee name if provided
        if task.assignee_id:
            assignee = await db.users.find_one({"_id": ObjectId(task.assignee_id)})
            if assignee:
                task_dict["assignee_name"] = assignee.get("name")
        
        # Add task to project
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$push": {"tasks": task_dict}}
        )
        
        # Sync with Google Tasks if connected
        try:
            # Get user from project (assuming project has a user_id or we use session)
            connection = await db.google_tasks_connections.find_one({"user_id": project.get("user_id", project.get("created_by"))})
            
            if connection:
                credentials = google_tasks_service.get_credentials_from_token(connection)
                
                # Get or create project task list
                google_tasks_list_id = project.get("google_tasks_project_list_id")
                
                if not google_tasks_list_id:
                    # Create new task list for this project
                    task_list = google_tasks_service.create_task_list(
                        credentials,
                        f"Project: {project.get('name', 'Untitled')}"
                    )
                    google_tasks_list_id = task_list['id']
                    
                    # Update project with task list ID
                    await db.projects.update_one(
                        {"_id": ObjectId(project_id)},
                        {"$set": {"google_tasks_project_list_id": google_tasks_list_id}}
                    )
                
                # Create task in Google Tasks
                google_task = google_tasks_service.create_task(
                    credentials,
                    google_tasks_list_id,
                    task_dict["title"],
                    notes=task_dict.get("description"),
                    due=task_dict.get("due_date").isoformat() if task_dict.get("due_date") else None
                )
                
                # Update local task with Google Tasks ID
                task_dict["google_tasks_id"] = google_task['id']
                task_dict["google_tasks_list_id"] = google_tasks_list_id
                
                # Update in database
                tasks = project.get("tasks", [])
                tasks.append(task_dict)
                await db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {"tasks": tasks}}
                )
        except Exception as e:
            logger.warning(f"Failed to sync task with Google Tasks: {str(e)}")
            # Continue without Google Tasks sync
        
        return ProjectTask(**task_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create task")

@api_router.put("/projects/{project_id}/tasks/{task_id}", response_model=ProjectTask)
async def update_task(project_id: str, task_id: str, task_update: ProjectTaskUpdate):
    """Update a task"""
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Find task in project
        tasks = project.get("tasks", [])
        task_index = next((i for i, t in enumerate(tasks) if t.get("id") == task_id), None)
        
        if task_index is None:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update task
        update_data = {k: v for k, v in task_update.dict().items() if v is not None}
        
        # If status changed to done, set completed_at
        if update_data.get("status") == TaskStatus.DONE:
            update_data["completed_at"] = datetime.utcnow()
        
        # Update assignee name if assignee changed
        if update_data.get("assignee_id"):
            assignee = await db.users.find_one({"_id": ObjectId(update_data["assignee_id"])})
            if assignee:
                update_data["assignee_name"] = assignee.get("name")
        
        # Apply updates to task
        for key, value in update_data.items():
            tasks[task_index][key] = value
        
        # Update project
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"tasks": tasks}}
        )
        
        # Sync with Google Tasks if connected and task has google_tasks_id
        try:
            google_tasks_id = tasks[task_index].get("google_tasks_id")
            google_tasks_list_id = tasks[task_index].get("google_tasks_list_id")
            
            if google_tasks_id and google_tasks_list_id:
                connection = await db.google_tasks_connections.find_one({"user_id": project.get("user_id", project.get("created_by"))})
                
                if connection:
                    credentials = google_tasks_service.get_credentials_from_token(connection)
                    
                    # Map local status to Google Tasks status
                    google_status = 'completed' if update_data.get("status") == TaskStatus.DONE else 'needsAction'
                    
                    # Update task in Google Tasks
                    google_tasks_service.update_task(
                        credentials,
                        google_tasks_list_id,
                        google_tasks_id,
                        title=update_data.get("title"),
                        notes=update_data.get("description"),
                        status=google_status if "status" in update_data else None,
                        due=update_data.get("due_date").isoformat() if update_data.get("due_date") else None
                    )
        except Exception as e:
            logger.warning(f"Failed to sync task update with Google Tasks: {str(e)}")
            # Continue without Google Tasks sync
        
        return ProjectTask(**tasks[task_index])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update task")

@api_router.delete("/projects/{project_id}/tasks/{task_id}")
async def delete_task(project_id: str, task_id: str):
    """Delete a task"""
    try:
        # Get project first to access task data
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Find the task to get Google Tasks info before deleting
        tasks = project.get("tasks", [])
        task_to_delete = next((t for t in tasks if t.get("id") == task_id), None)
        
        # Delete from local database
        result = await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$pull": {"tasks": {"id": task_id}}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Delete from Google Tasks if connected and task has google_tasks_id
        if task_to_delete:
            try:
                google_tasks_id = task_to_delete.get("google_tasks_id")
                google_tasks_list_id = task_to_delete.get("google_tasks_list_id")
                
                if google_tasks_id and google_tasks_list_id:
                    connection = await db.google_tasks_connections.find_one({"user_id": project.get("user_id", project.get("created_by"))})
                    
                    if connection:
                        credentials = google_tasks_service.get_credentials_from_token(connection)
                        google_tasks_service.delete_task(credentials, google_tasks_list_id, google_tasks_id)
            except Exception as e:
                logger.warning(f"Failed to delete task from Google Tasks: {str(e)}")
                # Continue even if Google Tasks delete fails
        
        return {"success": True, "message": "Task deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete task")

# ==================== ENHANCED INVOICE ENDPOINTS ====================

def generate_invoice_number():
    """Generate unique invoice number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"INV-{timestamp}"

def calculate_due_date(payment_terms: PaymentTerms) -> datetime:
    """Calculate due date based on payment terms"""
    now = datetime.utcnow()
    if payment_terms == PaymentTerms.NET_15:
        return now + timedelta(days=15)
    elif payment_terms == PaymentTerms.NET_30:
        return now + timedelta(days=30)
    else:  # DUE_ON_RECEIPT
        return now

@api_router.post("/invoices", response_model=EnhancedInvoice)
async def create_invoice(invoice: EnhancedInvoiceCreate, background_tasks: BackgroundTasks):
    """Create a new invoice"""
    try:
        # Get customer details
        customer = await db.customers.find_one({"_id": ObjectId(invoice.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Calculate totals
        subtotal = sum(item.total for item in invoice.line_items)
        discount_amount = invoice.discount_amount or 0
        pre_tax_total = subtotal - discount_amount
        tax_amount = pre_tax_total * 0.05  # 5% GST
        total_amount = pre_tax_total + tax_amount
        
        # Calculate deposit if required
        deposit_amount = invoice.deposit_amount or 0
        if invoice.deposit_percentage:
            deposit_amount = total_amount * (invoice.deposit_percentage / 100)
        
        invoice_dict = {
            "invoice_number": generate_invoice_number(),
            "customer_id": invoice.customer_id,
            "customer_name": customer.get("name"),
            "project_id": invoice.project_id,
            "estimate_id": invoice.estimate_id,
            "line_items": [item.dict() for item in invoice.line_items],
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "pre_tax_total": pre_tax_total,
            "tax_rate": 5.0,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "payment_terms": invoice.payment_terms,
            "custom_payment_terms": invoice.custom_payment_terms,
            "early_payment_discount": 3.0,  # 3% for NET_15
            "deposit_required": invoice.deposit_required or False,
            "deposit_amount": deposit_amount,
            "deposit_percentage": invoice.deposit_percentage,
            "deposit_paid": False,
            "payments": [],
            "amount_paid": 0.0,
            "amount_due": total_amount,
            "late_fee_enabled": invoice.late_fee_enabled or False,
            "late_fee_percentage": invoice.late_fee_percentage or 0.0,
            "late_fee_amount": 0.0,
            "status": PaymentStatus.UNPAID,
            "issue_date": datetime.utcnow(),
            "due_date": calculate_due_date(invoice.payment_terms),
            "notes": invoice.notes,
            "created_at": datetime.utcnow()
        }
        
        result = await db.invoices.insert_one(invoice_dict)
        invoice_dict["id"] = str(result.inserted_id)
        
        # Auto-sync to QuickBooks if enabled
        background_tasks.add_task(sync_invoice_to_quickbooks, invoice_dict)
        
        return EnhancedInvoice(**invoice_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create invoice")

@api_router.get("/invoices")
async def get_invoices(
    customer_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all invoices with optional filters"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query).sort("created_at", -1).to_list(1000)
    return [EnhancedInvoice(**serialize_doc(inv)) for inv in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=EnhancedInvoice)
async def get_invoice(invoice_id: str):
    """Get specific invoice"""
    invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return EnhancedInvoice(**serialize_doc(invoice))

@api_router.post("/invoices/{invoice_id}/payments", response_model=EnhancedInvoice)
async def add_payment(invoice_id: str, payment: InvoicePaymentCreate):
    """Add a payment to invoice (mock for now, will integrate Helcim later)"""
    try:
        invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        payment_dict = payment.dict()
        payment_dict["id"] = str(ObjectId())
        payment_dict["payment_date"] = datetime.utcnow()
        
        # Update amounts
        new_amount_paid = invoice.get("amount_paid", 0) + payment.amount
        amount_due = invoice.get("total_amount") - new_amount_paid
        
        # Determine new status
        new_status = PaymentStatus.UNPAID
        if new_amount_paid >= invoice.get("total_amount"):
            new_status = PaymentStatus.PAID
        elif new_amount_paid > 0:
            new_status = PaymentStatus.PARTIALLY_PAID
        
        # Check if this is a deposit payment
        updates = {
            "$push": {"payments": payment_dict},
            "$set": {
                "amount_paid": new_amount_paid,
                "amount_due": amount_due,
                "status": new_status
            }
        }
        
        if invoice.get("deposit_required") and not invoice.get("deposit_paid"):
            if payment.amount >= invoice.get("deposit_amount", 0):
                updates["$set"]["deposit_paid"] = True
                updates["$set"]["deposit_paid_date"] = datetime.utcnow()
        
        if new_status == PaymentStatus.PAID:
            updates["$set"]["paid_date"] = datetime.utcnow()
        
        await db.invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            updates
        )
        
        invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
        return EnhancedInvoice(**serialize_doc(invoice))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding payment: {str(e)}")

# ==================== CONTRACT/AGREEMENT ENDPOINTS ====================

def generate_contract_number():
    """Generate unique contract number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"CTR-{timestamp}"

# Contract Template Endpoints
@api_router.post("/contract-templates", response_model=ContractTemplate)
async def create_contract_template(template: ContractTemplateCreate):
    """Create a new contract template"""
    try:
        template_dict = {
            **template.dict(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.contract_templates.insert_one(template_dict)
        template_dict["id"] = str(result.inserted_id)
        
        return ContractTemplate(**template_dict)
    except Exception as e:
        logger.error(f"Error creating contract template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create contract template")

@api_router.get("/contract-templates")
async def get_contract_templates(
    contract_type: Optional[str] = None,
    active_only: bool = True
):
    """Get all contract templates with optional filters"""
    query = {}
    if contract_type:
        query["contract_type"] = contract_type
    if active_only:
        query["active"] = True
    
    templates = await db.contract_templates.find(query).sort("created_at", -1).to_list(1000)
    return [ContractTemplate(**serialize_doc(tmpl)) for tmpl in templates]

@api_router.get("/contract-templates/{template_id}", response_model=ContractTemplate)
async def get_contract_template(template_id: str):
    """Get specific contract template"""
    template = await db.contract_templates.find_one({"_id": ObjectId(template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Contract template not found")
    return ContractTemplate(**serialize_doc(template))

@api_router.put("/contract-templates/{template_id}", response_model=ContractTemplate)
async def update_contract_template(template_id: str, template_update: ContractTemplateUpdate):
    """Update contract template"""
    try:
        template = await db.contract_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(status_code=404, detail="Contract template not found")
        
        update_data = {k: v for k, v in template_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.contract_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": update_data}
        )
        
        template = await db.contract_templates.find_one({"_id": ObjectId(template_id)})
        return ContractTemplate(**serialize_doc(template))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contract template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update contract template")

@api_router.delete("/contract-templates/{template_id}")
async def delete_contract_template(template_id: str):
    """Delete (deactivate) contract template"""
    try:
        result = await db.contract_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": {"active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Contract template not found")
        
        return {"success": True, "message": "Contract template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contract template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete contract template")

# Contract Endpoints
@api_router.post("/contracts", response_model=Contract)
async def create_contract(contract: ContractCreate):
    """Create a new contract/agreement"""
    try:
        # Get customer details
        customer = await db.customers.find_one({"_id": ObjectId(contract.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get template if provided
        content = ""
        if contract.template_id:
            template = await db.contract_templates.find_one({"_id": ObjectId(contract.template_id)})
            if template:
                # Replace placeholders in template content
                content = template.get("content", "")
                content = content.replace("{{customer_name}}", customer.get("name", "") or "")
                content = content.replace("{{customer_email}}", customer.get("email", "") or "")
                content = content.replace("{{customer_phone}}", customer.get("phone", "") or "")
                content = content.replace("{{company_name}}", customer.get("company_name", "") or "")
                content = content.replace("{{service_description}}", contract.service_description or "")
                content = content.replace("{{contract_value}}", str(contract.contract_value or 0))
        
        # If estimate is linked, get estimate details
        if contract.estimate_id:
            estimate = await db.estimates.find_one({"_id": ObjectId(contract.estimate_id)})
            if estimate:
                if not content:
                    # Generate basic content from estimate
                    content = f"<h2>Service Agreement</h2><p><strong>Customer:</strong> {customer.get('name')}</p>"
                    content += f"<p><strong>Total Value:</strong> ${estimate.get('total_amount', 0)}</p>"
                    content += f"<p><strong>Services:</strong></p><ul>"
                    for item in estimate.get("line_items", []):
                        content += f"<li>{item.get('description')}: ${item.get('total')}</li>"
                    content += "</ul>"
                
                # Auto-fill contract value from estimate if not provided
                if contract.contract_value == 0:
                    contract.contract_value = estimate.get("total_amount", 0)
        
        contract_dict = {
            "contract_number": generate_contract_number(),
            "template_id": contract.template_id,
            "customer_id": contract.customer_id,
            "customer_name": customer.get("name"),
            "customer_email": customer.get("email"),
            "customer_phone": customer.get("phone"),
            "estimate_id": contract.estimate_id,
            "project_id": contract.project_id if hasattr(contract, 'project_id') else None,
            "contract_type": contract.contract_type,
            "title": contract.title,
            "content": content,
            "service_description": contract.service_description,
            "service_start_date": contract.service_start_date,
            "service_end_date": contract.service_end_date,
            "contract_value": contract.contract_value,
            "payment_terms": contract.payment_terms or 'net_30',
            "terms_and_conditions": contract.terms_and_conditions,
            "status": ContractStatus.DRAFT,
            "notes": contract.notes,
            "attachments": contract.attachments or [],
            "auto_renew": contract.auto_renew or False,
            "renewal_terms": contract.renewal_terms,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.contracts.insert_one(contract_dict)
        contract_dict["id"] = str(result.inserted_id)
        
        return Contract(**contract_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create contract")

@api_router.get("/contracts")
async def get_contracts(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    contract_type: Optional[str] = None
):
    """Get all contracts with optional filters"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    if contract_type:
        query["contract_type"] = contract_type
    
    contracts = await db.contracts.find(query).sort("created_at", -1).to_list(1000)
    return {"contracts": [Contract(**serialize_doc(contract)) for contract in contracts]}

@api_router.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract(contract_id: str):
    """Get specific contract"""
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return Contract(**serialize_doc(contract))

@api_router.put("/contracts/{contract_id}", response_model=Contract)
async def update_contract(contract_id: str, contract_update: ContractUpdate):
    """Update contract"""
    try:
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        update_data = {k: v for k, v in contract_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Convert signature dicts if present
        if update_data.get("customer_signature"):
            update_data["customer_signature"] = update_data["customer_signature"].dict() if hasattr(update_data["customer_signature"], "dict") else update_data["customer_signature"]
        if update_data.get("company_signature"):
            update_data["company_signature"] = update_data["company_signature"].dict() if hasattr(update_data["company_signature"], "dict") else update_data["company_signature"]
        
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": update_data}
        )
        
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        return Contract(**serialize_doc(contract))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update contract")

@api_router.post("/contracts/{contract_id}/send")
async def send_contract(contract_id: str, background_tasks: BackgroundTasks):
    """Send contract to customer for review"""
    try:
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Update status to sent
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"status": ContractStatus.SENT, "sent_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )
        
        # Send email to customer (background task)
        customer_email = contract.get("customer_email")
        if customer_email:
            background_tasks.add_task(
                send_contract_email,
                customer_email,
                contract.get("customer_name"),
                contract.get("contract_number"),
                contract_id
            )
        
        return {"success": True, "message": "Contract sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send contract")

async def send_contract_email(email: str, name: str, contract_number: str, contract_id: str):
    """Background task to send contract email"""
    try:
        subject = f"Service Agreement {contract_number} from CAF Property Services"
        body = f"""
        Dear {name},
        
        Please review and sign your service agreement {contract_number}.
        
        View and sign agreement: https://snow-gmail-sync.ngrok.io/customer-portal/contracts/{contract_id}
        
        Thank you for your business!
        CAF Property Services
        """
        await email_service.send_email(to_email=email, subject=subject, body=body)
    except Exception as e:
        logger.error(f"Error sending contract email: {str(e)}")

@api_router.post("/contracts/{contract_id}/sign")
async def sign_contract(contract_id: str, signature: CustomerSignature):
    """Customer signs contract"""
    try:
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Update contract with customer signature and mark as signed
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {
                "customer_signature": signature.dict(),
                "status": ContractStatus.SIGNED,
                "signed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"success": True, "message": "Contract signed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error signing contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to sign contract")

@api_router.post("/contracts/{contract_id}/activate")
async def activate_contract(contract_id: str):
    """Activate signed contract"""
    try:
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        if contract.get("status") != ContractStatus.SIGNED:
            raise HTTPException(status_code=400, detail="Contract must be signed before activation")
        
        # Update contract status to active
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {
                "status": ContractStatus.ACTIVE,
                "activated_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"success": True, "message": "Contract activated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to activate contract")

@api_router.post("/contracts/{contract_id}/terminate")
async def terminate_contract(contract_id: str, request: Request):
    """Terminate active contract"""
    try:
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        update_data = {
            "status": ContractStatus.TERMINATED,
            "terminated_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Get request body if present
        try:
            termination_data = await request.json()
        except:
            termination_data = {}
        
        if termination_data:
            if "termination_reason" in termination_data:
                update_data["termination_reason"] = termination_data["termination_reason"]
            if "termination_notes" in termination_data:
                update_data["termination_notes"] = termination_data["termination_notes"]
        
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": update_data}
        )
        
        return {"success": True, "message": "Contract terminated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error terminating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to terminate contract")

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str):
    """Delete contract (only drafts can be deleted)"""
    try:
        contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        if contract.get("status") != ContractStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Only draft contracts can be deleted")
        
        await db.contracts.delete_one({"_id": ObjectId(contract_id)})
        
        return {"success": True, "message": "Contract deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete contract")


        raise HTTPException(status_code=500, detail="Failed to add payment")

logger.info("Estimate, Project, Invoice, and Contract endpoints registered successfully")


# ============================================================================
# MESSAGING SYSTEM ENDPOINTS
# ============================================================================

# Collection names
messages_collection = db["messages"]
conversations_collection = db["conversations"]
read_receipts_collection = db["message_read_receipts"]
conversation_participants_collection = db["conversation_participants"]

# Helper function to get user ID from current_user dict
def get_user_id_from_auth(current_user: dict) -> str:
    """Extract user ID from authentication dict"""
    user_id = current_user.get("id") or current_user.get("user_id") or current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in session")
    return str(user_id)

# Helper function to get user info
async def get_user_info(user_id: str) -> dict:
    """Get user information from various collections"""
    user = await db.users.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
    if not user:
        user = await db.customers.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
    
    if user:
        return {
            "id": str(user["_id"]),
            "name": user.get("name", user.get("full_name", "Unknown")),
            "email": user.get("email"),
            "role": user.get("role", "customer")
        }
    return None

@api_router.post("/messages/conversations", tags=["Messaging"])
async def create_conversation(
    conversation: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation/thread"""
    try:
        user_id = get_user_id_from_auth(current_user)
        conversation_data = {
            **conversation.dict(exclude_unset=True),
            "created_by": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_archived": False
        }
        
        result = await conversations_collection.insert_one(conversation_data)
        conversation_id = str(result.inserted_id)
        
        # Add participants
        for participant_id in conversation.participant_ids:
            user_info = await get_user_info(participant_id)
            if user_info:
                participant_data = {
                    "conversation_id": conversation_id,
                    "user_id": participant_id,
                    "user_name": user_info["name"],
                    "user_role": "admin" if user_info["role"] != "customer" else "guest",
                    "joined_at": datetime.utcnow(),
                    "is_muted": False,
                    "is_archived": False
                }
                await conversation_participants_collection.insert_one(participant_data)
        
        return {"conversation_id": conversation_id, "message": "Conversation created successfully"}
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/conversations", tags=["Messaging"])
async def get_conversations(
    current_user: dict = Depends(get_current_user),
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0
):
    """Get all conversations for current user"""
    try:
        user_id = get_user_id_from_auth(current_user)
        
        # Find all conversations where user is a participant
        query = {"user_id": user_id}
        if not include_archived:
            query["is_archived"] = False
            
        participant_records = await conversation_participants_collection.find(query).to_list(None)
        conversation_ids = [p["conversation_id"] for p in participant_records]
        
        if not conversation_ids:
            return {"conversations": [], "total": 0}
        
        # Get conversation details
        conversations = await conversations_collection.find(
            {"_id": {"$in": [ObjectId(cid) for cid in conversation_ids if ObjectId.is_valid(cid)]}}
        ).sort("updated_at", -1).skip(offset).limit(limit).to_list(None)
        
        # Enrich with unread count and participant info
        enriched_conversations = []
        for conv in conversations:
            conv_id = str(conv["_id"])
            
            # Get unread count
            participant = next((p for p in participant_records if p["conversation_id"] == conv_id), None)
            last_read_at = participant.get("last_read_at") if participant else None
            
            unread_query = {"conversation_id": conv_id}
            if last_read_at:
                unread_query["created_at"] = {"$gt": last_read_at}
            unread_count = await messages_collection.count_documents(unread_query)
            
            # Get participants
            participants = await conversation_participants_collection.find({"conversation_id": conv_id}).to_list(None)
            
            enriched_conversations.append({
                **conv,
                "_id": conv_id,
                "unread_count": unread_count,
                "participants": [{"user_id": p["user_id"], "user_name": p["user_name"], "user_role": p.get("user_role", "member")} for p in participants]
            })
        
        return {
            "conversations": enriched_conversations,
            "total": len(conversation_ids)
        }
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/conversations/{conversation_id}", tags=["Messaging"])
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation details"""
    try:
        if not ObjectId.is_valid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation ID")
        
        conversation = await conversations_collection.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get participants
        participants = await conversation_participants_collection.find({"conversation_id": conversation_id}).to_list(None)
        
        return {
            **conversation,
            "_id": str(conversation["_id"]),
            "participants": [{"user_id": p["user_id"], "user_name": p["user_name"]} for p in participants]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages", tags=["Messaging"])
async def send_message(
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a new message"""
    try:
        user_id = get_user_id_from_auth(current_user)
        user_info = await get_user_info(user_id)
        
        message_data = {
            **message.dict(exclude_unset=True),
            "sender_id": user_id,
            "sender_name": user_info["name"] if user_info else "Unknown",
            "sender_role": user_info["role"] if user_info else "unknown",
            "created_at": datetime.utcnow(),
            "is_edited": False,
            "is_deleted": False
        }
        
        result = await messages_collection.insert_one(message_data)
        message_id = str(result.inserted_id)
        
        # Update conversation's last message
        await conversations_collection.update_one(
            {"_id": ObjectId(message.conversation_id) if ObjectId.is_valid(message.conversation_id) else None},
            {
                "$set": {
                    "last_message": message.content[:100],
                    "last_message_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message_id": message_id, "message": "Message sent successfully"}
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/conversations/{conversation_id}/messages", tags=["Messaging"])
async def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
    before: Optional[str] = None  # Message ID for pagination
):
    """Get messages in a conversation"""
    try:
        query = {"conversation_id": conversation_id, "is_deleted": False}
        
        if before and ObjectId.is_valid(before):
            before_message = await messages_collection.find_one({"_id": ObjectId(before)})
            if before_message:
                query["created_at"] = {"$lt": before_message["created_at"]}
        
        messages = await messages_collection.find(query).sort("created_at", -1).limit(limit).to_list(None)
        messages.reverse()  # Return in chronological order
        
        # Convert ObjectId to string
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        
        # Update last_read_at for current user
        await conversation_participants_collection.update_one(
            {"conversation_id": conversation_id, "user_id": current_user["user_id"]},
            {"$set": {"last_read_at": datetime.utcnow()}}
        )
        
        return {"messages": messages, "count": len(messages)}
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/messages/{message_id}", tags=["Messaging"])
async def update_message(
    message_id: str,
    update: MessageUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a message (edit or delete)"""
    try:
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=400, detail="Invalid message ID")
        
        message = await messages_collection.find_one({"_id": ObjectId(message_id)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Check if user is the sender
        if message["sender_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only edit your own messages")
        
        update_data = update.dict(exclude_unset=True)
        if "content" in update_data:
            update_data["is_edited"] = True
            update_data["updated_at"] = datetime.utcnow()
        
        await messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": update_data}
        )
        
        return {"message": "Message updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages/{message_id}/read", tags=["Messaging"])
async def mark_message_read(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a message as read"""
    try:
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=400, detail="Invalid message ID")
        
        message = await messages_collection.find_one({"_id": ObjectId(message_id)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Check if already read
        existing = await read_receipts_collection.find_one({
            "message_id": message_id,
            "user_id": current_user["user_id"]
        })
        
        if not existing:
            read_receipt_data = {
                "message_id": message_id,
                "conversation_id": message["conversation_id"],
                "user_id": current_user["user_id"],
                "read_at": datetime.utcnow()
            }
            await read_receipts_collection.insert_one(read_receipt_data)
        
        return {"message": "Message marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking message as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/search", tags=["Messaging"])
async def search_messages(
    query: str,
    conversation_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    limit: int = 50
):
    """Search messages"""
    try:
        search_query = {
            "is_deleted": False,
            "$or": [
                {"content": {"$regex": query, "$options": "i"}},
                {"sender_name": {"$regex": query, "$options": "i"}}
            ]
        }
        
        if conversation_id:
            search_query["conversation_id"] = conversation_id
        
        messages = await messages_collection.find(search_query).sort("created_at", -1).limit(limit).to_list(None)
        
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        
        return {"messages": messages, "count": len(messages)}
    except Exception as e:
        logger.error(f"Error searching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/messages/conversations/{conversation_id}/archive", tags=["Messaging"])
async def archive_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Archive a conversation for current user"""
    try:
        await conversation_participants_collection.update_one(
            {"conversation_id": conversation_id, "user_id": current_user["user_id"]},
            {"$set": {"is_archived": True}}
        )
        return {"message": "Conversation archived successfully"}
    except Exception as e:
        logger.error(f"Error archiving conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages/conversations/{conversation_id}/participants", tags=["Messaging"])
async def add_participant(
    conversation_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Add a participant to a conversation"""
    try:
        # Check if already a participant
        existing = await conversation_participants_collection.find_one({
            "conversation_id": conversation_id,
            "user_id": user_id
        })
        
        if existing:
            return {"message": "User is already a participant"}
        
        user_info = await get_user_info(user_id)
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        participant_data = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "user_name": user_info["name"],
            "user_role": "admin" if user_info["role"] != "customer" else "guest",
            "joined_at": datetime.utcnow(),
            "is_muted": False,
            "is_archived": False
        }
        await conversation_participants_collection.insert_one(participant_data)
        
        # Update conversation participant_ids
        await conversations_collection.update_one(
            {"_id": ObjectId(conversation_id) if ObjectId.is_valid(conversation_id) else None},
            {"$addToSet": {"participant_ids": user_id}}
        )
        
        return {"message": "Participant added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding participant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("Messaging system endpoints registered successfully")


# ==================== AUTOMATION ENGINE ENDPOINTS ====================

# Initialize automation engine
automation_engine = AutomationEngine(db)
background_scheduler = BackgroundScheduler(db, automation_engine)

@api_router.post("/automation/trigger/{workflow_name}", tags=["Automation"])
async def trigger_workflow(workflow_name: str, context: Dict):
    """
    Trigger an automation workflow
    
    Available workflows:
    - service_completion: Handles service completion automation
    - customer_communication: Handles customer notifications
    - equipment_maintenance: Handles equipment inspections and maintenance
    - weather_operations: Handles weather-based operations
    - safety_compliance: Handles safety reminders and compliance
    - inventory_management: Handles inventory tracking and reordering
    
    Example context for service_completion:
    ```json
    {
        "dispatch_id": "68e8929ff0f6291c7d863496",
        "crew_id": "68e8929ff0f6291c7d863497"
    }
    ```
    """
    result = await automation_engine.trigger_workflow(workflow_name, context)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error', 'Workflow execution failed'))
    return result

@api_router.get("/automation/workflows", tags=["Automation"])
async def list_workflows():
    """List all available automation workflows"""
    workflows = {
        'service_completion': {
            'name': 'Service Completion Automation',
            'description': 'Handles all automation when a service dispatch is completed',
            'required_context': ['dispatch_id', 'crew_id'],
            'steps': [
                'Request after photos',
                'Generate service report PDF',
                'Send customer notification',
                'Auto-deduct consumables',
                'Update equipment hours',
                'Create invoice'
            ]
        },
        'customer_communication': {
            'name': 'Customer Communication Automation',
            'description': 'Handles automated customer notifications at various stages',
            'required_context': ['trigger_type', 'customer_id', 'related_id'],
            'trigger_types': [
                'estimate_created',
                'project_started',
                'crew_enroute',
                'service_completed',
                'invoice_sent',
                'invoice_overdue'
            ]
        },
        'equipment_maintenance': {
            'name': 'Equipment Maintenance Automation',
            'description': 'Handles automated equipment inspection and maintenance scheduling',
            'required_context': [],
            'steps': [
                'Check all equipment for inspection due',
                'Send reminders to crew',
                'Auto-schedule maintenance if overdue',
                'Track maintenance history'
            ]
        },
        'weather_operations': {
            'name': 'Weather-Based Operations',
            'description': 'Handles automated operations based on weather forecasts',
            'required_context': ['forecast'],
            'steps': [
                'Alert crews on snow forecasts',
                'Create priority dispatches',
                'Adjust routes based on conditions'
            ]
        },
        'safety_compliance': {
            'name': 'Safety & Compliance Automation',
            'description': 'Handles automated safety reminders and compliance tracking',
            'required_context': [],
            'steps': [
                'Send daily safety check reminders',
                'Track PPE verification',
                'Flag training expiries'
            ]
        },
        'inventory_management': {
            'name': 'Inventory & Consumables Automation',
            'description': 'Handles automated inventory tracking and reordering',
            'required_context': [],
            'steps': [
                'Check for low stock items',
                'Auto-generate purchase orders',
                'Send low stock alerts'
            ]
        }
    }
    return workflows

@api_router.get("/automation/status", tags=["Automation"])
async def automation_status():
    """Get status of automation system"""
    return {
        'status': 'active',
        'workflows_registered': len(automation_engine.workflows),
        'workflows': list(automation_engine.workflows.keys())
    }

logger.info("Automation engine endpoints registered successfully")


# ==================== CUSTOM WORKFLOW MANAGEMENT ENDPOINTS ====================

from custom_workflow_models import (
    CustomWorkflow, CustomWorkflowCreate, CustomWorkflowUpdate,
    WorkflowAction, WorkflowTrigger, TriggerType, ActionType
)
from custom_workflow_executor import CustomWorkflowExecutor

# Initialize custom workflow executor
custom_workflow_executor = CustomWorkflowExecutor(db)

@api_router.get("/custom-workflows", tags=["Custom Workflows"])
async def list_custom_workflows(
    enabled_only: bool = False,
    tag: Optional[str] = None,
    limit: int = 100
):
    """List all custom workflows"""
    query = {}
    if enabled_only:
        query['enabled'] = True
    if tag:
        query['tags'] = tag
    
    workflows = await db.custom_workflows.find(query).limit(limit).to_list(length=limit)
    
    # Convert ObjectId to string
    for workflow in workflows:
        workflow['id'] = str(workflow['_id'])
        del workflow['_id']
    
    return workflows

@api_router.get("/custom-workflows/{workflow_id}", tags=["Custom Workflows"])
async def get_custom_workflow(workflow_id: str):
    """Get a specific custom workflow"""
    workflow = await db.custom_workflows.find_one({'_id': ObjectId(workflow_id)})
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow['id'] = str(workflow['_id'])
    del workflow['_id']
    
    return workflow

@api_router.post("/custom-workflows", tags=["Custom Workflows"])
async def create_custom_workflow(workflow_data: CustomWorkflowCreate, current_user: dict = Depends(get_current_user)):
    """Create a new custom workflow"""
    workflow_dict = workflow_data.dict()
    workflow_dict['created_by'] = current_user.get('_id') or current_user.get('id')
    workflow_dict['created_at'] = datetime.utcnow()
    workflow_dict['updated_at'] = datetime.utcnow()
    workflow_dict['execution_count'] = 0
    workflow_dict['last_execution'] = None
    
    result = await db.custom_workflows.insert_one(workflow_dict)
    workflow_dict['id'] = str(result.inserted_id)
    
    logger.info(f"Custom workflow created: {workflow_dict['name']} by user {workflow_dict['created_by']}")
    
    return workflow_dict

@api_router.put("/custom-workflows/{workflow_id}", tags=["Custom Workflows"])
async def update_custom_workflow(workflow_id: str, workflow_update: CustomWorkflowUpdate):
    """Update an existing custom workflow"""
    # Check if workflow exists
    existing = await db.custom_workflows.find_one({'_id': ObjectId(workflow_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Prepare update data (only include non-None values)
    update_data = {k: v for k, v in workflow_update.dict().items() if v is not None}
    update_data['updated_at'] = datetime.utcnow()
    
    await db.custom_workflows.update_one(
        {'_id': ObjectId(workflow_id)},
        {'$set': update_data}
    )
    
    # Get updated workflow
    updated = await db.custom_workflows.find_one({'_id': ObjectId(workflow_id)})
    updated['id'] = str(updated['_id'])
    del updated['_id']
    
    logger.info(f"Custom workflow updated: {workflow_id}")
    
    return updated

@api_router.delete("/custom-workflows/{workflow_id}", tags=["Custom Workflows"])
async def delete_custom_workflow(workflow_id: str):
    """Delete a custom workflow"""
    result = await db.custom_workflows.delete_one({'_id': ObjectId(workflow_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    logger.info(f"Custom workflow deleted: {workflow_id}")
    
    return {'success': True, 'message': 'Workflow deleted successfully'}

@api_router.post("/custom-workflows/{workflow_id}/execute", tags=["Custom Workflows"])
async def execute_custom_workflow(workflow_id: str, context: Dict[str, Any] = None):
    """Execute a custom workflow manually"""
    # Get workflow
    workflow_data = await db.custom_workflows.find_one({'_id': ObjectId(workflow_id)})
    
    if not workflow_data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if not workflow_data.get('enabled', True):
        raise HTTPException(status_code=400, detail="Workflow is disabled")
    
    # Convert to CustomWorkflow model
    workflow_data['id'] = str(workflow_data['_id'])
    del workflow_data['_id']
    
    workflow = CustomWorkflow(**workflow_data)
    
    # Execute
    try:
        execution = await custom_workflow_executor.execute_workflow(workflow, context or {})
        return {
            'success': True,
            'execution': execution.dict()
        }
    except Exception as e:
        logger.error(f"Error executing custom workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/custom-workflows/{workflow_id}/executions", tags=["Custom Workflows"])
async def get_workflow_executions(workflow_id: str, limit: int = 50):
    """Get execution history for a workflow"""
    logs = await db.workflow_execution_logs.find(
        {'workflow_id': workflow_id}
    ).sort('created_at', -1).limit(limit).to_list(length=limit)
    
    # Convert ObjectId to string
    for log in logs:
        log['id'] = str(log['_id'])
        del log['_id']
    
    return logs

@api_router.get("/workflow-templates", tags=["Custom Workflows"])
async def get_workflow_templates():
    """Get pre-built workflow templates"""
    templates = [
        {
            'name': 'Customer Arrival Notification',
            'description': 'Sends notification when crew arrives at customer site',
            'trigger': {
                'trigger_type': 'event',
                'config': {'event': 'geofence_entry'}
            },
            'actions': [
                {
                    'action_type': 'send_notification',
                    'name': 'Notify Customer of Arrival',
                    'config': {
                        'title': 'Crew Arrived',
                        'message': 'Your snow removal crew has arrived at {{site_name}}',
                        'notification_type': 'info'
                    },
                    'order': 1,
                    'enabled': True
                },
                {
                    'action_type': 'send_sms',
                    'name': 'Send SMS to Customer',
                    'config': {
                        'phone': '{{customer_phone}}',
                        'message': 'Your crew has arrived! Service will begin shortly.'
                    },
                    'order': 2,
                    'enabled': True
                }
            ],
            'tags': ['customer', 'geofence', 'notification']
        },
        {
            'name': 'Daily Equipment Check Reminder',
            'description': 'Sends daily reminder to check equipment',
            'trigger': {
                'trigger_type': 'scheduled',
                'config': {'schedule': '0 7 * * *'}  # 7 AM daily
            },
            'actions': [
                {
                    'action_type': 'send_notification',
                    'name': 'Send Equipment Check Reminder',
                    'config': {
                        'title': 'Daily Equipment Check',
                        'message': 'Please complete your daily equipment inspection',
                        'priority': 'high',
                        'recipient_role': 'crew'
                    },
                    'order': 1,
                    'enabled': True
                }
            ],
            'tags': ['equipment', 'safety', 'scheduled']
        },
        {
            'name': 'Low Stock Alert & Reorder',
            'description': 'Alerts admin and creates purchase order when stock is low',
            'trigger': {
                'trigger_type': 'event',
                'config': {'event': 'stock_below_threshold'}
            },
            'actions': [
                {
                    'action_type': 'send_notification',
                    'name': 'Alert Admin',
                    'config': {
                        'title': 'Low Stock Alert',
                        'message': '{{consumable_name}} is low ({{current_stock}} remaining)',
                        'priority': 'high',
                        'recipient_role': 'admin'
                    },
                    'order': 1,
                    'enabled': True
                },
                {
                    'action_type': 'send_email',
                    'name': 'Email Purchase Order',
                    'config': {
                        'to_email': 'purchasing@company.com',
                        'subject': 'Purchase Order Required: {{consumable_name}}',
                        'body': 'Please order {{reorder_quantity}} units of {{consumable_name}}'
                    },
                    'order': 2,
                    'enabled': True
                }
            ],
            'tags': ['inventory', 'purchasing', 'alert']
        },
        {
            'name': 'Service Completion with Invoice',
            'description': 'Complete service, notify customer, and create invoice',
            'trigger': {
                'trigger_type': 'event',
                'config': {'event': 'dispatch_completed'}
            },
            'actions': [
                {
                    'action_type': 'send_notification',
                    'name': 'Notify Customer',
                    'config': {
                        'title': 'Service Completed',
                        'message': 'Your snow removal service has been completed!',
                    },
                    'order': 1,
                    'enabled': True
                },
                {
                    'action_type': 'deduct_consumables',
                    'name': 'Deduct Materials Used',
                    'config': {
                        'consumable_id': '{{consumable_id}}',
                        'quantity': '{{quantity_used}}'
                    },
                    'order': 2,
                    'enabled': True
                },
                {
                    'action_type': 'create_invoice',
                    'name': 'Generate Invoice',
                    'config': {
                        'customer_id': '{{customer_id}}',
                        'subtotal': '{{service_cost}}',
                        'tax': '{{tax_amount}}',
                        'total': '{{total_amount}}'
                    },
                    'order': 3,
                    'enabled': True
                }
            ],
            'tags': ['service', 'invoice', 'completion']
        }
    ]
    
    return templates

logger.info("Custom workflow management endpoints registered successfully")


@api_router.post("/users/upload-avatar")
async def upload_avatar(
    avatar_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Upload user avatar (base64 image)"""
    try:
        user_id = current_user.get('_id') or current_user.get('id')
        avatar_base64 = avatar_data.get('avatar')
        
        if not avatar_base64:
            raise HTTPException(status_code=400, detail="No avatar data provided")
        
        # Update user with avatar
        await db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'avatar': avatar_base64, 'updated_at': datetime.utcnow()}}
        )
        
        logger.info(f"Avatar uploaded for user {user_id}")
        
        return {'success': True, 'message': 'Avatar uploaded successfully'}
        
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/users/delete-avatar")
async def delete_avatar(current_user: dict = Depends(get_current_user)):
    """Delete user avatar"""
    try:
        user_id = current_user.get('_id') or current_user.get('id')
        
        # Remove avatar from user
        await db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$unset': {'avatar': ''}, '$set': {'updated_at': datetime.utcnow()}}
        )
        
        logger.info(f"Avatar deleted for user {user_id}")
        
        return {'success': True, 'message': 'Avatar deleted successfully'}
        
    except Exception as e:
        logger.error(f"Error deleting avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include QuickBooks router
from quickbooks_routes import router as quickbooks_router
api_router.include_router(quickbooks_router)

# Include the router with all endpoints
app.include_router(api_router)
