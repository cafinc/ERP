"""
User Access Service for creating and managing user accounts
"""
import secrets
import string
import logging
import bcrypt
from typing import Dict, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from email_service import EmailService

load_dotenv()

logger = logging.getLogger(__name__)
email_service = EmailService()

# Get database connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv('DB_NAME', 'snow_removal')]
users_collection = db['users']

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def generate_username(email: str, first_name: str, last_name: str) -> str:
    """Generate username from email or name"""
    # Try email prefix first
    if '@' in email:
        username = email.split('@')[0].lower()
    else:
        # Fallback to first.last format
        username = f"{first_name.lower()}.{last_name.lower()}".replace(' ', '')
    
    # Check if username exists, append number if needed
    base_username = username
    counter = 1
    while users_collection.find_one({'username': username}):
        username = f"{base_username}{counter}"
        counter += 1
    
    return username

def generate_password(length: int = 12) -> str:
    """Generate a secure random password"""
    characters = string.ascii_letters + string.digits + "!@#$%"
    password = ''.join(secrets.choice(characters) for _ in range(length))
    # Ensure at least one of each type
    if not any(c.islower() for c in password):
        password = password[:-1] + secrets.choice(string.ascii_lowercase)
    if not any(c.isupper() for c in password):
        password = password[:-1] + secrets.choice(string.ascii_uppercase)
    if not any(c.isdigit() for c in password):
        password = password[:-1] + secrets.choice(string.digits)
    return password

def create_user_account(
    customer_id: str,
    email: str,
    first_name: str,
    last_name: str,
    role: str = 'customer',
    access_web: bool = True,
    access_inapp: bool = True,
    company_id: Optional[str] = None
) -> Optional[Dict]:
    """
    Create a user account for customer access
    
    Args:
        customer_id: Customer ID to link
        email: User email
        first_name: User first name
        last_name: User last name
        role: User role (customer, employee, contractor, manager, admin, viewer)
        access_web: Web dashboard access
        access_inapp: Mobile app access
        company_id: Optional company ID if user is linked to a company
    
    Returns:
        User document with credentials, or None if failed
    """
    try:
        # Generate credentials
        username = generate_username(email, first_name, last_name)
        password = generate_password()
        
        # Hash password using bcrypt
        password_hash = hash_password(password)
        
        # Create user document
        user_doc = {
            'username': username,
            'password': password_hash,  # Now properly hashed with bcrypt
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'role': role,
            'customer_id': customer_id,
            'company_id': company_id,
            'access': {
                'web': access_web,
                'inapp': access_inapp
            },
            'active': True,
            'must_change_password': True,
            'created_at': datetime.utcnow(),
            'last_login': None
        }
        
        # Insert into database
        result = users_collection.insert_one(user_doc)
        user_doc['_id'] = str(result.inserted_id)
        user_doc['id'] = str(result.inserted_id)
        
        logger.info(f"User account created: {username} (Customer ID: {customer_id})")
        
        # Send credentials email
        name = f"{first_name} {last_name}"
        email_sent = email_service.send_credentials_email(
            to_email=email,
            name=name,
            username=username,
            password=password,  # Send plain password in email
            access_web=access_web,
            access_inapp=access_inapp,
            role=role
        )
        
        if email_sent:
            logger.info(f"Credentials email sent to {email}")
        else:
            logger.warning(f"Failed to send credentials email to {email}")
        
        # Return user data with plain password for immediate display
        return {
            'id': str(result.inserted_id),
            'username': username,
            'password': password,  # Include for initial display/logging
            'email': email,
            'role': role,
            'access': {
                'web': access_web,
                'inapp': access_inapp
            },
            'email_sent': email_sent
        }
        
    except Exception as e:
        logger.error(f"Failed to create user account: {str(e)}")
        return None

def get_user_by_customer_id(customer_id: str) -> Optional[Dict]:
    """Get user account linked to a customer"""
    try:
        user = users_collection.find_one({'customer_id': customer_id})
        if user:
            user['id'] = str(user['_id'])
            del user['password']  # Don't return password
            return user
        return None
    except Exception as e:
        logger.error(f"Error fetching user for customer {customer_id}: {str(e)}")
        return None

def update_user_access(user_id: str, access_web: bool = None, access_inapp: bool = None, role: str = None) -> bool:
    """Update user access settings"""
    try:
        update_data = {}
        if access_web is not None:
            update_data['access.web'] = access_web
        if access_inapp is not None:
            update_data['access.inapp'] = access_inapp
        if role is not None:
            update_data['role'] = role
        
        if update_data:
            result = users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        return False
    except Exception as e:
        logger.error(f"Error updating user access: {str(e)}")
        return False

def deactivate_user(user_id: str) -> bool:
    """Deactivate a user account"""
    try:
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'active': False}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error deactivating user: {str(e)}")
        return False
