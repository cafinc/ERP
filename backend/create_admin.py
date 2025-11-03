#!/usr/bin/env python3
"""
Create a default admin user for testing/deployment
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "snow_removal_db")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users_collection = db["users"]
    
    # Check if admin already exists
    existing_admin = await users_collection.find_one({"username": "admin"})
    
    if existing_admin:
        print("✓ Admin user already exists")
        print(f"Username: admin")
        print(f"Email: {existing_admin.get('email', 'admin@example.com')}")
        return
    
    # Create admin user
    admin_user = {
        "username": "admin",
        "email": "admin@example.com",
        "password_hash": pwd_context.hash("admin123"),  # Default password
        "role": "admin",
        "full_name": "System Administrator",
        "active": True,
        "created_at": "2024-01-01T00:00:00"
    }
    
    result = await users_collection.insert_one(admin_user)
    
    print("✅ Admin user created successfully!")
    print(f"Username: admin")
    print(f"Password: admin123")
    print(f"Email: admin@example.com")
    print(f"User ID: {result.inserted_id}")
    print("\n⚠️  IMPORTANT: Change the default password after first login!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
