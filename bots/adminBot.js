const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { Order, User, Admin,Food } = require('../models/index');
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
const tempStates = {}; // Temporary in-memory state tracking
// ===== Fetch Admin Role =====
const getAdminRole = async (ctx, telegramId) => {
  try {
    const admin = await Admin.findOne({ where: { telegramId } });

    if (!admin) {
      return null;
    }

    ctx.state.adminId = admin.adminId;
    return admin.role;
  } catch (err) {
    console.error('Error fetching admin role:', err);
    await ctx.reply('❌ An error occurred while checking authorization.');
    return null;
  }
};

// ===== Middleware: Authorization =====
adminBot.use(async (ctx, next) => {
    if (!ctx.from) return;
    const role = await getAdminRole(ctx,ctx.from.id);
    if (!role) {
        return ctx.reply('❌ You are not authorized to use this bot.');
    }
    ctx.state.role = role;
    return next();
});

// ===== /start Command with Role-based Menu =====
adminBot.start(async (ctx) => {
    const firstName = ctx.from.first_name || 'Admin';
    const role = ctx.state.role;

    const imagePath = path.resolve(__dirname, '../public/welcome.png');
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
adminBot.hears('📦 Orders in Progress',  (ctx) => showOrdersInProgress(ctx));
adminBot.hears('⏳ Orders Pending',  (ctx) => showOrdersInPending(ctx));
adminBot.hears('✅ Completed Orders',  (ctx) =>showOrdersInCompleted(ctx));
adminBot.hears('🗑️ Cancelled Orders',  (ctx) => showOrdersInCancelled(ctx));
adminBot.hears('📬 Delivered Orders',  (ctx) => showOrdersInDelivered(ctx));
adminBot.hears('📊 Stats', async (ctx) => {
    ctx.reply('📊 Stats feature coming soon!');
});

adminBot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const adminId = ctx.state.adminId;
  try {
    await ctx.answerCbQuery(); // Acknowledge button click

    // Handle ordering
    if (data.startsWith('view_order_')) {
      const orderId = data.split('_')[2];
      return viewOrderDetails(ctx, orderId);
    }

     // ----- Mark Order In Progress (ask for price edit) -----
    if (data.startsWith('mark_inprogress_')) {
        const orderId = data.split('_')[2];
        tempStates[ctx.from.id] = { action: 'confirm_edit_price', orderId };
        await ctx.answerCbQuery();
        return ctx.reply('📝 Do you want to edit the price before marking this order as *in progress*?', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Yes', `edit_price_yes_${orderId}`)],
                [Markup.button.callback('❌ No', `edit_price_no_${orderId}`)]
            ])
        });
    }

    // ----- Admin Chooses to Edit Price -----
    if (data.startsWith('edit_price_yes_')) {
        const orderId = data.split('_')[3];
        tempStates[ctx.from.id] = { action: 'awaiting_price_input', orderId };
        await ctx.answerCbQuery();
        return ctx.reply('💰 Please send the *new price* for the order:', { parse_mode: 'Markdown' });
    }

    // ----- Admin Chooses Not to Edit Price -----
    if (data.startsWith('edit_price_no_')) {
        const orderId = data.split('_')[3];
        await ctx.answerCbQuery();
        try {
            const order = await Order.findByPk(orderId);
            if (!order) return ctx.reply('❌ Order not found.');
            order.updatedBy = adminId;
            order.status = 'progress';
            await order.save();
            return ctx.reply('🚚 Order marked as *In Progress* successfully!', { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('❌ Error updating order:', err);
            return ctx.reply('Something went wrong while updating the order.');
        }
    }

    // ----- Mark Order as Completed -----
    if (data.startsWith('mark_completed_')) {
        const orderId = data.split('_')[2];
        await ctx.answerCbQuery();
        try {
            const order = await Order.findByPk(orderId);
            if (!order) return ctx.reply('❌ Order not found.');
            order.updatedBy = adminId;
            order.status = 'completed';
            await order.save();
            return ctx.reply('✅ Order marked as *Completed* successfully!', { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('❌ Error updating order status to completed:', err);
            return ctx.reply('Something went wrong while marking the order as completed.');
        }
    }

    // ----- Mark Order as Completed -----
    if (data.startsWith('mark_delivered_')) {
        const orderId = data.split('_')[2];
        await ctx.answerCbQuery();
        try {
            const order = await Order.findByPk(orderId);
            if (!order) return ctx.reply('❌ Order not found.');
            order.updatedBy = adminId;
            order.status = 'delivered';
            await order.save();
            return ctx.reply('✅ Order marked as *Delivered* successfully!', { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('❌ Error updating order status to delivered:', err);
            return ctx.reply('Something went wrong while marking the order as delivered.');
        }
    }

    // ----- Cancel Order: Ask for confirmation -----
    if (data.startsWith('cancel_order_')) {
        const orderId = data.split('_')[2];
        await ctx.answerCbQuery();
        return ctx.reply('❗ Are you sure you want to cancel this order?', {
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Yes, Cancel Order', `confirm_cancel_${orderId}`)],
                [Markup.button.callback('↩️ No, Go Back', 'cancel_back')]
            ])
        });
    }
   
    if (data === 'cancel_back') {
        await ctx.answerCbQuery('Action cancelled');
        return ctx.reply('✅ Action cancelled. You can continue managing your orders.');
    }
    
    // ----- Confirm Cancellation -----
    if (data.startsWith('confirm_cancel_')) {
        const orderId = data.split('_')[2];
        try {
            const order = await Order.findByPk(orderId);
            if (!order) return ctx.reply('❌ Order not found.');
            order.updatedBy = adminId;
            order.status = 'cancelled';
            await order.save();
            return ctx.reply('✅ Order has been successfully cancelled.', { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('❌ Error cancelling order:', err);
            return ctx.reply('Something went wrong while cancelling the order.');
        }
    }
  } catch (err) {
    console.error('❌ Error handling callback:', err);
    await ctx.reply('⚠️ <b>Something went wrong while processing your request. Please try again later.</b>', { parse_mode: 'HTML' });
  }
});

adminBot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const state = tempStates[userId];
  const adminId = ctx.state.adminId;
  if (state?.action === 'awaiting_price_input') {
    const newPrice = parseFloat(ctx.message.text);

    if (isNaN(newPrice) || newPrice <= 0) {
      return ctx.reply('❌ Invalid price. Please enter a valid number greater than 0.');
    }

    try {
      const order = await Order.findByPk(state.orderId);
      if (!order) return ctx.reply('❌ Order not found.');
      
      order.updatedBy = adminId;
      order.newTotalPrice = newPrice;
      order.status = 'progress';
      await order.save();

      delete tempStates[userId];

      return ctx.reply(`✅ Order price updated to *${newPrice}* and marked as *In Progress*!`, {
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error('Error updating order price:', err);
      return ctx.reply('❌ Failed to update order. Please try again later.'+err);
    }
  }

  // If no state, let the bot ignore or handle other inputs normally
});

module.exports = { adminBot };
