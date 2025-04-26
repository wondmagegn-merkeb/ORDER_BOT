
const express = require('express');
const router = express.Router();
const auditLogController = require('../../controllers/view/auditLogController');

// Route to fetch and render audit logs
router.get('/admin', auditLogController.getAdminLogs);
router.get('/user', auditLogController.getUserLogs);
router.get('/orders', auditLogController.getOrderLogs);
router.get('/items', auditLogController.getFoodLogs);
router.get('/categories', auditLogController.getCategoryLogs);

module.exports = router;
