const { Order, User, Food } = require("../../models/index");
const { Markup } = require("telegraf");

async function viewOrderDetails(ctx, orderId) {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          attributes: ["username", "fullName", "phoneNumber1", "phoneNumber2"],
        },
      ],
    });

    if (!order) {
      return ctx.reply("Order not found.");
    }

    const items = order.items || [];
    const googleMapsLink = `[📍 View Map](https://www.google.com/maps?q=${order.latitude},${order.longitude})`;

    // Build items list
    let itemsText = "";
    for (const item of items) {
      itemsText += `🍽️ ${item.foodName} x${item.quantity} = ${item.itemTotal} birr\n`;
      if (item.specialOrder) {
        itemsText += `   📝 ${item.specialOrder}\n`;
      }
      itemsText += "\n";
    }

    const caption =
      `📝 *Order ID:* ${order.orderId}\n` +
      `🧍 *Customer:* ${order.User.fullName}\n` +
      `👤 *Username:* @${order.User?.username || "N/A"}\n\n` +
      `📋 *Items (${items.length}):*\n${itemsText}` +
      `💰 *Total Price:* ${order.newTotalPrice} birr\n` +
      `📞 *Phone 1:* ${order.User.phoneNumber1}\n` +
      `📞 *Phone 2:* ${order.User.phoneNumber2}\n` +
      `🚚 *Status:* ${order.status}\n\n` +
      `${googleMapsLink}`;

    // Use first item's image if available
    const firstItemImage =
      items.length > 0 && items[0].imageUrl ? items[0].imageUrl : null;

    if (firstItemImage) {
      const path = require("path");
      const fs = require("fs");
      const imagePath = path.resolve(
        __dirname,
        "../../public",
        firstItemImage.startsWith("/")
          ? firstItemImage.substring(1)
          : firstItemImage
      );
      if (fs.existsSync(imagePath)) {
        await ctx.replyWithPhoto(
          { source: fs.createReadStream(imagePath) },
          {
            caption,
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard(
              ctx.state.role === "admin" || ctx.state.role === "manager"
                ? [
                    [
                      Markup.button.callback(
                        "🚚 Mark In Progress",
                        `mark_inprogress_${order.orderId}`
                      ),
                    ],
                    [
                      Markup.button.callback(
                        "❌ Cancel Order",
                        `cancel_order_${order.orderId}`
                      ),
                    ],
                  ]
                : [
                    [
                      Markup.button.callback(
                        "🚚 Mark In Progress",
                        `mark_inprogress_${order.orderId}`
                      ),
                    ],
                  ]
            ),
          }
        );
      } else {
        await ctx.reply(caption, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "🚚 Mark In Progress",
                `mark_inprogress_${order.orderId}`
              ),
            ],
            [
              Markup.button.callback(
                "❌ Cancel Order",
                `cancel_order_${order.orderId}`
              ),
            ],
          ]),
        });
      }
    } else {
      await ctx.reply(caption, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "🚚 Mark In Progress",
              `mark_inprogress_${order.orderId}`
            ),
          ],
          [
            Markup.button.callback(
              "❌ Cancel Order",
              `cancel_order_${order.orderId}`
            ),
          ],
        ]),
      });
    }
  } catch (err) {
    console.error("❌ Error viewing order:", err);
    await ctx.reply("Something went wrong while viewing order details.");
  }
}

async function showOrdersByStatus(ctx, status, label) {
  try {
    if (
      ctx.state.role === "delivery" &&
      status !== "completed" &&
      status !== "delivered"
    ) {
      return ctx.reply("❌ You are not allowed to access this section.");
    }

    // Build where clause
    const whereClause = { status };

    // If user is delivery role and viewing delivered orders, filter by their deliveryUserId
    if (ctx.state.role === "delivery" && status === "delivered") {
      whereClause.deliveryUserId = ctx.state.adminId;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["username", "fullName", "phoneNumber1", "phoneNumber2"],
        },
      ],
    });

    if (!orders.length) {
      return ctx.reply(`📦 No orders in ${label}.`);
    }

    const path = require("path");
    const fs = require("fs");

    for (const order of orders) {
      const items = order.items || [];
      const user = order.User;
      const googleMapsLink = `[📍 View Map](https://www.google.com/maps?q=${order.latitude},${order.longitude})`;

      // Build items list
      let itemsText = "";
      for (const item of items) {
        itemsText += `🍽️ ${item.foodName} x${item.quantity} = ${item.itemTotal} birr\n`;
        if (item.specialOrder) {
          itemsText += `   📝 ${item.specialOrder}\n`;
        }
        itemsText += "\n";
      }

      let caption =
        `📝 *Order ID:* ${order.orderId}\n` +
        `🧍 *Customer:* ${user.fullName}\n` +
        `👤 *Username:* @${user.username || "N/A"}\n\n` +
        `📋 *Items (${items.length}):*\n${itemsText}` +
        `💰 *Total Price:* ${order.newTotalPrice} birr\n` +
        `📞 *Phone 1:* ${user.phoneNumber1}\n` +
        `📞 *Phone 2:* ${user.phoneNumber2}\n` +
        `🚚 *Status:* ${order.status}\n`;

      const buttons = [];

      if (status === "delivered") {
        caption +=
          `💬 *Feedback:* ${
            order.feedback === "love"
              ? "❤️ Loved it!"
              : order.feedback === "tasty"
              ? "😋 Tasty!"
              : order.feedback === "bad"
              ? "👎 Not good"
              : order.feedback === "delicious"
              ? "🍽️ Delicious!"
              : order.feedback === "okay"
              ? "👌 Okay"
              : order.feedback
              ? order.feedback
              : "No feedback"
          }\n` + `${googleMapsLink}`;
      } else {
        caption += `${googleMapsLink}`;
      }

      if (status === "pending") {
        buttons.push([
          Markup.button.callback(
            "🚚 Mark In Progress",
            `mark_inprogress_${order.orderId}`
          ),
        ]);
        // Admins and managers can cancel orders
        if (ctx.state.role === "admin" || ctx.state.role === "manager") {
          buttons.push([
            Markup.button.callback(
              "❌ Cancel Order",
              `cancel_order_${order.orderId}`
            ),
          ]);
        }
      } else if (status === "progress") {
        buttons.push([
          Markup.button.callback(
            "✅ Mark as Complete",
            `mark_completed_${order.orderId}`
          ),
        ]);
      } else if (status === "completed") {
        buttons.push([
          Markup.button.callback(
            "✅ Mark as Delivered",
            `mark_delivered_${order.orderId}`
          ),
        ]);
      }

      // Use first item's image if available
      const firstItemImage =
        items.length > 0 && items[0].imageUrl ? items[0].imageUrl : null;

      if (firstItemImage) {
        const imagePath = path.resolve(
          __dirname,
          "../../public",
          firstItemImage.startsWith("/")
            ? firstItemImage.substring(1)
            : firstItemImage
        );
        if (fs.existsSync(imagePath)) {
          await ctx.replyWithPhoto(
            { source: fs.createReadStream(imagePath) },
            {
              caption,
              parse_mode: "Markdown",
              ...Markup.inlineKeyboard(buttons),
            }
          );
        } else {
          await ctx.reply(caption, {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard(buttons),
          });
        }
      } else {
        await ctx.reply(caption, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard(buttons),
        });
      }
    }
  } catch (err) {
    console.error(`❌ Error fetching ${status} orders:`, err);
    await ctx.reply(`Something went wrong while loading ${label} orders.`);
  }
}

const showOrdersInProgress = (ctx) =>
  showOrdersByStatus(ctx, "progress", "progress");
const showOrdersInPending = (ctx) =>
  showOrdersByStatus(ctx, "pending", "pending");
const showOrdersInCompleted = (ctx) =>
  showOrdersByStatus(ctx, "completed", "completed");
const showOrdersInCancelled = (ctx) =>
  showOrdersByStatus(ctx, "cancelled", "cancelled");
const showOrdersInDelivered = (ctx) =>
  showOrdersByStatus(ctx, "delivered", "delivered");

module.exports = {
  viewOrderDetails,
  showOrdersInProgress,
  showOrdersInPending,
  showOrdersInCompleted,
  showOrdersInCancelled,
  showOrdersInDelivered,
};
