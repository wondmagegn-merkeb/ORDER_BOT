const { Order, Food, User } = require("../../models/index");
const fs = require("fs");
const path = require("path");
const { Markup } = require("telegraf");

// Helper to format date
const formatDate = (date) =>
  new Date(date).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// History Menu Handler - Show filter options
async function handleHistoryMenu(ctx) {
  await ctx.reply(
    `📜 <b>Order History Menu</b>\n\nChoose how you want to view your orders:`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 All Orders", callback_data: "history_all" },
            { text: "⏳ Pending", callback_data: "history_pending" },
          ],
          [
            { text: "✅ Confirmed", callback_data: "history_confirmed" },
            { text: "👨‍🍳 Preparing", callback_data: "history_progress" },
          ],
          [
            { text: "📦 Ready", callback_data: "history_completed" },
            { text: "🚚 Delivered", callback_data: "history_delivered" },
          ],
          [{ text: "❌ Cancelled", callback_data: "history_cancelled" }],
        ],
      },
    }
  );
}

// Order History Handler (with optional status filter)
async function handleOrderHistory(ctx, statusFilter = null) {
  const telegramId = ctx.from.id.toString();
  ctx.session.waitingForPhone2 = false;
  ctx.session.waitingForFullName = false;
  ctx.session.waitingForAddress = false;
  ctx.session.waitingForLocation = false;
  try {
    // Fetch the user based on telegramId
    const user = await User.findOne({ where: { telegramId } });

    if (!user) {
      return ctx.reply(
        "You are not registered yet. Please send /start to get started!"
      );
    }

    // Build where clause
    const whereClause = { userId: user.userId };
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // Fetch the user's orders, sorted by created date
    // Food details are now in items JSON array
    const orders = await Order.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    let statusMessage = "";

    if (statusFilter === "all" || !statusFilter) {
      statusMessage = "all orders";
    } else if (statusFilter === "pending") {
      statusMessage = "pending orders yet.";
    } else if (statusFilter === "confirmed") {
      statusMessage = "accepted orders.";
    } else if (statusFilter === "progress") {
      statusMessage = "preparing orders.";
    } else if (statusFilter === "completed") {
      statusMessage = "ready to be delivered orders.";
    } else if (statusFilter === "delivered") {
      statusMessage = "delivered orders.";
    }

    if (!orders.length) {
      return ctx.reply(
        `🍽️ You haven't placed any ${statusMessage} yet. Start by placing an order and enjoy delicious food! 😋`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⬅️ Back to History Menu",
                  callback_data: "history_menu",
                },
              ],
            ],
          },
        }
      );
    }

    // Show status filter buttons if no filter is applied
    // if (!statusFilter) {
    //   await ctx.reply(
    //     `📜 <b>Your Order History</b>\n\nFound ${orders.length} order(s).\n\nFilter by status:`,
    //     {
    //       parse_mode: "HTML",
    //       reply_markup: {
    //         inline_keyboard: [
    //           [
    //             { text: "🔄 All Orders", callback_data: "history_all" },
    //             { text: "⏳ Pending", callback_data: "history_pending" },
    //           ],
    //           [
    //             { text: "✅ Confirmed", callback_data: "history_confirmed" },
    //             { text: "👨‍🍳 Preparing", callback_data: "history_preparing" },
    //           ],
    //           [
    //             { text: "📦 Ready", callback_data: "history_ready" },
    //             { text: "🚚 Delivered", callback_data: "history_delivered" },
    //           ],
    //           [{ text: "❌ Cancelled", callback_data: "history_cancelled" }],
    //         ],
    //       },
    //     }
    //   );
    // }

    // Loop through all orders to display their details
    for (const order of orders) {
      const items = order.items || []; // Get items from JSON

      // Generate a map link if latitude and longitude are available
      const mapLink =
        order.latitude && order.longitude
          ? `\n🗺️ <a href="https://maps.google.com/?q=${order.latitude},${order.longitude}">View Your Delivery Location</a>`
          : "";

      // Check if the order has been delivered and add corresponding emojis
      const isDelivered = order.status.toLowerCase() === "delivered";
      const deliveryEmoji = isDelivered ? " ✅🎉🍽️ Enjoy your meal!" : "";
      const needsFeedback =
        isDelivered && (!order.feedback || order.feedback === "noFeedBack");
      const feedbackEmojis = {
        tasty: "😋 So tasty!",
        love: "😍 Loved it!",
        delicious: "🍽️ Delicious",
        good: "😊 It was good!",
        okay: "👌 Okay",
        bad: "😞 Not happy",
      };

      const userFeedback = feedbackEmojis[order.feedback] || "";

      // Build the caption with order details - show all items
      let caption = `<b>📦 Order ID:</b> ${order.orderId}\n\n`;
      caption += `<b>📋 Items (${items.length}):</b>\n`;

      for (const item of items) {
        caption += `🍽️ <b>${item.foodName}</b>\n`;
        caption += `   Quantity: ${item.quantity}\n`;
        caption += `   Price: ${item.price} birr x ${item.quantity} = <b>${item.itemTotal} birr</b>\n`;
        if (item.specialOrder) {
          caption += `   📝 Note: ${item.specialOrder}\n`;
        }
        caption += `\n`;
      }

      caption +=
        `📍 <b>Address:</b> ${order.location || "Not provided"}\n` +
        `💰 <b>Total Price:</b> ${order.newTotalPrice} birr\n` +
        `📅 <b>Date:</b> ${formatDate(order.createdAt)}\n` +
        `📌 <b>Status:</b> ${order.status}${deliveryEmoji} ${mapLink}` +
        (needsFeedback
          ? `\n\n<b>How did we do? We value your feedback! 😍</b>\nReact with an emoji to share your thoughts:`
          : userFeedback
          ? `\n\n<b>Your feedback:</b> ${userFeedback}`
          : "");
      // Only show feedback options if the order is delivered
      // Only show feedback options if the order is delivered
      const feedbackButtons = needsFeedback
        ? {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "😋 So tasty! Will order again!",
                    callback_data: `feedback_${order.orderId}_tasty`,
                  },
                ],
                [
                  {
                    text: "❤️ Loved it! Best meal ever!",
                    callback_data: `feedback_${order.orderId}_love`,
                  },
                ],
                [
                  {
                    text: "🍽️ Delicious! Perfect for my taste",
                    callback_data: `feedback_${order.orderId}_delicious`,
                  },
                ],
                [
                  {
                    text: "😊 It was good!",
                    callback_data: `feedback_${order.orderId}_good`,
                  },
                ],
                [
                  {
                    text: "👌 Okay, could be better",
                    callback_data: `feedback_${order.orderId}_okay`,
                  },
                ],
                [
                  {
                    text: "👎 Not great, needs improvement",
                    callback_data: `feedback_${order.orderId}_bad`,
                  },
                ],
                // Add back button if filtered
                ...(statusFilter
                  ? [
                      [
                        {
                          text: "⬅️ Back to History Menu",
                          callback_data: "history_menu",
                        },
                      ],
                    ]
                  : []),
              ],
            },
          }
        : {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "⬅️ Back to History Menu",
                    callback_data: "history_menu",
                  },
                ],
              ],
            },
          };

      // Send the message with order details and feedback options if applicable
      // Get image from first item (imageUrl is stored in items array)
      const imageToShow = items.length > 0 ? items[0].imageUrl : null;

      if (imageToShow) {
        // Remove leading slash from imageUrl if present
        const imageUrlPath = imageToShow.startsWith("/")
          ? imageToShow.substring(1)
          : imageToShow;
        const imagePath = path.resolve(__dirname, "../public", imageUrlPath);
        const imageExists = fs.existsSync(imagePath);
        if (imageExists) {
          await ctx.replyWithPhoto(
            { source: fs.createReadStream(imagePath) },
            {
              caption,
              parse_mode: "HTML",
              ...feedbackButtons,
            }
          );
        } else {
          await ctx.replyWithHTML(caption, feedbackButtons);
        }
      } else {
        await ctx.replyWithHTML(caption, feedbackButtons);
      }
    }

    // // Add back button at the end if filtered
    // if (statusFilter && orders.length > 0) {
    //   await ctx.reply("📜 Filtered order history", {
    //     reply_markup: {
    //       inline_keyboard: [
    //         [
    //           {
    //             text: "⬅️ Back to History Menu",
    //             callback_data: "history_menu",
    //           },
    //         ],
    //       ],
    //     },
    //   });
    // }
  } catch (err) {
    console.error("Error fetching order history:", err);
    ctx.reply(
      "Oops! Something went wrong. We couldn't fetch your order history. Please try again later. 🙁"
    );
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
      order: [["createdAt", "DESC"]],
    });

    if (!user) {
      return ctx.reply(
        "You are not registered yet. Please send /start to get started!"
      );
    }

    if (!lastOrder) {
      return ctx.reply(
        "You don't have a last order yet. Place an order to see it here!"
      );
    }

    const items = lastOrder.items || [];

    const mapLink =
      lastOrder.latitude && lastOrder.longitude
        ? `\n🗺️ <a href="https://maps.google.com/?q=${lastOrder.latitude},${lastOrder.longitude}">View Location</a>`
        : "";
    // Check if the order has been delivered and add corresponding emojis
    const isDelivered = lastOrder.status.toLowerCase() === "delivered";
    const deliveryEmoji = isDelivered ? " ✅🎉🍽️ Enjoy your meal!" : "";
    const needsFeedback =
      isDelivered &&
      (!lastOrder.feedback || lastOrder.feedback === "noFeedBack");
    const feedbackEmojis = {
      tasty: "😋 So tasty!",
      love: "😍 Loved it!",
      delicious: "🍽️ Delicious",
      good: "😊 It was good!",
      okay: "👌 Okay",
      bad: "😞 Not happy",
    };

    const userFeedback = feedbackEmojis[lastOrder.feedback] || "";

    // Build the caption with order details - show all items
    let caption = `<b>📦 Order ID:</b> ${lastOrder.orderId}\n\n`;
    caption += `<b>📋 Items (${items.length}):</b>\n`;

    for (const item of items) {
      caption += `🍽️ <b>${item.foodName}</b>\n`;
      caption += `   Quantity: ${item.quantity}\n`;
      caption += `   Price: ${item.price} birr x ${item.quantity} = <b>${item.itemTotal} birr</b>\n`;
      if (item.specialOrder) {
        caption += `   📝 Note: ${item.specialOrder}\n`;
      }
      caption += `\n`;
    }

    caption +=
      `📍 <b>Address:</b> ${lastOrder.location || "Not provided"}\n` +
      `💰 <b>Total Price:</b> ${lastOrder.newTotalPrice} birr\n` +
      `📅 <b>Date:</b> ${formatDate(lastOrder.createdAt)}\n` +
      `📌 <b>Status:</b> ${lastOrder.status}${deliveryEmoji} ${mapLink}` +
      (needsFeedback
        ? `\n\n<b>How did we do? We value your feedback! 😍</b>\nReact with an emoji to share your thoughts:`
        : userFeedback
        ? `\n\n<b>Your feedback:</b> ${userFeedback}`
        : "");
    // Only show feedback options if the order is delivered
    // Only show feedback options if the order is delivered
    const feedbackButtons = needsFeedback
      ? {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "😋 So tasty! Will order again!",
                  callback_data: `feedback_${lastOrder.orderId}_tasty`,
                },
              ],
              [
                {
                  text: "❤️ Loved it! Best meal ever!",
                  callback_data: `feedback_${lastOrder.orderId}_love`,
                },
              ],
              [
                {
                  text: "🍽️ Delicious! Perfect for my taste",
                  callback_data: `feedback_${lastOrder.orderId}_delicious`,
                },
              ],
              [
                {
                  text: "😊 It was good!",
                  callback_data: `feedback_${lastOrder.orderId}_good`,
                },
              ],
              [
                {
                  text: "👌 Okay, could be better",
                  callback_data: `feedback_${lastOrder.orderId}_okay`,
                },
              ],
              [
                {
                  text: "👎 Not great, needs improvement",
                  callback_data: `feedback_${lastOrder.orderId}_bad`,
                },
              ],
            ],
          },
        }
      : {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⬅️ Back to History Menu",
                  callback_data: "history_menu",
                },
              ],
            ],
          },
        };

    // Send the message with order details and feedback options if applicable
    // Get image from first item (imageUrl is stored in items array)
    const imageToShow = items.length > 0 ? items[0].imageUrl : null;

    if (imageToShow) {
      // Remove leading slash from imageUrl if present
      const imageUrlPath = imageToShow.startsWith("/")
        ? imageToShow.substring(1)
        : imageToShow;
      const imagePath = path.resolve(__dirname, "../public", imageUrlPath);
      const imageExists = fs.existsSync(imagePath);
      if (imageExists) {
        await ctx.replyWithPhoto(
          { source: fs.createReadStream(imagePath) },
          {
            caption,
            parse_mode: "HTML",
            ...feedbackButtons,
          }
        );
      } else {
        await ctx.replyWithHTML(caption, feedbackButtons);
      }
    } else {
      await ctx.replyWithHTML(caption, feedbackButtons);
    }
  } catch (err) {
    console.error("Error fetching last order:", err);
    ctx.reply(
      "Sorry, there was an issue fetching your last order. Please try again later."
    );
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
      return ctx.reply(
        "You are not registered yet. Please send /start to get started!"
      );
    }

    const caption =
      `👤 <b>Your Profile</b>\n\n` +
      `🔹 <b>Full Name:</b> ${user.fullName || "Not set"}\n` +
      `📞 <b>Phone 1:</b> ${user.phoneNumber1 || "Not set"}\n` +
      `📱 <b>Phone 2:</b> ${user.phoneNumber2 || "N/A"}\n` +
      `💬 <b>Username:</b> @${user.username || "N/A"}\n` +
      `👥 <b>User Type:</b> ${user.userType || "Not defined"}\n` +
      `🌟 <b>Status:</b> ${user.status || "No status set"}`;

    await ctx.replyWithHTML(caption, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✏️ Edit Profile", callback_data: "edit_profile" }],
        ],
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    ctx.reply(
      "Sorry, there was an issue fetching your profile. Please try again later."
    );
  }
}

module.exports = {
  handleOrderHistory,
  handleHistoryMenu,
  handleLastOrder,
  handleUserProfile,
};
