import os
import logging
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class TwilioSMSService:
    def __init__(self):
        """Initialize Twilio SMS service"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.phone_number = os.getenv('TWILIO_PHONE_NUMBER', '')
        
        self.client = None
        self.enabled = False
        
        if self.account_sid and self.auth_token and self.phone_number:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                self.enabled = True
                logger.info("Twilio SMS service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio SMS service: {e}")
                self.enabled = False
        else:
            logger.warning("Twilio credentials not configured. SMS notifications will be disabled.")
    
    async def send_sms(self, to_number: str, message: str) -> dict:
        """
        Send SMS message via Twilio
        
        Args:
            to_number: Recipient phone number in E.164 format (+1234567890)
            message: Message text to send
            
        Returns:
            dict with status and details
        """
        if not self.enabled:
            logger.warning("SMS service not enabled. Message not sent.")
            return {
                "success": False,
                "error": "Twilio SMS service not enabled",
                "message": "Please configure Twilio credentials"
            }
        
        try:
            message = self.client.messages.create(
                body=message,
                from_=self.phone_number,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully to {to_number}, SID: {message.sid}")
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "to": to_number,
                "from": self.phone_number
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to send SMS to {to_number}: {error_msg}")
            
            return {
                "success": False,
                "error": error_msg,
                "to": to_number
            }
    
    async def send_dispatch_notification(self, crew_phone: str, site_name: str, dispatch_time: str) -> dict:
        """Send dispatch assignment notification"""
        message = f"New Dispatch Assignment: {site_name} at {dispatch_time}. Check the app for details."
        return await self.send_sms(crew_phone, message)
    
    async def send_arrival_notification(self, admin_phone: str, crew_name: str, site_name: str) -> dict:
        """Send crew arrival notification"""
        message = f"{crew_name} has arrived at {site_name}"
        return await self.send_sms(admin_phone, message)
    
    async def send_completion_notification(self, customer_phone: str, site_name: str) -> dict:
        """Send service completion notification"""
        message = f"Snow removal service completed at {site_name}. Thank you for your business!"
        return await self.send_sms(customer_phone, message)
    
    async def send_weather_alert(self, phone: str, alert_message: str) -> dict:
        """Send weather alert"""
        message = f"Weather Alert: {alert_message}"
        return await self.send_sms(phone, message)
    
    async def send_emergency_alert(self, phone: str, emergency_message: str) -> dict:
        """Send emergency alert"""
        message = f"EMERGENCY: {emergency_message}"
        return await self.send_sms(phone, message)
    
    async def get_service_status(self) -> dict:
        """Get Twilio service status"""
        return {
            "enabled": self.enabled,
            "configured": bool(self.account_sid and self.auth_token and self.phone_number),
            "account_sid": self.account_sid[:10] + "..." if self.account_sid else None,
            "phone_number": self.phone_number
        }

# Global instance
sms_service = TwilioSMSService()
