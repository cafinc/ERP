"""
Background Scheduler for Automated Workflows
Runs periodic automation tasks for the snow removal system
"""

import asyncio
import logging
from datetime import datetime, time
from automation_engine import AutomationEngine

logger = logging.getLogger(__name__)

class BackgroundScheduler:
    """Scheduler for running automated workflows periodically"""
    
    def __init__(self, db, automation_engine: AutomationEngine):
        self.db = db
        self.automation_engine = automation_engine
        self.running = False
    
    async def start(self):
        """Start the background scheduler"""
        self.running = True
        logger.info("Background scheduler started")
        
        # Start all periodic tasks
        asyncio.create_task(self._daily_equipment_check())
        asyncio.create_task(self._daily_safety_reminders())
        asyncio.create_task(self._hourly_inventory_check())
        asyncio.create_task(self._weather_forecast_check())
        asyncio.create_task(self._invoice_reminder_check())
    
    async def stop(self):
        """Stop the background scheduler"""
        self.running = False
        logger.info("Background scheduler stopped")
    
    async def _daily_equipment_check(self):
        """Run equipment maintenance checks daily at 6 AM"""
        while self.running:
            try:
                now = datetime.now()
                # Check if it's 6 AM
                if now.hour == 6 and now.minute == 0:
                    logger.info("Running daily equipment maintenance check...")
                    result = await self.automation_engine.trigger_workflow(
                        'equipment_maintenance',
                        {}
                    )
                    logger.info(f"Equipment maintenance check completed: {result}")
                    # Sleep for 1 hour to avoid running multiple times in the same hour
                    await asyncio.sleep(3600)
                else:
                    # Sleep for 1 minute and check again
                    await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error in daily equipment check: {str(e)}")
                await asyncio.sleep(60)
    
    async def _daily_safety_reminders(self):
        """Send safety reminders daily at 7 AM"""
        while self.running:
            try:
                now = datetime.now()
                # Check if it's 7 AM
                if now.hour == 7 and now.minute == 0:
                    logger.info("Sending daily safety reminders...")
                    result = await self.automation_engine.trigger_workflow(
                        'safety_compliance',
                        {}
                    )
                    logger.info(f"Safety reminders sent: {result}")
                    await asyncio.sleep(3600)
                else:
                    await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error in daily safety reminders: {str(e)}")
                await asyncio.sleep(60)
    
    async def _hourly_inventory_check(self):
        """Check inventory levels every hour"""
        while self.running:
            try:
                logger.info("Running hourly inventory check...")
                result = await self.automation_engine.trigger_workflow(
                    'inventory_management',
                    {}
                )
                logger.info(f"Inventory check completed: {result}")
                # Sleep for 1 hour
                await asyncio.sleep(3600)
            except Exception as e:
                logger.error(f"Error in hourly inventory check: {str(e)}")
                await asyncio.sleep(3600)
    
    async def _weather_forecast_check(self):
        """Check weather forecast every 3 hours"""
        while self.running:
            try:
                logger.info("Checking weather forecast...")
                # Get weather forecast from weather service
                # For now, use mock data
                forecast = {
                    'snow_risk': 'low',  # Would come from weather API
                    'precipitation': 0,
                    'temperature': 5
                }
                
                result = await self.automation_engine.trigger_workflow(
                    'weather_operations',
                    {'forecast': forecast}
                )
                logger.info(f"Weather check completed: {result}")
                # Sleep for 3 hours
                await asyncio.sleep(10800)
            except Exception as e:
                logger.error(f"Error in weather forecast check: {str(e)}")
                await asyncio.sleep(10800)
    
    async def _invoice_reminder_check(self):
        """Check for overdue invoices daily at 9 AM"""
        while self.running:
            try:
                now = datetime.now()
                # Check if it's 9 AM
                if now.hour == 9 and now.minute == 0:
                    logger.info("Checking for overdue invoices...")
                    # Find all overdue invoices
                    overdue_date = datetime.utcnow()
                    invoices = await self.db.invoices.find({
                        'status': {'$ne': 'paid'},
                        'due_date': {'$lt': overdue_date}
                    }).to_list(length=1000)
                    
                    logger.info(f"Found {len(invoices)} overdue invoices")
                    
                    for invoice in invoices:
                        days_overdue = (overdue_date - invoice['due_date']).days
                        result = await self.automation_engine.trigger_workflow(
                            'customer_communication',
                            {
                                'trigger_type': 'invoice_overdue',
                                'invoice_id': str(invoice['_id']),
                                'customer_id': invoice.get('customer_id'),
                                'days_overdue': days_overdue
                            }
                        )
                        logger.info(f"Sent overdue reminder for invoice {invoice['_id']}: {result}")
                    
                    await asyncio.sleep(3600)
                else:
                    await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error in invoice reminder check: {str(e)}")
                await asyncio.sleep(60)
