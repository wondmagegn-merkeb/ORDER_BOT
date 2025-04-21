const { getAllFoods } = require('../api/foodController');

exports.renderFoodList = async (req, res) => {
  try {
    const foods = await getAllFoods(); // Will return JSON from API controller
    res.render('admin/food/list-food', { foods ,title:'Food List'});
  } catch (error) {
    res.status(500).send('Unable to load food items.');
  }
};
