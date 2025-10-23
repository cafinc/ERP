#!/usr/bin/env python3
"""
Analytics Routes - API Endpoints for business intelligence and metrics
"""

import logging
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from analytics_service import analytics_service

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_overview(
    days: int = Query(30, description="Number of days to analyze")
):
    """Get comprehensive dashboard overview with all key metrics"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        result = await analytics_service.get_dashboard_overview(start_date, end_date)
        return result
    except Exception as e:
        logger.error(f"Error getting dashboard: {e}")
        return {"success": False, "error": str(e)}

@router.get("/revenue/trends")
async def get_revenue_trends(
    days: int = Query(30, description="Number of days for trend analysis")
):
    """Get daily revenue trends for charts"""
    try:
        result = await analytics_service.get_revenue_trends(days)
        return result
    except Exception as e:
        logger.error(f"Error getting revenue trends: {e}")
        return {"success": False, "error": str(e)}

@router.get("/customers/top")
async def get_top_customers(
    limit: int = Query(10, le=50, description="Number of top customers to return")
):
    """Get top customers by revenue"""
    try:
        result = await analytics_service.get_top_customers(limit)
        return result
    except Exception as e:
        logger.error(f"Error getting top customers: {e}")
        return {"success": False, "error": str(e)}

@router.get("/services/breakdown")
async def get_service_breakdown():
    """Get revenue breakdown by service type"""
    try:
        result = await analytics_service.get_service_type_breakdown()
        return result
    except Exception as e:
        logger.error(f"Error getting service breakdown: {e}")
        return {"success": False, "error": str(e)}

logger.info("Analytics routes initialized successfully")
