"""
Migration script to add messaging fields to existing users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

async def migrate_users():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.snow_removal
    
    print("Starting user migration...")
    
    # Update all users to have default messaging fields if they don't exist
    result = await db.users.update_many(
        {},
        {
            "$set": {
                "messaging_enabled": True,
                "status": "on_shift"  # Set everyone to on_shift by default
            }
        }
    )
    
    print(f"Updated {result.modified_count} users with default messaging fields")
    
    # Set default titles based on role
    await db.users.update_many(
        {"role": "admin", "$or": [{"title": None}, {"title": {"$exists": False}}]},
        {"$set": {"title": "Administrator"}}
    )
    
    await db.users.update_many(
        {"role": "crew", "$or": [{"title": None}, {"title": {"$exists": False}}]},
        {"$set": {"title": "Crew Member"}}
    )
    
    await db.users.update_many(
        {"role": "subcontractor", "$or": [{"title": None}, {"title": {"$exists": False}}]},
        {"$set": {"title": "Subcontractor"}}
    )
    
    await db.users.update_many(
        {"role": "customer", "$or": [{"title": None}, {"title": {"$exists": False}}]},
        {"$set": {"title": "Customer"}}
    )
    
    print("Set default titles based on roles")
    
    # Show updated users
    users = await db.users.find({}, {"name": 1, "role": 1, "status": 1, "title": 1, "messaging_enabled": 1}).to_list(100)
    print("\nUpdated users:")
    for user in users:
        print(f"  - {user['name']} ({user['role']}): status={user.get('status', 'N/A')}, title={user.get('title', 'N/A')}, messaging_enabled={user.get('messaging_enabled', True)}")
    
    client.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_users())
