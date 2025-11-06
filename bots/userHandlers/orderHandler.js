const { Order, Food, User, Admin } = require("../../models/index");
const { notifyOrder } = require("../../controllers/api/orderController");
const { Op } = require("sequelize");
const { Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");

// Add item to cart
async function addToCart(ctx, foodId) {
  const telegramId = ctx.from.id.toString();

  // Fetch the food item
  const food = await Food.findByPk(foodId);
  if (!food) {
    return ctx.reply("⚠️ <b>Sorry, this food item was not found.</b>", {
      parse_mode: "HTML",
    });
  }

  // Check if user exists
  const user = await User.findOne({ where: { telegramId } });

  if (!user) {
    return ctx.reply(
      "👋 <b>We couldn't find your registration.</b>\n\nPlease type <code>/start</code> to register before placing an order.",
      { parse_mode: "HTML" }
    );
  }

  if (user.status === "block") {
    return ctx.reply(
      "⛔️ <b>Your access has been restricted.</b>\n\nPlease contact support if you believe this is a mistake.",
      { parse_mode: "HTML" }
    );
  }

  // Initialize session if necessary
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.cart) ctx.session.cart = [];

  // Check if item already in cart
  const existingItemIndex = ctx.session.cart.findIndex(
    (item) => item.foodId === foodId
  );

  if (existingItemIndex !== -1) {
    // Item already in cart, ask to update quantity
    await ctx.answerCbQuery(
      `${food.name} is already in your cart!\n\nTo view cart, click on the view cart button below`
    );
    return true;
    // return ctx.reply(
    //   `🛒 <b>${food.name}</b> is already in your cart.\n\n` +
    //     `Current quantity: <b>${ctx.session.cart[existingItemIndex].quantity}</b>\n\n` +
    //     `Would you like to update the quantity?`,
    //   {
    //     parse_mode: "HTML",
    //     reply_markup: {
    //       inline_keyboard: [
    //         [
    //           {
    //             text: "✏️ Update Quantity",
    //             callback_data: `update_qty_${foodId}`,
    //           },
    //           {
    //             text: "🗑️ Remove from Cart",
    //             callback_data: `remove_cart_${foodId}`,
    //           },
    //         ],
    //         [{ text: "🛒 View Cart", callback_data: "view_cart" }],
    //       ],
    //     },
    //   }
    // );
  }

  // Add to cart with default quantity of 1
  ctx.session.cart.push({
    foodId: food.foodId,
    food: food.toJSON(),
    quantity: 1,
    specialOrder: null,
  });

  await ctx.answerCbQuery(
    `✅ ${food.name} added to cart!\n\nTo view cart, click on the view cart button below`
  );
  return true;
  // await ctx.reply(
  //   `🛒 <b>${food.name}</b> added to cart!\n\n` +
  //     `🍽️ <b>How many would you like?</b>\n` +
  //     `💰 Price: <b>${food.price} birr</b> each`,
  //   {
  //     parse_mode: "HTML",
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           { text: "1", callback_data: `set_qty_${foodId}_1` },
  //           { text: "2", callback_data: `set_qty_${foodId}_2` },
  //           { text: "3", callback_data: `set_qty_${foodId}_3` },
  //         ],
  //         [
  //           { text: "4", callback_data: `set_qty_${foodId}_4` },
  //           { text: "5", callback_data: `set_qty_${foodId}_5` },
  //           { text: "6", callback_data: `set_qty_${foodId}_6` },
  //         ],
  //         [{ text: "📝 Enter Custom", callback_data: `custom_qty_${foodId}` }],
  //         [
  //           { text: "🛒 View Cart", callback_data: "view_cart" },
  //           { text: "❌ Cancel", callback_data: `remove_cart_${foodId}` },
  //         ],
  //       ],
  //     },
  //   }
  // );
}

// View cart
async function viewCart(ctx) {
  const telegramId = ctx.from.id.toString();
  const user = await User.findOne({ where: { telegramId } });

  if (!ctx.session || !ctx.session.cart || ctx.session.cart.length === 0) {
    return ctx.reply(
      "🛒 <b>Your cart is empty! To add items to cart, click on the view menu button below</b>",
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📋 View Menu", callback_data: "view_menu" }],
          ],
        },
      }
    );
  }

  let totalPrice = 0;
  let cartMessage = "🛒 <b>Your Cart:</b>\n\n";

  for (let i = 0; i < ctx.session.cart.length; i++) {
    const item = ctx.session.cart[i];
    const itemQuantity = item.quantity || 1;
    const itemTotal = item.food.price * itemQuantity;
    totalPrice += itemTotal;

    cartMessage +=
      `${i + 1}. <b>${item.food.name}</b>\n` +
      `   💰 ${item.food.price} birr x ${itemQuantity} = <b>${itemTotal} birr</b>\n` +
      (item.specialOrder ? `   📝 Note: ${item.specialOrder}\n` : "") +
      `\n`;
  }

  cartMessage += `💰 <b>Total: ${totalPrice} birr</b>\n\n`;

  // Check if all items have valid quantity (should always be true now, but keeping for safety)
  const allHaveQuantity = ctx.session.cart.every(
    (item) => item.quantity !== null && item.quantity > 0
  );

  const keyboard = {
    inline_keyboard: [
      ...ctx.session.cart.map((item, index) => [
        {
          text: `📝 Set Qty: ${item.food.name.substring(0, 20)}${
            item.food.name.length > 20 ? "..." : ""
          }`,
          callback_data: `set_qty_menu_${item.foodId}`,
        },
        {
          text: `📝 Add Note: ${item.food.name.substring(0, 20)}${
            item.food.name.length > 20 ? "..." : ""
          }`,
          callback_data: `add_note_${item.foodId}`,
        },
        {
          text: `🗑️ Remove`,
          callback_data: `remove_cart_${item.foodId}`,
        },
      ]),
      [{ text: "🗑️ Clear Cart", callback_data: "clear_cart" }],
      allHaveQuantity
        ? [{ text: "✅ Checkout", callback_data: "checkout" }]
        : [{ text: "⚠️ Set Quantities First", callback_data: "view_cart" }],
      [{ text: "📋 Continue Ordering", callback_data: "back_to_menu" }],
    ],
  };

  await ctx.reply(cartMessage, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

// Remove item from cart
async function removeFromCart(ctx, foodId) {
  if (!ctx.session || !ctx.session.cart) {
    return ctx.reply("🛒 Your cart is empty!");
  }

  const itemIndex = ctx.session.cart.findIndex(
    (item) => item.foodId === foodId || item.foodId?.toString() === foodId
  );

  if (itemIndex === -1) {
    return ctx.answerCbQuery("Item not found in cart!");
  }

  const removedItem = ctx.session.cart[itemIndex];
  ctx.session.cart.splice(itemIndex, 1);

  await ctx.answerCbQuery(`✅ ${removedItem.food.name} removed from cart!`);

  // Show updated cart
  if (ctx.session.cart.length > 0) {
    await viewCart(ctx);
  } else {
    await ctx.reply("🛒 Your cart is now empty!");
  }
}

// Clear cart
async function clearCart(ctx) {
  if (!ctx.session) ctx.session = {};
  ctx.session.cart = [];
  await ctx.answerCbQuery("Cart cleared!");
}

// Legacy function for backward compatibility
async function placeOrder(ctx, foodId) {
  const telegramId = ctx.from.id.toString();

  // Fetch the food item
  const food = await Food.findByPk(foodId);
  if (!food) {
    return ctx.reply("⚠️ <b>Sorry, this food item was not found.</b>", {
      parse_mode: "HTML",
    });
  }

  // Check if user exists
  const user = await User.findOne({ where: { telegramId } });

  if (!user) {
    return ctx.reply(
      "👋 <b>We couldn’t find your registration.</b>\n\nPlease type <code>/start</code> to register before placing an order.",
      { parse_mode: "HTML" }
    );
  }

  if (user.status === "block") {
    return ctx.reply(
      "⛔️ <b>Your access has been restricted.</b>\n\nPlease contact support if you believe this is a mistake.",
      { parse_mode: "HTML" }
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
    return ctx.reply("👤 <b>Please enter your full name to continue:</b>", {
      parse_mode: "HTML",
    });
  }

  if (!ctx.session.orderData.phoneNumberOne) {
    return ctx.reply(
      "📞 Please share your *primary phone number* (Phone 1):",
      Markup.keyboard([
        [Markup.button.contactRequest("📲 Share Phone Number")],
        ["view menu", "last order", "profile"],
        ["history", "search by category"],
      ]).resize()
    );
  }
  if (!ctx.session.orderData.phoneNumberTwo) {
    return ctx.reply(
      '📞 Now, please type your *secondary phone number* (Phone 2), or type "no" to skip:',
      Markup.keyboard([
        ["view menu", "last order", "profile"],
        ["history", "search by category"],
      ]).resize()
    );
  }

  if (!ctx.session.orderData.quantity) {
    return ctx.reply(
      `🍽️ <b>How many</b> <i>${food.name}</i> <b>would you like to order?</b>`,
      { parse_mode: "HTML" }
    );
  }

  // Proceed to confirmation step here if all fields are filled
}

// Checkout - confirm all cart items
async function checkout(ctx) {
  const telegramId = ctx.from.id.toString();

  if (!ctx.session || !ctx.session.cart || ctx.session.cart.length === 0) {
    return ctx.reply("🛒 <b>Your cart is empty!</b>", { parse_mode: "HTML" });
  }

  // Ensure all items have valid quantity (default to 1 if missing or invalid)
  ctx.session.cart.forEach((item) => {
    if (!item.quantity || item.quantity <= 0) {
      item.quantity = 1;
    }
  });

  const user = await User.findOne({ where: { telegramId } });

  // Initialize user info if not set
  if (!ctx.session.userInfo) {
    ctx.session.userInfo = {
      fullName: user?.fullName || null,
      phoneNumberOne: user?.phoneNumber1 || null,
      phoneNumberTwo: user?.phoneNumber2 || null,
      address: null,
      location: null,
    };
  }

  // Prompt for missing info
  if (!ctx.session.userInfo.fullName) {
    return ctx.reply("👤 <b>Please enter your full name to continue:</b>", {
      parse_mode: "HTML",
    });
  }

  if (!ctx.session.userInfo.phoneNumberOne) {
    return ctx.reply(
      "📞 Please share your *primary phone number* (Phone 1):",
      Markup.keyboard([
        [Markup.button.contactRequest("📲 Share Phone Number")],
        ["view menu", "last order", "profile"],
        ["history", "search by category", "🛒 View Cart"],
      ]).resize()
    );
  }

  if (!ctx.session.userInfo.phoneNumberTwo) {
    return ctx.reply(
      '📞 Now, please type your *secondary phone number* (Phone 2), or type "no" to skip:',
      Markup.keyboard([
        ["view menu", "last order", "profile"],
        ["history", "search by category", "🛒 View Cart"],
      ]).resize()
    );
  }

  if (!ctx.session.userInfo.address) {
    return ctx.reply(
      "📍 Please send your delivery address:",
      Markup.keyboard([
        ["view menu", "last order", "profile"],
        ["history", "search by category", "🛒 View Cart"],
      ]).resize()
    );
  }

  if (!ctx.session.userInfo.location) {
    return ctx.reply(
      "📍 Please share your location for delivery:",
      Markup.keyboard([
        [Markup.button.locationRequest("📍 Share Location")],
        ["view menu", "last order", "profile"],
        ["history", "search by category", "🛒 View Cart"],
      ]).resize()
    );
  }

  // All info collected, proceed to confirm
  return confirmCartOrder(ctx);
}

// Confirm and create orders from cart
async function confirmCartOrder(ctx) {
  const telegramId = ctx.from.id.toString();
  const { cart, userInfo } = ctx.session;

  try {
    const user = await User.findOne({ where: { telegramId } });

    // Update user info
    await user.update({
      fullName: userInfo.fullName,
      phoneNumber1: userInfo.phoneNumberOne,
      phoneNumber2: userInfo.phoneNumberTwo || null,
    });

    // Generate Google Maps link
    const mapLink = `https://www.google.com/maps?q=${userInfo.location.latitude},${userInfo.location.longitude}`;

    // Get last order to determine starting ID
    const lastOrder = await Order.findOne({
      order: [["createdAt", "DESC"]],
    });

    let orderIdNumber = 1;
    if (lastOrder && lastOrder.orderId) {
      const lastNumber = parseInt(lastOrder.orderId.replace("ORD", ""));
      orderIdNumber = lastNumber + 1;
    }

    const orderId = "ORD" + String(orderIdNumber).padStart(3, "0");

    // Prepare items array for JSON storage
    const itemsArray = cart.map((item) => ({
      foodId: item.foodId,
      foodName: item.food.name,
      price: item.food.price,
      quantity: item.quantity,
      specialOrder: item.specialOrder || null,
      itemTotal: item.food.price * item.quantity,
      imageUrl: item.food.imageUrl || null, // Store imageUrl in items for easy access
    }));

    // Calculate grand total
    const grandTotal = itemsArray.reduce(
      (sum, item) => sum + item.itemTotal,
      0
    );

    // Create single order with all items in JSON
    const order = await Order.create({
      orderId,
      userId: user.userId,
      items: itemsArray, // All items in JSON format with individual special orders
      totalPrice: grandTotal,
      newTotalPrice: grandTotal,
      status: "pending",
      createdBy: user.userId,
      location: userInfo.address,
      latitude: userInfo.location.latitude,
      longitude: userInfo.location.longitude,
    });

    // Build order summary
    let orderSummary = "🧾 <b>Order Summary:</b>\n\n";
    for (const item of cart) {
      const itemTotal = item.food.price * item.quantity;
      orderSummary +=
        `🍽️ <b>${item.food.name}</b>\n` +
        `   Quantity: ${item.quantity}\n` +
        `   Price: ${item.food.price} birr x ${item.quantity} = <b>${itemTotal} birr</b>\n` +
        (item.specialOrder ? `   📝 Note: ${item.specialOrder}\n` : "") +
        `\n`;
    }

    // Notify admins with single order containing all items
    let adminCaption =
      `<b>📦 New Order Received!</b>\n` +
      `🆔 <b>Order ID:</b> ${orderId}\n` +
      `👤 <b>Username:</b> @${user.username || "Not Available"}\n\n` +
      `<b>📋 Items (${cart.length}):</b>\n`;

    for (const item of cart) {
      const itemTotal = item.food.price * item.quantity;
      adminCaption +=
        `🍕 ${item.food.name} x${item.quantity} = ${itemTotal} birr\n` +
        (item.specialOrder ? `   📝 ${item.specialOrder}\n` : "");
    }

    adminCaption +=
      `\n💰 <b>Total Price: ${grandTotal} birr</b>\n` +
      `📍 <b>Address:</b> ${userInfo.address}\n\n` +
      `📝 Please review this order! 📋`;

    // Use first item's image for admin notification
    let adminImageSource = null;
    if (cart.length > 0 && cart[0].food.imageUrl) {
      const imageUrlPath = cart[0].food.imageUrl.startsWith("/")
        ? cart[0].food.imageUrl.substring(1)
        : cart[0].food.imageUrl;
      const imagePath = path.resolve(__dirname, "../public", imageUrlPath);
      if (fs.existsSync(imagePath)) {
        adminImageSource = { source: fs.createReadStream(imagePath) };
      }
    }

    // Notify admins about the new order
    try {
      await notifyOrder(orderId, adminCaption, adminImageSource);
    } catch (error) {
      console.error(
        `⚠️ Failed to notify admins for order ${orderId}:`,
        error.message
      );
      // Continue with order confirmation even if notification fails
    }

    // User confirmation message
    orderSummary +=
      `\n💰 <b>Grand Total: ${grandTotal} birr</b>\n\n` +
      `👤 <b>Full Name:</b> ${userInfo.fullName}\n` +
      `📱 <b>Phone Number 1:</b> ${userInfo.phoneNumberOne}\n` +
      `📱 <b>Phone Number 2:</b> ${
        userInfo.phoneNumberTwo || "Not Provided"
      }\n` +
      `📍 <b>Address:</b> ${userInfo.address}\n` +
      `📍 <b>Location:</b> <a href="${mapLink}">View on Map</a>\n\n` +
      `🎉 <b>All orders placed successfully!</b>\n\n` +
      `📦 We'll start processing your orders shortly. Thank you for choosing us! 🙏`;

    // Use welcome.png for order summary
    const welcomeImagePath = path.resolve(
      __dirname,
      "../../public/welcome.png"
    );
    const welcomeImageExists = fs.existsSync(welcomeImagePath);

    if (welcomeImageExists) {
      await ctx.replyWithPhoto(
        { source: fs.createReadStream(welcomeImagePath) },
        {
          caption: orderSummary,
          parse_mode: "HTML",
          reply_markup: Markup.keyboard([
            ["Start", "View Menu", "Last Order Status"],
            ["History"],
          ]).resize(),
        }
      );
    } else {
      await ctx.reply(orderSummary, {
        parse_mode: "HTML",
        reply_markup: Markup.keyboard([
          ["Start", "View Menu", "Last Order Status"],
          ["History"],
        ]).resize(),
      });
    }

    // Clear cart and user info
    ctx.session.cart = [];
    ctx.session.userInfo = null;
  } catch (error) {
    console.error("❌ Error confirming cart order:", error);
    await ctx.reply(
      "⚠️ *Something went wrong while placing your orders.* Please try again later.",
      { parse_mode: "HTML" }
    );
  }
}

// Legacy function for backward compatibility
async function confirmOrder(ctx, foodId) {
  if (!ctx.session || !ctx.session.orderData) {
    return ctx.reply(
      "⚠️ *No order found.* Please start again to place an order."
    );
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
    specialOrder,
  } = ctx.session.orderData;

  const totalPrice = food.price * quantity;
  // Remove leading slash from imageUrl if present
  const imageUrlPath = food.imageUrl?.startsWith("/")
    ? food.imageUrl.substring(1)
    : food.imageUrl;
  const imagePath = food.imageUrl
    ? path.resolve(__dirname, "../public", imageUrlPath)
    : null;
  const imageExists = imagePath && fs.existsSync(imagePath);

  // Generate Google Maps link
  const mapLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

  try {
    const user = await User.findOne({ where: { telegramId } });

    // Generate new orderId
    const lastOrder = await Order.findOne({ order: [["createdAt", "DESC"]] });

    let newIdNumber = 1;
    if (lastOrder && lastOrder.orderId) {
      const lastNumber = parseInt(lastOrder.orderId.replace("ORD", ""));
      newIdNumber = lastNumber + 1;
    }

    const orderId = "ORD" + String(newIdNumber).padStart(3, "0");

    // Count user orders
    const orderCount = await Order.count({ where: { userId: user.userId } });

    // Determine if user type should change
    const userType = orderCount >= 5 ? "customer" : user.userType;

    // Update user info
    await user.update({
      fullName,
      phoneNumber1: phoneNumberOne,
      phoneNumber2: phoneNumberTwo,
      userType: userType,
    });

    // Create items array for single order (backward compatibility)
    const itemsArray = [
      {
        foodId: food.foodId,
        foodName: food.name,
        price: food.price,
        quantity: quantity,
        specialOrder: specialOrder || null,
        itemTotal: totalPrice,
        imageUrl: food.imageUrl || null, // Store imageUrl in items for easy access
      },
    ];

    const order = await Order.create({
      orderId,
      userId: user.userId,
      items: itemsArray, // Use items array format
      totalPrice,
      newTotalPrice: totalPrice,
      status: "pending",
      createdBy: user.userId,
      location: address,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // 📦 Admin message caption
    const adminCaption =
      `<b>📦 New Order Received!</b>\n` +
      `🍕 <b>Food:</b> ${food.name}\n` +
      `👤 <b>Username:</b> @${user.username || "Not Available"}\n\n` +
      `💰 <b>Total Price:</b> ${totalPrice} birr\n` +
      `📝 <b>Special Order:</b> ${specialOrder || "None"}\n\n` +
      `📝 Please review this order! 📋`;

    let adminImageSource = null;
    if (imageExists) {
      adminImageSource = { source: fs.createReadStream(imagePath) };
    }

    // Notify admins about the new order
    try {
      await notifyOrder(orderId, adminCaption, adminImageSource);
    } catch (error) {
      console.error(
        `⚠️ Failed to notify admins for order ${orderId}:`,
        error.message
      );
      // Continue with order confirmation even if notification fails
    }

    // Confirmation to the user
    const userCaption =
      `🎉 *Your order has been successfully placed!*\n\n` +
      `🧾 *Order Summary:*\n` +
      `👤 <b>Full Name:</b> ${fullName}\n` +
      `📱 <b>Phone Number 1:</b> ${phoneNumberOne}\n` +
      `📱 <b>Phone Number 2:</b> ${phoneNumberTwo || "Not Provided"}\n` +
      `📍 <b>Address:</b> ${address}\n` + // Reordered to show address after location
      `📍 <b>Location:</b> <a href="${mapLink}">View on Map</a>\n` + // Added map link for user
      `🔢 <b>Quantity:</b> ${quantity}\n` +
      `📝 <b>Special Note:</b> ${specialOrder || "None"}\n` + // Special order for user
      `💰 <b>Total Price:</b> ${totalPrice} birr\n\n` +
      `📦 We'll start processing your order shortly. Thank you for choosing us! 🙏`;

    // Use welcome.png for order summary
    const welcomeImagePath = path.resolve(
      __dirname,
      "../../public/welcome.png"
    );
    const welcomeImageExists = fs.existsSync(welcomeImagePath);

    if (welcomeImageExists) {
      await ctx.replyWithPhoto(
        { source: fs.createReadStream(welcomeImagePath) },
        {
          caption: userCaption,
          parse_mode: "HTML",
          reply_markup: Markup.keyboard([
            ["Start", "View Menu", "Last Order Status"],
            ["History"],
          ]).resize(),
        }
      );
    } else {
      // In case welcome.png is not available
      await ctx.reply(userCaption, {
        parse_mode: "HTML",
        reply_markup: Markup.keyboard([
          ["Start", "View Menu", "Last Order Status"],
          ["History"],
        ]).resize(),
      });
    }

    // Clear session data after successful order placement
    ctx.session.orderData = null;
  } catch (error) {
    console.error("❌ Error confirming order:", error);
    await ctx.reply(
      "⚠️ *Something went wrong while placing your order.* Please try again later." +
        error
    );
  }
}

async function cancelOrder(ctx) {
  // Clear session order data
  if (ctx.session) {
    ctx.session.orderData = null;
  }
  await ctx.reply("❌ Your order has been canceled.");
}

module.exports = {
  placeOrder,
  confirmOrder,
  cancelOrder,
  addToCart,
  viewCart,
  removeFromCart,
  clearCart,
  checkout,
  confirmCartOrder,
};
