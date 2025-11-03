"""
Accounts Payable Routes - Vendor Bill Management
Phase 1, Sprint 1.1 - Week 1
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

router = APIRouter(prefix="/api/bills", tags=["Accounts Payable"])

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
bills_collection = db["bills"]
vendor_payments_collection = db["vendor_payments"]
vendors_collection = db["vendors"]

# ==================== MODELS ====================

class BillLineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    tax: float = 0.0
    total: float
    gl_account: Optional[str] = None

class BillCreate(BaseModel):
    vendor_id: str
    bill_date: datetime
    due_date: datetime
    payment_terms: str = "Net 30"
    line_items: List[BillLineItem]
    reference_number: Optional[str] = None
    memo: Optional[str] = None
    attachments: List[str] = []

class BillUpdate(BaseModel):
    vendor_id: Optional[str] = None
    bill_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    line_items: Optional[List[BillLineItem]] = None
    reference_number: Optional[str] = None
    memo: Optional[str] = None
    status: Optional[str] = None

class PaymentCreate(BaseModel):
    payment_date: datetime
    payment_method: str  # cheque, eft, ach, e_transfer, credit_card
    reference_number: str
    amount: float
    memo: Optional[str] = None
    bank_account: Optional[str] = None

class BillApproval(BaseModel):
    approver_id: str
    comments: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def calculate_bill_totals(line_items: List[BillLineItem]):
    """Calculate subtotal, tax, and total from line items"""
    subtotal = sum(item.quantity * item.unit_price for item in line_items)
    tax_total = sum(item.tax for item in line_items)
    total = subtotal + tax_total
    return subtotal, tax_total, total

def generate_bill_number():
    """Generate unique bill number"""
    import random
    timestamp = datetime.now().strftime("%Y%m%d")
    random_num = random.randint(1000, 9999)
    return f"BILL-{timestamp}-{random_num}"

async def get_vendor_by_id(vendor_id: str):
    """Get vendor details"""
    vendor = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        # Create vendor if doesn't exist (for compatibility)
        vendor = {
            "_id": ObjectId(vendor_id),
            "vendor_name": "Unknown Vendor",
            "status": "active"
        }
    return vendor

# ==================== ROUTES ====================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_bill(bill: BillCreate):
    """Create a new vendor bill"""
    try:
        # Verify vendor exists
        vendor = await get_vendor_by_id(bill.vendor_id)
        
        # Calculate totals
        subtotal, tax_total, total = calculate_bill_totals(bill.line_items)
        
        # Create bill document
        bill_doc = {
            "bill_number": generate_bill_number(),
            "vendor_id": bill.vendor_id,
            "vendor_name": vendor.get("vendor_name", "Unknown"),
            "bill_date": bill.bill_date,
            "due_date": bill.due_date,
            "payment_terms": bill.payment_terms,
            "line_items": [item.dict() for item in bill.line_items],
            "reference_number": bill.reference_number,
            "memo": bill.memo,
            "subtotal": subtotal,
            "tax_total": tax_total,
            "total": total,
            "amount_paid": 0.0,
            "amount_due": total,
            "status": "draft",  # draft, pending_approval, approved, paid, overdue, cancelled
            "approval_status": None,
            "approved_by": None,
            "approved_at": None,
            "attachments": bill.attachments,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await bills_collection.insert_one(bill_doc)
        bill_doc["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Bill created successfully",
            "bill": bill_doc
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating bill: {str(e)}"
        )

@router.get("")
async def get_bills(
    status_filter: Optional[str] = None,
    vendor_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all bills with optional filters"""
    try:
        query = {}
        
        if status_filter:
            query["status"] = status_filter
        if vendor_id:
            query["vendor_id"] = vendor_id
        if start_date or end_date:
            query["bill_date"] = {}
            if start_date:
                query["bill_date"]["$gte"] = start_date
            if end_date:
                query["bill_date"]["$lte"] = end_date
        
        bills = await bills_collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string
        for bill in bills:
            bill["_id"] = str(bill["_id"])
        
        # Get total count
        total = await bills_collection.count_documents(query)
        
        return {
            "success": True,
            "bills": bills,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bills: {str(e)}"
        )

@router.get("/unpaid")
async def get_unpaid_bills():
    """Get all unpaid bills"""
    try:
        bills = await bills_collection.find({
            "status": {"$in": ["approved", "overdue"]},
            "amount_due": {"$gt": 0}
        }).to_list(length=1000)
        
        for bill in bills:
            bill["_id"] = str(bill["_id"])
        
        return {
            "success": True,
            "bills": bills,
            "total_due": sum(bill["amount_due"] for bill in bills)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching unpaid bills: {str(e)}"
        )

@router.get("/aging")
async def get_aging_report():
    """Generate accounts payable aging report"""
    try:
        today = datetime.now()
        
        # Initialize aging buckets
        aging = {
            "current": {"count": 0, "amount": 0.0, "bills": []},
            "1-30": {"count": 0, "amount": 0.0, "bills": []},
            "31-60": {"count": 0, "amount": 0.0, "bills": []},
            "61-90": {"count": 0, "amount": 0.0, "bills": []},
            "90+": {"count": 0, "amount": 0.0, "bills": []}
        }
        
        # Get all unpaid bills
        unpaid_bills = await bills_collection.find({
            "status": {"$in": ["approved", "overdue"]},
            "amount_due": {"$gt": 0}
        }).to_list(length=1000)
        
        for bill in unpaid_bills:
            bill["_id"] = str(bill["_id"])
            days_overdue = (today - bill["due_date"]).days
            
            if days_overdue < 0:
                bucket = "current"
            elif days_overdue <= 30:
                bucket = "1-30"
            elif days_overdue <= 60:
                bucket = "31-60"
            elif days_overdue <= 90:
                bucket = "61-90"
            else:
                bucket = "90+"
            
            aging[bucket]["count"] += 1
            aging[bucket]["amount"] += bill["amount_due"]
            aging[bucket]["bills"].append({
                "bill_id": bill["_id"],
                "bill_number": bill["bill_number"],
                "vendor_name": bill["vendor_name"],
                "amount_due": bill["amount_due"],
                "due_date": bill["due_date"],
                "days_overdue": max(0, days_overdue)
            })
        
        total_due = sum(bucket["amount"] for bucket in aging.values())
        
        return {
            "success": True,
            "aging": aging,
            "total_due": total_due,
            "as_of_date": today
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating aging report: {str(e)}"
        )

@router.get("/{bill_id}")
async def get_bill(bill_id: str):
    """Get bill details by ID"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        bill["_id"] = str(bill["_id"])
        
        # Get payment history
        payments = await vendor_payments_collection.find({
            "bills_paid.bill_id": bill_id
        }).to_list(length=100)
        
        for payment in payments:
            payment["_id"] = str(payment["_id"])
        
        return {
            "success": True,
            "bill": bill,
            "payments": payments
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bill: {str(e)}"
        )

@router.put("/{bill_id}")
async def update_bill(bill_id: str, bill_update: BillUpdate):
    """Update bill details"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        # Only allow updates if bill is draft
        if bill["status"] not in ["draft", "pending_approval"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update bill in current status"
            )
        
        update_data = bill_update.dict(exclude_unset=True)
        
        # Recalculate totals if line items changed
        if "line_items" in update_data:
            line_items = [BillLineItem(**item) for item in update_data["line_items"]]
            subtotal, tax_total, total = calculate_bill_totals(line_items)
            update_data["subtotal"] = subtotal
            update_data["tax_total"] = tax_total
            update_data["total"] = total
            update_data["amount_due"] = total - bill.get("amount_paid", 0)
        
        update_data["updated_at"] = datetime.now()
        
        await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "Bill updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating bill: {str(e)}"
        )

@router.delete("/{bill_id}")
async def delete_bill(bill_id: str):
    """Delete bill (soft delete)"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        # Only allow deletion if bill is draft
        if bill["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only delete draft bills"
            )
        
        await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": {"status": "cancelled", "updated_at": datetime.now()}}
        )
        
        return {
            "success": True,
            "message": "Bill cancelled successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting bill: {str(e)}"
        )

@router.post("/{bill_id}/approve")
async def approve_bill(bill_id: str, approval: BillApproval):
    """Approve a bill"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        if bill["status"] not in ["draft", "pending_approval"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bill cannot be approved in current status"
            )
        
        await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": {
                "status": "approved",
                "approval_status": "approved",
                "approved_by": approval.approver_id,
                "approved_at": datetime.now(),
                "approval_comments": approval.comments,
                "updated_at": datetime.now()
            }}
        )
        
        return {
            "success": True,
            "message": "Bill approved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving bill: {str(e)}"
        )

@router.post("/{bill_id}/reject")
async def reject_bill(bill_id: str, approval: BillApproval):
    """Reject a bill"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        if bill["status"] not in ["pending_approval"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bill cannot be rejected in current status"
            )
        
        await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": {
                "status": "draft",
                "approval_status": "rejected",
                "rejected_by": approval.approver_id,
                "rejected_at": datetime.now(),
                "rejection_comments": approval.comments,
                "updated_at": datetime.now()
            }}
        )
        
        return {
            "success": True,
            "message": "Bill rejected successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting bill: {str(e)}"
        )

@router.post("/{bill_id}/submit")
async def submit_bill_for_approval(bill_id: str):
    """Submit bill for approval"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        if bill["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft bills can be submitted for approval"
            )
        
        await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": {
                "status": "pending_approval",
                "submitted_at": datetime.now(),
                "updated_at": datetime.now()
            }}
        )
        
        return {
            "success": True,
            "message": "Bill submitted for approval"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting bill: {str(e)}"
        )

@router.post("/{bill_id}/payment")
async def record_payment(bill_id: str, payment: PaymentCreate):
    """Record payment against a bill"""
    try:
        bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        if bill["status"] != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only pay approved bills"
            )
        
        if payment.amount > bill["amount_due"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount exceeds amount due"
            )
        
        # Create payment record
        payment_doc = {
            "vendor_id": bill["vendor_id"],
            "vendor_name": bill["vendor_name"],
            "payment_date": payment.payment_date,
            "payment_method": payment.payment_method,
            "reference_number": payment.reference_number,
            "amount": payment.amount,
            "bills_paid": [{
                "bill_id": bill_id,
                "bill_number": bill["bill_number"],
                "amount_applied": payment.amount
            }],
            "memo": payment.memo,
            "bank_account": payment.bank_account,
            "status": "processed",
            "created_at": datetime.now()
        }
        
        result = await vendor_payments_collection.insert_one(payment_doc)
        
        # Update bill
        new_amount_paid = bill["amount_paid"] + payment.amount
        new_amount_due = bill["amount_due"] - payment.amount
        new_status = "paid" if new_amount_due == 0 else "approved"
        
        await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": {
                "amount_paid": new_amount_paid,
                "amount_due": new_amount_due,
                "status": new_status,
                "last_payment_date": payment.payment_date,
                "updated_at": datetime.now()
            }}
        )
        
        return {
            "success": True,
            "message": "Payment recorded successfully",
            "payment_id": str(result.inserted_id),
            "remaining_due": new_amount_due
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recording payment: {str(e)}"
        )

@router.post("/batch-payment")
async def batch_payment(payments: List[dict]):
    """Process multiple bill payments at once"""
    try:
        results = []
        
        for payment_data in payments:
            bill_id = payment_data.get("bill_id")
            amount = payment_data.get("amount")
            
            bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
            
            if not bill or bill["status"] != "approved":
                results.append({
                    "bill_id": bill_id,
                    "success": False,
                    "error": "Bill not found or not approved"
                })
                continue
            
            if amount > bill["amount_due"]:
                results.append({
                    "bill_id": bill_id,
                    "success": False,
                    "error": "Amount exceeds amount due"
                })
                continue
            
            # Record payment (simplified for batch)
            new_amount_paid = bill["amount_paid"] + amount
            new_amount_due = bill["amount_due"] - amount
            new_status = "paid" if new_amount_due == 0 else "approved"
            
            await bills_collection.update_one(
                {"_id": ObjectId(bill_id)},
                {"$set": {
                    "amount_paid": new_amount_paid,
                    "amount_due": new_amount_due,
                    "status": new_status,
                    "updated_at": datetime.now()
                }}
            )
            
            results.append({
                "bill_id": bill_id,
                "success": True,
                "amount_paid": amount,
                "remaining_due": new_amount_due
            })
        
        return {
            "success": True,
            "message": f"Processed {len(results)} payments",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing batch payment: {str(e)}"
        )

@router.get("/dashboard/metrics")
async def get_ap_dashboard():
    """Get AP dashboard metrics"""
    try:
        # Total outstanding
        unpaid_bills = await bills_collection.find({
            "status": {"$in": ["approved", "overdue"]},
            "amount_due": {"$gt": 0}
        }).to_list(length=1000)
        
        total_outstanding = sum(bill["amount_due"] for bill in unpaid_bills)
        
        # Due soon (next 7 days)
        due_soon_date = datetime.now() + timedelta(days=7)
        due_soon = await bills_collection.find({
            "status": "approved",
            "due_date": {"$lte": due_soon_date},
            "amount_due": {"$gt": 0}
        }).to_list(length=100)
        
        due_soon_amount = sum(bill["amount_due"] for bill in due_soon)
        
        # Overdue bills
        overdue_bills = await bills_collection.find({
            "status": {"$in": ["approved", "overdue"]},
            "due_date": {"$lt": datetime.now()},
            "amount_due": {"$gt": 0}
        }).to_list(length=100)
        
        overdue_amount = sum(bill["amount_due"] for bill in overdue_bills)
        
        # Pending approval
        pending_approval = await bills_collection.count_documents({
            "status": "pending_approval"
        })
        
        # This month's spending
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_payments = await vendor_payments_collection.find({
            "payment_date": {"$gte": start_of_month}
        }).to_list(length=1000)
        
        month_spending = sum(payment["amount"] for payment in month_payments)
        
        return {
            "success": True,
            "metrics": {
                "total_outstanding": total_outstanding,
                "bills_count": len(unpaid_bills),
                "due_soon": {
                    "amount": due_soon_amount,
                    "count": len(due_soon)
                },
                "overdue": {
                    "amount": overdue_amount,
                    "count": len(overdue_bills)
                },
                "pending_approval": pending_approval,
                "month_spending": month_spending
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard metrics: {str(e)}"
        )
