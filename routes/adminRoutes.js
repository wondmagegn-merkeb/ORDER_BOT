const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin routes
router.post('/create', adminController.createAdmin);       // Create new admin
router.get('/', adminController.getAllAdmins);             // Get all admins
router.get('/:adminId', adminController.getAdminById);     // Get admin by ID
router.put('/:adminId', adminController.updateAdmin);      // Update admin
router.post('/login', adminController.login);              // Admin login
router.post('/forgot-password', adminController.forgotPassword); // Forgot password
router.post('/reset-password', adminController.resetPassword); // Reset password

module.exports = router;
