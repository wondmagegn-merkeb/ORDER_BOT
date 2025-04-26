
const express = require('express');
const router = express.Router();
const auditLogController = require('../../controllers/view/auditLogController');

// Route to fetch and render audit logs
router.get('/admin', auditLogController.getAdminLogs);
router.get('/user', auditLogController.getUserLogs);
router.get('/orders', auditLogController.getOrdersLogs);
router.get('/items', auditLogController.getItemsLogs);
router.get('/categories', auditLogController.getCategoriesLogs);

module.exports = router;
