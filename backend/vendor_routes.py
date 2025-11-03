"""
Vendor Management Routes
Phase 1, Sprint 1.1 - Vendor Database
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

router = APIRouter(prefix="/api/vendors", tags=["Vendors"])

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

vendors_collection = db["vendors"]

# ==================== MODELS ====================

class VendorContact(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None

class Address(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: str = "Canada"

class VendorCreate(BaseModel):
    vendor_name: str
    vendor_code: Optional[str] = None
    vendor_type: str = "supplier"  # supplier, subcontractor, service_provider
    primary_contact: VendorContact
    billing_address: Optional[Address] = None
    shipping_address: Optional[Address] = None
    payment_terms: str = "Net 30"
    tax_id: Optional[str] = None
    w9_on_file: bool = False
    insurance_on_file: bool = False
    insurance_expiry: Optional[datetime] = None
    notes: Optional[str] = None

class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_type: Optional[str] = None
    primary_contact: Optional[VendorContact] = None
    billing_address: Optional[Address] = None
    shipping_address: Optional[Address] = None
    payment_terms: Optional[str] = None
    tax_id: Optional[str] = None
    w9_on_file: Optional[bool] = None
    insurance_on_file: Optional[bool] = None
    insurance_expiry: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None

# ==================== ROUTES ====================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_vendor(vendor: VendorCreate):
    """Create a new vendor"""
    try:
        # Check for duplicate vendor name
        existing = await vendors_collection.find_one({"vendor_name": vendor.vendor_name})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vendor with this name already exists"
            )
        
        # Generate vendor code if not provided
        vendor_code = vendor.vendor_code
        if not vendor_code:
            # Generate code from name (first 3 letters + random numbers)
            import random
            prefix = vendor.vendor_name[:3].upper().replace(" ", "")
            random_num = random.randint(100, 999)
            vendor_code = f"{prefix}{random_num}"
        
        vendor_doc = {
            "vendor_name": vendor.vendor_name,
            "vendor_code": vendor_code,
            "vendor_type": vendor.vendor_type,
            "primary_contact": vendor.primary_contact.dict(),
            "billing_address": vendor.billing_address.dict() if vendor.billing_address else None,
            "shipping_address": vendor.shipping_address.dict() if vendor.shipping_address else None,
            "payment_terms": vendor.payment_terms,
            "tax_id": vendor.tax_id,
            "w9_on_file": vendor.w9_on_file,
            "insurance_on_file": vendor.insurance_on_file,
            "insurance_expiry": vendor.insurance_expiry,
            "notes": vendor.notes,
            "rating": 0,
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await vendors_collection.insert_one(vendor_doc)
        vendor_doc["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Vendor created successfully",
            "vendor": vendor_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating vendor: {str(e)}"
        )

@router.get("")
async def get_vendors(
    vendor_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all vendors with optional filters"""
    try:
        query = {}
        
        if vendor_type:
            query["vendor_type"] = vendor_type
        if status_filter:
            query["status"] = status_filter
        if search:
            query["$or"] = [
                {"vendor_name": {"$regex": search, "$options": "i"}},
                {"vendor_code": {"$regex": search, "$options": "i"}}
            ]
        
        vendors = await vendors_collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        
        for vendor in vendors:
            vendor["_id"] = str(vendor["_id"])
        
        total = await vendors_collection.count_documents(query)
        
        return {
            "success": True,
            "vendors": vendors,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vendors: {str(e)}"
        )

@router.get("/{vendor_id}")
async def get_vendor(vendor_id: str):
    """Get vendor details by ID"""
    try:
        vendor = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        vendor["_id"] = str(vendor["_id"])
        
        # Get vendor statistics (bills, payments, etc.)
        bills_collection = db["bills"]
        payments_collection = db["vendor_payments"]
        
        total_bills = await bills_collection.count_documents({"vendor_id": vendor_id})
        total_paid = await bills_collection.count_documents({"vendor_id": vendor_id, "status": "paid"})
        
        # Calculate total spending
        bills = await bills_collection.find({"vendor_id": vendor_id}).to_list(length=1000)
        total_spending = sum(bill.get("total", 0) for bill in bills)
        
        # Outstanding balance
        outstanding = sum(bill.get("amount_due", 0) for bill in bills if bill.get("amount_due", 0) > 0)
        
        vendor["statistics"] = {
            "total_bills": total_bills,
            "paid_bills": total_paid,
            "total_spending": total_spending,
            "outstanding_balance": outstanding
        }
        
        return {
            "success": True,
            "vendor": vendor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vendor: {str(e)}"
        )

@router.put("/{vendor_id}")
async def update_vendor(vendor_id: str, vendor_update: VendorUpdate):
    """Update vendor details"""
    try:
        vendor = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        update_data = vendor_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now()
        
        await vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "Vendor updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating vendor: {str(e)}"
        )

@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id: str):
    """Delete vendor (soft delete - mark as inactive)"""
    try:
        vendor = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Check if vendor has any bills
        bills_collection = db["bills"]
        has_bills = await bills_collection.count_documents({"vendor_id": vendor_id})
        
        if has_bills > 0:
            # Soft delete - mark as inactive
            await vendors_collection.update_one(
                {"_id": ObjectId(vendor_id)},
                {"$set": {"status": "inactive", "updated_at": datetime.now()}}
            )
            message = "Vendor marked as inactive (has existing bills)"
        else:
            # Hard delete if no bills
            await vendors_collection.delete_one({"_id": ObjectId(vendor_id)})
            message = "Vendor deleted successfully"
        
        return {
            "success": True,
            "message": message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting vendor: {str(e)}"
        )

@router.get("/{vendor_id}/bills")
async def get_vendor_bills(vendor_id: str, skip: int = 0, limit: int = 100):
    """Get all bills for a vendor"""
    try:
        bills_collection = db["bills"]
        
        bills = await bills_collection.find({"vendor_id": vendor_id}).skip(skip).limit(limit).to_list(length=limit)
        
        for bill in bills:
            bill["_id"] = str(bill["_id"])
        
        total = await bills_collection.count_documents({"vendor_id": vendor_id})
        
        return {
            "success": True,
            "bills": bills,
            "total": total
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vendor bills: {str(e)}"
        )

@router.get("/{vendor_id}/spending")
async def get_vendor_spending(vendor_id: str):
    """Get vendor spending history and analytics"""
    try:
        bills_collection = db["bills"]
        
        # Get all bills for vendor
        bills = await bills_collection.find({"vendor_id": vendor_id}).to_list(length=1000)
        
        # Calculate spending by month
        from collections import defaultdict
        monthly_spending = defaultdict(float)
        
        for bill in bills:
            month_key = bill["bill_date"].strftime("%Y-%m")
            monthly_spending[month_key] += bill.get("total", 0)
        
        # Sort by month
        sorted_spending = [
            {"month": month, "amount": amount}
            for month, amount in sorted(monthly_spending.items())
        ]
        
        # Total spending
        total_spending = sum(bill.get("total", 0) for bill in bills)
        
        # Average bill amount
        avg_bill = total_spending / len(bills) if bills else 0
        
        return {
            "success": True,
            "total_spending": total_spending,
            "total_bills": len(bills),
            "average_bill": avg_bill,
            "monthly_spending": sorted_spending
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vendor spending: {str(e)}"
        )
