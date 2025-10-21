# Enhanced RingCentral Integration Service with JWT Authentication
import os
import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class RingCentralEnhanced:
    """Enhanced RingCentral service with JWT authentication and comprehensive features"""
    
    def __init__(self):
        self.client_id = os.getenv('RINGCENTRAL_CLIENT_ID')
        self.client_secret = os.getenv('RINGCENTRAL_CLIENT_SECRET')
        self.jwt_token = os.getenv('RINGCENTRAL_JWT')
        self.server_url = os.getenv('RINGCENTRAL_SERVER_URL', 'https://platform.ringcentral.com')
        
        self.enabled = bool(self.client_id and self.client_secret and self.jwt_token)
        self.access_token = None
        self.token_expires_at = None
        
        if not self.enabled:
            logger.warning("RingCentral service not fully configured")
    
    async def get_access_token(self) -> str:
        """Get or refresh access token using JWT"""
        # Check if we have a valid cached token
        if self.access_token and self.token_expires_at:
            if datetime.now() < self.token_expires_at - timedelta(minutes=5):
                return self.access_token
        
        # Get new token using JWT
        if not self.jwt_token:
            raise Exception("RingCentral JWT not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/oauth/token",
                data={
                    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion': self.jwt_token
                },
                auth=(self.client_id, self.client_secret),
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data['access_token']
            expires_in = data.get('expires_in', 3600)
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            logger.info(f"RingCentral access token obtained, expires in {expires_in}s")
            return self.access_token
    
    # ==================== SMS FUNCTIONALITY ====================
    
    async def send_sms(self, to: str, text: str, from_number: Optional[str] = None) -> Dict:
        """Send SMS message"""
        token = await self.get_access_token()
        
        payload = {
            'to': [{'phoneNumber': to}],
            'text': text
        }
        
        if from_number:
            payload['from'] = {'phoneNumber': from_number}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/sms",
                headers={'Authorization': f'Bearer {token}'},
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_sms_messages(self, date_from: Optional[datetime] = None, 
                               date_to: Optional[datetime] = None,
                               direction: Optional[str] = None,
                               per_page: int = 100,
                               page: int = 1) -> Dict:
        """Get SMS messages"""
        token = await self.get_access_token()
        
        params = {
            'messageType': ['SMS'],
            'perPage': per_page,
            'page': page
        }
        
        if date_from:
            params['dateFrom'] = date_from.isoformat()
        if date_to:
            params['dateTo'] = date_to.isoformat()
        if direction:
            params['direction'] = direction
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/message-store",
                headers={'Authorization': f'Bearer {token}'},
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_sms_by_id(self, message_id: str) -> Dict:
        """Get specific SMS message"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/message-store/{message_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    # ==================== ACTIVE CALLS MONITORING ====================
    
    async def get_active_calls(self) -> Dict:
        """Get all active calls across account"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/telephony/sessions",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_active_call_details(self, session_id: str) -> Dict:
        """Get details of specific active call"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/telephony/sessions/{session_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_extension_active_calls(self, extension_id: str) -> List[Dict]:
        """Get active calls for specific extension"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/{extension_id}/active-calls",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get('records', [])
    
    # ==================== CALL RECORDINGS ====================
    
    async def get_call_recordings(self, date_from: Optional[datetime] = None,
                                  date_to: Optional[datetime] = None,
                                  per_page: int = 100,
                                  page: int = 1) -> Dict:
        """Get call recordings from call log"""
        token = await self.get_access_token()
        
        if not date_from:
            date_from = datetime.now() - timedelta(days=30)
        if not date_to:
            date_to = datetime.now()
        
        params = {
            'dateFrom': date_from.isoformat(),
            'dateTo': date_to.isoformat(),
            'recordingType': 'All',
            'perPage': per_page,
            'page': page
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/call-log",
                headers={'Authorization': f'Bearer {token}'},
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Filter only records with recordings
            records_with_recordings = [
                record for record in data.get('records', [])
                if 'recording' in record
            ]
            
            return {
                'records': records_with_recordings,
                'paging': data.get('paging', {}),
                'navigation': data.get('navigation', {})
            }
    
    async def get_recording_metadata(self, recording_id: str) -> Dict:
        """Get recording metadata"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/recording/{recording_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def download_recording(self, recording_id: str) -> bytes:
        """Download call recording audio"""
        token = await self.get_access_token()
        
        # First get metadata to get content URI
        metadata = await self.get_recording_metadata(recording_id)
        content_uri = metadata.get('contentUri')
        
        if not content_uri:
            raise Exception("Recording content URI not available")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                content_uri,
                headers={'Authorization': f'Bearer {token}'},
                timeout=60.0
            )
            response.raise_for_status()
            return response.content
    
    # ==================== CONTACTS SYNC ====================
    
    async def get_contacts(self, contact_type: str = 'Personal',
                          per_page: int = 100,
                          page: int = 1) -> Dict:
        """Get contacts from RingCentral"""
        token = await self.get_access_token()
        
        params = {
            'type': contact_type,
            'perPage': per_page,
            'page': page
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/address-book/contact",
                headers={'Authorization': f'Bearer {token}'},
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def create_contact(self, first_name: str, last_name: str,
                            email: Optional[str] = None,
                            phone_numbers: Optional[List[Dict]] = None,
                            company: Optional[str] = None,
                            job_title: Optional[str] = None) -> Dict:
        """Create a new contact"""
        token = await self.get_access_token()
        
        payload = {
            'firstName': first_name,
            'lastName': last_name
        }
        
        if email:
            payload['email'] = email
        if phone_numbers:
            payload['phoneNumbers'] = phone_numbers
        if company:
            payload['company'] = company
        if job_title:
            payload['jobTitle'] = job_title
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/address-book/contact",
                headers={'Authorization': f'Bearer {token}'},
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def update_contact(self, contact_id: str, updates: Dict) -> Dict:
        """Update existing contact"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/address-book/contact/{contact_id}",
                headers={'Authorization': f'Bearer {token}'},
                json=updates,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def delete_contact(self, contact_id: str) -> None:
        """Delete contact"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/address-book/contact/{contact_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
    
    async def sync_contacts(self, sync_token: Optional[str] = None) -> Dict:
        """Incremental contact sync"""
        token = await self.get_access_token()
        
        params = {}
        if sync_token:
            params['syncToken'] = sync_token
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/address-book-sync",
                headers={'Authorization': f'Bearer {token}'},
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    # ==================== ANALYTICS ====================
    
    async def get_call_analytics(self, time_from: datetime, time_to: datetime,
                                 grouping: Optional[Dict] = None) -> Dict:
        """Get call analytics aggregated data"""
        token = await self.get_access_token()
        
        payload = {
            'timeSettings': {
                'timeZone': 'UTC',
                'timeRange': {
                    'timeFrom': time_from.isoformat(),
                    'timeTo': time_to.isoformat()
                }
            }
        }
        
        if grouping:
            payload['grouping'] = grouping
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/analytics/calls/v1/accounts/~/aggregation/fetch",
                headers={'Authorization': f'Bearer {token}'},
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_call_timeline(self, time_from: datetime, time_to: datetime,
                               time_frame: str = 'Day') -> Dict:
        """Get call analytics timeline data"""
        token = await self.get_access_token()
        
        payload = {
            'timeSettings': {
                'timeZone': 'UTC',
                'timeRange': {
                    'timeFrom': time_from.isoformat(),
                    'timeTo': time_to.isoformat()
                },
                'advancedTimeSettings': {
                    'aggregationType': time_frame
                }
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/analytics/calls/v1/accounts/~/timeline/fetch",
                headers={'Authorization': f'Bearer {token}'},
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    # ==================== CALL CONTROL ====================
    
    async def hold_call(self, session_id: str, party_id: str) -> Dict:
        """Put call on hold"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/v1.0/account/~/telephony/sessions/{session_id}/parties/{party_id}/hold",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def unhold_call(self, session_id: str, party_id: str) -> Dict:
        """Resume call from hold"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/v1.0/account/~/telephony/sessions/{session_id}/parties/{party_id}/unhold",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def transfer_call(self, session_id: str, party_id: str, 
                           target: Dict) -> Dict:
        """Transfer call to another extension or number"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/v1.0/account/~/telephony/sessions/{session_id}/parties/{party_id}/transfer",
                headers={'Authorization': f'Bearer {token}'},
                json=target,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def hangup_call(self, session_id: str, party_id: str) -> None:
        """Hangup/terminate call"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.server_url}/restapi/v1.0/account/~/telephony/sessions/{session_id}/parties/{party_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
    
    # ==================== TEAM MESSAGING ====================
    
    async def get_team_messages(self, chat_id: Optional[str] = None,
                                per_page: int = 100) -> Dict:
        """Get team/internal messages"""
        token = await self.get_access_token()
        
        params = {'recordCount': per_page}
        
        url = f"{self.server_url}/team-messaging/v1/chats"
        if chat_id:
            url = f"{self.server_url}/team-messaging/v1/chats/{chat_id}/posts"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={'Authorization': f'Bearer {token}'},
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def send_team_message(self, chat_id: str, text: str) -> Dict:
        """Send team message"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/team-messaging/v1/chats/{chat_id}/posts",
                headers={'Authorization': f'Bearer {token}'},
                json={'text': text},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    # ==================== ACCOUNT INFO ====================
    
    async def get_account_info(self) -> Dict:
        """Get account information"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_extension_info(self, extension_id: str = '~') -> Dict:
        """Get extension information"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/{extension_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_extensions_list(self) -> List[Dict]:
        """Get list of all extensions"""
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension",
                headers={'Authorization': f'Bearer {token}'},
                params={'perPage': 1000},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get('records', [])

# Create singleton instance
rc_enhanced = RingCentralEnhanced()
