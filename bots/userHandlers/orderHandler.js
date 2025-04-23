const { Order, Food, User, Admin } = require('../../models/index');
const { adminBot }= require('../adminBot'); // Adjust the path based on your project structure

async function placeOrder(ctx, foodId) {
    const telegramId = ctx.from.id.toString();

    // Fetch the food item
    const food = await Food.findByPk(foodId);
    if (!food) {
        return ctx.reply('⚠️ <b>Sorry, this food item was not found.</b>', { parse_mode: 'HTML' });
    }

    // Check if user exists
    const user = await User.findOne({ where: { telegramId } });
    if (!user) {
        return ctx.reply(
            '👋 <b>We couldn’t find your registration.</b>\n\nPlease type <code>/start</code> to register before placing an order.',
            { parse_mode: 'HTML' }
        );
    }

    // Get the user's latest order to prefill data
    const lastOrder = await Order.findOne({
        where: { userId: user.userId },
        order: [['createdAt', 'DESC']],
    });

    // Initialize session if necessary
    if (!ctx.session) ctx.session = {};

    // Store or update order data in session
    ctx.session.orderData = {
        userId: user.userId,
        foodId,
        food,
        fullName: lastOrder?.fullName || null,
        phoneNumberOne: lastOrder?.phoneNumber1 || null,
        phoneNumberTwo: lastOrder?.phoneNumber2 || null,
        quantity: ctx.session.orderData?.quantity || null,
    };

    // Prompt for missing order data
    if (!ctx.session.orderData.fullName) {
        return ctx.reply('👤 <b>Please enter your full name to continue:</b>', { parse_mode: 'HTML' });
    }

    if (!ctx.session.orderData.phoneNumberTwo) {
        return ctx.reply('📞 <b>Do you have a second phone number? If not, just reply with "No".</b>', { parse_mode: 'HTML' });
    }

    if (!ctx.session.orderData.quantity) {
        return ctx.reply(`🍽️ <b>How many</b> <i>${food.name}</i> <b>would you like to order?</b>`, { parse_mode: 'HTML' });
    }

    // Proceed to confirmation step here if all fields are filled
}


async function confirmOrder(ctx, itemId) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ *No order found.* Please start again to place an order.');
    }

    const {
        item,
        telegramId,
        fullName,
        phoneNumberOne,
        phoneNumber,
        location,
        quantity,
        specialOrder
    } = ctx.session.orderData;

    const totalPrice = item.price * quantity;
    const isRemoteImage = item.imageUrl?.startsWith('http');

    try {
        // ✅ Only select admins who are NOT 'delivery' role
        const admins = await Admin.findAll({
            where: {
                role: { [Op.ne]: 'delivery' }
            },
            attributes: ['telegramId']
        });

        const adminCaption = `<b>📦 *New Order Received!*</b>\n` +
            `🍕 <b>Food:</b> ${item.name}\n` +
            `👤 <b>Name:</b> ${fullName}\n` +
            `📱 <b>Phone 1:</b> ${phoneNumberOne}\n` +
            `📱 <b>Phone 2:</b> ${phoneNumber || 'Not Provided'}\n` +
            `📍 <b>Location:</b> ${location}\n` +
            `🔢 <b>Quantity:</b> ${quantity}\n` +
            `💬 <b>Special Request:</b> ${specialOrder || 'None'}\n` +
            `💰 <b>Total Price:</b> ${totalPrice} birr\n\n` +
            `<b>📝 Please review this order and confirm! 📋</b>`;

        // Send to all admins
        for (const admin of admins) {
            await adminBot.telegram.sendPhoto(admin.telegramId, item.imageUrl, {
                caption: adminCaption,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📋 View Details", callback_data: `view_order_item_${itemId}` }],
                        [{ text: "✅ Confirm Order", callback_data: `confirm_order_${itemId}` }],
                        [{ text: "❌ Cancel Order", callback_data: `cancel_order_${itemId}` }]
                    ]
                }
            });
        }

        // Confirmation to the user
        const userCaption = `🎉 *Your order has been successfully placed!*\n\n` +
            `🧾 *Order Summary:*\n` +
            `👤 <b>Full Name:</b> ${fullName}\n` +
            `📱 <b>Phone Number 1:</b> ${phoneNumberOne}\n` +
            `📱 <b>Phone Number 2:</b> ${phoneNumber || 'Not Provided'}\n` +
            `📍 <b>Location:</b> ${location}\n` +
            `🔢 <b>Quantity:</b> ${quantity}\n` +
            `📝 <b>Special Note:</b> ${specialOrder || 'None'}\n` +
            `💰 <b>Total Price:</b> ${totalPrice} birr\n\n` +
            `📦 We'll start processing your order shortly. Thank you for choosing us! 🙏`;

        if (isRemoteImage) {
            await ctx.replyWithPhoto(item.imageUrl, {
                caption: userCaption,
                parse_mode: 'HTML',
                reply_markup: Markup.keyboard([
                    ['Start', 'View Menu', 'Last Order Status'],
                    ['History'],
                ]).resize()
            });
        } else {
            // In case image URL is not valid or remote image is unavailable
            await ctx.reply(userCaption, {
                parse_mode: 'HTML',
                reply_markup: Markup.keyboard([
                    ['Start', 'View Menu', 'Last Order Status'],
                    ['History'],
                ]).resize()
            });
        }

        // Clear session data after successful order placement
        ctx.session.orderData = null;

    } catch (error) {
        console.error('❌ Error confirming order:', error);
        await ctx.reply('⚠️ *Something went wrong while placing your order.* Please try again later.');
    }
}


async function cancelOrder(ctx) {
    // Clear session order data
    if (ctx.session) {
        ctx.session.orderData = null;
    }
    await ctx.reply('❌ Your order has been canceled.');
}

module.exports = {
    placeOrder,
    confirmOrder,
    cancelOrder
};
