const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { Order, User, Admin } = require('../models/index');
const { placeOrder } = require('./adminHandlers/getHandler'); // update the path as needed
const { notifyUserController } = require('../controllers/api/notificationController');
const {
  viewOrderDetails,
  showOrdersInPending,
  showOrdersInProgress,
  showOrdersInCompleted,
  showOrdersInCancelled,
  showOrdersInDelivered
} = require('./adminHandlers/getHandler');

const adminBot = new Telegraf(process.env.ADMIN_BOT_TOKEN);

// ===== Fetch Admin Role =====
const getAdminRole = async (ctx,telegramId) => {
    try {
        const admin = await Admin.findOne({ where: { telegramId } });
        return admin ? admin.role : null;
    } catch (err) {
        ctx.reply('❌ You are not authorized to use this bot.'+err);
        console.error('Error fetching admin role:', err);
        return null;
    }
};

// ===== Middleware: Authorization =====
adminBot.use(async (ctx, next) => {
    if (!ctx.from) return;
    const role = await getAdminRole(ctx,ctx.from.id);
    if (!role) {
        return ctx.reply('❌ You are not authorized to use this bot.'+role);
    }
    ctx.state.role = role;
    return next();
});

// ===== /start Command with Role-based Menu =====
adminBot.start(async (ctx) => {
    const firstName = ctx.from.first_name || 'Admin';
    const role = ctx.state.role;

    const imagePath = path.join(path.resolve(__dirname, '../../public'), 'welcome.png');
    const imageExists = fs.existsSync(imagePath);

    const fullKeyboard = Markup.keyboard([
        ['📦 Orders in Progress', '⏳ Orders Pending'],
        ['✅ Completed Orders', '📬 Delivered Orders'],
        ['📊 Stats', '🗑️ Cancelled Orders']
    ]).resize();

    const deliveryKeyboard = Markup.keyboard([
        ['✅ Completed Orders', '📬 Delivered Orders']
    ]).resize();

    const welcomeMessage =
        `👋 *Hello ${firstName}*,\n\n` +
        `Welcome to the *Admin Dashboard* of our Telegram Order Bot! 🚀\n\n` +
        `Use the menu below or type a command to get started.`;

    try {
        

        if (imageExists) {
            await ctx.replyWithPhoto({ source: fs.createReadStream(imagePath) }, {
                caption: welcomeMessage,
                parse_mode: 'Markdown',
                ...(role === 'delivery' ? { reply_markup: deliveryKeyboard.reply_markup } : { reply_markup: fullKeyboard.reply_markup })
            });
        } else {
            await ctx.reply(welcomeMessage, {
                parse_mode: 'Markdown',
                ...(role === 'delivery' ? { reply_markup: deliveryKeyboard.reply_markup } : { reply_markup: fullKeyboard.reply_markup })
            });
        }

    } catch (err) {
        console.error('Error sending welcome message:', err);
        await ctx.reply('Something went wrong. Please try again later.'+err);
    }
});

// ===== Order Handlers Based on Role and Status =====
adminBot.hears('📦 Orders in Progress',async  (ctx) =>{
  try {
    if (ctx.state.role === 'delivery' && (status !== 'completed' && status !== 'in_progress')) {
      return ctx.reply('❌ You are not allowed to access this section.');
    }
const status='progress';
    const orders = await Order.findAll({
      where: { status },
      include: [
        { model: User, attributes: ['username', 'fullName', 'phoneNumber1', 'phoneNumber2'] },
        { model: Food, attributes: ['name', 'price', 'imageUrl'] }
      ]
    });

    if (!orders.length) {
      return ctx.reply(`📦 No orders in Progress.`);
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

      
        buttons.push([Markup.button.callback('✅ Mark as Complete', `mark_complete_${order.orderId}`)]);
      

      await ctx.replyWithPhoto(food.imageUrl, {
        caption,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }

  } catch (err) {
    console.error(`❌ Error fetching Progress orders:`, err);
    await ctx.reply(`Something went wrong while loading Progress orders.`+err);
  }
});
adminBot.hears('⏳ Orders Pending', async (ctx) => {
  try {
    if (ctx.state.role === 'delivery' && (status !== 'completed' && status !== 'in_progress')) {
      return ctx.reply('❌ You are not allowed to access this section.');
    }
const status='pending';
    const orders = await Order.findAll({
      where: { status },
      include: [
        { model: User, attributes: ['username', 'fullName', 'phoneNumber1', 'phoneNumber2'] },
        { model: Food, attributes: ['name', 'price', 'imageUrl'] }
      ]
    });

    if (!orders.length) {
      return ctx.reply(`📦 No orders in Progress.`);
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

      
        buttons.push([Markup.button.callback('✅ Mark as Complete', `mark_complete_${order.orderId}`)]);
      

      await ctx.replyWithPhoto(food.imageUrl, {
        caption,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }

  } catch (err) {
    console.error(`❌ Error fetching Progress orders:`, err);
    await ctx.reply(`Something went wrong while loading Progress orders.`+err);
  }});
adminBot.hears('✅ Completed Orders',  (ctx) =>showOrdersInCompletedctx(ctx));
adminBot.hears('🗑️ Cancelled Orders',  (ctx) => showOrdersInCancelled(ctx));
adminBot.hears('📬 Delivered Orders',  (ctx) => showOrdersInDelivered(ctx));

adminBot.hears('📊 Stats', async (ctx) => {
    ctx.reply('📊 Stats feature coming soon!');
});

adminBot.hears('⚙️ Settings', async (ctx) => {
    ctx.reply('⚙️ Settings feature coming soon!');
});

adminBot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  try {
    await ctx.answerCbQuery(); // Acknowledge button click

    // Handle ordering
    if (data.startsWith('view_order_')) {
      const orderId = data.split('_')[2];
      return viewOrderDetails(ctx, orderId);
    }

    // Handle order confirmation (you can implement this function)
    if (data.startsWith('confirm_order_now_')) {
      const foodId = data.split('_')[3];
    //  return confirmOrder(ctx, foodId);
    }

    // Handle cancellation
    if (data.startsWith('cancel_order_now_')) {
     // return cancelOrder(ctx);
    }

  } catch (err) {
    console.error('❌ Error handling callback:', err);
    await ctx.reply('⚠️ <b>Something went wrong while processing your request. Please try again later.</b>', { parse_mode: 'HTML' });
  }
});

module.exports = { adminBot };
