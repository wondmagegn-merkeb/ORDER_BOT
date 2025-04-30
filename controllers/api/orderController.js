const { Order, OrderUpdateLog, User, Admin } = require('../../models/index');
const { InternalServerError, NotFoundError } = require('../../utils/customError'); // Import NotFoundError
const updateOrderSchema = require('../../validators/updateOrderValidation');
const { sendMessageToUser } = require("../../bots/userBot");
const { adminBot } = require('../../bots/adminBot'); 

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

    // Get customer
    const customer = await User.findOne({ where: { userId: order.userId } });

    // Proceed only if customer exists and status changed
    if (customer && oldStatus !== status) {
        const orderId = order.orderId || 'N/A';
        const oldPrice = oldTotalPrice ? Number(oldTotalPrice).toFixed(2) : 'N/A';
        const newPrice = newTotalPrice ? Number(newTotalPrice).toFixed(2) : 'N/A';

        let message = '';

        if (status === 'progress') {
            message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Price:</b> ${oldPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
          if (newPrice !== oldPrice) {
            message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
            message += `
<b>Reason for Price Change:</b> ${order.specialOrder || 'This could be due to special order adjustments, such as customized items or delivery-related fees.'}
          \n  `;}

          
message += `
<i>If you have any questions or need any updates, feel free to contact us!</i>
            `;
          
        } else if (status === 'cancelled') {
         
            message = `
❌ <b>Your Order Has Been Cancelled</b>\n
<b>Order ID:</b> ${orderId}\n
<i>We regret to inform you that your order has been cancelled. We understand this might be disappointing and sincerely apologize for any inconvenience caused.</i>\n
<i>If you need more information or would like to discuss any concerns, please don’t hesitate to contact our support team.</i>
            `;

        } else if (status === 'completed') {
          
            message = `
🎉 <b>Your Order Has Been Completed</b> 🎉\n
<b>Order ID:</b> ${orderId}\n
<i>Thank you for your patience! Your order has now been completed. We truly appreciate your trust in us.</i>
            `;
const deliveryAdmins = await Admin.findAll({
    where: { role: 'delivery' }
});
            // If the admin role is 'delivery', send a message to notify them to address the completed food
            if (deliveryAdmins && status === 'completed') {
                const deliveryMessage = `
🚚 <b>Delivery Team, Please Address the Completed Order</b> 🍽️\n
<b>Order ID:</b> ${orderId}\n
<i>The food is now ready for delivery. Please ensure to deliver it to the customer promptly. The details are as follows:</i>\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Ensure that all items are delivered according to the customer's request and address any special order notes.</i>
                `;
            
                

for (const admin of deliveryAdmins) {
    if (admin.telegramId) {
        await adminBot.telegram.sendMessage(admin.telegramId, deliveryMessage, {
            parse_mode: 'HTML'
        });
    }
}

            }
        } else if (status === 'delivered') {
          
            message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Price:</b> ${oldPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
          if (newPrice !== oldPrice) {
            message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
            message += `
<b>Reason for Price Change:</b> ${order.specialOrder || 'This could be due to special order adjustments, such as customized items or delivery-related fees.'}
          \n  `;}
message += `
🙏 <b>We would love to hear your feedback!</b> 📝\n\n
<i>Please let us know if you are satisfied with your order, or if there’s anything we can improve. Your feedback helps us serve you better!</i>\n\n
<i>Feel free to reply to this message or contact us if you need further assistance.</i>

            `;
        }

        if (message && customer.telegramId) {
            await sendMessageToUser(customer.telegramId, message);
        }
    }

    res.locals.success = 'Order updated successfully!';
    return res.render('admin/order/update-order', { title: 'Update Order', order });

  } catch (error) {
    console.log(error)
    next(new InternalServerError('Failed to update order', error));
  }
};
