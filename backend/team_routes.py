"""
Team Routes - Manage team members and access
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

class TeamMember(BaseModel):
    id: Optional[str] = None
    name: str
    username: Optional[str] = None
    email: str
    role: str = "crew"  # admin, dispatcher, crew, etc.
    phone: Optional[str] = None
    active: bool = True
    created_at: Optional[str] = None

@router.get("/team")
async def get_team_members():
    """Get all team members"""
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client.snow_removal_db
        
        # Fetch team members from users collection
        users = await db.users.find({"active": True}).to_list(length=100)
        
        team_members = []
        for user in users:
            team_members.append({
                "id": str(user.get("_id")),
                "_id": str(user.get("_id")),
                "name": user.get("name", user.get("username", "Team Member")),
                "username": user.get("username"),
                "email": user.get("email"),
                "role": user.get("role", "crew"),
                "phone": user.get("phone"),
                "active": user.get("active", True),
                "created_at": user.get("created_at", datetime.now().isoformat())
            })
        
        return team_members
    except Exception as e:
        print(f"Error fetching team members: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/team/{member_id}")
async def get_team_member(member_id: str):
    """Get a specific team member"""
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client.snow_removal_db
        
        from bson import ObjectId
        user = await db.users.find_one({"_id": ObjectId(member_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        return {
            "id": str(user.get("_id")),
            "_id": str(user.get("_id")),
            "name": user.get("name", user.get("username", "Team Member")),
            "username": user.get("username"),
            "email": user.get("email"),
            "role": user.get("role", "crew"),
            "phone": user.get("phone"),
            "active": user.get("active", True),
            "created_at": user.get("created_at", datetime.now().isoformat())
        }
    except Exception as e:
        print(f"Error fetching team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))
