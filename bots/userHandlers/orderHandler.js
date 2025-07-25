const { Order, Food, User, Admin } = require('../../models/index');
const { notifyOrder } = require('../../controllers/api/orderController');
const { Op } = require('sequelize');
const { Markup } = require('telegraf');

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

if (user.status === 'block') {
    return ctx.reply(
        '⛔️ <b>Your access has been restricted.</b>\n\nPlease contact support if you believe this is a mistake.',
        { parse_mode: 'HTML' }
    );
}

    
    // Initialize session if necessary
    if (!ctx.session) ctx.session = {};

    // Store or update order data in session
    ctx.session.orderData = {
        telegramId,
        userId: user.userId,
        foodId,
        food, // Change 'item' to 'food'
        fullName: user?.fullName || null,
        phoneNumberOne: user?.phoneNumber1 || null,
        phoneNumberTwo: user?.phoneNumber2 || null,
    };

    // Prompt for missing order data
    if (!ctx.session.orderData.fullName) {
        return ctx.reply('👤 <b>Please enter your full name to continue:</b>', { parse_mode: 'HTML' });
    }
    
if (!ctx.session.orderData.phoneNumberOne) {
        return ctx.reply(
    '📞 Please share your *primary phone number* (Phone 1):',
    Markup.keyboard([
      [Markup.button.contactRequest('📲 Share Phone Number')],
      ['view menu', 'last order', 'profile'],
      ['history','search by category'],
    ]).resize()
  );
}
    if (!ctx.session.orderData.phoneNumberTwo) {
        return ctx.reply('📞 Now, please type your *secondary phone number* (Phone 2), or type "no" to skip:',Markup.keyboard([
        ['view menu', 'last order', 'profile'],
      ['history','search by category'],
    ]).resize() );
            }

    if (!ctx.session.orderData.quantity) {
        return ctx.reply(`🍽️ <b>How many</b> <i>${food.name}</i> <b>would you like to order?</b>`, { parse_mode: 'HTML' });
    }

    // Proceed to confirmation step here if all fields are filled
}

async function confirmOrder(ctx, foodId) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ *No order found.* Please start again to place an order.');
    }

    const {
        food,
        telegramId,
        fullName,
        phoneNumberOne,
        phoneNumberTwo,
        address,
        location,
        quantity,
        specialOrder
    } = ctx.session.orderData;

    const totalPrice = food.price * quantity;
    const isRemoteImage = food.imageUrl?.startsWith('http');

    // Generate Google Maps link
    const mapLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    try {
        const user = await User.findOne({ where: { telegramId } });

// Generate new orderId
const lastOrder = await Order.findOne({ order: [['createdAt', 'DESC']] });

let newIdNumber = 1;
if (lastOrder && lastOrder.orderId) {
    const lastNumber = parseInt(lastOrder.orderId.replace('ORD', ''));
    newIdNumber = lastNumber + 1;
}

const orderId = 'ORD' + String(newIdNumber).padStart(3, '0');

// Count user orders
const orderCount = await Order.count({ where: { userId: user.userId } });

// Determine if user type should change
const userType = orderCount >= 5 ? 'customer' : user.userType;

// Update user info
await user.update({
  fullName,
  phoneNumber1: phoneNumberOne,
  phoneNumber2: phoneNumberTwo,
  userType: userType
});


        
        const order = await Order.create({
            orderId,
            userId: user.userId,
            foodId: food.foodId,
            quantity,
            specialOrder,
            totalPrice,
            newTotalPrice: totalPrice,
            status: 'pending',
            createdBy: user.userId,
            location: address,
            latitude: location.latitude,
            longitude: location.longitude
        });


// 📦 Admin message caption
const adminCaption = `<b>📦 New Order Received!</b>\n` +
    `🍕 <b>Food:</b> ${food.name}\n` +
    `👤 <b>Username:</b> @${user.username || 'Not Available'}\n\n` +
    `💰 <b>Total Price:</b> ${totalPrice} birr\n` +
    `📝 <b>Special Order:</b> ${specialOrder || 'None'}\n\n` +
    `📝 Please review this order! 📋`;

      await notifyOrder(orderId ,adminCaption ,food.imageUrl)

        // Confirmation to the user
        const userCaption = `🎉 *Your order has been successfully placed!*\n\n` +
            `🧾 *Order Summary:*\n` +
            `👤 <b>Full Name:</b> ${fullName}\n` +
            `📱 <b>Phone Number 1:</b> ${phoneNumberOne}\n` +
            `📱 <b>Phone Number 2:</b> ${phoneNumberTwo || 'Not Provided'}\n` +
            `📍 <b>Address:</b> ${address}\n` +  // Reordered to show address after location
            `📍 <b>Location:</b> <a href="${mapLink}">View on Map</a>\n` + // Added map link for user
            `🔢 <b>Quantity:</b> ${quantity}\n` +
            `📝 <b>Special Note:</b> ${specialOrder || 'None'}\n` + // Special order for user
            `💰 <b>Total Price:</b> ${totalPrice} birr\n\n` +
            `📦 We'll start processing your order shortly. Thank you for choosing us! 🙏`;

        if (isRemoteImage) {
            await ctx.replyWithPhoto(food.imageUrl, {
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
        await ctx.reply('⚠️ *Something went wrong while placing your order.* Please try again later.' + error);
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
