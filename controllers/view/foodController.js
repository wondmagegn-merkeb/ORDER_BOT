const { getAllFoods } = require('../api/foodController');
const {
  getAllCategories,
  getFoodById
} = require('../api/categoryController');

exports.renderFoodList = async (req, res) => {
  try {
    const foods = await getAllFoods(); // Will return JSON from API controller
    res.render('admin/food/list-food', { foods ,title:'Food List'});
  } catch (error) {
    res.status(500).send('Unable to load food items.');
  }
};

exports.renderCreateForm = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.render('admin/food/create-food', { categories,title:'Food List' });
  } catch (err) {
    res.status(500).send('Error loading form');
  }
};

exports.renderUpdateForm = async (req, res) => {
  try {
    const foodId =req.params.id;
    const categories = await getFoodById(foodId);
    res.render('admin/food/update-food', { categories,title:'Food Update' });
  } catch (err) {
    res.status(500).send('Error loading form');
  }
};

