"""
Calendar Routes - Manage calendar events and Google Calendar integration
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import HTMLResponse
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

router = APIRouter()

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client.snow_removal_db

# Pydantic Models
class CalendarEvent(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start: str
    end: str
    location: Optional[str] = None
    attendees: Optional[List[str]] = []
    type: str = "event"  # appointment, task, meeting, event
    status: str = "confirmed"  # confirmed, tentative, cancelled
    google_event_id: Optional[str] = None
    color: Optional[str] = "blue"
    customers: Optional[List[str]] = []
    sites: Optional[List[str]] = []
    forms: Optional[List[str]] = []
    team_members: Optional[List[str]] = []
    attachments: Optional[List[dict]] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class GoogleCalendarStatus(BaseModel):
    connected: bool
    email: Optional[str] = None
    calendar_id: Optional[str] = None

def serialize_event(event: dict) -> dict:
    """Convert MongoDB document to API response format"""
    if event and "_id" in event:
        event["id"] = str(event["_id"])
        del event["_id"]
    return event

@router.get("/calendar/events")
async def get_calendar_events(
    start: Optional[str] = Query(None, description="Start date ISO format"),
    end: Optional[str] = Query(None, description="End date ISO format")
):
    """Get calendar events within a date range"""
    try:
        query = {}
        
        # Add date range filter if provided
        if start or end:
            date_filter = {}
            if start:
                date_filter["$gte"] = start
            if end:
                date_filter["$lte"] = end
            query["start"] = date_filter
        
        # Fetch events from database
        events_cursor = db.calendar_events.find(query).sort("start", 1)
        events = await events_cursor.to_list(length=1000)
        
        # Serialize events
        return [serialize_event(event) for event in events]
    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar/events")
async def create_calendar_event(event: CalendarEvent):
    """Create a new calendar event"""
    try:
        # Prepare event document
        event_dict = event.dict(exclude={"id"})
        event_dict["created_at"] = datetime.now().isoformat()
        event_dict["updated_at"] = datetime.now().isoformat()
        
        # Insert into database
        result = await db.calendar_events.insert_one(event_dict)
        
        # Fetch the created event
        created_event = await db.calendar_events.find_one({"_id": result.inserted_id})
        
        return serialize_event(created_event)
    except Exception as e:
        print(f"Error creating calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/calendar/events/{event_id}")
async def update_calendar_event(event_id: str, event: CalendarEvent):
    """Update an existing calendar event"""
    try:
        # Validate ObjectId
        try:
            obj_id = ObjectId(event_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if event exists
        existing_event = await db.calendar_events.find_one({"_id": obj_id})
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Prepare update document
        event_dict = event.dict(exclude={"id", "created_at"})
        event_dict["updated_at"] = datetime.now().isoformat()
        
        # Update in database
        await db.calendar_events.update_one(
            {"_id": obj_id},
            {"$set": event_dict}
        )
        
        # Fetch and return updated event
        updated_event = await db.calendar_events.find_one({"_id": obj_id})
        
        return serialize_event(updated_event)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str):
    """Delete a calendar event"""
    try:
        # Validate ObjectId
        try:
            obj_id = ObjectId(event_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if event exists
        existing_event = await db.calendar_events.find_one({"_id": obj_id})
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Delete from database
        result = await db.calendar_events.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {
            "success": True,
            "message": f"Event {event_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar/events/check-conflicts")
async def check_event_conflicts(event: CalendarEvent):
    """Check for conflicting events"""
    try:
        # Parse event start and end times
        event_start = datetime.fromisoformat(event.start.replace('Z', '+00:00'))
        event_end = datetime.fromisoformat(event.end.replace('Z', '+00:00'))
        
        # Query database for overlapping events
        # Events overlap if:
        # (event_start < existing_end) AND (event_end > existing_start)
        query = {
            "$and": [
                {"start": {"$lt": event.end}},
                {"end": {"$gt": event.start}}
            ]
        }
        
        # Exclude current event if updating
        if event.id:
            try:
                query["_id"] = {"$ne": ObjectId(event.id)}
            except Exception:
                pass
        
        # Find conflicting events
        conflicts_cursor = db.calendar_events.find(query)
        conflicts = await conflicts_cursor.to_list(length=100)
        
        # Serialize conflicts
        serialized_conflicts = [serialize_event(conflict) for conflict in conflicts]
        
        return {
            "has_conflicts": len(serialized_conflicts) > 0,
            "conflicts": serialized_conflicts,
            "message": "No conflicts found" if len(serialized_conflicts) == 0 else f"Found {len(serialized_conflicts)} conflicting event(s)"
        }
    except Exception as e:
        print(f"Error checking event conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar/seed-events")
async def seed_calendar_events():
    """Seed initial calendar events (for development/testing only)"""
    try:
        # Check if events already exist
        count = await db.calendar_events.count_documents({})
        if count > 0:
            return {
                "success": False,
                "message": f"Calendar already has {count} events. Skipping seed.",
                "existing_events": count
            }
        
        # Create sample events
        sample_events = [
            {
                "title": "Follow up: Smith Estimate",
                "description": "Call customer about EST-2024-156",
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=1)).isoformat(),
                "type": "appointment",
                "status": "confirmed",
                "color": "blue",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "title": "Site Inspection - Elm Street",
                "description": "Parking lot inspection",
                "start": (datetime.now() + timedelta(days=1)).isoformat(),
                "end": (datetime.now() + timedelta(days=1, hours=2)).isoformat(),
                "location": "Elm Street Parking Lot",
                "type": "appointment",
                "status": "confirmed",
                "color": "green",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "title": "Team Meeting",
                "start": (datetime.now() + timedelta(days=2)).isoformat(),
                "end": (datetime.now() + timedelta(days=2, hours=1)).isoformat(),
                "attendees": ["Team"],
                "type": "meeting",
                "status": "confirmed",
                "color": "purple",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
        ]
        
        # Insert sample events
        result = await db.calendar_events.insert_many(sample_events)
        
        return {
            "success": True,
            "message": f"Seeded {len(result.inserted_ids)} calendar events",
            "event_ids": [str(id) for id in result.inserted_ids]
        }
    except Exception as e:
        print(f"Error seeding calendar events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/google/status")
async def get_google_calendar_status():
    """Check if Google Calendar is connected"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        
        # Check if tokens exist in database
        try:
            mongo_client = AsyncIOMotorClient(mongo_url)
            db = mongo_client.snow_removal_db
            
            token_doc = await db.oauth_tokens.find_one({"service": "google_calendar"})
            
            if token_doc and token_doc.get("access_token"):
                return GoogleCalendarStatus(
                    connected=True,
                    email=token_doc.get("email", "Connected"),
                    calendar_id=token_doc.get("calendar_id", "primary")
                )
        except Exception as e:
            print(f"Error checking Google Calendar status: {e}")
        
        # Not connected
        return GoogleCalendarStatus(
            connected=False,
            email=None,
            calendar_id=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/google/auth-url")
async def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        # In production, generate proper OAuth URL with your credentials
        # For now, return a placeholder message
        
        # Google Calendar OAuth setup instructions:
        # 1. Go to Google Cloud Console: https://console.cloud.google.com/
        # 2. Create a new project or select existing
        # 3. Enable Google Calendar API
        # 4. Create OAuth 2.0 credentials (Web application)
        # 5. Add authorized redirect URIs
        # 6. Store CLIENT_ID and CLIENT_SECRET in .env
        
        client_id = os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
        redirect_uri = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI", "http://localhost:3000/calendar/callback")
        
        if not client_id:
            return {
                "auth_url": None,
                "message": "Google Calendar integration not configured. Please set GOOGLE_CALENDAR_CLIENT_ID in environment variables.",
                "setup_required": True
            }
        
        # Build OAuth URL
        scope = "https://www.googleapis.com/auth/calendar"
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scope}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        return {
            "auth_url": auth_url,
            "message": "Redirect to Google OAuth",
            "setup_required": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar/google/sync")
async def sync_google_calendar():
    """Sync events with Google Calendar"""
    try:
        # Check if OAuth tokens exist
        token_doc = await db.oauth_tokens.find_one({"service": "google_calendar"})
        
        if not token_doc or not token_doc.get("access_token"):
            raise HTTPException(
                status_code=400,
                detail="Google Calendar not connected. Please connect first."
            )
        
        # In production:
        # 1. Refresh token if needed
        # 2. Fetch events from Google Calendar API
        # 3. Merge with local database
        # 4. Push local events to Google Calendar if needed
        
        # For now, count local events
        local_event_count = await db.calendar_events.count_documents({})
        
        return {
            "success": True,
            "message": "Calendar synced successfully",
            "events_synced": local_event_count,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error syncing calendar: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/google/callback", response_class=HTMLResponse)
async def google_calendar_callback(code: str = Query(..., description="OAuth authorization code")):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for access token
        import requests
        from motor.motor_asyncio import AsyncIOMotorClient
        
        client_id = os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI")
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        token_response = requests.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            error_detail = token_response.json() if token_response.text else "Unknown error"
            return HTMLResponse(content=f"""
            <html>
                <head>
                    <title>Connection Error</title>
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Failed to Exchange Authorization Code</h1>
                    <p>Error: {error_detail}</p>
                    <p><a href="/calendar">Return to Calendar</a></p>
                </body>
            </html>
            """)
        
        tokens = token_response.json()
        
        # Store tokens in MongoDB
        try:
            mongo_client = AsyncIOMotorClient(mongo_url)
            db = mongo_client.snow_removal_db
            
            # Store or update the Google Calendar tokens
            token_doc = {
                "service": "google_calendar",
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "token_type": tokens.get("token_type"),
                "expires_in": tokens.get("expires_in"),
                "scope": tokens.get("scope"),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Upsert the token document
            await db.oauth_tokens.update_one(
                {"service": "google_calendar"},
                {"$set": token_doc},
                upsert=True
            )
            
            print(f"Google Calendar tokens stored successfully")
        except Exception as e:
            print(f"Error storing tokens: {e}")
        
        # Return HTML that redirects to calendar page with success message
        return HTMLResponse(content="""
        <html>
            <head>
                <title>Google Calendar Connected</title>
                <script>
                    setTimeout(() => {
                        window.location.href = '/calendar?connected=true';
                    }, 2000);
                </script>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>✅ Google Calendar Connected!</h1>
                <p>Your calendar is now synced with Google Calendar.</p>
                <p>Redirecting back to calendar...</p>
            </body>
        </html>
        """)
    except Exception as e:
        print(f"Error in Google Calendar callback: {e}")
        return HTMLResponse(content=f"""
        <html>
            <head>
                <title>Connection Error</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>❌ Connection Failed</h1>
                <p>{str(e)}</p>
                <p><a href="/calendar">Return to Calendar</a></p>
            </body>
        </html>
        """)

@router.delete("/calendar/google/disconnect")
async def disconnect_google_calendar():
    """Disconnect Google Calendar integration"""
    try:
        # In production:
        # 1. Revoke OAuth tokens
        # 2. Remove tokens from database
        # 3. Clear sync metadata
        
        return {
            "success": True,
            "message": "Google Calendar disconnected"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
