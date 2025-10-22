"""
Template Placeholders - System variables that auto-populate from database
"""

PLACEHOLDER_LIBRARY = {
    "customer": {
        "name": "Customer Information",
        "description": "Customer-related data fields",
        "placeholders": [
            {"key": "customer_name", "description": "Customer full name", "example": "John Smith"},
            {"key": "customer_first_name", "description": "Customer first name", "example": "John"},
            {"key": "customer_last_name", "description": "Customer last name", "example": "Smith"},
            {"key": "customer_company", "description": "Company name", "example": "ABC Corp"},
            {"key": "customer_email", "description": "Customer email address", "example": "john@example.com"},
            {"key": "customer_phone", "description": "Customer phone number", "example": "(555) 123-4567"},
            {"key": "customer_address", "description": "Full address", "example": "123 Main St, City, ST 12345"},
            {"key": "customer_street", "description": "Street address", "example": "123 Main St"},
            {"key": "customer_city", "description": "City", "example": "Springfield"},
            {"key": "customer_state", "description": "State/Province", "example": "IL"},
            {"key": "customer_zip", "description": "ZIP/Postal code", "example": "62701"},
        ]
    },
    "company": {
        "name": "Company Information",
        "description": "Your business details",
        "placeholders": [
            {"key": "company_name", "description": "Your company name", "example": "SnowTrack Services"},
            {"key": "company_email", "description": "Company email", "example": "info@snowtrack.com"},
            {"key": "company_phone", "description": "Company phone", "example": "(555) 999-8888"},
            {"key": "company_address", "description": "Company address", "example": "456 Business Rd"},
            {"key": "company_website", "description": "Company website", "example": "www.snowtrack.com"},
            {"key": "company_logo_url", "description": "Company logo URL", "example": "/uploads/logo.png"},
        ]
    },
    "dates": {
        "name": "Date & Time",
        "description": "Dynamic date and time values",
        "placeholders": [
            {"key": "today_date", "description": "Today's date", "example": "2025-01-15"},
            {"key": "today_formatted", "description": "Today formatted", "example": "January 15, 2025"},
            {"key": "current_time", "description": "Current time", "example": "2:30 PM"},
            {"key": "current_year", "description": "Current year", "example": "2025"},
            {"key": "current_month", "description": "Current month", "example": "January"},
            {"key": "current_day", "description": "Current day", "example": "15"},
        ]
    },
    "estimate": {
        "name": "Estimate Details",
        "description": "Estimate-specific information",
        "placeholders": [
            {"key": "estimate_number", "description": "Estimate number", "example": "EST-2025-001"},
            {"key": "estimate_date", "description": "Estimate creation date", "example": "2025-01-15"},
            {"key": "estimate_valid_until", "description": "Expiration date", "example": "2025-02-15"},
            {"key": "estimate_subtotal", "description": "Subtotal amount", "example": "$1,500.00"},
            {"key": "estimate_tax", "description": "Tax amount", "example": "$120.00"},
            {"key": "estimate_total", "description": "Total amount", "example": "$1,620.00"},
            {"key": "estimate_notes", "description": "Internal notes", "example": "Rush job"},
        ]
    },
    "invoice": {
        "name": "Invoice Details",
        "description": "Invoice-specific information",
        "placeholders": [
            {"key": "invoice_number", "description": "Invoice number", "example": "INV-2025-001"},
            {"key": "invoice_date", "description": "Invoice date", "example": "2025-01-15"},
            {"key": "invoice_due_date", "description": "Payment due date", "example": "2025-02-15"},
            {"key": "invoice_subtotal", "description": "Subtotal", "example": "$1,500.00"},
            {"key": "invoice_tax", "description": "Tax amount", "example": "$120.00"},
            {"key": "invoice_total", "description": "Total amount", "example": "$1,620.00"},
            {"key": "invoice_amount_paid", "description": "Amount paid", "example": "$500.00"},
            {"key": "invoice_balance_due", "description": "Balance due", "example": "$1,120.00"},
        ]
    },
    "project": {
        "name": "Project Information",
        "description": "Project-related data",
        "placeholders": [
            {"key": "project_name", "description": "Project name", "example": "Winter 2025 Contract"},
            {"key": "project_number", "description": "Project number", "example": "PRJ-2025-001"},
            {"key": "project_start_date", "description": "Start date", "example": "2025-01-01"},
            {"key": "project_end_date", "description": "End date", "example": "2025-03-31"},
            {"key": "project_status", "description": "Current status", "example": "Active"},
            {"key": "project_manager", "description": "Project manager name", "example": "Jane Doe"},
        ]
    },
    "site": {
        "name": "Site/Property Details",
        "description": "Service location information",
        "placeholders": [
            {"key": "site_name", "description": "Site name", "example": "Main Office Building"},
            {"key": "site_address", "description": "Site address", "example": "789 Property Ave"},
            {"key": "site_type", "description": "Property type", "example": "Commercial"},
            {"key": "site_area", "description": "Area size", "example": "5,000 sq ft"},
            {"key": "site_notes", "description": "Special instructions", "example": "Back entrance access only"},
        ]
    },
    "service": {
        "name": "Service Details",
        "description": "Service-related information",
        "placeholders": [
            {"key": "service_date", "description": "Service date", "example": "2025-01-15"},
            {"key": "service_time", "description": "Service time", "example": "8:00 AM"},
            {"key": "service_type", "description": "Type of service", "example": "Snow Plowing"},
            {"key": "service_description", "description": "Service description", "example": "Residential snow removal"},
            {"key": "crew_name", "description": "Crew member name", "example": "Mike Johnson"},
            {"key": "equipment_used", "description": "Equipment used", "example": "Plow Truck #3"},
        ]
    },
    "pricing": {
        "name": "Pricing & Amounts",
        "description": "Financial calculations",
        "placeholders": [
            {"key": "subtotal", "description": "Subtotal amount", "example": "$1,500.00"},
            {"key": "tax_rate", "description": "Tax rate percentage", "example": "8%"},
            {"key": "tax_amount", "description": "Tax amount", "example": "$120.00"},
            {"key": "discount_amount", "description": "Discount amount", "example": "$50.00"},
            {"key": "total", "description": "Total amount", "example": "$1,570.00"},
            {"key": "deposit_amount", "description": "Deposit required", "example": "$500.00"},
            {"key": "balance_due", "description": "Balance due", "example": "$1,070.00"},
        ]
    },
    "user": {
        "name": "User/Staff Information",
        "description": "Current user details",
        "placeholders": [
            {"key": "user_name", "description": "Current user name", "example": "Admin User"},
            {"key": "user_email", "description": "Current user email", "example": "admin@company.com"},
            {"key": "user_phone", "description": "Current user phone", "example": "(555) 111-2222"},
            {"key": "user_title", "description": "User job title", "example": "Account Manager"},
        ]
    }
}


def get_all_placeholders():
    """Get flat list of all placeholders"""
    all_placeholders = []
    for category_key, category in PLACEHOLDER_LIBRARY.items():
        for placeholder in category["placeholders"]:
            all_placeholders.append({
                "category": category_key,
                "category_name": category["name"],
                **placeholder
            })
    return all_placeholders


def get_placeholders_by_category():
    """Get placeholders organized by category"""
    return PLACEHOLDER_LIBRARY


def search_placeholders(query: str):
    """Search placeholders by key or description"""
    results = []
    query_lower = query.lower()
    
    for category_key, category in PLACEHOLDER_LIBRARY.items():
        for placeholder in category["placeholders"]:
            if (query_lower in placeholder["key"].lower() or 
                query_lower in placeholder["description"].lower()):
                results.append({
                    "category": category_key,
                    "category_name": category["name"],
                    **placeholder
                })
    
    return results
