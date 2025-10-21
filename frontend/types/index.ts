export type UserRole = 'admin' | 'crew' | 'subcontractor' | 'customer';

export type UserStatus = 'on_shift' | 'busy' | 'off_shift' | 'offline';

export type DispatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceType = 'plowing' | 'salting' | 'shoveling' | 'sanding' | 'ice_removal';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  title?: string;
  status?: UserStatus;
  messaging_enabled?: boolean;
  avatar?: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_title?: string;
  receiver_id: string;
  receiver_name: string;
  receiver_title?: string;
  message: string;
  read: boolean;
  conversation_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type?: 'direct_message' | 'sms' | 'email';
  conversationType?: 'sms' | 'email' | 'direct';
  conversation_id?: string;
  customer_id?: string;
  customer_name?: string;
  other_user?: User;
  participant_ids: string[];
  participant_names: string[];
  participant_titles: string[];
  last_message?: string;
  last_message_at?: string;
  unread_count: { [key: string]: number } | number;
  unread_count_for_user?: number;
  created_at: string;
  updated_at: string;
  isSMS?: boolean;
  communication_type?: string;
}

export interface GmailConnection {
  id: string;
  email_address: string;
  is_shared: boolean;
  connected_at: string;
  last_synced: string | null;
}

export interface GmailEmail {
  id: string;
  message_id: string;
  thread_id: string;
  email_address: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  body: string;
  is_unread: boolean;
  is_starred?: boolean;
  has_attachments?: boolean;
  date: string;
  customer_id?: string;
  synced_at: string;
  label_ids?: string[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  message_list_visibility: string;
  label_list_visibility: string;
  color?: {
    backgroundColor?: string;
    textColor?: string;
  };
  message_count?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  active: boolean;
  created_at: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface SiteService {
  service_id: string;
  service_name: string;
  service_type: string;
  unit_type: string;
  cost: number;
  notes?: string;
  trigger_type?: string;
  trigger_value?: string;
}

export interface SiteAccessField {
  field_name: string;
  field_value: string;
  field_type: string;
}

export interface Site {
  id: string;
  customer_id: string;
  name: string;
  site_reference?: string;
  location: Location;
  site_type: string;
  area_size?: number;
  notes?: string;
  internal_notes?: string;
  crew_notes?: string;
  services?: SiteService[];
  access_fields?: SiteAccessField[];
  priority_level?: string;
  active: boolean;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  status: 'available' | 'in_use' | 'maintenance';
  vehicle_number?: string;
  avatar?: string;
  photo?: string;
  active: boolean;
  created_at: string;
}

export interface Route {
  id: string;
  name: string;
  stops: Array<{
    site_id: string;
    site_name: string;
    sequence: number;
  }>;
  estimated_duration?: number;
  is_template: boolean;
  created_at: string;
}

export interface Dispatch {
  id: string;
  route_id?: string;
  route_name?: string;
  scheduled_time: string;
  completed_at?: string;
  crew_ids: string[];
  crew_names?: string[];
  equipment_ids: string[];
  equipment_names?: string[];
  site_ids: string[];
  site_names?: string[];
  service_ids?: string[];
  service_names?: string[];
  status: DispatchStatus;
  notes?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  dispatch_id: string;
  site_id: string;
  photo_type: 'before' | 'after' | 'during' | 'issue';
  image_data: string;
  location?: Location;
  timestamp: string;
  notes?: string;
  crew_id?: string;
  crew_name?: string;
  category?: string;
  thumbnail_data?: string;
  weather_conditions?: string;
  temperature?: number;
  file_size?: number;
  image_width?: number;
  image_height?: number;
  device_info?: string;
  is_required?: boolean;
  is_verified?: boolean;
  created_at: string;
}

export interface FormField {
  id: string;
  label: string;
  field_type: 'text' | 'number' | 'checkbox' | 'select' | 'signature' | 'photo' | 'date' | 'time' | 'yes_no' | 'section';
  required: boolean;
  options?: string[];
  placeholder?: string;
  section?: string;
  conditional_logic?: {
    depends_on_field: string;
    depends_on_value: string;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  form_type: 'service_tracking' | 'safety_check' | 'customer_feedback' | 'custom' | 'equipment_form';
  equipment_type?: string;
  fields: FormField[];
  archived?: boolean;
  created_at: string;
}

export interface FormResponse {
  id: string;
  form_template_id: string;
  form_name: string;
  crew_id: string;
  crew_name: string;
  dispatch_id?: string;
  site_id?: string;
  equipment_id?: string;
  answers: { [key: string]: any };
  submitted_at: string;
}

export interface GPSLocation {
  id: string;
  crew_id: string;
  crew_name?: string;
  dispatch_id?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  bearing?: number;
  altitude?: number;
}

export interface Consumable {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  cost_per_unit: number;
  notes?: string;
  active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  service_type: string;
  description?: string;
  pricing: { [key: string]: number };
  consumable_id?: string;
  active: boolean;
  created_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  user_name: string;
  clock_in: string;
  clock_out?: string;
  notes?: string;
  created_at: string;
}

export interface Message {
  id: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  content: string;
  from_user_id?: string;
  from_user_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  customer_id?: string;
  dispatch_id?: string;
  site_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Weather {
  temperature: number;
  condition: string;
  precipitation: number;
  wind_speed: number;
  timestamp: string;
}

export interface LearningDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author_id: string;
  author_name: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
