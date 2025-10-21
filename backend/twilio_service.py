import os
from twilio.rest import Client
from dotenv import load_dotenv
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional

load_dotenv()

class TwilioService:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.verify_service_sid = os.getenv('TWILIO_VERIFY_SERVICE_SID')
        self.phone_number = os.getenv('TWILIO_PHONE_NUMBER')
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            print("Warning: Twilio credentials not configured. SMS features will be mocked.")
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    async def send_otp_sms(self, phone_number: str, otp_code: str) -> dict:
        """
        Send OTP code via SMS
        Returns dict with status and message_sid
        """
        try:
            if not self.client:
                print(f"[MOCK SMS] OTP {otp_code} would be sent to {phone_number}")
                return {"status": "mocked", "message_sid": "MOCK_" + secrets.token_hex(8)}
            
            # Check if FROM and TO are the same (development scenario)
            if self.phone_number == phone_number:
                print(f"[MOCK SMS - Same Number] OTP {otp_code} for {phone_number}")
                return {"status": "mocked", "message_sid": "MOCK_SAME_NUMBER_" + secrets.token_hex(8)}
            
            message = self.client.messages.create(
                body=f"Your verification code is: {otp_code}. This code expires in 10 minutes.",
                from_=self.phone_number,
                to=phone_number
            )
            
            return {"status": "sent", "message_sid": message.sid}
        
        except Exception as e:
            error_str = str(e)
            print(f"Error sending OTP SMS: {error_str}")
            
            # If it's the same number error, mock it
            if "'To' and 'From' number cannot be the same" in error_str:
                print(f"[MOCK SMS - Error Fallback] OTP {otp_code} for {phone_number}")
                return {"status": "mocked", "message_sid": "MOCK_ERROR_" + secrets.token_hex(8)}
            
            return {"status": "error", "error": error_str}
    
    async def send_magic_link_sms(self, phone_number: str, magic_link: str) -> dict:
        """
        Send magic link for password reset via SMS
        Returns dict with status and message_sid
        """
        try:
            if not self.client:
                print(f"[MOCK SMS] Magic link {magic_link} would be sent to {phone_number}")
                return {"status": "mocked", "message_sid": "MOCK_" + secrets.token_hex(8)}
            
            message = self.client.messages.create(
                body=f"Click here to reset your password: {magic_link}. This link expires in 1 hour.",
                from_=self.phone_number,
                to=phone_number
            )
            
            return {"status": "sent", "message_sid": message.sid}
        
        except Exception as e:
            print(f"Error sending magic link SMS: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    async def send_verification_code_via_twilio_verify(self, phone_number: str) -> dict:
        """
        Send verification code using Twilio Verify API
        More secure and easier than custom OTP
        """
        try:
            if not self.client or not self.verify_service_sid:
                otp = self.generate_otp()
                print(f"[MOCK SMS] Twilio Verify OTP {otp} would be sent to {phone_number}")
                return {"status": "mocked", "otp": otp}
            
            verification = self.client.verify \
                .v2 \
                .services(self.verify_service_sid) \
                .verifications \
                .create(to=phone_number, channel='sms')
            
            return {"status": verification.status, "sid": verification.sid}
        
        except Exception as e:
            print(f"Error sending Twilio Verify code: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    async def verify_code_via_twilio_verify(self, phone_number: str, code: str) -> dict:
        """
        Verify code using Twilio Verify API
        """
        try:
            if not self.client or not self.verify_service_sid:
                print(f"[MOCK SMS] Verifying code {code} for {phone_number}")
                return {"status": "approved", "valid": True}
            
            verification_check = self.client.verify \
                .v2 \
                .services(self.verify_service_sid) \
                .verification_checks \
                .create(to=phone_number, code=code)
            
            return {
                "status": verification_check.status,
                "valid": verification_check.status == "approved"
            }
        
        except Exception as e:
            print(f"Error verifying code: {str(e)}")
            return {"status": "error", "valid": False, "error": str(e)}

# Global instance
twilio_service = TwilioService()
