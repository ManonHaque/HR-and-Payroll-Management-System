# Database Design & Entity Relationship Diagrams

This document outlines the database schema for the HR & Payroll System. The system contains over 30 tables, which are logically grouped by module below.

## 1. Organization & Security Module
This module handles company settings, branches, departments, designations, roles, permissions, and user access.

```mermaid
erDiagram
    CompanySetting {
        int id PK
        string name
        string address
        int payroll_cycle_date
        string emp_id_prefix
        int next_emp_id
    }
    Branch ||--o{ Employee : "has"
    Branch {
        int id PK
        string name
        string location
    }
    Department ||--o{ Designation : "contains"
    Department {
        int id PK
        string name
    }
    Designation {
        int id PK
        int department_id FK
        string name
    }
    Grade {
        int id PK
        string name
        decimal min_salary
        decimal max_salary
    }
    Role ||--o{ Permission : "has"
    Role ||--o{ User : "assigned_to"
    Role {
        int id PK
        string name
    }
    Permission {
        int id PK
        int role_id FK
        string module
        string action
    }
    User ||--o{ AuditLog : "generates"
    User {
        int id PK
        string username
        int role_id FK
    }
    AuditLog {
        int id PK
        int user_id FK
        string action
        string table_name
    }
```

## 2. Employee Module
This module is the core of the workforce data, linking users to their employment records, emergency contacts, and documents.

```mermaid
erDiagram
    User ||--o| Employee : "is_a"
    Employee ||--o{ EmergencyContact : "has"
    Employee ||--o{ EmployeeDocument : "has"
    Employee ||--o{ Employee : "manages"
    DocumentTypeConfig ||--o{ EmployeeDocument : "defines"
    
    Employee {
        int id PK
        int user_id FK
        string emp_id
        string first_name
        string last_name
        date joining_date
        int department_id FK
        int designation_id FK
        int grade_id FK
        int manager_id FK
    }
    EmergencyContact {
        int id PK
        int employee_id FK
        string name
        string phone
    }
    DocumentTypeConfig {
        int id PK
        string name
        boolean is_mandatory
    }
    EmployeeDocument {
        int id PK
        int employee_id FK
        int document_type_id FK
        string file_path
    }
```

## 3. Attendance & Leave Module
Tracks daily check-ins, holiday calendars, overtime, and leave balances/requests.

```mermaid
erDiagram
    Employee ||--o{ Attendance : "logs"
    Employee ||--o{ LeaveBalance : "has"
    Employee ||--o{ LeaveRequest : "requests"
    Attendance ||--o{ AttendanceCorrection : "has"
    
    HolidayCalendar {
        int id PK
        date date
        string name
    }
    Attendance {
        int id PK
        int employee_id FK
        date date
        datetime check_in
        datetime check_out
        enum status
    }
    AttendanceCorrection {
        int id PK
        int attendance_id FK
        string reason
    }
    LeaveType ||--o{ LeaveBalance : "defines"
    LeaveType ||--o{ LeaveRequest : "used_for"
    LeaveType {
        int id PK
        string name
        int max_entitlement
    }
    LeaveBalance {
        int id PK
        int employee_id FK
        int leave_type_id FK
        decimal balance
    }
    LeaveRequest {
        int id PK
        int employee_id FK
        int leave_type_id FK
        date start_date
        date end_date
        enum status
    }
```

## 4. Compensation, Loans & Payroll Module
Handles allowances, deductions, taxes, loans, bonuses, and the final monthly payroll runs.

```mermaid
erDiagram
    Employee ||--o{ Payslip : "receives"
    Employee ||--o{ LoanRequest : "requests"
    Employee ||--o{ EmployeeAllowance : "earns"
    Employee ||--o{ EmployeeDeduction : "pays"
    
    PayrollRun ||--o{ Payslip : "generates"
    PayrollRun {
        int id PK
        int cycle_month
        int cycle_year
        enum status
    }
    Payslip {
        int id PK
        int payroll_run_id FK
        int employee_id FK
        decimal net_salary
    }
    LoanType ||--o{ LoanRequest : "defines"
    LoanRequest ||--o{ LoanRepayment : "has"
    LoanRequest {
        int id PK
        int employee_id FK
        int loan_type_id FK
        decimal requested_amount
    }
    LoanRepayment {
        int id PK
        int loan_request_id FK
        int payroll_run_id FK
        decimal amount_paid
    }
    AllowanceType ||--o{ EmployeeAllowance : "defines"
    DeductionType ||--o{ EmployeeDeduction : "defines"
    
    TaxSlab {
        int id PK
        decimal min_income
        decimal max_income
        decimal tax_percentage
    }
    BonusRun {
        int id PK
        date run_date
        decimal total_amount
    }
```

