const { Order, Food, User } = require('../../models/index');

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
