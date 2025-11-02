"""
Workflow Event Helpers
Convenience functions for emitting workflow events from any endpoint
"""

from event_emitter import get_event_emitter
import logging

logger = logging.getLogger(__name__)

async def emit_work_order_completed(work_order_id: str, customer_id: str, **kwargs):
    """Emit work order completed event"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit('work_order_completed', {
                'work_order_id': work_order_id,
                'customer_id': customer_id,
                **kwargs
            })
    except Exception as e:
        logger.error(f"Error emitting work_order_completed event: {e}")

async def emit_invoice_sent(invoice_id: str, customer_id: str, amount: float, **kwargs):
    """Emit invoice sent event"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit('invoice_sent', {
                'invoice_id': invoice_id,
                'customer_id': customer_id,
                'amount': amount,
                **kwargs
            })
    except Exception as e:
        logger.error(f"Error emitting invoice_sent event: {e}")

async def emit_estimate_sent(estimate_id: str, customer_id: str, **kwargs):
    """Emit estimate sent event"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit('estimate_sent', {
                'estimate_id': estimate_id,
                'customer_id': customer_id,
                **kwargs
            })
    except Exception as e:
        logger.error(f"Error emitting estimate_sent event: {e}")

async def emit_stock_below_threshold(item_id: str, item_name: str, current_stock: float, threshold: float, **kwargs):
    """Emit stock below threshold event"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit('stock_below_threshold', {
                'item_id': item_id,
                'item_name': item_name,
                'current_stock': current_stock,
                'threshold': threshold,
                **kwargs
            })
    except Exception as e:
        logger.error(f"Error emitting stock_below_threshold event: {e}")

async def emit_project_started(project_id: str, customer_id: str, **kwargs):
    """Emit project started event"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit('project_started', {
                'project_id': project_id,
                'customer_id': customer_id,
                **kwargs
            })
    except Exception as e:
        logger.error(f"Error emitting project_started event: {e}")

async def emit_equipment_inspection_due(equipment_id: str, equipment_name: str, **kwargs):
    """Emit equipment inspection due event"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit('equipment_inspection_due', {
                'equipment_id': equipment_id,
                'equipment_name': equipment_name,
                **kwargs
            })
    except Exception as e:
        logger.error(f"Error emitting equipment_inspection_due event: {e}")

async def emit_custom_event(event_type: str, context: dict):
    """Emit a custom event with any type and context"""
    try:
        emitter = get_event_emitter()
        if emitter:
            await emitter.emit(event_type, context)
    except Exception as e:
        logger.error(f"Error emitting {event_type} event: {e}")
