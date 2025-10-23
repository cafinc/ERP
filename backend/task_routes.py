#!/usr/bin/env python3
"""
Task Assignment System Routes
Complete CRUD operations for tasks, comments, and notifications
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

from task_models import (
    Task, TaskCreate, TaskUpdate,
    TaskComment, TaskCommentCreate,
    TaskActivity,
    TaskNotification, NotificationUpdate,
    TaskFilter, TaskStats,
    BulkTaskAssignment, BulkTaskStatusUpdate,
    TaskTemplate, TaskTemplateCreate,
    TaskStatus, TaskPriority, TaskType, NotificationType
)
from notification_service import notification_service
from realtime_service import realtime_service, EventType

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize router
task_router = APIRouter(prefix="/tasks", tags=["tasks"])

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

tasks_collection = db["tasks"]
task_comments_collection = db["task_comments"]
task_activities_collection = db["task_activities"]
task_templates_collection = db["task_templates"]

# ==================== Helper Functions ====================

async def log_task_activity(
    task_id: str,
    user_id: str,
    user_name: str,
    action: str,
    details: dict = None
):
    """Log an activity for a task"""
    try:
        activity = TaskActivity(
            task_id=task_id,
            user_id=user_id,
            user_name=user_name,
            action=action,
            details=details or {},
            timestamp=datetime.now()
        )
        await task_activities_collection.insert_one(activity.dict(exclude={'id'}))
    except Exception as e:
        logger.error(f"Error logging task activity: {e}")

def serialize_task(task_doc: dict) -> dict:
    """Convert MongoDB document to serializable dict"""
    if task_doc:
        task_doc["id"] = str(task_doc.pop("_id"))
        if "created_at" in task_doc and isinstance(task_doc["created_at"], datetime):
            task_doc["created_at"] = task_doc["created_at"].isoformat()
        if "updated_at" in task_doc and isinstance(task_doc["updated_at"], datetime):
            task_doc["updated_at"] = task_doc["updated_at"].isoformat()
        if "due_date" in task_doc and isinstance(task_doc["due_date"], datetime):
            task_doc["due_date"] = task_doc["due_date"].isoformat()
        if "completed_at" in task_doc and isinstance(task_doc["completed_at"], datetime):
            task_doc["completed_at"] = task_doc["completed_at"].isoformat()
    return task_doc

# ==================== Task CRUD Operations ====================

@task_router.post("", response_model=Task)
async def create_task(task_data: TaskCreate):
    """Create a new task and send notifications"""
    try:
        task_dict = task_data.dict()
        task_dict["status"] = TaskStatus.PENDING
        task_dict["created_at"] = datetime.now()
        task_dict["updated_at"] = datetime.now()
        task_dict["watchers"] = list(set(task_dict["assigned_to"] + [task_dict["assigned_by"]]))
        
        result = await tasks_collection.insert_one(task_dict)
        task_id = str(result.inserted_id)
        
        # Log activity
        await log_task_activity(
            task_id=task_id,
            user_id=task_data.assigned_by,
            user_name=task_data.assigned_by_name,
            action="created",
            details={"title": task_data.title, "type": task_data.type}
        )
        
        # Send notifications to assigned users
        if task_data.assigned_to:
            await notification_service.notify_task_assignment(
                task_id=task_id,
                task_title=task_data.title,
                assigned_to=task_data.assigned_to,
                assigned_by_name=task_data.assigned_by_name,
                task_priority=task_data.priority
            )
        
        task_dict["id"] = task_id
        return Task(**serialize_task(task_dict))
        
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@task_router.get("", response_model=List[Task])
async def get_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    assigned_by: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    skip: int = Query(0, ge=0)
):
    """Get tasks with optional filters"""
    try:
        query = {}
        
        if status:
            statuses = status.split(',')
            query["status"] = {"$in": statuses}
        
        if priority:
            priorities = priority.split(',')
            query["priority"] = {"$in": priorities}
        
        if type:
            types = type.split(',')
            query["type"] = {"$in": types}
        
        if assigned_to:
            query["assigned_to"] = assigned_to
        
        if assigned_by:
            query["assigned_by"] = assigned_by
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = tasks_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        tasks = []
        async for doc in cursor:
            tasks.append(Task(**serialize_task(doc)))
        
        return tasks
        
    except Exception as e:
        logger.error(f"Error getting tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get tasks: {str(e)}")

@task_router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str):
    """Get a specific task by ID"""
    try:
        if not ObjectId.is_valid(task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")
        
        task_doc = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        
        if not task_doc:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return Task(**serialize_task(task_doc))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@task_router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    user_id: str = Query(...),
    user_name: str = Query(...)
):
    """Update a task"""
    try:
        if not ObjectId.is_valid(task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")
        
        # Get existing task
        existing_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Prepare update data
        update_data = task_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now()
            
            # Track changes
            changes = {}
            old_status = existing_task.get("status")
            
            for key, value in update_data.items():
                if key in existing_task and existing_task[key] != value:
                    changes[key] = {"old": existing_task[key], "new": value}
            
            # Update the task
            result = await tasks_collection.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                # Log activity
                await log_task_activity(
                    task_id=task_id,
                    user_id=user_id,
                    user_name=user_name,
                    action="updated",
                    details=changes
                )
                
                # Send notifications
                if changes:
                    watchers = existing_task.get("watchers", [])
                    if watchers:
                        await notification_service.notify_task_update(
                            task_id=task_id,
                            task_title=existing_task["title"],
                            updated_by_name=user_name,
                            watchers=watchers,
                            changes=changes
                        )
                
                # Special handling for status changes
                if "status" in update_data and update_data["status"] != old_status:
                    if update_data["status"] == TaskStatus.COMPLETED:
                        await notification_service.notify_task_completion(
                            task_id=task_id,
                            task_title=existing_task["title"],
                            completed_by_name=user_name,
                            watchers=existing_task.get("watchers", [])
                        )
                        # Set completed_at
                        await tasks_collection.update_one(
                            {"_id": ObjectId(task_id)},
                            {"$set": {"completed_at": datetime.now()}}
                        )
                    else:
                        await notification_service.notify_status_change(
                            task_id=task_id,
                            task_title=existing_task["title"],
                            old_status=old_status,
                            new_status=update_data["status"],
                            changed_by_name=user_name,
                            watchers=existing_task.get("watchers", [])
                        )
        
        # Get updated task
        updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        return Task(**serialize_task(updated_task))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@task_router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    try:
        if not ObjectId.is_valid(task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")
        
        result = await tasks_collection.delete_one({"_id": ObjectId(task_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Also delete related comments and activities
        await task_comments_collection.delete_many({"task_id": task_id})
        await task_activities_collection.delete_many({"task_id": task_id})
        
        return {"message": "Task deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

# ==================== Task Comments ====================

@task_router.post("/{task_id}/comments", response_model=TaskComment)
async def add_comment(
    task_id: str,
    comment_data: TaskCommentCreate,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: Optional[str] = Query(None)
):
    """Add a comment to a task"""
    try:
        if not ObjectId.is_valid(task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")
        
        # Verify task exists
        task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        comment = TaskComment(
            task_id=task_id,
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            content=comment_data.content,
            attachments=comment_data.attachments,
            mentions=comment_data.mentions,
            created_at=datetime.now()
        )
        
        result = await task_comments_collection.insert_one(comment.dict(exclude={'id'}))
        comment.id = str(result.inserted_id)
        
        # Log activity
        await log_task_activity(
            task_id=task_id,
            user_id=user_id,
            user_name=user_name,
            action="commented",
            details={"comment_length": len(comment_data.content)}
        )
        
        # Send notifications
        watchers = task.get("watchers", [])
        if watchers or comment_data.mentions:
            await notification_service.notify_task_comment(
                task_id=task_id,
                task_title=task["title"],
                commenter_name=user_name,
                comment_content=comment_data.content,
                mentions=comment_data.mentions,
                watchers=watchers
            )
        
        return comment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add comment: {str(e)}")

@task_router.get("/{task_id}/comments", response_model=List[TaskComment])
async def get_comments(task_id: str):
    """Get all comments for a task"""
    try:
        cursor = task_comments_collection.find({"task_id": task_id}).sort("created_at", 1)
        
        comments = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            comments.append(TaskComment(**doc))
        
        return comments
        
    except Exception as e:
        logger.error(f"Error getting comments: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get comments: {str(e)}")

# ==================== Task Activity Log ====================

@task_router.get("/{task_id}/activities", response_model=List[TaskActivity])
async def get_task_activities(task_id: str):
    """Get activity log for a task"""
    try:
        cursor = task_activities_collection.find({"task_id": task_id}).sort("timestamp", -1)
        
        activities = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            activities.append(TaskActivity(**doc))
        
        return activities
        
    except Exception as e:
        logger.error(f"Error getting activities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get activities: {str(e)}")

# ==================== Task Statistics ====================

@task_router.get("/stats/summary", response_model=TaskStats)
async def get_task_stats(assigned_to: Optional[str] = Query(None)):
    """Get task statistics"""
    try:
        query = {}
        if assigned_to:
            query["assigned_to"] = assigned_to
        
        # Count by status
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        status_counts = {}
        async for doc in tasks_collection.aggregate(pipeline):
            status_counts[doc["_id"]] = doc["count"]
        
        # Count by priority
        pipeline[1]["$group"]["_id"] = "$priority"
        priority_counts = {}
        async for doc in tasks_collection.aggregate(pipeline):
            priority_counts[doc["_id"]] = doc["count"]
        
        # Count by type
        pipeline[1]["$group"]["_id"] = "$type"
        type_counts = {}
        async for doc in tasks_collection.aggregate(pipeline):
            type_counts[doc["_id"]] = doc["count"]
        
        total = sum(status_counts.values())
        pending = status_counts.get("pending", 0)
        in_progress = status_counts.get("in_progress", 0)
        completed = status_counts.get("completed", 0)
        cancelled = status_counts.get("cancelled", 0)
        
        # Calculate overdue
        overdue_count = await tasks_collection.count_documents({
            **query,
            "status": {"$nin": ["completed", "cancelled"]},
            "due_date": {"$lt": datetime.now()}
        })
        
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return TaskStats(
            total=total,
            pending=pending,
            in_progress=in_progress,
            completed=completed,
            cancelled=cancelled,
            overdue=overdue_count,
            by_priority=priority_counts,
            by_type=type_counts,
            completion_rate=completion_rate
        )
        
    except Exception as e:
        logger.error(f"Error getting task stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task stats: {str(e)}")

# ==================== Bulk Operations ====================

@task_router.post("/bulk/assign")
async def bulk_assign_tasks(assignment: BulkTaskAssignment):
    """Assign multiple tasks to users"""
    try:
        task_ids = [ObjectId(tid) for tid in assignment.task_ids if ObjectId.is_valid(tid)]
        
        result = await tasks_collection.update_many(
            {"_id": {"$in": task_ids}},
            {"$set": {"assigned_to": assignment.assigned_to, "updated_at": datetime.now()}}
        )
        
        return {
            "message": f"Updated {result.modified_count} tasks",
            "modified_count": result.modified_count
        }
        
    except Exception as e:
        logger.error(f"Error bulk assigning tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to bulk assign tasks: {str(e)}")

@task_router.post("/bulk/status")
async def bulk_update_status(status_update: BulkTaskStatusUpdate):
    """Update status of multiple tasks"""
    try:
        task_ids = [ObjectId(tid) for tid in status_update.task_ids if ObjectId.is_valid(tid)]
        
        update_data = {
            "status": status_update.status,
            "updated_at": datetime.now()
        }
        
        if status_update.status == TaskStatus.COMPLETED:
            update_data["completed_at"] = datetime.now()
            if status_update.completion_notes:
                update_data["completion_notes"] = status_update.completion_notes
        
        result = await tasks_collection.update_many(
            {"_id": {"$in": task_ids}},
            {"$set": update_data}
        )
        
        return {
            "message": f"Updated {result.modified_count} tasks",
            "modified_count": result.modified_count
        }
        
    except Exception as e:
        logger.error(f"Error bulk updating task status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to bulk update task status: {str(e)}")

# ==================== Notifications ====================

@task_router.get("/notifications/me", response_model=List[TaskNotification])
async def get_my_notifications(
    user_id: str = Query(...),
    unread_only: bool = Query(False),
    limit: int = Query(50, le=200)
):
    """Get notifications for current user"""
    try:
        notifications = await notification_service.get_user_notifications(
            user_id=user_id,
            unread_only=unread_only,
            limit=limit
        )
        return notifications
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")

@task_router.get("/notifications/unread-count")
async def get_unread_count(user_id: str = Query(...)):
    """Get count of unread notifications"""
    try:
        count = await notification_service.get_unread_count(user_id)
        return {"count": count}
        
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")

@task_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        success = await notification_service.mark_as_read(notification_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")

@task_router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(user_id: str = Query(...)):
    """Mark all notifications as read for a user"""
    try:
        count = await notification_service.mark_all_as_read(user_id)
        return {"message": f"Marked {count} notifications as read", "count": count}
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark all notifications as read: {str(e)}")

# ==================== Task Templates ====================

@task_router.post("/templates", response_model=TaskTemplate)
async def create_task_template(
    template_data: TaskTemplateCreate,
    user_id: str = Query(...)
):
    """Create a task template"""
    try:
        template_dict = template_data.dict()
        template_dict["created_by"] = user_id
        template_dict["created_at"] = datetime.now()
        template_dict["is_active"] = True
        
        result = await task_templates_collection.insert_one(template_dict)
        template_dict["id"] = str(result.inserted_id)
        
        return TaskTemplate(**template_dict)
        
    except Exception as e:
        logger.error(f"Error creating task template: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task template: {str(e)}")

@task_router.get("/templates", response_model=List[TaskTemplate])
async def get_task_templates(type: Optional[str] = Query(None)):
    """Get all task templates"""
    try:
        query = {"is_active": True}
        if type:
            query["type"] = type
        
        cursor = task_templates_collection.find(query).sort("name", 1)
        
        templates = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            templates.append(TaskTemplate(**doc))
        
        return templates
        
    except Exception as e:
        logger.error(f"Error getting task templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task templates: {str(e)}")

logger.info("Task routes initialized successfully")
