"""
Template Service - Base Service for All Template Types
Handles CRUD operations, versioning, and variable replacement
"""

import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "snow_removal_db")]


class TemplateService:
    """Base service for template management"""
    
    def __init__(self):
        self.db = db
        # Collections for different template types
        self.collections = {
            "estimate": db.estimate_templates,
            "invoice": db.invoice_templates,
            "proposal": db.proposal_templates,
            "contract": db.contract_templates,
            "work_order": db.work_order_templates,
            "project": db.project_templates,
            "task_list": db.task_list_templates,
            "notification": db.notification_templates,
            "email": db.email_templates,
            "message": db.message_templates  # Already exists from communications
        }
    
    async def create_template(
        self,
        template_type: str,
        name: str,
        content: Dict[str, Any],
        user_id: str,
        description: str = "",
        category: str = "general",
        tags: List[str] = None,
        is_public: bool = False,
        is_default: bool = False
    ) -> Dict[str, Any]:
        """Create a new template"""
        try:
            if template_type not in self.collections:
                raise ValueError(f"Invalid template type: {template_type}")
            
            collection = self.collections[template_type]
            
            # Extract variables from content
            variables = self._extract_variables(content)
            
            template = {
                "type": template_type,
                "name": name,
                "description": description,
                "category": category,
                "tags": tags or [],
                "content": content,
                "variables": variables,
                "is_default": is_default,
                "is_public": is_public,
                "created_by": user_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "version": 1,
                "active": True,
                "usage_count": 0,
                "last_used": None
            }
            
            result = await collection.insert_one(template)
            template["_id"] = str(result.inserted_id)
            
            logger.info(f"Template created: {name} (type: {template_type})")
            
            return template
        
        except Exception as e:
            logger.error(f"Error creating template: {str(e)}")
            raise
    
    async def get_template(self, template_type: str, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific template by ID"""
        try:
            if template_type not in self.collections:
                raise ValueError(f"Invalid template type: {template_type}")
            
            collection = self.collections[template_type]
            template = await collection.find_one({"_id": ObjectId(template_id)})
            
            if template:
                template["_id"] = str(template["_id"])
            
            return template
        
        except Exception as e:
            logger.error(f"Error getting template: {str(e)}")
            raise
    
    async def list_templates(
        self,
        template_type: str,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_public: Optional[bool] = None,
        user_id: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List templates with filters"""
        try:
            if template_type not in self.collections:
                raise ValueError(f"Invalid template type: {template_type}")
            
            collection = self.collections[template_type]
            
            # Build query
            query = {"active": True}
            
            if category:
                query["category"] = category
            
            if tags:
                query["tags"] = {"$in": tags}
            
            if is_public is not None:
                if is_public:
                    query["is_public"] = True
                else:
                    # Show public templates + user's private templates
                    query["$or"] = [
                        {"is_public": True},
                        {"created_by": user_id}
                    ]
            
            if user_id and is_public is None:
                # Show public + user's templates
                query["$or"] = [
                    {"is_public": True},
                    {"created_by": user_id}
                ]
            
            if search:
                query["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"tags": {"$regex": search, "$options": "i"}}
                ]
            
            templates = await collection.find(query).sort("updated_at", -1).limit(limit).to_list(limit)
            
            # Convert ObjectId to string
            for template in templates:
                template["_id"] = str(template["_id"])
            
            return templates
        
        except Exception as e:
            logger.error(f"Error listing templates: {str(e)}")
            raise
    
    async def update_template(
        self,
        template_type: str,
        template_id: str,
        updates: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Update a template (creates new version)"""
        try:
            if template_type not in self.collections:
                raise ValueError(f"Invalid template type: {template_type}")
            
            collection = self.collections[template_type]
            
            # Get existing template
            template = await collection.find_one({"_id": ObjectId(template_id)})
            if not template:
                raise ValueError("Template not found")
            
            # Check permissions
            if template["created_by"] != user_id and not template.get("is_public"):
                raise PermissionError("Not authorized to update this template")
            
            # Update content and increment version
            if "content" in updates:
                updates["variables"] = self._extract_variables(updates["content"])
            
            updates["updated_at"] = datetime.utcnow()
            updates["version"] = template.get("version", 1) + 1
            
            result = await collection.update_one(
                {"_id": ObjectId(template_id)},
                {"$set": updates}
            )
            
            if result.modified_count == 0:
                raise ValueError("Template not updated")
            
            # Get updated template
            updated_template = await self.get_template(template_type, template_id)
            
            logger.info(f"Template updated: {template_id} (version: {updates['version']})")
            
            return updated_template
        
        except Exception as e:
            logger.error(f"Error updating template: {str(e)}")
            raise
    
    async def delete_template(self, template_type: str, template_id: str, user_id: str) -> bool:
        """Soft delete a template (mark as inactive)"""
        try:
            if template_type not in self.collections:
                raise ValueError(f"Invalid template type: {template_type}")
            
            collection = self.collections[template_type]
            
            # Check permissions
            template = await collection.find_one({"_id": ObjectId(template_id)})
            if not template:
                raise ValueError("Template not found")
            
            if template["created_by"] != user_id and not template.get("is_public"):
                raise PermissionError("Not authorized to delete this template")
            
            result = await collection.update_one(
                {"_id": ObjectId(template_id)},
                {"$set": {"active": False, "updated_at": datetime.utcnow()}}
            )
            
            logger.info(f"Template deleted: {template_id}")
            
            return result.modified_count > 0
        
        except Exception as e:
            logger.error(f"Error deleting template: {str(e)}")
            raise
    
    async def duplicate_template(
        self,
        template_type: str,
        template_id: str,
        user_id: str,
        new_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Duplicate an existing template"""
        try:
            # Get original template
            original = await self.get_template(template_type, template_id)
            if not original:
                raise ValueError("Template not found")
            
            # Create duplicate
            duplicate_name = new_name or f"{original['name']} (Copy)"
            
            duplicate = await self.create_template(
                template_type=template_type,
                name=duplicate_name,
                content=original["content"],
                user_id=user_id,
                description=original.get("description", ""),
                category=original.get("category", "general"),
                tags=original.get("tags", []),
                is_public=False,  # Duplicates are always private initially
                is_default=False
            )
            
            logger.info(f"Template duplicated: {template_id} -> {duplicate['_id']}")
            
            return duplicate
        
        except Exception as e:
            logger.error(f"Error duplicating template: {str(e)}")
            raise
    
    async def apply_template(
        self,
        template_type: str,
        template_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply template with variable replacement"""
        try:
            # Get template
            template = await self.get_template(template_type, template_id)
            if not template:
                raise ValueError("Template not found")
            
            # Replace variables in content
            applied_content = self._replace_variables(template["content"], data)
            
            # Update usage statistics
            collection = self.collections[template_type]
            await collection.update_one(
                {"_id": ObjectId(template_id)},
                {
                    "$inc": {"usage_count": 1},
                    "$set": {"last_used": datetime.utcnow()}
                }
            )
            
            logger.info(f"Template applied: {template_id}")
            
            return {
                "template_id": template_id,
                "template_name": template["name"],
                "content": applied_content,
                "applied_at": datetime.utcnow()
            }
        
        except Exception as e:
            logger.error(f"Error applying template: {str(e)}")
            raise
    
    def _extract_variables(self, content: Any) -> List[str]:
        """Extract variable placeholders from content"""
        variables = set()
        
        def extract_from_value(value):
            if isinstance(value, str):
                # Find {{variable_name}} patterns
                matches = re.findall(r'\{\{(\w+)\}\}', value)
                variables.update(matches)
            elif isinstance(value, dict):
                for v in value.values():
                    extract_from_value(v)
            elif isinstance(value, list):
                for item in value:
                    extract_from_value(item)
        
        extract_from_value(content)
        return list(variables)
    
    def _replace_variables(self, content: Any, data: Dict[str, Any]) -> Any:
        """Replace variables in content with actual data"""
        if isinstance(content, str):
            # Replace {{variable}} with data value
            for key, value in data.items():
                pattern = f"{{{{{key}}}}}"
                content = content.replace(pattern, str(value))
            return content
        
        elif isinstance(content, dict):
            return {k: self._replace_variables(v, data) for k, v in content.items()}
        
        elif isinstance(content, list):
            return [self._replace_variables(item, data) for item in content]
        
        else:
            return content
    
    async def get_categories(self, template_type: str) -> List[str]:
        """Get all unique categories for a template type"""
        try:
            if template_type not in self.collections:
                raise ValueError(f"Invalid template type: {template_type}")
            
            collection = self.collections[template_type]
            categories = await collection.distinct("category", {"active": True})
            
            return categories
        
        except Exception as e:
            logger.error(f"Error getting categories: {str(e)}")
            raise
    
    async def get_usage_stats(self, template_type: str, template_id: str) -> Dict[str, Any]:
        """Get usage statistics for a template"""
        try:
            template = await self.get_template(template_type, template_id)
            if not template:
                raise ValueError("Template not found")
            
            return {
                "template_id": template_id,
                "usage_count": template.get("usage_count", 0),
                "last_used": template.get("last_used"),
                "created_at": template.get("created_at"),
                "version": template.get("version", 1)
            }
        
        except Exception as e:
            logger.error(f"Error getting usage stats: {str(e)}")
            raise


# Singleton instance
template_service = TemplateService()
