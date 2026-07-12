export type UserRole = 'employee' | 'department_head' | 'asset_manager' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  parent_id?: string;
  department_head_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  custom_fields?: any;
  status: 'active' | 'inactive';
  created_at: string;
}

export type AssetStatus = 'available' | 'allocated' | 'under_maintenance' | 'lost' | 'retired' | 'disposed';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';

export interface Asset {
  id: string;
  tag: string;
  name: string;
  serial_number?: string;
  category_id: string;
  department_id?: string;
  status: AssetStatus;
  is_bookable: boolean;
  image_url?: string;
  condition: AssetCondition;
  created_at: string;
}

export interface Allocation {
  id: string;
  asset_id: string;
  profile_id: string;
  status: 'active' | 'returned' | 'overdue';
  allocated_at: string;
  expected_return_at?: string;
  returned_at?: string;
  condition_returned?: AssetCondition;
  notes?: string;
  created_at: string;
}

export interface TransferRequest {
  id: string;
  asset_id: string;
  from_profile_id: string;
  to_profile_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  resource_asset_id: string;
  booker_profile_id: string;
  status: 'confirmed' | 'cancelled';
  start_time: string;
  end_time: string;
  purpose?: string;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  requester_profile_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  technician_assigned_id?: string;
  details: string;
  created_at: string;
  resolved_at?: string;
}

export interface AuditCycle {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  closed_at?: string;
}

export interface AuditItem {
  id: string;
  audit_cycle_id: string;
  asset_id: string;
  status: 'pending' | 'verified' | 'missing' | 'damaged';
  notes?: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}
