const {
  getAllOrders,
  getOrderById,
} = require('../api/orderController');
const { InternalServerError } = require('../../utils/customError');

// List all orders
exports.listOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders(); // Fetch all orders
    const models = orders;

    const modelColumns = [
      { name: 'Order ID', field: 'orderId', index: 0 },
      { name: 'User ID', field: 'userId', index: 1 },
      { name: 'Location', field: 'location', index: 2 },
      { name: 'Feedback', field: 'feedback', index: 3 },
      { name: 'Total Price', field: 'totalPrice', index: 4 },
      { name: 'New Total Price', field: 'newTotalPrice', index: 5 },
      { name: 'Status', field: 'status', index: 6 }
    ];

const filters = [
  { id: 'pending', name: 'Pending', value: 'pending', colorClass: 'bg-yellow-400 hover:bg-yellow-500' },
  { id: 'progress', name: 'In Progress', value: 'progress', colorClass: 'bg-blue-400 hover:bg-blue-500' },
  { id: 'completed', name: 'Completed', value: 'completed', colorClass: 'bg-green-500 hover:bg-green-600' },
  { id: 'cancelled', name: 'Cancelled', value: 'cancelled', colorClass: 'bg-red-500 hover:bg-red-600' },
  { id: 'delivered', name: 'Delivered', value: 'delivered', colorClass: 'bg-indigo-500 hover:bg-indigo-600' },
  { id: 'tasty', name: 'Tasty', value: 'tasty', colorClass: 'bg-pink-400 hover:bg-pink-500' },
  { id: 'love', name: 'Love', value: 'love', colorClass: 'bg-rose-500 hover:bg-rose-600' },
  { id: 'delicious', name: 'Delicious', value: 'delicious', colorClass: 'bg-orange-400 hover:bg-orange-500' },
  { id: 'good', name: 'Good', value: 'good', colorClass: 'bg-green-400 hover:bg-green-500' },
  { id: 'okay', name: 'Okay', value: 'okay', colorClass: 'bg-gray-400 hover:bg-gray-500' },
  { id: 'bad', name: 'Bad', value: 'bad', colorClass: 'bg-red-400 hover:bg-red-500' },
];



    res.render('admin/order/list-order', {
      title: 'Order List',
      models,
      modelColumns,
      filters,
      modelName: 'User',
      modelNameLower: 'users',
      permissions: {
        canView: true,
        canAdd: false,
        canEdit: true,
        canDelete: false,
      },
    });
    
  } catch (error) {
    next(new InternalServerError('Failed to list orders', error));
  }
};

// Show the form to edit an existing order
exports.showEditOrderForm = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    
    // Fetch the order by ID using the orderController's method
    const order = await getOrderById(orderId);

    // If the order is not found, return a 404 error
    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Render the order edit page with the order details
    res.render('admin/order/update-order', { order, title: 'Update Order' });
  } catch (error) {
    next(new InternalServerError('Failed to fetch order for editing', error));
  }
};
