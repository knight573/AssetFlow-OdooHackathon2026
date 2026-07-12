export type UserRole = 'employee' | 'department_head' | 'asset_manager' | 'admin';

export interface Department {
  id: string;
  name: string;
  head_id: string | null;
  parent_department_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  custom_fields: Record<string, any>;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  category_id: string | null;
  serial_number: string | null;
  acquisition_date: string | null;
  acquisition_cost: number | null;
  condition: 'new' | 'good' | 'fair' | 'poor';
  location: string | null;
  department_id: string | null;
  photo_url: string | null;
  is_bookable: boolean;
  status: 'available' | 'allocated' | 'reserved' | 'under_maintenance' | 'lost' | 'retired' | 'disposed';
  created_at: string;
}

export interface Allocation {
  id: string;
  asset_id: string;
  employee_id: string | null;
  department_id: string | null;
  allocated_by: string | null;
  allocated_at: string;
  expected_return_date: string | null;
  returned_at: string | null;
  return_condition_notes: string | null;
  status: 'active' | 'returned';
  created_at: string;
}

export interface TransferRequest {
  id: string;
  asset_id: string;
  from_employee_id: string | null;
  to_employee_id: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  resource_asset_id: string;
  booked_by: string | null;
  purpose: string | null;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  raised_by: string | null;
  issue_description: string | null;
  priority: 'low' | 'medium' | 'high';
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'technician_assigned' | 'in_progress' | 'resolved';
  technician_name: string | null;
  approved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AuditCycle {
  id: string;
  name: string;
  department_id: string | null;
  location: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  status: 'open' | 'closed';
  created_by: string | null;
  created_at: string;
}

export interface AuditAuditor {
  audit_cycle_id: string;
  auditor_id: string;
}

export interface AuditItem {
  id: string;
  audit_cycle_id: string;
  asset_id: string | null;
  expected_location: string | null;
  verification_status: 'pending' | 'verified' | 'missing' | 'damaged';
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}
