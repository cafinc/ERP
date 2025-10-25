import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SMTP_SENDER')
        self.sender_password = os.getenv('SMTP_PASSWORD')
        self.enabled = bool(self.sender_email and self.sender_password)
        
        if not self.enabled:
            logger.warning("Email service not configured. Please set SMTP_SENDER and SMTP_PASSWORD environment variables.")
    
    def send_feedback_notification(
        self, 
        customer_feedback: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        rating: Optional[int] = None
    ) -> bool:
        """Send negative feedback notification to ps@cafinc.ca"""
        if not self.enabled:
            logger.warning("Email service not configured. Skipping feedback notification.")
            return False
        
        recipient = "ps@cafinc.ca"
        subject = "⚠️ Negative Customer Feedback Alert"
        
        # Create email content
        body = f"""
CAF Property Services - Negative Feedback Alert

A customer has submitted negative feedback that requires your attention.

Feedback Details:
================
Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Rating: {rating if rating else 'Not provided'}
Customer Name: {customer_name if customer_name else 'Not provided'}
Customer Email: {customer_email if customer_email else 'Not provided'}

Feedback Message:
{customer_feedback}

================

This is an automated notification from the CAF Property Services customer feedback system.
Please review and respond to this feedback promptly to maintain customer satisfaction.

Best regards,
CAF Property Services System
        """.strip()
        
        return self._send_email(recipient, subject, body)
    
    def send_dispatch_notification(
        self,
        dispatch_details: dict,
        crew_email: str,
        crew_name: str
    ) -> bool:
        """Send dispatch notification to crew member"""
        if not self.enabled:
            logger.warning("Email service not configured. Skipping dispatch notification.")
            return False
        
        subject = f"🚚 New Dispatch Assignment - {dispatch_details.get('route_name', 'Snow Removal Job')}"
        
        body = f"""
CAF Property Services - Dispatch Assignment

Hello {crew_name},

You have been assigned to a new snow removal job.

Job Details:
============
Route: {dispatch_details.get('route_name', 'N/A')}
Scheduled Date: {dispatch_details.get('scheduled_date', 'N/A')}
Scheduled Time: {dispatch_details.get('scheduled_time', 'N/A')}
Services: {', '.join(dispatch_details.get('services', []))}
Status: {dispatch_details.get('status', 'N/A')}

Instructions:
- Check your mobile app for detailed site information
- Ensure you have all required equipment
- Take before and after photos at each site
- Update job status as you progress

Please confirm receipt of this assignment and contact dispatch if you have any questions.

Best regards,
CAF Property Services Dispatch
        """.strip()
        
        return self._send_email(crew_email, subject, body)
    
    def send_completion_notification(
        self,
        customer_email: str,
        customer_name: str,
        service_details: dict
    ) -> bool:
        """Send service completion notification to customer"""
        if not self.enabled:
            logger.warning("Email service not configured. Skipping completion notification.")
            return False
        
        subject = f"✅ Service Complete - {service_details.get('route_name', 'Snow Removal')}"
        
        body = f"""
CAF Property Services - Service Completion Notice

Dear {customer_name},

We are pleased to inform you that your snow removal service has been completed.

Service Details:
===============
Service: {service_details.get('route_name', 'Snow Removal')}
Completed Date: {datetime.now().strftime('%Y-%m-%d')}
Services Performed: {', '.join(service_details.get('services', []))}
Crew: {service_details.get('crew_name', 'CAF Property Services Team')}

Your property has been cleared according to our service standards. Before and after photos have been documented for quality assurance.

If you have any questions or concerns about the service provided, please don't hesitate to contact us.

Thank you for choosing CAF Property Services!

Best regards,
CAF Property Services Team
Phone: (XXX) XXX-XXXX
Email: info@cafpropertyservices.com
        """.strip()
        
        return self._send_email(customer_email, subject, body)
    
    def send_test_email(self, recipient: str) -> bool:
        """Send a test email to verify email configuration"""
        if not self.enabled:
            return False
        
        subject = "📧 CAF Property Services - Email Test"
        body = f"""
CAF Property Services - Email Configuration Test

This is a test email to verify that the email service is properly configured.

Test Details:
=============
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
From: {self.sender_email}
To: {recipient}
SMTP Server: {self.smtp_server}:{self.smtp_port}

If you receive this email, the email service is working correctly!

Best regards,
CAF Property Services System
        """.strip()
        
        return self._send_email(recipient, subject, body)
    
    def send_onboarding_email(
        self,
        new_member_email: str,
        new_member_name: str,
        username: str,
        temporary_password: str,
        role: str
    ) -> bool:
        """Send welcome email to new team member with credentials and app instructions"""
        if not self.enabled:
            logger.warning("Email service not configured. Skipping onboarding email.")
            return False
        
        role_title = {
            'admin': 'Administrator',
            'crew': 'Crew Member',
            'customer': 'Customer',
            'subcontractor': 'Subcontractor'
        }.get(role.lower(), 'Team Member')
        
        subject = f"🎉 Welcome to CAF Property Services - Your Account Details"
        
        body = f"""
Welcome to CAF Property Services!

Dear {new_member_name},

Welcome to the CAF Property Services team! We're excited to have you join us as a {role_title}.

Your Account Details:
====================
Username: {username}
Temporary Password: {temporary_password}
Role: {role_title}

IMPORTANT: Please change your password after your first login for security.

Mobile App Download:
===================
To get started, please download our mobile app:

📱 For iPhone/iPad:
https://apps.apple.com/app/expo-go/id982107779
Then scan the QR code provided by your supervisor

📱 For Android:
https://play.google.com/store/apps/details?id=host.exp.exponent
Then scan the QR code provided by your supervisor

🌐 Web Access:
You can also access the system through your web browser at:
https://app.emergent.sh (use your credentials above)

Getting Started:
===============
1. Download the Expo Go app from your app store
2. Ask your supervisor for the QR code to access CAF Property Services
3. Log in using the credentials above
4. Complete your profile setup
5. Review the training materials in the app

What You Can Do:
===============
As a {role_title}, you will have access to:
""" + ("""
- View and manage job dispatches
- Update job status and progress
- Take before/after photos of work sites
- Track GPS location during jobs
- Submit safety check forms
- Communicate with dispatch and customers
""" if role.lower() in ['crew', 'subcontractor'] else """
- View your service requests and updates
- Access work completion photos
- Communicate with our team
- Provide feedback on services
""" if role.lower() == 'customer' else """
- Manage all system operations
- Assign and monitor dispatches
- Review crew performance and photos
- Manage customer accounts and feedback
- Access comprehensive reporting and analytics
""") + f"""

Support:
========
If you have any questions or need assistance:
- Email: {self.sender_email}
- Phone: Contact your supervisor
- In-app support: Use the help section in the mobile app

We're here to help you succeed and provide excellent service to our customers.

Welcome to the team!

Best regards,
CAF Property Services Management Team

---
This is an automated message. Please do not reply to this email.
For support, contact your supervisor or use the contact information above.
        """.strip()
        
        return self._send_email(new_member_email, subject, body)
    
    def _send_email(self, recipient: str, subject: str, body: str) -> bool:
        """Send an email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = recipient
            msg['Subject'] = subject
            
            # Add body to email
            msg.attach(MIMEText(body, 'plain'))
            
            # Create SMTP session
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # Enable TLS encryption
            server.login(self.sender_email, self.sender_password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(self.sender_email, recipient, text)
            server.quit()
            
            logger.info(f"Email sent successfully to {recipient}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            return False
    
    def send_credentials_email(self, to_email: str, name: str, username: str, password: str, 
                               access_web: bool, access_inapp: bool, role: str) -> bool:
        """Send welcome email with login credentials using database template"""
        
        # For development without SMTP configured
        if not self.enabled:
            logger.info(f"[EMAIL MOCK] Sending credentials to {to_email}")
            logger.info(f"[EMAIL MOCK] Username: {username}, Password: {password}, Role: {role}")
            logger.info(f"[EMAIL MOCK] Access - Web: {access_web}, InApp: {access_inapp}")
            return True
        
        # Build access text
        access_types = []
        if access_web:
            access_types.append("Web Dashboard")
        if access_inapp:
            access_types.append("Mobile App")
        access_text = " and ".join(access_types) if access_types else "No access configured"
        
        # Build login button HTML
        login_button = ""
        if access_web:
            login_button = '<a href="https://biz-ops.preview.emergentagent.com/login" class="button">Login to Web Dashboard</a>'
        
        subject = "Welcome to Snow Dash - Your Account Credentials"
        
        # Try to get template from database, fallback to hardcoded if not found
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            import os
            import asyncio
            
            async def get_template():
                mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
                db_name = os.getenv('DB_NAME', 'snow_removal')
                client = AsyncIOMotorClient(mongo_url)
                db = client[db_name]
                template = await db.email_templates.find_one({"name": "User Login Credentials"})
                return template
            
            # Get template from database
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            template = loop.run_until_complete(get_template())
            loop.close()
            
            if template:
                # Use template from database
                html_content = template['body']
                subject = template['subject']
                
                # Replace placeholders
                html_content = html_content.replace('{{name}}', name)
                html_content = html_content.replace('{{username}}', username)
                html_content = html_content.replace('{{password}}', password)
                html_content = html_content.replace('{{role}}', role.title())
                html_content = html_content.replace('{{access}}', access_text)
                html_content = html_content.replace('{{login_button}}', login_button)
                
                logger.info("Using database template for credentials email")
            else:
                # Fallback to hardcoded template
                html_content = self._get_fallback_credentials_template(
                    name, username, password, role, access_text, login_button
                )
                logger.info("Using fallback template for credentials email")
        except Exception as e:
            logger.warning(f"Could not load template from database: {e}, using fallback")
            html_content = self._get_fallback_credentials_template(
                name, username, password, role, access_text, login_button
            )
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            part = MIMEText(html_content, 'html')
            msg.attach(part)
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            
            text = msg.as_string()
            server.sendmail(self.sender_email, to_email, text)
            server.quit()
            
            logger.info(f"Credentials email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send credentials email to {to_email}: {str(e)}")
            return False
    
    def _get_fallback_credentials_template(self, name: str, username: str, password: str, 
                                           role: str, access_text: str, login_button: str) -> str:
        """Fallback template if database template not available"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #3f72af; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
        .credentials {{ background-color: white; padding: 20px; border-left: 4px solid #3f72af; margin: 20px 0; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #3f72af; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Snow Dash!</h1>
        </div>
        <div class="content">
            <p>Hello {name},</p>
            <p>Your Snow Dash account has been successfully created. You now have access to our platform!</p>
            
            <div class="credentials">
                <h3>Your Login Credentials</h3>
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Password:</strong> {password}</p>
                <p><strong>Role:</strong> {role.title()}</p>
                <p><strong>Access:</strong> {access_text}</p>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                {login_button}
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Snow Dash. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """

# Global email service instance
email_service = EmailService()