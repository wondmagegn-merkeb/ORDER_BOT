
const express = require('express');
const router = express.Router();
const auditLogController = require('../../controllers/view/auditLogController');

// Route to fetch and render audit logs
router.get('/audit-logs', auditLogController.getAuditLogs);

module.exports = router;
