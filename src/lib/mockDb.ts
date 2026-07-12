import { Asset, Profile, Department, Category, Booking, MaintenanceRequest, Notification, ActivityLog, AuditCycle, AuditAuditor, AuditItem } from './types';

// Seed data IDs
export const SEED_DEP_ENG = 'd1111111-1111-1111-1111-111111111111';
export const SEED_DEP_FAC = 'd2222222-2222-2222-2222-222222222222';
export const SEED_DEP_OPS = 'd3333333-3333-3333-3333-333333333333';

export const SEED_CAT_ELEC = 'c1111111-1111-1111-1111-111111111111';
export const SEED_CAT_FURN = 'c2222222-2222-2222-2222-222222222222';
export const SEED_CAT_VEHI = 'c3333333-3333-3333-3333-333333333333';

export const SEED_ASSET_LAPTOP = 'a1111111-1111-1111-1111-111111111111';
export const SEED_ASSET_PROJ = 'a2222222-2222-2222-2222-222222222222';
export const SEED_ASSET_CHAIR = 'a3333333-3333-3333-3333-333333333333';
export const SEED_ASSET_ROOM = 'a4444444-4444-4444-4444-444444444444';
export const SEED_ASSET_VAN = 'a5555555-5555-5555-5555-555555555555';

// Core Persons & Additional Employees
export const SEED_USER_AADARSH = 'u0000000-0000-0000-0000-000000000000';
export const SEED_USER_YASH = 'u1111111-1111-1111-1111-111111111111';
export const SEED_USER_FAHAD = 'u2222222-2222-2222-2222-222222222222';
export const SEED_USER_MRINAL = 'u3333333-3333-3333-3333-333333333333';
export const SEED_USER_SARAH = 'u4444444-4444-4444-4444-444444444444';

export const SEED_USER_AMIT = 'u5555555-5555-5555-5555-555555555555';
export const SEED_USER_NEHA = 'u6666666-6666-6666-6666-666666666666';
export const SEED_USER_RAHUL = 'u7777777-7777-7777-7777-777777777777';
export const SEED_USER_DEEPA = 'u8888888-8888-8888-8888-888888888888';

const INITIAL_DEPARTMENTS: Department[] = [
  { id: SEED_DEP_ENG, name: 'Engineering', head_id: SEED_USER_AMIT, parent_department_id: null, status: 'active', created_at: new Date().toISOString() },
  { id: SEED_DEP_FAC, name: 'Facilities', head_id: SEED_USER_SARAH, parent_department_id: null, status: 'active', created_at: new Date().toISOString() },
  { id: SEED_DEP_OPS, name: 'Field Ops (east)', head_id: null, parent_department_id: SEED_DEP_FAC, status: 'inactive', created_at: new Date().toISOString() },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: SEED_CAT_ELEC, name: 'Electronics', custom_fields: { warranty_period_months: 24 }, created_at: new Date().toISOString() },
  { id: SEED_CAT_FURN, name: 'Furniture', custom_fields: {}, created_at: new Date().toISOString() },
  { id: SEED_CAT_VEHI, name: 'Vehicles', custom_fields: {}, created_at: new Date().toISOString() },
];

const INITIAL_PROFILES: Profile[] = [
  // 4 Admins
  { id: SEED_USER_AADARSH, name: 'Aadarsh Nath', email: 'aadarsh@company.com', department_id: SEED_DEP_ENG, role: 'admin', status: 'active', created_at: new Date().toISOString(), password: 'admin123' },
  { id: SEED_USER_YASH, name: 'Yash Raj', email: 'yash@company.com', department_id: SEED_DEP_FAC, role: 'admin', status: 'active', created_at: new Date().toISOString(), password: 'admin123' },
  { id: SEED_USER_FAHAD, name: 'Fahad Hassan', email: 'fahad@company.com', department_id: SEED_DEP_ENG, role: 'admin', status: 'active', created_at: new Date().toISOString(), password: 'admin123' },
  { id: SEED_USER_MRINAL, name: 'Mrinal Kishor', email: 'mrinal@company.com', department_id: SEED_DEP_ENG, role: 'admin', status: 'active', created_at: new Date().toISOString(), password: 'admin123' },
  
  // Managers, Dept Heads, and Employees
  { id: SEED_USER_SARAH, name: 'Sarah Jenkins', email: 'sarah@company.com', department_id: SEED_DEP_FAC, role: 'asset_manager', status: 'active', created_at: new Date().toISOString(), password: 'employee123' },
  { id: SEED_USER_AMIT, name: 'Amit Kumar', email: 'amit@company.com', department_id: SEED_DEP_ENG, role: 'department_head', status: 'active', created_at: new Date().toISOString(), password: 'employee123' },
  { id: SEED_USER_NEHA, name: 'Ravi Kumar', email: 'kravi1610@gmail.com', department_id: SEED_DEP_ENG, role: 'employee', status: 'active', created_at: new Date().toISOString(), password: 'employee123' },
  { id: SEED_USER_RAHUL, name: 'Rahul Verma', email: 'rahul@company.com', department_id: SEED_DEP_FAC, role: 'employee', status: 'active', created_at: new Date().toISOString(), password: 'employee123' },
  { id: SEED_USER_DEEPA, name: 'Deepa Patel', email: 'deepa@company.com', department_id: SEED_DEP_FAC, role: 'employee', status: 'active', created_at: new Date().toISOString(), password: 'employee123' },
];

const INITIAL_ASSETS: Asset[] = [
  { id: SEED_ASSET_LAPTOP, tag: 'AF-0114', name: 'Dell laptop', category_id: SEED_CAT_ELEC, serial_number: 'DL-99212A', acquisition_date: '2025-01-15', acquisition_cost: 1200, condition: 'good', location: 'Bengaluru', department_id: SEED_DEP_ENG, photo_url: null, is_bookable: false, status: 'allocated', created_at: new Date().toISOString() },
  { id: SEED_ASSET_PROJ, tag: 'AF-0002', name: 'Projector', category_id: SEED_CAT_ELEC, serial_number: 'PJ-4412B', acquisition_date: '2024-06-20', acquisition_cost: 800, condition: 'fair', location: 'HQ Floor 2', department_id: SEED_DEP_FAC, photo_url: null, is_bookable: false, status: 'under_maintenance', created_at: new Date().toISOString() },
  { id: SEED_ASSET_CHAIR, tag: 'AF-9921', name: 'Office chair', category_id: SEED_CAT_FURN, serial_number: 'CH-88331', acquisition_date: '2024-11-02', acquisition_cost: 250, condition: 'good', location: 'Warehouse', department_id: SEED_DEP_ENG, photo_url: null, is_bookable: false, status: 'available', created_at: new Date().toISOString() },
  { id: SEED_ASSET_ROOM, tag: 'AF-0004', name: 'Conference Room B2', category_id: SEED_CAT_FURN, serial_number: null, acquisition_date: '2023-01-01', acquisition_cost: 0, condition: 'good', location: 'HQ Floor 1', department_id: null, photo_url: null, is_bookable: true, status: 'available', created_at: new Date().toISOString() },
  { id: SEED_ASSET_VAN, tag: 'AF-0005', name: 'Facilities Van', category_id: SEED_CAT_VEHI, serial_number: 'VN-5511X', acquisition_date: '2023-05-10', acquisition_cost: 35000, condition: 'good', location: 'HQ Garage', department_id: SEED_DEP_FAC, photo_url: null, is_bookable: true, status: 'available', created_at: new Date().toISOString() },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    resource_asset_id: SEED_ASSET_ROOM,
    booked_by: SEED_USER_FAHAD,
    purpose: 'Weekly Team Sync',
    start_time: (() => {
      const d = new Date();
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    })(),
    end_time: (() => {
      const d = new Date();
      d.setHours(15, 30, 0, 0);
      return d.toISOString();
    })(),
    status: 'upcoming',
    created_at: new Date().toISOString()
  }
];

const INITIAL_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    asset_id: SEED_ASSET_PROJ,
    raised_by: SEED_USER_FAHAD,
    issue_description: 'Lamp flickering and colors distorted.',
    priority: 'medium',
    photo_url: null,
    status: 'in_progress',
    technician_name: 'Rohan Das',
    approved_by: SEED_USER_YASH,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    resolved_at: null
  }
];

const INITIAL_ALLOCATIONS = [
  {
    id: 'al111111-1111-1111-1111-111111111111',
    asset_id: SEED_ASSET_LAPTOP,
    employee_id: SEED_USER_FAHAD,
    department_id: SEED_DEP_ENG,
    allocated_by: SEED_USER_YASH,
    allocated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    expected_return_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    returned_at: null,
    return_condition_notes: null,
    status: 'active',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  }
];

const INITIAL_AUDIT_CYCLES: AuditCycle[] = [
  { id: 'ac1', name: 'Q3 Engineering Audit', department_id: SEED_DEP_ENG, location: 'Bengaluru', date_range_start: '2026-07-01', date_range_end: '2026-07-31', status: 'open', created_by: SEED_USER_AADARSH, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];

const INITIAL_AUDIT_AUDITORS: AuditAuditor[] = [
  { audit_cycle_id: 'ac1', auditor_id: SEED_USER_FAHAD }
];

const INITIAL_AUDIT_ITEMS: AuditItem[] = [
  { id: 'ai1', audit_cycle_id: 'ac1', asset_id: SEED_ASSET_CHAIR, expected_location: 'Warehouse', verification_status: 'pending', notes: null, created_at: new Date().toISOString() },
  { id: 'ai2', audit_cycle_id: 'ac1', asset_id: SEED_ASSET_LAPTOP, expected_location: 'Bengaluru Office', verification_status: 'pending', notes: null, created_at: new Date().toISOString() }
];

export function initMockDb(force = false) {
  if (!force && localStorage.getItem('assetflow_init') === 'true') {
    return;
  }

  localStorage.setItem('assetflow_departments', JSON.stringify(INITIAL_DEPARTMENTS));
  localStorage.setItem('assetflow_categories', JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem('assetflow_profiles', JSON.stringify(INITIAL_PROFILES));
  localStorage.setItem('assetflow_assets', JSON.stringify(INITIAL_ASSETS));
  localStorage.setItem('assetflow_bookings', JSON.stringify(INITIAL_BOOKINGS));
  localStorage.setItem('assetflow_maintenance_requests', JSON.stringify(INITIAL_MAINTENANCE));
  localStorage.setItem('assetflow_allocations', JSON.stringify(INITIAL_ALLOCATIONS));
  localStorage.setItem('assetflow_transfer_requests', JSON.stringify([]));
  localStorage.setItem('assetflow_notifications', JSON.stringify([]));
  localStorage.setItem('assetflow_activity_logs', JSON.stringify([]));
  localStorage.setItem('assetflow_audit_cycles', JSON.stringify(INITIAL_AUDIT_CYCLES));
  localStorage.setItem('assetflow_audit_auditors', JSON.stringify(INITIAL_AUDIT_AUDITORS));
  localStorage.setItem('assetflow_audit_items', JSON.stringify(INITIAL_AUDIT_ITEMS));

  localStorage.setItem('assetflow_init', 'true');
}

export function getMockData<T>(table: string): T[] {
  initMockDb();
  const key = `assetflow_${table}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function setMockData<T>(table: string, data: T[]): void {
  const key = `assetflow_${table}`;
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch custom event to trigger reactivity in mock listeners
  window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table } }));
}

export function insertMockRow<T extends { id: string }>(table: string, row: T): T {
  const list = getMockData<T>(table);
  list.unshift(row); // Insert at beginning
  setMockData(table, list);
  return row;
}

export function updateMockRow<T extends { id: string }>(table: string, id: string, updates: Partial<T>): T {
  const list = getMockData<T>(table);
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Row with id ${id} not found in ${table}`);
  }
  const updatedItem = { ...list[index], ...updates };
  list[index] = updatedItem;
  setMockData(table, list);
  return updatedItem;
}
