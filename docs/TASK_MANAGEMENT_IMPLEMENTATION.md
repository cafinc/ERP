# Enhanced Task Management System - Implementation Plan

## Phase 1: Core Task Management (MUST HAVE + HIGH VALUE)

### 1. Enhanced Task Creation & Linking ✅
**File**: `/app/web-admin/app/tasks/create/page.tsx`

**Features**:
- Basic task info (title, description, priority, status)
- **Link to Sites** - Dropdown/search to select site
- **Link to Services** - Multi-select services
- **Link to Forms** - Attach form templates
- **Link to Work Orders** - Parent work order reference
- **Link to Customers** - Select customer (auto-filled if from WO)
- **Link to Equipment** - Select equipment needed
- **Assignment System**:
  - Assign to Team Members (multi-select)
  - Assign to Customers (with visibility toggle)
  - Assign to Subcontractors
- Due date picker
- Estimated hours
- Photo uploads

### 2. Task Detail & Collaboration ✅
**File**: `/app/web-admin/app/tasks/[id]/page.tsx`

**Features**:
- View all task details
- Edit task information
- Update status (with workflow)
- **Checklist System**:
  - Add/remove checklist items
  - Mark items complete
  - Required items before task completion
- **Comments & Messages**:
  - Add comments (integrated with message center)
  - @mention users → notifications
  - File attachments in comments
  - Photo gallery
- **Activity Log** - All changes tracked
- **Time Tracking**:
  - Start/stop timer
  - Manual time entry
  - Billable hours toggle
- Status workflow (pending → in_progress → review → completed)
- Assignment changes
- Related items view (site, services, forms, WO)

### 3. Message Center Integration ✅
**Files**: 
- `/app/web-admin/app/messages/page.tsx` (update)
- `/app/backend/communications_routes.py` (update)

**Features**:
- Task comments create message threads
- @mentions trigger notifications
- Task assignment → automatic message
- Status changes → notifications
- Unified inbox shows task-related messages
- Quick reply from messages to task comments

### 4. Customer Portal Integration ✅
**Files**:
- `/app/web-admin/app/customer-portal/*` (new pages)
- `/app/backend/customer_portal_routes.py` (new)

**Features**:
- Customer login → see assigned tasks
- Task detail view (limited info)
- Add comments/photos
- Update status (limited: pending → in_progress → completed)
- Notification preferences:
  - In-app notifications
  - Email notifications
  - Both
  - None
- Mobile responsive

### 5. Task Templates System ✅
**File**: `/app/web-admin/app/tasks/templates/page.tsx`

**Features**:
- Create reusable task templates
- Pre-filled task info
- Default checklists
- Default services/equipment
- Quick create from template
- Template categories (inspection, maintenance, emergency)

### 6. Photo Attachments ✅
**Component**: `/app/web-admin/components/PhotoGallery.tsx`

**Features**:
- Drag & drop upload
- Multiple photo upload
- Photo preview/gallery
- Before/after tagging
- Caption/notes per photo
- Delete photos
- Download all photos

---

## Phase 2: Automation & Intelligence

### 7. Automatic Task Creation ✅
**Files**: 
- `/app/backend/automation_engine.py` (update)
- `/app/backend/work_order_routes.py` (update)
- `/app/backend/form_routes.py` (update)

**Triggers**:
- **From Work Orders**:
  - WO created → Create task for assigned crew
  - WO status "scheduled" → Create site visit task
  - WO status "in_progress" → Create completion checklist task
  
- **From Forms**:
  - Inspection form submitted → Create follow-up tasks for issues found
  - Safety form with violations → Create correction tasks
  - Equipment form shows maintenance needed → Create maintenance task
  
- **From Estimates**:
  - Estimate approved → Create project setup tasks
  
- **From Sites**:
  - New site added → Create initial inspection task
  - Site service due → Create recurring service task

**Configuration**:
- Admin dashboard to enable/disable auto-creation
- Template mapping (WO type → Task template)
- Assignment rules (service type → default assignee)

### 8. Billing Integration ✅
**Files**:
- `/app/backend/billing_service.py` (new)
- `/app/backend/invoice_routes.py` (update)

**Features**:
- Task completion → Create invoice line item
- Time tracked → Billable hours on invoice
- Materials used → Add to invoice
- Services performed → Link to pricing
- Batch invoicing from completed tasks
- Task cost estimation vs actual

**Workflow**:
1. Task marked "completed"
2. If task.billable = True:
   - Calculate total (time × rate + materials)
   - Create draft invoice line item
   - Link to customer
   - Manager reviews & approves
3. Generate invoice with task details
4. Send to customer

---

## Database Schema Updates

### `tasks` collection:
```javascript
{
  _id: ObjectId,
  title: string,
  description: string,
  type: string, // work_order, maintenance, inspection, etc.
  priority: string, // urgent, high, medium, low
  status: string, // pending, in_progress, review, completed, cancelled
  
  // Assignments
  assigned_to: [
    {
      user_id: ObjectId,
      role: string, // team_member, customer, subcontractor
      email: string,
      name: string,
      notify_email: boolean,
      notify_app: boolean
    }
  ],
  assigned_by: ObjectId,
  assigned_by_name: string,
  
  // Relations
  site_id: ObjectId,
  customer_id: ObjectId,
  work_order_id: ObjectId,
  project_id: ObjectId,
  service_ids: [ObjectId],
  form_ids: [ObjectId],
  equipment_ids: [ObjectId],
  
  // Checklist
  checklist: [
    {
      id: string,
      text: string,
      completed: boolean,
      required: boolean,
      completed_by: string,
      completed_at: datetime
    }
  ],
  
  // Time tracking
  estimated_hours: float,
  actual_hours: float,
  time_entries: [
    {
      user_id: ObjectId,
      start_time: datetime,
      end_time: datetime,
      hours: float,
      billable: boolean,
      notes: string
    }
  ],
  
  // Billing
  billable: boolean,
  invoice_id: ObjectId,
  estimated_cost: float,
  actual_cost: float,
  
  // Photos
  photos: [
    {
      url: string,
      thumbnail_url: string,
      caption: string,
      tag: string, // before, after, issue, completed
      uploaded_by: string,
      uploaded_at: datetime
    }
  ],
  
  // Dates
  due_date: datetime,
  start_date: datetime,
  completed_at: datetime,
  created_at: datetime,
  updated_at: datetime,
  
  // Template
  template_id: ObjectId,
  is_recurring: boolean,
  recurrence_rule: string, // daily, weekly, monthly
  
  // Activity
  activities: [
    {
      user_name: string,
      action: string,
      timestamp: datetime,
      details: object
    }
  ]
}
```

### `task_templates` collection:
```javascript
{
  _id: ObjectId,
  name: string,
  description: string,
  category: string, // inspection, maintenance, emergency
  type: string,
  priority: string,
  estimated_hours: float,
  checklist: [...],
  default_service_ids: [ObjectId],
  default_equipment_ids: [ObjectId],
  instructions: string,
  created_by: ObjectId,
  created_at: datetime
}
```

### `communications` collection (update):
```javascript
{
  // ... existing fields
  task_id: ObjectId, // NEW
  related_to: string, // task, work_order, site, etc.
  related_id: ObjectId
}
```

---

## API Endpoints

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/{id}/checklist` - Add checklist item
- `PUT /api/tasks/{id}/checklist/{item_id}` - Update checklist item
- `POST /api/tasks/{id}/time-entry` - Add time entry
- `POST /api/tasks/{id}/photos` - Upload photos
- `POST /api/tasks/{id}/comments` - Add comment
- `GET /api/tasks/{id}/activities` - Get activity log

### Task Templates
- `POST /api/task-templates` - Create template
- `GET /api/task-templates` - List templates
- `POST /api/tasks/from-template/{template_id}` - Create from template

### Customer Portal
- `GET /api/customer-portal/tasks` - Get customer's tasks
- `GET /api/customer-portal/tasks/{id}` - Task details
- `POST /api/customer-portal/tasks/{id}/comments` - Add comment
- `PUT /api/customer-portal/tasks/{id}/status` - Update status (limited)
- `PUT /api/customer-portal/notifications/preferences` - Set notification prefs

### Automation
- `POST /api/automation/task-from-workorder/{wo_id}` - Auto-create task
- `POST /api/automation/task-from-form/{form_id}` - Auto-create from form

### Billing
- `POST /api/tasks/{id}/generate-invoice` - Create invoice from task
- `GET /api/tasks/{id}/billing-summary` - Get cost breakdown

---

## Notification System

### Notification Types:
1. **Task Assigned** - "You've been assigned to [Task Title]"
2. **Task Status Changed** - "[User] changed status to [Status]"
3. **Task Comment** - "[User] commented on [Task Title]"
4. **Task Mentioned** - "[User] mentioned you in [Task Title]"
5. **Task Due Soon** - "[Task Title] is due in 24 hours"
6. **Task Overdue** - "[Task Title] is now overdue"
7. **Checklist Item Completed** - "[User] completed [Item]"
8. **Task Completed** - "[Task Title] has been completed"

### Notification Channels:
- In-app (badge count, notification dropdown)
- Email (configurable per user)
- Push (mobile app)

### User Preferences:
```javascript
{
  user_id: ObjectId,
  notification_preferences: {
    task_assigned: { email: true, app: true, push: true },
    task_status: { email: false, app: true, push: false },
    task_comment: { email: true, app: true, push: true },
    task_mention: { email: true, app: true, push: true },
    task_due_soon: { email: true, app: true, push: true }
  }
}
```

---

## Implementation Order:

### Week 1: Core Task CRUD
1. ✅ Enhanced Create Task page (with all linking)
2. ✅ Task Detail page (view/edit)
3. ✅ Backend endpoints
4. ✅ Database schema updates

### Week 2: Collaboration Features
5. ✅ Checklist system
6. ✅ Photo upload/gallery
7. ✅ Comments system
8. ✅ Time tracking

### Week 3: Integration & Automation
9. ✅ Message center integration
10. ✅ Notification system
11. ✅ Auto-task creation
12. ✅ Task templates

### Week 4: Customer Portal & Billing
13. ✅ Customer portal pages
14. ✅ Notification preferences
15. ✅ Billing integration
16. ✅ Invoice generation

### Week 5: Polish & Testing
17. ✅ Mobile responsive
18. ✅ Error handling
19. ✅ Testing
20. ✅ Documentation

---

## Success Metrics:
- Task completion rate
- Average time to complete
- Customer engagement (portal usage)
- Time tracked vs estimated
- Invoice accuracy from tasks
- Notification open rates

---

## Next Steps:
1. Start with Create Task page (all linking features)
2. Build Task Detail page
3. Implement message center integration
4. Add notification system
5. Build customer portal
6. Implement automation & billing
