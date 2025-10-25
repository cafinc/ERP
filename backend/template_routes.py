"""
Template Routes - API Endpoints for Template Management
Handles all template CRUD operations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from template_service import template_service
from template_placeholders import get_placeholders_by_category, get_all_placeholders, search_placeholders
from auth_endpoints import get_current_user_endpoint
from fastapi import Request

logger = logging.getLogger(__name__)
router = APIRouter()


# Dependency for getting current user
async def get_current_user(request: Request):
    """Dependency to get current authenticated user"""
    from template_service import db
    return await get_current_user_endpoint(db, request)


# ========== Request Models ==========

class CreateTemplateRequest(BaseModel):
    type: str  # estimate, invoice, proposal, etc.
    name: str
    description: str = ""
    category: str = "general"
    tags: List[str] = []
    content: Dict[str, Any]
    is_public: bool = False
    is_default: bool = False


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    content: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None


class ApplyTemplateRequest(BaseModel):
    data: Dict[str, Any]  # Variables to replace


# ========== Template CRUD Endpoints ==========

@router.post("/templates")
async def create_template(
    request: CreateTemplateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new template"""
    try:
        template = await template_service.create_template(
            template_type=request.type,
            name=request.name,
            content=request.content,
            user_id=current_user["id"],
            description=request.description,
            category=request.category,
            tags=request.tags,
            is_public=request.is_public,
            is_default=request.is_default
        )
        
        return {
            "success": True,
            "message": "Template created successfully",
            "template": template
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def list_all_templates(
    type: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated
    search: Optional[str] = None,
    is_public: Optional[bool] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """List all templates across types or filter by type"""
    try:
        # Parse tags
        tag_list = tags.split(",") if tags else None
        
        if type:
            # Get templates for specific type
            templates = await template_service.list_templates(
                template_type=type,
                category=category,
                tags=tag_list,
                is_public=is_public,
                user_id=current_user["id"],
                search=search,
                limit=limit
            )
        else:
            # Get templates across all types
            all_templates = []
            for template_type in template_service.collections.keys():
                temps = await template_service.list_templates(
                    template_type=template_type,
                    category=category,
                    tags=tag_list,
                    is_public=is_public,
                    user_id=current_user["id"],
                    search=search,
                    limit=limit
                )
                all_templates.extend(temps)
            
            # Sort by updated_at
            all_templates.sort(key=lambda x: x.get("updated_at", datetime.min), reverse=True)
            templates = all_templates[:limit]
        
        return {
            "success": True,
            "count": len(templates),
            "templates": templates
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Placeholder Library (must come before parameterized routes) ==========

@router.get("/templates/placeholders")
async def get_template_placeholders(
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Get available template placeholders"""
    try:
        if search:
            placeholders = search_placeholders(search)
            return {
                "success": True,
                "placeholders": placeholders
            }
        elif category:
            all_categories = get_placeholders_by_category()
            if category in all_categories:
                return {
                    "success": True,
                    "category": all_categories[category]
                }
            else:
                raise HTTPException(status_code=404, detail="Category not found")
        else:
            # Return all by category
            return {
                "success": True,
                "categories": get_placeholders_by_category()
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching placeholders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_type}/categories")
async def get_categories(template_type: str):
    """Get all categories for a template type"""
    try:
        categories = await template_service.get_categories(template_type)
        
        return {
            "success": True,
            "categories": categories
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_type}/{template_id}")
async def get_template(
    template_type: str,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific template"""
    try:
        template = await template_service.get_template(template_type, template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "success": True,
            "template": template
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/templates/{template_type}/{template_id}")
async def update_template(
    template_type: str,
    template_id: str,
    request: UpdateTemplateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a template"""
    try:
        # Build updates dict
        updates = {}
        if request.name is not None:
            updates["name"] = request.name
        if request.description is not None:
            updates["description"] = request.description
        if request.category is not None:
            updates["category"] = request.category
        if request.tags is not None:
            updates["tags"] = request.tags
        if request.content is not None:
            updates["content"] = request.content
        if request.is_public is not None:
            updates["is_public"] = request.is_public
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        template = await template_service.update_template(
            template_type=template_type,
            template_id=template_id,
            updates=updates,
            user_id=current_user["id"]
        )
        
        return {
            "success": True,
            "message": "Template updated successfully",
            "template": template
        }
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/templates/{template_type}/{template_id}")
async def delete_template(
    template_type: str,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a template (soft delete)"""
    try:
        success = await template_service.delete_template(
            template_type=template_type,
            template_id=template_id,
            user_id=current_user["id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "success": True,
            "message": "Template deleted successfully"
        }
    
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates/{template_type}/{template_id}/duplicate")
async def duplicate_template(
    template_type: str,
    template_id: str,
    new_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Duplicate a template"""
    try:
        template = await template_service.duplicate_template(
            template_type=template_type,
            template_id=template_id,
            user_id=current_user["id"],
            new_name=new_name
        )
        
        return {
            "success": True,
            "message": "Template duplicated successfully",
            "template": template
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error duplicating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates/{template_type}/{template_id}/apply")
async def apply_template(
    template_type: str,
    template_id: str,
    request: ApplyTemplateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Apply template with variable replacement"""
    try:
        result = await template_service.apply_template(
            template_type=template_type,
            template_id=template_id,
            data=request.data
        )
        
        return {
            "success": True,
            "message": "Template applied successfully",
            "result": result
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error applying template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Utility Endpoints ==========

@router.get("/templates/{template_type}/categories")
async def get_categories(template_type: str):
    """Get all categories for a template type"""
    try:
        categories = await template_service.get_categories(template_type)
        
        return {
            "success": True,
            "categories": categories
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_type}/{template_id}/stats")
async def get_template_stats(
    template_type: str,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get usage statistics for a template"""
    try:
        stats = await template_service.get_usage_stats(template_type, template_id)
        
        return {
            "success": True,
            "stats": stats
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting template stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
