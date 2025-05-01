const { getAllFoods ,getFoodById} = require('../api/foodController');
const {
  getAllCategories
} = require('../api/categoryController');
const { InternalServerError } = require('../../utils/customError');

exports.renderFoodList = async (req, res, next) => {
  try {
    const foods = await getAllFoods(); // Get all foods
    res.render('admin/food/list-food', { foods, title: 'Food List' });
  } catch (err) {
    next(new InternalServerError('Error loading food items.', err));
  }
};

exports.renderCreateForm = async (req, res, next) => {
  try {
    const categories = await getAllCategories(); // Get all categories for dropdown
    res.render('admin/food/create-food', { categories, title: 'Create Food' });
  } catch (err) {
    next(new InternalServerError('Error loading create form.', err));
  }
};

exports.renderUpdateForm = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const food = await getFoodById(foodId); // Get food by ID
    const categories = await getAllCategories(); // Get all categories for dropdown
    res.render('admin/food/update-food', { food, categories, title: 'Food Update' });
  } catch (err) {
    next(new InternalServerError('Error loading edit form.', err));
  }
};
