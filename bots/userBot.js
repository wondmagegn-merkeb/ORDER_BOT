const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const path = require('path');
const fs = require('fs');
const { User, Order, Admin } = require('../models/index'); // Assuming User and Order models are defined in your Sequelize setup
const { getMenu } = require('./userHandlers/menuHandler');
const {
  placeOrder,
  confirmOrder,
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
        caption: `🎉 *Welcome aboard, ${firstName}!*\n\n` +
          `We’re thrilled to have you with us! 🛒✨\n` +
          `Get ready to explore a world of delicious options!\n\n` +
          `Here’s what you can do:\n\n` +
          `🍔 *Menu* - Browse a selection of tasty meals\n` +
          `📜 *History* - Check out your past orders\n` +
          `👤 *Profile* - View and manage your personal details\n\n` +
          `👇 Tap any of the options below to get started! We're excited to serve you! 🎉`,
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['view menu', 'last order', 'profile'],
          ['history'],
        ]).resize(),
      });
    } else {
      // Returning user - Displaying a more impressive "Welcome Back" message
      const imagePath = path.resolve(__dirname, '../public/welcome.png');  // Customize image path if needed

      await ctx.replyWithPhoto({ source: fs.createReadStream(imagePath) }, {
        caption: `👋 *Welcome back, ${firstName}!*\n\n` +
          `We’re so glad to see you again! 🎉 We’ve missed you! 😄\n\n` +
          `Here's what's waiting for you:\n\n` +
          `🍽️ *Menu* - Explore our new dishes! Fresh and delicious! 🥳\n` +
          `📝 *History* - Revisit your previous orders. 🍕🍔\n` +
          `👤 *Profile* - Personalize your experience.\n\n` +
          `👇 Choose an option below to continue your order journey!\n\n` +
          `Type *menu* to start ordering or *history* to check your previous orders. 🛍️`,
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['view menu', 'last order', 'profile'],
          ['history'],
        ]).resize(),
      });
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
      return confirmOrder(ctx, foodId);
    }

    // Handle cancellation
    if (data.startsWith('cancel_order_now_')) {
      return cancelOrder(ctx);
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
    if (!ctx.session.orderData.phoneNumberOne) return handlePhoneNumberOne(ctx); // Wait for contact
    if (!ctx.session.orderData.phoneNumberTwo) return handlePhoneNumber(ctx);
    if (!ctx.session.orderData.quantity) return handleQuantity(ctx);
    if (!ctx.session.orderData.specialOrder) return handleSpecialOrder(ctx);
    if (!ctx.session.orderData.location) return handleLocation(ctx);
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

async function sendMessageToUser(telegramId, message, parseMode = 'HTML') {
    try {
        await userBot.telegram.sendMessage(telegramId, message, {
            parse_mode: parseMode
        });
        console.log(`✅ Message sent to user ${telegramId}`);
    } catch (error) {
        console.error(`❌ Failed to send message to user ${telegramId}:`, error);
    }
}

module.exports = { userBot, sendMessageToUser};
