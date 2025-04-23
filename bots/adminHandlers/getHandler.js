const { Order, User, Food } = require('../../models/index');
const { Markup } = require('telegraf');

async function viewOrderDetails(ctx, orderId) {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, attributes: ['username', 'fullName', 'phoneNumber1', 'phoneNumber2'] },
        { model: Food, attributes: ['name', 'price', 'description', 'imageUrl'] }
      ]
    });

    if (!order) {
      return ctx.reply('Order not found.');
    }

    const food = order.Food;
    const googleMapsLink = `[📍 View Map](https://www.google.com/maps?q=${order.latitude},${order.longitude})`;

    const caption =
      `📝 *Order ID:* ${order.orderId}\n` +
      `🧍 *Customer:* ${order.User.fullName}\n` +
      `👤 *Username:* @${order.User?.username || 'N/A'}\n` +
      `🛍️ *Food:* ${food?.name}\n` +
      `💵 *Price per Unit:* ${food?.price} birr\n` +
      `🔢 *Quantity:* ${order.quantity}\n` +
      `💰 *Price (old):* ${order.totalPrice} birr\n` +
      `💰 *Price (new):* ${order.newTotalPrice} birr\n` +
      `📞 *Phone 1:* ${order.User.phoneNumber1}\n` +
      `📞 *Phone 2:* ${order.User.phoneNumber2}\n` +
      `📝 *Special Note:* ${order.specialOrder || 'None'}\n` +
      `🚚 *Status:* ${order.status}\n\n` +
      `${googleMapsLink}`;

    await ctx.replyWithPhoto(food.imageUrl, {
      caption,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🚚 Mark In Progress', `mark_inprogress_${order.orderId}`)],
        [Markup.button.callback('❌ Cancel Order', `cancel_order_${order.orderId}`)]
      ])
    });

  } catch (err) {
    console.error('❌ Error viewing order:', err);
    await ctx.reply('Something went wrong while viewing order details.');
  }
}

async function showOrdersByStatus(ctx, status, label) {
  try {
    if (ctx.state.role === 'delivery' && (status !== 'completed' && status !== 'in_progress')) {
      return ctx.reply('❌ You are not allowed to access this section.');
    }

    const orders = await Order.findAll({
      where: { status },
      include: [
        { model: User, attributes: ['username', 'fullName', 'phoneNumber1', 'phoneNumber2'] },
        { model: Food, attributes: ['name', 'price', 'imageUrl'] }
      ]
    });

    if (!orders.length) {
      return ctx.reply(`📦 No orders in ${label}.`);
    }

    for (const order of orders) {
      const food = order.Food;
      const user = order.User;
      const googleMapsLink = `[📍 View Map](https://www.google.com/maps?q=${order.latitude},${order.longitude})`;

      const caption =
        `📝 *Order ID:* ${order.orderId}\n` +
        `🧍 *Customer:* ${user.fullName}\n` +
        `👤 *Username:* @${user.username || 'N/A'}\n` +
        `🛍️ *Food:* ${food.name}\n` +
        `💵 *Price per Unit:* ${food.price} birr\n` +
        `🔢 *Quantity:* ${order.quantity}\n` +
        `💰 *Total:* ${order.newTotalPrice} birr\n` +
        `📞 *Phone 1:* ${user.phoneNumber1}\n` +
        `📞 *Phone 2:* ${user.phoneNumber2}\n` +
        `🚚 *Status:* ${order.status}\n` +
        `${googleMapsLink}`;

      const buttons = [];

      if (status === 'in_pending') {
        buttons.push([Markup.button.callback('🚚 Mark In Progress', `mark_inprogress_${order.orderId}`)]);
        buttons.push([Markup.button.callback('❌ Cancel Order', `cancel_order_${order.orderId}`)]);
      } else if (status === 'in_progress') {
        buttons.push([Markup.button.callback('✅ Mark as Complete', `mark_complete_${order.orderId}`)]);
      }else if (status === 'completed') {
        buttons.push([Markup.button.callback('✅ Mark as Delivered', `mark_delivered_${order.orderId}`)]);
      }

      await ctx.replyWithPhoto(food.imageUrl, {
        caption,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }

  } catch (err) {
    console.error(`❌ Error fetching ${status} orders:`, err);
    await ctx.reply(`Something went wrong while loading ${label} orders.`);
  }
}

const showOrdersInProgress = (ctx) => showOrdersByStatus(ctx, 'in_progress', 'progress');
const showOrdersInPending = (ctx) => showOrdersByStatus(ctx, 'in_pending', 'pending');
const showOrdersInCompleted = (ctx) => showOrdersByStatus(ctx, 'completed', 'completed');
const showOrdersInCancelled = (ctx) => showOrdersByStatus(ctx, 'cancelled', 'cancelled');
const showOrdersInDelivered = (ctx) => showOrdersByStatus(ctx, 'delivered', 'delivered');

module.exports = {
  viewOrderDetails,
  showOrdersInProgress,
  showOrdersInPending,
  showOrdersInCompleted,
  showOrdersInCancelled,
  showOrdersInDelivered
};
