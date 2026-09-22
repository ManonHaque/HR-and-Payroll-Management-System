const { pool } = require('../../config/db');

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Total Employees
    const [empCountRow] = await pool.query("SELECT COUNT(*) as count FROM Employee WHERE status = 'Active'");
    const totalEmployees = empCountRow[0].count;

    // 2. Present Today (Mocked logic, assumes Attendance table is populated for today)
    const [presentRow] = await pool.query("SELECT COUNT(*) as count FROM Attendance WHERE date = ? AND status = 'Present'", [today]);
    const presentToday = presentRow[0].count;

    // 3. On Leave Today
    const [leaveRow] = await pool.query("SELECT COUNT(*) as count FROM Attendance WHERE date = ? AND status = 'On-Leave'", [today]);
    const onLeaveToday = leaveRow[0].count;

    // 4. Pending Approvals (Leave + Loans)
    const [pendingLeave] = await pool.query("SELECT COUNT(*) as count FROM LeaveRequest WHERE status LIKE 'Pending%'");
    const [pendingLoan] = await pool.query("SELECT COUNT(*) as count FROM LoanRequest WHERE status = 'Pending'");
    const pendingApprovals = pendingLeave[0].count + pendingLoan[0].count;

    // 5. Payroll Status
    const [payrollRow] = await pool.query("SELECT status FROM PayrollRun ORDER BY cycle_year DESC, cycle_month DESC LIMIT 1");
    const payrollStatus = payrollRow.length > 0 ? payrollRow[0].status : 'No Data';

    // 6. Attendance Trend (Last 7 days - mocked with static data for now since we have no data)
    const attendanceTrend = [
      { day: 'Mon', present: 150 },
      { day: 'Tue', present: 160 },
      { day: 'Wed', present: 171 },
      { day: 'Thu', present: 168 },
      { day: 'Fri', present: 165 },
      { day: 'Sat', present: 100 },
      { day: 'Sun', present: 40 },
    ];

    // 7. Upcoming Events (Mocked)
    const upcomingEvents = [
      { id: 1, title: 'National Holiday', date: 'Sep 18', type: 'holiday', icon: 'H' },
      { id: 2, title: "Rahul Saha's Birthday", date: 'Sep 26', type: 'birthday', icon: 'B' },
      { id: 3, title: 'Md. Manon Haque - 3yr anniversary', date: 'Sep 14', type: 'anniversary', icon: 'A' }
    ];

    // 8. Pending Approval List
    const pendingList = [
      { id: 1, name: 'Aviram Singha', type: 'Sick leave - 3 day(s)', avatar: 'AS' },
      { id: 2, name: 'Abdullah Al Sayeed', type: 'Casual leave - 1 day(s)', avatar: 'AAS' },
      { id: 3, name: 'Rahul Saha', type: '$50,000 - 6 months (Loan)', avatar: 'RS' }
    ];

    res.json({
      status: 'success',
      data: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        pendingApprovals,
        payrollStatus,
        attendanceTrend,
        upcomingEvents,
        pendingList
      }
    });

  } catch (error) {
    next(error);
  }
};
