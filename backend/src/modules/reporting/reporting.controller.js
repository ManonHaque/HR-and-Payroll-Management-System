const reportingService = require('./reporting.service');

class ReportingController {
  async getReportsList(req, res, next) {
    try {
      const data = await reportingService.getReportsList();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentCosts(req, res, next) {
    try {
      const data = await reportingService.getDepartmentCosts();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async getExportHistory(req, res, next) {
    try {
      const data = await reportingService.getExportHistory();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req, res, next) {
    try {
      const { reportName, format, exportedBy } = req.body;
      if (!reportName) {
        return res.status(400).json({ status: 'error', message: 'reportName is required' });
      }

      const result = await reportingService.exportReport(reportName, format, exportedBy);
      
      // If client requests raw JSON result with history
      if (req.query.download !== 'direct') {
        return res.status(200).json({
          status: 'success',
          message: 'Report exported successfully',
          data: {
            filename: result.filename,
            contentType: result.contentType,
            historyItem: result.historyItem,
            fileBase64: result.buffer.toString('base64')
          }
        });
      }

      // If client requests direct file download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.end(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportingController();