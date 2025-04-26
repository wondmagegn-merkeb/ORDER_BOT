const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/view/orderController');

// Route to list all orders in the view
router.get('/', orderController.listOrders);

// Route to show the form to edit an existing order
router.get('/edit/:id', orderController.showEditOrderForm);

module.exports = router;
