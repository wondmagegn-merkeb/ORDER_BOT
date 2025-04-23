const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const path = require('path');
const fs = require('fs');
const { User, Order } = require('../models/index'); // Assuming User and Order models are defined in your Sequelize setup
const { getMenu } = require('./userHandlers/menuHandler');
const {
  placeOrder,
  cancelOrder
} = require('./userHandlers/orderHandler');
const {
  handleFullName,
  handlePhoneNumberOne,
  handlePhoneNumber,
  handleQuantity,
  handleSpecialOrder,
  handleLocation,
  
} = require('./userHandlers/userDetailsHandler'); // the file you shared earlie

const userBot = new Telegraf(process.env.USER_BOT_TOKEN);

// Session support
userBot.use(new LocalSession({ database: 'session_db.json' }).middleware());

// /start command
userBot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const username = ctx.from.username;
  const firstName = ctx.from.first_name || '';

  try {
    let user = await User.findOne({ where: { telegramId } });

    if (!user) {
      const lastUser = await User.findOne({
        order: [['createdAt', 'DESC']],
      });

      let newIdNumber = 1;

      if (lastUser && lastUser.userId) {
        const lastNumber = parseInt(lastUser.userId.replace('USR', ''));
        newIdNumber = lastNumber + 1;
      }

      const userId = 'USR' + String(newIdNumber).padStart(3, '0');
      user = await User.create({ userId, telegramId, username });

      const imagePath = path.resolve(__dirname, '../public/welcome.png');
      await ctx.replyWithPhoto({ source: fs.createReadStream(imagePath) }, {
        caption: `👋 Welcome ${firstName} to our Telegram Order Bot! 🛒\n\n` +
          `📋 Use *menu* – to explore all available items\n` +
          `🕘 Use *history* – to view your past orders\n` +
          `👤 Use *profile* – to view your profile\n\n` +
          `👇 Choose an option below to get started.`,
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['view menu', 'last order', 'profile'],
          ['history'],
        ]).resize(),
      });
    } else {
      await ctx.reply(`Welcome back, ${firstName}! Type *menu* to start ordering.`);
    }
  } catch (err) {
    console.error('Error handling /start:', err);
    ctx.reply('Something went wrong. Please try again later.');
  }
});

// /view menu command
userBot.hears('view menu', (ctx) => getMenu(ctx));

// Handle callback queries
userBot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  try {
    await ctx.answerCbQuery(); // Acknowledge button click

    // Handle ordering
    if (data.startsWith('order_now_')) {
      const foodId = data.split('_')[2];
      return placeOrder(ctx, foodId);
    }

    // Handle order confirmation (you can implement this function)
    if (data.startsWith('confirm_order_now_')) {
      const foodId = data.split('_')[3];
      // return confirmOrder(ctx, foodId);
    }

    // Handle cancellation
    if (data.startsWith('cancel_order_now_')) {
      //return cancelOrder(ctx);
    }

  } catch (err) {
    console.error('❌ Error handling callback:', err);
    await ctx.reply('⚠️ <b>Something went wrong while processing your request. Please try again later.</b>', { parse_mode: 'HTML' });
  }
});

userBot.on('contact', (ctx) => {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('Session expired. Please restart your order.');
    }

    const phoneNumberOne = ctx.message.contact.phone_number;
    ctx.session.orderData.phoneNumberOne = phoneNumberOne;

    return handlePhoneNumberOne(ctx);
});

userBot.on('location', (ctx) => {
    if (ctx.session.orderData && !ctx.session.orderData.location) {
        return handleLocation(ctx);
    }
});

userBot.on('text', (ctx) => {
    if (!ctx.session.orderData) return;
    if (!ctx.session.orderData.fullName) return handleFullName(ctx);
    if (!ctx.session.orderData.phoneNumberOne) return; // Wait for contact
    if (!ctx.session.orderData.phoneNumberTwo) return handlePhoneNumber(ctx);
    if (!ctx.session.orderData.quantity) return handleQuantity(ctx);
    if (!ctx.session.orderData.specialOrder) return handleSpecialOrder(ctx);
});

// /history command
userBot.hears('history', async (ctx) => {
  const telegramId = ctx.from.id.toString();

  try {
    const orders = await Order.findAll({
      where: { telegramId },
      order: [['createdAt', 'DESC']],
    });

    if (orders.length === 0) {
      return ctx.reply('You have no past orders yet. Start by placing an order!');
    }

    let historyMessage = '🕘 Your order history:\n\n';
    orders.forEach((order, index) => {
      historyMessage += `${index + 1}. Order ID: ${order.id} | Status: ${order.status} | Date: ${order.createdAt}\n`;
    });

    await ctx.reply(historyMessage);
  } catch (err) {
    console.error('Error fetching order history:', err);
    ctx.reply('Sorry, there was an issue fetching your order history. Please try again later.');
  }
});

// /last order command
userBot.hears('last order', async (ctx) => {
  const telegramId = ctx.from.id.toString();

  try {
    const lastOrder = await Order.findOne({
      where: { telegramId },
      order: [['createdAt', 'DESC']],
    });

    if (!lastOrder) {
      return ctx.reply('You don\'t have a last order yet. Place an order to see it here!');
    }

    const orderMessage = `🛒 Last Order:\n\n` +
      `Order ID: ${lastOrder.id}\n` +
      `Status: ${lastOrder.status}\n` +
      `Items: ${lastOrder.items}\n` + // Assuming 'items' is a field in the order model
      `Date: ${lastOrder.createdAt}`;

    await ctx.reply(orderMessage);
  } catch (err) {
    console.error('Error fetching last order:', err);
    ctx.reply('Sorry, there was an issue fetching your last order. Please try again later.');
  }
});

// /profile command
userBot.hears('profile', async (ctx) => {
  const telegramId = ctx.from.id.toString();

  try {
    const user = await User.findOne({ where: { telegramId } });

    if (!user) {
      return ctx.reply('You are not registered yet. Please send /start to get started!');
    }

    const profileMessage = `👤 Your Profile:\n\n` +
      `Username: ${user.username}\n` +
      `User Type: ${user.userType}\n` +
      `Status: ${user.status}\n`;

    await ctx.reply(profileMessage);
  } catch (err) {
    console.error('Error fetching profile:', err);
    ctx.reply('Sorry, there was an issue fetching your profile. Please try again later.');
  }
});

// Command to handle item ordering (e.g., ordering pizza)
userBot.hears('order item', async (ctx) => {
  const telegramId = ctx.from.id.toString();

  // Example logic for ordering Pizza (can be dynamic based on user selection)
  const selectedItem = menuItems[0]; // Example: ordering Pizza
  const item = selectedItem;

  if (!item) {
    return ctx.reply('Item not available.');
  }

  try {
    const newOrder = await Order.create({
      telegramId,
      items: item.name,
      status: 'Pending',
      price: item.price,
    });

    ctx.reply(`Your order for *${item.name}* has been placed!\nStatus: ${newOrder.status}\nTotal: ${newOrder.price}`, {
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Error placing order:', err);
    ctx.reply('Sorry, there was an issue placing your order. Please try again later.');
  }
});

module.exports = { userBot };
