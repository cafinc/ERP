"""
Advanced Error Handling & Retry Logic for Custom Workflows
Implements exponential backoff, retry policies, and error tracking
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from enum import Enum
from bson import ObjectId

logger = logging.getLogger(__name__)

class RetryStrategy(str, Enum):
    """Retry strategy options"""
    NONE = "none"  # Don't retry failed actions
    LINEAR = "linear"  # Fixed delay between retries
    EXPONENTIAL = "exponential"  # Exponential backoff
    IMMEDIATE = "immediate"  # Retry immediately (for transient errors)

class WorkflowRetryHandler:
    """
    Handles retry logic and error recovery for workflow actions
    """
    
    def __init__(self, db):
        self.db = db
        self.max_retries = 3
        self.base_delay = 5  # seconds
        
    async def execute_with_retry(
        self,
        action_func,
        action_name: str,
        workflow_id: str,
        execution_id: str,
        retry_strategy: RetryStrategy = RetryStrategy.EXPONENTIAL,
        max_retries: Optional[int] = None,
        context: Dict[str, Any] = None
    ):
        """
        Execute an action with retry logic
        
        Args:
            action_func: Async function to execute
            action_name: Name of the action
            workflow_id: ID of the workflow
            execution_id: ID of the current execution
            retry_strategy: Retry strategy to use
            max_retries: Maximum number of retries (overrides default)
            context: Execution context
            
        Returns:
            Result from action_func
            
        Raises:
            Exception: If all retries fail
        """
        if context is None:
            context = {}
        
        max_attempts = (max_retries or self.max_retries) + 1
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                logger.info(f"Executing action '{action_name}' (attempt {attempt + 1}/{max_attempts})")
                
                # Execute the action
                result = await action_func()
                
                # Log successful execution
                await self._log_action_attempt(
                    workflow_id=workflow_id,
                    execution_id=execution_id,
                    action_name=action_name,
                    attempt=attempt + 1,
                    success=True,
                    error=None
                )
                
                return result
                
            except Exception as e:
                last_error = e
                logger.error(f"Action '{action_name}' failed on attempt {attempt + 1}: {str(e)}")
                
                # Log failed attempt
                await self._log_action_attempt(
                    workflow_id=workflow_id,
                    execution_id=execution_id,
                    action_name=action_name,
                    attempt=attempt + 1,
                    success=False,
                    error=str(e)
                )
                
                # If this was the last attempt, raise the error
                if attempt == max_attempts - 1:
                    logger.error(f"Action '{action_name}' failed after {max_attempts} attempts")
                    raise
                
                # Calculate delay based on retry strategy
                delay = self._calculate_delay(retry_strategy, attempt)
                
                logger.info(f"Retrying action '{action_name}' in {delay} seconds...")
                await asyncio.sleep(delay)
        
        # Should not reach here, but just in case
        if last_error:
            raise last_error
    
    def _calculate_delay(self, strategy: RetryStrategy, attempt: int) -> float:
        """Calculate delay before next retry based on strategy"""
        if strategy == RetryStrategy.NONE:
            return 0
        elif strategy == RetryStrategy.IMMEDIATE:
            return 0
        elif strategy == RetryStrategy.LINEAR:
            return self.base_delay
        elif strategy == RetryStrategy.EXPONENTIAL:
            # Exponential backoff: base_delay * 2^attempt
            return self.base_delay * (2 ** attempt)
        else:
            return self.base_delay
    
    async def _log_action_attempt(
        self,
        workflow_id: str,
        execution_id: str,
        action_name: str,
        attempt: int,
        success: bool,
        error: Optional[str]
    ):
        """Log an action execution attempt to database"""
        try:
            log_entry = {
                'workflow_id': workflow_id,
                'execution_id': execution_id,
                'action_name': action_name,
                'attempt': attempt,
                'success': success,
                'error': error,
                'timestamp': datetime.utcnow()
            }
            
            await self.db.workflow_action_attempts.insert_one(log_entry)
        except Exception as e:
            logger.error(f"Failed to log action attempt: {str(e)}")
    
    async def get_action_error_stats(self, workflow_id: str, action_name: str, days: int = 7):
        """Get error statistics for a specific action"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get all attempts for this action in the time period
            attempts = await self.db.workflow_action_attempts.find({
                'workflow_id': workflow_id,
                'action_name': action_name,
                'timestamp': {'$gte': start_date}
            }).to_list(length=1000)
            
            total_attempts = len(attempts)
            failed_attempts = len([a for a in attempts if not a['success']])
            success_rate = ((total_attempts - failed_attempts) / total_attempts * 100) if total_attempts > 0 else 0
            
            # Get common errors
            error_counts = {}
            for attempt in attempts:
                if not attempt['success'] and attempt['error']:
                    error = attempt['error']
                    error_counts[error] = error_counts.get(error, 0) + 1
            
            # Sort errors by frequency
            common_errors = sorted(
                [{'error': e, 'count': c} for e, c in error_counts.items()],
                key=lambda x: x['count'],
                reverse=True
            )[:5]  # Top 5 errors
            
            return {
                'workflow_id': workflow_id,
                'action_name': action_name,
                'period_days': days,
                'total_attempts': total_attempts,
                'failed_attempts': failed_attempts,
                'success_rate': round(success_rate, 2),
                'common_errors': common_errors
            }
        except Exception as e:
            logger.error(f"Error getting action error stats: {str(e)}")
            return {
                'error': str(e),
                'workflow_id': workflow_id,
                'action_name': action_name
            }
    
    async def get_workflow_error_summary(self, workflow_id: str, days: int = 30):
        """Get comprehensive error summary for a workflow"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get all execution logs for this workflow
            logs = await self.db.workflow_execution_logs.find({
                'workflow_id': workflow_id,
                'created_at': {'$gte': start_date}
            }).to_list(length=1000)
            
            total_executions = len(logs)
            failed_executions = len([log for log in logs if log['execution']['status'] == 'failed'])
            success_rate = ((total_executions - failed_executions) / total_executions * 100) if total_executions > 0 else 0
            
            # Get action-level stats
            action_attempts = await self.db.workflow_action_attempts.find({
                'workflow_id': workflow_id,
                'timestamp': {'$gte': start_date}
            }).to_list(length=10000)
            
            # Group by action name
            action_stats = {}
            for attempt in action_attempts:
                action_name = attempt['action_name']
                if action_name not in action_stats:
                    action_stats[action_name] = {
                        'total': 0,
                        'failed': 0,
                        'retries': 0
                    }
                
                action_stats[action_name]['total'] += 1
                if not attempt['success']:
                    action_stats[action_name]['failed'] += 1
                if attempt['attempt'] > 1:
                    action_stats[action_name]['retries'] += 1
            
            # Calculate success rates for each action
            for action_name, stats in action_stats.items():
                total = stats['total']
                failed = stats['failed']
                stats['success_rate'] = round(((total - failed) / total * 100) if total > 0 else 0, 2)
            
            return {
                'workflow_id': workflow_id,
                'period_days': days,
                'total_executions': total_executions,
                'failed_executions': failed_executions,
                'success_rate': round(success_rate, 2),
                'action_stats': action_stats,
                'most_problematic_actions': sorted(
                    [{'action': k, **v} for k, v in action_stats.items()],
                    key=lambda x: x['failed'],
                    reverse=True
                )[:5]
            }
        except Exception as e:
            logger.error(f"Error getting workflow error summary: {str(e)}")
            return {
                'error': str(e),
                'workflow_id': workflow_id
            }
