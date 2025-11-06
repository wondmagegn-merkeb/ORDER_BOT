const { Telegraf, Markup } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const path = require("path");
const fs = require("fs");
const { User, Order, Admin, FoodCategory } = require("../models/index"); // Assuming User and Order models are defined in your Sequelize setup
const { getMenu, getMenuByCategory } = require("./userHandlers/menuHandler");
const {
  placeOrder,
  confirmOrder,
  cancelOrder,
  addToCart,
  viewCart,
  removeFromCart,
  clearCart,
  checkout,
  confirmCartOrder,
} = require("./userHandlers/orderHandler");
const {
  handleFullName,
  handlePhoneNumberOne,
  handlePhoneNumber,
  handleQuantity,
  handleSpecialOrder,
  handleAddress,
  handleLocation,
} = require("./userHandlers/userDetailsHandler"); // the file you shared earlie
const {
  handleOrderHistory,
  handleHistoryMenu,
  handleLastOrder,
  handleUserProfile,
} = require("./userHandlers/userHandler"); // Importing controller functions

const userBot = new Telegraf(process.env.USER_BOT_TOKEN);

// Session support
userBot.use(new LocalSession({ database: "session_db.json" }).middleware());

// /start command
userBot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const username = ctx.from.username;
  const firstName = ctx.from.first_name || "";

  try {
    let user = await User.findOne({ where: { telegramId } });

    if (!user) {
      const lastUser = await User.findOne({
        order: [["createdAt", "DESC"]],
      });

      let newIdNumber = 1;

      if (lastUser && lastUser.userId) {
        const lastNumber = parseInt(lastUser.userId.replace("USR", ""));
        newIdNumber = lastNumber + 1;
      }

      const userId = "USR" + String(newIdNumber).padStart(3, "0");
      user = await User.create({ userId, telegramId, username });

      const imagePath = path.resolve(__dirname, "../public/welcome.png");
      await ctx.replyWithPhoto(
        { source: fs.createReadStream(imagePath) },
        {
          caption:
            `🎉 *Welcome aboard, ${firstName}!*\n\n` +
            `We’re thrilled to have you with us! 🛒✨\n` +
            `Get ready to explore a world of delicious options!\n\n` +
            `Here’s what you can do:\n\n` +
            `🍔 *Menu* - Browse a selection of tasty meals\n` +
            `📜 *History* - Check out your past orders\n` +
            `👤 *Profile* - View and manage your personal details\n\n` +
            `👇 Tap any of the options below to get started! We're excited to serve you! 🎉`,
          parse_mode: "Markdown",
          ...Markup.keyboard([
            ["view menu", "last order", "profile"],
            ["history", "search by category", "🛒 View Cart"],
          ]).resize(),
        }
      );
    } else {
      // Returning user - Displaying a more impressive "Welcome Back" message
      const imagePath = path.resolve(__dirname, "../public/welcome.png"); // Customize image path if needed

      await ctx.replyWithPhoto(
        { source: fs.createReadStream(imagePath) },
        {
          caption:
            `👋 *Welcome back, ${firstName}!*\n\n` +
            `We’re so glad to see you again! 🎉 We’ve missed you! 😄\n\n` +
            `Here's what's waiting for you:\n\n` +
            `🍽️ *Menu* - Explore our new dishes! Fresh and delicious! 🥳\n` +
            `📝 *History* - Revisit your previous orders. 🍕🍔\n` +
            `👤 *Profile* - Personalize your experience.\n\n` +
            `👇 Choose an option below to continue your order journey!\n\n` +
            `Type *menu* to start ordering or *history* to check your previous orders. 🛍️`,
          parse_mode: "Markdown",
          ...Markup.keyboard([
            ["view menu", "last order", "profile"],
            ["history", "search by category", "🛒 View Cart"],
          ]).resize(),
        }
      );
    }
  } catch (err) {
    console.error("Error handling /start:", err);
    ctx.reply("Something went wrong. Please try again later.");
  }
});

// /view menu command
userBot.hears("view menu", (ctx) => getMenu(ctx));
userBot.hears("history", async (ctx) => {
  // Show menu first, then user can choose to see all or filter
  await handleHistoryMenu(ctx);
});
userBot.hears("last order", (ctx) => handleLastOrder(ctx));
userBot.hears("profile", (ctx) => handleUserProfile(ctx));
userBot.hears(["🛒 View Cart", "view cart", "View Cart"], (ctx) =>
  viewCart(ctx)
);
userBot.hears("search by category", async (ctx) => {
  try {
    ctx.session.waitingForPhone2 = false;
    ctx.session.waitingForFullName = false;
    const categories = await FoodCategory.findAll({
      attributes: ["categoryId", "categoryName"],
    });

    const buttons = categories.map((cat) => [
      { text: cat.categoryName, callback_data: `search_cat_${cat.categoryId}` },
    ]);

    await ctx.reply("Choose a category:", {
      reply_markup: {
        inline_keyboard: [
          ...buttons,
          [{ text: "⬅ Back to Menu", callback_data: "back_to_menu" }],
        ],
      },
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    await ctx.reply("Failed to load categories.");
  }
});

// Handle callback
userBot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;

  try {
    // Handle history status filter callbacks
    if (data.startsWith("history_")) {
      await ctx.answerCbQuery();
      const status = data.replace("history_", "");
      console.log("status", status);

      if (status === "menu") {
        await handleHistoryMenu(ctx);
      } else if (status === "all") {
        await handleOrderHistory(ctx, null);
      } else {
        // Filter by specific status
        await handleOrderHistory(ctx, status);
      }
      return;
    }

    // Handle feedback
    if (data.startsWith("feedback_")) {
      // Split the data to extract orderId and reaction
      const [, orderId, reaction] = data.split("_");

      const order = await Order.findByPk(orderId);
      if (!order) return ctx.reply("❌ Order not found.");

      order.feedback = reaction;
      await order.save();

      // Send a reply to acknowledge the feedback submission
      await ctx.answerCbQuery("Thanks for your feedback!");
    }
    if (data.startsWith("search_cat_")) {
      const categoryId = data.split("search_cat_")[1];
      return getMenuByCategory(ctx, categoryId);
    }

    if (data === "back_to_menu") {
      return getMenu(ctx); // replace with your main menu function
    }

    if (data === "edit_profile") {
      await ctx.answerCbQuery();
      await ctx.reply("What would you like to update?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📝 Full Name", callback_data: "edit_full_name" }],
            [{ text: "📱 Phone 2", callback_data: "edit_phone2" }],
          ],
        },
      });
    }

    if (data === "edit_full_name") {
      await ctx.answerCbQuery();
      ctx.session.waitingForFullName = true;
      ctx.session.waitingForPhone2 = false;
      ctx.session.waitingForQuantity = null;
      ctx.session.waitingForNote = null;
      await ctx.reply("📝 Please send your new full name.");
    }

    if (data === "edit_phone2") {
      await ctx.answerCbQuery();
      ctx.session.waitingForPhone2 = true;
      ctx.session.waitingForFullName = false;
      ctx.session.waitingForQuantity = null;
      ctx.session.waitingForNote = null;
      await ctx.reply("📱 Please send your new Phone 2 number.");
    }

    // Handle cart operations
    if (data.startsWith("add_cart_")) {
      const foodId = data.split("_")[2];
      return addToCart(ctx, foodId);
    }

    if (data === "view_cart") {
      return viewCart(ctx);
    }

    if (data.startsWith("remove_cart_")) {
      const foodId = data.split("_")[2];
      return removeFromCart(ctx, foodId);
    }

    if (data === "clear_cart") {
      return clearCart(ctx);
    }

    if (data === "checkout") {
      return checkout(ctx);
    }

    if (data.startsWith("set_qty_menu_")) {
      const foodId = data.split("_")[3];
      if (!ctx.session.cart) ctx.session.cart = [];
      const itemIndex = ctx.session.cart.findIndex(
        (item) => item.foodId === foodId || item.foodId?.toString() === foodId
      );
      await ctx.answerCbQuery();
      return ctx.reply(
        `🍽️ <b>Set Quantity</b> for <b>${ctx.session.cart[itemIndex].food.name}</b>\n\nChoose quantity:`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "1", callback_data: `set_qty_${foodId}_1` },
                { text: "2", callback_data: `set_qty_${foodId}_2` },
                { text: "3", callback_data: `set_qty_${foodId}_3` },
              ],
              [
                { text: "4", callback_data: `set_qty_${foodId}_4` },
                { text: "5", callback_data: `set_qty_${foodId}_5` },
                { text: "6", callback_data: `set_qty_${foodId}_6` },
              ],
              [
                {
                  text: "📝 Enter Custom",
                  callback_data: `custom_qty_${foodId}`,
                },
              ],
              [{ text: "⬅️ Back to Cart", callback_data: "view_cart" }],
            ],
          },
        }
      );
    }

    // Handle quantity setting
    if (data.startsWith("set_qty_")) {
      const parts = data.split("_");
      const foodId = parts[2];
      const quantity = parseInt(parts[3]);
      if (!ctx.session.cart) ctx.session.cart = [];
      const itemIndex = ctx.session.cart.findIndex(
        (item) => item.foodId === foodId || item.foodId?.toString() === foodId
      );
      if (itemIndex !== -1) {
        ctx.session.cart[itemIndex].quantity = quantity;
        await ctx.answerCbQuery(`✅ Quantity set to ${quantity}!`);
        // await ctx.reply(
        //   `✅ <b>Quantity set to ${quantity}</b>\n\n` +
        //     `Would you like to add a special note for this item?`,
        //   {
        //     parse_mode: "HTML",
        //     reply_markup: {
        //       inline_keyboard: [
        //         [
        //           {
        //             text: "📝 Add Note",
        //             callback_data: `add_note_${foodId}`,
        //           },
        //           { text: "➡️ Skip", callback_data: "view_cart" },
        //         ],
        //       ],
        //     },
        //   }
        // );
      } else {
        await ctx.answerCbQuery("❌ Item not found in cart. Please try again.");
        await ctx.reply(
          "⚠️ <b>Item not found in cart.</b>\n\nPlease add the item to cart first.",
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🛒 View Cart", callback_data: "view_cart" }],
                [{ text: "📋 View Menu", callback_data: "back_to_menu" }],
              ],
            },
          }
        );
      }
      return;
    }

    if (data.startsWith("custom_qty_")) {
      const foodId = data.split("_")[2];
      ctx.session.waitingForQuantity = foodId;
      ctx.session.waitingForFullName = false;
      ctx.session.waitingForPhone2 = false;
      ctx.session.waitingForNote = null;
      await ctx.answerCbQuery();
      return ctx.reply(
        "📝 Please enter the quantity (number only):",
        Markup.keyboard([["❌ Cancel"]]).resize()
      );
    }

    if (data.startsWith("update_qty_")) {
      const foodId = data.split("_")[2];
      ctx.session.waitingForQuantity = foodId;
      ctx.session.waitingForFullName = false;
      ctx.session.waitingForPhone2 = false;
      ctx.session.waitingForNote = null;
      await ctx.answerCbQuery();
      return ctx.reply(
        "📝 Please enter the new quantity (number only):",
        Markup.keyboard([["❌ Cancel"]]).resize()
      );
    }

    if (data.startsWith("add_note_")) {
      const foodId = data.split("_")[2];
      ctx.session.waitingForNote = foodId;
      ctx.session.waitingForQuantity = null;
      ctx.session.waitingForFullName = false;
      ctx.session.waitingForPhone2 = false;
      await ctx.answerCbQuery();
      return ctx.reply(
        "📝 Please enter your special note for this item:",
        Markup.keyboard([["❌ Skip"]]).resize()
      );
    }

    // Legacy handlers for backward compatibility
    if (data.startsWith("order_now_")) {
      const foodId = data.split("_")[2];
      return placeOrder(ctx, foodId);
    }

    if (data.startsWith("confirm_order_now_")) {
      const foodId = data.split("_")[3];
      return confirmOrder(ctx, foodId);
    }

    if (data.startsWith("cancel_order_now_")) {
      return cancelOrder(ctx);
    }
  } catch (err) {
    console.error("❌ Error handling callback:", err);
    await ctx.reply(
      "⚠️ <b>Something went wrong while processing your request. Please try again later.</b>",
      { parse_mode: "HTML" }
    );
  }
});

userBot.on("contact", (ctx) => {
  // Handle contact for cart checkout
  if (ctx.session && ctx.session.userInfo) {
    const phoneNumberOne = ctx.message.contact.phone_number;
    ctx.session.userInfo.phoneNumberOne = phoneNumberOne;

    // Continue checkout flow
    if (!ctx.session.userInfo.phoneNumberTwo) {
      return ctx.reply(
        '📞 Now, please type your *secondary phone number* (Phone 2), or type "no" to skip:',
        Markup.keyboard([
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize()
      );
    }
    return checkout(ctx);
  }

  // Legacy handler for single order
  if (!ctx.session || !ctx.session.orderData) {
    return ctx.reply("Session expired. Please restart your order.");
  }

  const phoneNumberOne = ctx.message.contact.phone_number;
  ctx.session.orderData.phoneNumberOne = phoneNumberOne;

  return handlePhoneNumberOne(ctx);
});

userBot.on("location", (ctx) => {
  // Handle location for cart checkout
  if (ctx.session && ctx.session.userInfo) {
    const { latitude, longitude } = ctx.message.location;
    ctx.session.userInfo.location = { latitude, longitude };

    // All info collected, proceed to confirm
    return confirmCartOrder(ctx);
  }

  // Legacy handler for single order
  if (ctx.session.orderData && !ctx.session.orderData.location) {
    return handleLocation(ctx);
  }
});

userBot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  // Handle profile editing
  if (ctx.session.waitingForFullName) {
    const fullName = text;
    await User.update(
      { fullName },
      { where: { telegramId: ctx.from.id.toString() } }
    );
    ctx.session.waitingForFullName = false;
    await ctx.reply("✅ Full name updated successfully!");
    return handleUserProfile(ctx);
  }

  if (ctx.session.waitingForPhone2) {
    const phone2 = text;
    const phoneRegex = /^(09|07)\d{8}$/;
    if (!phoneRegex.test(phone2)) {
      return ctx.reply(
        "❌ Invalid number. Enter a 10-digit number starting with 09 or 07."
      );
    }
    await User.update(
      { phoneNumber2: phone2 },
      { where: { telegramId: ctx.from.id.toString() } }
    );
    ctx.session.waitingForPhone2 = false;
    await ctx.reply("✅ Phone 2 updated successfully!");
    return handleUserProfile(ctx);
  }

  // Handle cart quantity input
  if (ctx.session.waitingForQuantity) {
    if (text === "❌ Cancel") {
      ctx.session.waitingForQuantity = null;
      return ctx.reply("❌ Cancelled.", {
        ...Markup.keyboard([
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize(),
      });
    }

    const quantity = parseInt(text);
    if (isNaN(quantity) || quantity <= 0) {
      return ctx.reply("❌ Please enter a valid number greater than 0.");
    }

    const foodId = ctx.session.waitingForQuantity;
    if (!ctx.session.cart) ctx.session.cart = [];
    const itemIndex = ctx.session.cart.findIndex(
      (item) => item.foodId === foodId || item.foodId?.toString() === foodId
    );

    if (itemIndex !== -1) {
      ctx.session.cart[itemIndex].quantity = quantity;
      ctx.session.waitingForQuantity = null;
      return viewCart(ctx);
    } else {
      ctx.session.waitingForQuantity = null;
      await ctx.reply("⚠️ <b>Item not found in cart.</b> Please try again.", {
        parse_mode: "HTML",
      });
    }
    return;
  }
  // Handle cart note input
  if (ctx.session.waitingForNote) {
    if (text === "❌ Skip") {
      ctx.session.waitingForNote = null;
      await ctx.reply("❌ skipped.", {
        ...Markup.keyboard([
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize(),
      });
      return viewCart(ctx);
    }

    const foodId = ctx.session.waitingForNote;
    if (!ctx.session.cart) ctx.session.cart = [];
    const itemIndex = ctx.session.cart.findIndex(
      (item) => item.foodId === foodId || item.foodId?.toString() === foodId
    );

    if (itemIndex !== -1) {
      ctx.session.cart[itemIndex].specialOrder = text;
      ctx.session.waitingForNote = null;
      await ctx.reply("✅ <b>Special note added!</b>", { parse_mode: "HTML" });
      return viewCart(ctx);
    } else {
      ctx.session.waitingForNote = null;
      await ctx.reply(
        "⚠️ <b>Item not found in cart.</b>\n\nPlease add the item to cart first.",
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛒 View Cart", callback_data: "view_cart" }],
              [{ text: "📋 View Menu", callback_data: "back_to_menu" }],
            ],
          },
        }
      );
    }
    return;
  }

  // Handle checkout user info
  if (ctx.session && ctx.session.userInfo) {
    if (!ctx.session.userInfo.fullName) {
      ctx.session.userInfo.fullName = text;
      return ctx.reply(
        "📞 Please share your *primary phone number* (Phone 1):",
        Markup.keyboard([
          [Markup.button.contactRequest("📲 Share Phone Number")],
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize()
      );
    }

    if (!ctx.session.userInfo.phoneNumberOne) {
      // This should be handled by contact handler, but fallback
      ctx.session.userInfo.phoneNumberOne = text;
      return ctx.reply(
        '📞 Now, please type your *secondary phone number* (Phone 2), or type "no" to skip:',
        Markup.keyboard([
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize()
      );
    }

    if (!ctx.session.userInfo.phoneNumberTwo) {
      if (text.toLowerCase() === "no") {
        ctx.session.userInfo.phoneNumberTwo = null;
      } else {
        ctx.session.userInfo.phoneNumberTwo = text;
      }
      return ctx.reply(
        "📍 Please send your delivery address:",
        Markup.keyboard([
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize()
      );
    }

    if (!ctx.session.userInfo.address) {
      ctx.session.userInfo.address = text;
      return ctx.reply(
        "📍 Please share your location for delivery:",
        Markup.keyboard([
          [Markup.button.locationRequest("📍 Share Location")],
          ["view menu", "last order", "profile"],
          ["history", "search by category", "🛒 View Cart"],
        ]).resize()
      );
    }
  }

  // Legacy handlers for single order
  if (!ctx.session.orderData) return;
  if (!ctx.session.orderData.fullName) return handleFullName(ctx);
  if (!ctx.session.orderData.phoneNumberOne) return handlePhoneNumberOne(ctx);
  if (!ctx.session.orderData.phoneNumberTwo) return handlePhoneNumber(ctx);
  if (!ctx.session.orderData.quantity) return handleQuantity(ctx);
  if (!ctx.session.orderData.specialOrder) return handleSpecialOrder(ctx);
  if (!ctx.session.orderData.address) return handleAddress(ctx);
  if (!ctx.session.orderData.location) return handleLocation(ctx);
});

async function sendMessageToUser(telegramId, message, parseMode = "HTML") {
  try {
    await userBot.telegram.sendMessage(telegramId, message, {
      parse_mode: parseMode,
    });
    console.log(`✅ Message sent to user ${telegramId}`);
  } catch (error) {
    console.error(`❌ Failed to send message to user ${telegramId}:`, error);
  }
}

module.exports = { userBot, sendMessageToUser };
