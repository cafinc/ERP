#!/usr/bin/env python3
"""
Analytics Service - Business Intelligence & Performance Metrics
Provides comprehensive analytics for operations, finance, crew, and customer insights
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Collections
work_orders_collection = db["work_orders"]
projects_collection = db["projects"]
invoices_collection = db["invoices"]
customers_collection = db["customers"]
employees_collection = db["employees"]
time_entries_collection = db["time_entries"]
equipment_collection = db["equipment"]
estimates_collection = db["estimates"]

class AnalyticsService:
    """Comprehensive business analytics and intelligence"""
    
    @staticmethod
    async def get_dashboard_overview(
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """
        Get high-level dashboard overview with key metrics
        """
        try:
            # Default to last 30 days
            if not end_date:
                end_date = datetime.utcnow()
            if not start_date:
                start_date = end_date - timedelta(days=30)
            
            date_query = {
                "created_at": {"$gte": start_date, "$lte": end_date}
            }
            
            # Revenue metrics
            revenue_data = await AnalyticsService._calculate_revenue_metrics(start_date, end_date)
            
            # Operations metrics
            operations_data = await AnalyticsService._calculate_operations_metrics(start_date, end_date)
            
            # Customer metrics
            customer_data = await AnalyticsService._calculate_customer_metrics(start_date, end_date)
            
            # Crew metrics
            crew_data = await AnalyticsService._calculate_crew_metrics(start_date, end_date)
            
            # Project metrics
            project_data = await AnalyticsService._calculate_project_metrics(start_date, end_date)
            
            return {
                "success": True,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "days": (end_date - start_date).days
                },
                "revenue": revenue_data,
                "operations": operations_data,
                "customers": customer_data,
                "crew": crew_data,
                "projects": project_data
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard overview: {e}")
            raise
    
    @staticmethod
    async def _calculate_revenue_metrics(start_date: datetime, end_date: datetime) -> Dict:
        """Calculate revenue and financial metrics"""
        date_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
        
        # Total invoices
        invoices = await invoices_collection.find(date_query).to_list(10000)
        
        total_invoiced = sum(inv.get("total_amount", 0) for inv in invoices)
        paid_invoices = [inv for inv in invoices if inv.get("status") == "paid"]
        total_paid = sum(inv.get("total_amount", 0) for inv in paid_invoices)
        outstanding = total_invoiced - total_paid
        
        # Average invoice value
        avg_invoice = total_invoiced / len(invoices) if invoices else 0
        
        # Calculate growth (compare to previous period)
        prev_start = start_date - (end_date - start_date)
        prev_invoices = await invoices_collection.find({
            "created_at": {"$gte": prev_start, "$lt": start_date}
        }).to_list(10000)
        prev_total = sum(inv.get("total_amount", 0) for inv in prev_invoices)
        
        growth_rate = ((total_invoiced - prev_total) / prev_total * 100) if prev_total > 0 else 0
        
        return {
            "total_invoiced": round(total_invoiced, 2),
            "total_paid": round(total_paid, 2),
            "outstanding": round(outstanding, 2),
            "avg_invoice_value": round(avg_invoice, 2),
            "invoice_count": len(invoices),
            "paid_count": len(paid_invoices),
            "payment_rate": round(len(paid_invoices) / len(invoices) * 100, 1) if invoices else 0,
            "growth_rate": round(growth_rate, 1)
        }
    
    @staticmethod
    async def _calculate_operations_metrics(start_date: datetime, end_date: datetime) -> Dict:
        """Calculate operational efficiency metrics"""
        date_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
        
        # Work orders
        work_orders = await work_orders_collection.find(date_query).to_list(10000)
        
        total_wo = len(work_orders)
        completed_wo = sum(1 for wo in work_orders if wo.get("status") == "completed")
        in_progress = sum(1 for wo in work_orders if wo.get("status") == "in_progress")
        pending = sum(1 for wo in work_orders if wo.get("status") == "pending")
        
        completion_rate = (completed_wo / total_wo * 100) if total_wo > 0 else 0
        
        # Calculate average completion time
        completed_with_times = [
            wo for wo in work_orders 
            if wo.get("status") == "completed" and wo.get("completed_at") and wo.get("created_at")
        ]
        
        if completed_with_times:
            total_hours = sum(
                (wo["completed_at"] - wo["created_at"]).total_seconds() / 3600
                for wo in completed_with_times
            )
            avg_completion_hours = total_hours / len(completed_with_times)
        else:
            avg_completion_hours = 0
        
        # Equipment utilization (simplified)
        total_equipment = await equipment_collection.count_documents({})
        
        return {
            "total_work_orders": total_wo,
            "completed": completed_wo,
            "in_progress": in_progress,
            "pending": pending,
            "completion_rate": round(completion_rate, 1),
            "avg_completion_hours": round(avg_completion_hours, 1),
            "total_equipment": total_equipment
        }
    
    @staticmethod
    async def _calculate_customer_metrics(start_date: datetime, end_date: datetime) -> Dict:
        """Calculate customer-related metrics"""
        # New customers in period
        new_customers = await customers_collection.count_documents({
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Total active customers
        total_customers = await customers_collection.count_documents({})
        
        # Customers with recent activity
        active_customers = await work_orders_collection.distinct("customer_id", {
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Average jobs per customer
        work_orders = await work_orders_collection.find({
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)
        
        customer_jobs = {}
        for wo in work_orders:
            cid = wo.get("customer_id")
            customer_jobs[cid] = customer_jobs.get(cid, 0) + 1
        
        avg_jobs_per_customer = sum(customer_jobs.values()) / len(customer_jobs) if customer_jobs else 0
        
        # Customer lifetime value (simplified)
        invoices = await invoices_collection.find({
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)
        
        customer_revenue = {}
        for inv in invoices:
            cid = inv.get("customer_id")
            customer_revenue[cid] = customer_revenue.get(cid, 0) + inv.get("total_amount", 0)
        
        avg_customer_value = sum(customer_revenue.values()) / len(customer_revenue) if customer_revenue else 0
        
        return {
            "total_customers": total_customers,
            "new_customers": new_customers,
            "active_customers": len(active_customers),
            "activity_rate": round(len(active_customers) / total_customers * 100, 1) if total_customers > 0 else 0,
            "avg_jobs_per_customer": round(avg_jobs_per_customer, 1),
            "avg_customer_value": round(avg_customer_value, 2)
        }
    
    @staticmethod
    async def _calculate_crew_metrics(start_date: datetime, end_date: datetime) -> Dict:
        """Calculate crew performance metrics"""
        # Total crew members
        total_crew = await employees_collection.count_documents({
            "department": "Operations"
        })
        
        # Time entries in period
        time_entries = await time_entries_collection.find({
            "clock_in": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)
        
        # Calculate total hours worked
        total_hours = 0
        for entry in time_entries:
            if entry.get("clock_out") and entry.get("clock_in"):
                hours = (entry["clock_out"] - entry["clock_in"]).total_seconds() / 3600
                total_hours += hours
        
        avg_hours_per_crew = total_hours / total_crew if total_crew > 0 else 0
        
        # Work orders per crew
        work_orders = await work_orders_collection.find({
            "created_at": {"$gte": start_date, "$lte": end_date},
            "status": "completed"
        }).to_list(10000)
        
        avg_wo_per_crew = len(work_orders) / total_crew if total_crew > 0 else 0
        
        # Crew utilization rate (hours worked / available hours)
        # Assume 40 hours per week per crew member
        days = (end_date - start_date).days
        available_hours = total_crew * (days / 7) * 40
        utilization = (total_hours / available_hours * 100) if available_hours > 0 else 0
        
        return {
            "total_crew": total_crew,
            "total_hours_worked": round(total_hours, 1),
            "avg_hours_per_crew": round(avg_hours_per_crew, 1),
            "avg_jobs_per_crew": round(avg_wo_per_crew, 1),
            "utilization_rate": round(utilization, 1)
        }
    
    @staticmethod
    async def _calculate_project_metrics(start_date: datetime, end_date: datetime) -> Dict:
        """Calculate project-related metrics"""
        # Projects in period
        projects = await projects_collection.find({
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)
        
        total_projects = len(projects)
        active_projects = sum(1 for p in projects if p.get("status") == "active")
        completed_projects = sum(1 for p in projects if p.get("status") == "completed")
        
        # Budget metrics
        total_budget = sum(p.get("budget", 0) for p in projects)
        total_spent = sum(p.get("total_spent", 0) for p in projects)
        
        budget_utilization = (total_spent / total_budget * 100) if total_budget > 0 else 0
        
        # Average project value
        avg_project_value = total_budget / total_projects if total_projects > 0 else 0
        
        # Project completion rate
        projects_with_status = [p for p in projects if p.get("status") in ["active", "completed", "cancelled"]]
        completion_rate = (completed_projects / len(projects_with_status) * 100) if projects_with_status else 0
        
        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "total_budget": round(total_budget, 2),
            "total_spent": round(total_spent, 2),
            "budget_utilization": round(budget_utilization, 1),
            "avg_project_value": round(avg_project_value, 2),
            "completion_rate": round(completion_rate, 1)
        }
    
    @staticmethod
    async def get_revenue_trends(days: int = 30) -> Dict:
        """Get daily revenue trends for charts"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get invoices in period
            invoices = await invoices_collection.find({
                "created_at": {"$gte": start_date, "$lte": end_date}
            }).to_list(10000)
            
            # Group by day
            daily_revenue = {}
            for inv in invoices:
                day = inv["created_at"].date().isoformat()
                daily_revenue[day] = daily_revenue.get(day, 0) + inv.get("total_amount", 0)
            
            # Fill in missing days with 0
            current_date = start_date.date()
            end = end_date.date()
            trends = []
            
            while current_date <= end:
                day_str = current_date.isoformat()
                trends.append({
                    "date": day_str,
                    "revenue": round(daily_revenue.get(day_str, 0), 2)
                })
                current_date += timedelta(days=1)
            
            return {
                "success": True,
                "trends": trends,
                "total": sum(t["revenue"] for t in trends),
                "average": sum(t["revenue"] for t in trends) / len(trends) if trends else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting revenue trends: {e}")
            raise
    
    @staticmethod
    async def get_top_customers(limit: int = 10) -> Dict:
        """Get top customers by revenue"""
        try:
            # Aggregate invoices by customer
            pipeline = [
                {"$match": {"status": "paid"}},
                {"$group": {
                    "_id": "$customer_id",
                    "total_revenue": {"$sum": "$total_amount"},
                    "invoice_count": {"$sum": 1}
                }},
                {"$sort": {"total_revenue": -1}},
                {"$limit": limit}
            ]
            
            results = await invoices_collection.aggregate(pipeline).to_list(limit)
            
            # Enrich with customer names
            top_customers = []
            for result in results:
                customer = await customers_collection.find_one({
                    "_id": ObjectId(result["_id"])
                })
                
                top_customers.append({
                    "customer_id": result["_id"],
                    "customer_name": customer.get("name", "Unknown") if customer else "Unknown",
                    "total_revenue": round(result["total_revenue"], 2),
                    "invoice_count": result["invoice_count"]
                })
            
            return {
                "success": True,
                "top_customers": top_customers
            }
            
        except Exception as e:
            logger.error(f"Error getting top customers: {e}")
            raise
    
    @staticmethod
    async def get_service_type_breakdown() -> Dict:
        """Get revenue breakdown by service type"""
        try:
            pipeline = [
                {"$group": {
                    "_id": "$service_type",
                    "count": {"$sum": 1},
                    "total_revenue": {"$sum": "$total_amount"}
                }},
                {"$sort": {"total_revenue": -1}}
            ]
            
            results = await invoices_collection.aggregate(pipeline).to_list(100)
            
            breakdown = [
                {
                    "service_type": result["_id"],
                    "count": result["count"],
                    "revenue": round(result["total_revenue"], 2)
                }
                for result in results
            ]
            
            total_revenue = sum(b["revenue"] for b in breakdown)
            
            # Add percentage
            for item in breakdown:
                item["percentage"] = round(item["revenue"] / total_revenue * 100, 1) if total_revenue > 0 else 0
            
            return {
                "success": True,
                "breakdown": breakdown,
                "total_revenue": round(total_revenue, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting service breakdown: {e}")
            raise

# Export singleton instance
analytics_service = AnalyticsService()

logger.info("Analytics service initialized successfully")
