"""
Workflow Version Control System
Implements versioning, rollback, and change tracking for custom workflows
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from deepdiff import DeepDiff

logger = logging.getLogger(__name__)

class WorkflowVersionControl:
    """
    Manages workflow versions with change tracking and rollback capability
    """
    
    def __init__(self, db):
        self.db = db
        
    async def create_version(
        self,
        workflow_id: str,
        workflow_data: Dict[str, Any],
        change_description: str,
        changed_by: str
    ) -> Dict[str, Any]:
        """
        Create a new version of a workflow
        
        Args:
            workflow_id: ID of the workflow
            workflow_data: Current workflow data
            change_description: Description of what changed
            changed_by: User ID who made the change
            
        Returns:
            Version record
        """
        try:
            # Get current version number
            latest_version = await self.db.workflow_versions.find_one(
                {'workflow_id': workflow_id},
                sort=[('version_number', -1)]
            )
            
            version_number = (latest_version['version_number'] + 1) if latest_version else 1
            
            # Get previous version data for diff
            previous_data = latest_version['workflow_data'] if latest_version else {}
            
            # Calculate diff
            diff = DeepDiff(previous_data, workflow_data, ignore_order=True)
            
            # Create version record
            version_record = {
                'workflow_id': workflow_id,
                'version_number': version_number,
                'workflow_data': workflow_data,
                'change_description': change_description,
                'changed_by': changed_by,
                'changed_at': datetime.utcnow(),
                'diff': json.loads(diff.to_json()) if diff else {},
                'is_current': True
            }
            
            # Mark all previous versions as not current
            await self.db.workflow_versions.update_many(
                {'workflow_id': workflow_id, 'is_current': True},
                {'$set': {'is_current': False}}
            )
            
            # Insert new version
            result = await self.db.workflow_versions.insert_one(version_record)
            version_record['id'] = str(result.inserted_id)
            
            logger.info(f"Created version {version_number} for workflow {workflow_id}")
            
            return version_record
            
        except Exception as e:
            logger.error(f"Error creating workflow version: {str(e)}")
            raise
    
    async def get_version_history(
        self,
        workflow_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get version history for a workflow
        
        Args:
            workflow_id: ID of the workflow
            limit: Maximum number of versions to return
            
        Returns:
            List of version records
        """
        try:
            versions = await self.db.workflow_versions.find(
                {'workflow_id': workflow_id}
            ).sort('version_number', -1).limit(limit).to_list(length=limit)
            
            # Convert ObjectId to string
            for version in versions:
                version['id'] = str(version['_id'])
                del version['_id']
            
            return versions
            
        except Exception as e:
            logger.error(f"Error getting version history: {str(e)}")
            raise
    
    async def get_specific_version(
        self,
        workflow_id: str,
        version_number: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific version of a workflow
        
        Args:
            workflow_id: ID of the workflow
            version_number: Version number to retrieve
            
        Returns:
            Version record or None
        """
        try:
            version = await self.db.workflow_versions.find_one({
                'workflow_id': workflow_id,
                'version_number': version_number
            })
            
            if version:
                version['id'] = str(version['_id'])
                del version['_id']
            
            return version
            
        except Exception as e:
            logger.error(f"Error getting specific version: {str(e)}")
            raise
    
    async def rollback_to_version(
        self,
        workflow_id: str,
        version_number: int,
        rolled_back_by: str,
        reason: str = ""
    ) -> Dict[str, Any]:
        """
        Rollback workflow to a specific version
        
        Args:
            workflow_id: ID of the workflow
            version_number: Version number to rollback to
            rolled_back_by: User ID performing rollback
            reason: Reason for rollback
            
        Returns:
            Updated workflow data
        """
        try:
            # Get the target version
            target_version = await self.get_specific_version(workflow_id, version_number)
            
            if not target_version:
                raise ValueError(f"Version {version_number} not found for workflow {workflow_id}")
            
            # Get current workflow
            current_workflow = await self.db.custom_workflows.find_one({'_id': ObjectId(workflow_id)})
            
            if not current_workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            # Extract workflow data from target version
            restored_data = target_version['workflow_data']
            
            # Update the workflow
            update_data = {
                **restored_data,
                'updated_at': datetime.utcnow(),
                'rollback_info': {
                    'rolled_back_at': datetime.utcnow(),
                    'rolled_back_by': rolled_back_by,
                    'from_version': target_version['version_number'],
                    'reason': reason
                }
            }
            
            await self.db.custom_workflows.update_one(
                {'_id': ObjectId(workflow_id)},
                {'$set': update_data}
            )
            
            # Create a new version record for the rollback
            await self.create_version(
                workflow_id=workflow_id,
                workflow_data=update_data,
                change_description=f"Rolled back to version {version_number}. Reason: {reason}",
                changed_by=rolled_back_by
            )
            
            logger.info(f"Workflow {workflow_id} rolled back to version {version_number}")
            
            return update_data
            
        except Exception as e:
            logger.error(f"Error rolling back workflow: {str(e)}")
            raise
    
    async def compare_versions(
        self,
        workflow_id: str,
        version_a: int,
        version_b: int
    ) -> Dict[str, Any]:
        """
        Compare two versions of a workflow
        
        Args:
            workflow_id: ID of the workflow
            version_a: First version number
            version_b: Second version number
            
        Returns:
            Diff between the two versions
        """
        try:
            # Get both versions
            v_a = await self.get_specific_version(workflow_id, version_a)
            v_b = await self.get_specific_version(workflow_id, version_b)
            
            if not v_a or not v_b:
                raise ValueError("One or both versions not found")
            
            # Calculate diff
            diff = DeepDiff(v_a['workflow_data'], v_b['workflow_data'], ignore_order=True)
            
            return {
                'workflow_id': workflow_id,
                'version_a': version_a,
                'version_b': version_b,
                'diff': json.loads(diff.to_json()) if diff else {},
                'changes_summary': {
                    'values_changed': len(diff.get('values_changed', {})),
                    'items_added': len(diff.get('dictionary_item_added', [])) + len(diff.get('iterable_item_added', [])),
                    'items_removed': len(diff.get('dictionary_item_removed', [])) + len(diff.get('iterable_item_removed', []))
                }
            }
            
        except Exception as e:
            logger.error(f"Error comparing versions: {str(e)}")
            raise
    
    async def get_change_summary(
        self,
        workflow_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get a summary of changes made to a workflow over time
        
        Args:
            workflow_id: ID of the workflow
            days: Number of days to look back
            
        Returns:
            Change summary
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            versions = await self.db.workflow_versions.find({
                'workflow_id': workflow_id,
                'changed_at': {'$gte': start_date}
            }).sort('version_number', -1).to_list(length=1000)
            
            # Count changes by user
            changes_by_user = {}
            for version in versions:
                user = version['changed_by']
                changes_by_user[user] = changes_by_user.get(user, 0) + 1
            
            # Get most recent changes
            recent_changes = [
                {
                    'version_number': v['version_number'],
                    'change_description': v['change_description'],
                    'changed_by': v['changed_by'],
                    'changed_at': v['changed_at'],
                    'has_diff': bool(v.get('diff'))
                }
                for v in versions[:10]
            ]
            
            return {
                'workflow_id': workflow_id,
                'period_days': days,
                'total_versions': len(versions),
                'changes_by_user': changes_by_user,
                'recent_changes': recent_changes,
                'current_version': versions[0]['version_number'] if versions else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting change summary: {str(e)}")
            return {
                'error': str(e),
                'workflow_id': workflow_id
            }
