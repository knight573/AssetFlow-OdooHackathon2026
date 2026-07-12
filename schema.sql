-- AssetFlow SQL Schema
-- Paste this schema into the Supabase SQL Editor to set up the Postgres database.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. DEPARTMENTS
create table departments (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    parent_id uuid references departments(id) on delete set null,
    department_head_id uuid, -- Reference to profiles(id) added later via alter to avoid circular dependency
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CATEGORIES
create table categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    custom_fields jsonb default '[]'::jsonb, -- custom schema structures if needed
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROFILES (Extends Supabase auth.users)
create table profiles (
    id uuid primary key, -- Must match auth.users.id
    name text not null,
    email text not null unique,
    role text not null default 'employee' check (role in ('employee', 'department_head', 'asset_manager', 'admin')),
    department_id uuid references departments(id) on delete set null,
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fix circular reference on departments
alter table departments add constraint fk_department_head foreign key (department_head_id) references profiles(id) on delete set null;

-- 4. ASSETS (The resources themselves are also here with is_bookable = true)
create table assets (
    id uuid default gen_random_uuid() primary key,
    tag text not null unique, -- Auto-generated via trigger (AF-0001, etc.)
    name text not null,
    serial_number text,
    category_id uuid references categories(id) on delete restrict,
    department_id uuid references departments(id) on delete set null,
    status text not null default 'available' check (status in ('available', 'allocated', 'under_maintenance', 'lost', 'retired', 'disposed')),
    is_bookable boolean not null default false,
    image_url text,
    condition text not null default 'Good' check (condition in ('Excellent', 'Good', 'Fair', 'Poor', 'Damaged')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sequence and trigger to auto-generate asset tags (e.g. AF-0001, AF-0002, ...)
create sequence asset_tag_seq start 1;

create or replace function tg_assign_asset_tag()
returns trigger as $$
begin
    if new.tag is null or new.tag = '' then
        new.tag := 'AF-' || lpad(nextval('asset_tag_seq')::text, 4, '0');
    end if;
    return new;
end;
$$ language plpgsql;

create trigger tr_assign_asset_tag
before insert on assets
for each row execute function tg_assign_asset_tag();

-- 5. ALLOCATIONS (Active and historical)
create table allocations (
    id uuid default gen_random_uuid() primary key,
    asset_id uuid not null references assets(id) on delete cascade,
    profile_id uuid not null references profiles(id) on delete restrict,
    status text not null default 'active' check (status in ('active', 'returned', 'overdue')),
    allocated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expected_return_at timestamp with time zone,
    returned_at timestamp with time zone,
    condition_returned text check (condition_returned in ('Excellent', 'Good', 'Fair', 'Poor', 'Damaged')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Partial unique index to enforce "One active allocation per asset at a time"
create unique index idx_assets_single_active_allocation 
on allocations (asset_id) 
where (status = 'active');

-- 6. TRANSFER REQUESTS (Ownership change requests)
create table transfer_requests (
    id uuid default gen_random_uuid() primary key,
    asset_id uuid not null references assets(id) on delete cascade,
    from_profile_id uuid not null references profiles(id) on delete restrict,
    to_profile_id uuid not null references profiles(id) on delete restrict,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
    approved_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. BOOKINGS (For bookable assets/resources)
create table bookings (
    id uuid default gen_random_uuid() primary key,
    resource_asset_id uuid not null references assets(id) on delete cascade,
    booker_profile_id uuid not null references profiles(id) on delete restrict,
    status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    purpose text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint chk_booking_times check (start_time < end_time)
);

-- 8. MAINTENANCE REQUESTS
create table maintenance_requests (
    id uuid default gen_random_uuid() primary key,
    asset_id uuid not null references assets(id) on delete cascade,
    requester_profile_id uuid not null references profiles(id) on delete restrict,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'assigned', 'in_progress', 'resolved')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
    technician_assigned_id uuid references profiles(id) on delete set null,
    details text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone
);

-- 9. AUDIT CYCLES
create table audit_cycles (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    closed_at timestamp with time zone
);

-- 10. AUDIT AUDITORS
create table audit_auditors (
    id uuid default gen_random_uuid() primary key,
    audit_cycle_id uuid not null references audit_cycles(id) on delete cascade,
    auditor_profile_id uuid not null references profiles(id) on delete cascade,
    unique (audit_cycle_id, auditor_profile_id)
);

-- 11. AUDIT ITEMS (Checked assets during an audit)
create table audit_items (
    id uuid default gen_random_uuid() primary key,
    audit_cycle_id uuid not null references audit_cycles(id) on delete cascade,
    asset_id uuid not null references assets(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'verified', 'missing', 'damaged')),
    notes text,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    unique (audit_cycle_id, asset_id)
);

-- 12. NOTIFICATIONS
create table notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references profiles(id) on delete cascade,
    type text not null, -- e.g. 'transfer_request', 'maintenance', 'booking', 'overdue'
    message text not null,
    related_entity_type text,
    related_entity_id uuid,
    is_read boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. ACTIVITY LOGS (Immutable audit trail)
create table activity_logs (
    id uuid default gen_random_uuid() primary key,
    actor_id uuid references profiles(id) on delete set null,
    action text not null, -- e.g. 'asset_allocated', 'transfer_approved', etc.
    entity_type text not null, -- e.g. 'asset', 'booking', 'transfer_request'
    entity_id uuid,
    details jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) is disabled by default for hackathon setup speed.
-- However, structure is ready for RLS policies to be added.
alter table departments enable row level security;
alter table categories enable row level security;
alter table profiles enable row level security;
alter table assets enable row level security;
alter table allocations enable row level security;
alter table transfer_requests enable row level security;
alter table bookings enable row level security;
alter table maintenance_requests enable row level security;
alter table audit_cycles enable row level security;
alter table audit_auditors enable row level security;
alter table audit_items enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- Open policies for hackathon simplicity
create policy "Allow public read-write for departments" on departments for all using (true) with check (true);
create policy "Allow public read-write for categories" on categories for all using (true) with check (true);
create policy "Allow public read-write for profiles" on profiles for all using (true) with check (true);
create policy "Allow public read-write for assets" on assets for all using (true) with check (true);
create policy "Allow public read-write for allocations" on allocations for all using (true) with check (true);
create policy "Allow public read-write for transfer_requests" on transfer_requests for all using (true) with check (true);
create policy "Allow public read-write for bookings" on bookings for all using (true) with check (true);
create policy "Allow public read-write for maintenance_requests" on maintenance_requests for all using (true) with check (true);
create policy "Allow public read-write for audit_cycles" on audit_cycles for all using (true) with check (true);
create policy "Allow public read-write for audit_auditors" on audit_auditors for all using (true) with check (true);
create policy "Allow public read-write for audit_items" on audit_items for all using (true) with check (true);
create policy "Allow public read-write for notifications" on notifications for all using (true) with check (true);
create policy "Allow public read-write for activity_logs" on activity_logs for all using (true) with check (true);
