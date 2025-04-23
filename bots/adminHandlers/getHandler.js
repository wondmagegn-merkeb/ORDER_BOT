const path = require('path');
const fs = require('fs');
const user = require('../userBot'); // Make sure userBot is exported correctly
const { Admin } = require('../../models/index');

async function placeOrder(ctx) {
    const imagePath = path.join(__dirname, '../../public', 'welcome.png');
    const imageExists = fs.existsSync(imagePath);

    const adminCaption = `<b>📦 *New Order Received!*</b>\n`;

    const admins = await Admin.findAll();
    const adminTelegramIds = admins.map(admin => admin.telegramId);

    for (const telegramId of adminTelegramIds) {
        try {
            if (imageExists) {
                await user.userBot.telegram.sendPhoto(
                    telegramId,
                    { source: fs.createReadStream(imagePath) },
                    {
                        caption: adminCaption,
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "📋 View Details", callback_data: `view_order_food` }],
                                [{ text: "✅ Confirm Order", callback_data: `confirm_order` }],
                                [{ text: "❌ Cancel Order", callback_data: `cancel_order` }]
                            ]
                        }
                    }
                );
            } else {
                await user.userBot.telegram.sendMessage(
                    telegramId,
                    adminCaption,
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "📋 View Details", callback_data: `view_order_food` }],
                                [{ text: "✅ Confirm Order", callback_data: `confirm_order` }],
                                [{ text: "❌ Cancel Order", callback_data: `cancel_order` }]
                            ]
                        }
                    }
                );
            }
        } catch (err) {
            console.error(`❌ Failed to send to admin ID: ${telegramId}. Error:`, err);

            let userString = '';
            try {
                userString = JSON.stringify(user, null, 2);
                if (userString.length > 3500) {
                    userString = userString.substring(0, 3500) + '...\n[truncated]';
                }
            } catch (jsonErr) {
                userString = 'Unable to stringify user object (possibly due to circular references)';
            }

            await ctx.reply(
                `❌ Failed to notify admin ${telegramId}.\nError: ${err.message}\n\nUser Object:\n\`\`\`\n${userString}\n\`\`\``,
                { parse_mode: 'Markdown' }
            );
        }
    }
}

module.exports = { placeOrder };
