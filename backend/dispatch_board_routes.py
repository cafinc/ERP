#!/usr/bin/env python3
"""
Dispatch Planning Board Backend
Visual dispatch management with real-time updates
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from realtime_service import realtime_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dispatch-board", tags=["Dispatch Planning Board"])

# MongoDB collections (imported from main)
from server import db

work_orders_collection = db.work_orders
crews_collection = db.hr_employees
sites_collection = db.sites

# ========== Request Models ==========

class AssignCrewRequest(BaseModel):
    work_order_id: str
    crew_id: str
    scheduled_start: str
    estimated_duration_hours: float


class UpdateDispatchRequest(BaseModel):
    work_order_id: str
    scheduled_start: Optional[str] = None
    estimated_duration_hours: Optional[float] = None
    priority: Optional[str] = None  # low, normal, high, urgent
    notes: Optional[str] = None


class BatchAssignRequest(BaseModel):
    assignments: List[Dict[str, str]]  # [{work_order_id, crew_id, scheduled_start}, ...]


# ========== Get Dispatch Board ==========

@router.get("/board")
async def get_dispatch_board(
    date: Optional[str] = None,
    view: str = "day"  # day, week, month
):
    """
    Get dispatch board with all work orders and crew availability
    Returns structured data for visual board
    """
    try:
        # Parse date or use today
        if date:
            target_date = datetime.fromisoformat(date)
        else:
            target_date = datetime.utcnow()
        
        # Calculate date range based on view
        if view == "day":
            start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
        elif view == "week":
            # Start from Monday
            start_date = target_date - timedelta(days=target_date.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=7)
        else:  # month
            start_date = target_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if target_date.month == 12:
                end_date = start_date.replace(year=target_date.year + 1, month=1)
            else:
                end_date = start_date.replace(month=target_date.month + 1)
        
        # Get work orders for date range
        work_orders_cursor = work_orders_collection.find({
            "scheduled_start": {
                "$gte": start_date,
                "$lt": end_date
            }
        }).sort("scheduled_start", 1)
        
        work_orders = await work_orders_cursor.to_list(None)
        
        # Get all active crews
        crews_cursor = crews_collection.find({
            "role": "crew",
            "status": {"$in": ["active", "available"]}
        })
        crews = await crews_cursor.to_list(None)
        
        # Format work orders
        formatted_work_orders = []
        for wo in work_orders:
            formatted_work_orders.append({
                "id": str(wo["_id"]),
                "customer_id": wo.get("customer_id"),
                "customer_name": wo.get("customer_name"),
                "site_id": wo.get("site_id"),
                "site_address": wo.get("site_address"),
                "service_type": wo.get("service_type"),
                "status": wo.get("status"),
                "priority": wo.get("priority", "normal"),
                "assigned_crew_id": wo.get("assigned_crew_id"),
                "assigned_crew_name": wo.get("assigned_crew_name"),
                "scheduled_start": wo.get("scheduled_start").isoformat() if wo.get("scheduled_start") else None,
                "scheduled_end": wo.get("scheduled_end").isoformat() if wo.get("scheduled_end") else None,
                "estimated_duration_hours": wo.get("estimated_duration_hours", 2.0),
                "weather_triggered": wo.get("weather_triggered", False),
                "notes": wo.get("notes"),
                "created_at": wo.get("created_at").isoformat() if wo.get("created_at") else None,
            })
        
        # Format crews with availability
        formatted_crews = []
        for crew in crews:
            # Count assigned work orders
            assigned_count = sum(
                1 for wo in formatted_work_orders
                if wo.get("assigned_crew_id") == str(crew["_id"])
            )
            
            formatted_crews.append({
                "id": str(crew["_id"]),
                "name": crew.get("name"),
                "role": crew.get("role"),
                "status": crew.get("status"),
                "skills": crew.get("skills", []),
                "current_location": crew.get("current_location"),
                "assigned_work_orders": assigned_count,
                "availability": "available" if assigned_count == 0 else "busy",
            })
        
        # Group work orders by status
        unassigned = [wo for wo in formatted_work_orders if not wo.get("assigned_crew_id")]
        assigned = [wo for wo in formatted_work_orders if wo.get("assigned_crew_id") and wo.get("status") in ["pending", "scheduled"]]
        in_progress = [wo for wo in formatted_work_orders if wo.get("status") == "in_progress"]
        completed = [wo for wo in formatted_work_orders if wo.get("status") == "completed"]
        
        return {
            "success": True,
            "view": view,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "summary": {
                "total_work_orders": len(formatted_work_orders),
                "unassigned": len(unassigned),
                "assigned": len(assigned),
                "in_progress": len(in_progress),
                "completed": len(completed),
                "total_crews": len(formatted_crews),
                "available_crews": sum(1 for c in formatted_crews if c["availability"] == "available"),
            },
            "work_orders": {
                "unassigned": unassigned,
                "assigned": assigned,
                "in_progress": in_progress,
                "completed": completed,
            },
            "crews": formatted_crews,
        }
        
    except Exception as e:
        logger.error(f"Error getting dispatch board: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Assign Crew to Work Order ==========

@router.post("/assign-crew")
async def assign_crew_to_work_order(request: AssignCrewRequest):
    """
    Assign a crew to a work order
    Updates work order and sends real-time notification
    """
    try:
        # Validate work order exists
        work_order = await work_orders_collection.find_one({"_id": ObjectId(request.work_order_id)})
        if not work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        # Validate crew exists
        crew = await crews_collection.find_one({"_id": ObjectId(request.crew_id)})
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        
        # Parse scheduled start
        scheduled_start = datetime.fromisoformat(request.scheduled_start)
        scheduled_end = scheduled_start + timedelta(hours=request.estimated_duration_hours)
        
        # Check for conflicts
        conflicts = await work_orders_collection.count_documents({
            "assigned_crew_id": request.crew_id,
            "status": {"$in": ["scheduled", "in_progress"]},
            "$or": [
                {
                    "scheduled_start": {"$lte": scheduled_end},
                    "scheduled_end": {"$gte": scheduled_start}
                }
            ]
        })
        
        if conflicts > 0:
            logger.warning(f"Crew {request.crew_id} has {conflicts} conflicting assignments")
        
        # Update work order
        update_data = {
            "assigned_crew_id": request.crew_id,
            "assigned_crew_name": crew.get("name"),
            "scheduled_start": scheduled_start,
            "scheduled_end": scheduled_end,
            "estimated_duration_hours": request.estimated_duration_hours,
            "status": "scheduled",
            "updated_at": datetime.utcnow(),
        }
        
        result = await work_orders_collection.update_one(
            {"_id": ObjectId(request.work_order_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to assign crew")
        
        # Send real-time notification
        await realtime_service.emit_event({
            "type": "work_order_assigned",
            "work_order_id": request.work_order_id,
            "crew_id": request.crew_id,
            "crew_name": crew.get("name"),
            "scheduled_start": scheduled_start.isoformat(),
            "has_conflicts": conflicts > 0,
        })
        
        logger.info(f"Assigned crew {request.crew_id} to work order {request.work_order_id}")
        
        return {
            "success": True,
            "message": "Crew assigned successfully",
            "work_order_id": request.work_order_id,
            "crew_id": request.crew_id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
            "conflicts": conflicts,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning crew: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Unassign Crew ==========

@router.post("/unassign-crew/{work_order_id}")
async def unassign_crew(work_order_id: str):
    """Unassign crew from work order"""
    try:
        work_order = await work_orders_collection.find_one({"_id": ObjectId(work_order_id)})
        if not work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        result = await work_orders_collection.update_one(
            {"_id": ObjectId(work_order_id)},
            {
                "$unset": {
                    "assigned_crew_id": "",
                    "assigned_crew_name": "",
                },
                "$set": {
                    "status": "pending",
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        
        if result.modified_count > 0:
            # Send real-time notification
            await realtime_service.emit_event({
                "type": "work_order_unassigned",
                "work_order_id": work_order_id,
            })
        
        return {
            "success": True,
            "message": "Crew unassigned successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unassigning crew: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Update Dispatch Details ==========

@router.put("/update")
async def update_dispatch(request: UpdateDispatchRequest):
    """Update dispatch details (time, priority, notes)"""
    try:
        update_data = {"updated_at": datetime.utcnow()}
        
        if request.scheduled_start:
            scheduled_start = datetime.fromisoformat(request.scheduled_start)
            update_data["scheduled_start"] = scheduled_start
            
            if request.estimated_duration_hours:
                update_data["scheduled_end"] = scheduled_start + timedelta(hours=request.estimated_duration_hours)
                update_data["estimated_duration_hours"] = request.estimated_duration_hours
        
        if request.priority:
            update_data["priority"] = request.priority
        
        if request.notes is not None:
            update_data["notes"] = request.notes
        
        result = await work_orders_collection.update_one(
            {"_id": ObjectId(request.work_order_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            # Send real-time notification
            await realtime_service.emit_event({
                "type": "dispatch_updated",
                "work_order_id": request.work_order_id,
                "updates": update_data,
            })
        
        return {
            "success": True,
            "message": "Dispatch updated successfully",
        }
        
    except Exception as e:
        logger.error(f"Error updating dispatch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Batch Assign ==========

@router.post("/batch-assign")
async def batch_assign_crews(request: BatchAssignRequest, background_tasks: BackgroundTasks):
    """
    Batch assign multiple crews to work orders
    Useful for auto-optimization
    """
    try:
        results = []
        
        for assignment in request.assignments:
            try:
                # Call assign_crew for each assignment
                assign_request = AssignCrewRequest(
                    work_order_id=assignment["work_order_id"],
                    crew_id=assignment["crew_id"],
                    scheduled_start=assignment["scheduled_start"],
                    estimated_duration_hours=assignment.get("estimated_duration_hours", 2.0),
                )
                
                result = await assign_crew_to_work_order(assign_request)
                results.append({
                    "work_order_id": assignment["work_order_id"],
                    "success": True,
                    "conflicts": result.get("conflicts", 0),
                })
                
            except Exception as e:
                results.append({
                    "work_order_id": assignment["work_order_id"],
                    "success": False,
                    "error": str(e),
                })
        
        success_count = sum(1 for r in results if r["success"])
        
        return {
            "success": True,
            "message": f"Batch assignment completed: {success_count}/{len(results)} successful",
            "results": results,
        }
        
    except Exception as e:
        logger.error(f"Error in batch assign: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Get Crew Schedule ==========

@router.get("/crew-schedule/{crew_id}")
async def get_crew_schedule(crew_id: str, days: int = 7):
    """Get schedule for a specific crew"""
    try:
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=days)
        
        work_orders_cursor = work_orders_collection.find({
            "assigned_crew_id": crew_id,
            "scheduled_start": {
                "$gte": start_date,
                "$lt": end_date
            }
        }).sort("scheduled_start", 1)
        
        work_orders = await work_orders_cursor.to_list(None)
        
        formatted = []
        for wo in work_orders:
            formatted.append({
                "id": str(wo["_id"]),
                "customer_name": wo.get("customer_name"),
                "site_address": wo.get("site_address"),
                "service_type": wo.get("service_type"),
                "status": wo.get("status"),
                "scheduled_start": wo.get("scheduled_start").isoformat() if wo.get("scheduled_start") else None,
                "scheduled_end": wo.get("scheduled_end").isoformat() if wo.get("scheduled_end") else None,
                "estimated_duration_hours": wo.get("estimated_duration_hours", 2.0),
            })
        
        return {
            "success": True,
            "crew_id": crew_id,
            "schedule": formatted,
            "total": len(formatted),
        }
        
    except Exception as e:
        logger.error(f"Error getting crew schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Optimize Schedule ==========

@router.post("/optimize")
async def optimize_dispatch_schedule(date: Optional[str] = None):
    """
    Auto-optimize dispatch schedule
    Simple algorithm: assign based on proximity and availability
    """
    try:
        # This is a simplified optimization
        # In production, use more sophisticated algorithms
        
        target_date = datetime.fromisoformat(date) if date else datetime.utcnow()
        start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        # Get unassigned work orders
        unassigned_cursor = work_orders_collection.find({
            "scheduled_start": {
                "$gte": start_date,
                "$lt": end_date
            },
            "assigned_crew_id": {"$exists": False}
        }).sort([("priority", -1), ("created_at", 1)])
        
        unassigned = await unassigned_cursor.to_list(None)
        
        # Get available crews
        crews_cursor = crews_collection.find({
            "role": "crew",
            "status": "active"
        })
        crews = await crews_cursor.to_list(None)
        
        assignments = []
        crew_schedules = {str(crew["_id"]): [] for crew in crews}
        
        for wo in unassigned:
            # Simple assignment: round-robin
            available_crew = min(
                crew_schedules.items(),
                key=lambda x: len(x[1])
            )
            
            crew_id = available_crew[0]
            
            # Schedule at 8 AM + 2 hours per existing assignment
            scheduled_start = start_date.replace(hour=8) + timedelta(hours=len(available_crew[1]) * 2)
            
            assignments.append({
                "work_order_id": str(wo["_id"]),
                "crew_id": crew_id,
                "scheduled_start": scheduled_start.isoformat(),
                "estimated_duration_hours": wo.get("estimated_duration_hours", 2.0),
            })
            
            crew_schedules[crew_id].append(wo)
        
        if assignments:
            # Apply batch assignments
            batch_request = BatchAssignRequest(assignments=assignments)
            result = await batch_assign_crews(batch_request, None)
            
            return result
        else:
            return {
                "success": True,
                "message": "No unassigned work orders to optimize",
                "assignments": 0,
            }
        
    except Exception as e:
        logger.error(f"Error optimizing schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


logger.info("Dispatch planning board routes initialized successfully")
