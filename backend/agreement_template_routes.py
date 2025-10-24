"""
Agreement Template Routes
Handles CRUD operations for agreement templates
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_name = os.getenv("DB_NAME", "snow_removal_db")
db = client[db_name]

router = APIRouter(prefix="/agreement-templates", tags=["agreement-templates"])

# Pydantic Models
class TemplateSection(BaseModel):
    id: int
    title: str
    content: str
    required: bool = False

class AgreementTemplateCreate(BaseModel):
    template_name: str
    category: str
    description: Optional[str] = None
    pricing_structure: Optional[str] = "seasonal"
    payment_terms: Optional[str] = "Net 30"
    auto_renew: bool = False
    sections: List[TemplateSection] = []

class AgreementTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    pricing_structure: Optional[str] = None
    payment_terms: Optional[str] = None
    auto_renew: Optional[bool] = None
    sections: Optional[List[TemplateSection]] = None
    is_archived: Optional[bool] = None

class AgreementTemplateResponse(BaseModel):
    id: str = Field(alias="_id")
    template_name: str
    category: str
    description: Optional[str] = None
    pricing_structure: str
    payment_terms: str
    auto_renew: bool
    sections: List[dict]
    is_archived: bool = False
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


@router.get("", response_model=List[dict])
async def get_agreement_templates(
    is_archived: Optional[bool] = None,
    category: Optional[str] = None
):
    """Get all agreement templates with optional filters"""
    try:
        # Build query
        query = {}
        if is_archived is not None:
            query["is_archived"] = is_archived
        if category:
            query["category"] = category
        
        templates = []
        async for template in db.agreement_templates.find(query):
            template["_id"] = str(template["_id"])
            templates.append(template)
        
        logger.info(f"Retrieved {len(templates)} agreement templates")
        return templates
        
    except Exception as e:
        logger.error(f"Error retrieving agreement templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving templates: {str(e)}"
        )


@router.get("/{template_id}", response_model=dict)
async def get_agreement_template(template_id: str):
    """Get a specific agreement template by ID"""
    try:
        template = await db.agreement_templates.find_one({"_id": ObjectId(template_id)})
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agreement template not found"
            )
        
        template["_id"] = str(template["_id"])
        return template
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving agreement template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving template: {str(e)}"
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_agreement_template(template: AgreementTemplateCreate):
    """Create a new agreement template"""
    try:
        # Prepare template document
        template_doc = template.dict()
        template_doc["is_archived"] = False
        template_doc["usage_count"] = 0
        template_doc["created_at"] = datetime.utcnow()
        template_doc["updated_at"] = datetime.utcnow()
        
        # Insert into database
        result = await db.agreement_templates.insert_one(template_doc)
        
        # Retrieve the created template
        created_template = await db.agreement_templates.find_one({"_id": result.inserted_id})
        created_template["_id"] = str(created_template["_id"])
        
        logger.info(f"Created agreement template: {template.template_name}")
        return created_template
        
    except Exception as e:
        logger.error(f"Error creating agreement template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating template: {str(e)}"
        )


@router.put("/{template_id}")
async def update_agreement_template(template_id: str, template: AgreementTemplateUpdate):
    """Update an existing agreement template"""
    try:
        # Check if template exists
        existing_template = await db.agreement_templates.find_one({"_id": ObjectId(template_id)})
        if not existing_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agreement template not found"
            )
        
        # Prepare update document (only include provided fields)
        update_doc = {k: v for k, v in template.dict(exclude_unset=True).items() if v is not None}
        update_doc["updated_at"] = datetime.utcnow()
        
        # Update the template
        await db.agreement_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": update_doc}
        )
        
        # Retrieve updated template
        updated_template = await db.agreement_templates.find_one({"_id": ObjectId(template_id)})
        updated_template["_id"] = str(updated_template["_id"])
        
        logger.info(f"Updated agreement template: {template_id}")
        return updated_template
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agreement template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating template: {str(e)}"
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agreement_template(template_id: str):
    """Delete an agreement template (hard delete)"""
    try:
        # Check if template exists
        template = await db.agreement_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agreement template not found"
            )
        
        # Delete the template
        await db.agreement_templates.delete_one({"_id": ObjectId(template_id)})
        
        logger.info(f"Deleted agreement template: {template_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agreement template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting template: {str(e)}"
        )


logger.info("Agreement template routes initialized successfully")
