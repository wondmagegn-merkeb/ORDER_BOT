const {
  getAllOrders,
  getOrderById,
} = require('../api/orderController');
const { InternalServerError } = require('../../utils/customError');

// List all orders
exports.listOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders(); // Fetch all orders
    res.render('admin/order/list-order', { orders, title: 'Order List' });
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
