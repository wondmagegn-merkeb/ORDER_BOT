const {
  getAllOrders,
  getOrderById,
} = require('../api/orderController');
const { InternalServerError } = require('../../utils/customError');

// List all orders
exports.listOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    const models = orders;

    const modelColumns = [
      { name: 'Order ID', field: 'orderId', index: 0 },
      { name: 'User ID', field: 'userId', index: 1 },
      { name: 'Location', field: 'location', index: 2 },
      { name: 'Feedback', field: 'feedback', index: 3 },
      { name: 'Total Price', field: 'totalPrice', index: 4 },
      { name: 'New Total Price', field: 'newTotalPrice', index: 5 },
      { name: 'Status', field: 'status', index: 6 },
    ];

    const filters = [
      { id: 'pending', name: 'Pending', value: 'pending', colorClass: 'bg-purple-500 hover:bg-purple-500' },
      { id: 'progress', name: 'In Progress', value: 'progress', colorClass: 'bg-blue-500 hover:bg-blue-600' },
      { id: 'completed', name: 'Completed', value: 'completed', colorClass: 'bg-green-500 hover:bg-green-600' },
      { id: 'cancelled', name: 'Cancelled', value: 'cancelled', colorClass: 'bg-red-500 hover:bg-red-600' },
      { id: 'delivered', name: 'Delivered', value: 'delivered', colorClass: 'bg-indigo-500 hover:bg-indigo-600' },
      { id: 'tasty', name: 'Tasty', value: 'tasty', colorClass: 'bg-pink-500 hover:bg-pink-600' },
      { id: 'love', name: 'Love', value: 'love', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
      { id: 'delicious', name: 'Delicious', value: 'delicious', colorClass: 'bg-blue-400 hover:bg-blue-500' },
      { id: 'good', name: 'Good', value: 'good', colorClass: 'bg-green-400 hover:bg-green-500' },
      { id: 'okay', name: 'Okay', value: 'okay', colorClass: 'bg-red-400 hover:bg-red-500' },
      { id: 'bad', name: 'Bad', value: 'bad', colorClass: 'bg-indigo-400 hover:bg-indigo-500' },
    ];

    res.render('admin/order/list-order', {
      title: 'Order List',
      models,
      modelColumns,
      filters,
      modelName: 'Order',
      modelNameLower: 'orders',
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

    const order = await getOrderById(orderId);

    res.render('admin/order/update-order', { order, title: 'Update Order' });
  } catch (error) {
    next(new InternalServerError('Failed to fetch order for editing', error));
  }
};
