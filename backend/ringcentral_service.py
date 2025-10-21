# RingCentral Integration Service
import os
import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()

class RingCentralService:
    def __init__(self):
        self.client_id = os.getenv('RINGCENTRAL_CLIENT_ID')
        self.client_secret = os.getenv('RINGCENTRAL_CLIENT_SECRET')
        self.server_url = os.getenv('RINGCENTRAL_SERVER_URL', 'https://platform.ringcentral.com')
        self.redirect_uri = os.getenv('RINGCENTRAL_REDIRECT_URI')
        
        self.enabled = bool(self.client_id and self.client_secret)
        
        if not self.enabled:
            print("RingCentral service not configured")
    
    def get_authorization_url(self, state: str) -> str:
        """Generate OAuth authorization URL"""
        if not self.enabled:
            raise Exception("RingCentral not configured")
        
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'state': state,
            'prompt': 'login consent'
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{self.server_url}/restapi/oauth/authorize?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        if not self.enabled:
            raise Exception("RingCentral not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/oauth/token",
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': self.redirect_uri
                },
                auth=(self.client_id, self.client_secret)
            )
            response.raise_for_status()
            return response.json()
    
    async def refresh_token(self, refresh_token: str) -> Dict:
        """Refresh access token"""
        if not self.enabled:
            raise Exception("RingCentral not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/oauth/token",
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': refresh_token
                },
                auth=(self.client_id, self.client_secret)
            )
            response.raise_for_status()
            return response.json()
    
    async def get_call_logs(self, access_token: str, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> List[Dict]:
        """Get call logs"""
        if not date_from:
            date_from = datetime.now() - timedelta(days=30)
        if not date_to:
            date_to = datetime.now()
        
        params = {
            'dateFrom': date_from.isoformat(),
            'dateTo': date_to.isoformat(),
            'type': 'Voice',
            'view': 'Detailed',
            'perPage': 100
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/call-log",
                headers={'Authorization': f'Bearer {access_token}'},
                params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get('records', [])
    
    async def get_active_calls(self, access_token: str) -> List[Dict]:
        """Get active/ongoing calls"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/active-calls",
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('records', [])
    
    async def get_voicemails(self, access_token: str, status: str = 'Unread') -> List[Dict]:
        """Get voicemails"""
        params = {
            'messageType': 'VoiceMail',
            'readStatus': status,
            'perPage': 100
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/message-store",
                headers={'Authorization': f'Bearer {access_token}'},
                params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get('records', [])
    
    async def get_voicemail_content(self, access_token: str, message_id: str) -> bytes:
        """Download voicemail audio"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/message-store/{message_id}/content",
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.content
    
    async def get_call_recording(self, access_token: str, recording_id: str) -> bytes:
        """Download call recording"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~/recording/{recording_id}/content",
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.content
    
    async def send_sms(self, access_token: str, to: str, text: str) -> Dict:
        """Send SMS message"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.server_url}/restapi/v1.0/account/~/extension/~/sms",
                headers={'Authorization': f'Bearer {access_token}'},
                json={
                    'from': {'phoneNumber': os.getenv('RINGCENTRAL_PHONE_NUMBER')},
                    'to': [{'phoneNumber': to}],
                    'text': text
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_account_info(self, access_token: str) -> Dict:
        """Get account information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.server_url}/restapi/v1.0/account/~",
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.json()

# Create singleton
ringcentral_service = RingCentralService()
