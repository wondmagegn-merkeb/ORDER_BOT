const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { Order, User, Admin } = require('../models/index');
const { placeOrder } = require('./adminHandlers/getHandler'); // update the path as needed

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
        ['📦 Orders in Progress', '⏳ Orders Pending', '✅ Completed Orders'],
        ['🗑️ Cancelled Orders', '📬 Delivered Orders'],
        ['📊 Stats', '⚙️ Settings']
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

        // Optional: placeOrder when admin joins
        await placeOrder();
    } catch (err) {
        console.error('Error sending welcome message:', err);
        await ctx.reply('Something went wrong. Please try again later.');
    }
});


// ===== Order Handlers Based on Role and Status =====

adminBot.hears('📦 Orders in Progress', async (ctx) => {
    if (ctx.state.role === 'delivery') return ctx.reply('❌ You are not allowed to access this section.');
    const orders = await Order.findAll({ where: { status: 'in_progress' } });
    if (!orders.length) return ctx.reply('📦 No orders in progress.');
    ctx.reply(formatOrders(orders, 'In Progress Orders'));
});

adminBot.hears('⏳ Orders Pending', async (ctx) => {
    if (ctx.state.role === 'delivery') return ctx.reply('❌ You are not allowed to access this section.');
    const orders = await Order.findAll({ where: { status: 'pending' } });
    if (!orders.length) return ctx.reply('⏳ No pending orders.');
    ctx.reply(formatOrders(orders, 'Pending Orders'));
});

adminBot.hears('✅ Completed Orders', async (ctx) => {
    const orders = await Order.findAll({ where: { status: 'completed' } });
    if (!orders.length) return ctx.reply('✅ No completed orders.');
    ctx.reply(formatOrders(orders, 'Completed Orders'));
});

adminBot.hears('🗑️ Cancelled Orders', async (ctx) => {
    if (ctx.state.role === 'delivery') return ctx.reply('❌ You are not allowed to access this section.');
    const orders = await Order.findAll({ where: { status: 'cancelled' } });
    if (!orders.length) return ctx.reply('🗑️ No cancelled orders.');
    ctx.reply(formatOrders(orders, 'Cancelled Orders'));
});

adminBot.hears('📬 Delivered Orders', async (ctx) => {
    const orders = await Order.findAll({ where: { status: 'delivered' } });
    if (!orders.length) return ctx.reply('📬 No delivered orders.');
    ctx.reply(formatOrders(orders, 'Delivered Orders'));
});

adminBot.hears('📊 Stats', async (ctx) => {
    ctx.reply('📊 Stats feature coming soon!');
});

adminBot.hears('⚙️ Settings', async (ctx) => {
    ctx.reply('⚙️ Settings feature coming soon!');
});

// ===== Helper to Format Orders =====
function formatOrders(orders, title) {
    const text = orders.map(order =>
        `🆔 ID: ${order.id}\n📦 Status: ${order.status}\n👤 Customer: ${order.customer_name || 'N/A'}\n---`
    ).join('\n');
    return `*${title}:*\n\n${text}`;
}

module.exports = { adminBot };
