const { sql, poolPromise } = require('../db');

// Submit or auto-generate Overtime request
exports.requestOvertime = async (req, res) => {
    try {
        const { employeeId, overtimeRuleId, date, hoursRequested, source } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('EmployeeID', sql.Int, employeeId)
            .input('OvertimeRuleID', sql.Int, overtimeRuleId)
            .input('Date', sql.Date, date)
            .input('HoursRequested', sql.Decimal(4, 2), hoursRequested)
            .input('Source', sql.VarChar, source)
            .query(`
                INSERT INTO OvertimeRequest (EmployeeID, OvertimeRuleID, Date, HoursRequested, Source, Status)
                VALUES (@EmployeeID, @OvertimeRuleID, @Date, @HoursRequested, @Source, 'Pending')
            `);

        res.status(201).json({ message: 'Overtime request logged for manager approval.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Summary endpoint consumed by Salary Module for monthly payroll calculation
exports.getCycleOvertimeSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pool = await poolPromise;

        const summary = await pool.request()
            .input('StartDate', sql.Date, startDate)
            .input('EndDate', sql.Date, endDate)
            .query(`
                SELECT 
                    ot.EmployeeID,
                    SUM(ot.HoursRequested) AS TotalApprovedHours,
                    SUM(ot.HoursRequested * r.RateMultiplier) AS WeightedOTUnits
                FROM OvertimeRequest ot
                JOIN OvertimeRule r ON ot.OvertimeRuleID = r.OvertimeRuleID
                WHERE ot.Status = 'Approved' 
                  AND ot.Date BETWEEN @StartDate AND @EndDate
                GROUP BY ot.EmployeeID
            `);

        res.status(200).json(summary.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};