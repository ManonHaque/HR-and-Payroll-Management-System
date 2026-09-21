CREATE DATABASE HR_Payroll_DB;
GO

USE HR_Payroll_DB;
GO

-- 1. Base Core Placeholders (Skip if already created by your teammates)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User')
CREATE TABLE [User] (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employee')
CREATE TABLE Employee (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    BiometricID VARCHAR(50) UNIQUE
);

-- 2. Leave Core
CREATE TABLE LeaveType (
    LeaveTypeID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    IsPaid BIT NOT NULL DEFAULT 1,
    AnnualMax INT NOT NULL
);

CREATE TABLE LeaveBalance (
    LeaveBalanceID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    Year INT NOT NULL,
    AllocatedDays INT NOT NULL,
    UsedDays INT DEFAULT 0,
    RemainingDays AS (AllocatedDays - UsedDays),
    CONSTRAINT UQ_Emp_Leave_Year UNIQUE (EmployeeID, LeaveTypeID, Year),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (LeaveTypeID) REFERENCES LeaveType(LeaveTypeID)
);

CREATE TABLE LeaveRequest (
    LeaveRequestID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    DaysRequested INT NOT NULL,
    Reason VARCHAR(MAX),
    Status VARCHAR(30) DEFAULT 'Pending Manager Review' 
        CHECK (Status IN ('Pending Manager Review', 'Pending HR Review', 'Approved', 'Rejected')),
    ManagerApprovedBy INT NULL,
    ManagerApprovedDate DATETIME NULL,
    HRApprovedBy INT NULL,
    HRApprovedDate DATETIME NULL,
    RejectionReason VARCHAR(MAX),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (LeaveTypeID) REFERENCES LeaveType(LeaveTypeID),
    FOREIGN KEY (ManagerApprovedBy) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (HRApprovedBy) REFERENCES [User](UserID)
);

-- 3. Attendance Core
CREATE TABLE Attendance (
    AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    Date DATE NOT NULL,
    CheckInTime TIME NULL,
    CheckOutTime TIME NULL,
    Status VARCHAR(20) NOT NULL 
        CHECK (Status IN ('Present', 'Late', 'Half-Day', 'Absent', 'On-Leave', 'Holiday')),
    Source VARCHAR(20) DEFAULT 'Biometric' 
        CHECK (Source IN ('Biometric', 'Manual', 'Regularized', 'System')),
    CONSTRAINT UQ_Emp_Date UNIQUE (EmployeeID, Date),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE AttendanceCorrection (
    CorrectionID INT IDENTITY(1,1) PRIMARY KEY,
    AttendanceID INT NOT NULL,
    EditedByUserID INT NOT NULL,
    PreviousStatus VARCHAR(20),
    NewStatus VARCHAR(20),
    Reason VARCHAR(MAX) NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AttendanceID) REFERENCES Attendance(AttendanceID),
    FOREIGN KEY (EditedByUserID) REFERENCES [User](UserID)
);

CREATE TABLE AttendanceRegularizationRequest (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    RequestedStatus VARCHAR(20) NOT NULL 
        CHECK (RequestedStatus IN ('Present', 'Late', 'Half-Day')),
    Reason VARCHAR(MAX) NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending' 
        CHECK (Status IN ('Pending', 'Approved', 'Rejected')),
    ApprovedByManagerID INT NULL,
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (ApprovedByManagerID) REFERENCES Employee(EmployeeID)
);

-- 4. Overtime Core
CREATE TABLE OvertimeRule (
    OvertimeRuleID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    RateMultiplier DECIMAL(3,2) NOT NULL,
    MaxHoursPerDay DECIMAL(4,2) NOT NULL
);

CREATE TABLE OvertimeRequest (
    OvertimeRequestID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    OvertimeRuleID INT NOT NULL,
    Date DATE NOT NULL,
    HoursRequested DECIMAL(4,2) NOT NULL,
    Source VARCHAR(30) NOT NULL 
        CHECK (Source IN ('Auto (Attendance)', 'Manual Request')),
    Status VARCHAR(20) DEFAULT 'Pending' 
        CHECK (Status IN ('Pending', 'Approved', 'Rejected')),
    ApprovedByManagerID INT NULL,
    PayrollRunID INT NULL,
    ComputedPay DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (OvertimeRuleID) REFERENCES OvertimeRule(OvertimeRuleID),
    FOREIGN KEY (ApprovedByManagerID) REFERENCES Employee(EmployeeID)
);

-- Seed initial records
INSERT INTO LeaveType (Name, IsPaid, AnnualMax) VALUES 
('Casual', 1, 10), ('Sick', 1, 14), ('Earned', 1, 18), ('Unpaid', 0, 0);

INSERT INTO OvertimeRule (Name, RateMultiplier, MaxHoursPerDay) VALUES 
('Weekday OT', 1.5, 3.0), ('Holiday OT', 2.0, 4.0);
GO