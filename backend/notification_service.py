#!/usr/bin/env python3
"""
Notification Service for Task Assignment System
Handles real-time notifications and delivery
"""

import logging
from datetime import datetime
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

from task_models import TaskNotification, NotificationType

load_dotenv()

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for managing task notifications"""
    
    def __init__(self):
        self.mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        self.db_name = os.getenv("DB_NAME", "snow_removal_db")
        self.client = AsyncIOMotorClient(self.mongo_url)
        self.db = self.client[self.db_name]
        self.notifications_collection = self.db["task_notifications"]
        
    async def create_notification(
        self,
        task_id: str,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Dict = None
    ) -> TaskNotification:
        """Create a new notification"""
        try:
            notification = TaskNotification(
                task_id=task_id,
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                data=data or {},
                read=False,
                created_at=datetime.now()
            )
            
            result = await self.notifications_collection.insert_one(
                notification.dict(exclude={'id'})
            )
            notification.id = str(result.inserted_id)
            
            logger.info(f"Created notification {notification.id} for user {user_id}")
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise
    
    async def notify_task_assignment(
        self,
        task_id: str,
        task_title: str,
        assigned_to: List[str],
        assigned_by_name: str,
        task_priority: str
    ):
        """Send notifications for task assignment"""
        try:
            for user_id in assigned_to:
                priority_emoji = {
                    'low': '📝',
                    'medium': '📋',
                    'high': '⚡',
                    'urgent': '🚨'
                }.get(task_priority, '📋')
                
                await self.create_notification(
                    task_id=task_id,
                    user_id=user_id,
                    notification_type=NotificationType.ASSIGNMENT,
                    title=f"{priority_emoji} New Task Assigned",
                    message=f"{assigned_by_name} assigned you: {task_title}",
                    data={
                        'task_id': task_id,
                        'task_title': task_title,
                        'assigned_by': assigned_by_name,
                        'priority': task_priority
                    }
                )
            
            logger.info(f"Sent assignment notifications for task {task_id} to {len(assigned_to)} users")
            
        except Exception as e:
            logger.error(f"Error notifying task assignment: {e}")
    
    async def notify_task_update(
        self,
        task_id: str,
        task_title: str,
        updated_by_name: str,
        watchers: List[str],
        changes: Dict
    ):
        """Send notifications for task updates"""
        try:
            change_summary = ", ".join([f"{k}: {v}" for k, v in changes.items()])
            
            for user_id in watchers:
                await self.create_notification(
                    task_id=task_id,
                    user_id=user_id,
                    notification_type=NotificationType.UPDATE,
                    title="📝 Task Updated",
                    message=f"{updated_by_name} updated {task_title}",
                    data={
                        'task_id': task_id,
                        'task_title': task_title,
                        'updated_by': updated_by_name,
                        'changes': changes
                    }
                )
            
            logger.info(f"Sent update notifications for task {task_id} to {len(watchers)} users")
            
        except Exception as e:
            logger.error(f"Error notifying task update: {e}")
    
    async def notify_task_comment(
        self,
        task_id: str,
        task_title: str,
        commenter_name: str,
        comment_content: str,
        mentions: List[str],
        watchers: List[str]
    ):
        """Send notifications for task comments"""
        try:
            # Notify mentioned users
            for user_id in mentions:
                await self.create_notification(
                    task_id=task_id,
                    user_id=user_id,
                    notification_type=NotificationType.MENTION,
                    title="💬 You were mentioned",
                    message=f"{commenter_name} mentioned you in {task_title}",
                    data={
                        'task_id': task_id,
                        'task_title': task_title,
                        'commenter': commenter_name,
                        'comment': comment_content[:100]
                    }
                )
            
            # Notify watchers (excluding mentions to avoid duplicate)
            non_mentioned_watchers = [w for w in watchers if w not in mentions]
            for user_id in non_mentioned_watchers:
                await self.create_notification(
                    task_id=task_id,
                    user_id=user_id,
                    notification_type=NotificationType.COMMENT,
                    title="💬 New Comment",
                    message=f"{commenter_name} commented on {task_title}",
                    data={
                        'task_id': task_id,
                        'task_title': task_title,
                        'commenter': commenter_name,
                        'comment': comment_content[:100]
                    }
                )
            
            logger.info(f"Sent comment notifications for task {task_id}")
            
        except Exception as e:
            logger.error(f"Error notifying task comment: {e}")
    
    async def notify_task_completion(
        self,
        task_id: str,
        task_title: str,
        completed_by_name: str,
        watchers: List[str]
    ):
        """Send notifications for task completion"""
        try:
            for user_id in watchers:
                await self.create_notification(
                    task_id=task_id,
                    user_id=user_id,
                    notification_type=NotificationType.COMPLETION,
                    title="✅ Task Completed",
                    message=f"{completed_by_name} completed {task_title}",
                    data={
                        'task_id': task_id,
                        'task_title': task_title,
                        'completed_by': completed_by_name
                    }
                )
            
            logger.info(f"Sent completion notifications for task {task_id} to {len(watchers)} users")
            
        except Exception as e:
            logger.error(f"Error notifying task completion: {e}")
    
    async def notify_status_change(
        self,
        task_id: str,
        task_title: str,
        old_status: str,
        new_status: str,
        changed_by_name: str,
        watchers: List[str]
    ):
        """Send notifications for status changes"""
        try:
            for user_id in watchers:
                await self.create_notification(
                    task_id=task_id,
                    user_id=user_id,
                    notification_type=NotificationType.STATUS_CHANGE,
                    title="🔄 Status Changed",
                    message=f"{changed_by_name} changed {task_title} from {old_status} to {new_status}",
                    data={
                        'task_id': task_id,
                        'task_title': task_title,
                        'old_status': old_status,
                        'new_status': new_status,
                        'changed_by': changed_by_name
                    }
                )
            
            logger.info(f"Sent status change notifications for task {task_id}")
            
        except Exception as e:
            logger.error(f"Error notifying status change: {e}")
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[TaskNotification]:
        """Get notifications for a user"""
        try:
            query = {"user_id": user_id}
            if unread_only:
                query["read"] = False
            
            cursor = self.notifications_collection.find(query).sort(
                "created_at", -1
            ).limit(limit)
            
            notifications = []
            async for doc in cursor:
                doc["id"] = str(doc.pop("_id"))
                notifications.append(TaskNotification(**doc))
            
            return notifications
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark a notification as read"""
        try:
            result = await self.notifications_collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "read": True,
                        "read_at": datetime.now()
                    }
                }
            )
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications for a user as read"""
        try:
            result = await self.notifications_collection.update_many(
                {"user_id": user_id, "read": False},
                {
                    "$set": {
                        "read": True,
                        "read_at": datetime.now()
                    }
                }
            )
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return 0
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            count = await self.notifications_collection.count_documents(
                {"user_id": user_id, "read": False}
            )
            return count
            
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0
    
    async def delete_notification(self, notification_id: str) -> bool:
        """Delete a notification"""
        try:
            result = await self.notifications_collection.delete_one(
                {"_id": ObjectId(notification_id)}
            )
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return False

# Global instance
notification_service = NotificationService()
