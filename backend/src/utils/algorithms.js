
function calculateIncomeTax(annualIncome, options = {}) {
  const {
    gender = 'Male',
    isSeniorCitizen = false,
    isDisabled = false,
    customSlabs = null
  } = options;

  let zeroTaxThreshold = 350000;
  if (gender === 'Female' || isSeniorCitizen) {
    zeroTaxThreshold = 400000;
  }
  if (isDisabled) {
    zeroTaxThreshold = 475000;
  }

  const defaultSlabs = [
    { limit: zeroTaxThreshold, rate: 0, label: '0% Exemption Slab' },
    { limit: 100000, rate: 5, label: 'Next 1,00,000 @ 5%' },
    { limit: 300000, rate: 10, label: 'Next 3,00,000 @ 10%' },
    { limit: 400000, rate: 15, label: 'Next 4,00,000 @ 15%' },
    { limit: 500000, rate: 20, label: 'Next 5,00,000 @ 20%' },
    { limit: null, rate: 25, label: 'Remaining Balance @ 25%' }
  ];

  const slabs = customSlabs || defaultSlabs;
  let remainingIncome = Math.max(0, annualIncome);
  let totalAnnualTax = 0;
  const slabBreakdown = [];

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabCapacity = slab.limit !== null ? slab.limit : remainingIncome;
    const taxableInThisSlab = Math.min(remainingIncome, slabCapacity);
    const taxInThisSlab = (taxableInThisSlab * slab.rate) / 100;

    totalAnnualTax += taxInThisSlab;
    remainingIncome -= taxableInThisSlab;

    slabBreakdown.push({
      bracket: slab.label,
      taxableAmount: taxableInThisSlab,
      rate: slab.rate,
      tax: Math.round(taxInThisSlab)
    });
  }

  const monthlyTax = Math.round(totalAnnualTax / 12);
  const effectiveRate = annualIncome > 0
    ? Number(((totalAnnualTax / annualIncome) * 100).toFixed(2))
    : 0;

  return {
    annualIncome,
    annualTax: Math.round(totalAnnualTax),
    monthlyTax,
    effectiveRate,
    slabBreakdown
  };
}



function aggregateDepartmentMetrics(employees = []) {
  if (!Array.isArray(employees) || employees.length === 0) {
    return [];
  }

  const deptMap = new Map();
  let grandTotalCost = 0;

  for (const emp of employees) {
    const deptName = emp.department || 'General';
    const salary = Number(emp.grossSalary || emp.basicSalary || 0);

    grandTotalCost += salary;

    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, {
        department: deptName.substring(0, 5),
        fullName: deptName,
        cost: 0,
        headcount: 0,
        minSalary: salary,
        maxSalary: salary,
        salaries: []
      });
    }

    const current = deptMap.get(deptName);
    current.cost += salary;
    current.headcount += 1;
    current.minSalary = Math.min(current.minSalary, salary);
    current.maxSalary = Math.max(current.maxSalary, salary);
    current.salaries.push(salary);
  }

  const result = [];
  for (const [_, data] of deptMap.entries()) {
    const percentage = grandTotalCost > 0
      ? Math.round((data.cost / grandTotalCost) * 100)
      : 0;
    const avgSalary = Math.round(data.cost / (data.headcount || 1));

    result.push({
      department: data.department,
      fullName: data.fullName,
      cost: data.cost,
      headcount: data.headcount,
      avgSalary,
      minSalary: data.minSalary,
      maxSalary: data.maxSalary,
      percentage,
      currency: '৳'
    });
  }

  return result.sort((a, b) => b.cost - a.cost);
}


function createIndexedMap(array = [], keyExtractor = 'id') {
  const map = new Map();
  const getKey = typeof keyExtractor === 'function'
    ? keyExtractor
    : (item) => item[keyExtractor];

  for (const item of array) {
    const key = getKey(item);
    if (key !== undefined && key !== null) {
      map.set(key, item);
    }
  }

  return map;
}

function calculateLoanAmortization(principal, annualRate = 0, tenureMonths = 12) {
  const P = Number(principal);
  const n = Number(tenureMonths);
  const annual = Number(annualRate);

  if (annual <= 0) {
    const emi = Math.round((P / n) * 100) / 100;
    return {
      emi,
      totalPayment: P,
      totalInterest: 0,
      monthlySchedule: Array.from({ length: n }, (_, i) => ({
        month: i + 1,
        principalPaid: emi,
        interestPaid: 0,
        remainingBalance: Math.max(0, P - emi * (i + 1))
      }))
    };
  }

  const monthlyRate = (annual / 12) / 100;
  const factor = Math.pow(1 + monthlyRate, n);
  const emi = (P * monthlyRate * factor) / (factor - 1);
  const roundedEmi = Math.round(emi * 100) / 100;

  let balance = P;
  const schedule = [];
  let totalInterest = 0;

  for (let month = 1; month <= n; month++) {
    const interestPayment = Math.round(balance * monthlyRate * 100) / 100;
    const principalPayment = Math.round((roundedEmi - interestPayment) * 100) / 100;
    balance = Math.max(0, Math.round((balance - principalPayment) * 100) / 100);
    totalInterest += interestPayment;

    schedule.push({
      month,
      emi: roundedEmi,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      remainingBalance: balance
    });
  }

  return {
    emi: roundedEmi,
    totalPayment: Math.round((roundedEmi * n) * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthlySchedule: schedule
  };
}

module.exports = {
  calculateIncomeTax,
  aggregateDepartmentMetrics,
  createIndexedMap,
  calculateLoanAmortization
};
