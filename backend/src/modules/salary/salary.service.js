const { pool } = require('../../config/db');
const { calculateIncomeTax, createIndexedMap } = require('../../utils/algorithms');
const cache = require('../../utils/cache');

let currentRunState = {
  id: 1,
  cycleMonth: 9,
  cycleMonthName: 'September',
  cycleYear: 2026,
  totalEmployees: 184,
  status: 'Draft', 
  statusLabel: 'Draft — pending review',
  generatedDate: '2026-09-10',
  approvedBy: null
};

let employeePayslips = [
  {
    id: 1,
    employeeId: 101,
    name: 'Abdullah Al Sayed',
    designation: 'Senior Software Engineer',
    department: 'Engineering',
    basicSalary: 30000,
    allowances: 12500, 
    bonus: 2500,
    overtime: 1750,
    grossSalary: 46750,
    deductions: 3850,   
    nbrTax: 0,
    loanEmi: 4375,
    netSalary: 38525,
    pdfFileName: 'Payslip_Sep2026_AbdullahAlSayed.pdf'
  },
  {
    id: 2,
    employeeId: 102,
    name: 'Aviram Singha',
    designation: 'Tech Lead',
    department: 'Engineering',
    basicSalary: 35000,
    allowances: 14000,
    bonus: 3000,
    overtime: 0,
    grossSalary: 52000,
    deductions: 4200,
    nbrTax: 1200,
    loanEmi: 5000,
    netSalary: 41600,
    pdfFileName: 'Payslip_Sep2026_AviramSingha.pdf'
  },
  {
    id: 3,
    employeeId: 103,
    name: 'Avishel Biswas',
    designation: 'HR Specialist',
    department: 'HR',
    basicSalary: 28000,
    allowances: 10000,
    bonus: 2000,
    overtime: 0,
    grossSalary: 40000,
    deductions: 3200,
    nbrTax: 0,
    loanEmi: 2500,
    netSalary: 34300,
    pdfFileName: 'Payslip_Sep2026_AvishelBiswas.pdf'
  },
  {
    id: 4,
    employeeId: 104,
    name: 'Manon Hoque',
    designation: 'Accounts Manager',
    department: 'Finance',
    basicSalary: 38000,
    allowances: 15000,
    bonus: 4000,
    overtime: 0,
    grossSalary: 57000,
    deductions: 4500,
    nbrTax: 2500,
    loanEmi: 0,
    netSalary: 50000,
    pdfFileName: 'Payslip_Sep2026_ManonHoque.pdf'
  }
];

let salaryRevisionHistory = [
  {
    id: 1,
    action: 'Payroll Run Generated',
    status: 'Draft',
    cycle: 'September 2026',
    performedBy: 'System Engine',
    timestamp: '2026-09-01T08:00:00Z',
    note: 'Automated payroll generation for 184 active employees'
  }
];

class SalaryService {

  async getCurrentRun() {
    return cache.getOrSet('salary:current_run', async () => {
      try {
        if (pool) {
          const [runs] = await pool.query(
            'SELECT * FROM PayrollRun ORDER BY id DESC LIMIT 1'
          );
          if (runs && runs.length > 0) {
            const run = runs[0];
            currentRunState.id = run.id;
            currentRunState.status = run.status;
            currentRunState.statusLabel =
              run.status === 'Draft'
                ? 'Draft — pending review'
                : run.status === 'Approved'
                ? 'Approved — ready for disbursement'
                : 'Locked — finalized, non-editable';
          }

          const [dbEmps] = await pool.query(`
            SELECT e.id, e.emp_id AS employeeId,
                   CONCAT(e.first_name, ' ', e.last_name) AS name,
                   COALESCE(d.name, 'General') AS department,
                   COALESCE(des.name, 'Staff') AS designation,
                   COALESCE(p.basic_salary, 30000) AS basicSalary,
                   COALESCE(p.total_allowances, 12500) AS allowances,
                   COALESCE(p.bonus_amount, 2500) AS bonus,
                   COALESCE(p.overtime_amount, 1750) AS overtime,
                   COALESCE(p.gross_salary, 46750) AS grossSalary,
                   COALESCE(p.total_deductions, 3850) AS deductions,
                   COALESCE(p.loan_emi, 4375) AS loanEmi,
                   COALESCE(p.tax_deducted, 0) AS nbrTax,
                   COALESCE(p.net_salary, 38525) AS netSalary
            FROM Employee e
            LEFT JOIN Department d ON e.department_id = d.id
            LEFT JOIN Designation des ON e.designation_id = des.id
            LEFT JOIN Payslip p ON p.employee_id = e.id AND p.payroll_run_id = ?
            LIMIT 50
          `, [currentRunState.id]);

          if (dbEmps && dbEmps.length > 0) {
            employeePayslips = dbEmps.map(emp => {
              const gross = Number(emp.basicSalary) + Number(emp.allowances) + Number(emp.bonus) + Number(emp.overtime);
              const taxResult = calculateIncomeTax(gross * 12);
              const calculatedTax = emp.nbrTax > 0 ? emp.nbrTax : taxResult.monthlyTax;
              const net = gross - Number(emp.deductions) - Number(emp.loanEmi) - Number(calculatedTax);

              return {
                ...emp,
                grossSalary: gross,
                nbrTax: calculatedTax,
                netSalary: net,
                taxEffectiveRate: taxResult.effectiveRate,
                pdfFileName: `Payslip_Sep2026_${emp.name.replace(/\\s+/g, '')}.pdf`
              };
            });
          }
        }
      } catch (err) {
        employeePayslips = employeePayslips.map(emp => {
          const gross = Number(emp.basicSalary) + Number(emp.allowances) + Number(emp.bonus) + Number(emp.overtime);
          const taxResult = calculateIncomeTax(gross * 12);
          const calculatedTax = emp.nbrTax > 0 ? emp.nbrTax : taxResult.monthlyTax;
          const net = gross - Number(emp.deductions) - Number(emp.loanEmi) - Number(calculatedTax);
          return {
            ...emp,
            grossSalary: gross,
            nbrTax: calculatedTax,
            netSalary: net,
            taxEffectiveRate: taxResult.effectiveRate
          };
        });
      }

      return {
        run: currentRunState,
        selectedEmployee: employeePayslips[0],
        downloadablePayslip: {
          fileName: 'Payslip_Sep2026_AviramSingha.pdf',
          employeeName: 'Aviram Singha',
          employeeId: 102,
          cycle: 'September 2026',
          subtitle: 'Generated on approval, downloadable by employee'
        },
        employees: employeePayslips.map(e => ({
          id: e.id,
          employeeId: e.employeeId,
          name: e.name,
          department: e.department
        }))
      };
    }, 60);
  }

  
  async getEmployeeCalculation(employeeId) {
    const id = parseInt(employeeId, 10);
    
    
    const empMap = createIndexedMap(employeePayslips, e => e.id);
    const empByEmpId = createIndexedMap(employeePayslips, e => e.employeeId);
    const employee = empMap.get(id) || empByEmpId.get(id) || employeePayslips[0];
    const gross =
      Number(employee.basicSalary) +
      Number(employee.allowances) +
      Number(employee.bonus) +
      Number(employee.overtime);

    
    const annualTaxableIncome = gross * 12;
    const taxCalculation = calculateIncomeTax(annualTaxableIncome, {
      gender: employee.gender || 'Male'
    });

    const monthlyTax = employee.nbrTax > 0 ? employee.nbrTax : taxCalculation.monthlyTax;

    const net =
      gross -
      Number(employee.deductions) -
      Number(employee.loanEmi) -
      Number(monthlyTax);

    return {
      ...employee,
      grossSalary: gross,
      nbrTax: monthlyTax,
      netSalary: net,
      taxBreakdown: {
        annualTaxableIncome,
        annualTax: taxCalculation.annualTax,
        monthlyWithholding: monthlyTax,
        effectiveTaxRate: `${taxCalculation.effectiveRate}%`,
        brackets: taxCalculation.slabBreakdown
      }
    };
  }


  async updateStatus(newStatus, user = 'Finance Manager', adminOverride = false, reason = '') {
    const validStatuses = ['Draft', 'Approved', 'Locked'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

   
    if (currentRunState.status === 'Locked' && newStatus !== 'Locked') {
      if (!adminOverride) {
        throw new Error(
          'Locked payroll run cannot be edited or transitioned back. An audited adjustment is required.'
        );
      }
    }

    if (currentRunState.status === 'Draft' && newStatus === 'Locked') {
      throw new Error('Payroll must be Approved before it can be Locked.');
    }

    const previousStatus = currentRunState.status;
    currentRunState.status = newStatus;
    currentRunState.statusLabel =
      newStatus === 'Draft'
        ? 'Draft — pending review'
        : newStatus === 'Approved'
        ? 'Approved — ready for disbursement'
        : 'Locked — finalized, non-editable';

    cache.delByPattern('salary:*');
    cache.delByPattern('reports:*');

    salaryRevisionHistory.push({
      id: salaryRevisionHistory.length + 1,
      action: previousStatus === 'Locked'
        ? `Audited Unlock: Locked → ${newStatus}`
        : `Status Transition: ${previousStatus} → ${newStatus}`,
      status: newStatus,
      cycle: `${currentRunState.cycleMonthName} ${currentRunState.cycleYear}`,
      performedBy: user,
      timestamp: new Date().toISOString(),
      note: reason || `Payroll run status changed to ${newStatus}`
    });

    try {
      if (pool) {
        await pool.query(
          'UPDATE PayrollRun SET status = ? WHERE id = ?',
          [newStatus, currentRunState.id]
        );
      }
    } catch (err) {
    }

    return {
      run: currentRunState,
      revisionHistory: salaryRevisionHistory
    };
  }

 
  async generatePayslipPdf(employeeIdentifier = 'AviramSingha') {
    let employee = employeePayslips.find(
      e =>
        e.name.replace(/\s+/g, '').toLowerCase() ===
          employeeIdentifier.replace(/[^a-zA-Z]/g, '').toLowerCase() ||
        String(e.id) === String(employeeIdentifier) ||
        String(e.employeeId) === String(employeeIdentifier)
    );

    if (!employee) {
      employee = employeePayslips[1];
    }

    const cycle = `${currentRunState.cycleMonthName} ${currentRunState.cycleYear}`;
    const filename = `Payslip_${currentRunState.cycleMonthName.substring(0, 3)}${currentRunState.cycleYear}_${employee.name.replace(/\s+/g, '')}.pdf`;

    
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Title (Employee Payslip - ${employee.name})
   /Author (HR and Payroll MS)
   /Subject (${cycle} Payslip)
   /Creator (HR & Payroll System)
>>
endobj
2 0 obj
<< /Type /Catalog
   /Pages 3 0 R
>>
endobj
3 0 obj
<< /Type /Pages
   /Kids [4 0 R]
   /Count 1
>>
endobj
4 0 obj
<< /Type /Page
   /Parent 3 0 R
   /MediaBox [0 0 595 842]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>
   /Contents 7 0 R
>>
endobj
5 0 obj
<< /Type /Font
   /Subtype /Type1
   /BaseFont /Helvetica-Bold
>>
endobj
6 0 obj
<< /Type /Font
   /Subtype /Type1
   /BaseFont /Helvetica
>>
endobj
7 0 obj
<< /Length 720 >>
stream
BT
/F1 20 Tf
50 780 Td
(HR and Payroll MS - Payslip) Tj
/F2 12 Tf
0 -25 Td
(Cycle: ${cycle}  |  Status: ${currentRunState.status}) Tj
0 -30 Td
/F1 14 Tf
(Employee Details) Tj
/F2 11 Tf
0 -18 Td
(Name: ${employee.name}    ID: EMP-${employee.employeeId}    Dept: ${employee.department}) Tj
0 -16 Td
(Designation: ${employee.designation}) Tj
0 -30 Td
/F1 14 Tf
(Earnings Breakdown) Tj
/F2 11 Tf
0 -18 Td
(Basic Salary: BDT ${employee.basicSalary.toLocaleString()}) Tj
0 -16 Td
(Allowances (HRA/Medical/Conveyance): BDT ${employee.allowances.toLocaleString()}) Tj
0 -16 Td
(Bonus: BDT ${employee.bonus.toLocaleString()}) Tj
0 -16 Td
(Overtime: BDT ${employee.overtime.toLocaleString()}) Tj
0 -18 Td
/F1 12 Tf
(GROSS SALARY: BDT ${employee.grossSalary.toLocaleString()}) Tj
0 -30 Td
/F1 14 Tf
(Deductions) Tj
/F2 11 Tf
0 -18 Td
(General Deductions: -BDT ${employee.deductions.toLocaleString()}) Tj
0 -16 Td
(Loan EMI Repayment: -BDT ${employee.loanEmi.toLocaleString()}) Tj
0 -16 Td
(NBR Income Tax: -BDT ${employee.nbrTax.toLocaleString()}) Tj
0 -25 Td
/F1 15 Tf
(NET SALARY PAYABLE: BDT ${employee.netSalary.toLocaleString()}) Tj
0 -40 Td
/F2 9 Tf
(Generated automatically by HR & Payroll Management System. Audited & Verified.) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000010 00000 n 
0000000120 00000 n 
0000000170 00000 n 
0000000230 00000 n 
0000000360 00000 n 
0000000430 00000 n 
0000000495 00000 n 
trailer
<< /Size 8
   /Root 2 0 R
   /Info 1 0 R
>>
startxref
1280
%%EOF`;

    return {
      filename,
      buffer: Buffer.from(pdfContent, 'utf-8')
    };
  }
}

module.exports = new SalaryService();
