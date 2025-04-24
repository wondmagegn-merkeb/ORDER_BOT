const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/api/orderController'); // Adjust path to your actual order controller

// API endpoint to get all orders
router.get('/', orderController.getAllOrders);

// API endpoint to get an order by ID
router.get('/:id', orderController.getOrderById);

// API endpoint to update an existing order
router.post('/:id', orderController.updateOrder); // You can change to .put() if your frontend/client uses PUT

module.exports = router;
