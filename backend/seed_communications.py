"""
Seed Script for Communication Center
Populates the database with sample communications data
"""

import os
import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import random

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "snow_removal_db")]

# Collections
communications_collection = db["communications"]
customers_collection = db["customers"]


async def seed_communications():
    """Create sample communications for existing customers"""
    
    print("🚀 Starting Communication Center Data Seeding...")
    print("=" * 60)
    
    # Get first 5 customers
    customers = await customers_collection.find().limit(5).to_list(5)
    
    if not customers:
        print("❌ No customers found. Please add customers first!")
        return
    
    print(f"✅ Found {len(customers)} customers")
    
    # Sample messages for each type
    inapp_messages = [
        "Hi! Just wanted to check in on your snow removal service.",
        "Your crew did an excellent job this morning. Thank you!",
        "Quick question about the invoice I received.",
        "Can you come back tomorrow? We need additional clearing.",
        "Thanks for the prompt service during the storm!",
        "The crew was very professional and courteous.",
        "I'd like to schedule a recurring service for the winter season.",
        "Do you offer sidewalk salting services?",
        "Great work as always. See you next snowfall!",
        "Just confirming our service appointment for tomorrow at 8 AM."
    ]
    
    sms_messages = [
        "Crew on the way! ETA 15 minutes.",
        "Service completed. Check your portal for photos.",
        "Storm watch: We'll be monitoring overnight.",
        "Your property is on today's route.",
        "Invoice sent. Payment due in 30 days.",
        "Thanks for your payment!",
        "Reminder: Service scheduled for tomorrow morning.",
        "All clear! Your lot and sidewalks are done.",
        "Heavy snow expected. We're ready!",
        "Following up on your service request."
    ]
    
    email_subjects = [
        "Service Completion Report",
        "Winter Season Contract Renewal",
        "Storm Preparation Notice",
        "Invoice #1234 - Snow Removal Services",
        "Thank You for Your Business",
        "Upcoming Service Schedule",
        "Weather Alert: Snow Expected Tonight",
        "Quality Assurance Follow-Up",
        "Service Photos Attached",
        "Payment Confirmation"
    ]
    
    email_bodies = [
        "We have completed snow removal services at your property. All areas including parking lot and sidewalks have been cleared. Photos are available in your customer portal.",
        "As the winter season approaches, we'd like to invite you to renew your service contract. Our early-bird pricing is available until November 15th.",
        "Heavy snowfall is expected in your area tonight. Our crews are on standby and will begin service as soon as accumulation reaches trigger depth.",
        "Your invoice for recent snow removal services is attached. Payment is due within 30 days. Thank you for your continued business.",
        "Thank you for choosing CAF Property Services for your snow removal needs. We appreciate your business and look forward to serving you throughout the winter season.",
        "Your property is scheduled for service this week. We will arrive between 6 AM and 9 AM on the days we service your route.",
        "The National Weather Service has issued a winter storm warning for your area. Our team is prepared to respond 24/7 to keep your property safe and accessible.",
        "We're following up on the service completed last week. Please let us know if you have any questions or concerns about the work performed.",
        "Photos of today's service have been uploaded to your customer portal. You can view before and after images of your property.",
        "We have received your payment. Thank you! Your account is current and in good standing."
    ]
    
    phone_notes = [
        "Customer called to request additional salting. Scheduled for tomorrow morning.",
        "Follow-up call regarding invoice payment. Customer confirmed payment will be sent this week.",
        "Emergency service request - customer needs immediate plowing after accident blocked driveway.",
        "Courtesy call to confirm satisfaction with recent service. Customer very happy.",
        "Customer inquiry about adding sidewalk clearing to contract. Sent quote.",
        "Scheduling call - customer wants to move to priority route for faster service.",
        "Billing question answered - explained line items on invoice.",
        "Customer reported missed spot in parking lot. Crew dispatched to fix.",
        "Quote request for commercial property. Site visit scheduled.",
        "Customer called to express appreciation for crew's excellent work during storm."
    ]
    
    total_created = 0
    
    for customer in customers:
        customer_id = str(customer["_id"])
        customer_name = customer.get("name", "Customer")
        
        print(f"\n📱 Creating communications for: {customer_name}")
        print("-" * 60)
        
        communications = []
        
        # Create 3-5 InApp messages per customer
        num_inapp = random.randint(3, 5)
        for i in range(num_inapp):
            days_ago = random.randint(1, 30)
            direction = "inbound" if random.random() > 0.5 else "outbound"
            
            comm = {
                "customer_id": customer_id,
                "user_id": "admin",
                "type": "inapp",
                "direction": direction,
                "content": random.choice(inapp_messages),
                "message": random.choice(inapp_messages),
                "timestamp": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "created_at": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "read": random.choice([True, True, False]),  # Mostly read
                "status": "sent"
            }
            communications.append(comm)
        
        # Create 2-4 SMS messages per customer
        num_sms = random.randint(2, 4)
        for i in range(num_sms):
            days_ago = random.randint(1, 20)
            direction = "outbound"  # SMS are usually outbound from business
            
            comm = {
                "customer_id": customer_id,
                "user_id": "admin",
                "type": "sms",
                "direction": direction,
                "content": random.choice(sms_messages),
                "message": random.choice(sms_messages),
                "to": customer.get("phone", "(555) 123-4567"),
                "timestamp": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "created_at": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "status": "delivered",
                "integration": "ringcentral"
            }
            communications.append(comm)
        
        # Create 2-3 Email messages per customer
        num_email = random.randint(2, 3)
        for i in range(num_email):
            days_ago = random.randint(1, 45)
            direction = "outbound"  # Most emails are outbound
            subject = random.choice(email_subjects)
            body = random.choice(email_bodies)
            
            comm = {
                "customer_id": customer_id,
                "user_id": "admin",
                "type": "email",
                "direction": direction,
                "content": body,
                "body": body,
                "subject": subject,
                "to": customer.get("email", "customer@example.com"),
                "timestamp": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "created_at": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "read": random.choice([True, False]),
                "status": "sent",
                "integration": "gmail"
            }
            communications.append(comm)
        
        # Create 1-2 Phone call logs per customer
        num_phone = random.randint(1, 2)
        for i in range(num_phone):
            days_ago = random.randint(1, 15)
            direction = random.choice(["inbound", "outbound"])
            
            comm = {
                "customer_id": customer_id,
                "user_id": "admin",
                "type": "phone",
                "direction": direction,
                "content": random.choice(phone_notes),
                "message": random.choice(phone_notes),
                "notes": random.choice(phone_notes),
                "phone": customer.get("phone", "(555) 123-4567"),
                "duration": random.randint(120, 600),  # 2-10 minutes in seconds
                "timestamp": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "created_at": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
                "status": "completed",
                "integration": "ringcentral"
            }
            communications.append(comm)
        
        # Insert all communications for this customer
        if communications:
            result = await communications_collection.insert_many(communications)
            count = len(result.inserted_ids)
            total_created += count
            
            # Print summary
            types_count = {}
            for comm in communications:
                comm_type = comm["type"]
                types_count[comm_type] = types_count.get(comm_type, 0) + 1
            
            print(f"  ✅ Created {count} communications:")
            for comm_type, type_count in types_count.items():
                print(f"     - {comm_type.upper()}: {type_count}")
    
    print("\n" + "=" * 60)
    print(f"🎉 Seeding Complete!")
    print(f"📊 Total communications created: {total_created}")
    print(f"👥 Customers updated: {len(customers)}")
    print("\n✨ You can now view the Communication Center in action!")
    print("   Navigate to: Customers → [Select a Customer] → Communications Tab")
    print("=" * 60)


async def clear_existing_communications():
    """Clear existing test communications (optional)"""
    print("🧹 Clearing existing communications...")
    result = await communications_collection.delete_many({})
    print(f"   Deleted {result.deleted_count} existing communications")


async def show_statistics():
    """Show current communication statistics"""
    print("\n📊 Current Communication Statistics:")
    print("-" * 60)
    
    total = await communications_collection.count_documents({})
    print(f"Total Communications: {total}")
    
    # Count by type
    for comm_type in ["inapp", "sms", "email", "phone"]:
        count = await communications_collection.count_documents({"type": comm_type})
        print(f"  - {comm_type.upper()}: {count}")
    
    # Count by direction
    inbound = await communications_collection.count_documents({"direction": "inbound"})
    outbound = await communications_collection.count_documents({"direction": "outbound"})
    print(f"\nInbound: {inbound}")
    print(f"Outbound: {outbound}")
    
    print("-" * 60)


async def main():
    """Main execution"""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        await clear_existing_communications()
    
    await seed_communications()
    await show_statistics()
    
    # Close connection
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
