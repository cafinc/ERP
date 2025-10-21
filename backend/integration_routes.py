"""
Integration Hub API Routes
Handles all integration-related endpoints including:
- Integration Management
- QuickBooks Integration (Payroll, Time Tracking)
- Microsoft 365 Integration (SSO, Teams, Outlook, OneDrive, Power BI)
- Sync Logs
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

from models import (
    Integration, IntegrationCreate, IntegrationUpdate,
    SyncLog, IntegrationStatus, IntegrationType
)

# Initialize MongoDB client
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(mongo_url)
db = client["snow_removal_db"]

# Collections
integrations_collection = db["integrations"]
sync_logs_collection = db["sync_logs"]

router = APIRouter(prefix="/api/integrations", tags=["Integration Hub"])

# ==================== INTEGRATION MANAGEMENT ====================

@router.post("", response_model=dict)
async def create_integration(integration: IntegrationCreate):
    """Create a new integration"""
    try:
        integration_dict = integration.dict()
        integration_dict["status"] = IntegrationStatus.DISCONNECTED
        integration_dict["created_at"] = datetime.utcnow()
        integration_dict["updated_at"] = datetime.utcnow()
        
        result = integrations_collection.insert_one(integration_dict)
        integration_dict["id"] = str(result.inserted_id)
        
        return {"success": True, "integration": integration_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=dict)
async def get_integrations(integration_type: Optional[str] = None):
    """Get all integrations"""
    try:
        query = {}
        if integration_type:
            query["integration_type"] = integration_type
        
        integrations = list(integrations_collection.find(query))
        for integration in integrations:
            integration["id"] = str(integration["_id"])
            del integration["_id"]
            # Hide credentials from response
            if "credentials" in integration:
                integration["credentials"] = {"configured": bool(integration["credentials"])}
        
        return {"success": True, "integrations": integrations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}", response_model=dict)
async def get_integration(integration_id: str):
    """Get integration by ID"""
    try:
        integration = integrations_collection.find_one({"_id": ObjectId(integration_id)})
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        integration["id"] = str(integration["_id"])
        del integration["_id"]
        
        # Hide credentials
        if "credentials" in integration:
            integration["credentials"] = {"configured": bool(integration["credentials"])}
        
        return {"success": True, "integration": integration}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{integration_id}", response_model=dict)
async def update_integration(integration_id: str, integration_update: IntegrationUpdate):
    """Update integration"""
    try:
        update_data = {k: v for k, v in integration_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = integrations_collection.update_one(
            {"_id": ObjectId(integration_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        return {"success": True, "message": "Integration updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{integration_id}", response_model=dict)
async def delete_integration(integration_id: str):
    """Delete integration"""
    try:
        result = integrations_collection.delete_one({"_id": ObjectId(integration_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        return {"success": True, "message": "Integration deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{integration_id}/connect", response_model=dict)
async def connect_integration(integration_id: str):
    """Connect/activate an integration (MOCK)"""
    try:
        integration = integrations_collection.find_one({"_id": ObjectId(integration_id)})
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        # MOCK: Simulate connection
        integrations_collection.update_one(
            {"_id": ObjectId(integration_id)},
            {"$set": {
                "status": IntegrationStatus.CONNECTED,
                "last_sync": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {
            "success": True,
            "message": f"{integration['name']} connected successfully",
            "mock": True,
            "note": "This is a placeholder connection. Actual OAuth flow will be implemented when API keys are provided."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{integration_id}/disconnect", response_model=dict)
async def disconnect_integration(integration_id: str):
    """Disconnect/deactivate an integration"""
    try:
        result = integrations_collection.update_one(
            {"_id": ObjectId(integration_id)},
            {"$set": {
                "status": IntegrationStatus.DISCONNECTED,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        return {"success": True, "message": "Integration disconnected successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{integration_id}/sync", response_model=dict)
async def sync_integration(integration_id: str, sync_type: str = "incremental"):
    """Trigger manual sync for an integration (MOCK)"""
    try:
        integration = integrations_collection.find_one({"_id": ObjectId(integration_id)})
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        if integration["status"] != IntegrationStatus.CONNECTED:
            raise HTTPException(status_code=400, detail="Integration not connected")
        
        # Create sync log
        sync_log = {
            "integration_id": integration_id,
            "integration_name": integration["name"],
            "sync_type": sync_type,
            "started_at": datetime.utcnow(),
            "status": "in_progress",
            "records_synced": 0,
            "errors": []
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        # MOCK: Simulate successful sync
        sync_logs_collection.update_one(
            {"_id": log_result.inserted_id},
            {"$set": {
                "completed_at": datetime.utcnow(),
                "status": "success",
                "records_synced": 0,
                "details": {
                    "mock": True,
                    "message": "Placeholder sync completed. Actual sync will be implemented when API credentials are provided."
                }
            }}
        )
        
        # Update last sync time
        integrations_collection.update_one(
            {"_id": ObjectId(integration_id)},
            {"$set": {"last_sync": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": "Sync completed successfully",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== QUICKBOOKS INTEGRATION ====================

@router.post("/quickbooks/payroll/sync", response_model=dict)
async def sync_quickbooks_payroll():
    """Sync payroll data with QuickBooks (MOCK)"""
    try:
        # Check if QuickBooks integration exists
        integration = integrations_collection.find_one({"integration_type": IntegrationType.QUICKBOOKS})
        
        if not integration:
            # Create placeholder integration
            integration_data = {
                "integration_type": IntegrationType.QUICKBOOKS,
                "name": "QuickBooks Payroll",
                "description": "Sync payroll data with QuickBooks",
                "status": IntegrationStatus.DISCONNECTED,
                "credentials": {},
                "settings": {"sync_payroll": True, "sync_time_tracking": True},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = integrations_collection.insert_one(integration_data)
            integration_id = str(result.inserted_id)
        else:
            integration_id = str(integration["_id"])
        
        # Create sync log
        sync_log = {
            "integration_id": integration_id,
            "integration_name": "QuickBooks Payroll",
            "sync_type": "payroll",
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "status": "success",
            "records_synced": 0,
            "errors": [],
            "details": {
                "mock": True,
                "message": "Placeholder payroll sync. Connect QuickBooks to enable real-time payroll synchronization."
            }
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        return {
            "success": True,
            "message": "QuickBooks payroll sync completed",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id),
            "note": "Connect QuickBooks in Integration Hub to enable actual payroll sync"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quickbooks/time-tracking/sync", response_model=dict)
async def sync_quickbooks_time_tracking():
    """Sync time tracking data with QuickBooks (MOCK)"""
    try:
        integration = integrations_collection.find_one({"integration_type": IntegrationType.QUICKBOOKS})
        
        if not integration:
            integration_data = {
                "integration_type": IntegrationType.QUICKBOOKS,
                "name": "QuickBooks Time Tracking",
                "description": "Sync time tracking data with QuickBooks",
                "status": IntegrationStatus.DISCONNECTED,
                "credentials": {},
                "settings": {"sync_payroll": True, "sync_time_tracking": True},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = integrations_collection.insert_one(integration_data)
            integration_id = str(result.inserted_id)
        else:
            integration_id = str(integration["_id"])
        
        sync_log = {
            "integration_id": integration_id,
            "integration_name": "QuickBooks Time Tracking",
            "sync_type": "time_tracking",
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "status": "success",
            "records_synced": 0,
            "errors": [],
            "details": {
                "mock": True,
                "message": "Placeholder time tracking sync. Connect QuickBooks to enable real-time time tracking synchronization."
            }
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        return {
            "success": True,
            "message": "QuickBooks time tracking sync completed",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id),
            "note": "Connect QuickBooks in Integration Hub to enable actual time tracking sync"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== MICROSOFT 365 INTEGRATION ====================

@router.post("/microsoft365/sso/setup", response_model=dict)
async def setup_microsoft365_sso():
    """Setup Microsoft 365 SSO (MOCK)"""
    try:
        integration = integrations_collection.find_one({"integration_type": IntegrationType.MICROSOFT_365})
        
        if not integration:
            integration_data = {
                "integration_type": IntegrationType.MICROSOFT_365,
                "name": "Microsoft 365 SSO",
                "description": "Single Sign-On with Azure AD",
                "status": IntegrationStatus.DISCONNECTED,
                "credentials": {},
                "settings": {
                    "sso_enabled": False,
                    "teams_integration": False,
                    "outlook_integration": False,
                    "onedrive_integration": False,
                    "powerbi_integration": False
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = integrations_collection.insert_one(integration_data)
            integration_id = str(result.inserted_id)
        else:
            integration_id = str(integration["_id"])
        
        return {
            "success": True,
            "message": "Microsoft 365 SSO setup initialized",
            "mock": True,
            "integration_id": integration_id,
            "note": "Azure AD configuration required. Add Tenant ID, Client ID, and Client Secret in integration settings."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/microsoft365/teams/sync", response_model=dict)
async def sync_microsoft365_teams():
    """Sync with Microsoft Teams (MOCK)"""
    try:
        integration = integrations_collection.find_one({"integration_type": IntegrationType.MICROSOFT_365})
        integration_id = str(integration["_id"]) if integration else "mock_id"
        
        sync_log = {
            "integration_id": integration_id,
            "integration_name": "Microsoft Teams",
            "sync_type": "teams",
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "status": "success",
            "records_synced": 0,
            "errors": [],
            "details": {
                "mock": True,
                "message": "Placeholder Teams sync. Connect Microsoft 365 to enable team collaboration features."
            }
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        return {
            "success": True,
            "message": "Microsoft Teams sync completed",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/microsoft365/outlook/sync", response_model=dict)
async def sync_microsoft365_outlook():
    """Sync with Outlook Calendar (MOCK)"""
    try:
        integration = integrations_collection.find_one({"integration_type": IntegrationType.MICROSOFT_365})
        integration_id = str(integration["_id"]) if integration else "mock_id"
        
        sync_log = {
            "integration_id": integration_id,
            "integration_name": "Outlook Calendar",
            "sync_type": "outlook",
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "status": "success",
            "records_synced": 0,
            "errors": [],
            "details": {
                "mock": True,
                "message": "Placeholder Outlook sync. Connect Microsoft 365 to sync calendars and emails."
            }
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        return {
            "success": True,
            "message": "Outlook calendar sync completed",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/microsoft365/onedrive/sync", response_model=dict)
async def sync_microsoft365_onedrive():
    """Sync with OneDrive (MOCK)"""
    try:
        integration = integrations_collection.find_one({"integration_type": IntegrationType.MICROSOFT_365})
        integration_id = str(integration["_id"]) if integration else "mock_id"
        
        sync_log = {
            "integration_id": integration_id,
            "integration_name": "OneDrive",
            "sync_type": "onedrive",
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "status": "success",
            "records_synced": 0,
            "errors": [],
            "details": {
                "mock": True,
                "message": "Placeholder OneDrive sync. Connect Microsoft 365 to enable document storage and sharing."
            }
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        return {
            "success": True,
            "message": "OneDrive sync completed",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/microsoft365/powerbi/sync", response_model=dict)
async def sync_microsoft365_powerbi():
    """Sync with Power BI (MOCK)"""
    try:
        integration = integrations_collection.find_one({"integration_type": IntegrationType.MICROSOFT_365})
        integration_id = str(integration["_id"]) if integration else "mock_id"
        
        sync_log = {
            "integration_id": integration_id,
            "integration_name": "Power BI",
            "sync_type": "powerbi",
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "status": "success",
            "records_synced": 0,
            "errors": [],
            "details": {
                "mock": True,
                "message": "Placeholder Power BI sync. Connect Microsoft 365 to enable advanced analytics and reporting."
            }
        }
        log_result = sync_logs_collection.insert_one(sync_log)
        
        return {
            "success": True,
            "message": "Power BI sync completed",
            "mock": True,
            "sync_log_id": str(log_result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SYNC LOGS ====================

@router.get("/sync-logs", response_model=dict)
async def get_sync_logs(
    integration_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get sync logs"""
    try:
        query = {}
        if integration_id:
            query["integration_id"] = integration_id
        if status:
            query["status"] = status
        
        logs = list(sync_logs_collection.find(query).sort("started_at", -1).skip(skip).limit(limit))
        for log in logs:
            log["id"] = str(log["_id"])
            del log["_id"]
        
        total = sync_logs_collection.count_documents(query)
        
        return {"success": True, "logs": logs, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
