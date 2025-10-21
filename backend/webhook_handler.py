# RingCentral Webhook Handler
import logging
from datetime import datetime
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class WebhookHandler:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def handle_incoming_call(self, event_data: Dict[str, Any]):
        """Handle incoming call webhook event"""
        try:
            # Extract call information
            call_info = {
                'session_id': event_data.get('body', {}).get('sessionId'),
                'from_number': event_data.get('body', {}).get('from', {}).get('phoneNumber'),
                'from_name': event_data.get('body', {}).get('from', {}).get('name'),
                'to_number': event_data.get('body', {}).get('to', {}).get('phoneNumber'),
                'direction': event_data.get('body', {}).get('direction'),
                'timestamp': datetime.utcnow(),
                'status': 'ringing'
            }
            
            # Try to match caller to existing customer
            from_number = call_info['from_number']
            if from_number:
                # Clean phone number for matching
                import re
                clean_number = from_number.replace('+1', '').replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
                
                # Escape special regex characters
                clean_number_escaped = re.escape(clean_number)
                from_number_escaped = re.escape(from_number)
                
                # Search customers by phone
                customer = await self.db.customers.find_one({
                    '$or': [
                        {'phone': {'$regex': clean_number_escaped}},
                        {'phone': {'$regex': from_number_escaped}}
                    ]
                })
                
                if customer:
                    call_info['customer_id'] = str(customer['_id'])
                    call_info['customer_name'] = customer.get('name')
                    call_info['customer_email'] = customer.get('email')
            
            # Store active call in database
            await self.db.active_calls.update_one(
                {'session_id': call_info['session_id']},
                {'$set': call_info},
                upsert=True
            )
            
            logger.info(f"Incoming call from {call_info['from_number']} - Customer: {call_info.get('customer_name', 'Unknown')}")
            
            return call_info
            
        except Exception as e:
            logger.error(f"Error handling incoming call webhook: {e}")
            return None
    
    async def handle_call_status_change(self, event_data: Dict[str, Any]):
        """Handle call status changes (answered, ended, etc.)"""
        try:
            session_id = event_data.get('body', {}).get('sessionId')
            status = event_data.get('body', {}).get('telephonyStatus')
            
            if status in ['Disconnected', 'NoCall']:
                # Remove from active calls
                await self.db.active_calls.delete_one({'session_id': session_id})
            else:
                # Update status
                await self.db.active_calls.update_one(
                    {'session_id': session_id},
                    {'$set': {'status': status, 'updated_at': datetime.utcnow()}}
                )
            
            logger.info(f"Call {session_id} status: {status}")
            
        except Exception as e:
            logger.error(f"Error handling call status change: {e}")
    
    async def get_active_calls(self):
        """Get all currently active calls"""
        try:
            calls = await self.db.active_calls.find().to_list(100)
            return calls
        except Exception as e:
            logger.error(f"Error getting active calls: {e}")
            return []

webhook_handler = None

def init_webhook_handler(db: AsyncIOMotorDatabase):
    global webhook_handler
    webhook_handler = WebhookHandler(db)
    return webhook_handler
