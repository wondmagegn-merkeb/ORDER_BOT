const { Order, Food, User } = require('../../models/index');

// Helper to format date
const formatDate = (date) =>
  new Date(date).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Order History Handler
async function handleOrderHistory(ctx) {
  const telegramId = ctx.from.id.toString();

  try {
    
    const user = await User.findOne({ where: { telegramId } });
const orders = await Order.findAll({
      where: { userId: user.userId },
      include: [Food],
      order: [['createdAt', 'DESC']],
    });

    if (!orders.length) {
      return ctx.reply('You have no past orders yet. Start by placing an order!');
    }

    for (const order of orders) {
      const food = order.Food;

      const mapLink = order.latitude && order.longitude
        ? `\n🗺️ <a href="https://maps.google.com/?q=${order.latitude},${order.longitude}">View Location</a>`
        : '';

      const caption = `<b>📦 Order ID:</b> ${order.orderId}\n` +
        `🍔 <b>Food:</b> ${food.name || 'Unknown'}\n` +
        `📍 <b>Address:</b> ${order.location || 'Not provided'}\n` +
        `💰 <b>Total Price:</b> ${order.newTotalPrice} birr\n` +
        `📝 <b>Special Order:</b> ${order.specialOrder || 'None'}\n` +
        `📅 <b>Date:</b> ${formatDate(order.createdAt)}\n` +
        `📌 <b>Status:</b> ${order.status} ${mapLink}`;

      if (food?.imageUrl) {
        await ctx.replyWithPhoto(food.imageUrl, {
          caption,
          parse_mode: 'HTML',
        });
      } else {
        await ctx.replyWithHTML(caption);
      }
    }
  } catch (err) {
    console.error('Error fetching order history:', err);
    ctx.reply('Sorry, there was an issue fetching your order history. Please try again later.');
  }
}

// Last Order Handler
async function handleLastOrder(ctx) {
  const telegramId = ctx.from.id.toString();

  try {
    const user = await User.findOne({ where: { telegramId } });
    const lastOrder = await Order.findOne({
      where: { userId: user.userId },
      include: [Food],
      order: [['createdAt', 'DESC']],
    });

    
    if (!user) {
      return ctx.reply('You are not registered yet. Please send /start to get started!');
    }

    if (!lastOrder) {
      return ctx.reply('You don\'t have a last order yet. Place an order to see it here!');
    }

    const food = lastOrder.Food;

    const mapLink = lastOrder.latitude && lastOrder.longitude
      ? `\n🗺️ <a href="https://maps.google.com/?q=${lastOrder.latitude},${lastOrder.longitude}">View Location</a>`
      : '';

    const caption = `<b>🧾 Your Last Order</b>\n\n` +
      `📦 <b>Order ID:</b> ${lastOrder.orderId}\n` +
      `🍕 <b>Food:</b> ${food?.name || 'Unknown'}\n` +
      `📍 <b>Address:</b> ${lastOrder.location || 'Not provided'}\n` +
      `💰 <b>Total Price:</b> ${lastOrder.newTotalPrice} birr\n` +
      `📝 <b>Special Order:</b> ${lastOrder.specialOrder || 'None'}\n` +
      `📅 <b>Date:</b> ${formatDate(lastOrder.createdAt)}\n` +
      `📌 <b>Status:</b> ${lastOrder.status} ${mapLink}`;

    if (food?.imageUrl) {
      await ctx.replyWithPhoto(food.imageUrl, {
        caption,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.replyWithHTML(caption);
    }
  } catch (err) {
    console.error('Error fetching last order:', err);
    ctx.reply('Sorry, there was an issue fetching your last order. Please try again later.');
  }
}

// User Profile Handler
async function handleUserProfile(ctx) {
  const telegramId = ctx.from.id.toString();

  try {
    const user = await User.findOne({ where: { telegramId } });

    if (!user) {
      return ctx.reply('You are not registered yet. Please send /start to get started!');
    }

    const caption = `👤 <b>Your Profile</b>\n\n` +
      `📛 <b>Full Name:</b> ${user.fullName || 'Not set'}\n` +
      `📞 <b>Phone 1:</b> ${user.phoneNumber1 || 'Not set'}\n` +
      `📞 <b>Phone 2:</b> ${user.phoneNumber2 || 'N/A'}\n` +
      `🆔 <b>Username:</b> @${user.username}\n` +
      `👥 <b>User Type:</b> ${user.userType}\n` +
      `📱 <b>Status:</b> ${user.status}`;

    await ctx.replyWithHTML(caption);
  } catch (err) {
    console.error('Error fetching profile:', err);
    ctx.reply('Sorry, there was an issue fetching your profile. Please try again later.');
  }
}

module.exports = {
  handleOrderHistory,
  handleLastOrder,
  handleUserProfile,
};
