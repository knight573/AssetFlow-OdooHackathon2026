# AssetFlow – Enterprise Asset & Resource Management System

## Overview

**AssetFlow** is a modern Enterprise Asset & Resource Management System (ERP) designed to help organizations efficiently manage physical assets, shared resources, maintenance workflows, audits, and asset allocation through a centralized platform.

The system replaces spreadsheets and manual record-keeping with a secure, role-based application that provides complete visibility into asset ownership, availability, lifecycle, and operational activities.

---

## Features

### Authentication & Role Management

* Secure Email & Password Authentication
* Employee Signup
* Forgot Password
* Session Management
* Admin-controlled Role Assignment
* Role-Based Access Control (RBAC)

### Dashboard

* Real-time KPI Cards
* Asset Availability Overview
* Active Allocations
* Maintenance Status
* Booking Statistics
* Pending Transfers
* Upcoming & Overdue Returns
* Quick Action Shortcuts

### Organization Setup

#### Department Management

* Create, Edit & Deactivate Departments
* Parent Department Hierarchy
* Assign Department Heads

#### Asset Category Management

* Create Asset Categories
* Category-specific Custom Fields
* Active/Inactive Status

#### Employee Directory

* Employee Management
* Department Assignment
* Role Promotion
* Employee Status Tracking

### Asset Registration & Directory

* Asset Registration
* Auto-generated Asset Tags
* Serial Number Tracking
* QR Code Support
* Asset Images & Documents
* Lifecycle Tracking
* Search & Filtering
* Asset History

### Asset Allocation & Transfer

* Allocate Assets
* Department Allocation
* Expected Return Date
* Conflict Detection
* Transfer Approval Workflow
* Asset Return Management
* Condition Check-in
* Overdue Return Detection

### Resource Booking

* Calendar-based Booking
* Shared Resource Management
* Time Slot Reservation
* Booking Conflict Validation
* Reschedule & Cancellation
* Reminder Notifications

### Maintenance Management

* Raise Maintenance Requests
* Priority Levels
* Approval Workflow
* Technician Assignment
* Repair Tracking
* Maintenance History
* Automatic Asset Status Updates

### Asset Audit

* Audit Cycle Creation
* Auditor Assignment
* Asset Verification
* Missing & Damaged Asset Reporting
* Auto-generated Discrepancy Reports
* Audit History

### Reports & Analytics

* Asset Utilization Reports
* Maintenance Analytics
* Department-wise Allocation Reports
* Booking Heatmaps
* Asset Retirement Tracking
* Exportable Reports

### Activity Logs & Notifications

* Real-time Notifications
* Overdue Alerts
* Transfer Notifications
* Maintenance Updates
* Booking Notifications
* Complete Activity Logs
* Audit Trail

---

# Asset Lifecycle

Assets move through the following lifecycle:

```
Available
    │
    ├──► Allocated
    │         │
    │         ├──► Available
    │         └──► Transfer Requested
    │
    ├──► Reserved
    │
    ├──► Under Maintenance
    │         │
    │         └──► Available
    │
    ├──► Lost
    ├──► Retired
    └──► Disposed
```

---

# User Roles

## Admin

* Manage Departments
* Manage Asset Categories
* Manage Employees
* Promote Employees to Asset Managers or Department Heads
* Create Audit Cycles
* View Organization-wide Reports

## Asset Manager

* Register Assets
* Allocate Assets
* Approve Transfers
* Approve Maintenance Requests
* Approve Asset Returns
* Resolve Audit Discrepancies

## Department Head

* View Department Assets
* Approve Allocation Requests
* Approve Transfers
* Book Shared Resources

## Employee

* View Assigned Assets
* Book Resources
* Raise Maintenance Requests
* Initiate Returns
* Request Asset Transfers

---

# Basic Workflow

1. Admin creates departments, categories, and employees.
2. Employees register and receive the default Employee role.
3. Admin promotes selected employees to Department Head or Asset Manager.
4. Asset Manager registers new assets.
5. Assets become **Available**.
6. Assets are allocated to employees or departments.
7. Shared resources can be booked without overlapping schedules.
8. Maintenance requests follow an approval workflow.
9. Assets are returned or transferred.
10. Periodic audit cycles verify asset inventory.
11. Reports, logs, and notifications provide operational visibility.

---

# ERP Modules

* Authentication
* Dashboard
* Organization Setup
* Employee Directory
* Asset Management
* Asset Allocation
* Asset Transfers
* Resource Booking
* Maintenance Management
* Asset Audits
* Reports & Analytics
* Notifications
* Activity Logs

---

# Key Business Rules

* Employees cannot assign themselves elevated roles.
* Only Admin can promote users.
* Assets cannot be allocated twice.
* Transfer requests require approval.
* Resource bookings cannot overlap.
* Maintenance requires approval before work begins.
* Audit cycles generate discrepancy reports automatically.
* Overdue returns are detected automatically.
* Every important action is logged.

---

# Project Objectives

* Digitize enterprise asset management.
* Reduce manual tracking errors.
* Improve asset visibility.
* Simplify maintenance workflows.
* Enable conflict-free resource booking.
* Support structured audits.
* Provide actionable analytics.
* Deliver a scalable ERP architecture.

---

# Future Enhancements

* QR Code Scanner
* Barcode Integration
* Mobile Application
* Email & SMS Notifications
* Predictive Maintenance
* AI-powered Asset Utilization Analytics
* Multi-Organization Support
* Cloud Deployment

---

