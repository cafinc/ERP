"""
Accounts Receivable Routes - Enhanced Invoice & Payment Management
Phase 1, Sprint 1.2 - Week 1-3
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/ar", tags=["Accounts Receivable"])

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
invoices_collection = db["invoices"]
customers_collection = db["customers"]
customer_payments_collection = db["customer_payments"]
credit_memos_collection = db["credit_memos"]

# ==================== MODELS ====================

class PaymentCreate(BaseModel):
    customer_id: str
    payment_date: datetime
    payment_method: str  # cheque, eft, ach, e_transfer, credit_card
    reference_number: str
    amount: float
    invoices_paid: List[dict]  # [{"invoice_id": str, "amount_applied": float}]
    memo: Optional[str] = None
    deposit_to: Optional[str] = None

class CreditMemoCreate(BaseModel):
    customer_id: str
    memo_date: datetime
    reason: str
    amount: float
    applied_to_invoices: Optional[List[dict]] = []

class EmailInvoiceRequest(BaseModel):
    to_email: str
    cc_emails: Optional[List[str]] = []
    subject: Optional[str] = None
    message: Optional[str] = None

class CreditLimitUpdate(BaseModel):
    credit_limit: float

# ==================== HELPER FUNCTIONS ====================

async def get_customer_by_id(customer_id: str):
    """Get customer details"""
    customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer

def send_invoice_email(invoice: dict, to_email: str, cc_emails: List[str] = None, custom_message: str = None):
    """Send invoice via email using Google SMTP"""
    try:
        # Email configuration (should come from environment)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.getenv("GMAIL_USER", "")
        sender_password = os.getenv("GMAIL_APP_PASSWORD", "")
        
        if not sender_email or not sender_password:
            raise Exception("Email credentials not configured")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Invoice {invoice.get('invoice_number', 'N/A')} - {invoice.get('total', 0)}"
        msg['From'] = sender_email
        msg['To'] = to_email
        
        if cc_emails:
            msg['Cc'] = ', '.join(cc_emails)
        
        # Email body
        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Invoice {invoice.get('invoice_number', 'N/A')}</h2>
            
            <p>{custom_message or 'Please find your invoice details below.'}</p>
            
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">{invoice.get('invoice_number', 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">{invoice.get('date', 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">{invoice.get('due_date', 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 18px; font-weight: bold;">${invoice.get('total', 0):.2f}</td>
              </tr>
            </table>
            
            <p>Thank you for your business!</p>
            
            <p style="color: #666; font-size: 12px;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </body>
        </html>
        """
        
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            recipients = [to_email] + (cc_emails or [])
            server.send_message(msg, from_addr=sender_email, to_addrs=recipients)
        
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending email: {str(e)}"
        )

# ==================== ROUTES ====================

@router.get("/dashboard/metrics")
async def get_ar_dashboard():
    """Get AR dashboard metrics"""
    try:
        # Total outstanding
        outstanding_invoices = await invoices_collection.find({
            "status": {"$in": ["sent", "overdue", "partial"]},
            "balance": {"$gt": 0}
        }).to_list(length=1000)
        
        total_outstanding = sum(inv.get("balance", 0) for inv in outstanding_invoices)
        
        # Overdue invoices
        overdue_invoices = await invoices_collection.find({
            "status": {"$in": ["overdue"]},
            "balance": {"$gt": 0}
        }).to_list(length=1000)
        
        overdue_amount = sum(inv.get("balance", 0) for inv in overdue_invoices)
        
        # Due soon (next 7 days)
        due_soon_date = datetime.now() + timedelta(days=7)
        due_soon = await invoices_collection.find({
            "status": "sent",
            "due_date": {"$lte": due_soon_date.isoformat()},
            "balance": {"$gt": 0}
        }).to_list(length=100)
        
        due_soon_amount = sum(inv.get("balance", 0) for inv in due_soon)
        
        # This month's revenue (paid invoices)
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_payments = await customer_payments_collection.find({
            "payment_date": {"$gte": start_of_month.isoformat()}
        }).to_list(length=1000)
        
        month_revenue = sum(payment.get("amount", 0) for payment in month_payments)
        
        # Average days to pay
        paid_invoices = await invoices_collection.find({
            "status": "paid",
            "paid_date": {"$exists": True}
        }).limit(100).to_list(length=100)
        
        avg_days_to_pay = 0
        if paid_invoices:
            total_days = 0
            for inv in paid_invoices:
                try:
                    invoice_date = datetime.fromisoformat(inv.get("date", ""))
                    paid_date = datetime.fromisoformat(inv.get("paid_date", ""))
                    days = (paid_date - invoice_date).days
                    total_days += days
                except:
                    pass
            avg_days_to_pay = total_days / len(paid_invoices) if paid_invoices else 0
        
        return {
            "success": True,
            "metrics": {
                "total_outstanding": total_outstanding,
                "invoices_count": len(outstanding_invoices),
                "overdue": {
                    "amount": overdue_amount,
                    "count": len(overdue_invoices)
                },
                "due_soon": {
                    "amount": due_soon_amount,
                    "count": len(due_soon)
                },
                "month_revenue": month_revenue,
                "avg_days_to_pay": round(avg_days_to_pay, 1)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching AR metrics: {str(e)}"
        )

@router.get("/aging")
async def get_ar_aging():
    """Generate accounts receivable aging report"""
    try:
        today = datetime.now()
        
        # Initialize aging buckets
        aging = {
            "current": {"count": 0, "amount": 0.0, "invoices": []},
            "1-30": {"count": 0, "amount": 0.0, "invoices": []},
            "31-60": {"count": 0, "amount": 0.0, "invoices": []},
            "61-90": {"count": 0, "amount": 0.0, "invoices": []},
            "90+": {"count": 0, "amount": 0.0, "invoices": []}
        }
        
        # Get all outstanding invoices
        outstanding_invoices = await invoices_collection.find({
            "status": {"$in": ["sent", "overdue", "partial"]},
            "balance": {"$gt": 0}
        }).to_list(length=1000)
        
        for invoice in outstanding_invoices:
            invoice["_id"] = str(invoice["_id"])
            due_date = datetime.fromisoformat(invoice.get("due_date", today.isoformat()))
            days_overdue = (today - due_date).days
            
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
            aging[bucket]["amount"] += invoice.get("balance", 0)
            aging[bucket]["invoices"].append({
                "invoice_id": invoice["_id"],
                "invoice_number": invoice.get("invoice_number", ""),
                "customer_name": invoice.get("customer_name", ""),
                "balance": invoice.get("balance", 0),
                "due_date": invoice.get("due_date", ""),
                "days_overdue": max(0, days_overdue)
            })
        
        total_outstanding = sum(bucket["amount"] for bucket in aging.values())
        
        return {
            "success": True,
            "aging": aging,
            "total_outstanding": total_outstanding,
            "as_of_date": today.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating aging report: {str(e)}"
        )

@router.post("/invoices/{invoice_id}/send-email")
async def send_invoice_via_email(invoice_id: str, email_request: EmailInvoiceRequest):
    """Send invoice via email"""
    try:
        invoice = await invoices_collection.find_one({"_id": ObjectId(invoice_id)})
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Send email
        send_invoice_email(
            invoice=invoice,
            to_email=email_request.to_email,
            cc_emails=email_request.cc_emails,
            custom_message=email_request.message
        )
        
        # Update invoice status to 'sent' if it's draft
        if invoice.get("status") == "draft":
            await invoices_collection.update_one(
                {"_id": ObjectId(invoice_id)},
                {"$set": {
                    "status": "sent",
                    "sent_date": datetime.now().isoformat(),
                    "sent_to": email_request.to_email
                }}
            )
        
        return {
            "success": True,
            "message": f"Invoice sent to {email_request.to_email}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending invoice: {str(e)}"
        )

@router.post("/invoices/{invoice_id}/send-reminder")
async def send_payment_reminder(invoice_id: str, email_request: EmailInvoiceRequest):
    """Send payment reminder for overdue invoice"""
    try:
        invoice = await invoices_collection.find_one({"_id": ObjectId(invoice_id)})
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Send reminder email (customize message)
        custom_message = email_request.message or f"This is a friendly reminder that Invoice {invoice.get('invoice_number')} is now overdue. Please remit payment at your earliest convenience."
        
        send_invoice_email(
            invoice=invoice,
            to_email=email_request.to_email,
            cc_emails=email_request.cc_emails,
            custom_message=custom_message
        )
        
        # Log reminder sent
        await invoices_collection.update_one(
            {"_id": ObjectId(invoice_id)},
            {"$push": {
                "reminders_sent": {
                    "date": datetime.now().isoformat(),
                    "sent_to": email_request.to_email
                }
            }}
        )
        
        return {
            "success": True,
            "message": f"Payment reminder sent to {email_request.to_email}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending reminder: {str(e)}"
        )

@router.post("/payments")
async def record_customer_payment(payment: PaymentCreate):
    """Record customer payment and apply to invoices"""
    try:
        # Verify customer exists
        customer = await get_customer_by_id(payment.customer_id)
        
        # Validate payment amount matches applied amounts
        total_applied = sum(inv["amount_applied"] for inv in payment.invoices_paid)
        
        if abs(total_applied - payment.amount) > 0.01:  # Allow for rounding
            unapplied_amount = payment.amount - total_applied
        else:
            unapplied_amount = 0
        
        # Create payment record
        payment_doc = {
            "customer_id": payment.customer_id,
            "customer_name": customer.get("name", ""),
            "payment_date": payment.payment_date.isoformat(),
            "payment_method": payment.payment_method,
            "reference_number": payment.reference_number,
            "amount": payment.amount,
            "invoices_paid": payment.invoices_paid,
            "unapplied_amount": unapplied_amount,
            "deposit_to": payment.deposit_to,
            "memo": payment.memo,
            "status": "deposited",
            "created_at": datetime.now().isoformat()
        }
        
        result = await customer_payments_collection.insert_one(payment_doc)
        
        # Update each invoice
        for inv_payment in payment.invoices_paid:
            invoice = await invoices_collection.find_one({"_id": ObjectId(inv_payment["invoice_id"])})
            
            if invoice:
                new_balance = invoice.get("balance", invoice.get("total", 0)) - inv_payment["amount_applied"]
                new_status = "paid" if new_balance <= 0.01 else "partial"
                
                update_data = {
                    "balance": max(0, new_balance),
                    "status": new_status,
                    "updated_at": datetime.now().isoformat()
                }
                
                if new_status == "paid":
                    update_data["paid_date"] = payment.payment_date.isoformat()
                
                await invoices_collection.update_one(
                    {"_id": ObjectId(inv_payment["invoice_id"])},
                    {"$set": update_data}
                )
        
        return {
            "success": True,
            "message": "Payment recorded successfully",
            "payment_id": str(result.inserted_id),
            "unapplied_amount": unapplied_amount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recording payment: {str(e)}"
        )

@router.get("/customers/{customer_id}/credit-limit")
async def get_customer_credit_limit(customer_id: str):
    """Get customer credit limit and current balance"""
    try:
        customer = await get_customer_by_id(customer_id)
        
        # Calculate outstanding balance
        outstanding_invoices = await invoices_collection.find({
            "customer_id": customer_id,
            "status": {"$in": ["sent", "overdue", "partial"]},
            "balance": {"$gt": 0}
        }).to_list(length=1000)
        
        outstanding_balance = sum(inv.get("balance", 0) for inv in outstanding_invoices)
        
        credit_limit = customer.get("credit_limit", 0)
        available_credit = max(0, credit_limit - outstanding_balance)
        
        return {
            "success": True,
            "customer_id": customer_id,
            "customer_name": customer.get("name", ""),
            "credit_limit": credit_limit,
            "outstanding_balance": outstanding_balance,
            "available_credit": available_credit,
            "credit_status": "ok" if outstanding_balance <= credit_limit else "over_limit"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching credit limit: {str(e)}"
        )

@router.put("/customers/{customer_id}/credit-limit")
async def update_customer_credit_limit(customer_id: str, credit_update: CreditLimitUpdate):
    """Update customer credit limit"""
    try:
        customer = await get_customer_by_id(customer_id)
        
        await customers_collection.update_one(
            {"_id": ObjectId(customer_id)},
            {"$set": {
                "credit_limit": credit_update.credit_limit,
                "updated_at": datetime.now().isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Credit limit updated successfully",
            "new_credit_limit": credit_update.credit_limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating credit limit: {str(e)}"
        )

@router.post("/credit-memos")
async def create_credit_memo(credit_memo: CreditMemoCreate):
    """Create a credit memo for a customer"""
    try:
        customer = await get_customer_by_id(credit_memo.customer_id)
        
        memo_doc = {
            "customer_id": credit_memo.customer_id,
            "customer_name": customer.get("name", ""),
            "memo_date": credit_memo.memo_date.isoformat(),
            "reason": credit_memo.reason,
            "amount": credit_memo.amount,
            "applied_to_invoices": credit_memo.applied_to_invoices,
            "status": "pending" if not credit_memo.applied_to_invoices else "applied",
            "created_at": datetime.now().isoformat()
        }
        
        result = await credit_memos_collection.insert_one(memo_doc)
        
        # Apply to invoices if specified
        for inv_credit in credit_memo.applied_to_invoices:
            invoice = await invoices_collection.find_one({"_id": ObjectId(inv_credit["invoice_id"])})
            
            if invoice:
                new_balance = invoice.get("balance", invoice.get("total", 0)) - inv_credit["amount_applied"]
                new_status = "paid" if new_balance <= 0.01 else "partial"
                
                await invoices_collection.update_one(
                    {"_id": ObjectId(inv_credit["invoice_id"])},
                    {"$set": {
                        "balance": max(0, new_balance),
                        "status": new_status,
                        "updated_at": datetime.now().isoformat()
                    }}
                )
        
        return {
            "success": True,
            "message": "Credit memo created successfully",
            "memo_id": str(result.inserted_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating credit memo: {str(e)}"
        )

@router.get("/overdue-invoices")
async def get_overdue_invoices():
    """Get all overdue invoices for collection"""
    try:
        overdue = await invoices_collection.find({
            "status": {"$in": ["overdue"]},
            "balance": {"$gt": 0}
        }).sort("due_date", 1).to_list(length=1000)
        
        for invoice in overdue:
            invoice["_id"] = str(invoice["_id"])
            
            # Calculate days overdue
            due_date = datetime.fromisoformat(invoice.get("due_date", datetime.now().isoformat()))
            days_overdue = (datetime.now() - due_date).days
            invoice["days_overdue"] = max(0, days_overdue)
        
        total_overdue = sum(inv.get("balance", 0) for inv in overdue)
        
        return {
            "success": True,
            "overdue_invoices": overdue,
            "total_overdue": total_overdue,
            "count": len(overdue)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching overdue invoices: {str(e)}"
        )
