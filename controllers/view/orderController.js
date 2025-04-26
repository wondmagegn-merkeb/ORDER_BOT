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
  { id: 'guest', name: 'Guest', value: 'guest', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
  { id: 'vip', name: 'VIP', value: 'vip', colorClass: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'customer', name: 'Customer', value: 'customer', colorClass: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'active', name: 'Active', value: 'active', colorClass: 'bg-green-600 hover:bg-green-700' },
  { id: 'inactive', name: 'Inactive', value: 'inactive', colorClass: 'bg-red-600 hover:bg-red-700' },
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
        canEdit: false,
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
