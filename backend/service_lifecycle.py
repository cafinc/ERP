#!/usr/bin/env python3
"""
Service Lifecycle Automation - End-to-End Workflow Management
Automates the complete service lifecycle from request to payment
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from realtime_service import realtime_service, EventType

load_dotenv()

logger = logging.getLogger(__name__)

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Collections
service_requests_collection = db["service_requests"]
estimates_collection = db["estimates"]
projects_collection = db["projects"]
work_orders_collection = db["work_orders"]
invoices_collection = db["invoices"]
customers_collection = db["customers"]
tasks_collection = db["tasks"]
communications_collection = db["communications"]

class ServiceLifecycleAutomation:
    """Automates the entire service lifecycle workflow"""
    
    @staticmethod
    async def create_service_request(
        customer_id: str,
        service_type: str,
        property_address: str,
        description: str,
        urgency: str = "normal",
        requested_date: Optional[datetime] = None
    ) -> Dict:
        """
        Step 1: Customer creates service request
        Triggers automatic estimate generation
        """
        try:
            service_request = {
                "customer_id": customer_id,
                "service_type": service_type,
                "property_address": property_address,
                "description": description,
                "urgency": urgency,
                "requested_date": requested_date or datetime.utcnow(),
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await service_requests_collection.insert_one(service_request)
            service_request["_id"] = result.inserted_id
            
            logger.info(f"Service request created: {result.inserted_id}")
            
            # Auto-generate estimate using AI/historical data
            estimate = await ServiceLifecycleAutomation._generate_estimate(service_request)
            
            # Notify admin of new service request
            await realtime_service.emit_system_alert({
                "message": f"New service request from customer: {service_type}",
                "service_request_id": str(result.inserted_id),
                "urgency": urgency
            }, severity="info")
            
            # Send notification to customer
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            if customer and customer.get("email"):
                await ServiceLifecycleAutomation._send_email(
                    to=customer["email"],
                    subject="Service Request Received",
                    body=f"We've received your request for {service_type}. An estimate will be sent shortly."
                )
            
            return {
                "success": True,
                "service_request_id": str(result.inserted_id),
                "estimate_id": str(estimate["_id"]) if estimate else None,
                "message": "Service request created and estimate generated"
            }
            
        except Exception as e:
            logger.error(f"Error creating service request: {e}")
            raise
    
    @staticmethod
    async def _generate_estimate(service_request: Dict) -> Optional[Dict]:
        """
        Step 2: Auto-generate estimate based on service request
        Uses historical data and property info for pricing
        """
        try:
            # Get customer info
            customer = await customers_collection.find_one({
                "_id": ObjectId(service_request["customer_id"])
            })
            
            if not customer:
                return None
            
            # Get historical pricing for similar services
            historical_estimates = await estimates_collection.find({
                "service_type": service_request["service_type"],
                "status": "approved"
            }).sort("created_at", -1).limit(10).to_list(10)
            
            # Calculate average price (simplified - would use ML in production)
            if historical_estimates:
                avg_price = sum(e.get("total_amount", 0) for e in historical_estimates) / len(historical_estimates)
            else:
                # Default pricing based on service type
                default_prices = {
                    "snow_plowing": 150.0,
                    "snow_removal": 250.0,
                    "salting": 75.0,
                    "de_icing": 100.0,
                    "full_service": 400.0
                }
                avg_price = default_prices.get(service_request["service_type"], 200.0)
            
            # Create estimate
            estimate = {
                "customer_id": service_request["customer_id"],
                "customer_name": customer.get("name", "Unknown"),
                "service_request_id": str(service_request["_id"]),
                "service_type": service_request["service_type"],
                "property_address": service_request["property_address"],
                "description": service_request["description"],
                "line_items": [
                    {
                        "description": f"{service_request['service_type'].replace('_', ' ').title()} Service",
                        "quantity": 1,
                        "unit_price": avg_price,
                        "total": avg_price
                    }
                ],
                "subtotal": avg_price,
                "tax": avg_price * 0.13,  # 13% tax (Canadian GST/PST example)
                "total_amount": avg_price * 1.13,
                "status": "draft",
                "valid_until": datetime.utcnow() + timedelta(days=30),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "notes": "Auto-generated estimate based on historical pricing"
            }
            
            result = await estimates_collection.insert_one(estimate)
            estimate["_id"] = result.inserted_id
            
            logger.info(f"Estimate generated: {result.inserted_id}")
            
            # Send estimate to customer
            if customer.get("email"):
                await ServiceLifecycleAutomation._send_email(
                    to=customer["email"],
                    subject=f"Estimate for {service_request['service_type']}",
                    body=f"Your estimate: ${estimate['total_amount']:.2f}. Valid until {estimate['valid_until'].strftime('%Y-%m-%d')}. Click to approve."
                )
            
            return estimate
            
        except Exception as e:
            logger.error(f"Error generating estimate: {e}")
            return None
    
    @staticmethod
    async def approve_estimate(estimate_id: str, approved_by: str) -> Dict:
        """
        Step 3: Customer approves estimate
        Triggers automatic PROJECT creation, then work order
        """
        try:
            estimate = await estimates_collection.find_one({"_id": ObjectId(estimate_id)})
            
            if not estimate:
                return {"success": False, "error": "Estimate not found"}
            
            # Update estimate status
            await estimates_collection.update_one(
                {"_id": ObjectId(estimate_id)},
                {
                    "$set": {
                        "status": "approved",
                        "approved_at": datetime.utcnow(),
                        "approved_by": approved_by,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Estimate approved: {estimate_id}")
            
            # Auto-create PROJECT from estimate
            project = await ServiceLifecycleAutomation._create_project_from_estimate(estimate)
            
            # Auto-create work order linked to project
            work_order = await ServiceLifecycleAutomation._create_work_order_from_project(estimate, project)
            
            # Create task for crew assignment
            await ServiceLifecycleAutomation._create_crew_assignment_task(work_order)
            
            # Notify customer
            customer = await customers_collection.find_one({"_id": ObjectId(estimate["customer_id"])})
            if customer and customer.get("email"):
                await ServiceLifecycleAutomation._send_email(
                    to=customer["email"],
                    subject="Project Created - Work Order Scheduled",
                    body=f"Your service has been approved! Project #{project['_id']} created. Work order #{work_order['_id']} scheduled."
                )
            
            return {
                "success": True,
                "project_id": str(project["_id"]),
                "work_order_id": str(work_order["_id"]),
                "message": "Estimate approved, project and work order created"
            }
            
        except Exception as e:
            logger.error(f"Error approving estimate: {e}")
            raise
    
    @staticmethod
    async def _create_work_order_from_estimate(estimate: Dict) -> Dict:
        """Create work order from approved estimate"""
        work_order = {
            "customer_id": estimate["customer_id"],
            "customer_name": estimate.get("customer_name", "Unknown"),
            "estimate_id": str(estimate["_id"]),
            "service_type": estimate["service_type"],
            "property_address": estimate.get("property_address", ""),
            "description": estimate.get("description", ""),
            "status": "pending",
            "priority": "medium",
            "estimated_amount": estimate["total_amount"],
            "assigned_crew": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await work_orders_collection.insert_one(work_order)
        work_order["_id"] = result.inserted_id
        
        logger.info(f"Work order created: {result.inserted_id}")
        
        # Broadcast real-time event
        await realtime_service.emit_work_order_event(
            EventType.WORK_ORDER_CREATED,
            {
                "id": str(result.inserted_id),
                "customer_name": work_order["customer_name"],
                "service_type": work_order["service_type"],
                "status": "pending"
            }
        )
        
        return work_order
    
    @staticmethod
    async def _create_crew_assignment_task(work_order: Dict):
        """Create task for admin to assign crew"""
        task = {
            "title": f"Assign Crew - {work_order['service_type']}",
            "description": f"Assign crew for work order at {work_order.get('property_address', 'Unknown')}",
            "type": "crew_assignment",
            "priority": "high" if work_order.get("priority") == "urgent" else "medium",
            "status": "pending",
            "work_order_id": str(work_order["_id"]),
            "assigned_to": ["admin"],  # Assign to admin role
            "assigned_by": "system",
            "assigned_by_name": "Automated System",
            "due_date": datetime.utcnow() + timedelta(hours=24),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await tasks_collection.insert_one(task)
        logger.info(f"Crew assignment task created: {result.inserted_id}")
        
        # Notify admins
        await realtime_service.emit_task_event(
            EventType.TASK_CREATED,
            {
                "id": str(result.inserted_id),
                "title": task["title"],
                "priority": task["priority"]
            },
            affected_users=["admin"]
        )
    
    @staticmethod
    async def complete_work_order(
        work_order_id: str,
        completed_by: str,
        actual_hours: float,
        completion_notes: str,
        photos: List[str] = []
    ) -> Dict:
        """
        Step 4: Crew completes work order
        Triggers automatic invoice generation
        """
        try:
            work_order = await work_orders_collection.find_one({"_id": ObjectId(work_order_id)})
            
            if not work_order:
                return {"success": False, "error": "Work order not found"}
            
            # Update work order
            await work_orders_collection.update_one(
                {"_id": ObjectId(work_order_id)},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "completed_by": completed_by,
                        "actual_hours": actual_hours,
                        "completion_notes": completion_notes,
                        "photos": photos,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Work order completed: {work_order_id}")
            
            # Auto-generate invoice
            invoice = await ServiceLifecycleAutomation._generate_invoice(work_order, actual_hours)
            
            # Send completion notification to customer with photos
            customer = await customers_collection.find_one({"_id": ObjectId(work_order["customer_id"])})
            if customer and customer.get("email"):
                await ServiceLifecycleAutomation._send_email(
                    to=customer["email"],
                    subject="Service Completed",
                    body=f"Your service has been completed. Invoice #{invoice['_id']} has been sent. Amount due: ${invoice['total_amount']:.2f}"
                )
            
            # Broadcast completion event
            await realtime_service.emit_work_order_event(
                EventType.WORK_ORDER_COMPLETED,
                {
                    "id": work_order_id,
                    "customer_name": work_order["customer_name"],
                    "completion_notes": completion_notes
                }
            )
            
            return {
                "success": True,
                "invoice_id": str(invoice["_id"]),
                "message": "Work order completed and invoice generated"
            }
            
        except Exception as e:
            logger.error(f"Error completing work order: {e}")
            raise
    
    @staticmethod
    async def _generate_invoice(work_order: Dict, actual_hours: float) -> Dict:
        """Generate invoice from completed work order"""
        # Calculate costs
        hourly_rate = 75.0  # Default hourly rate
        labor_cost = actual_hours * hourly_rate
        estimated_amount = work_order.get("estimated_amount", 0)
        
        # Use estimated amount or actual cost, whichever is appropriate
        subtotal = max(estimated_amount, labor_cost)
        tax = subtotal * 0.13
        total = subtotal + tax
        
        invoice = {
            "customer_id": work_order["customer_id"],
            "customer_name": work_order["customer_name"],
            "work_order_id": str(work_order["_id"]),
            "invoice_number": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{str(work_order['_id'])[-6:]}",
            "service_type": work_order["service_type"],
            "line_items": [
                {
                    "description": f"{work_order['service_type'].replace('_', ' ').title()} - {actual_hours} hours",
                    "quantity": actual_hours,
                    "unit_price": hourly_rate,
                    "total": labor_cost
                }
            ],
            "subtotal": subtotal,
            "tax": tax,
            "total_amount": total,
            "status": "sent",
            "due_date": datetime.utcnow() + timedelta(days=30),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await invoices_collection.insert_one(invoice)
        invoice["_id"] = result.inserted_id
        
        logger.info(f"Invoice generated: {result.inserted_id}")
        
        return invoice
    
    @staticmethod
    async def _send_email(to: str, subject: str, body: str):
        """Send email notification (placeholder for actual email service)"""
        # This would integrate with actual email service (SendGrid, AWS SES, etc.)
        logger.info(f"Email sent to {to}: {subject}")
        
        # Store in communications log
        await communications_collection.insert_one({
            "type": "email",
            "to": to,
            "subject": subject,
            "body": body,
            "status": "sent",
            "sent_at": datetime.utcnow()
        })

# Export singleton instance
service_lifecycle = ServiceLifecycleAutomation()

logger.info("Service lifecycle automation initialized successfully")
