const { pool } = require('../../config/db');

exports.getSettings = async (req, res, next) => {
  try {
    // 1. Get Company Profile & Payroll Cycle
    let [companyRows] = await pool.query("SELECT * FROM CompanySetting LIMIT 1");
    let companyProfile = companyRows[0];
    
    // Fallback mock data if DB is empty
    if (!companyProfile) {
      companyProfile = {
        name: 'Ultimate IT Solutions Ltd.',
        registration_number: 'C-142876',
        address: 'Jamalkhan, Chittagong',
        logo_url: 'Ultimate IT.png',
        payroll_cycle_date: 30, // Last working day logic can be derived
        working_hours: '9:00 AM - 6:00 PM',
        working_days: 'Sun - Thu'
      };
    } else {
        // Map fields safely if they don't exist yet
        companyProfile.working_hours = companyProfile.working_hours || '9:00 AM - 6:00 PM';
        companyProfile.working_days = companyProfile.working_days || 'Sun - Thu';
    }

    // 2. Get Departments & Designations
    let [departments] = await pool.query("SELECT id, name FROM Department");
    let [designations] = await pool.query("SELECT id, department_id, name FROM Designation");
    
    let depsAndDesigs = [];
    if (departments.length === 0) {
      depsAndDesigs = [
        { name: 'Engineering', designations: ['Software Engineer', 'QA', 'DevOps'] },
        { name: 'Finance', designations: ['Accountant', 'Finance Manager'] },
        { name: 'HR', designations: ['HR Executive', 'HR Manager'] },
        { name: 'Production', designations: ['Line Supervisor', 'Operator'] },
        { name: 'Sales', designations: ['Sales Executive', 'Sales Manager'] },
        { name: 'Admin', designations: ['Office Assistant', 'Admin Officer'] }
      ];
    } else {
      depsAndDesigs = departments.map(dep => {
        return {
          name: dep.name,
          designations: designations.filter(des => des.department_id === dep.id).map(d => d.name)
        };
      });
    }

    // 3. Get Holiday Calendar
    let [holidays] = await pool.query("SELECT id, name, date FROM HolidayCalendar ORDER BY date ASC");
    if (holidays.length === 0) {
      holidays = [
        { name: 'Eid-ul-Fitr', date: 'Mar 20-22' },
        { name: 'Independence Day', date: 'Mar 26' },
        { name: 'Eid-ul-Adha', date: 'May 27-29' },
        { name: 'Victory Day', date: 'Dec 16' }
      ];
    } else {
        // Format dates if pulling from DB
        holidays = holidays.map(h => ({
            name: h.name,
            date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    }

    // 4. Get Notifications
    let [notifications] = await pool.query("SELECT notification_type, is_email_enabled FROM NotificationSetting");
    if (notifications.length === 0) {
      notifications = [
        { type: 'Leave approval email', enabled: true },
        { type: 'Payslip delivery email', enabled: true },
        { type: 'Loan approval email', enabled: true }
      ];
    } else {
        notifications = notifications.map(n => ({
            type: n.notification_type,
            enabled: n.is_email_enabled
        }));
    }

    res.json({
      status: 'success',
      data: {
        companyProfile,
        departments: depsAndDesigs,
        holidays,
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};
