const { sql, poolPromise } = require('../db');

// Sync biometric/attendance log and auto-classify status
exports.syncAttendance = async (req, res) => {
    try {
        const { employeeId, date, checkInTime, checkOutTime, shiftStart } = req.body;
        const pool = await poolPromise;

        let status = 'Present';
        
        // Late classification (e.g., check-in after 9:15 AM if shift start is 9:00 AM)
        if (checkInTime > '09:15:00') {
            status = 'Late';
        }

        // Calculate hours worked for Half-Day classification
        if (checkInTime && checkOutTime) {
            const checkIn = new Date(`1970-01-01T${checkInTime}Z`);
            const checkOut = new Date(`1970-01-01T${checkOutTime}Z`);
            const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);

            if (hoursWorked < 5) {
                status = 'Half-Day';
            }
        }

        await pool.request()
            .input('EmployeeID', sql.Int, employeeId)
            .input('Date', sql.Date, date)
            .input('CheckInTime', sql.Time, checkInTime)
            .input('CheckOutTime', sql.Time, checkOutTime)
            .input('Status', sql.VarChar, status)
            .query(`
                MERGE Attendance AS target
                USING (SELECT @EmployeeID AS EmployeeID, @Date AS Date) AS source
                ON (target.EmployeeID = source.EmployeeID AND target.Date = source.Date)
                WHEN MATCHED THEN
                    UPDATE SET CheckInTime = @CheckInTime, CheckOutTime = @CheckOutTime, Status = @Status
                WHEN NOT MATCHED THEN
                    INSERT (EmployeeID, Date, CheckInTime, CheckOutTime, Status, Source)
                    VALUES (@EmployeeID, @Date, @CheckInTime, @CheckOutTime, @Status, 'Biometric');
            `);

        res.status(200).json({ message: 'Attendance processed successfully.', status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// HR Manual Correction (with mandatory audit log)
exports.correctAttendance = async (req, res) => {
    try {
        const { attendanceId, editedByUserId, newStatus, reason } = req.body;
        const pool = await poolPromise;

        // Fetch current status for audit log
        const currentRecord = await pool.request()
            .input('AttendanceID', sql.Int, attendanceId)
            .query(`SELECT Status FROM Attendance WHERE AttendanceID = @AttendanceID`);

        if (currentRecord.recordset.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found.' });
        }

        const previousStatus = currentRecord.recordset[0].Status;

        // Update attendance status
        await pool.request()
            .input('AttendanceID', sql.Int, attendanceId)
            .input('NewStatus', sql.VarChar, newStatus)
            .query(`UPDATE Attendance SET Status = @NewStatus, Source = 'Regularized' WHERE AttendanceID = @AttendanceID`);

        // Insert into AttendanceCorrection for audit trail
        await pool.request()
            .input('AttendanceID', sql.Int, attendanceId)
            .input('EditedByUserID', sql.Int, editedByUserId)
            .input('PreviousStatus', sql.VarChar, previousStatus)
            .input('NewStatus', sql.VarChar, newStatus)
            .input('Reason', sql.VarChar, reason)
            .query(`
                INSERT INTO AttendanceCorrection (AttendanceID, EditedByUserID, PreviousStatus, NewStatus, Reason)
                VALUES (@AttendanceID, @EditedByUserID, @PreviousStatus, @NewStatus, @Reason)
            `);

        res.status(200).json({ message: 'Attendance corrected and logged in audit history.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};