const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const path = require('path');
const fs = require('fs');
const { User, Order } = require('../models/index');

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
      user = await User.create({ telegramId, username });
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
          ['history']
        ]).resize()
      });
    } else {
      //start(ctx, 'menu');
    }
  } catch (err) {
    console.error('Error handling /start:', err);
    ctx.reply('Something went wrong. Please try again later.');
  }
});

// /view menu command
userBot.hears('view menu', async (ctx) => {
  try {
    // Example menu items; you could fetch them from a database or API
    const menuItems = [
      { name: 'Pizza', price: '10$', description: 'Delicious cheese pizza' },
      { name: 'Burger', price: '5$', description: 'Juicy beef burger' },
      { name: 'Pasta', price: '8$', description: 'Pasta with marinara sauce' }
    ];

    let menuMessage = '🍽️ Here are the available menu items:\n\n';
    menuItems.forEach((item, index) => {
      menuMessage += `${index + 1}. *${item.name}* - ${item.price}\n  *Description*: ${item.description}\n\n`;
    });

    await ctx.reply(menuMessage, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error fetching menu:', err);
    ctx.reply('Sorry, there was an issue fetching the menu. Please try again later.');
  }
});

// /history command
userBot.hears('history', async (ctx) => {
  const telegramId = ctx.from.id.toString();

  try {
    const orders = await Order.findAll({ where: { telegramId }, order: [['createdAt', 'DESC']] });

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
      order: [['createdAt', 'DESC']]
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

module.exports = { userBot };
