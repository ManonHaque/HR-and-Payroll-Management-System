const salaryService = require('./salary.service');

class SalaryController {
 
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


  async updateStatus(req, res, next) {
    try {
      const { status, adminOverride, reason } = req.body;
      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required (Draft, Approved, Locked)'
        });
      }
      const data = await salaryService.updateStatus(status, 'Admin', adminOverride, reason);
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