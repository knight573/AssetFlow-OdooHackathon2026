export type UserRole = 'employee' | 'department_head' | 'asset_manager' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  parent_id?: string;
  parent_department_id?: string | null;
  department_head_id?: string;
  head_id?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  custom_fields?: any;
  status?: 'active' | 'inactive';
  created_at: string;
}

export type AssetStatus = 'available' | 'allocated' | 'reserved' | 'under_maintenance' | 'lost' | 'retired' | 'disposed';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged' | 'new' | 'good' | 'fair' | 'poor';

export interface Asset {
  id: string;
  tag: string;
  name: string;
  serial_number: string | null;
  category_id: string | null;
  department_id: string | null;
  status: AssetStatus;
  is_bookable: boolean;
  image_url?: string;
  photo_url?: string | null;
  condition: AssetCondition;
  acquisition_date?: string | null;
  acquisition_cost?: number | null;
  location?: string | null;
  created_at: string;
}

export interface Allocation {
  id: string;
  asset_id: string;
  
  // P2 (HEAD) fields
  profile_id?: string;
  condition_returned?: AssetCondition;
  notes?: string;
  expected_return_at?: string;

  // P3 (origin/main) fields
  employee_id?: string | null;
  allocated_by?: string | null;
  expected_return_date?: string | null;
  returned_at?: string | null;
  return_condition_notes?: string | null;
  department_id?: string | null;

  status: 'active' | 'returned' | 'overdue';
  allocated_at: string;
  created_at: string;
}

export interface TransferRequest {
  id: string;
  asset_id: string;

  // P2 (HEAD) fields
  from_profile_id?: string;
  to_profile_id?: string;
  requested_at?: string;
  approved_at?: string;
  notes?: string;

  // P3 (origin/main) fields
  from_employee_id?: string | null;
  to_employee_id?: string | null;
  reason?: string | null;
  requested_by?: string | null;
  approved_by?: string | null;

  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Booking {
  id: string;
  resource_asset_id: string;

  // P2 (HEAD) fields
  booker_profile_id?: string;

  // P3 (origin/main) fields
  booked_by?: string | null;
  purpose: string | null;

  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'upcoming' | 'ongoing' | 'completed';
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  asset_id: string;

  // P2 (HEAD) fields
  requester_profile_id?: string;
  technician_assigned_id?: string;
  details?: string;

  // P3 (origin/main) fields
  raised_by?: string | null;
  issue_description?: string | null;
  photo_url?: string | null;
  technician_name?: string | null;
  approved_by?: string | null;

  status: 'pending' | 'approved' | 'rejected' | 'technician_assigned' | 'in_progress' | 'resolved' | 'assigned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  resolved_at?: string | null;
}

export interface AuditCycle {
  id: string;
  name: string;
  department_id?: string | null;
  location?: string | null;
  date_range_start?: string | null;
  date_range_end?: string | null;
  status: 'draft' | 'active' | 'closed' | 'open';
  created_by?: string | null;
  created_at: string;
  closed_at?: string;
}

export interface AuditAuditor {
  id?: string;
  audit_cycle_id: string;
  auditor_profile_id?: string;
  auditor_id?: string;
}

export interface AuditItem {
  id: string;
  audit_cycle_id: string;
  asset_id: string | null;
  status?: 'pending' | 'verified' | 'missing' | 'damaged';
  verification_status?: 'pending' | 'verified' | 'missing' | 'damaged';
  notes: string | null;
  updated_at?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
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
