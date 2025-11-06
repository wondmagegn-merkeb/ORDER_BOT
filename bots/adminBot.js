const { Telegraf, Markup } = require("telegraf");
const path = require("path");
const fs = require("fs");
const { Order, User, Admin, Food } = require("../models/index");
const { placeOrder } = require("./adminHandlers/getHandler"); // update the path as needed
const { Op } = require("sequelize");
const {
  viewOrderDetails,
  showOrdersInPending,
  showOrdersInProgress,
  showOrdersInCompleted,
  showOrdersInCancelled,
  showOrdersInDelivered,
} = require("./adminHandlers/getHandler");
const { showStats } = require("./adminHandlers/statsHandler");
const { sendMessageToUser } = require("./userBot");
const adminBot = new Telegraf(process.env.ADMIN_BOT_TOKEN);
const tempStates = {}; // Temporary in-memory state tracking
// ===== Fetch Admin Role =====
const getAdminRole = async (ctx, telegramId) => {
  try {
    // Check for active admin first
    let admin = await Admin.findOne({
      where: { telegramId, states: "active" },
    });

    // If not found, check for inactive admin (for profile viewing)
    if (!admin) {
      admin = await Admin.findOne({
        where: { telegramId },
        paranoid: false,
      });
    }

    if (!admin) {
      return null;
    }

    ctx.state.adminId = admin.adminId;
    ctx.state.adminStatus = admin.states; // Store status for later use
    return admin.role;
  } catch (err) {
    console.error("Error fetching admin role:", err);
    await ctx.reply("❌ An error occurred while checking authorization.");
    return null;
  }
};

// ===== Middleware: Authorization =====
adminBot.use(async (ctx, next) => {
  if (!ctx.from) return;

  // Check message text first
  const messageText = ctx.message?.text || "";
  const isProfileCommand = messageText === "👤 Profile";
  const isStartCommand = messageText === "/start";

  // If it's start or profile, check role but allow guest access
  if (isStartCommand || isProfileCommand) {
    const role = await getAdminRole(ctx, ctx.from.id);
    if (role) {
      ctx.state.role = role;
      ctx.state.adminId = ctx.state.adminId || null;
    } else {
      // No role found - set as guest
      ctx.state.role = "guest";
      ctx.state.adminId = null;
    }
    return next();
  }

  // For all other commands, require role
  const role = await getAdminRole(ctx, ctx.from.id);
  if (!role) {
    return ctx.reply("❌ You are not authorized to use this bot.");
  }
  ctx.state.role = role;
  return next();
});

// ===== /start Command with Role-based Menu =====
adminBot.start(async (ctx) => {
  const firstName = ctx.from.first_name || "Admin";
  const role = ctx.state.role || "guest";

  const imagePath = path.resolve(__dirname, "../public/welcome.png");
  const imageExists = fs.existsSync(imagePath);

  const fullKeyboard = Markup.keyboard([
    ["📦 Orders in Progress", "⏳ Orders Pending"],
    ["✅ Completed Orders", "📬 Delivered Orders"],
    ["📊 Stats", "🗑️ Cancelled Orders"],
    ["👤 Profile"],
  ]).resize();

  const deliveryKeyboard = Markup.keyboard([
    ["✅ Completed Orders", "📬 Delivered Orders"],
    ["👤 Profile"],
  ]).resize();

  const guestKeyboard = Markup.keyboard([["👤 Profile"]]).resize();

  // Welcome message based on role
  let welcomeMessage = "";
  if (role === "admin") {
    welcomeMessage =
      `👋 *Hello ${firstName}*,\n\n` +
      `Welcome to the *Admin Dashboard*! 👑\n\n` +
      `You have full access to manage orders, view statistics, and oversee all operations.\n\n` +
      `Use the menu below to get started.`;
  } else if (role === "manager") {
    welcomeMessage =
      `👋 *Hello ${firstName}*,\n\n` +
      `Welcome to the *Manager Dashboard*! 👔\n\n` +
      `You can manage orders, view statistics, and handle daily operations.\n\n` +
      `Use the menu below to get started.`;
  } else if (role === "delivery") {
    welcomeMessage =
      `👋 *Hello ${firstName}*,\n\n` +
      `Welcome to the *Delivery Dashboard*! 🚚\n\n` +
      `You can view completed orders ready for delivery and track your delivered orders.\n\n` +
      `Use the menu below to get started.`;
  } else {
    // Guest or not registered
    welcomeMessage =
      `👋 *Hello ${firstName}*,\n\n` +
      `Welcome to the *Order Bot*! 👤\n\n` +
      `You are not registered as an admin in the system. You can view your profile information.\n\n` +
      `Contact an administrator to get full access.`;
  }

  try {
    // Determine which keyboard to show based on role
    let keyboard;
    if (role === "delivery") {
      keyboard = deliveryKeyboard;
    } else if (role === "admin" || role === "manager") {
      keyboard = fullKeyboard;
    } else {
      // Guest or any other case - show guest keyboard
      keyboard = guestKeyboard;
    }

    // Debug: Log role and keyboard
    console.log("Role:", role);
    console.log(
      "Keyboard type:",
      role === "delivery"
        ? "delivery"
        : role === "admin" || role === "manager"
        ? "full"
        : "guest"
    );
    console.log("Keyboard reply_markup:", keyboard.reply_markup);

    // Ensure keyboard is properly formatted
    const replyMarkup = keyboard.reply_markup || keyboard;

    if (imageExists) {
      await ctx.replyWithPhoto(
        { source: fs.createReadStream(imagePath) },
        {
          caption: welcomeMessage,
          parse_mode: "Markdown",
          reply_markup: replyMarkup,
        }
      );
    } else {
      await ctx.reply(welcomeMessage, {
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      });
    }
  } catch (err) {
    console.error("Error sending welcome message:", err);
    await ctx.reply("Something went wrong. Please try again later." + err);
  }
});

// ===== Order Handlers Based on Role and Status =====
adminBot.hears("📦 Orders in Progress", (ctx) => showOrdersInProgress(ctx));
adminBot.hears("⏳ Orders Pending", (ctx) => showOrdersInPending(ctx));
adminBot.hears("✅ Completed Orders", (ctx) => showOrdersInCompleted(ctx));
adminBot.hears("🗑️ Cancelled Orders", (ctx) => showOrdersInCancelled(ctx));
adminBot.hears("📬 Delivered Orders", (ctx) => showOrdersInDelivered(ctx));
adminBot.hears("📊 Stats", async (ctx) => {
  await showStats(ctx);
});

// ===== Profile Handler =====
adminBot.hears("👤 Profile", async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const firstName = ctx.from.first_name || "User";
    const lastName = ctx.from.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    // Fetch admin details from database (including inactive admins)
    const admin = await Admin.findOne({
      where: { telegramId },
      paranoid: false, // Include soft-deleted records
    });

    // Get Telegram username from context
    const telegramUsername = ctx.from.username
      ? `@${ctx.from.username}`
      : "Not set";

    let profileMessage = "";

    if (admin) {
      // Admin found in database - show full profile
      // Format status
      const statusEmoji =
        admin.states === "active"
          ? "✅"
          : admin.states === "inactive"
          ? "❌"
          : admin.states === "blocked"
          ? "🚫"
          : "❓";
      const statusText = admin.states || "Unknown";

      // Format role
      const roleEmoji =
        admin.role === "admin"
          ? "👑"
          : admin.role === "manager"
          ? "👔"
          : admin.role === "delivery"
          ? "🚚"
          : "👤";

      profileMessage = `👤 <b>Admin Profile</b>

${roleEmoji} <b>Role:</b> ${admin.role}
${statusEmoji} <b>Status:</b> ${statusText}

📱 <b>Telegram Username:</b> ${telegramUsername}
🆔 <b>Telegram ID:</b> <code>${telegramId}</code>
👤 <b>System Username:</b> ${admin.username}
📧 <b>Email:</b> <code>${admin.email}</code>
🆔 <b>Admin ID:</b> <code>${admin.adminId}</code>`;
    } else {
      // Admin not found in database - show Telegram info only
      profileMessage = `👤 <b>Telegram Profile</b>

⚠️ <b>Status:</b> Not registered in system

👤 <b>Name:</b> ${fullName}
📱 <b>Telegram Username:</b> ${telegramUsername}
🆔 <b>Telegram ID:</b> <code>${telegramId}</code>

ℹ️ <b>Note:</b> This user is not registered as an admin in the system.`;
    }

    await ctx.reply(profileMessage, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("❌ Error fetching admin profile:", err);
    await ctx.reply("❌ An error occurred while fetching your profile.");
  }
});

adminBot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const adminId = ctx.state.adminId;
  try {
    await ctx.answerCbQuery(); // Acknowledge button click

    // Handle ordering
    if (data.startsWith("view_order_")) {
      const orderId = data.split("_")[2];
      return viewOrderDetails(ctx, orderId);
    }

    // ----- Mark Order In Progress (ask for price edit) -----
    if (data.startsWith("mark_inprogress_")) {
      const orderId = data.split("_")[2];
      tempStates[ctx.from.id] = { action: "confirm_edit_price", orderId };
      await ctx.answerCbQuery();
      return ctx.reply(
        "📝 Do you want to edit the price before marking this order as *in progress*?",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Yes", `edit_price_yes_${orderId}`)],
            [Markup.button.callback("❌ No", `edit_price_no_${orderId}`)],
          ]),
        }
      );
    }

    // ----- Admin Chooses to Edit Price -----
    if (data.startsWith("edit_price_yes_")) {
      const orderId = data.split("_")[3];
      tempStates[ctx.from.id] = { action: "awaiting_price_input", orderId };
      await ctx.answerCbQuery();
      return ctx.reply("💰 Please send the *new price* for the order:", {
        parse_mode: "Markdown",
      });
    }

    // ----- Admin Chooses Not to Edit Price -----
    if (data.startsWith("edit_price_no_")) {
      const orderId = data.split("_")[3];
      await ctx.answerCbQuery();
      try {
        const order = await Order.findByPk(orderId);
        if (!order) return ctx.reply("❌ Order not found.");

        order.updatedBy = adminId;
        order.status = "progress";
        await order.save();

        const user = await User.findOne({ where: { userId: order.userId } });

        const oldPrice = order.totalPrice
          ? Number(order.totalPrice).toFixed(2)
          : "N/A";
        const message = `
✅ <b>Your Order Has Been Accepted</b>

<b>Order ID:</b> ${orderId}
<b>Price:</b> ${oldPrice} birr

<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>

<b>Reason for Price Change:</b> ${
          order.specialOrder ||
          "This could be due to special order adjustments, such as customized items or delivery-related fees."
        }
        `;

        if (user && user.telegramId) {
          await sendMessageToUser(user.telegramId, message);
        }

        return ctx.reply("🚚 Order marked as *In Progress* successfully!", {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error("❌ Error updating order:", err);
        return ctx.reply("Something went wrong while updating the order.");
      }
    }

    // ----- Mark Order as Completed -----
    if (data.startsWith("mark_completed_")) {
      const orderId = data.split("_")[2];
      await ctx.answerCbQuery();
      try {
        const order = await Order.findByPk(orderId);
        if (!order) return ctx.reply("❌ Order not found.");

        order.updatedBy = adminId;
        order.status = "completed";
        await order.save();

        const user = await User.findOne({ where: { userId: order.userId } });

        const oldPrice = order.totalPrice
          ? Number(order.totalPrice).toFixed(2)
          : "N/A";
        const newPrice = order.newTotalPrice
          ? Number(order.newTotalPrice).toFixed(2)
          : "N/A";

        const message = `
🎉 <b>Your Order Has Been Completed</b> 🎉

<b>Order ID:</b> ${orderId}

<i>Thank you for your patience! Your order has now been completed. We truly appreciate your trust in us.</i>
        `;

        if (user?.telegramId) {
          await sendMessageToUser(user.telegramId, message);
        }

        const deliveryAdmins = await Admin.findAll({
          where: { role: "delivery", states: "active" },
        });

        if (deliveryAdmins.length) {
          const deliveryMessage = `
🚚 <b>Delivery Team, Please Address the Completed Order</b> 🍽️

<b>Order ID:</b> ${orderId}
<b>Old Price:</b> ${oldPrice} birr
<b>New Price:</b> ${newPrice} birr

<i>The food is now ready for delivery. Please ensure all items are delivered according to the customer's request. Check any special order notes for accuracy.</i>
            `;

          for (const admin of deliveryAdmins) {
            if (admin.telegramId) {
              await adminBot.telegram.sendMessage(
                admin.telegramId,
                deliveryMessage,
                {
                  parse_mode: "HTML",
                }
              );
            }
          }
        }

        return ctx.reply("✅ Order marked as *Completed* successfully!", {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error("❌ Error updating order status to completed:", err);
        return ctx.reply(
          "Something went wrong while marking the order as completed."
        );
      }
    }

    // ----- Mark Order as Completed -----
    if (data.startsWith("mark_delivered_")) {
      const orderId = data.split("_")[2];
      await ctx.answerCbQuery();
      try {
        const order = await Order.findByPk(orderId);
        if (!order) return ctx.reply("❌ Order not found.");

        order.updatedBy = adminId;
        order.status = "delivered";
        order.deliveryUserId = adminId; // Store the delivery user ID
        await order.save();

        const user = await User.findOne({ where: { userId: order.userId } });

        const oldPrice = order.totalPrice
          ? Number(order.totalPrice).toFixed(2)
          : "N/A";
        const newPrice = order.newTotalPrice
          ? Number(order.newTotalPrice).toFixed(2)
          : oldPrice;

        let message = `
✅ <b>Your Order Has Been Delivered</b>

<b>Order ID:</b> ${orderId}
<b>Price:</b> ${oldPrice} birr

<i>We hope you enjoy your meal! Your order has now been delivered.</i>
        `;

        if (newPrice !== oldPrice) {
          message = `
✅ <b>Your Order Has Been Delivered</b>

<b>Order ID:</b> ${orderId}
<b>Old Price:</b> ${oldPrice} birr
<b>New Price:</b> ${newPrice} birr

<i>We hope you enjoy your meal! Your order has now been delivered.</i>

<b>Reason for Price Change:</b> ${
            order.specialOrder ||
            "Special request adjustments or delivery-related changes."
          }
            `;
        }

        message += `

🙏 <b>We would love to hear your feedback!</b> 📝

<i>Let us know if you're satisfied with your order or if there's anything we can improve. Your feedback helps us serve you better!</i>

<i>Reply to this message or contact us for assistance.</i>
        `;

        if (user?.telegramId) {
          await sendMessageToUser(user.telegramId, message);
        }

        return ctx.reply("✅ Order marked as *Delivered* successfully!", {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error("❌ Error updating order status to delivered:", err);
        return ctx.reply(
          "Something went wrong while marking the order as delivered."
        );
      }
    }

    // ----- Cancel Order: Ask for confirmation -----
    if (data.startsWith("cancel_order_")) {
      const orderId = data.split("_")[2];
      await ctx.answerCbQuery();
      return ctx.reply("❗ Are you sure you want to cancel this order?", {
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "❌ Yes, Cancel Order",
              `confirm_cancel_${orderId}`
            ),
          ],
          [Markup.button.callback("↩️ No, Go Back", "cancel_back")],
        ]),
      });
    }

    if (data === "cancel_back") {
      await ctx.answerCbQuery("Action cancelled");
      return ctx.reply(
        "✅ Action cancelled. You can continue managing your orders."
      );
    }

    // ----- Confirm Cancellation -----
    if (data.startsWith("confirm_cancel_")) {
      const orderId = data.split("_")[2];
      try {
        const order = await Order.findByPk(orderId);
        if (!order) return ctx.reply("❌ Order not found.");
        order.updatedBy = adminId;
        order.status = "cancelled";
        await order.save();
        const user = await User.findOne({ where: { userId: order.userId } });

        const message = `
❌ <b>Your Order Has Been Cancelled</b>\n
<b>Order ID:</b> ${orderId}\n
<i>We regret to inform you that your order has been cancelled. We understand this might be disappointing and sincerely apologize for any inconvenience caused.</i>\n
<i>If you need more information or would like to discuss any concerns, please don’t hesitate to contact our support team.</i>
            `;

        if (message && user.telegramId) {
          await sendMessageToUser(user.telegramId, message);
        }
        return ctx.reply("✅ Order has been successfully cancelled.", {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error("❌ Error cancelling order:", err);
        return ctx.reply("Something went wrong while cancelling the order.");
      }
    }
  } catch (err) {
    console.error("❌ Error handling callback:", err);
    await ctx.reply(
      "⚠️ <b>Something went wrong while processing your request. Please try again later.</b>",
      { parse_mode: "HTML" }
    );
  }
});

adminBot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const state = tempStates[userId];
  const adminId = ctx.state.adminId;
  if (state?.action === "awaiting_price_input") {
    const newPrice = parseFloat(ctx.message.text);

    if (isNaN(newPrice) || newPrice <= 0) {
      return ctx.reply(
        "❌ Invalid price. Please enter a valid number greater than 0."
      );
    }

    try {
      const order = await Order.findByPk(state.orderId);
      if (!order) return ctx.reply("❌ Order not found.");

      order.updatedBy = adminId;
      order.newTotalPrice = newPrice;
      order.status = "progress";
      await order.save();

      delete tempStates[userId];
      const user = await User.findOne({ where: { userId: order.userId } });

      const oldPrice = oldTotalPrice ? Number(oldTotalPrice).toFixed(2) : "N/A";
      const newPrice = newTotalPrice ? Number(newTotalPrice).toFixed(2) : "N/A";

      const message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n

<b>Reason for Price Change:</b> ${
        order.specialOrder ||
        "This could be due to special order adjustments, such as customized items or delivery-related fees."
      }
          \n 
<i>If you have any questions or need any updates, feel free to contact us!</i>
            `;

      if (message && user.telegramId) {
        await sendMessageToUser(user.telegramId, message);
      }
      return ctx.reply(
        `✅ Order price updated to *${newPrice}* and marked as *In Progress*!`,
        {
          parse_mode: "Markdown",
        }
      );
    } catch (err) {
      console.error("Error updating order price:", err);
      return ctx.reply(
        "❌ Failed to update order. Please try again later." + err
      );
    }
  }

  // If no state, let the bot ignore or handle other inputs normally
});
async function sendMessageToAdmin(telegramId, message, parseMode = "HTML") {
  try {
    await adminBot.telegram.sendMessage(telegramId, message, {
      parse_mode: parseMode,
    });
  } catch (error) {
    console.error(`❌ Failed to send message to user ${telegramId}:`, error);
  }
}
module.exports = { adminBot, sendMessageToAdmin };
