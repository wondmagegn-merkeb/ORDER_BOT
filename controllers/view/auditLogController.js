
const AdminAuditLog = require('../../models/AdminAuditLog');

// Fetch audit logs with pagination
const getAuditLogs = async (req, res) => {
  try {
    // Pagination parameters
    const page = req.query.page || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    // Fetch audit logs with pagination and sorting by createdAt in descending order
    const logs = await AdminAuditLog.findAll({
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    // Get the total number of logs for pagination
    const totalLogs = await AdminAuditLog.count();

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalLogs / limit);

    // Send the logs and pagination data to the view
    res.render('admin/logs/adminLog-list', {
      auditLogs: logs,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};

module.exports = {
  getAuditLogs,
};
