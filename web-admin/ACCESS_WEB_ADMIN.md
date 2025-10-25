# How to Access the Web-Admin

## Current Status
The web-admin Next.js development server is running on **port 3001**.

## Access Methods

### Method 1: Direct Access (if you have shell access)
```bash
# The development server is running at:
http://localhost:3001

# To access the Sites page directly:
http://localhost:3001/sites
```

### Method 2: Port Forward (recommended for viewing updates)
If you have SSH or container access, forward port 3001:
```bash
# SSH port forward example:
ssh -L 3001:localhost:3001 user@container-host

# Then access in your browser:
http://localhost:3001/sites
```

### Method 3: Restart/Check the Dev Server
```bash
cd /app/web-admin
npm run dev
# The server will show the URL it's running on
```

## What to Look For

When you access `/sites`, you should see:

### Stats Badges at Top of Page Header
```
[📍 Total Sites: X] [✓ Active: X] [👥 Customers: X] [📦 Archived: X]
└─ Blue badge  └─ Green badge  └─ Purple badge  └─ Orange badge
```

### Complete Header Structure
1. **Stats Row** (NEW) - Color-coded summary badges
2. **Breadcrumbs** - Home > Dispatch > Sites  
3. **Title & Subtitle** - "Sites" with description
4. **Action Button** - "Add Site" button (top right)
5. **Search Bar** - Full-width search input
6. **Primary Tabs** - Active / Archived / All
7. **Secondary Tabs** (pill buttons) - All Types, Residential, Commercial, etc.
8. **View Toggle** - Grid/List view switcher

## Screenshots Location
Previous screenshots were saved at:
- `/root/.emergent/automation_output/20251025_174055/final_20251025_174055.jpeg`

This shows the working implementation with stats integrated into the header.

## Technical Details

**Development Server:** Next.js 15.5.6 (Turbopack)
**Port:** 3001
**Process ID:** Check with `ps aux | grep "next dev"`
**Logs:** `/tmp/web-admin.log`

## Need Help?
If you can't access the web-admin, you can:
1. Check the implementation in the code files
2. Review `/app/STATS_INTEGRATION_SUMMARY.md` for details
3. View the screenshot I took showing the working UI
