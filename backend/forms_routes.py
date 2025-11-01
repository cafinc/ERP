"""
Forms Routes - Manage form templates and submissions
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class FormTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    title: Optional[str] = None
    description: Optional[str] = None
    type: str = "inspection"  # inspection, safety, maintenance, service, custom
    fields: List[dict] = []
    active: bool = True
    created_at: Optional[str] = None

@router.get("/forms/templates")
async def get_form_templates():
    """Get all form templates"""
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client.snow_removal_db
        
        # Fetch form templates
        templates = await db.form_templates.find({"active": True}).to_list(length=100)
        
        form_list = []
        for template in templates:
            form_list.append({
                "id": str(template.get("_id")),
                "_id": str(template.get("_id")),
                "name": template.get("name", "Unnamed Form"),
                "title": template.get("title", template.get("name", "Unnamed Form")),
                "description": template.get("description"),
                "type": template.get("type", "custom"),
                "fields": template.get("fields", []),
                "active": template.get("active", True),
                "created_at": template.get("created_at", datetime.now().isoformat())
            })
        
        # If no templates exist, return some default ones
        if not form_list:
            form_list = [
                {
                    "id": "default_1",
                    "_id": "default_1",
                    "name": "Site Inspection Form",
                    "title": "Site Inspection Form",
                    "description": "Standard site inspection checklist",
                    "type": "inspection",
                    "fields": [],
                    "active": True,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "default_2",
                    "_id": "default_2",
                    "name": "Safety Checklist",
                    "title": "Safety Checklist",
                    "description": "Equipment and site safety verification",
                    "type": "safety",
                    "fields": [],
                    "active": True,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "default_3",
                    "_id": "default_3",
                    "name": "Service Completion Report",
                    "title": "Service Completion Report",
                    "description": "Document service completion details",
                    "type": "service",
                    "fields": [],
                    "active": True,
                    "created_at": datetime.now().isoformat()
                }
            ]
        
        return form_list
    except Exception as e:
        print(f"Error fetching form templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/templates/{template_id}")
async def get_form_template(template_id: str):
    """Get a specific form template"""
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client.snow_removal_db
        
        from bson import ObjectId
        template = await db.form_templates.find_one({"_id": ObjectId(template_id)})
        
        if not template:
            raise HTTPException(status_code=404, detail="Form template not found")
        
        return {
            "id": str(template.get("_id")),
            "_id": str(template.get("_id")),
            "name": template.get("name", "Unnamed Form"),
            "title": template.get("title", template.get("name", "Unnamed Form")),
            "description": template.get("description"),
            "type": template.get("type", "custom"),
            "fields": template.get("fields", []),
            "active": template.get("active", True),
            "created_at": template.get("created_at", datetime.now().isoformat())
        }
    except Exception as e:
        print(f"Error fetching form template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forms/templates")
async def create_form_template(template: FormTemplate):
    """Create a new form template"""
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client.snow_removal_db
        
        template_doc = {
            "name": template.name,
            "title": template.title or template.name,
            "description": template.description,
            "type": template.type,
            "fields": template.fields,
            "active": template.active,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = await db.form_templates.insert_one(template_doc)
        template_doc["id"] = str(result.inserted_id)
        template_doc["_id"] = str(result.inserted_id)
        
        return template_doc
    except Exception as e:
        print(f"Error creating form template: {e}")
        raise HTTPException(status_code=500, detail=str(e))
