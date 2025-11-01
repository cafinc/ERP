"""
Calendar Routes - Manage calendar events and Google Calendar integration
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import HTMLResponse
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

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

class GoogleCalendarStatus(BaseModel):
    connected: bool
    email: Optional[str] = None
    calendar_id: Optional[str] = None

# Mock data for now - replace with actual database calls
MOCK_EVENTS = [
    {
        "id": "1",
        "title": "Follow up: Smith Estimate",
        "description": "Call customer about EST-2024-156",
        "start": datetime.now().isoformat(),
        "end": (datetime.now() + timedelta(hours=1)).isoformat(),
        "type": "appointment",
        "status": "confirmed",
        "color": "blue",
    },
    {
        "id": "2",
        "title": "Site Inspection - Elm Street",
        "description": "Parking lot inspection",
        "start": (datetime.now() + timedelta(days=1)).isoformat(),
        "end": (datetime.now() + timedelta(days=1, hours=2)).isoformat(),
        "location": "Elm Street Parking Lot",
        "type": "appointment",
        "status": "confirmed",
        "color": "green",
    },
    {
        "id": "3",
        "title": "Team Meeting",
        "start": (datetime.now() + timedelta(days=2)).isoformat(),
        "end": (datetime.now() + timedelta(days=2, hours=1)).isoformat(),
        "attendees": ["Team"],
        "type": "meeting",
        "status": "confirmed",
        "color": "purple",
    },
]

@router.get("/calendar/events")
async def get_calendar_events(
    start: Optional[str] = Query(None, description="Start date ISO format"),
    end: Optional[str] = Query(None, description="End date ISO format")
):
    """Get calendar events within a date range"""
    try:
        # For now, return mock data
        # In production, fetch from database and sync with Google Calendar
        return MOCK_EVENTS
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar/events")
async def create_calendar_event(event: CalendarEvent):
    """Create a new calendar event"""
    try:
        # In production, save to database and optionally sync with Google Calendar
        new_event = event.dict()
        new_event["id"] = f"evt_{datetime.now().timestamp()}"
        return new_event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/google/status")
async def get_google_calendar_status():
    """Check if Google Calendar is connected"""
    try:
        # In production, check database for stored OAuth tokens
        # For now, return not connected
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
        # In production:
        # 1. Check if OAuth tokens exist
        # 2. Refresh token if needed
        # 3. Fetch events from Google Calendar API
        # 4. Merge with local database
        # 5. Push local events to Google Calendar if needed
        
        return {
            "success": True,
            "message": "Calendar synced successfully",
            "events_synced": len(MOCK_EVENTS),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/google/callback")
async def google_calendar_callback(code: str = Query(..., description="OAuth authorization code")):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for access token
        import requests
        
        client_id = os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI")
        
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
            raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
        
        tokens = token_response.json()
        
        # In production: Store tokens in database associated with user
        # For now, we'll return success and redirect to calendar page
        
        # Return HTML that redirects to calendar page with success message
        return """
        <html>
            <head>
                <title>Google Calendar Connected</title>
                <script>
                    window.opener.postMessage({type: 'google-calendar-connected', success: true}, '*');
                    setTimeout(() => {
                        window.location.href = '/calendar?connected=true';
                    }, 1000);
                </script>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>✅ Google Calendar Connected!</h1>
                <p>Redirecting back to calendar...</p>
            </body>
        </html>
        """
    except Exception as e:
        print(f"Error in Google Calendar callback: {e}")
        return f"""
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
        """

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
