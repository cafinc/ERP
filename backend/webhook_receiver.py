"""
Webhook Receiver for Custom Workflows
Allows external systems to trigger workflows via webhooks
"""

import logging
import hmac
import hashlib
from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Database connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "snow_removal_db")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

@router.post("/{webhook_id}")
async def receive_webhook(
    webhook_id: str,
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
):
    """
    Receive webhook and trigger associated workflows
    
    Args:
        webhook_id: Unique identifier for the webhook endpoint
        request: Raw HTTP request with payload
        x_webhook_signature: Optional signature for verification
    """
    try:
        # Get request body
        payload = await request.json()
        
        logger.info(f"Received webhook: {webhook_id}")
        
        # Import here to avoid circular dependency
        from event_emitter import get_event_emitter
        from server import db
        
        # Find workflows with matching webhook trigger
        workflows = await db.custom_workflows.find({
            'enabled': True,
            'trigger.trigger_type': 'webhook',
            'trigger.webhook_id': webhook_id
        }).to_list(length=100)
        
        if not workflows:
            logger.warning(f"No workflows found for webhook: {webhook_id}")
            return {
                "success": False,
                "message": f"No active workflows configured for webhook: {webhook_id}"
            }
        
        logger.info(f"Found {len(workflows)} workflow(s) for webhook: {webhook_id}")
        
        # Verify signature if configured
        for workflow in workflows:
            trigger_config = workflow.get('trigger', {})
            secret = trigger_config.get('webhook_secret')
            
            if secret and x_webhook_signature:
                # Verify HMAC signature
                body_bytes = await request.body()
                expected_signature = hmac.new(
                    secret.encode(),
                    body_bytes,
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(x_webhook_signature, expected_signature):
                    logger.warning(f"Invalid webhook signature for workflow: {workflow['_id']}")
                    continue
        
        # Emit webhook event to trigger workflows
        event_emitter = get_event_emitter()
        if event_emitter:
            await event_emitter.emit('webhook_received', {
                'webhook_id': webhook_id,
                'payload': payload,
                'timestamp': datetime.utcnow().isoformat(),
                'headers': dict(request.headers)
            })
        
        return {
            "success": True,
            "message": f"Webhook received and {len(workflows)} workflow(s) triggered",
            "workflows_triggered": len(workflows),
            "webhook_id": webhook_id
        }
        
    except Exception as e:
        logger.error(f"Error processing webhook {webhook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{webhook_id}/test")
async def test_webhook(webhook_id: str):
    """Test webhook endpoint"""
    return {
        "success": True,
        "message": f"Webhook endpoint {webhook_id} is active",
        "webhook_id": webhook_id,
        "timestamp": datetime.utcnow().isoformat()
    }
