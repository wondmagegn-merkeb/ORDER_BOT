// const Food = require('../../models/Food'); // Comment this out while using demo

exports.getAllFoods = async (req, res) => {
  try {
    // DEMO DATA (simulate from DB)
    const foods = [
      {
        id: 1,
        name: 'Cheese Pizza',
        description: 'Delicious cheese pizza with tomato base.',
        price: 12.99,
        isAvailable: true,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: 2,
        name: 'Veg Burger',
        description: 'Loaded with fresh veggies and sauces.',
        price: 8.5,
        isAvailable: false,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: 3,
        name: 'Pasta Alfredo',
        description: 'Creamy Alfredo pasta with garlic bread.',
        price: 10.75,
        isAvailable: true,
        imageUrl: 'https://via.placeholder.com/150'
      }
    ];

    res.json(foods); // Respond with demo data
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch food items', error });
  }
};
