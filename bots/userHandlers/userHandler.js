const { Order, Food, User } = require('../../models/index');

// Helper to format date
const formatDate = (date) =>
  new Date(date).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Order History Handler
async function handleOrderHistory(ctx) {
  const telegramId = ctx.from.id.toString();
ctx.session.waitingForPhone2 = false;
  ctx.session.waitingForFullName = false;
  try {
    
    // Fetch the user based on telegramId
    const user = await User.findOne({ where: { telegramId } });

    // Fetch the user's orders, including food details, sorted by created date
    const orders = await Order.findAll({
      where: { userId: user.userId },
      include: [Food],
      order: [['createdAt', 'DESC']],
    });

    if (!orders.length) {
      return ctx.reply('🍽️ You haven\'t placed any orders yet. Start by placing an order and enjoy delicious food! 😋');
    }

    // Loop through all orders to display their details
    for (const order of orders) {
      const food = order.Food;

      // Generate a map link if latitude and longitude are available
      const mapLink = order.latitude && order.longitude
        ? `\n🗺️ <a href="https://maps.google.com/?q=${order.latitude},${order.longitude}">View Your Delivery Location</a>`
        : '';

      // Check if the order has been delivered and add corresponding emojis
      const isDelivered = order.status.toLowerCase() === 'delivered';
      const deliveryEmoji = isDelivered ? ' ✅🎉🍽️ Enjoy your meal!' : '';
      const selectedReaction = order.feedback; // Assuming you store feedback like 'love', 'bad', etc.
      const needsFeedback = isDelivered && (!order.feedback || order.feedback === 'noFeedBack');
const feedbackEmojis = {
  tasty: '😋 So tasty!',
  love: '😍 Loved it!',
  delicious: '🍽️ Delicious',
  good: '😊 It was good!',
  okay: '👌 Okay',
  bad: '😞 Not happy'
};



const userFeedback = feedbackEmojis[order.feedback] || '';

      // Build the caption with order details
      
const caption = `<b>📦 Order ID:</b> ${order.orderId}\n` +
  `🍔 <b>Food:</b> ${food.name || 'Unknown'}\n` +
  `📍 <b>Address:</b> ${order.location || 'Not provided'}\n` +
  `💰 <b>Total Price:</b> ${order.newTotalPrice} birr\n` +
  `📝 <b>Special Order:</b> ${order.specialOrder || 'None'}\n` +
  `📅 <b>Date:</b> ${formatDate(order.createdAt)}\n` +
  `📌 <b>Status:</b> ${order.status}${deliveryEmoji} ${mapLink}` +
  (
    needsFeedback
      ? `\n\n<b>How did we do? We value your feedback! 😍</b>\nReact with an emoji to share your thoughts:`
      : (userFeedback ? `\n\n<b>Your feedback:</b> ${userFeedback}` : '')
  );
      // Only show feedback options if the order is delivered
      // Only show feedback options if the order is delivered
const feedbackButtons = needsFeedback
  ? {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '😋 So tasty! Will order again!',
              callback_data: `feedback_${order.orderId}_tasty`
            }
          ],
          [
            {
              text: '❤️ Loved it! Best meal ever!',
              callback_data: `feedback_${order.orderId}_love`
            }
          ],
          [
            {
              text: '🍽️ Delicious! Perfect for my taste',
              callback_data: `feedback_${order.orderId}_delicious`
            }
          ],
          [
            {
              text: '😊 It was good!',
              callback_data: `feedback_${order.orderId}_good`
            }
          ],
          [
            {
              text: '👌 Okay, could be better',
              callback_data: `feedback_${order.orderId}_okay`
            }
          ],
          [
            {
              text: '👎 Not great, needs improvement',
              callback_data: `feedback_${order.orderId}_bad`
            }
          ]
        ]
      }
    }
  : undefined;


      // Send the message with order details and feedback options if applicable
      if (food?.imageUrl) {
        await ctx.replyWithPhoto(food.imageUrl, {
          caption,
          parse_mode: 'HTML',
          ...feedbackButtons,
        });
      } else {
        await ctx.replyWithHTML(caption, feedbackButtons);
      }
    }
  } catch (err) {
    console.error('Error fetching order history:', err);
    ctx.reply('Oops! Something went wrong. We couldn\'t fetch your order history. Please try again later. 🙁');
  }
}

// Last Order Handler
async function handleLastOrder(ctx) {
  const telegramId = ctx.from.id.toString();
ctx.session.waitingForPhone2 = false;
  ctx.session.waitingForFullName = false;
  try {
    const user = await User.findOne({ where: { telegramId } });
    const lastOrder = await Order.findOne({
      where: { userId: user.userId },
      include: [Food],
      order: [['createdAt', 'DESC']],
    });

    
    if (!user) {
      return ctx.reply('You are not registered yet. Please send /start to get started!');
    }

    if (!lastOrder) {
      return ctx.reply('You don\'t have a last order yet. Place an order to see it here!');
    }

    const food = lastOrder.Food;

    const mapLink = lastOrder.latitude && lastOrder.longitude
      ? `\n🗺️ <a href="https://maps.google.com/?q=${lastOrder.latitude},${lastOrder.longitude}">View Location</a>`
      : '';
      // Check if the order has been delivered and add corresponding emojis
      const isDelivered = lastOrder.status.toLowerCase() === 'delivered';
      const deliveryEmoji = isDelivered ? ' ✅🎉🍽️ Enjoy your meal!' : '';
      const selectedReaction = lastOrder.feedback; // Assuming you store feedback like 'love', 'bad', etc.
      const needsFeedback = isDelivered && (!lastOrder.feedback || lastOrder.feedback === 'noFeedBack');
const feedbackEmojis = {
  tasty: '😋 So tasty!',
  love: '😍 Loved it!',
  delicious: '🍽️ Delicious',
  good: '😊 It was good!',
  okay: '👌 Okay',
  bad: '😞 Not happy'
};

const userFeedback = feedbackEmojis[lastOrder.feedback] || '';

      // Build the caption with order details
      
const caption = `<b>📦 Order ID:</b> ${lastOrder.orderId}\n` +
  `🍔 <b>Food:</b> ${food.name || 'Unknown'}\n` +
  `📍 <b>Address:</b> ${lastOrder.location || 'Not provided'}\n` +
  `💰 <b>Total Price:</b> ${lastOrder.newTotalPrice} birr\n` +
  `📝 <b>Special Order:</b> ${lastOrder.specialOrder || 'None'}\n` +
  `📅 <b>Date:</b> ${formatDate(lastOrder.createdAt)}\n` +
  `📌 <b>Status:</b> ${lastOrder.status}${deliveryEmoji} ${mapLink}` +
  (
    needsFeedback
      ? `\n\n<b>How did we do? We value your feedback! 😍</b>\nReact with an emoji to share your thoughts:`
      : (userFeedback ? `\n\n<b>Your feedback:</b> ${userFeedback}` : '')
  );
      // Only show feedback options if the order is delivered
      // Only show feedback options if the order is delivered
const feedbackButtons = needsFeedback
  ? {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '😋 So tasty! Will order again!',
              callback_data: `feedback_${lastOrder.orderId}_tasty`
            }
          ],
          [
            {
              text: '❤️ Loved it! Best meal ever!',
              callback_data: `feedback_${lastOrder.orderId}_love`
            }
          ],
          [
            {
              text: '🍽️ Delicious! Perfect for my taste',
              callback_data: `feedback_${lastOrder.orderId}_delicious`
            }
          ],
          [
            {
              text: '😊 It was good!',
              callback_data: `feedback_${lastOrder.orderId}_good`
            }
          ],
          [
            {
              text: '👌 Okay, could be better',
              callback_data: `feedback_${lastOrder.orderId}_okay`
            }
          ],
          [
            {
              text: '👎 Not great, needs improvement',
              callback_data: `feedback_${lastOrder.orderId}_bad`
            }
          ]
        ]
      }
    }
  : undefined;

      // Send the message with order details and feedback options if applicable
      if (food?.imageUrl) {
        await ctx.replyWithPhoto(food.imageUrl, {
          caption,
          parse_mode: 'HTML',
          ...feedbackButtons,
        });
      } else {
        await ctx.replyWithHTML(caption, feedbackButtons);
      }
  } catch (err) {
    console.error('Error fetching last order:', err);
    ctx.reply('Sorry, there was an issue fetching your last order. Please try again later.');
  }
}

// User Profile Handler
async function handleUserProfile(ctx) {
  const telegramId = ctx.from.id.toString();
ctx.session.waitingForPhone2 = false;
  ctx.session.waitingForFullName = false;
  try {
    const user = await User.findOne({ where: { telegramId } });

    if (!user) {
      return ctx.reply('You are not registered yet. Please send /start to get started!');
    }

    const caption = `👤 <b>Your Profile</b>\n\n` +
      `🔹 <b>Full Name:</b> ${user.fullName || 'Not set'}\n` +
      `📞 <b>Phone 1:</b> ${user.phoneNumber1 || 'Not set'}\n` +
      `📱 <b>Phone 2:</b> ${user.phoneNumber2 || 'N/A'}\n` +
      `💬 <b>Username:</b> @${user.username || 'N/A'}\n` +
      `👥 <b>User Type:</b> ${user.userType || 'Not defined'}\n` +
      `🌟 <b>Status:</b> ${user.status || 'No status set'}`;


    await ctx.replyWithHTML(caption, {
  reply_markup: {
    inline_keyboard: [
      [{ text: '✏️ Edit Profile', callback_data: 'edit_profile' }]
    ]
  }
});

  } catch (err) {
    console.error('Error fetching profile:', err);
    ctx.reply('Sorry, there was an issue fetching your profile. Please try again later.');
  }
}

module.exports = {
  handleOrderHistory,
  handleLastOrder,
  handleUserProfile,
};
