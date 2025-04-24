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
  handleAddress,
  handleLocation,
} = require('./userHandlers/userDetailsHandler'); // the file you shared earlie
const { handleOrderHistory, handleLastOrder, handleUserProfile } = require('./userHandlers/userHandler'); // Importing controller functions

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
userBot.hears('history', (ctx) => handleOrderHistory(ctx));
userBot.hears('last order', (ctx) => handleLastOrder(ctx));
userBot.hears('profile', (ctx) => handleUserProfile(ctx));

// Handle callback 
userBot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const message = ctx.callbackQuery.message;

  try {
    // Handle feedback
    if (data.startsWith('feedback_')) {
      // Split the data to extract orderId and reaction
      const [, orderId, reaction] = data.split('_');

      // Log the feedback (you can save it to DB here)
      console.log(`Feedback for order ${orderId}: ${reaction}`);

      // Modify the inline keyboard to highlight the selected button
      const updatedKeyboard = [
        [
          { 
            text: reaction === 'love' ? '❤️ Loved it ✔️' : '❤️ Loved it', 
            callback_data: `feedback_${orderId}_love` 
          },
          { 
            text: reaction === 'tasty' ? '😋 Tasty ✔️' : '😋 Tasty', 
            callback_data: `feedback_${orderId}_tasty` 
          },
          { 
            text: reaction === 'bad' ? '👎 Not good ✔️' : '👎 Not good', 
            callback_data: `feedback_${orderId}_bad` 
          },
          { 
            text: reaction === 'delicious' ? '🍽️ Delicious ✔️' : '🍽️ Delicious', 
            callback_data: `feedback_${orderId}_delicious` 
          },
          { 
            text: reaction === 'okay' ? '👌 Okay ✔️' : '👌 Okay', 
            callback_data: `feedback_${orderId}_okay` 
          }
        ]
      ];

      // Send a reply to acknowledge the feedback submission
      await ctx.answerCbQuery('Thanks for your feedback!');

      // Update the message text to reflect the selected feedback
      await ctx.editMessageText(
        `Feedback for Order ${orderId}: ${
          reaction === 'love' ? '❤️ Loved it' : 
          reaction === 'tasty' ? '😋 Tasty' : 
          reaction === 'bad' ? '👎 Not good' : 
          reaction === 'delicious' ? '🍽️ Delicious' : 
          '👌 Okay'
        } received!`, 
        {
          reply_markup: {
            inline_keyboard: updatedKeyboard,
          }
        }
      );
    }

    // Handle ordering action
    if (data.startsWith('order_now_')) {
      const foodId = data.split('_')[2];
      return placeOrder(ctx, foodId); // Ensure `placeOrder` is defined
    }

    // Handle order confirmation action
    if (data.startsWith('confirm_order_now_')) {
      const foodId = data.split('_')[3];
      return confirmOrder(ctx, foodId); // Ensure `confirmOrder` is defined
    }

    // Handle order cancellation
    if (data.startsWith('cancel_order_now_')) {
      return cancelOrder(ctx); // Ensure `cancelOrder` is defined
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

userBot.on('text', async (ctx) => {
  if (!ctx.session.orderData) return;
  if (!ctx.session.orderData.fullName) return handleFullName(ctx);
  if (!ctx.session.orderData.phoneNumberOne) return handlePhoneNumberOne(ctx);
  if (!ctx.session.orderData.phoneNumberTwo) return handlePhoneNumber(ctx);
  if (!ctx.session.orderData.quantity) return handleQuantity(ctx);
  if (!ctx.session.orderData.specialOrder) return handleSpecialOrder(ctx);
  if (!ctx.session.orderData.address) return handleAddress(ctx);
  if (!ctx.session.orderData.location) return handleLocation(ctx);
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
