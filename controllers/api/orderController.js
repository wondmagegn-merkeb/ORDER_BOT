const { Order, OrderUpdateLog } = require('../../models');
const { InternalServerError } = require('../../utils/customError');
const updateOrderSchema = require('../../validators/updateOrderValidation');
// Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll();
    return orders; // Or render as needed
  } catch (error) {
    next(new InternalServerError('Failed to fetch orders', error));
  }
};

// Get an order by ID
exports.getOrderById = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId);

    if (!order) {
      res.locals.error =  'Order not found';
      return res.render('admin/order/list-order', { title: 'List Order' }); // Rend
    }

    return order;
  } catch (error) {
    next(new InternalServerError('Failed to fetch order', error));
  }
};

// Update only price and status
exports.updateOrder = async (req, res, next) => {
  try {
    
    
    
const { error } = updateOrderSchema.validate(req.body);
    if (error) {
      // Handle validation error
      res.locals.error = error.details[0].message;
      return res.render('admin/order/update-order', { title: 'Update Order' }); // Render the update page with error message
    }
   const { newTotalPrice, status } = req.body;
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId);
    if (!order) {
      res.locals.error = 'Order not found';
      return res.render('admin/order/update-order', { title: 'Update Order' });
    }

    // Check if the update is for totalPrice or status
    const oldTotalPrice = order.totalPrice;
    const oldStatus = order.status;

    // Update the fields
     order.newTotalPrice = newTotalPrice;
     order.status = status;
     order.updatedBy = req.admin.adminId;

    await order.save();

    res.locals.success = 'Order updated successfully!';
    return res.render('admin/order/update-order', { title: 'Update Order' });
  } catch (error) {
    next(new InternalServerError('Failed to update order', error));
  }
};
