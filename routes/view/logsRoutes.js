
const express = require('express');
const router = express.Router();
const auditLogController = require('../../controllers/view/auditLogController');

// Route to fetch and render audit logs
router.get('/admins, auditLogController.getAuditLogs);

module.exports = router;
