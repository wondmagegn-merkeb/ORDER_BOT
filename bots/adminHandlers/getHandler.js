const path = require('path');
const fs = require('fs');
const { userBot } = require('../userBot'); // adjust the path as needed
const { Admin } = require('../../models/index'); // if you fetch admins from DB

async function placeOrder() {
    const imagePath = path.join(path.resolve(__dirname, '../../public'), 'welcome.png');
    const adminCaption = `<b>📦 *New Order Received!*</b>\n`;

    // Option 1: Static admin ID
    // const adminTelegramIds = ['123456789']; // Replace with actual IDs

    // Option 2: Fetch from DB
    const admins = await Admin.findAll();
    const adminTelegramIds = admins.map(admin => admin.telegramId);

    for (const telegramId of adminTelegramIds) {
        try {
            await userBot.telegram.sendPhoto(
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
        } catch (err) {
            console.error(`Failed to send photo to admin ${telegramId}:`, err);
        }
    }
}

module.exports = { placeOrder };
