# Implementation Plan - Task Assignment System & Portals

## Overview
Complete phases 1-3 and 5, then implement comprehensive task assignment system with in-app notifications.

## Phase 1: Theme Toggle Implementation ✓
**Status**: Quick Win
**Files to Create/Modify**:
- `/app/frontend/contexts/ThemeContext.tsx` - New theme context
- `/app/frontend/app/_layout.tsx` - Wrap with theme provider
- `/app/frontend/app/settings/theme.tsx` - Theme settings screen
- `/app/frontend/utils/theme.ts` - Expand theme definitions

**Tasks**:
1. Create ThemeContext with light/dark modes
2. Implement AsyncStorage persistence
3. Add theme toggle in settings
4. Update existing components to use theme

## Phase 2: Customer Portal ✓
**Status**: High Priority
**Files to Create/Modify**:
- `/app/frontend/app/customer-portal/` - New folder
  - `index.tsx` - Customer dashboard
  - `communications.tsx` - Customer communications
  - `estimates.tsx` - View estimates
  - `invoices.tsx` - View invoices
  - `work-orders.tsx` - View assigned work orders
  - `tasks.tsx` - View assigned tasks
- `/app/frontend/components/CustomerHeader.tsx` - Customer-specific header

**Tasks**:
1. Create customer portal navigation structure
2. Implement customer authentication check
3. Build customer dashboard with key metrics
4. Integrate with existing communications system
5. Add view-only access to estimates/invoices
6. Display assigned work orders and tasks

## Phase 3: Crew Portal ✓
**Status**: High Priority
**Files to Create/Modify**:
- `/app/frontend/app/crew-portal/` - New folder
  - `index.tsx` - Crew dashboard
  - `communications.tsx` - Crew communications
  - `work-orders.tsx` - Assigned work orders
  - `tasks.tsx` - Assigned tasks
  - `time-tracking.tsx` - Clock in/out
  - `equipment.tsx` - Equipment assignments
- `/app/frontend/components/CrewHeader.tsx` - Crew-specific header

**Tasks**:
1. Create crew portal navigation structure
2. Implement crew authentication check
3. Build crew dashboard with daily tasks
4. Integrate time tracking (clock in/out)
5. Display assigned work orders and tasks
6. Show equipment assignments

## Phase 5: Weather Integration ✓
**Status**: Quick Win (Backend exists)
**Files to Modify**:
- `/app/frontend/app/weather-planning.tsx` - Enhance existing page
- `/app/frontend/components/WeatherWidget.tsx` - Already exists
- Weather endpoints already exist in `/app/backend/server.py`

**Tasks**:
1. Verify weather API endpoints are working
2. Enhance weather-planning page with more features
3. Add weather data to operations dashboard
4. Integrate weather alerts with notifications

## Phase 6: Task Assignment System 🚀
**Status**: NEW MAJOR FEATURE
**Backend Files to Create**:
- `/app/backend/task_models.py` - Task models
- `/app/backend/task_routes.py` - Task CRUD endpoints
- `/app/backend/notification_service.py` - Notification service
- `/app/backend/task_assignment_service.py` - Task assignment logic

**Frontend Files to Create**:
- `/app/frontend/app/tasks/` - Task management screens
  - `index.tsx` - Task list
  - `[id].tsx` - Task detail
  - `create.tsx` - Create task
- `/app/frontend/components/TaskCard.tsx` - Task display component
- `/app/frontend/components/TaskAssignmentModal.tsx` - Assignment modal
- `/app/frontend/contexts/TaskContext.tsx` - Task state management

**Models Required**:
```python
Task:
- id
- title
- description
- type (work_order, estimate, invoice, form, general)
- related_id (ID of work order/estimate/etc)
- assigned_to (user_id)
- assigned_by (user_id)
- status (pending, in_progress, completed, cancelled)
- priority (low, medium, high, urgent)
- due_date
- attachments
- comments
- created_at
- updated_at
- completed_at

TaskComment:
- id
- task_id
- user_id
- content
- attachments
- created_at

TaskNotification:
- id
- task_id
- user_id
- type (assignment, update, comment, completion)
- message
- read
- created_at
```

**Features**:
1. **Task Creation & Assignment**
   - Create tasks and assign to any user (admin, customer, crew)
   - Assign multiple tasks at once
   - Task templates for common workflows

2. **Work Order Integration**
   - Auto-create tasks when work order is assigned
   - Send in-app notification to assignee
   - Link task to work order for tracking

3. **Estimate/Invoice Integration**
   - Create tasks for estimate review/approval
   - Create tasks for invoice payment
   - Send notifications when assigned

4. **Form Integration**
   - Create tasks for form completion
   - Track form submission status
   - Notify when forms are assigned

5. **In-App Notifications**
   - Real-time notifications for task assignments
   - Notification badge count
   - Notification center with history
   - Mark as read/unread

6. **Task Management**
   - Task list with filters (status, priority, assignee, type)
   - Task detail view with comments
   - Task status updates
   - Task completion with notes
   - File attachments
   - Due date reminders

7. **Collaboration**
   - Comment on tasks
   - @mention users
   - Task activity history
   - Real-time updates via WebSocket

## Implementation Order:
1. ✅ Weather Integration (verify existing endpoints)
2. ✅ Theme Toggle (1-2 hours)
3. ✅ Customer Portal (4-6 hours)
4. ✅ Crew Portal (4-6 hours)
5. 🚀 Task Assignment System (12-16 hours)
   - Backend models and routes (4 hours)
   - Notification service (2 hours)
   - Frontend task management (4 hours)
   - Integration with work orders/estimates/invoices/forms (3 hours)
   - Testing and refinement (3 hours)

## Testing Strategy:
1. Test weather endpoints with curl
2. Test theme toggle on mobile device
3. Test customer portal access and permissions
4. Test crew portal access and permissions
5. Comprehensive testing of task assignment flow
6. Test notifications delivery
7. Test task lifecycle (create -> assign -> update -> complete)

## Success Criteria:
- [ ] Dark mode toggle working and persisted
- [ ] Customer portal accessible with proper restrictions
- [ ] Crew portal accessible with proper restrictions
- [ ] Weather data displayed correctly
- [ ] Tasks can be created and assigned to any user type
- [ ] Work orders send in-app notifications when assigned
- [ ] Estimates, invoices, forms can have tasks assigned
- [ ] Notifications display in real-time
- [ ] Task status updates work correctly
- [ ] Comments and attachments work on tasks
