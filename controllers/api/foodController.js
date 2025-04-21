const Food = require('../../models/Food');

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.findAll();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch food items', error });
  }
};
