-- HR & Payroll Management System - MySQL Schema
-- Generated based on PRD version 1.3

CREATE DATABASE IF NOT EXISTS hr_payroll_db;
USE hr_payroll_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. System Settings & Organisation
-- ==========================================

CREATE TABLE IF NOT EXISTS CompanySetting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    address TEXT,
    registration_number VARCHAR(100),
    payroll_cycle_date INT DEFAULT 1, -- Day of the month
    emp_id_prefix VARCHAR(10) DEFAULT 'EMP-',
    next_emp_id INT DEFAULT 1001,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FinancialYear (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS NotificationSetting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_type VARCHAR(100) NOT NULL,
    is_email_enabled BOOLEAN DEFAULT TRUE,
    is_in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Branch (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Designation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Department(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Grade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_salary DECIMAL(10, 2),
    max_salary DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Access Control (Security)
-- ==========================================

CREATE TABLE IF NOT EXISTS Role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Admin, HR, Manager, Employee, Accounts
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- view, add, edit, delete, approve
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Role(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Role(id)
);

CREATE TABLE IF NOT EXISTS AuditLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE SET NULL
);

-- ==========================================
-- 3. Employee Module
-- ==========================================

CREATE TABLE IF NOT EXISTS Employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    emp_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    joining_date DATE NOT NULL,
    separation_date DATE NULL,
    status ENUM('Active', 'On-Leave', 'Separated') DEFAULT 'Active',
    department_id INT,
    designation_id INT,
    grade_id INT,
    branch_id INT,
    manager_id INT,
    bank_account_no VARCHAR(100),
    bank_name VARCHAR(100),
    basic_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES Department(id) ON DELETE SET NULL,
    FOREIGN KEY (designation_id) REFERENCES Designation(id) ON DELETE SET NULL,
    FOREIGN KEY (grade_id) REFERENCES Grade(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES Branch(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES Employee(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS EmergencyContact (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS DocumentTypeConfig (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EmployeeDocument (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    document_type_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (document_type_id) REFERENCES DocumentTypeConfig(id) ON DELETE RESTRICT
);

-- ==========================================
-- 4. Attendance & Overtime Module
-- ==========================================

CREATE TABLE IF NOT EXISTS HolidayCalendar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type ENUM('Public', 'Company') DEFAULT 'Company',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    status ENUM('Present', 'Late', 'Half-Day', 'Absent', 'On-Leave', 'Holiday') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_date (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AttendanceCorrection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    previous_check_in DATETIME NULL,
    previous_check_out DATETIME NULL,
    previous_status VARCHAR(50),
    reason TEXT,
    corrected_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES Attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (corrected_by) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS AttendanceRegularizationRequest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    requested_status ENUM('Present', 'Late', 'Half-Day') NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES Employee(id)
);

CREATE TABLE IF NOT EXISTS OvertimeRequest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES Employee(id)
);

-- ==========================================
-- 5. Leave Management
-- ==========================================

CREATE TABLE IF NOT EXISTS LeaveType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Casual, Sick, Earned, Unpaid, Maternity
    is_paid BOOLEAN DEFAULT TRUE,
    max_entitlement INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS LeaveBalance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year INT NOT NULL,
    balance DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_emp_leave_year (employee_id, leave_type_id, year),
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES LeaveType(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS LeaveRequest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5, 2) NOT NULL,
    reason TEXT,
    status ENUM('Pending Manager', 'Pending HR', 'Approved', 'Rejected') DEFAULT 'Pending Manager',
    manager_id INT,
    hr_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES LeaveType(id),
    FOREIGN KEY (manager_id) REFERENCES Employee(id),
    FOREIGN KEY (hr_id) REFERENCES User(id)
);

-- ==========================================
-- 6. Compensation Setup (Allowances, Deductions)
-- ==========================================

CREATE TABLE IF NOT EXISTS SalaryStructureTemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id INT NOT NULL,
    basic_percentage DECIMAL(5, 2) NOT NULL,
    hra_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES Grade(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AllowanceType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_taxable BOOLEAN DEFAULT TRUE,
    calculation_type ENUM('Fixed', 'Percentage') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EmployeeAllowance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    allowance_type_id INT NOT NULL,
    value DECIMAL(10, 2), -- Overrides type value if needed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (allowance_type_id) REFERENCES AllowanceType(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS DeductionType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_statutory BOOLEAN DEFAULT FALSE,
    calculation_type ENUM('Fixed', 'Percentage') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EmployeeDeduction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    deduction_type_id INT NOT NULL,
    value DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (deduction_type_id) REFERENCES DeductionType(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS TaxSlab (
    id INT AUTO_INCREMENT PRIMARY KEY,
    financial_year_id INT NOT NULL,
    min_income DECIMAL(12, 2) NOT NULL,
    max_income DECIMAL(12, 2) NULL, -- NULL implies no upper limit
    tax_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (financial_year_id) REFERENCES FinancialYear(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS IncrementPolicy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('Fixed', 'Percentage') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    eligibility_criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Increment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    previous_salary DECIMAL(10, 2) NOT NULL,
    revised_salary DECIMAL(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES User(id)
);

-- ==========================================
-- 7. Loan & Bonus Management
-- ==========================================

CREATE TABLE IF NOT EXISTS LoanType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    max_amount DECIMAL(10, 2) NOT NULL,
    max_tenure INT NOT NULL, -- in months
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS LoanRequest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    loan_type_id INT NOT NULL,
    requested_amount DECIMAL(10, 2) NOT NULL,
    emi_amount DECIMAL(10, 2) NOT NULL,
    tenure_months INT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_type_id) REFERENCES LoanType(id),
    FOREIGN KEY (approved_by) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS BonusType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    calculation_type ENUM('Fixed', 'Percentage') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS BonusRun (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bonus_type_id INT NOT NULL,
    run_date DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status ENUM('Draft', 'Approved', 'Processed') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bonus_type_id) REFERENCES BonusType(id)
);

CREATE TABLE IF NOT EXISTS EmployeeBonus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bonus_run_id INT NOT NULL,
    employee_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bonus_run_id) REFERENCES BonusRun(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE
);

-- ==========================================
-- 8. Payroll Management
-- ==========================================

CREATE TABLE IF NOT EXISTS PayrollRun (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_month INT NOT NULL,
    cycle_year INT NOT NULL,
    generated_date DATE NOT NULL,
    status ENUM('Draft', 'Approved', 'Locked') DEFAULT 'Draft',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_by) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS Payslip (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id INT NOT NULL,
    employee_id INT NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL,
    total_allowances DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bonus_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    overtime_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_deducted DECIMAL(10, 2) NOT NULL DEFAULT 0,
    loan_emi DECIMAL(10, 2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES PayrollRun(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS LoanRepayment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_request_id INT NOT NULL,
    payroll_run_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    status ENUM('Paid', 'Pending') DEFAULT 'Paid',
    FOREIGN KEY (loan_request_id) REFERENCES LoanRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (payroll_run_id) REFERENCES PayrollRun(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

