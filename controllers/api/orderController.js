const { Order, OrderUpdateLog, User } = require('../../models');
const { InternalServerError, NotFoundError } = require('../../utils/customError'); // Import NotFoundError
const updateOrderSchema = require('../../validators/updateOrderValidation');
const { sendMessageToUser } = require("../../bots/userBot");

// Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll();
    return orders;
  } catch (error) {
    next(new InternalServerError('Failed to fetch orders', error));
  }
};

// Get order by ID
exports.getOrderById = async (orderId, res, next) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return next(new NotFoundError('Order not found')); // Use custom NotFoundError
    }
    return order;
  } catch (error) {
    next(new InternalServerError('Failed to fetch order', error));
  }
};

// Update order (price and status)
exports.updateOrder = async (req, res, next) => {
  try {
    const { error } = updateOrderSchema.validate(req.body);
    const { newTotalPrice, status } = req.body;
    const orderId = req.params.id;
    const orderData = { status, totalPrice: newTotalPrice, orderId };

    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/order/update-order', { title: 'Update Order', order: orderData });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return next(new NotFoundError('Order not found')); // Use custom NotFoundError
    }

    const oldTotalPrice = order.totalPrice;
    const oldStatus = order.status;

    order.newTotalPrice = newTotalPrice;
    order.status = status;
    order.updatedBy = req.admin.adminId;

    await order.save();

    // Notify all admins via Telegram
    const users = await User.findAll();

    const message = `
✅ <b>Order Updated</b>
<b>Order ID:</b> ${order.orderId}
<b>Old Price:</b> ${oldTotalPrice} birr
<b>New Price:</b> ${newTotalPrice} birr
<b>Old Status:</b> ${oldStatus}
<b>New Status:</b> ${status}
<b>Updated By:</b> ${req.admin.username || req.admin.adminId}
    `;

    await sendMessageToUser(users.telegramId, message);

    res.locals.success = 'Order updated successfully!';
    return res.render('admin/order/update-order', { title: 'Update Order', order });

  } catch (error) {
    next(new InternalServerError('Failed to update order', error));
  }
};
