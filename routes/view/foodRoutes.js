const express = require('express');
const router = express.Router();
const foodViewController = require('../../controllers/view/foodController');

router.get('/', foodViewController.renderFoodList);
router.get('/add', (req, res) => res.render('admin/food/foodForm', { title:'Food Add', food: null, categories: ['Pizza', 'Burger', 'Pasta', 'Drinks'] }));
module.exports = router;
