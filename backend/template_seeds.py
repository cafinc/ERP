"""
Template Seeds - Pre-built Templates for Common Use Cases
Run this to populate the database with default templates
"""

import asyncio
import logging
from template_service import template_service

logger = logging.getLogger(__name__)

# System user ID for default templates
SYSTEM_USER = "system"

# ========== ESTIMATE TEMPLATES ==========

ESTIMATE_TEMPLATES = [
    {
        "name": "Snow Removal - Residential",
        "description": "Standard residential snow removal service estimate",
        "category": "snow_removal",
        "tags": ["residential", "snow", "plowing"],
        "content": {
            "title": "Snow Removal Service Estimate",
            "customer_name": "{{customer_name}}",
            "customer_address": "{{customer_address}}",
            "estimate_number": "{{estimate_number}}",
            "date": "{{date}}",
            "valid_until": "{{valid_until}}",
            "service_description": "Residential Snow Removal Services",
            "line_items": [
                {
                    "description": "Driveway Snow Plowing ({{driveway_size}} sq ft)",
                    "quantity": 1,
                    "unit": "service",
                    "unit_price": "{{plow_price}}",
                    "total": "{{plow_total}}"
                },
                {
                    "description": "Walkway Clearing",
                    "quantity": 1,
                    "unit": "service",
                    "unit_price": "{{walkway_price}}",
                    "total": "{{walkway_total}}"
                },
                {
                    "description": "Salt/De-icing Application",
                    "quantity": "{{salt_bags}}",
                    "unit": "bag",
                    "unit_price": "{{salt_price}}",
                    "total": "{{salt_total}}"
                }
            ],
            "subtotal": "{{subtotal}}",
            "tax_rate": "{{tax_rate}}",
            "tax_amount": "{{tax_amount}}",
            "total": "{{total}}",
            "notes": "Service will be provided within 24 hours of snowfall exceeding 2 inches. Additional charges may apply for snowfall over 12 inches.",
            "terms": "Payment due within 30 days. Late payments subject to 1.5% monthly interest."
        },
        "is_public": True,
        "is_default": True
    },
    {
        "name": "Snow Removal - Commercial",
        "description": "Commercial property snow removal estimate with priority service",
        "category": "snow_removal",
        "tags": ["commercial", "snow", "priority"],
        "content": {
            "title": "Commercial Snow Removal Estimate",
            "customer_name": "{{customer_name}}",
            "customer_address": "{{customer_address}}",
            "estimate_number": "{{estimate_number}}",
            "date": "{{date}}",
            "valid_until": "{{valid_until}}",
            "service_description": "Priority Commercial Snow Removal Services",
            "line_items": [
                {
                    "description": "Parking Lot Plowing ({{lot_size}} sq ft)",
                    "quantity": 1,
                    "unit": "service",
                    "unit_price": "{{lot_price}}",
                    "total": "{{lot_total}}"
                },
                {
                    "description": "Sidewalk Clearing ({{sidewalk_length}} ft)",
                    "quantity": 1,
                    "unit": "service",
                    "unit_price": "{{sidewalk_price}}",
                    "total": "{{sidewalk_total}}"
                },
                {
                    "description": "Commercial De-icing (Bulk Salt)",
                    "quantity": "{{salt_tons}}",
                    "unit": "ton",
                    "unit_price": "{{salt_price_per_ton}}",
                    "total": "{{salt_total}}"
                },
                {
                    "description": "Priority Service (4-hour response)",
                    "quantity": 1,
                    "unit": "service",
                    "unit_price": "{{priority_fee}}",
                    "total": "{{priority_total}}"
                }
            ],
            "subtotal": "{{subtotal}}",
            "tax_rate": "{{tax_rate}}",
            "tax_amount": "{{tax_amount}}",
            "total": "{{total}}",
            "notes": "Priority service guarantees arrival within 4 hours of snowfall. 24/7 service available. Parking lot will be cleared to bare pavement.",
            "terms": "Net 15 payment terms. Service agreement required for seasonal contracts."
        },
        "is_public": True,
        "is_default": False
    },
    {
        "name": "Seasonal Snow Contract",
        "description": "Full-season snow removal contract estimate",
        "category": "snow_removal",
        "tags": ["seasonal", "contract", "snow"],
        "content": {
            "title": "Seasonal Snow Removal Contract",
            "customer_name": "{{customer_name}}",
            "customer_address": "{{customer_address}}",
            "estimate_number": "{{estimate_number}}",
            "date": "{{date}}",
            "season_start": "{{season_start}}",
            "season_end": "{{season_end}}",
            "service_description": "Unlimited Snow Removal - Full Season",
            "line_items": [
                {
                    "description": "Seasonal Contract ({{season_start}} - {{season_end}})",
                    "quantity": 1,
                    "unit": "season",
                    "unit_price": "{{seasonal_price}}",
                    "total": "{{seasonal_total}}"
                },
                {
                    "description": "Includes: Unlimited plowing, shoveling, and de-icing",
                    "quantity": 1,
                    "unit": "included",
                    "unit_price": "0.00",
                    "total": "0.00"
                }
            ],
            "payment_schedule": [
                {"date": "{{payment_1_date}}", "amount": "{{payment_1_amount}}"},
                {"date": "{{payment_2_date}}", "amount": "{{payment_2_amount}}"},
                {"date": "{{payment_3_date}}", "amount": "{{payment_3_amount}}"}
            ],
            "subtotal": "{{subtotal}}",
            "tax_rate": "{{tax_rate}}",
            "tax_amount": "{{tax_amount}}",
            "total": "{{total}}",
            "notes": "Unlimited service for the entire season. No per-storm charges. 2-inch trigger depth. Service within 12 hours of snowfall.",
            "terms": "Payment in 3 installments. Contract auto-renews unless cancelled 30 days before season start."
        },
        "is_public": True,
        "is_default": False
    }
]

# ========== INVOICE TEMPLATES ==========

INVOICE_TEMPLATES = [
    {
        "name": "Standard Service Invoice",
        "description": "General purpose service invoice",
        "category": "general",
        "tags": ["invoice", "service", "standard"],
        "content": {
            "title": "Invoice",
            "invoice_number": "{{invoice_number}}",
            "invoice_date": "{{invoice_date}}",
            "due_date": "{{due_date}}",
            "customer_name": "{{customer_name}}",
            "customer_address": "{{customer_address}}",
            "customer_email": "{{customer_email}}",
            "customer_phone": "{{customer_phone}}",
            "service_date": "{{service_date}}",
            "line_items": [
                {
                    "description": "{{item_description}}",
                    "quantity": "{{item_quantity}}",
                    "unit_price": "{{item_price}}",
                    "total": "{{item_total}}"
                }
            ],
            "subtotal": "{{subtotal}}",
            "tax_rate": "{{tax_rate}}",
            "tax_amount": "{{tax_amount}}",
            "total": "{{total}}",
            "amount_paid": "{{amount_paid}}",
            "balance_due": "{{balance_due}}",
            "payment_methods": "Check, Credit Card, Bank Transfer",
            "notes": "Thank you for your business!",
            "terms": "Payment due within 30 days. Late payments subject to 1.5% monthly interest."
        },
        "is_public": True,
        "is_default": True
    },
    {
        "name": "Detailed Snow Removal Invoice",
        "description": "Itemized invoice for snow removal services",
        "category": "snow_removal",
        "tags": ["invoice", "snow", "detailed"],
        "content": {
            "title": "Snow Removal Service Invoice",
            "invoice_number": "{{invoice_number}}",
            "invoice_date": "{{invoice_date}}",
            "due_date": "{{due_date}}",
            "customer_name": "{{customer_name}}",
            "customer_address": "{{customer_address}}",
            "service_period": "{{service_start}} - {{service_end}}",
            "line_items": [
                {
                    "date": "{{service_date_1}}",
                    "description": "Snow Plowing - {{snowfall_1}} inches",
                    "hours": "{{hours_1}}",
                    "rate": "{{hourly_rate}}",
                    "total": "{{total_1}}"
                },
                {
                    "date": "{{service_date_2}}",
                    "description": "Salt Application - {{salt_amount}} bags",
                    "quantity": "{{salt_bags}}",
                    "rate": "{{salt_rate}}",
                    "total": "{{total_2}}"
                }
            ],
            "subtotal": "{{subtotal}}",
            "tax_rate": "{{tax_rate}}",
            "tax_amount": "{{tax_amount}}",
            "total": "{{total}}",
            "amount_paid": "{{amount_paid}}",
            "balance_due": "{{balance_due}}",
            "payment_instructions": "Make checks payable to: {{company_name}}",
            "notes": "Services rendered as per contract agreement dated {{contract_date}}",
            "terms": "Net 30. Thank you for choosing our services."
        },
        "is_public": True,
        "is_default": False
    }
]

# ========== PROPOSAL TEMPLATES ==========

PROPOSAL_TEMPLATES = [
    {
        "name": "Commercial Snow Removal Proposal",
        "description": "Comprehensive proposal for commercial snow removal services",
        "category": "snow_removal",
        "tags": ["proposal", "commercial", "snow"],
        "content": {
            "title": "Commercial Snow & Ice Management Proposal",
            "customer_name": "{{customer_name}}",
            "property_address": "{{property_address}}",
            "proposal_date": "{{proposal_date}}",
            "prepared_by": "{{sales_rep_name}}",
            "sections": [
                {
                    "title": "Executive Summary",
                    "content": "Thank you for considering {{company_name}} for your snow and ice management needs. We are pleased to present this comprehensive proposal for winter services at {{property_address}}."
                },
                {
                    "title": "Scope of Services",
                    "content": "• Snow plowing and removal\n• Parking lot clearing\n• Sidewalk snow removal\n• Salt/de-icing application\n• 24/7 storm monitoring\n• Priority service guarantee"
                },
                {
                    "title": "Service Details",
                    "content": "Response Time: {{response_time}} hours\nTrigger Depth: {{trigger_depth}} inches\nService Hours: 24/7\nEquipment: {{equipment_list}}"
                },
                {
                    "title": "Pricing",
                    "content": "Seasonal Rate: ${{seasonal_price}}\nPer-Storm Rate: ${{per_storm_price}}\nHourly Rate: ${{hourly_rate}}/hour"
                },
                {
                    "title": "Why Choose Us",
                    "content": "• {{years_experience}}+ years of experience\n• Fully insured and bonded\n• Professional equipment fleet\n• 24/7 dispatch center\n• Customer satisfaction guarantee"
                },
                {
                    "title": "Terms & Conditions",
                    "content": "Contract Term: {{contract_start}} to {{contract_end}}\nPayment Terms: Net 15\nInsurance: ${{insurance_coverage}} liability coverage"
                }
            ],
            "validity": "{{valid_days}} days",
            "signature_required": True
        },
        "is_public": True,
        "is_default": True
    }
]

# ========== CONTRACT TEMPLATES ==========

CONTRACT_TEMPLATES = [
    {
        "name": "Snow Removal Service Agreement",
        "description": "Legal contract for snow removal services",
        "category": "snow_removal",
        "tags": ["contract", "legal", "snow"],
        "content": {
            "title": "Snow Removal Service Agreement",
            "contract_number": "{{contract_number}}",
            "effective_date": "{{effective_date}}",
            "parties": {
                "service_provider": "{{company_name}}",
                "client": "{{client_name}}",
                "property_address": "{{property_address}}"
            },
            "term": {
                "start_date": "{{start_date}}",
                "end_date": "{{end_date}}",
                "auto_renew": True
            },
            "services": [
                "Snow plowing when accumulation exceeds {{trigger_depth}} inches",
                "Application of ice melt/salt as needed",
                "Clearing of designated walkways and entrances",
                "Hauling of snow if accumulation exceeds {{haul_threshold}} inches"
            ],
            "pricing": {
                "type": "{{pricing_type}}",  # seasonal, per-storm, hourly
                "amount": "{{contract_amount}}",
                "payment_schedule": "{{payment_schedule}}"
            },
            "clauses": [
                {
                    "title": "Service Standards",
                    "content": "Contractor agrees to provide services within {{response_time}} hours of snowfall reaching trigger depth."
                },
                {
                    "title": "Equipment & Materials",
                    "content": "Contractor will provide all necessary equipment, vehicles, and materials required to perform services."
                },
                {
                    "title": "Insurance",
                    "content": "Contractor maintains {{insurance_amount}} in general liability insurance."
                },
                {
                    "title": "Termination",
                    "content": "Either party may terminate with {{termination_days}} days written notice."
                },
                {
                    "title": "Force Majeure",
                    "content": "Neither party liable for delays due to extreme weather conditions, equipment failure, or acts of God."
                }
            ],
            "signatures": {
                "contractor_signature": "{{contractor_signature}}",
                "contractor_date": "{{contractor_date}}",
                "client_signature": "{{client_signature}}",
                "client_date": "{{client_date}}"
            }
        },
        "is_public": True,
        "is_default": True
    }
]

# ========== WORK ORDER TEMPLATES ==========

# ========== PROJECT TEMPLATES ==========

PROJECT_TEMPLATES = [
    {
        "name": "Residential Snow Removal Project",
        "description": "Standard residential snow removal project workflow",
        "category": "snow_removal",
        "tags": ["project", "residential", "workflow"],
        "content": {
            "title": "{{project_name}}",
            "customer": "{{customer_name}}",
            "property": "{{property_address}}",
            "project_type": "Residential Snow Removal",
            "phases": [
                {
                    "name": "Initial Assessment",
                    "tasks": ["Site inspection", "Measure driveway", "Identify obstacles", "Document conditions"],
                    "duration_days": 1
                },
                {
                    "name": "Service Setup",
                    "tasks": ["Generate estimate", "Get approval", "Schedule crew", "Assign equipment"],
                    "duration_days": 2
                },
                {
                    "name": "Service Delivery",
                    "tasks": ["Monitor weather", "Deploy crew", "Complete service", "Document work"],
                    "duration_days": 0
                },
                {
                    "name": "Follow-up",
                    "tasks": ["Customer notification", "Quality check", "Invoice generation", "Payment collection"],
                    "duration_days": 3
                }
            ]
        },
        "is_public": True,
        "is_default": True
    }
]

# ========== NOTIFICATION TEMPLATES ==========

NOTIFICATION_TEMPLATES = [
    {
        "name": "Service Completion Notification",
        "description": "Automated email notification when service is completed",
        "category": "service",
        "tags": ["email", "automation", "completion"],
        "content": {
            "subject": "Service Completed - {{property_address}}",
            "body": "Dear {{customer_name}},\n\nYour snow removal service at {{property_address}} has been completed.\n\nService Details:\n- Date: {{service_date}}\n- Time Completed: {{completion_time}}\n- Services Performed: {{services_list}}\n\nOur crew has:\n- Cleared all snow from designated areas\n- Applied ice melt/salt as needed\n- Ensured safe access to your property\n\nPhotos of the completed work are attached for your records.\n\nThank you for choosing our services!\n\nBest regards,\n{{company_name}}"
        },
        "is_public": True,
        "is_default": True
    },
    {
        "name": "Weather Alert - Upcoming Storm",
        "description": "SMS notification for incoming winter storms",
        "category": "weather",
        "tags": ["sms", "alert", "weather"],
        "content": {
            "message": "WEATHER ALERT: Snow expected {{forecast_date}}. Estimated accumulation: {{snowfall_amount}} inches. We'll be monitoring and will service your property per our agreement. Reply STOP to unsubscribe."
        },
        "is_public": True,
        "is_default": True
    }
]

WORK_ORDER_TEMPLATES = [
    {
        "name": "Snow Plowing Checklist",
        "description": "Standard checklist for snow plowing operations",
        "category": "snow_removal",
        "tags": ["work_order", "checklist", "plowing"],
        "content": {
            "title": "Snow Plowing Work Order",
            "work_order_number": "{{work_order_number}}",
            "date": "{{date}}",
            "crew_lead": "{{crew_lead}}",
            "property": "{{property_name}}",
            "address": "{{property_address}}",
            "start_time": "{{start_time}}",
            "end_time": "{{end_time}}",
            "snowfall_amount": "{{snowfall_inches}} inches",
            "pre_service_checklist": [
                {"task": "Vehicle inspection completed", "completed": False},
                {"task": "Equipment check (plow, blade, hydraulics)", "completed": False},
                {"task": "Salt/ice melt loaded", "completed": False},
                {"task": "Route map reviewed", "completed": False},
                {"task": "Weather conditions assessed", "completed": False}
            ],
            "service_checklist": [
                {"task": "Parking lot cleared", "completed": False},
                {"task": "Drive lanes plowed", "completed": False},
                {"task": "Loading zones cleared", "completed": False},
                {"task": "Walkways cleared", "completed": False},
                {"task": "Entrances de-iced", "completed": False},
                {"task": "Snow piled in designated areas", "completed": False},
                {"task": "Salt applied to all surfaces", "completed": False}
            ],
            "post_service_checklist": [
                {"task": "Final inspection completed", "completed": False},
                {"task": "Customer notified", "completed": False},
                {"task": "Photos taken", "completed": False},
                {"task": "Equipment cleaned", "completed": False},
                {"task": "Time logged", "completed": False}
            ],
            "materials_used": {
                "salt_bags": "{{salt_bags}}",
                "ice_melt_lbs": "{{ice_melt_lbs}}",
                "fuel_gallons": "{{fuel_gallons}}"
            },
            "notes": "{{notes}}",
            "issues_encountered": "{{issues}}",
            "photos": []
        },
        "is_public": True,
        "is_default": True
    }
]


async def seed_templates():
    """Seed database with pre-built templates"""
    try:
        logger.info("Starting template seeding...")
        
        # Seed estimates
        for template_data in ESTIMATE_TEMPLATES:
            await template_service.create_template(
                template_type="estimate",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created estimate template: {template_data['name']}")
        
        # Seed invoices
        for template_data in INVOICE_TEMPLATES:
            await template_service.create_template(
                template_type="invoice",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created invoice template: {template_data['name']}")
        
        # Seed proposals
        for template_data in PROPOSAL_TEMPLATES:
            await template_service.create_template(
                template_type="proposal",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created proposal template: {template_data['name']}")
        
        # Seed contracts
        for template_data in CONTRACT_TEMPLATES:
            await template_service.create_template(
                template_type="contract",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created contract template: {template_data['name']}")
        
        # Seed work orders
        for template_data in WORK_ORDER_TEMPLATES:
            await template_service.create_template(
                template_type="work_order",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created work order template: {template_data['name']}")
        
        # Seed projects
        for template_data in PROJECT_TEMPLATES:
            await template_service.create_template(
                template_type="project",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created project template: {template_data['name']}")
        
        # Seed notifications
        for template_data in NOTIFICATION_TEMPLATES:
            await template_service.create_template(
                template_type="notification",
                name=template_data["name"],
                content=template_data["content"],
                user_id=SYSTEM_USER,
                description=template_data["description"],
                category=template_data["category"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                is_default=template_data["is_default"]
            )
            logger.info(f"Created notification template: {template_data['name']}")
        
        logger.info("Template seeding completed successfully!")
        print("\n✅ Successfully seeded templates:")
        print(f"   - {len(ESTIMATE_TEMPLATES)} Estimate templates")
        print(f"   - {len(INVOICE_TEMPLATES)} Invoice templates")
        print(f"   - {len(PROPOSAL_TEMPLATES)} Proposal templates")
        print(f"   - {len(CONTRACT_TEMPLATES)} Contract templates")
        print(f"   - {len(WORK_ORDER_TEMPLATES)} Work Order templates")
        print(f"   - {len(PROJECT_TEMPLATES)} Project templates")
        print(f"   - {len(NOTIFICATION_TEMPLATES)} Notification templates")
        total = len(ESTIMATE_TEMPLATES) + len(INVOICE_TEMPLATES) + len(PROPOSAL_TEMPLATES) + len(CONTRACT_TEMPLATES) + len(WORK_ORDER_TEMPLATES) + len(PROJECT_TEMPLATES) + len(NOTIFICATION_TEMPLATES)
        print(f"\nTotal: {total} templates created\n")
        
    except Exception as e:
        logger.error(f"Error seeding templates: {str(e)}")
        print(f"❌ Error seeding templates: {str(e)}")


if __name__ == "__main__":
    # Run seeding
    asyncio.run(seed_templates())
