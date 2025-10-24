"""
Script to add Login Credentials Email Template to the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'snow_removal')

async def seed_credentials_template():
    """Add login credentials email template"""
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if template already exists
    existing = await db.email_templates.find_one({"name": "User Login Credentials"})
    
    if existing:
        print("✅ Login credentials template already exists")
        return existing
    
    # Create the template
    template = {
        "user_id": "system",  # System template
        "name": "User Login Credentials",
        "subject": "Welcome to Snow Dash - Your Account Credentials",
        "body": """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3f72af; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .credentials { background-color: white; padding: 20px; border-left: 4px solid #3f72af; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3f72af; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Snow Dash!</h1>
        </div>
        <div class="content">
            <p>Hello {{name}},</p>
            <p>Your Snow Dash account has been successfully created. You now have access to our platform!</p>
            
            <div class="credentials">
                <h3>Your Login Credentials</h3>
                <p><strong>Username:</strong> {{username}}</p>
                <p><strong>Password:</strong> {{password}}</p>
                <p><strong>Role:</strong> {{role}}</p>
                <p><strong>Access:</strong> {{access}}</p>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                {{login_button}}
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Snow Dash. All rights reserved.</p>
        </div>
    </div>
</body>
</html>""",
        "category": "System",
        "placeholders": [
            "{{name}}",
            "{{username}}",
            "{{password}}",
            "{{role}}",
            "{{access}}",
            "{{login_button}}"
        ],
        "is_shared": True,  # Available to all users
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "usage_count": 0
    }
    
    result = await db.email_templates.insert_one(template)
    template['_id'] = result.inserted_id
    
    print(f"✅ Login credentials email template created successfully!")
    print(f"   Template ID: {result.inserted_id}")
    print(f"   Name: {template['name']}")
    print(f"   Category: {template['category']}")
    print(f"   Placeholders: {', '.join(template['placeholders'])}")
    
    return template

if __name__ == "__main__":
    asyncio.run(seed_credentials_template())
