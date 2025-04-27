const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/view/dashboardController');

router.get('/', dashboardController.showDashBoard);

module.exports = router;
