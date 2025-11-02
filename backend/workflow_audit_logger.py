"""
Enhanced Audit Logging for Workflow Automation
Comprehensive tracking of workflow changes, executions, and system events
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from enum import Enum

logger = logging.getLogger(__name__)

class AuditEventType(str, Enum):
    """Types of audit events"""
    WORKFLOW_CREATED = "workflow_created"
    WORKFLOW_UPDATED = "workflow_updated"
    WORKFLOW_DELETED = "workflow_deleted"
    WORKFLOW_ENABLED = "workflow_enabled"
    WORKFLOW_DISABLED = "workflow_disabled"
    WORKFLOW_EXECUTED = "workflow_executed"
    WORKFLOW_EXECUTION_FAILED = "workflow_execution_failed"
    WORKFLOW_ROLLED_BACK = "workflow_rolled_back"
    ACTION_EXECUTED = "action_executed"
    ACTION_FAILED = "action_failed"
    ACTION_RETRIED = "action_retried"
    TRIGGER_FIRED = "trigger_fired"
    WEBHOOK_RECEIVED = "webhook_received"
    EVENT_EMITTED = "event_emitted"
    PERMISSION_CHANGED = "permission_changed"
    VERSION_CREATED = "version_created"

class WorkflowAuditLogger:
    """
    Comprehensive audit logging for workflow automation system
    """
    
    def __init__(self, db):
        self.db = db
        
    async def log_event(
        self,
        event_type: AuditEventType,
        workflow_id: Optional[str] = None,
        user_id: Optional[str] = None,
        details: Dict[str, Any] = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """
        Log an audit event
        
        Args:
            event_type: Type of event
            workflow_id: ID of related workflow (if applicable)
            user_id: ID of user who initiated the action
            details: Detailed information about the event
            metadata: Additional metadata
            
        Returns:
            ID of the created audit log entry
        """
        try:
            audit_entry = {
                'event_type': event_type.value,
                'workflow_id': workflow_id,
                'user_id': user_id,
                'details': details or {},
                'metadata': metadata or {},
                'timestamp': datetime.utcnow(),
                'ip_address': metadata.get('ip_address') if metadata else None,
                'user_agent': metadata.get('user_agent') if metadata else None
            }
            
            result = await self.db.workflow_audit_logs.insert_one(audit_entry)
            
            logger.info(f"Audit event logged: {event_type.value} for workflow {workflow_id}")
            
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error logging audit event: {str(e)}")
            # Don't raise - audit logging failures shouldn't break main functionality
            return None
    
    async def get_audit_trail(
        self,
        workflow_id: Optional[str] = None,
        user_id: Optional[str] = None,
        event_types: Optional[List[AuditEventType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get audit trail with filters
        
        Args:
            workflow_id: Filter by workflow ID
            user_id: Filter by user ID
            event_types: Filter by event types
            start_date: Start of date range
            end_date: End of date range
            limit: Maximum number of records
            
        Returns:
            List of audit log entries
        """
        try:
            query = {}
            
            if workflow_id:
                query['workflow_id'] = workflow_id
            
            if user_id:
                query['user_id'] = user_id
            
            if event_types:
                query['event_type'] = {'$in': [et.value for et in event_types]}
            
            if start_date or end_date:
                date_query = {}
                if start_date:
                    date_query['$gte'] = start_date
                if end_date:
                    date_query['$lte'] = end_date
                if date_query:
                    query['timestamp'] = date_query
            
            logs = await self.db.workflow_audit_logs.find(query).sort(
                'timestamp', -1
            ).limit(limit).to_list(length=limit)
            
            # Convert ObjectId to string
            for log in logs:
                log['id'] = str(log['_id'])
                del log['_id']
            
            return logs
            
        except Exception as e:
            logger.error(f"Error getting audit trail: {str(e)}")
            return []
    
    async def get_workflow_audit_summary(
        self,
        workflow_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get audit summary for a specific workflow
        
        Args:
            workflow_id: ID of the workflow
            days: Number of days to look back
            
        Returns:
            Summary of audit events
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = await self.db.workflow_audit_logs.find({
                'workflow_id': workflow_id,
                'timestamp': {'$gte': start_date}
            }).to_list(length=10000)
            
            # Count events by type
            events_by_type = {}
            for log in logs:
                event_type = log['event_type']
                events_by_type[event_type] = events_by_type.get(event_type, 0) + 1
            
            # Count events by user
            events_by_user = {}
            for log in logs:
                user_id = log.get('user_id')
                if user_id:
                    events_by_user[user_id] = events_by_user.get(user_id, 0) + 1
            
            # Get recent critical events
            critical_events = [
                AuditEventType.WORKFLOW_DELETED.value,
                AuditEventType.WORKFLOW_EXECUTION_FAILED.value,
                AuditEventType.ACTION_FAILED.value,
                AuditEventType.WORKFLOW_ROLLED_BACK.value
            ]
            
            recent_critical = [
                {
                    'event_type': log['event_type'],
                    'timestamp': log['timestamp'],
                    'details': log['details']
                }
                for log in logs
                if log['event_type'] in critical_events
            ][:10]
            
            return {
                'workflow_id': workflow_id,
                'period_days': days,
                'total_events': len(logs),
                'events_by_type': events_by_type,
                'events_by_user': events_by_user,
                'recent_critical_events': recent_critical,
                'most_active_users': sorted(
                    [{'user_id': k, 'event_count': v} for k, v in events_by_user.items()],
                    key=lambda x: x['event_count'],
                    reverse=True
                )[:5]
            }
            
        except Exception as e:
            logger.error(f"Error getting workflow audit summary: {str(e)}")
            return {
                'error': str(e),
                'workflow_id': workflow_id
            }
    
    async def get_user_activity_log(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get activity log for a specific user
        
        Args:
            user_id: ID of the user
            days: Number of days to look back
            
        Returns:
            User activity summary
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = await self.db.workflow_audit_logs.find({
                'user_id': user_id,
                'timestamp': {'$gte': start_date}
            }).to_list(length=10000)
            
            # Count actions by type
            actions_by_type = {}
            for log in logs:
                event_type = log['event_type']
                actions_by_type[event_type] = actions_by_type.get(event_type, 0) + 1
            
            # Get workflows the user has interacted with
            workflows_touched = set()
            for log in logs:
                if log.get('workflow_id'):
                    workflows_touched.add(log['workflow_id'])
            
            # Get recent activities
            recent_activities = [
                {
                    'event_type': log['event_type'],
                    'workflow_id': log.get('workflow_id'),
                    'timestamp': log['timestamp'],
                    'details': log.get('details', {})
                }
                for log in logs[:20]
            ]
            
            return {
                'user_id': user_id,
                'period_days': days,
                'total_actions': len(logs),
                'actions_by_type': actions_by_type,
                'workflows_touched': list(workflows_touched),
                'workflows_count': len(workflows_touched),
                'recent_activities': recent_activities
            }
            
        except Exception as e:
            logger.error(f"Error getting user activity log: {str(e)}")
            return {
                'error': str(e),
                'user_id': user_id
            }
    
    async def get_system_audit_stats(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get system-wide audit statistics
        
        Args:
            days: Number of days to look back
            
        Returns:
            System audit statistics
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = await self.db.workflow_audit_logs.find({
                'timestamp': {'$gte': start_date}
            }).to_list(length=100000)
            
            # Total events
            total_events = len(logs)
            
            # Events by type
            events_by_type = {}
            for log in logs:
                event_type = log['event_type']
                events_by_type[event_type] = events_by_type.get(event_type, 0) + 1
            
            # Events by day
            events_by_day = {}
            for log in logs:
                day = log['timestamp'].date().isoformat()
                events_by_day[day] = events_by_day.get(day, 0) + 1
            
            # Most active users
            events_by_user = {}
            for log in logs:
                user_id = log.get('user_id')
                if user_id:
                    events_by_user[user_id] = events_by_user.get(user_id, 0) + 1
            
            # Most active workflows
            events_by_workflow = {}
            for log in logs:
                workflow_id = log.get('workflow_id')
                if workflow_id:
                    events_by_workflow[workflow_id] = events_by_workflow.get(workflow_id, 0) + 1
            
            # Count failures
            failed_events = len([log for log in logs if 'failed' in log['event_type'].lower()])
            success_rate = ((total_events - failed_events) / total_events * 100) if total_events > 0 else 100
            
            return {
                'period_days': days,
                'total_events': total_events,
                'failed_events': failed_events,
                'success_rate': round(success_rate, 2),
                'events_by_type': events_by_type,
                'events_by_day': events_by_day,
                'most_active_users': sorted(
                    [{'user_id': k, 'event_count': v} for k, v in events_by_user.items()],
                    key=lambda x: x['event_count'],
                    reverse=True
                )[:10],
                'most_active_workflows': sorted(
                    [{'workflow_id': k, 'event_count': v} for k, v in events_by_workflow.items()],
                    key=lambda x: x['event_count'],
                    reverse=True
                )[:10]
            }
            
        except Exception as e:
            logger.error(f"Error getting system audit stats: {str(e)}")
            return {
                'error': str(e)
            }
    
    async def export_audit_logs(
        self,
        workflow_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = 'json'
    ) -> List[Dict[str, Any]]:
        """
        Export audit logs for compliance or reporting
        
        Args:
            workflow_id: Filter by workflow
            start_date: Start date
            end_date: End date
            format: Export format (json, csv)
            
        Returns:
            Audit logs in requested format
        """
        try:
            query = {}
            
            if workflow_id:
                query['workflow_id'] = workflow_id
            
            if start_date or end_date:
                date_query = {}
                if start_date:
                    date_query['$gte'] = start_date
                if end_date:
                    date_query['$lte'] = end_date
                if date_query:
                    query['timestamp'] = date_query
            
            logs = await self.db.workflow_audit_logs.find(query).sort(
                'timestamp', 1
            ).to_list(length=100000)
            
            # Convert ObjectId to string
            for log in logs:
                log['id'] = str(log['_id'])
                del log['_id']
                # Convert datetime to ISO string
                log['timestamp'] = log['timestamp'].isoformat()
            
            return logs
            
        except Exception as e:
            logger.error(f"Error exporting audit logs: {str(e)}")
            return []
