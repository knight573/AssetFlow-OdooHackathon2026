# AssetFlow

**Enterprise Asset & Resource Management System**

## Overview

**AssetFlow** is a modern Enterprise Asset & Resource Management System (ERP) that enables organizations to efficiently manage physical assets throughout their entire lifecycle.

The platform replaces spreadsheets and manual record-keeping with a secure, scalable, and centralized solution that provides complete visibility into asset ownership, availability, maintenance, transfers, bookings, audits, and organizational operations.

Whether used by educational institutions, hospitals, enterprises, manufacturing companies, or government organizations, AssetFlow streamlines asset management while improving operational efficiency and accountability.

---

## Screens & Navigation

The app is organized into two sidebar groups:

**Core**
- **Command Dashboard** — organization-wide resource deployment stats (Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns) plus quick actions and the recent activity feed
- **Organization Setup** — departments, asset categories, and employee directory
- **Asset Directory** — register and search assets
- **Allocations & Transfers** — two tabs: *Allocate & Return Hub* (assign assets, process returns with condition check-in) and *Transfer Approvals* (review pending transfer requests)
- **Resource Booking** — schedule planner + booking log for shared resources like conference rooms
- **Repair Kanban Board** — maintenance request workflow (Pending → Approved → Technician Assigned → In Progress → Resolved)

**Governance & Insights**
- **Asset Audits** — audit cycles, auditor assignment, discrepancy reports
- **Reports & Analytics** — utilization, maintenance frequency, department-wise summaries
- **Activity Logs** — full audit trail of who did what, when

A floating **Action Simulator** panel is available for demo/testing purposes — it lets you trigger allocations, bookings, maintenance actions, and role promotions directly, without going through each form. *(Intended as a dev/demo aid — see note in Known Issues below.)*

---

## Authentication

The **AssetFlow Portal** login screen supports:
- Corporate email + password sign-in
- "Forgot Email ID?" and "Forgot Password?" recovery links
- **New employee?** → Create Account (signup always creates an Employee-role account only; no role picker at signup, per the platform's security model)
- **Admin Directory Console** link for administrator sign-in
- A **Demo Presentation Quick Login** panel with one-tap buttons for Admin, Asset Mgr, Dept Head, and Employee — for fast role-switching during demos (see [Preseeded Sandbox Accounts](#preseeded-sandbox-accounts) below for the underlying credentials)

---

## Key Features

### Authentication & Authorization
- Corporate email & password login with Forgot Email ID / Forgot Password recovery
- Employee self-registration (Create Account) — employee role only, no self-elevation
- Admin Directory Console for administrator access
- Demo quick-login for fast role switching during presentations
- Role-Based Access Control (RBAC)
- Admin-controlled role promotion (Department Head / Asset Manager assigned only from the Employee Directory)

---

### Command Dashboard
- Real-time KPI cards: Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns
- Organization-wide recent activity log
- Quick actions: Register New Asset, Book Shared Resource, Raise Maintenance Request

---

### Organization Setup
#### Departments
- Create, update & deactivate departments
- Parent-child department hierarchy
- Assign department heads

#### Asset Categories
- Category management
- Custom fields per category
- Active / inactive status

#### Employee Directory
- Employee management
- Department assignment
- Role promotion (the only place roles are assigned)
- Employee status tracking

---

### Asset Directory
- Asset registration with auto-generated Asset Tags
- QR code support
- Serial number tracking
- Asset images & documents
- Lifecycle tracking
- Asset history
- Advanced search & filtering

---

### Allocations & Transfers
**Allocate & Return Hub**
- Allocate an asset to an Employee or a Department
- Expected return date
- Equipment Return Portal — deallocate active assets, capture returned physical condition and condition notes
- Overdue detection

**Transfer Approvals**
- Transfer request workflow with approval
- Blocks double-allocation — if an asset is already held, the system offers a transfer request instead
- Transfer history

---

### Resource Booking
- Schedule Planner: visual timeline per resource, by date
- Booking conflict detection (no overlapping reservations)
- Booking Log with reservation details and cancel option
- Reschedule & cancellation
- Reminder notifications

---

### Repair Kanban Board
- Maintenance request portal with priority levels
- Kanban workflow: Pending → Approved/Rejected → Technician Assigned → In Progress → Resolved
- Automatic asset status updates (flips to Under Maintenance on approval, back to Available on resolution)
- Maintenance history per asset

---

### Asset Audits
- Audit cycle management
- Auditor assignment
- Asset verification (Verified / Missing / Damaged)
- Auto-generated discrepancy reports
- Closing a cycle locks it and flips confirmed-missing assets to Lost
- Audit history

---

### Reports & Analytics
- Asset utilization reports
- Maintenance frequency analytics
- Department-wise allocation reports
- Booking analytics
- Assets nearing retirement
- Exportable reports

---

### Activity Logs & Notifications
- Real-time notifications
- Transfer, maintenance, booking, and overdue-return alerts
- Complete, immutable audit trail

---

## Asset Lifecycle

```text
                     Available
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
 Allocated           Reserved       Under Maintenance
      │                                   │
      │                                   ▼
      ├──────────────► Available ◄─────────┘
      │
      ▼
Transfer Requested
      │
      ▼
Approved Transfer

Additional States
────────────────────────
• Lost
• Retired
• Disposed
```

---

## User Roles

| Role | Responsibilities |
|------|------------------|
| **Admin** | Manage departments, employees, categories, reports, and audit cycles |
| **Asset Manager** | Register assets, allocate assets, approve transfers, maintenance, and returns |
| **Department Head** | View department assets, approve allocation requests, approve transfers |
| **Employee** | View assigned assets, request transfers, raise maintenance requests, book resources |

---

## System Workflow

```text
Admin
   │
   ▼
Create Departments & Categories (Organization Setup)
   │
   ▼
Employees Register (Create Account)
   │
   ▼
Admin Assigns Roles (Employee Directory)
   │
   ▼
Asset Manager Registers Assets (Asset Directory)
   │
   ▼
Assets Become Available
   │
   ▼
Allocate Assets (Allocations & Transfers) / Book Resources (Resource Booking)
   │
   ▼
Maintenance (Repair Kanban Board) / Transfers / Returns
   │
   ▼
Periodic Asset Audits
   │
   ▼
Reports, Notifications & Activity Logs
```

---

## ERP Modules

- Authentication (Login / Signup / Admin Console)
- Command Dashboard
- Organization Setup
- Employee Directory
- Asset Directory
- Allocations & Transfers
- Resource Booking
- Repair Kanban Board
- Asset Audits
- Reports & Analytics
- Activity Logs & Notifications
- Action Simulator (demo/testing utility)

---

## Business Rules

- Only **Admins** can assign or modify user roles.
- Signup always creates an Employee account — no role is ever self-assigned.
- Assets cannot be allocated to multiple users simultaneously.
- Transfer requests require approval before execution.
- Resource bookings cannot overlap.
- Maintenance work begins only after approval.
- Audit cycles automatically generate discrepancy reports.
- Overdue asset returns are detected automatically.
- Every critical system event is recorded in activity logs.

---

## Local Setup & Test Credentials

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

### Preseeded Sandbox Accounts

The local database is seeded with 9 default user accounts representing various organizational roles.

- **Admin Account**: `admin123`
- **Employee & Manager Accounts**: `employee123`

| Name | Role | Email | Password |
|------|------|-------|----------|
| **Aadarsh Nath** | Admin | `aadarsh@company.com` | `admin123` |
| **Yash Raj** | Admin | `yash@company.com` | `admin123` |
| **Fahad Hassan** | Admin | `fahad@company.com` | `admin123` |
| **Mrinal Kishor** | Admin | `mrinal@company.com` | `admin123` |
| **Sarah Jenkins** | Asset Manager | `sarah@company.com` | `employee123` |
| **Amit Kumar** | Department Head | `amit@company.com` | `employee123` |
| **Ravi Kumar** | Employee | `kravi1610@gmail.com` | `employee123` |
| **Rahul Verma** | Employee | `rahul@company.com` | `employee123` |
| **Deepa Patel** | Employee | `deepa@company.com` | `employee123` |

Or skip typing credentials entirely — use the **Demo Presentation Quick Login** buttons (Admin / Asset Mgr / Dept Head / Employee) on the login screen.

---

## Known Issues / Roadmap

- The **Action Simulator** and any in-app role switcher are intended as demo/testing conveniences — before a production deployment, these should be restricted to development builds only, since they currently allow bypassing the normal admin-only role-promotion flow.
- Row Level Security (RLS) policies in `schema.sql` are currently open (`for all using (true)`) for hackathon setup speed — tighten before real deployment.

---

## Project Objectives

- Digitize enterprise asset management.
- Improve asset visibility across the organization.
- Reduce manual tracking errors.
- Simplify maintenance workflows.
- Enable conflict-free resource booking.
- Support structured audit processes.
- Deliver actionable business insights.
- Provide a scalable ERP architecture.

---

## Future Enhancements

- QR Code Scanner
- Barcode Integration
- Mobile Application
- Email & SMS Notifications
- Predictive Maintenance
- AI-powered Asset Analytics
- Multi-Organization Support
- Cloud Deployment

---

## Why AssetFlow?

- Centralized enterprise asset management
- Secure role-based architecture
- Complete asset lifecycle tracking
- Automated workflows and approvals
- Comprehensive reporting & analytics
- Scalable and maintainable ERP design
- Suitable for organizations of any size

---

## Contributors

Developed and maintained by:
- **Yash Raj**
- **Fahad Hassan**
- **Aadarsh Nath**
- **Mirnal Kishor**

> "Innovation is the calling card of the future, and collaboration is the key that unlocks it." — Unknown
