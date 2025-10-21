from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import RedirectResponse
from typing import Optional, List
from datetime import datetime, timedelta
import logging
from bson import ObjectId

from quickbooks_config import get_quickbooks_settings
from quickbooks_oauth import QuickBooksAuthClient
from quickbooks_client import QuickBooksClient, QuickBooksAPIError
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quickbooks", tags=["quickbooks"])
settings = get_quickbooks_settings()

# Pydantic models for request/response
class CustomerCreate(BaseModel):
    DisplayName: str
    GivenName: Optional[str] = None
    FamilyName: Optional[str] = None
    PrimaryEmailAddr: Optional[dict] = None
    PrimaryPhone: Optional[dict] = None
    BillAddr: Optional[dict] = None

class InvoiceLineItem(BaseModel):
    Amount: float
    DetailType: str = "SalesItemLineDetail"
    Description: Optional[str] = None
    SalesItemLineDetail: dict

class InvoiceCreate(BaseModel):
    CustomerRef: dict
    Line: List[InvoiceLineItem]
    DueDate: Optional[str] = None
    TxnDate: Optional[str] = None

class PaymentCreate(BaseModel):
    CustomerRef: dict
    TotalAmt: float
    Line: List[dict]

class EstimateCreate(BaseModel):
    CustomerRef: dict
    Line: List[InvoiceLineItem]
    ExpirationDate: Optional[str] = None

class SyncSettingsUpdate(BaseModel):
    sync_enabled: bool
    sync_direction: str = "one_way"  # "one_way" or "two_way"
    auto_sync_customers: bool = True
    auto_sync_invoices: bool = True
    auto_sync_payments: bool = True
    auto_sync_estimates: bool = True

def get_auth_client() -> QuickBooksAuthClient:
    """Get QuickBooks auth client"""
    if not settings.QUICKBOOKS_CLIENT_ID or not settings.QUICKBOOKS_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="QuickBooks credentials not configured. Please add QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET to .env file"
        )
    
    return QuickBooksAuthClient(
        client_id=settings.QUICKBOOKS_CLIENT_ID,
        client_secret=settings.QUICKBOOKS_CLIENT_SECRET,
        redirect_uri=settings.QUICKBOOKS_REDIRECT_URI,
        environment=settings.QUICKBOOKS_ENVIRONMENT
    )

async def get_qb_client(user_id: str, db) -> QuickBooksClient:
    """Get QuickBooks API client with auto-refresh"""
    connection = await db.quickbooks_connections.find_one({
        "user_id": user_id,
        "is_active": True
    })
    
    if not connection:
        raise HTTPException(status_code=404, detail="QuickBooks connection not found. Please connect to QuickBooks first.")
    
    # Check if access token needs refresh
    if datetime.utcnow() >= connection["access_token_expires_at"]:
        if datetime.utcnow() >= connection["refresh_token_expires_at"]:
            raise HTTPException(status_code=401, detail="Refresh token expired. Please reconnect to QuickBooks.")
        
        # Refresh the access token
        auth_client = get_auth_client()
        try:
            tokens = auth_client.refresh_access_token(connection["refresh_token"])
            
            # Update database with new tokens
            await db.quickbooks_connections.update_one(
                {"_id": connection["_id"]},
                {"$set": {
                    "access_token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"],
                    "access_token_expires_at": datetime.utcnow() + timedelta(seconds=tokens["expires_in"]),
                    "refresh_token_expires_at": datetime.utcnow() + timedelta(seconds=tokens["refresh_token_expires_in"]),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            logger.info(f"Refreshed access token for user: {user_id}")
            connection["access_token"] = tokens["access_token"]
            
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise HTTPException(status_code=401, detail="Token refresh failed. Please reconnect to QuickBooks.")
    
    return QuickBooksClient(
        access_token=connection["access_token"],
        realm_id=connection["realm_id"],
        environment=settings.QUICKBOOKS_ENVIRONMENT
    )

@router.get("/auth/connect")
async def connect_quickbooks(
    user_id: str = Query(..., description="User ID to associate with connection")
):
    """Initiate QuickBooks OAuth flow"""
    try:
        auth_client = get_auth_client()
        auth_url, state_token = auth_client.get_authorization_url(user_id=user_id)
        
        # Store state token mapping in database for callback verification
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Store state token with user_id for 10 minutes (enough time to complete OAuth)
        from datetime import datetime, timedelta
        await db.oauth_states.insert_one({
            "state_token": state_token,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        })
        
        return {"authorization_url": auth_url}
    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="State token from authorization"),
    realmId: str = Query(..., description="QuickBooks company ID")
):
    """Handle OAuth callback from QuickBooks"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Verify state token and get user_id
        state_record = await db.oauth_states.find_one({"state_token": state})
        
        if not state_record:
            logger.error(f"Invalid or expired state token: {state}")
            return RedirectResponse(url="/settings/quickbooks?error=invalid_state")
        
        user_id = state_record["user_id"]
        
        # Clean up used state token
        await db.oauth_states.delete_one({"state_token": state})
        
        auth_client = get_auth_client()
        
        # Exchange code for tokens
        tokens = auth_client.exchange_code_for_tokens(code, realmId)
        
        # Calculate token expiration times
        access_token_expires_at = datetime.utcnow() + timedelta(seconds=tokens["expires_in"])
        refresh_token_expires_at = datetime.utcnow() + timedelta(seconds=tokens["refresh_token_expires_in"])
        
        # Check if connection already exists
        existing_connection = await db.quickbooks_connections.find_one({"realm_id": realmId})
        
        if existing_connection:
            # Update existing connection
            await db.quickbooks_connections.update_one(
                {"_id": existing_connection["_id"]},
                {"$set": {
                    "user_id": user_id,
                    "access_token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"],
                    "access_token_expires_at": access_token_expires_at,
                    "refresh_token_expires_at": refresh_token_expires_at,
                    "is_active": True,
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            # Create new connection
            connection = {
                "user_id": user_id,
                "realm_id": realmId,
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "access_token_expires_at": access_token_expires_at,
                "refresh_token_expires_at": refresh_token_expires_at,
                "is_active": True,
                "sync_settings": {
                    "sync_enabled": True,
                    "sync_direction": "one_way",
                    "auto_sync_customers": True,
                    "auto_sync_invoices": True,
                    "auto_sync_payments": True,
                    "auto_sync_estimates": True
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.quickbooks_connections.insert_one(connection)
        
        # Fetch and store company name
        qb_client = QuickBooksClient(tokens["access_token"], realmId, settings.QUICKBOOKS_ENVIRONMENT)
        company_info = qb_client.get_company_info()
        
        await db.quickbooks_connections.update_one(
            {"realm_id": realmId},
            {"$set": {"company_name": company_info.get("CompanyInfo", {}).get("CompanyName")}}
        )
        
        logger.info(f"Successfully connected QuickBooks for user: {user_id}, realm: {realmId}")
        
        # Redirect to frontend success page
        return RedirectResponse(url=f"/settings/quickbooks?connected=true&realm_id={realmId}")
        
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return RedirectResponse(url=f"/settings/quickbooks?error=connection_failed")

@router.delete("/auth/disconnect")
async def disconnect_quickbooks(user_id: str = Query(...)):
    """Disconnect QuickBooks integration"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        connection = await db.quickbooks_connections.find_one({
            "user_id": user_id,
            "is_active": True
        })
        
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        auth_client = get_auth_client()
        
        try:
            # Revoke tokens
            auth_client.revoke_token(connection["access_token"])
        except Exception as e:
            logger.warning(f"Failed to revoke token (continuing anyway): {e}")
        
        # Mark connection as inactive
        await db.quickbooks_connections.update_one(
            {"_id": connection["_id"]},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"Disconnected QuickBooks for user: {user_id}")
        return {"message": "Successfully disconnected from QuickBooks"}
        
    except Exception as e:
        logger.error(f"Disconnect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/connection/status")
async def get_connection_status(user_id: str = Query(...)):
    """Check QuickBooks connection status"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        connection = await db.quickbooks_connections.find_one({
            "user_id": user_id,
            "is_active": True
        })
        
        if not connection:
            return {"connected": False}
        
        return {
            "connected": True,
            "company_name": connection.get("company_name"),
            "realm_id": connection.get("realm_id"),
            "token_expires_at": connection.get("access_token_expires_at").isoformat(),
            "connected_since": connection.get("created_at").isoformat(),
            "sync_settings": connection.get("sync_settings", {})
        }
    except Exception as e:
        logger.error(f"Error checking connection status: {e}")
        return {"connected": False, "error": str(e)}

@router.put("/sync-settings")
async def update_sync_settings(
    user_id: str = Query(...),
    settings_update: SyncSettingsUpdate = None
):
    """Update QuickBooks sync settings"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        result = await db.quickbooks_connections.update_one(
            {"user_id": user_id, "is_active": True},
            {"$set": {
                "sync_settings": settings_update.dict(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        return {"message": "Sync settings updated successfully", "settings": settings_update.dict()}
    except Exception as e:
        logger.error(f"Error updating sync settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Customer endpoints
@router.post("/customers")
async def create_customer(
    customer: CustomerCreate,
    user_id: str = Query(...)
):
    """Create a customer in QuickBooks"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        result = qb_client.create_customer(customer.dict(exclude_none=True))
        
        # Log successful sync
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "customer",
            "entity_id": result["Customer"]["Id"],
            "operation": "create",
            "status": "success",
            "created_at": datetime.utcnow()
        })
        
        return result["Customer"]
        
    except QuickBooksAPIError as e:
        # Log failed sync
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "customer",
            "operation": "create",
            "status": "error",
            "error_message": str(e),
            "created_at": datetime.utcnow()
        })
        
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: str,
    user_id: str = Query(...)
):
    """Get customer by ID"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        result = qb_client.get_customer(customer_id)
        return result["Customer"]
    except QuickBooksAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/customers")
async def list_customers(
    user_id: str = Query(...),
    active_only: bool = Query(True)
):
    """List all customers"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        query = "SELECT * FROM Customer"
        if active_only:
            query += " WHERE Active = true"
        query += " MAXRESULTS 1000"
        
        customers = qb_client.query_customers(query)
        return {"customers": customers, "count": len(customers)}
    except QuickBooksAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

# Invoice endpoints
@router.post("/invoices")
async def create_invoice(
    invoice: InvoiceCreate,
    user_id: str = Query(...)
):
    """Create an invoice in QuickBooks"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        result = qb_client.create_invoice(invoice.dict(exclude_none=True))
        
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "invoice",
            "entity_id": result["Invoice"]["Id"],
            "operation": "create",
            "status": "success",
            "created_at": datetime.utcnow()
        })
        
        return result["Invoice"]
        
    except QuickBooksAPIError as e:
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "invoice",
            "operation": "create",
            "status": "error",
            "error_message": str(e),
            "created_at": datetime.utcnow()
        })
        
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    user_id: str = Query(...)
):
    """Get invoice by ID"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        result = qb_client.get_invoice(invoice_id)
        return result["Invoice"]
    except QuickBooksAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/invoices")
async def list_invoices(
    user_id: str = Query(...),
    customer_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None)
):
    """List invoices with optional filters"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        query = "SELECT * FROM Invoice"
        conditions = []
        
        if customer_id:
            conditions.append(f"CustomerRef = '{customer_id}'")
        if start_date:
            conditions.append(f"TxnDate >= '{start_date}'")
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " MAXRESULTS 1000"
        
        invoices = qb_client.query_invoices(query)
        return {"invoices": invoices, "count": len(invoices)}
    except QuickBooksAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

# Payment endpoints
@router.post("/payments")
async def create_payment(
    payment: PaymentCreate,
    user_id: str = Query(...)
):
    """Create a payment in QuickBooks"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        result = qb_client.create_payment(payment.dict())
        
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "payment",
            "entity_id": result["Payment"]["Id"],
            "operation": "create",
            "status": "success",
            "created_at": datetime.utcnow()
        })
        
        return result["Payment"]
        
    except QuickBooksAPIError as e:
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "payment",
            "operation": "create",
            "status": "error",
            "error_message": str(e),
            "created_at": datetime.utcnow()
        })
        
        raise HTTPException(status_code=e.status_code, detail=e.message)

# Estimate endpoints
@router.post("/estimates")
async def create_estimate(
    estimate: EstimateCreate,
    user_id: str = Query(...)
):
    """Create an estimate in QuickBooks"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        qb_client = await get_qb_client(user_id, db)
        result = qb_client.create_estimate(estimate.dict(exclude_none=True))
        
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "estimate",
            "entity_id": result["Estimate"]["Id"],
            "operation": "create",
            "status": "success",
            "created_at": datetime.utcnow()
        })
        
        return result["Estimate"]
        
    except QuickBooksAPIError as e:
        await db.quickbooks_sync_logs.insert_one({
            "user_id": user_id,
            "entity_type": "estimate",
            "operation": "create",
            "status": "error",
            "error_message": str(e),
            "created_at": datetime.utcnow()
        })
        
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/sync-logs")
async def get_sync_logs(
    user_id: str = Query(...),
    limit: int = Query(50)
):
    """Get QuickBooks sync logs"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        logs = await db.quickbooks_sync_logs.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Convert ObjectId to string
        for log in logs:
            log["id"] = str(log["_id"])
            del log["_id"]
        
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logger.error(f"Error fetching sync logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
