from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    MASTER = "master"  # Full system control - platform owner
    ADMIN = "admin"  # Administrative access
    CREW = "crew"  # Field workers
    SUBCONTRACTOR = "subcontractor"  # External contractors
    CUSTOMER = "customer"  # Clients
    VENDOR = "vendor"  # Suppliers

class UserStatus(str, Enum):
    ON_SHIFT = "on_shift"
    BUSY = "busy"
    OFF_SHIFT = "off_shift"
    OFFLINE = "offline"

class DispatchStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ServiceType(str, Enum):
    SITE_CHECKS = "site_checks"
    SIDEWALK_CLEAR = "sidewalk_clear"
    SECOND_SIDEWALK_CLEAR = "second_sidewalk_clear"
    CALL_BACK = "call_back"
    PLOWING = "plowing"
    SANDING = "sanding"
    SALTING = "salting"
    BRINING = "brining"
    HAULING = "hauling"

class PricingUnit(str, Enum):
    HOURLY = "hourly"
    PER_OCCURRENCE = "per_occurrence"
    MONTHLY = "monthly"
    PER_YARD = "per_yard"
    NO_CHARGE = "no_charge"

# User Models
class NotificationPreferences(BaseModel):
    dispatch_assignments_email: bool = True
    dispatch_assignments_sms: bool = True
    dispatch_assignments_inapp: bool = True
    route_updates_email: bool = True
    route_updates_sms: bool = True
    route_updates_inapp: bool = True
    weather_alerts_email: bool = True
    weather_alerts_sms: bool = True
    weather_alerts_inapp: bool = True
    shift_reminders_email: bool = True
    shift_reminders_sms: bool = True
    shift_reminders_inapp: bool = True
    equipment_alerts_email: bool = True
    equipment_alerts_sms: bool = False
    equipment_alerts_inapp: bool = True
    customer_messages_email: bool = True
    customer_messages_sms: bool = False
    customer_messages_inapp: bool = True
    system_updates_email: bool = True
    system_updates_sms: bool = False
    system_updates_inapp: bool = True
    emergency_notifications_email: bool = True
    emergency_notifications_sms: bool = True
    emergency_notifications_inapp: bool = True

# Authentication Models
class UserSession(BaseModel):
    id: Optional[str] = None
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PasswordResetToken(BaseModel):
    id: Optional[str] = None
    user_id: str
    token: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None  # Made optional since email login doesn't require phone
    password_hash: Optional[str] = None  # For email/password authentication
    picture: Optional[str] = None  # For Google OAuth profile picture
    role: UserRole
    active: bool = True
    avatar: Optional[str] = None
    photo: Optional[str] = None
    title: Optional[str] = None  # Job title (e.g., "Crew Leader", "Snow Plow Operator")
    status: UserStatus = UserStatus.OFFLINE  # Current work status
    messaging_enabled: bool = True  # Whether user can receive messages
    is_driver: bool = False
    driver_license_photo: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    documents: Optional[List[dict]] = []
    notification_preferences: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: Optional[str] = None  # Optional password for email/password authentication
    role: UserRole
    active: bool = True
    avatar: Optional[str] = None
    photo: Optional[str] = None
    title: Optional[str] = None
    status: UserStatus = UserStatus.OFFLINE
    messaging_enabled: bool = True
    is_driver: bool = False
    driver_license_photo: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    avatar: Optional[str] = None
    photo: Optional[str] = None
    role: Optional[str] = None
    is_driver: Optional[bool] = None
    driver_license_photo: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

# Authentication Request/Response Models
class EmailLoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class AuthResponse(BaseModel):
    user: User
    session_token: str

# Customer Models
class CustomerTag(BaseModel):
    name: str
    color: str  # hex color code

class CustomField(BaseModel):
    field_name: str
    field_value: str
    field_type: str  # 'text', 'number', 'date', 'boolean'

class ActivityLog(BaseModel):
    id: Optional[str] = None
    customer_id: str
    activity_type: str  # 'estimate_sent', 'estimate_signed', 'payment_received', 'call', 'email', 'meeting', 'note'
    title: str
    description: Optional[str] = None
    amount: Optional[float] = None
    related_id: Optional[str] = None  # ID of related estimate, invoice, etc.
    related_type: Optional[str] = None  # 'estimate', 'invoice', 'project'
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Enhanced Customer Contact Models
class CustomerContact(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phone: str
    role: str  # 'primary', 'billing', 'operations', 'emergency', 'other'
    is_primary: bool = False
    notes: Optional[str] = None

class CustomerContactCreate(BaseModel):
    name: str
    email: str
    phone: str
    role: str = 'other'
    is_primary: bool = False
    notes: Optional[str] = None

# Service Request Models
class ServiceRequestSubService(BaseModel):
    name: str
    selected: bool = False
    notes: Optional[str] = None

class ServiceRequest(BaseModel):
    id: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    site_id: Optional[str] = None
    site_name: Optional[str] = None
    service_type: str  # 'snow', 'grass', 'parking_lot'
    sub_services: List[ServiceRequestSubService] = []
    urgency: str = 'normal'  # 'low', 'normal', 'high', 'emergency'
    requested_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: str = 'pending'  # 'pending', 'approved', 'scheduled', 'completed', 'cancelled'
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequestCreate(BaseModel):
    customer_id: str
    site_id: Optional[str] = None
    service_type: str
    sub_services: List[ServiceRequestSubService] = []
    urgency: str = 'normal'
    requested_date: Optional[datetime] = None
    notes: Optional[str] = None

# Commercial Customer Accounting
class CommercialAccounting(BaseModel):
    tax_id: Optional[str] = None
    billing_email: Optional[str] = None
    billing_phone: Optional[str] = None
    payment_terms: str = 'net_30'  # 'net_15', 'net_30', 'net_60', 'due_on_receipt'
    credit_limit: Optional[float] = None
    preferred_payment_method: Optional[str] = None  # 'check', 'ach', 'credit_card', 'invoice'
    po_required: bool = False
    billing_address: Optional[str] = None
    notes: Optional[str] = None


class Customer(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    phone: str
    mobile: Optional[str] = None
    communication_preference: Optional[str] = 'sms'  # 'sms' or 'inapp'
    address: str
    customer_type: Optional[str] = 'individual'  # 'individual' or 'company'
    company_id: Optional[str] = None  # For individuals linked to a company
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []  # Tag names like 'VIP', 'Seasonal', 'Problematic'
    custom_fields: List[CustomField] = []  # Custom fields like property_size, gate_code
    attachments: Optional[List[dict]] = []  # Uploaded documents and photos
    total_revenue: Optional[float] = 0.0
    active: bool = True
    # Company-specific fields
    contact_ids: List[str] = []  # Individual customer IDs linked to this company
    accounting: Optional[CommercialAccounting] = None  # Accounting details for companies
    site_ids: List[str] = []  # Associated site IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    mobile: Optional[str] = None
    communication_preference: Optional[str] = 'sms'  # 'sms' or 'inapp'
    address: str
    customer_type: Optional[str] = 'individual'
    company_id: Optional[str] = None  # Link individual to company
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    custom_fields: Optional[List[CustomField]] = []
    attachments: Optional[List[dict]] = []  # Uploaded documents and photos
    accounting: Optional[CommercialAccounting] = None  # Accounting details for companies

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    communication_preference: Optional[str] = None
    address: Optional[str] = None
    customer_type: Optional[str] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[List[CustomField]] = None
    active: Optional[bool] = None
    accounting: Optional[CommercialAccounting] = None  # Accounting details for companies

# Site Models
class Location(BaseModel):
    latitude: float
    longitude: float
    address: str

# Site Service Configuration
class SiteService(BaseModel):
    service_id: str
    service_name: str
    service_type: str
    unit_type: PricingUnit
    cost: float
    notes: Optional[str] = None
    trigger_type: Optional[str] = None  # e.g., "1 inch", "2 inch", "Trace", "1cm", "Custom"
    trigger_value: Optional[str] = None  # Used when trigger_type is "Custom"

# Site Access & Security
class SiteAccessField(BaseModel):
    field_name: str
    field_value: str
    field_type: str  # 'text', 'phone', 'code', etc.

class Site(BaseModel):
    id: Optional[str] = None
    customer_id: str
    name: str
    site_reference: Optional[str] = None  # Custom reference/code for the site
    location: Location
    site_type: str  # parking_lot, driveway, sidewalk, etc.
    area_size: Optional[float] = None  # in square feet
    notes: Optional[str] = None  # Old field - kept for backward compatibility
    internal_notes: Optional[str] = None  # Admin-only notes
    crew_notes: Optional[str] = None  # Visible to crew and customer
    services: Optional[List[SiteService]] = []  # Services configured for this site
    access_fields: Optional[List[SiteAccessField]] = []  # Site access & security fields
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SiteCreate(BaseModel):
    customer_id: str
    name: str
    site_reference: Optional[str] = None
    location: Location
    site_type: str
    area_size: Optional[float] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    crew_notes: Optional[str] = None
    services: Optional[List[SiteService]] = []
    access_fields: Optional[List[SiteAccessField]] = []

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    site_reference: Optional[str] = None
    location: Optional[Location] = None
    site_type: Optional[str] = None
    area_size: Optional[float] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    crew_notes: Optional[str] = None
    services: Optional[List[SiteService]] = None
    access_fields: Optional[List[SiteAccessField]] = None
    active: Optional[bool] = None


# Site Map Models - For annotated site layout maps
class SiteMapAnnotation(BaseModel):
    """Individual annotation on a site map (icon, line, shape, area, text)"""
    id: str  # Unique ID for this annotation
    type: str  # 'icon', 'line', 'arrow', 'rectangle', 'circle', 'polygon', 'text', 'freehand'
    category: Optional[str] = None  # 'curb', 'drain', 'speed_bump', 'handicap', 'sidewalk', 'plowing_zone', 'fire_hydrant', 'entrance', 'exit', 'custom'
    label: Optional[str] = None  # Text label for the annotation
    color: Optional[str] = '#3B82F6'  # Color in hex format
    coordinates: List[dict]  # Position data [{x, y}] or multiple points for polygons/lines
    properties: Optional[dict] = {}  # Additional properties (icon type, stroke width, fill, etc.)

class SiteMap(BaseModel):
    """Site map with annotations for documenting site layout"""
    id: Optional[str] = None
    site_id: str
    version: int = 1  # Version number for tracking map updates
    name: str  # e.g., "Winter 2024 Layout", "Updated Plowing Zones"
    base_map_type: str  # 'google_maps', 'uploaded_image'
    base_map_data: Optional[str] = None  # Base64 image data or Google Maps screenshot
    base_map_url: Optional[str] = None  # If using Google Maps, store the coordinates/address
    annotations: List[SiteMapAnnotation] = []
    legend_items: Optional[List[dict]] = []  # Auto-generated legend [{category, label, color, icon}]
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_current: bool = True  # Mark if this is the current/active version

class SiteMapCreate(BaseModel):
    site_id: str
    name: str
    base_map_type: str
    base_map_data: Optional[str] = None
    base_map_url: Optional[str] = None
    annotations: List[SiteMapAnnotation] = []
    legend_items: Optional[List[dict]] = []
    created_by: Optional[str] = None

class SiteMapUpdate(BaseModel):
    name: Optional[str] = None
    annotations: Optional[List[SiteMapAnnotation]] = None
    legend_items: Optional[List[dict]] = None
    is_current: Optional[bool] = None


# Equipment Models
class EquipmentType(str, Enum):
    PLOW_TRUCK = "plow_truck"
    TRUCK = "truck"
    LOADER = "loader"
    SKID_STEER = "skid_steer"
    SANDING_TRUCK = "sanding_truck"
    BRINE_TRUCK = "brine_truck"
    CAB_SWEEPER = "cab_sweeper"
    SINGLE_STAGE_THROWER = "single_stage_thrower"
    GRAVELY_SWEEPER = "gravely_sweeper"

class Equipment(BaseModel):
    id: Optional[str] = None
    name: str
    equipment_type: str  # plow_truck, truck, loader, skid_steer, etc.
    unit_number: Optional[str] = None  # Changed from vehicle_number
    license_plate: Optional[str] = None  # For trucks that need plates
    license_required: bool = False  # True if operator needs valid driver's license
    maintenance_due: Optional[datetime] = None
    status: str = "available"  # available, in_use, maintenance
    notes: Optional[str] = None
    avatar: Optional[str] = None  # Avatar ID for equipment
    photo: Optional[str] = None  # Custom photo URL or base64
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EquipmentCreate(BaseModel):
    name: str
    equipment_type: str
    unit_number: Optional[str] = None
    license_plate: Optional[str] = None
    license_required: bool = False
    maintenance_due: Optional[datetime] = None
    notes: Optional[str] = None
    avatar: Optional[str] = None
    photo: Optional[str] = None

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    equipment_type: Optional[str] = None
    unit_number: Optional[str] = None
    license_plate: Optional[str] = None
    license_required: Optional[bool] = None
    maintenance_due: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    avatar: Optional[str] = None
    photo: Optional[str] = None
    active: Optional[bool] = None

# Route Models
class RouteStop(BaseModel):
    site_id: str
    sequence_order: int
    estimated_duration: int  # in minutes

class Route(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    stops: List[RouteStop]
    is_template: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RouteCreate(BaseModel):
    name: str
    description: Optional[str] = None
    stops: List[RouteStop]
    is_template: bool = True

class RouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    stops: Optional[List[RouteStop]] = None

# Dispatch Models
class Dispatch(BaseModel):
    id: Optional[str] = None
    route_id: Optional[str] = None
    route_name: str
    scheduled_date: datetime
    scheduled_time: str
    services: List[ServiceType]
    crew_ids: List[str]
    equipment_ids: List[str]
    site_ids: List[str]
    status: DispatchStatus = DispatchStatus.SCHEDULED
    sms_sent: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class DispatchCreate(BaseModel):
    route_id: Optional[str] = None
    route_name: str
    scheduled_date: datetime
    scheduled_time: str
    services: List[ServiceType]
    crew_ids: List[str]
    equipment_ids: List[str]
    site_ids: List[str]
    notes: Optional[str] = None

class DispatchUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    scheduled_time: Optional[str] = None
    services: Optional[List[ServiceType]] = None
    crew_ids: Optional[List[str]] = None
    equipment_ids: Optional[List[str]] = None
    site_ids: Optional[List[str]] = None
    status: Optional[DispatchStatus] = None
    notes: Optional[str] = None

# Photo Models
class Photo(BaseModel):
    id: Optional[str] = None
    dispatch_id: str
    site_id: str
    crew_id: str
    crew_name: str
    photo_type: str  # before, after, progress, damage, completed
    category: str  # plowing, salting, shoveling, equipment, damage
    image_data: str  # base64 encoded
    thumbnail_data: Optional[str] = None  # smaller base64 for quick loading
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: Optional[Location] = None
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    notes: Optional[str] = None
    file_size: Optional[int] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    device_info: Optional[str] = None
    is_required: bool = False  # If this photo was required by dispatch
    is_verified: bool = False  # Admin verification status

class PhotoCreate(BaseModel):
    dispatch_id: str
    site_id: str
    crew_id: str
    crew_name: str
    photo_type: str
    category: str
    image_data: str
    thumbnail_data: Optional[str] = None
    location: Optional[Location] = None
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    notes: Optional[str] = None
    file_size: Optional[int] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    device_info: Optional[str] = None
    is_required: Optional[bool] = False

class PhotoUpdate(BaseModel):
    notes: Optional[str] = None
    is_verified: Optional[bool] = None
    category: Optional[str] = None

# Form Models
class ConditionalLogic(BaseModel):
    depends_on_field: str
    depends_on_value: str

class FormField(BaseModel):
    field_id: str
    field_type: str  # text, number, checkbox, select, signature, photo, section, yes_no
    label: str
    required: bool = False
    options: Optional[List[str]] = None  # for select fields
    section: Optional[str] = None  # Section name for grouping fields
    conditional_logic: Optional[ConditionalLogic] = None  # Conditional display logic

class FormTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    form_type: str  # service_tracking, safety_check, custom, customer, equipment
    equipment_type: Optional[str] = None  # For equipment forms: plow_truck, loader, skid_steer, etc.
    fields: List[FormField]
    active: bool = True
    archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FormTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    form_type: str  # service_tracking, safety_check, custom, equipment
    equipment_type: Optional[str] = None  # For equipment forms
    fields: List[FormField]

# Form Response Models
class FormResponse(BaseModel):
    id: Optional[str] = None
    template_id: str
    template_name: str
    crew_id: str
    crew_name: Optional[str] = None
    dispatch_id: Optional[str] = None
    site_id: Optional[str] = None
    equipment_id: Optional[str] = None
    customer_id: Optional[str] = None
    responses: dict  # field_id -> response value
    photos: List[str] = []  # photo URLs/paths
    submitted_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class FormResponseCreate(BaseModel):
    template_id: str
    template_name: str
    crew_id: str
    crew_name: Optional[str] = None
    dispatch_id: Optional[str] = None
    site_id: Optional[str] = None
    equipment_id: Optional[str] = None
    customer_id: Optional[str] = None
    responses: dict
    photos: List[str] = []

# Removed duplicate FormResponse classes - using updated versions above

# GPS Tracking Models
class GPSLocation(BaseModel):
    id: Optional[str] = None
    crew_id: str
    dispatch_id: Optional[str] = None
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    speed: Optional[float] = 0
    accuracy: Optional[float] = 0
    bearing: Optional[float] = 0
    altitude: Optional[float] = None
    heading: Optional[float] = None  # Keep for backward compatibility

class GPSLocationCreate(BaseModel):
    crew_id: str
    dispatch_id: Optional[str] = None
    latitude: float
    longitude: float
    speed: Optional[float] = 0
    accuracy: Optional[float] = 0
    bearing: Optional[float] = 0
    altitude: Optional[float] = None
    heading: Optional[float] = None

# Consumables Models (Salt, Sand, etc.)
class Consumable(BaseModel):
    id: Optional[str] = None
    name: str
    consumable_type: str  # salt, sand, ice_melt, etc.
    unit: str  # bags, tons, gallons, etc.
    quantity_available: float
    reorder_level: float
    cost_per_unit: Optional[float] = None
    per_yard: Optional[float] = None  # amount used per yard
    notes: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConsumableCreate(BaseModel):
    name: str
    consumable_type: str
    unit: str
    quantity_available: float
    reorder_level: float
    cost_per_unit: Optional[float] = None
    per_yard: Optional[float] = None
    notes: Optional[str] = None

class ConsumableUpdate(BaseModel):
    name: Optional[str] = None
    consumable_type: Optional[str] = None
    unit: Optional[str] = None
    quantity_available: Optional[float] = None
    reorder_level: Optional[float] = None
    cost_per_unit: Optional[float] = None
    per_yard: Optional[float] = None
    notes: Optional[str] = None
    active: Optional[bool] = None

# Consumable Usage Tracking Models
class ConsumableUsage(BaseModel):
    id: Optional[str] = None
    consumable_id: str
    consumable_name: str
    dispatch_id: str
    site_id: str
    service_type: ServiceType
    quantity_used: float
    unit: str
    cost: Optional[float] = None
    crew_ids: List[str] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConsumableUsageCreate(BaseModel):
    consumable_id: str
    dispatch_id: str
    site_id: str
    service_type: ServiceType
    quantity_used: float
    notes: Optional[str] = None

# Equipment Maintenance Models
class MaintenanceType(str, Enum):
    oil_change = "oil_change"
    inspection = "inspection"
    repair = "repair"
    tire_rotation = "tire_rotation"
    brake_service = "brake_service"
    winterization = "winterization"
    other = "other"

class EquipmentMaintenance(BaseModel):
    id: Optional[str] = None
    equipment_id: str
    equipment_name: str
    maintenance_type: MaintenanceType
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    hours_at_maintenance: Optional[int] = None
    dispatches_at_maintenance: Optional[int] = None
    description: str
    cost: Optional[float] = None
    performed_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "scheduled"  # scheduled, completed, cancelled

class MaintenanceCreate(BaseModel):
    equipment_id: str
    maintenance_type: MaintenanceType
    scheduled_date: datetime
    description: str
    cost: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    performed_by: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

# Equipment Inspection Models
class InspectionFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"

class ComplianceRuleAction(str, Enum):
    BLOCK_USAGE = "block_usage"
    NOTIFY_ONLY = "notify_only"
    MARK_WARNING = "mark_warning"
    AUTO_SCHEDULE = "auto_schedule"

class ComplianceRule(BaseModel):
    rule_name: str
    action: ComplianceRuleAction
    threshold_days: Optional[int] = None  # Days before/after due date
    description: Optional[str] = None
    enabled: bool = True

class InspectionSchedule(BaseModel):
    id: Optional[str] = None
    equipment_id: str
    equipment_name: str
    form_template_id: str  # Link to forms system
    form_template_name: str
    frequency: InspectionFrequency
    custom_interval_days: Optional[int] = None  # For custom frequency
    assigned_inspector_id: Optional[str] = None
    assigned_inspector_name: Optional[str] = None
    next_due_date: datetime
    last_completed_date: Optional[datetime] = None
    auto_create: bool = True  # Auto-create inspection from schedule
    send_reminders: bool = True
    reminder_days_before: int = 3  # Days before due date to send reminder
    compliance_rules: List[ComplianceRule] = []
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

class InspectionScheduleCreate(BaseModel):
    equipment_id: str
    form_template_id: str
    frequency: InspectionFrequency
    custom_interval_days: Optional[int] = None
    assigned_inspector_id: Optional[str] = None
    next_due_date: datetime
    auto_create: bool = True
    send_reminders: bool = True
    reminder_days_before: int = 3
    compliance_rules: Optional[List[ComplianceRule]] = []

class InspectionScheduleUpdate(BaseModel):
    form_template_id: Optional[str] = None
    frequency: Optional[InspectionFrequency] = None
    custom_interval_days: Optional[int] = None
    assigned_inspector_id: Optional[str] = None
    next_due_date: Optional[datetime] = None
    auto_create: Optional[bool] = None
    send_reminders: Optional[bool] = None
    reminder_days_before: Optional[int] = None
    compliance_rules: Optional[List[ComplianceRule]] = None
    active: Optional[bool] = None

class InspectionStatus(str, Enum):
    SCHEDULED = "scheduled"
    DUE = "due"
    OVERDUE = "overdue"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EquipmentInspection(BaseModel):
    id: Optional[str] = None
    schedule_id: Optional[str] = None  # Link to schedule if auto-created
    equipment_id: str
    equipment_name: str
    form_template_id: str
    form_template_name: str
    form_response_id: Optional[str] = None  # Link to completed form response
    assigned_inspector_id: Optional[str] = None
    assigned_inspector_name: Optional[str] = None
    due_date: datetime
    completed_date: Optional[datetime] = None
    completed_by_id: Optional[str] = None
    completed_by_name: Optional[str] = None
    status: InspectionStatus = InspectionStatus.SCHEDULED
    compliance_status: str = "compliant"  # compliant, warning, non_compliant
    compliance_issues: List[str] = []  # List of compliance issue descriptions
    reminder_sent: bool = False
    last_reminder_sent: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

class EquipmentInspectionCreate(BaseModel):
    equipment_id: str
    form_template_id: str
    schedule_id: Optional[str] = None
    assigned_inspector_id: Optional[str] = None
    due_date: datetime
    notes: Optional[str] = None

class EquipmentInspectionUpdate(BaseModel):
    assigned_inspector_id: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[InspectionStatus] = None
    notes: Optional[str] = None
    form_response_id: Optional[str] = None
    compliance_status: Optional[str] = None
    compliance_issues: Optional[List[str]] = None

# Invoice & Billing Models
class InvoiceStatus(str, Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"

class InvoiceLineItem(BaseModel):
    description: str
    service_type: Optional[ServiceType] = None
    quantity: float = 1.0
    unit_price: float
    total: float

class Invoice(BaseModel):
    id: Optional[str] = None
    invoice_number: str
    customer_id: str
    customer_name: str
    dispatch_id: Optional[str] = None
    site_ids: List[str] = []
    line_items: List[InvoiceLineItem] = []
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    status: InvoiceStatus = InvoiceStatus.draft
    issue_date: datetime
    due_date: datetime
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceCreate(BaseModel):
    dispatch_id: str
    tax_rate: Optional[float] = 0.0
    notes: Optional[str] = None
    send_email: Optional[bool] = True

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None

# Service Type Models (for pricing and tracking)
class ServiceModel(BaseModel):
    id: Optional[str] = None
    name: str
    service_type: ServiceType
    description: Optional[str] = None
    pricing: dict = {}  # { "hourly": 50.0, "per_occurrence": 100.0, "monthly": 500.0 }
    consumable_id: Optional[str] = None  # For services like sanding that use consumables
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceModelCreate(BaseModel):
    name: str
    service_type: ServiceType
    description: Optional[str] = None
    pricing: dict = {}
    consumable_id: Optional[str] = None

class ServiceModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pricing: Optional[dict] = None
    consumable_id: Optional[str] = None
    active: Optional[bool] = None

# Shift Models
class Shift(BaseModel):
    id: Optional[str] = None
    user_id: str
    shift_date: str  # Date in YYYY-MM-DD format
    start_time: str  # ISO format datetime string
    end_time: Optional[str] = None  # ISO format datetime string
    status: str = "active"  # active, completed
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ShiftCreate(BaseModel):
    user_id: str
    shift_date: str
    start_time: str
    notes: Optional[str] = None

class ShiftUpdate(BaseModel):
    shift_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Customer Feedback Models
class CustomerFeedback(BaseModel):
    id: Optional[str] = None
    rating: int  # 1-5 rating
    feedback: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_id: Optional[str] = None
    submitted_at: Optional[str] = None
    notification_sent: Optional[bool] = False

class CustomerFeedbackCreate(BaseModel):
    rating: int  # 1-5 rating
    feedback: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_id: Optional[str] = None

# Message Portal Models
class MessageType(str):
    CUSTOMER_FEEDBACK = "customer_feedback"
    CREW_ASSIGNMENT = "crew_assignment"
    ADMIN_RESPONSE = "admin_response"
    CREW_ACKNOWLEDGMENT = "crew_acknowledgment"

class MessageStatus(str):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"

class Message(BaseModel):
    id: Optional[str] = None
    type: str  # MessageType
    status: str = "pending"  # MessageStatus
    priority: str = "normal"  # low, normal, high, urgent
    
    # Source information
    source_id: Optional[str] = None  # form_response_id, feedback_id, etc.
    source_type: Optional[str] = None  # form_response, customer_feedback, etc.
    
    # Participants
    from_user_id: Optional[str] = None
    from_user_name: Optional[str] = None
    to_user_id: Optional[str] = None
    to_user_name: Optional[str] = None
    assigned_crew_id: Optional[str] = None
    assigned_crew_name: Optional[str] = None
    
    # Content
    title: str
    content: str
    admin_response: Optional[str] = None
    crew_feedback: Optional[str] = None
    resolution_notes: Optional[str] = None
    
    # Timestamps
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    admin_responded_at: Optional[datetime] = None
    crew_assigned_at: Optional[datetime] = None
    crew_acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    # Tracking
    response_time_hours: Optional[float] = None
    acknowledgment_time_hours: Optional[float] = None
    requires_follow_up: bool = False
    follow_up_date: Optional[datetime] = None
    
    # Privacy features
    is_private: bool = False
    private_owner_id: Optional[str] = None  # Admin who marked it private
    access_granted_to: List[str] = []  # List of admin IDs who have access
    pending_access_requests: List[str] = []  # List of admin IDs requesting access
    
    # Customer communication linking
    customer_id: Optional[str] = None  # Link to customer
    linked_communication_id: Optional[str] = None  # Link to communication entry

class MessageCreate(BaseModel):
    type: str
    priority: str = "normal"
    source_id: Optional[str] = None
    source_type: str
    from_user_id: Optional[str] = None
    from_user_name: Optional[str] = None
    to_user_id: Optional[str] = None
    to_user_name: Optional[str] = None
    title: str
    content: str

class MessageUpdate(BaseModel):
    status: Optional[str] = None
    admin_response: Optional[str] = None
    crew_feedback: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_crew_id: Optional[str] = None
    assigned_crew_name: Optional[str] = None


# Direct Messaging Models
class DirectMessage(BaseModel):
    id: Optional[str] = None
    sender_id: str
    sender_name: str
    sender_title: Optional[str] = None
    receiver_id: str
    receiver_name: str
    receiver_title: Optional[str] = None
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    conversation_id: Optional[str] = None  # Groups messages between two users

class DirectMessageCreate(BaseModel):
    receiver_id: str
    message: str

# Conversation Model (tracks chat sessions)
class Conversation(BaseModel):
    id: Optional[str] = None
    participant_ids: List[str]  # Two user IDs
    participant_names: List[str]
    participant_titles: List[str]
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: dict = {}  # {user_id: count}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Authentication and OTP Models
class OTPRequest(BaseModel):
    phone_number: str
    purpose: str  # "login", "password_reset", "phone_verification"

class OTPVerify(BaseModel):
    phone_number: str
    code: str
    purpose: str

class PasswordResetRequest(BaseModel):
    identifier: str  # email or phone number
    method: str  # "otp" or "magic_link"

class PasswordResetVerify(BaseModel):
    identifier: str
    code: Optional[str] = None  # For OTP method
    token: Optional[str] = None  # For magic link method
    new_password: str

class PasswordlessLoginRequest(BaseModel):
    phone_number: str

class PasswordlessLoginVerify(BaseModel):
    phone_number: str
    code: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None  # Avatar ID from predefined options
    photo: Optional[str] = None  # Base64 encoded photo or URL
    current_password: Optional[str] = None  # Required if changing email/phone
    new_password: Optional[str] = None

# OTP Storage Model (for MongoDB)
class OTPRecord(BaseModel):
    id: Optional[str] = None
    phone_number: str
    code: str
    purpose: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    verified: bool = False
    attempts: int = 0

# Magic Link Token Model
class MagicLinkToken(BaseModel):
    id: Optional[str] = None
    identifier: str  # email or phone
    token: str
    purpose: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    used: bool = False


# Communication Center Models
class CommunicationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    APP_MESSAGE = "app_message"
    INAPP = "inapp"  # Added for compatibility
    PHONE = "phone"  # Added for phone calls

class CommunicationDirection(str, Enum):
    SENT = "sent"
    RECEIVED = "received"
    OUTBOUND = "outbound"  # Added for compatibility
    INBOUND = "inbound"    # Added for compatibility

class Communication(BaseModel):
    id: Optional[str] = None
    customer_id: str
    type: CommunicationType
    direction: CommunicationDirection
    subject: Optional[str] = None  # For emails
    content: str
    sent_by: Optional[str] = None  # User ID who sent (if direction is 'sent')
    sent_by_name: Optional[str] = None  # User name who sent
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Privacy features
    is_private: bool = False
    private_owner_id: Optional[str] = None  # Admin who marked it private
    access_granted_to: List[str] = []  # List of admin IDs who have access
    pending_access_requests: List[str] = []  # List of admin IDs requesting access
    
    # Message board linking
    linked_message_id: Optional[str] = None  # Link to message board entry

class CommunicationCreate(BaseModel):
    type: CommunicationType
    subject: Optional[str] = None
    content: str

# Learning Document Models
class DocumentCategory(str, Enum):
    SAFETY_GUIDELINES = "safety_guidelines"
    SERVICE_INFO = "service_info"
    FAQS = "faqs"
    MAINTENANCE_TIPS = "maintenance_tips"
    GENERAL = "general"

class LearningDocument(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    file_name: str
    file_data: str  # base64 encoded PDF
    file_size: Optional[int] = None  # in bytes
    featured: bool = False


# Gmail Integration Models
class GmailConnection(BaseModel):
    user_id: str
    email_address: str
    access_token: str
    refresh_token: str
    token_uri: str
    client_id: str
    client_secret: str
    scopes: List[str]
    expiry: Optional[str] = None
    is_shared: bool = False  # True for snow@cafinc.ca
    connected_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced: Optional[datetime] = None

class GmailEmail(BaseModel):
    connection_id: str  # Reference to GmailConnection
    email_address: str  # Email of the account (raymond@cafinc.ca or snow@cafinc.ca)
    message_id: str  # Gmail message ID
    thread_id: str
    subject: str
    from_email: str
    to_email: str
    snippet: str
    body: str
    is_unread: bool
    labels: List[str]
    date: str  # ISO format
    internal_date: str
    customer_id: Optional[str] = None  # Linked customer if found
    created_at: datetime = Field(default_factory=datetime.utcnow)
    synced_at: datetime = Field(default_factory=datetime.utcnow)

    visible_to_roles: List[UserRole] = [UserRole.ADMIN, UserRole.CREW, UserRole.CUSTOMER]
    view_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # user_id

class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    file_name: str
    file_data: str
    file_size: Optional[int] = None
    featured: bool = False
    visible_to_roles: List[UserRole] = [UserRole.ADMIN, UserRole.CREW, UserRole.CUSTOMER]

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[DocumentCategory] = None
    featured: Optional[bool] = None
    visible_to_roles: Optional[List[UserRole]] = None

# Email Models
class EmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    message_id: Optional[str] = None  # For replies




# ============================================
# ESTIMATE, PROJECT, INVOICE & TASK MODELS
# ============================================

# Estimate Models
class EstimateStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    CONVERTED = "converted"  # Converted to project

class EstimateLineItem(BaseModel):
    description: str
    service_type: Optional[str] = None
    quantity: float = 1.0
    unit_price: float
    total: float

class CustomerSignature(BaseModel):
    signature_data: str  # Base64 encoded signature image
    typed_name: str
    signed_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None

class Estimate(BaseModel):
    id: Optional[str] = None
    estimate_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    line_items: List[EstimateLineItem] = []
    subtotal: float
    discount_amount: float = 0.0
    discount_percentage: float = 0.0
    pre_tax_total: float  # After discount, before tax
    tax_rate: float = 5.0  # 5% GST
    tax_amount: float
    total_amount: float
    status: EstimateStatus = EstimateStatus.DRAFT
    expiration_date: Optional[datetime] = None
    terms_and_conditions: Optional[str] = None
    payment_terms: Optional[str] = 'net_30'  # 'net_15', 'net_30', 'due_on_receipt'
    deposit_required: bool = False
    deposit_percentage: float = 0.0
    deposit_amount: float = 0.0
    template_type: Optional[str] = 'standard'  # 'standard', 'residential_snow', 'commercial_snow', 'custom'
    notes: Optional[str] = None
    attachments: List[str] = []  # URLs or base64 encoded files
    customer_signature: Optional[CustomerSignature] = None
    project_id: Optional[str] = None  # Link to created project
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None

class EstimateCreate(BaseModel):
    customer_id: str
    line_items: List[EstimateLineItem]
    discount_amount: Optional[float] = 0.0
    discount_percentage: Optional[float] = 0.0
    expiration_date: Optional[datetime] = None
    terms_and_conditions: Optional[str] = None
    payment_terms: Optional[str] = 'net_30'
    deposit_required: Optional[bool] = False
    deposit_percentage: Optional[float] = 0.0
    template_type: Optional[str] = 'standard'
    notes: Optional[str] = None
    attachments: Optional[List[str]] = []

class EstimateUpdate(BaseModel):
    line_items: Optional[List[EstimateLineItem]] = None
    discount_amount: Optional[float] = None
    discount_percentage: Optional[float] = None
    expiration_date: Optional[datetime] = None
    terms_and_conditions: Optional[str] = None
    payment_terms: Optional[str] = None
    deposit_required: Optional[bool] = None
    deposit_percentage: Optional[float] = None
    template_type: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[str]] = None
    status: Optional[EstimateStatus] = None
    customer_signature: Optional[CustomerSignature] = None

# Project Models
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class ProjectTask(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    due_date: Optional[datetime] = None
    status: TaskStatus = TaskStatus.TODO
    google_tasks_id: Optional[str] = None  # For Google Tasks sync
    google_tasks_list_id: Optional[str] = None  # Personal task list ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class ProjectTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None

class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Project(BaseModel):
    id: Optional[str] = None
    project_number: str
    name: str
    customer_id: str
    customer_name: str
    estimate_id: str  # Original estimate
    description: Optional[str] = None
    tasks: List[ProjectTask] = []
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    google_tasks_project_list_id: Optional[str] = None  # Shared project task list
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class ProjectCreate(BaseModel):
    name: str
    customer_id: str
    estimate_id: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Enhanced Invoice Models with Deposits & Partial Payments
class PaymentTerms(str, Enum):
    NET_15 = "net_15"  # 3% discount if paid within 15 days
    NET_30 = "net_30"
    DUE_ON_RECEIPT = "due_on_receipt"
    CUSTOM = "custom"

class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"

class InvoicePayment(BaseModel):
    id: Optional[str] = None
    amount: float
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: str  # helcim_card, helcim_ach, check, cash, other
    transaction_id: Optional[str] = None  # Helcim transaction ID
    notes: Optional[str] = None

class EnhancedInvoice(BaseModel):
    id: Optional[str] = None
    invoice_number: str
    customer_id: str
    customer_name: str
    project_id: Optional[str] = None  # Link to project if from project
    estimate_id: Optional[str] = None  # Link to original estimate
    line_items: List[EstimateLineItem] = []
    subtotal: float
    discount_amount: float = 0.0
    pre_tax_total: float
    tax_rate: float = 5.0  # 5% GST
    tax_amount: float
    total_amount: float
    
    # Payment Terms
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    custom_payment_terms: Optional[str] = None
    early_payment_discount: float = 3.0  # 3% off pre-tax if paid within NET_15
    
    # Deposit & Partial Payments
    deposit_required: bool = False
    deposit_amount: float = 0.0
    deposit_percentage: Optional[float] = None
    deposit_paid: bool = False
    deposit_paid_date: Optional[datetime] = None
    
    payments: List[InvoicePayment] = []
    amount_paid: float = 0.0
    amount_due: float = 0.0
    
    # Late Fees
    late_fee_enabled: bool = False
    late_fee_percentage: float = 0.0
    late_fee_amount: float = 0.0
    late_fee_applied_date: Optional[datetime] = None
    
    status: PaymentStatus = PaymentStatus.UNPAID
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EnhancedInvoiceCreate(BaseModel):
    customer_id: str
    project_id: Optional[str] = None
    estimate_id: Optional[str] = None
    line_items: List[EstimateLineItem]
    discount_amount: Optional[float] = 0.0
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    custom_payment_terms: Optional[str] = None
    deposit_required: Optional[bool] = False
    deposit_amount: Optional[float] = 0.0
    deposit_percentage: Optional[float] = None
    late_fee_enabled: Optional[bool] = False
    late_fee_percentage: Optional[float] = 0.0
    notes: Optional[str] = None

class EnhancedInvoiceUpdate(BaseModel):
    line_items: Optional[List[EstimateLineItem]] = None
    discount_amount: Optional[float] = None
    payment_terms: Optional[PaymentTerms] = None
    custom_payment_terms: Optional[str] = None
    late_fee_enabled: Optional[bool] = None
    late_fee_percentage: Optional[float] = None
    status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class InvoicePaymentCreate(BaseModel):
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

# ==================== CALL NOTE MODELS ====================

class CallDisposition(str, Enum):
    ANSWERED = "answered"
    VOICEMAIL = "voicemail"
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    CALLBACK_REQUESTED = "callback_requested"
    WRONG_NUMBER = "wrong_number"
    OTHER = "other"

class CallNote(BaseModel):
    id: Optional[str] = None
    session_id: str  # RingCentral call session ID
    user_id: str  # Who created the note
    disposition: CallDisposition
    notes: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    from_number: Optional[str] = None
    from_name: Optional[str] = None
    customer_id: Optional[str] = None

class CallNoteCreate(BaseModel):
    disposition: CallDisposition
    notes: str


# Email Template Models
class EmailTemplate(BaseModel):
    id: Optional[str] = None
    user_id: str  # Creator
    name: str
    subject: str
    body: str  # HTML or plain text body
    category: Optional[str] = None  # e.g., "Follow-up", "Quote", "Thank You"
    placeholders: List[str] = []  # e.g., ["{{customer_name}}", "{{site_address}}"]
    is_shared: bool = False  # Can other team members use it
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    usage_count: int = 0

class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    body: str
    category: Optional[str] = None
    placeholders: Optional[List[str]] = []
    is_shared: bool = False

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    placeholders: Optional[List[str]] = None
    is_shared: Optional[bool] = None

# CRM Email Link Models
class EmailCustomerLink(BaseModel):
    id: Optional[str] = None
    message_id: str  # Gmail message ID
    customer_id: str
    linked_by_user_id: str
    linked_at: datetime = Field(default_factory=datetime.utcnow)
    auto_linked: bool = False  # True if linked by email match, False if manual
    notes: Optional[str] = None

class EmailCustomerLinkCreate(BaseModel):
    message_id: str
    customer_id: str
    notes: Optional[str] = None

class EmailCustomerLinkResponse(BaseModel):
    id: str
    message_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    linked_by_user_id: str
    linked_at: datetime
    auto_linked: bool
    notes: Optional[str] = None

# Contract/Agreement Models
class ContractStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    SIGNED = "signed"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"

class ContractType(str, Enum):
    SEASONAL = "seasonal"  # Full season contract
    ONE_TIME = "one_time"  # Single service agreement
    RECURRING = "recurring"  # Recurring service agreement
    CUSTOM = "custom"  # Custom agreement

class ContractTemplate(BaseModel):
    id: Optional[str] = None
    template_name: str
    contract_type: ContractType
    content: str  # HTML/Rich text content with placeholders
    placeholders: List[str] = []  # List of available placeholders like {{customer_name}}, {{service_description}}
    is_default: bool = False
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by_user_id: Optional[str] = None

class ContractTemplateCreate(BaseModel):
    template_name: str
    contract_type: ContractType
    content: str
    placeholders: Optional[List[str]] = []
    is_default: Optional[bool] = False

class ContractTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    contract_type: Optional[ContractType] = None
    content: Optional[str] = None
    placeholders: Optional[List[str]] = None
    is_default: Optional[bool] = None
    active: Optional[bool] = None

class Contract(BaseModel):
    id: Optional[str] = None
    contract_number: str  # Auto-generated unique contract number
    template_id: Optional[str] = None  # Link to template used
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    estimate_id: Optional[str] = None  # Link to estimate if generated from estimate
    project_id: Optional[str] = None  # Link to project if associated
    contract_type: ContractType
    title: str  # Contract title
    content: str  # Final contract content (HTML/text with placeholders replaced)
    service_description: str  # Description of services
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None
    contract_value: float = 0.0  # Total contract value
    payment_terms: Optional[str] = 'net_30'
    terms_and_conditions: Optional[str] = None
    status: ContractStatus = ContractStatus.DRAFT
    customer_signature: Optional[CustomerSignature] = None
    company_signature: Optional[CustomerSignature] = None  # Admin/company signature
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    signed_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None
    terminated_at: Optional[datetime] = None
    termination_reason: Optional[str] = None
    termination_notes: Optional[str] = None
    expiration_date: Optional[datetime] = None
    notes: Optional[str] = None
    attachments: List[str] = []  # URLs or file paths
    auto_renew: bool = False
    renewal_terms: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by_user_id: Optional[str] = None

class ContractCreate(BaseModel):
    customer_id: str
    template_id: Optional[str] = None
    estimate_id: Optional[str] = None
    contract_type: ContractType
    title: str
    service_description: str
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None
    contract_value: Optional[float] = 0.0
    payment_terms: Optional[str] = 'net_30'
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[str]] = []
    auto_renew: Optional[bool] = False
    renewal_terms: Optional[str] = None

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    service_description: Optional[str] = None
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None
    contract_value: Optional[float] = None
    payment_terms: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    status: Optional[ContractStatus] = None
    notes: Optional[str] = None
    attachments: Optional[List[str]] = None
    auto_renew: Optional[bool] = None
    renewal_terms: Optional[str] = None
    customer_signature: Optional[CustomerSignature] = None
    company_signature: Optional[CustomerSignature] = None


# Geofence Models
class GeofenceEventType(str, Enum):
    ENTRY = "entry"
    EXIT = "exit"

class GeofenceLog(BaseModel):
    id: Optional[str] = None
    crew_id: str
    crew_name: Optional[str] = None
    site_id: str
    site_name: Optional[str] = None
    dispatch_id: Optional[str] = None
    event_type: GeofenceEventType  # entry or exit
    latitude: float
    longitude: float
    timestamp: datetime
    manual_click: bool = False  # True if triggered by crew clicking start/end
    notes: Optional[str] = None

class GeofenceLogCreate(BaseModel):
    crew_id: str
    crew_name: Optional[str] = None
    site_id: str
    site_name: Optional[str] = None
    dispatch_id: Optional[str] = None
    event_type: GeofenceEventType
    latitude: float
    longitude: float
    manual_click: bool = False
    notes: Optional[str] = None

class SiteGeofence(BaseModel):
    id: Optional[str] = None
    site_id: str
    site_name: Optional[str] = None
    latitude: float
    longitude: float
    radius_meters: float = 100.0  # Default 100m radius
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

class SiteGeofenceCreate(BaseModel):
    site_id: str
    radius_meters: float = 100.0

class SiteGeofenceUpdate(BaseModel):
    radius_meters: Optional[float] = None
    is_active: Optional[bool] = None


# ============================================================================
# MESSAGING SYSTEM MODELS
# ============================================================================

class MessageType(str, Enum):
    DIRECT = "direct"  # 1-on-1 conversation
    GROUP = "group"    # Group conversation
    BROADCAST = "broadcast"  # One-way broadcast message

class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

class ParticipantRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"  # For customers

# Conversation/Thread Model
class Conversation(BaseModel):
    id: Optional[str] = None
    conversation_type: MessageType = MessageType.DIRECT
    title: Optional[str] = None  # For group chats
    participant_ids: List[str] = Field(default_factory=list)  # User IDs in conversation
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_archived: bool = False
    metadata: Optional[dict] = None  # For custom data (project_id, customer_id, etc.)

class ConversationCreate(BaseModel):
    conversation_type: MessageType = MessageType.DIRECT
    title: Optional[str] = None
    participant_ids: List[str]
    metadata: Optional[dict] = None

# Message Attachment Model
class MessageAttachment(BaseModel):
    file_name: str
    file_url: str
    file_type: str  # mime type
    file_size: int  # in bytes
    thumbnail_url: Optional[str] = None  # For images/videos

# Message Model
class Message(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    content: str
    attachments: List[MessageAttachment] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)  # User IDs mentioned with @
    reply_to: Optional[str] = None  # Message ID if replying to another message
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_edited: bool = False
    is_deleted: bool = False

class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    attachments: List[MessageAttachment] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)
    reply_to: Optional[str] = None

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    is_deleted: Optional[bool] = None

# Message Read Receipt Model
class MessageReadReceipt(BaseModel):
    id: Optional[str] = None
    message_id: str
    conversation_id: str
    user_id: str
    read_at: datetime = Field(default_factory=datetime.utcnow)

# Typing Indicator Model
class TypingIndicator(BaseModel):
    conversation_id: str
    user_id: str
    user_name: str
    is_typing: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Conversation Participant Model
class ConversationParticipant(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    user_id: str
    user_name: str
    user_role: ParticipantRole = ParticipantRole.MEMBER
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    last_read_at: Optional[datetime] = None
    is_muted: bool = False
    is_archived: bool = False

# Message Search/Filter Models
class MessageSearchParams(BaseModel):
    query: Optional[str] = None
    conversation_id: Optional[str] = None
    sender_id: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    has_attachments: Optional[bool] = None
    limit: int = 50
    offset: int = 0



# ==================== INVENTORY MODELS ====================

class InventoryCategory(str, Enum):
    EQUIPMENT = "equipment"
    PARTS = "parts"
    MATERIALS = "materials"
    CONSUMABLES = "consumables"

class InventoryStatus(str, Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"

class InventoryItem(BaseModel):
    id: Optional[str] = None
    name: str
    category: InventoryCategory
    quantity: float
    unit: str
    min_quantity: float
    location: str
    supplier: Optional[str] = None
    supplier_contact: Optional[str] = None
    cost_per_unit: float
    last_restocked: Optional[datetime] = None
    status: InventoryStatus
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InventoryItemCreate(BaseModel):
    name: str
    category: InventoryCategory
    quantity: float
    unit: str
    min_quantity: float
    location: str
    supplier: Optional[str] = None
    supplier_contact: Optional[str] = None
    cost_per_unit: float
    last_restocked: Optional[datetime] = None
    notes: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[InventoryCategory] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_quantity: Optional[float] = None
    location: Optional[str] = None
    supplier: Optional[str] = None
    supplier_contact: Optional[str] = None
    cost_per_unit: Optional[float] = None

# ==================== ACCESS CONTROL MODELS ====================

class AccessGroup(str, Enum):
    INTERNAL = "Internal"
    SUBCONTRACTOR = "Subcontractor"

class UserAccess(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    role: UserRole
    access_group: AccessGroup
    status: str = "active"  # active or inactive
    permissions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== AUTOMATION ANALYTICS MODELS ====================

class WorkflowExecutionStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RUNNING = "running"

class WorkflowExecution(BaseModel):
    id: Optional[str] = None
    workflow_id: str
    workflow_name: str
    status: WorkflowExecutionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[float] = None  # in seconds
    trigger: str = "manual"  # manual, scheduled, webhook, event
    context: Optional[dict] = None
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    last_login: Optional[datetime] = None

    last_restocked: Optional[datetime] = None
    notes: Optional[str] = None



# ==================== HR MODULE MODELS ====================

# Employee Management Models
class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    SEASONAL = "seasonal"
    TEMPORARY = "temporary"

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    SUSPENDED = "suspended"

class Employee(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None  # Link to User model
    employee_number: str  # Unique employee identifier
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: Optional[datetime] = None
    hire_date: datetime
    termination_date: Optional[datetime] = None
    employment_type: EmploymentType
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    department: Optional[str] = None
    job_title: str
    manager_id: Optional[str] = None  # Employee ID of manager
    hourly_rate: Optional[float] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    documents: List[dict] = []  # Employment docs, I-9, W-4, etc.
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EmployeeCreate(BaseModel):
    user_id: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: Optional[datetime] = None
    hire_date: datetime
    employment_type: EmploymentType
    department: Optional[str] = None
    job_title: str
    manager_id: Optional[str] = None
    hourly_rate: Optional[float] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    employment_type: Optional[EmploymentType] = None
    employment_status: Optional[EmploymentStatus] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    manager_id: Optional[str] = None
    hourly_rate: Optional[float] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    termination_date: Optional[datetime] = None

# Time & Attendance Models
class TimeEntryType(str, Enum):
    REGULAR = "regular"
    OVERTIME = "overtime"
    DOUBLE_TIME = "double_time"
    BREAK = "break"

class TimeEntryStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class TimeEntry(BaseModel):
    id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    clock_in: datetime
    clock_out: Optional[datetime] = None
    break_duration_minutes: int = 0
    total_hours: Optional[float] = None
    entry_type: TimeEntryType = TimeEntryType.REGULAR
    status: TimeEntryStatus = TimeEntryStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    location_in: Optional[dict] = None  # {lat, lng, address}
    location_out: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TimeEntryCreate(BaseModel):
    employee_id: str
    clock_in: datetime
    clock_out: Optional[datetime] = None
    break_duration_minutes: int = 0
    entry_type: TimeEntryType = TimeEntryType.REGULAR
    location_in: Optional[dict] = None
    notes: Optional[str] = None

class TimeEntryUpdate(BaseModel):
    clock_out: Optional[datetime] = None
    break_duration_minutes: Optional[int] = None
    entry_type: Optional[TimeEntryType] = None
    status: Optional[TimeEntryStatus] = None
    notes: Optional[str] = None

# PTO (Paid Time Off) Models
class PTOType(str, Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    UNPAID = "unpaid"
    BEREAVEMENT = "bereavement"
    JURY_DUTY = "jury_duty"
    OTHER = "other"

class PTOStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    CANCELLED = "cancelled"

class PTORequest(BaseModel):
    id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    pto_type: PTOType
    start_date: datetime
    end_date: datetime
    total_days: float
    reason: Optional[str] = None
    status: PTOStatus = PTOStatus.PENDING
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PTORequestCreate(BaseModel):
    employee_id: str
    pto_type: PTOType
    start_date: datetime
    end_date: datetime
    total_days: float
    reason: Optional[str] = None

class PTORequestUpdate(BaseModel):
    status: Optional[PTOStatus] = None
    review_notes: Optional[str] = None

class PTOBalance(BaseModel):
    id: Optional[str] = None
    employee_id: str
    year: int
    vacation_balance: float = 0.0
    sick_balance: float = 0.0
    personal_balance: float = 0.0
    vacation_accrued: float = 0.0
    sick_accrued: float = 0.0
    personal_accrued: float = 0.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Training & Certifications Models
class TrainingStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Training(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str  # safety, equipment, compliance, etc.
    duration_hours: Optional[float] = None
    expiration_months: Optional[int] = None  # For certifications that expire
    is_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TrainingCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    duration_hours: Optional[float] = None
    expiration_months: Optional[int] = None
    is_required: bool = False

class EmployeeTraining(BaseModel):
    id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    training_id: str
    training_name: Optional[str] = None
    status: TrainingStatus
    assigned_date: datetime = Field(default_factory=datetime.utcnow)
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    score: Optional[float] = None
    certificate_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmployeeTrainingCreate(BaseModel):
    employee_id: str
    training_id: str
    assigned_date: Optional[datetime] = None
    notes: Optional[str] = None

class EmployeeTrainingUpdate(BaseModel):
    status: Optional[TrainingStatus] = None
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    score: Optional[float] = None
    certificate_url: Optional[str] = None
    notes: Optional[str] = None

# Performance Management Models
class ReviewType(str, Enum):
    ANNUAL = "annual"
    QUARTERLY = "quarterly"
    PROBATIONARY = "probationary"
    PROJECT = "project"

class ReviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PerformanceReview(BaseModel):
    id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    reviewer_id: str
    reviewer_name: Optional[str] = None
    review_type: ReviewType
    review_period_start: datetime
    review_period_end: datetime
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    status: ReviewStatus = ReviewStatus.SCHEDULED
    overall_rating: Optional[float] = None  # 1-5 scale
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    goals: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PerformanceReviewCreate(BaseModel):
    employee_id: str
    reviewer_id: str
    review_type: ReviewType
    review_period_start: datetime
    review_period_end: datetime
    scheduled_date: datetime

class PerformanceReviewUpdate(BaseModel):
    status: Optional[ReviewStatus] = None
    completed_date: Optional[datetime] = None
    overall_rating: Optional[float] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    goals: Optional[str] = None
    notes: Optional[str] = None

# Payroll Configuration Models
class PayFrequency(str, Enum):
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    SEMI_MONTHLY = "semi_monthly"
    MONTHLY = "monthly"

class PayrollSettings(BaseModel):
    id: Optional[str] = None
    company_name: str
    tax_id: Optional[str] = None
    pay_frequency: PayFrequency
    overtime_threshold_hours: float = 40.0
    overtime_multiplier: float = 1.5
    double_time_multiplier: float = 2.0
    next_payroll_date: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== INTEGRATION HUB MODELS ====================

class IntegrationStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"

class IntegrationType(str, Enum):
    QUICKBOOKS = "quickbooks"
    MICROSOFT_365 = "microsoft_365"
    GOOGLE_WORKSPACE = "google_workspace"
    OTHER = "other"

class Integration(BaseModel):
    id: Optional[str] = None
    integration_type: IntegrationType
    name: str
    description: Optional[str] = None
    status: IntegrationStatus = IntegrationStatus.DISCONNECTED
    credentials: dict = {}  # Encrypted credentials
    settings: dict = {}  # Integration-specific settings
    last_sync: Optional[datetime] = None
    sync_frequency: Optional[str] = None  # hourly, daily, manual
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class IntegrationCreate(BaseModel):
    integration_type: IntegrationType
    name: str
    description: Optional[str] = None
    credentials: dict
    settings: Optional[dict] = {}
    sync_frequency: Optional[str] = "manual"

class IntegrationUpdate(BaseModel):
    status: Optional[IntegrationStatus] = None
    credentials: Optional[dict] = None
    settings: Optional[dict] = None
    sync_frequency: Optional[str] = None
    error_message: Optional[str] = None

class SyncLog(BaseModel):
    id: Optional[str] = None
    integration_id: str
    integration_name: str
    sync_type: str  # full, incremental
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str  # success, failed, in_progress
    records_synced: int = 0
    errors: List[str] = []
    details: Optional[dict] = None
