const { sql, poolPromise } = require('../db');

// Apply for leave (validates balance)
exports.applyLeave = async (req, res) => {
    try {
        const { employeeId, leaveTypeId, startDate, endDate, daysRequested, reason } = req.body;
        const pool = await poolPromise;

        const balanceCheck = await pool.request()
            .input('EmployeeID', sql.Int, employeeId)
            .input('LeaveTypeID', sql.Int, leaveTypeId)
            .query(`SELECT RemainingDays FROM LeaveBalance WHERE EmployeeID = @EmployeeID AND LeaveTypeID = @LeaveTypeID`);

        if (balanceCheck.recordset.length === 0 || balanceCheck.recordset[0].RemainingDays < daysRequested) {
            return res.status(400).json({ error: 'Insufficient leave balance.' });
        }

        await pool.request()
            .input('EmployeeID', sql.Int, employeeId)
            .input('LeaveTypeID', sql.Int, leaveTypeId)
            .input('StartDate', sql.Date, startDate)
            .input('EndDate', sql.Date, endDate)
            .input('DaysRequested', sql.Int, daysRequested)
            .input('Reason', sql.VarChar, reason)
            .query(`
                INSERT INTO LeaveRequest (EmployeeID, LeaveTypeID, StartDate, EndDate, DaysRequested, Reason, Status)
                VALUES (@EmployeeID, @LeaveTypeID, @StartDate, @EndDate, @DaysRequested, @Reason, 'Pending Manager Review')
            `);

        res.status(201).json({ message: 'Leave request submitted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Handle multi-stage approvals (Manager -> HR)
exports.approveLeave = async (req, res) => {
    try {
        const { requestId, reviewerId, role } = req.body;
        const pool = await poolPromise;

        if (role === 'Manager') {
            await pool.request()
                .input('RequestID', sql.Int, requestId)
                .input('ManagerID', sql.Int, reviewerId)
                .query(`
                    UPDATE LeaveRequest 
                    SET Status = 'Pending HR Review', ManagerApprovedBy = @ManagerID, ManagerApprovedDate = GETDATE()
                    WHERE LeaveRequestID = @RequestID
                `);
            return res.json({ message: 'Manager approved. Awaiting HR approval.' });
        } 
        
        if (role === 'HR') {
            const requestData = await pool.request()
                .input('RequestID', sql.Int, requestId)
                .query(`SELECT EmployeeID, LeaveTypeID, DaysRequested, StartDate, EndDate FROM LeaveRequest WHERE LeaveRequestID = @RequestID`);

            const { EmployeeID, LeaveTypeID, DaysRequested, StartDate, EndDate } = requestData.recordset[0];

            await pool.request()
                .input('RequestID', sql.Int, requestId)
                .input('HRID', sql.Int, reviewerId)
                .query(`UPDATE LeaveRequest SET Status = 'Approved', HRApprovedBy = @HRID, HRApprovedDate = GETDATE() WHERE LeaveRequestID = @RequestID`);

            await pool.request()
                .input('EmployeeID', sql.Int, EmployeeID)
                .input('LeaveTypeID', sql.Int, LeaveTypeID)
                .input('Days', sql.Int, DaysRequested)
                .query(`UPDATE LeaveBalance SET UsedDays = UsedDays + @Days WHERE EmployeeID = @EmployeeID AND LeaveTypeID = @LeaveTypeID`);

            await pool.request()
                .input('EmployeeID', sql.Int, EmployeeID)
                .input('StartDate', sql.Date, StartDate)
                .query(`
                    INSERT INTO Attendance (EmployeeID, Date, Status, Source)
                    VALUES (@EmployeeID, @StartDate, 'On-Leave', 'System')
                `);

            return res.json({ message: 'Leave fully approved and attendance updated.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};