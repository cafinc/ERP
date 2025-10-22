# Template System Expansion - Autonomous Build Plan

## 🎯 Objective
Build a comprehensive template system across the entire SnowTrack application to support automation, standardization, and efficiency.

---

## 📊 Build Scope (8 Major Blocks)

### BLOCK 1: Database Schemas & Backend Foundation (30min)
**Deliverables:**
- [ ] Create template collections in MongoDB
- [ ] Define schemas for each template type
- [ ] Build base template service (CRUD operations)
- [ ] Version control for templates
- [ ] Template categories and tags

**Collections:**
- `estimate_templates`
- `invoice_templates`
- `proposal_templates`
- `contract_templates`
- `work_order_templates`
- `project_templates`
- `task_list_templates`
- `notification_templates`
- `email_templates`

---

### BLOCK 2: Estimate & Invoice Templates (45min)
**Deliverables:**
- [ ] Estimate template API endpoints
- [ ] Invoice template API endpoints
- [ ] Line item templates
- [ ] Pricing tier templates
- [ ] Tax and discount configurations
- [ ] Template preview generation
- [ ] PDF generation from templates

**Features:**
- Variable placeholders ({{customer_name}}, {{total}}, etc.)
- Conditional sections
- Multiple layouts (modern, classic, minimal)
- Logo and branding support

---

### BLOCK 3: Proposal & Contract Templates (45min)
**Deliverables:**
- [ ] Proposal template system
- [ ] Contract template system
- [ ] Section management (intro, services, terms, signature)
- [ ] Legal clause library
- [ ] Terms & conditions templates
- [ ] Digital signature fields
- [ ] Template approval workflow

**Features:**
- Rich text editing support
- Reusable clauses
- Version history
- Expiration dates

---

### BLOCK 4: Work Order & Project Templates (40min)
**Deliverables:**
- [ ] Work order templates with checklists
- [ ] Project workflow templates
- [ ] Task sequence templates
- [ ] Equipment/material checklists
- [ ] Safety requirement templates
- [ ] Quality control checklists

**Features:**
- Assignee fields
- Time estimates
- Dependencies
- Required resources

---

### BLOCK 5: Notification & Email Templates (30min)
**Deliverables:**
- [ ] Email notification templates
- [ ] SMS notification templates
- [ ] Push notification templates
- [ ] Automated trigger system
- [ ] Schedule-based notifications
- [ ] Event-based notifications (job completed, payment due, etc.)

**Features:**
- Personalization tokens
- Multiple languages support structure
- A/B testing capability
- Send time optimization

---

### BLOCK 6: Template Management UI (60min)
**Deliverables:**
- [ ] Template library page (`/templates`)
- [ ] Template editor with preview
- [ ] Template categories and search
- [ ] Duplicate/clone templates
- [ ] Import/export templates (JSON)
- [ ] Template usage analytics
- [ ] Favorite templates

**UI Components:**
- Template grid/list view
- Rich text editor for content
- Drag & drop builder
- Variable inserter
- Preview pane

---

### BLOCK 7: Template Application & Integration (45min)
**Deliverables:**
- [ ] "Use Template" button in Estimates page
- [ ] "Use Template" button in Invoices page
- [ ] "Use Template" button in Projects page
- [ ] Auto-fill from template with data merge
- [ ] Template recommendations based on context
- [ ] Recently used templates

**Integrations:**
- Customer data auto-fill
- Project data auto-fill
- Pricing data auto-fill

---

### BLOCK 8: Advanced Features & Polish (30min)
**Deliverables:**
- [ ] Template sharing between users
- [ ] Company-wide vs personal templates
- [ ] Template permissions (who can edit/use)
- [ ] Template marketplace (optional)
- [ ] Default templates for new companies
- [ ] Bulk actions (delete, export multiple)
- [ ] Template statistics

---

## 🗄️ Database Schema Overview

### Base Template Schema (Common Fields)
```javascript
{
  _id: ObjectId,
  type: "estimate" | "invoice" | "proposal" | "contract" | "work_order" | "project" | "task_list" | "notification" | "email",
  name: String,
  description: String,
  category: String,
  tags: [String],
  content: Object, // Type-specific structure
  variables: [String], // {{variable_name}}
  is_default: Boolean,
  is_public: Boolean, // Company-wide
  created_by: String (user_id),
  created_at: DateTime,
  updated_at: DateTime,
  version: Number,
  active: Boolean,
  usage_count: Number,
  last_used: DateTime
}
```

---

## 🚀 API Endpoints Structure

### Template Management
- `GET /api/templates` - List all templates (with filters)
- `GET /api/templates/{id}` - Get specific template
- `POST /api/templates` - Create template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template
- `POST /api/templates/{id}/duplicate` - Clone template
- `POST /api/templates/{id}/apply` - Apply template with data

### Type-Specific Endpoints
- `GET /api/templates/estimates` - Get estimate templates
- `GET /api/templates/invoices` - Get invoice templates
- `POST /api/templates/estimates/{id}/generate-pdf` - Generate PDF
- `POST /api/templates/{id}/preview` - Preview with sample data

---

## 🎨 Frontend Pages

1. **Template Library** (`/templates`)
   - Grid view of all templates
   - Filter by type, category
   - Search functionality
   - Quick actions (edit, duplicate, delete)

2. **Template Editor** (`/templates/[id]/edit`)
   - Rich text editor
   - Variable inserter
   - Preview pane
   - Save/publish

3. **Template Creator** (`/templates/new`)
   - Template type selector
   - Wizard-style creation
   - Pre-built layouts

4. **Integration Points**
   - Estimate create/edit page
   - Invoice create/edit page
   - Project creation
   - Email composer

---

## 💾 Sample Templates (Pre-built)

### Estimates
1. "Snow Removal - Residential"
2. "Snow Removal - Commercial"
3. "Seasonal Contract"
4. "Per-Storm Service"

### Invoices
1. "Standard Invoice"
2. "Detailed Service Invoice"
3. "Recurring Billing Invoice"

### Proposals
1. "Commercial Snow Removal Proposal"
2. "Landscaping Service Proposal"

### Contracts
1. "Seasonal Service Agreement"
2. "One-Time Service Contract"

### Work Orders
1. "Snow Plowing Checklist"
2. "Salting/Sanding Checklist"
3. "Equipment Inspection"

---

## ⚙️ Technical Implementation

### Variable Replacement System
```javascript
function applyTemplate(template, data) {
  let content = template.content;
  
  // Replace {{variable}} with actual data
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return content;
}
```

### Template Versioning
- Keep history of template changes
- Allow rollback to previous versions
- Track who made changes

### PDF Generation
- Use library like `jspdf` or server-side generation
- Support custom styling
- Include company branding

---

## 🧪 Testing Requirements

### Backend
- Template CRUD operations
- Variable replacement
- PDF generation
- Template application with data merge

### Frontend
- Template editor loads and saves
- Preview updates in real-time
- Template application from estimate/invoice pages
- Search and filter work correctly

---

## 📝 Success Criteria

- [x] All 8 template types have full CRUD APIs
- [x] Template library UI is intuitive and searchable
- [x] Templates can be applied to estimates/invoices
- [x] Variable replacement works correctly
- [x] PDF generation functional for estimates/invoices
- [x] At least 10 pre-built templates available
- [x] Template usage tracked and displayed
- [x] Integration with existing pages seamless

---

## 🔄 Continuation Prompt

**To continue this autonomous build, use:**

```
Continue the Template System Expansion autonomous build. Check /app/TEMPLATE_BUILD_LOG.md for progress. Complete blocks 1-8 sequentially. Work autonomously without stopping between blocks. Build all backend APIs, frontend UIs, and pre-built templates.
```

---

## 📊 Estimated Completion Time
**Total**: 5-6 hours autonomous work

**Breakdown:**
- Block 1: 30 minutes
- Block 2: 45 minutes
- Block 3: 45 minutes
- Block 4: 40 minutes
- Block 5: 30 minutes
- Block 6: 60 minutes
- Block 7: 45 minutes
- Block 8: 30 minutes
- Testing & Polish: 45 minutes

---

## 🎯 Dependencies & Requirements

**Already Available:**
- MongoDB connection
- FastAPI server
- Next.js frontend
- Authentication system
- File storage system

**New Dependencies (will install):**
- `pdfkit` or `weasyprint` (Python PDF generation)
- `@react-pdf/renderer` or `jspdf` (Frontend PDF preview)
- Rich text editor library (if not already present)

---

**BUILD WILL START ONCE USER PROVIDES CONTINUATION PROMPT**

Progress will be logged in `/app/TEMPLATE_BUILD_LOG.md`
