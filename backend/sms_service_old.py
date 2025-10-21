import os
from typing import List, Optional
from ringcentral import SDK
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        """Initialize RingCentral SMS service"""
        self.server_url = os.getenv('RINGCENTRAL_SERVER_URL', 'https://platform.devtest.ringcentral.com')
        self.client_id = os.getenv('RINGCENTRAL_CLIENT_ID', '')
        self.client_secret = os.getenv('RINGCENTRAL_CLIENT_SECRET', '')
        self.jwt_token = os.getenv('RINGCENTRAL_JWT_TOKEN', '')
        self.sender_phone = os.getenv('RINGCENTRAL_SENDER_PHONE', '')
        
        self.sdk = None
        self.platform = None
        self.enabled = False
        
        # Initialize SDK if credentials are configured
        if self.client_id and self.client_secret and self.jwt_token:
            try:
                self.sdk = SDK(self.client_id, self.client_secret, self.server_url)
                self.platform = self.sdk.platform()
                self.platform.login(jwt=self.jwt_token)
                self.enabled = True
                logger.info("RingCentral SMS service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize RingCentral SMS service: {e}")
                self.enabled = False
        else:
            logger.warning("RingCentral credentials not configured. SMS notifications will be disabled.")
    
    async def send_sms(self, to_phone: str, message: str) -> dict:
        """
        Send SMS to a single recipient
        
        Args:
            to_phone: Recipient phone number in E.164 format (e.g., +15551234567)
            message: Message content (max 1000 characters)
            
        Returns:
            dict with status and message_id if successful
        """
        if not self.enabled:
            logger.warning(f"SMS service not enabled. Would have sent to {to_phone}: {message}")
            return {
                "success": False,
                "error": "SMS service not configured",
                "mock": True
            }
        
        try:
            # Validate phone number format
            if not to_phone.startswith('+'):
                to_phone = f"+1{to_phone.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')}"
            
            # Prepare SMS request
            request_body = {
                'from': {'phoneNumber': self.sender_phone},
                'to': [{'phoneNumber': to_phone}],
                'text': message[:1000]  # Truncate to max length
            }
            
            # Send SMS
            response = self.platform.post('/restapi/v1.0/account/~/extension/~/sms', request_body)
            result = response.json_dict()  # Use json_dict() instead of json()
            
            logger.info(f"SMS sent successfully to {to_phone}. Message ID: {result.get('id')}")
            
            return {
                "success": True,
                "message_id": result.get('id'),
                "to": to_phone,
                "status": result.get('messageStatus')
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {e}")
            return {
                "success": False,
                "error": str(e),
                "to": to_phone
            }
    
    async def get_available_phone_numbers(self) -> dict:
        """
        Get available phone numbers from RingCentral account
        
        Returns:
            Dict with available phone numbers and their capabilities
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "RingCentral SMS service not enabled",
                "numbers": []
            }
        
        try:
            # Get phone numbers from the account
            response = self.platform.get('/restapi/v1.0/account/~/phone-number')
            
            # Convert response to dictionary
            import json
            data = json.loads(str(response.text()))
            
            numbers = []
            for record in data.get('records', []):
                # Check if number has SMS capability
                features = record.get('features', [])
                has_sms = 'SmsSender' in features
                
                number_info = {
                    "phoneNumber": record.get('phoneNumber'),
                    "type": record.get('type'),  # 'VoiceFax', 'VoiceOnly', etc.
                    "usageType": record.get('usageType'),  # 'DirectNumber', 'MainCompanyNumber', etc.
                    "paymentType": record.get('paymentType'),  # 'External', 'TollFree', etc.
                    "hasSMS": has_sms,
                    "features": features,
                    "status": record.get('status')
                }
                numbers.append(number_info)
            
            return {
                "success": True,
                "numbers": numbers,
                "total": len(numbers),
                "sms_enabled": [n for n in numbers if n['hasSMS']]
            }
            
        except Exception as e:
            logger.error(f"Failed to get phone numbers: {e}")
            return {
                "success": False,
                "error": str(e),
                "numbers": []
            }

    async def send_bulk_sms(self, phone_numbers: List[str], message: str) -> List[dict]:
        """
        Send SMS to multiple recipients
        
        Args:
            phone_numbers: List of recipient phone numbers
            message: Message content
            
        Returns:
            List of result dicts for each recipient
        """
        results = []
        for phone in phone_numbers:
            result = await self.send_sms(phone, message)
            results.append(result)
        return results
    
    async def send_dispatch_sms(self, crew_phone: str, dispatch_details: dict) -> dict:
        """Send dispatch notification SMS to crew member"""
        message = f"""
🚚 CAF Property Services - New Job Assignment

Route: {dispatch_details.get('route_name', 'Snow Removal Job')}
Date: {dispatch_details.get('scheduled_date', 'TBD')}
Time: {dispatch_details.get('scheduled_time', 'TBD')}
Services: {', '.join(dispatch_details.get('services', []))}

Check your mobile app for full details and site locations.

CAF Property Services
        """.strip()
        
        return await self.send_sms(crew_phone, message)
    
    async def send_arrival_sms(self, customer_phone: str, crew_name: str, site_name: str) -> dict:
        """Send arrival notification SMS to customer"""
        message = f"""
✅ CAF Property Services - Crew Arrived

Our crew member {crew_name} has arrived at {site_name} and is beginning your snow removal service.

You'll receive another message when the work is completed.

CAF Property Services
        """.strip()
        
        return await self.send_sms(customer_phone, message)
    
    async def send_completion_sms(self, customer_phone: str, crew_name: str, site_name: str) -> dict:
        """Send service completion SMS to customer"""
        message = f"""
🎉 CAF Property Services - Service Complete

Your snow removal service at {site_name} has been completed by {crew_name}.

Before and after photos have been taken for your records. Check your app or email for details.

Thank you for choosing CAF Property Services!
        """.strip()
        
        return await self.send_sms(customer_phone, message)
    
    async def send_weather_alert_sms(self, phone_numbers: List[str], weather_info: str) -> List[dict]:
        """Send weather alert SMS to multiple crew members"""
        message = f"""
🌨️ CAF Property Services - Weather Alert

{weather_info}

Please prepare equipment and check your schedule in the mobile app for any updates.

Stay safe and drive carefully!

CAF Property Services
        """.strip()
        
        return await self.send_bulk_sms(phone_numbers, message)
    
    async def send_emergency_sms(self, phone_numbers: List[str], emergency_message: str) -> List[dict]:
        """Send emergency notification SMS to crew and supervisors"""
        message = f"""
🚨 CAF Property Services - URGENT

{emergency_message}

Please respond immediately or contact dispatch.

CAF Property Services
        """.strip()
        
        return await self.send_bulk_sms(phone_numbers, message)
    
    async def send_schedule_update_sms(self, crew_phone: str, update_message: str) -> dict:
        """Send schedule change SMS to crew member"""
        message = f"""
📅 CAF Property Services - Schedule Update

{update_message}

Check your mobile app for updated job details.

CAF Property Services
        """.strip()
        
        return await self.send_sms(crew_phone, message)
    
    def get_service_status(self) -> dict:
        """Get SMS service configuration status"""
        return {
            "enabled": self.enabled,
            "server_url": self.server_url,
            "sender_phone": self.sender_phone,
            "client_id_configured": bool(self.client_id),
            "client_secret_configured": bool(self.client_secret),
            "jwt_token_configured": bool(self.jwt_token),
            "configuration_status": "configured" if self.enabled else "not_configured"
        }


# Global SMS service instance
sms_service = SMSService()
