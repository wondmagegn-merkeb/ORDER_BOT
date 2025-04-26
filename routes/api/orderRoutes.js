const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/api/orderController'); 

// API endpoint to update an existing order
router.post('/:id', orderController.updateOrder); /

module.exports = router;
