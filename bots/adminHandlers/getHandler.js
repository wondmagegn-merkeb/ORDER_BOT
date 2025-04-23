const path = require('path');
const fs = require('fs');
const { adminBot } = require('../adminBot'); // Use the correct bot instance
const { Admin } = require('../../models/index');

async function placeOrder() {
    const imagePath = path.join(__dirname, '../../public', 'welcome.png');
    const imageExists = fs.existsSync(imagePath);

    const adminCaption = `<b>📦 *New Order Received!*</b>\n`;

    const admins = await Admin.findAll();
    const adminTelegramIds = admins.map(admin => admin.telegramId);

    for (const telegramId of adminTelegramIds) {
        try {
            if (imageExists) {
                await adminBot.telegram.sendPhoto(
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
                await adminBot.telegram.sendMessage(
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
            console.error(`❌ Failed to send to admin ${telegramId}:`, err);
        }
    }
}

module.exports = { placeOrder };
