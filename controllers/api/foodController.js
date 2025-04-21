// const Food = require('../../models/Food'); // Uncomment when using actual DB

exports.getAllFoods = async (req, res) => {
  try {
    const foods = [
      {
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic Margherita pizza with fresh basil and mozzarella.',
        price: 10.99,
        isAvailable: true,
        category: 'Pizza',
        imageUrl: 'https://images.unsplash.com/photo-1601924582971-d62b5f2bcd35?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        name: 'Beef Burger',
        description: 'Juicy beef patty with cheese, lettuce, and tomato.',
        price: 9.49,
        isAvailable: true,
        category: 'Burgers',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        name: 'Spaghetti Carbonara',
        description: 'Traditional Italian pasta with creamy sauce and bacon.',
        price: 12.75,
        isAvailable: true,
        category: 'Pasta',
        imageUrl: 'https://images.unsplash.com/photo-1603079847937-cd2a92b1c4c5?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 4,
        name: 'Grilled Chicken Salad',
        description: 'Healthy salad with grilled chicken, avocado, and vinaigrette.',
        price: 8.99,
        isAvailable: false,
        category: 'Salads',
        imageUrl: 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 5,
        name: 'French Fries',
        description: 'Crispy golden French fries with ketchup.',
        price: 4.99,
        isAvailable: true,
        category: 'Sides',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 6,
        name: 'Sushi Platter',
        description: 'Fresh assorted sushi with soy sauce and wasabi.',
        price: 15.50,
        isAvailable: true,
        category: 'Japanese',
        imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 7,
        name: 'Chicken Shawarma',
        description: 'Flavor-packed shawarma wrap with garlic sauce.',
        price: 7.95,
        isAvailable: false,
        category: 'Middle Eastern',
        imageUrl: 'https://images.unsplash.com/photo-1631515243347-425d60ad7857?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 8,
        name: 'Pancakes',
        description: 'Fluffy pancakes served with maple syrup and berries.',
        price: 6.49,
        isAvailable: true,
        category: 'Breakfast',
        imageUrl: 'https://images.unsplash.com/photo-1587740896339-64d876c2776b?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 9,
        name: 'Ice Cream Sundae',
        description: 'Vanilla ice cream with chocolate syrup and nuts.',
        price: 5.75,
        isAvailable: true,
        category: 'Desserts',
        imageUrl: 'https://images.unsplash.com/photo-1625941343032-f2b55c383be9?auto=format&fit=crop&w=800&q=80'
      }
    ];

    return foods;
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch food items', error });
  }
};
