const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/view/orderController');

router.get('/', orderController.listOrders);
router.get('/edit/:id', orderController.showEditOrderForm);

module.exports = router;
