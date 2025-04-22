const express = require('express');
const router = express.Router();
const foodViewController = require('../../controllers/view/foodController');

router.get('/', foodViewController.renderFoodList);
router.get('/add', foodViewController.renderCreateForm); // Show form
module.exports = router;
