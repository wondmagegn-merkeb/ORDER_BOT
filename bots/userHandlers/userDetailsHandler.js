const { Markup } = require('telegraf');

async function handleFullName(ctx) {
  if (!ctx.session || !ctx.session.orderData) {
    return ctx.reply('⚠️ Session expired. Please restart your order.');
  }

  const fullName = ctx.message.text.trim();
  ctx.session.orderData.fullName = fullName;

  // Now, proceed with sending the phone number request
  return ctx.reply(
    '📞 Please share your *primary phone number* (Phone 1):',
    Markup.keyboard([
      [Markup.button.contactRequest('📲 Share Phone Number')],
      ['view menu', 'last order', 'profile'],
      ['history','search by category'],
    ]).resize()
  );
}

async function handlePhoneNumberOne(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    if (!ctx.message.contact || !ctx.message.contact.phone_number) {
        return ctx.reply('❌ Invalid contact. Please use the button to share your phone.');
    }

    const rawPhone = ctx.message.contact.phone_number;
    const cleanedPhone = rawPhone.replace(/\D/g, '').slice(-10); // Extract last 10 digits
    ctx.session.orderData.phoneNumberOne = cleanedPhone;
if (!ctx.session.orderData.phoneNumberTwo) {
       return ctx.reply('📞 Now, please type your *secondary phone number* (Phone 2), or type "no" to skip:',Markup.keyboard([
      
      ['view menu', 'last order', 'profile'],
      ['history','search by category'],
    ]).resize() );
}else{
return ctx.reply('✅ Phone 2 saved! How many items would you like to order?');
}
    
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
      return ctx.reply(`🍽️ <b>How many</b> <i>${ctx.session.orderData.food.name}</i> <b>would you like to order?</b>`, { parse_mode: 'HTML' });
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
  ctx.session.orderData.specialOrder = (specialOrder.toLowerCase() === 'no') ? 'Not special order' : specialOrder;

  return ctx.reply('📬 Please type your delivery address:');
}

async function handleAddress(ctx) {
  if (!ctx.session || !ctx.session.orderData) {
    return ctx.reply('⚠️ Session expired. Please restart your order.');
  }

  const addressText = ctx.message.text.trim();

  if (addressText.toLowerCase() === 'no') {
    return ctx.reply('❗ Address is required. Please type your full delivery address.');
  }

  ctx.session.orderData.address = addressText;

  return ctx.reply(
    '📍 Please send your location:',
    Markup.keyboard([
      [Markup.button.locationRequest('📍 Send Location')],
      ['view menu', 'last order', 'profile'],
      ['history','search by category'],
    ]).resize()
  );
}

async function handleLocation(ctx) {
    if (!ctx.session || !ctx.session.orderData) {
        return ctx.reply('⚠️ Session expired. Please restart your order.');
    }

    // Check if location is provided
    if (!ctx.message.location) {
        return ctx.reply('📍 Please use the button to send your location.');
    }

    // Acknowledge that the location has been received
    await ctx.reply('✅ Location received!', 
        Markup.keyboard([
            ['view menu', 'last order', 'profile'],
            ['history','search by category'],
        ]).resize()
    );

    // Extract latitude and longitude from the message
    const { latitude, longitude } = ctx.message.location;

ctx.session.orderData.location = {
  latitude,
  longitude
};


    // Destructure the order data from the session
    const { food, fullName, phoneNumberOne, phoneNumberTwo, quantity, specialOrder } = ctx.session.orderData;
    const totalPrice = food.price * quantity;
    
    // Send order summary to the user
    return ctx.reply(
        `🧾 <b>Your Order Summary:</b>\n\n` +
        `🍽️ <b>Item:</b> ${food.name} - ${food.price} birr x ${quantity} = <b>${totalPrice} birr</b>\n` +
        `👤 <b>Name:</b> ${fullName}\n` +
        `📞 <b>Primary Phone:</b> ${phoneNumberOne || 'Not Provided'}\n` +
        `📞 <b>Secondary Phone:</b> ${phoneNumberTwo || 'Not Provided'}\n` +
        `📝 <b>Instructions:</b> ${specialOrder || 'None'}\n` +
        `📍 <b>Location:</b> Shared\n\n` +
        `✅ <b>Would you like to place the order now?</b>`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Yes, Place Order', callback_data: `confirm_order_now_${food.foodId}` }],
                    [{ text: '❌ No, Cancel', callback_data: `cancel_order_now_${food.foodId}` }],
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
    handleAddress,
    handleLocation,
};
