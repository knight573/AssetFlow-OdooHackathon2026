...

## Overview

**AssetFlow** is a modern Enterprise Asset & Resource Management System (ERP) that enables organizations to efficiently manage physical assets throughout their entire lifecycle.

The platform replaces spreadsheets and manual record-keeping with a secure, scalable, and centralized solution that provides complete visibility into asset ownership, availability, maintenance, transfers, bookings, audits, and organizational operations.

Whether used by educational institutions, hospitals, enterprises, manufacturing companies, or government organizations, AssetFlow streamlines asset management while improving operational efficiency and accountability.

---

## Key Features

### Authentication & Authorization

- Secure Email & Password Authentication
- Employee Registration
- Password Recovery
- Session Management
- Role-Based Access Control (RBAC)
- Admin-controlled Role Assignment

---

### Dashboard

- Real-time KPI Dashboard
- Asset Availability Overview
- Active Asset Allocations
- Maintenance Status
- Booking Statistics
- Pending Transfers
- Upcoming & Overdue Returns
- Quick Action Shortcuts

---

### Organization Management

#### Departments

- Create, Update & Deactivate Departments
- Parent-Child Department Hierarchy
- Assign Department Heads

#### Asset Categories

- Category Management
- Custom Fields per Category
- Active / Inactive Status

#### Employee Directory

- Employee Management
- Department Assignment
- Role Promotion
- Employee Status Tracking

---

### Asset Management

- Asset Registration
- Auto-generated Asset Tags
- QR Code Support
- Serial Number Tracking
- Asset Images & Documents
- Lifecycle Tracking
- Asset History
- Advanced Search & Filtering

---

### Asset Allocation

- Allocate Assets
- Department Allocation
- Expected Return Date
- Asset Return Workflow
- Condition Verification
- Overdue Detection

---

### Asset Transfers

- Transfer Request Workflow
- Approval System
- Asset Ownership Transfer
- Transfer History

---

### Resource Booking

- Calendar-based Booking
- Shared Resource Reservation
- Time Slot Scheduling
- Booking Conflict Detection
- Reschedule & Cancellation
- Reminder Notifications

---

### Maintenance Management

- Maintenance Request Portal
- Priority Levels
- Approval Workflow
- Technician Assignment
- Repair Tracking
- Maintenance History
- Automatic Asset Status Updates

---

### Asset Audits

- Audit Cycle Management
- Auditor Assignment
- Asset Verification
- Missing & Damaged Asset Reporting
- Discrepancy Reports
- Audit History

---

### Reports & Analytics

- Asset Utilization Reports
- Maintenance Analytics
- Department-wise Allocation Reports
- Booking Analytics
- Asset Retirement Reports
- Exportable Reports

---

### Notifications & Activity Logs

- Real-time Notifications
- Transfer Alerts
- Maintenance Updates
- Booking Notifications
- Overdue Return Alerts
- Complete Audit Trail
- Activity Logs

---

# Asset Lifecycle

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

# User Roles

| Role | Responsibilities |
|------|------------------|
| **Admin** | Manage departments, employees, categories, reports, and audit cycles |
| **Asset Manager** | Register assets, allocate assets, approve transfers, maintenance, and returns |
| **Department Head** | View department assets, approve allocation requests, approve transfers |
| **Employee** | View assigned assets, request transfers, raise maintenance requests, book resources |

---

# System Workflow

```text
Admin
   │
   ▼
Create Departments & Categories
   │
   ▼
Employees Register
   │
   ▼
Admin Assigns Roles
   │
   ▼
Asset Manager Registers Assets
   │
   ▼
Assets Become Available
   │
   ▼
Allocate Assets / Book Resources
   │
   ▼
Maintenance / Transfers / Returns
   │
   ▼
Periodic Asset Audits
   │
   ▼
Reports, Notifications & Analytics
```

---

# ERP Modules

- Authentication
- Dashboard
- Organization Management
- Employee Directory
- Asset Management
- Asset Allocation
- Asset Transfers
- Resource Booking
- Maintenance Management
- Asset Audits
- Reports & Analytics
- Notifications
- Activity Logs

---

# Business Rules

- Only **Admins** can assign or modify user roles.
- Assets cannot be allocated to multiple users simultaneously.
- Transfer requests require approval before execution.
- Resource bookings cannot overlap.
- Maintenance work begins only after approval.
- Audit cycles automatically generate discrepancy reports.
- Overdue asset returns are detected automatically.
- Every critical system event is recorded in activity logs.

---

# Project Objectives

- Digitize enterprise asset management.
- Improve asset visibility across the organization.
- Reduce manual tracking errors.
- Simplify maintenance workflows.
- Enable conflict-free resource booking.
- Support structured audit processes.
- Deliver actionable business insights.
- Provide a scalable ERP architecture.

---

# Future Enhancements

- QR Code Scanner
- Barcode Integration
- Mobile Application
- Email & SMS Notifications
- Predictive Maintenance
- AI-powered Asset Analytics
- Multi-Organization Support
- Cloud Deployment

---

# Why AssetFlow?

- Centralized enterprise asset management
- Secure role-based architecture
- Complete asset lifecycle tracking
- Automated workflows and approvals
- Comprehensive reporting & analytics
- Scalable and maintainable ERP design
- Suitable for organizations of any size

---

## Local Setup & Test Credentials

To preview and test the AssetFlow system, run the development server locally:
```bash
npm run dev
```

### Preseeded Sandbox Accounts

The local database is seeded with 9 default user accounts representing various organizational roles. The access password has been configured as follows:
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


---

### Contributors

Developed and maintained by **Yash Raj**.
