const { getAllFoods } = require('../api/foodController');

exports.renderFoodList = async (req, res) => {
  try {
    const foods = await getAllFoods(); // Will return JSON from API controller
    res.render('food/list-food', { foods });
  } catch (error) {
    res.status(500).send('Unable to load food items.');
  }
};
