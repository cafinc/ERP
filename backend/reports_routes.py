"""
Reports Routes - Generate various business reports and analytics
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from server import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ReportRequest(BaseModel):
    report_type: str
    start_date: str
    end_date: str
    format: Optional[str] = 'json'  # json, pdf, csv

class ScheduleReportRequest(BaseModel):
    report_type: str
    frequency: str  # daily, weekly, monthly
    email: str
    active: bool = True

@router.post("/reports/generate")
async def generate_report(request: ReportRequest):
    """Generate a report based on type and date range"""
    try:
        start_date = datetime.fromisoformat(request.start_date)
        end_date = datetime.fromisoformat(request.end_date)
        
        report_data = {}
        
        if request.report_type == 'daily_operations':
            report_data = await generate_daily_operations_report(start_date, end_date)
        elif request.report_type == 'weekly_financial':
            report_data = await generate_financial_report(start_date, end_date)
        elif request.report_type == 'monthly_customer':
            report_data = await generate_customer_analytics_report(start_date, end_date)
        elif request.report_type == 'project_performance':
            report_data = await generate_project_performance_report(start_date, end_date)
        elif request.report_type == 'service_analytics':
            report_data = await generate_service_analytics_report(start_date, end_date)
        elif request.report_type == 'crew_productivity':
            report_data = await generate_crew_productivity_report(start_date, end_date)
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")
        
        return {
            "success": True,
            "report_type": request.report_type,
            "date_range": {
                "start": request.start_date,
                "end": request.end_date
            },
            "generated_at": datetime.utcnow().isoformat(),
            "data": report_data
        }
        
    except ValueError as e:
        logger.error(f"Invalid date format: {e}")
        raise HTTPException(status_code=400, detail="Invalid date format")
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_daily_operations_report(start_date: datetime, end_date: datetime):
    """Generate daily operations summary"""
    # Get dispatches
    dispatches = await db.dispatches.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    # Get completed services
    completed_services = await db.site_service_history.count_documents({
        "service_date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()},
        "status": "completed"
    })
    
    # Get work orders
    work_orders = await db.work_orders.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    completed_work_orders = await db.work_orders.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date},
        "status": "completed"
    })
    
    # Get crew shifts
    shifts = await db.shifts.find({
        "start_time": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)
    
    total_hours = sum(shift.get('duration_hours', 0) for shift in shifts)
    
    return {
        "total_dispatches": dispatches,
        "services_completed": completed_services,
        "work_orders_created": work_orders,
        "work_orders_completed": completed_work_orders,
        "completion_rate": round((completed_work_orders / work_orders * 100) if work_orders > 0 else 0, 2),
        "crew_hours_logged": round(total_hours, 2),
        "active_crews": len(set(shift.get('crew_id') for shift in shifts if shift.get('crew_id')))
    }

async def generate_financial_report(start_date: datetime, end_date: datetime):
    """Generate financial report"""
    # Get invoices
    invoices = await db.invoices.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    total_revenue = sum(inv.get('total_amount', 0) for inv in invoices)
    total_paid = sum(inv.get('amount_paid', 0) for inv in invoices)
    total_outstanding = sum(inv.get('amount_due', 0) for inv in invoices)
    
    # Get estimates
    estimates = await db.estimates.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    accepted_estimates = await db.estimates.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date},
        "status": "accepted"
    })
    
    return {
        "total_revenue": round(total_revenue, 2),
        "amount_collected": round(total_paid, 2),
        "outstanding_balance": round(total_outstanding, 2),
        "total_invoices": len(invoices),
        "paid_invoices": len([inv for inv in invoices if inv.get('status') == 'paid']),
        "overdue_invoices": len([inv for inv in invoices if inv.get('status') == 'overdue']),
        "estimates_sent": estimates,
        "estimates_accepted": accepted_estimates,
        "conversion_rate": round((accepted_estimates / estimates * 100) if estimates > 0 else 0, 2)
    }

async def generate_customer_analytics_report(start_date: datetime, end_date: datetime):
    """Generate customer analytics report"""
    # New customers
    new_customers = await db.customers.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    # Total active customers
    total_customers = await db.customers.count_documents({"active": True})
    
    # Get all customers for revenue analysis
    customers = await db.customers.find().to_list(10000)
    customers_with_revenue = [c for c in customers if c.get('total_revenue', 0) > 0]
    
    avg_customer_value = sum(c.get('total_revenue', 0) for c in customers_with_revenue) / len(customers_with_revenue) if customers_with_revenue else 0
    
    # Service requests
    service_requests = await db.service_requests.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    return {
        "new_customers": new_customers,
        "total_active_customers": total_customers,
        "avg_customer_lifetime_value": round(avg_customer_value, 2),
        "service_requests": service_requests,
        "top_customers": []  # Could add top 10 by revenue
    }

async def generate_project_performance_report(start_date: datetime, end_date: datetime):
    """Generate project performance report"""
    projects = await db.projects.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    completed_projects = [p for p in projects if p.get('status') == 'completed']
    in_progress_projects = [p for p in projects if p.get('status') == 'in_progress']
    
    total_project_value = sum(p.get('total_amount', 0) for p in projects)
    
    return {
        "total_projects": len(projects),
        "completed_projects": len(completed_projects),
        "in_progress_projects": len(in_progress_projects),
        "completion_rate": round((len(completed_projects) / len(projects) * 100) if projects else 0, 2),
        "total_project_value": round(total_project_value, 2),
        "avg_project_value": round(total_project_value / len(projects), 2) if projects else 0
    }

async def generate_service_analytics_report(start_date: datetime, end_date: datetime):
    """Generate service analytics report"""
    services = await db.site_service_history.find({
        "service_date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    }).to_list(10000)
    
    # Group by service type
    service_breakdown = {}
    for service in services:
        service_type = service.get('service_type', 'Unknown')
        if service_type not in service_breakdown:
            service_breakdown[service_type] = {
                "count": 0,
                "total_hours": 0
            }
        service_breakdown[service_type]["count"] += 1
        service_breakdown[service_type]["total_hours"] += service.get('duration_hours', 0)
    
    return {
        "total_services": len(services),
        "service_breakdown": service_breakdown,
        "avg_service_duration": round(sum(s.get('duration_hours', 0) for s in services) / len(services), 2) if services else 0
    }

async def generate_crew_productivity_report(start_date: datetime, end_date: datetime):
    """Generate crew productivity report"""
    # Get time entries
    time_entries = await db.time_entries.find({
        "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    }).to_list(10000)
    
    total_hours = sum(entry.get('hours_worked', 0) for entry in time_entries)
    
    # Get shifts
    shifts = await db.shifts.find({
        "start_time": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    # Get tasks
    tasks = await db.tasks.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    completed_tasks = await db.tasks.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date},
        "status": "completed"
    })
    
    return {
        "total_hours_logged": round(total_hours, 2),
        "total_shifts": len(shifts),
        "tasks_assigned": tasks,
        "tasks_completed": completed_tasks,
        "completion_rate": round((completed_tasks / tasks * 100) if tasks > 0 else 0, 2),
        "avg_hours_per_shift": round(total_hours / len(shifts), 2) if shifts else 0
    }

@router.post("/reports/schedule")
async def schedule_report(request: ScheduleReportRequest):
    """Schedule a recurring report"""
    try:
        schedule_doc = {
            "report_type": request.report_type,
            "frequency": request.frequency,
            "email": request.email,
            "active": request.active,
            "created_at": datetime.utcnow(),
            "last_sent": None,
            "next_send": calculate_next_send_date(request.frequency)
        }
        
        result = await db.report_schedules.insert_one(schedule_doc)
        schedule_doc['id'] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": f"Report scheduled successfully. Will be sent {request.frequency} to {request.email}",
            "schedule": schedule_doc
        }
        
    except Exception as e:
        logger.error(f"Error scheduling report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/schedules")
async def get_scheduled_reports():
    """Get all scheduled reports"""
    try:
        schedules = await db.report_schedules.find().to_list(1000)
        
        for schedule in schedules:
            schedule['id'] = str(schedule.pop('_id'))
        
        return {"success": True, "schedules": schedules}
        
    except Exception as e:
        logger.error(f"Error fetching scheduled reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/schedules/{schedule_id}")
async def delete_scheduled_report(schedule_id: str):
    """Delete a scheduled report"""
    try:
        result = await db.report_schedules.delete_one({"_id": ObjectId(schedule_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        return {"success": True, "message": "Schedule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_next_send_date(frequency: str) -> datetime:
    """Calculate the next send date based on frequency"""
    now = datetime.utcnow()
    
    if frequency == 'daily':
        return now + timedelta(days=1)
    elif frequency == 'weekly':
        return now + timedelta(weeks=1)
    elif frequency == 'monthly':
        return now + timedelta(days=30)
    else:
        return now + timedelta(days=1)
