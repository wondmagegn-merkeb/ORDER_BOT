const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controllers/api/subscriptionController');

router.post('/', subscriptionController.subscription);

module.exports = router;
