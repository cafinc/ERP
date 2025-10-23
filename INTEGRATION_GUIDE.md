# Task Integration Guide

## Overview
This guide shows how to integrate the task system with your existing modules (work orders, estimates, invoices, forms, etc.). The integration automatically creates tasks and sends notifications when these items are created or assigned.

## Integration Endpoints

All integration endpoints are available at: `/api/integrations/tasks/`

### Available Endpoints:
1. `/work-order` - Create task when work order is assigned
2. `/estimate` - Create task when estimate is sent to customer
3. `/invoice` - Create task when invoice is generated
4. `/form` - Create task when form is assigned
5. `/project` - Create task for project
6. `/maintenance` - Create task for equipment maintenance
7. `/complete` - Mark task complete when source is completed

---

## 1. Work Order Integration

### When to Call:
Call this endpoint after creating/assigning a work order to crew members.

### Endpoint:
```
POST /api/integrations/tasks/work-order
```

### Request Body:
```json
{
  "work_order_id": "string",
  "work_order_title": "string",
  "work_order_description": "string (optional)",
  "assigned_to": ["user_id_1", "user_id_2"],
  "assigned_by": "admin_user_id",
  "assigned_by_name": "Admin Name",
  "priority": "medium",  // low, medium, high, urgent
  "scheduled_date": "2025-10-25T10:00:00Z"  // optional
}
```

### Example Integration Code:

**Python (FastAPI):**
```python
import httpx

async def create_work_order_with_task(work_order_data):
    # 1. Create the work order first
    work_order = await create_work_order(work_order_data)
    
    # 2. Create the task
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8001/api/integrations/tasks/work-order",
            json={
                "work_order_id": str(work_order.id),
                "work_order_title": work_order.title,
                "work_order_description": work_order.description,
                "assigned_to": work_order.crew_ids,
                "assigned_by": work_order.created_by,
                "assigned_by_name": work_order.created_by_name,
                "priority": work_order.priority,
                "scheduled_date": work_order.scheduled_date.isoformat() if work_order.scheduled_date else None
            }
        )
    
    return work_order
```

**TypeScript (React Native):**
```typescript
import api from './utils/api';

async function createWorkOrderWithTask(workOrderData) {
  // 1. Create the work order
  const workOrder = await api.post('/work-orders', workOrderData);
  
  // 2. Create the task
  await api.post('/integrations/tasks/work-order', {
    work_order_id: workOrder.data.id,
    work_order_title: workOrder.data.title,
    work_order_description: workOrder.data.description,
    assigned_to: workOrder.data.crew_ids,
    assigned_by: currentUser.id,
    assigned_by_name: currentUser.name,
    priority: workOrder.data.priority,
    scheduled_date: workOrder.data.scheduled_date
  });
  
  return workOrder.data;
}
```

### What Happens:
1. ✅ Task is created with type `work_order`
2. ✅ Task is linked to work order via `related_id`
3. ✅ Crew members receive in-app notification
4. ✅ Task appears in their task list
5. ✅ Crew can update task status as they work

---

## 2. Estimate Integration

### When to Call:
Call this endpoint after sending an estimate to a customer for review.

### Endpoint:
```
POST /api/integrations/tasks/estimate
```

### Request Body:
```json
{
  "estimate_id": "string",
  "estimate_number": "EST-001",
  "customer_id": "customer_user_id",
  "customer_name": "Customer Name",
  "created_by": "admin_user_id",
  "created_by_name": "Admin Name",
  "amount": 1500.00,
  "due_date": "2025-11-01T00:00:00Z"  // optional, defaults to 7 days
}
```

### Example:
```typescript
async function sendEstimateToCustomer(estimateId) {
  const estimate = await api.get(`/estimates/${estimateId}`);
  
  // Send estimate via email/notification
  await sendEstimateEmail(estimate.data);
  
  // Create review task for customer
  await api.post('/integrations/tasks/estimate', {
    estimate_id: estimate.data.id,
    estimate_number: estimate.data.number,
    customer_id: estimate.data.customer_id,
    customer_name: estimate.data.customer_name,
    created_by: currentUser.id,
    created_by_name: currentUser.name,
    amount: estimate.data.total_amount,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}
```

### What Happens:
1. ✅ Task created: "Review Estimate #EST-001"
2. ✅ Customer receives notification
3. ✅ Task appears in customer portal
4. ✅ Due date set to 7 days (default)
5. ✅ Priority set to medium

---

## 3. Invoice Integration

### When to Call:
Call this endpoint after generating an invoice for a customer.

### Endpoint:
```
POST /api/integrations/tasks/invoice
```

### Request Body:
```json
{
  "invoice_id": "string",
  "invoice_number": "INV-001",
  "customer_id": "customer_user_id",
  "customer_name": "Customer Name",
  "created_by": "admin_user_id",
  "created_by_name": "Admin Name",
  "amount": 2500.00,
  "due_date": "2025-12-01T00:00:00Z"  // optional, defaults to 30 days
}
```

### Priority Logic:
- **High Priority:** If due in ≤ 7 days
- **Medium Priority:** If due in 8-14 days
- **Low Priority:** If due in > 14 days

### Example:
```typescript
async function createInvoiceWithTask(invoiceData) {
  // Create invoice
  const invoice = await api.post('/invoices', invoiceData);
  
  // Create payment task
  await api.post('/integrations/tasks/invoice', {
    invoice_id: invoice.data.id,
    invoice_number: invoice.data.number,
    customer_id: invoice.data.customer_id,
    customer_name: invoice.data.customer_name,
    created_by: currentUser.id,
    created_by_name: currentUser.name,
    amount: invoice.data.total_amount,
    due_date: invoice.data.due_date
  });
  
  return invoice.data;
}
```

---

## 4. Form Integration

### When to Call:
Call this endpoint when assigning a form to users for completion.

### Endpoint:
```
POST /api/integrations/tasks/form
```

### Request Body:
```json
{
  "form_id": "string",
  "form_name": "Safety Inspection Form",
  "form_description": "Complete monthly safety inspection",
  "assigned_to": ["user_id_1", "user_id_2"],
  "assigned_by": "admin_user_id",
  "assigned_by_name": "Admin Name",
  "priority": "high",
  "due_date": "2025-10-28T00:00:00Z"
}
```

### Example:
```typescript
async function assignForm(formId, assignees) {
  const form = await api.get(`/forms/${formId}`);
  
  // Create completion task
  await api.post('/integrations/tasks/form', {
    form_id: form.data.id,
    form_name: form.data.name,
    form_description: form.data.description,
    assigned_to: assignees.map(a => a.id),
    assigned_by: currentUser.id,
    assigned_by_name: currentUser.name,
    priority: form.data.is_urgent ? 'high' : 'medium',
    due_date: form.data.due_date
  });
}
```

---

## 5. Marking Tasks Complete

### When to Call:
Call this endpoint when the source item is completed (work order finished, invoice paid, form submitted).

### Endpoint:
```
POST /api/integrations/tasks/complete
```

### Request Body:
```json
{
  "related_type": "work_order",  // work_order, invoice, form, etc.
  "related_id": "source_item_id",
  "completed_by": "user_id",
  "completed_by_name": "User Name",
  "completion_notes": "Work completed successfully"  // optional
}
```

### Example - Work Order Completed:
```typescript
async function completeWorkOrder(workOrderId) {
  // Mark work order as complete
  await api.put(`/work-orders/${workOrderId}`, {
    status: 'completed'
  });
  
  // Mark related task as complete
  await api.post('/integrations/tasks/complete', {
    related_type: 'work_order',
    related_id: workOrderId,
    completed_by: currentUser.id,
    completed_by_name: currentUser.name,
    completion_notes: 'All work completed successfully'
  });
}
```

### Example - Invoice Paid:
```typescript
async function recordPayment(invoiceId, paymentData) {
  // Record the payment
  await api.post(`/invoices/${invoiceId}/payments`, paymentData);
  
  // Mark invoice as paid
  await api.put(`/invoices/${invoiceId}`, { status: 'paid' });
  
  // Mark related task as complete
  await api.post('/integrations/tasks/complete', {
    related_type: 'invoice',
    related_id: invoiceId,
    completed_by: paymentData.paid_by_id,
    completed_by_name: paymentData.paid_by_name,
    completion_notes: `Payment received: $${paymentData.amount}`
  });
}
```

---

## Quick Start Integration Checklist

### Work Orders:
- [ ] Add integration call after work order creation
- [ ] Pass crew member IDs to `assigned_to`
- [ ] Set priority based on work order urgency
- [ ] Mark task complete when work order is finished

### Estimates:
- [ ] Add integration call when sending estimate to customer
- [ ] Set due date (default 7 days for review)
- [ ] Mark task complete when estimate is approved/declined

### Invoices:
- [ ] Add integration call after invoice generation
- [ ] Set due date from invoice payment terms
- [ ] Mark task complete when payment is received

### Forms:
- [ ] Add integration call when assigning forms
- [ ] Pass all assignee IDs
- [ ] Set appropriate due date
- [ ] Mark task complete when form is submitted

---

## Testing Integration

### Test Work Order Integration:
```bash
curl -X POST http://localhost:8001/api/integrations/tasks/work-order \
  -H "Content-Type: application/json" \
  -d '{
    "work_order_id": "WO123",
    "work_order_title": "Snow Removal - Main Parking Lot",
    "work_order_description": "Clear all snow from main parking area",
    "assigned_to": ["crew_member_1"],
    "assigned_by": "admin_1",
    "assigned_by_name": "John Admin",
    "priority": "urgent",
    "scheduled_date": "2025-10-24T06:00:00Z"
  }'
```

Expected Response:
```json
{
  "success": true,
  "task_id": "67890...",
  "message": "Work order task created successfully"
}
```

### Test Estimate Integration:
```bash
curl -X POST http://localhost:8001/api/integrations/tasks/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "estimate_id": "EST123",
    "estimate_number": "EST-001",
    "customer_id": "customer_1",
    "customer_name": "ABC Company",
    "created_by": "admin_1",
    "created_by_name": "John Admin",
    "amount": 1500.00
  }'
```

### Test Invoice Integration:
```bash
curl -X POST http://localhost:8001/api/integrations/tasks/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "INV123",
    "invoice_number": "INV-001",
    "customer_id": "customer_1",
    "customer_name": "ABC Company",
    "created_by": "admin_1",
    "created_by_name": "John Admin",
    "amount": 2500.00,
    "due_date": "2025-11-30T00:00:00Z"
  }'
```

### Test Task Completion:
```bash
curl -X POST http://localhost:8001/api/integrations/tasks/complete \
  -H "Content-Type: application/json" \
  -d '{
    "related_type": "work_order",
    "related_id": "WO123",
    "completed_by": "crew_member_1",
    "completed_by_name": "Mike Worker",
    "completion_notes": "All snow cleared successfully"
  }'
```

---

## Benefits of Integration

### For Admins:
- ✅ Automated task creation (no manual work)
- ✅ Automatic notifications sent
- ✅ Better tracking of work progress
- ✅ Reduced manual follow-ups

### For Crew:
- ✅ Clear task list for the day
- ✅ Know what's assigned to them
- ✅ Can update status as they work
- ✅ Communication in one place

### For Customers:
- ✅ Know when estimates/invoices need action
- ✅ Clear due dates
- ✅ Easy to track their tasks
- ✅ Notifications keep them informed

---

## Best Practices

1. **Always create task after source item**
   - Create work order first, then task
   - This ensures the source exists if user clicks through

2. **Use appropriate priorities**
   - `urgent` - Immediate attention needed
   - `high` - Important, soon
   - `medium` - Normal priority
   - `low` - Can wait

3. **Set realistic due dates**
   - Work orders: Use scheduled date
   - Estimates: 7 days for review
   - Invoices: Use payment terms
   - Forms: Based on urgency

4. **Mark tasks complete**
   - Call the completion endpoint when source is done
   - This keeps task list clean and accurate

5. **Handle errors gracefully**
   - If task creation fails, log it but don't fail the source operation
   - Users can manually create tasks if needed

6. **Test thoroughly**
   - Test with real user IDs
   - Verify notifications are received
   - Check task appears in user's list
   - Test completion flow

---

## Troubleshooting

### Task not created?
- Check backend logs for errors
- Verify user IDs are valid
- Ensure all required fields are provided

### Notification not received?
- Check user ID is correct
- Verify notification service is running
- Check user's notification settings

### Task not completing?
- Verify `related_type` and `related_id` match
- Check task exists and isn't already completed
- Review backend logs

---

## Summary

The task integration system provides:
- 6 integration endpoints for different modules
- Automatic task creation and notifications
- Task completion tracking
- Priority-based organization
- Full notification system

**Next Steps:**
1. Choose one module to integrate first (recommend work orders)
2. Add integration call after creation
3. Test with real data
4. Add completion call
5. Move to next module

**Questions?**
See `/app/FINAL_IMPLEMENTATION_SUMMARY.md` for full documentation.
