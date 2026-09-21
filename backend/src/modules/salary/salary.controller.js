const salaryService = require('./salary.service');

class SalaryController {
  /**
   * GET /api/salary/current
   * Retrieves current payroll run & calculation stats
   */
  async getCurrentRun(req, res, next) {
    try {
      const data = await salaryService.getCurrentRun();
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/salary/calculation/:employeeId
   * Retrieves net salary breakdown for an employee
   */
  async getEmployeeCalculation(req, res, next) {
    try {
      const { employeeId } = req.params;
      const data = await salaryService.getEmployeeCalculation(employeeId);
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/salary/status
   * Transitions status: Draft -> Approved -> Locked
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required (Draft, Approved, Locked)'
        });
      }
      const data = await salaryService.updateStatus(status);
      res.status(200).json({
        status: 'success',
        message: `Payroll run status updated to ${status}`,
        data
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/salary/payslip/:employeeIdentifier/download
   * Downloads employee payslip PDF
   */
  async downloadPayslip(req, res, next) {
    try {
      const { employeeIdentifier } = req.params;
      const { filename, buffer } = await salaryService.generatePayslipPdf(employeeIdentifier);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalaryController();