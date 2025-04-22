const express = require('express');
const router = express.Router();
const userController = require('../../controllers/api/userController'); // Adjust path to the correct user controller

// API endpoint to get all users
router.get('/', userController.getAllUsers);

// API endpoint to get a user by ID
router.get('/:id', userController.getUserById);

// API endpoint to update an existing user
router.post('/:id', userController.updateUser); // Changed to PUT for updating users

module.exports = router;
