const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

const { Order, User } = require('../models/index');

const botAdmin = new Telegraf(process.env.ADMIN_BOT_TOKEN);
// ===== Allowed admin IDs =====
const ADMIN_IDS = ['800439459']; // Replace with real admin Telegram IDs

// ===== Admin authentication middleware =====
botAdmin.use((ctx, next) => {
    if (!ADMIN_IDS.includes(String(ctx.from.id))) {
        return ctx.reply('❌ You are not authorized to use this bot.');
    }
    return next();
});

const tempStates = {}; // Temporary in-memory state tracking

// ===== /start command with dashboard stats =====
botAdmin.start(async (ctx) => {
    const firstName = ctx.from.first_name || 'Admin';
    
    try {
        const imagePath = path.join(path.resolve(__dirname, '../../public'), 'welcome.png');
        await ctx.replyWithPhoto({ source: fs.createReadStream(imagePath) }, {
            caption:
                `👋 Hello *${firstName}*,\n\n` +
                `Welcome to the *Admin Dashboard* of our Telegram Order Bot! 🛠️\n\n` +
                `Here, you can:\n` +
                `📦 View, update, and manage all customer orders\n` +
                `📊 Monitor order statuses in real time\n\n` +
                `Use the menu or type a command to get started.\n\n` +
                `Thanks for managing our orders like a pro! 🚀`,
            parse_mode: 'Markdown',
            ...Markup.keyboard([
                ['start','orders in progress', 'orders in pending']
            ]).resize()
        });

        
    } catch (err) {
        console.error('Error handling admin start:', err);
        await ctx.reply('Something went wrong. Please try again later.'+err);
    }
});

module.exports = { botAdmin };
