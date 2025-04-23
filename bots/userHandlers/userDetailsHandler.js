const { Markup } = require('telegraf');

async function handleFullName(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    const fullName = ctx.message.text.trim();
    ctx.session.orderData.fullName = fullName;

    return ctx.reply(
        '📞 Please share your *primary phone number* (Phone 1):',
        Markup.keyboard([
            [Markup.button.contactRequest('📲 Share Phone Number')]
        ]).oneTime().resize()
    );
}

async function handlePhoneNumberOne(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    if (!ctx.message.contact || !ctx.message.contact.phone_number) {
        return ctx.reply('❌ Invalid contact. Please use the 📲 button to share your phone.');
    }

    const rawPhone = ctx.message.contact.phone_number;
    const cleanedPhone = rawPhone.replace(/\D/g, '').slice(-10); // Extract last 10 digits
    ctx.session.orderData.phoneNumberOne = cleanedPhone;

    return ctx.reply('📞 Now, please *type* your *secondary phone number* (Phone 2), or type "no" to skip:');
}

async function handlePhoneNumber(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    const input = ctx.message.text.trim();

    if (input.toLowerCase() === 'no') {
        ctx.session.orderData.phoneNumberTwo = 'Not Provided';
        return ctx.reply('✅ Phone 2 skipped. How many items would you like to order?');
    }

    const phoneRegex = /^(09|07)\d{8}$/;
    if (!phoneRegex.test(input)) {
        return ctx.reply('❌ Invalid number. Enter a 10-digit number starting with 09 or 07, or type "no".');
    }

    ctx.session.orderData.phoneNumberTwo = input;
    return ctx.reply('✅ Phone 2 saved! How many items would you like to order?');
}

async function handleQuantity(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    const quantity = parseInt(ctx.message.text, 10);
    if (isNaN(quantity) || quantity <= 0) {
        return ctx.reply('❌ Please enter a valid positive number.');
    }

    ctx.session.orderData.quantity = quantity;

    return ctx.reply('💬 Do you have any special instructions (e.g., “No onions”, “Extra spicy”)? Type them, or say "No".');
}

async function handleSpecialOrder(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    const specialOrder = ctx.message.text.trim();
    ctx.session.orderData.specialOrder = (specialOrder.toLowerCase() === 'no') ? null : specialOrder;

    return ctx.reply(
        '📍 Please send your location:',
        Markup.keyboard([
            [Markup.button.locationRequest('📍 Send Location')]
        ]).oneTime().resize()
    );
}

async function handleLocation(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    if (!ctx.message.location) {
        return ctx.reply('📍 Please use the button to send your location.');
    }

    const { latitude, longitude } = ctx.message.location;
    ctx.session.orderData.location = `Lat: ${latitude}, Lng: ${longitude}`;

    const { food, fullName, phoneNumberOne, phoneNumberTwo, quantity, specialOrder } = ctx.session.orderData;
    const totalPrice = food.price * quantity;

    return ctx.reply(
        `🧾 *Order Summary:*\n\n` +
        `🍽️ Item: ${food.name} - ${food.price} birr x ${quantity} = ${totalPrice} birr\n` +
        `👤 Name: ${fullName}\n` +
        `📱 Phone 1: ${phoneNumberOne}\n` +
        `📱 Phone 2: ${phoneNumberTwo || 'Not Provided'}\n` +
        `💬 Special Notes: ${specialOrder || 'None'}\n` +
        `📍 Location: ${ctx.session.orderData.location}\n\n` +
        `Do you want to place this order?`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Yes, Place Order', callback_data: `confirm_order_now_${food.foodId}` }],
                    [{ text: '❌ No, Cancel', callback_data: `cancel_order_now_${food.foodId}` }]
                ]
            }
        }
    );
}


module.exports = {
    handleFullName,
    handlePhoneNumberOne,
    handlePhoneNumber,
    handleQuantity,
    handleSpecialOrder,
    handleLocation,
};
