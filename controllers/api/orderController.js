const { Order, OrderUpdateLog, User, Admin } = require("../../models/index");
const {
  InternalServerError,
  NotFoundError,
} = require("../../utils/customError"); // Import NotFoundError
const updateOrderSchema = require("../../validators/updateOrderValidation");
// Lazy load sendMessageToUser to avoid circular dependency
// const { sendMessageToUser } = require("../../bots/userBot"); // Removed to break circular dependency
// Lazy load adminBot to avoid circular dependency
// const { adminBot } = require("../../bots/adminBot"); // Removed to break circular dependency
const webpush = require("web-push");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.notifyOrder = async (orderId, adminCaption, imageUrl) => {
  try {
    // ✅ Fetch active non-delivery admins
    const admins = await Admin.findAll({
      where: {
        role: { [Op.ne]: "delivery" },
        States: "active",
      },
      attributes: ["telegramId", "endpoint", "keys"],
    });

    // 🔔 Web Push Payload
    const payload = JSON.stringify({
      title: "AddisSpark - Food Order",
      body: `New Order Notification\n\n🛒 A new order has been placed!\n\n📦 Please review and process the order as soon as possible.\n\n✅ Make sure to check the order details, prepare the items, and update the status in the system.\n\nThank you!`,
    });

    // ✅ Send web push notifications
    for (const admin of admins) {
      if (admin.endpoint && admin.keys) {
        const subscription = {
          endpoint: admin.endpoint,
          keys: admin.keys,
        };

        try {
          await webpush.sendNotification(subscription, payload);
        } catch (err) {
          console.error(
            `Push notification failed for ${admin.telegramId}:`,
            err.message
          );
        }
      }
    }

    // ✅ Send Telegram photo + message to admins
    // Lazy load adminBot to avoid circular dependency
    let adminBot;
    try {
      const adminBotModule = require("../../bots/adminBot");
      adminBot = adminBotModule.adminBot;
    } catch (error) {
      console.error("❌ Failed to load adminBot:", error.message);
      return; // Exit early if adminBot can't be loaded
    }

    // Check if adminBot is available before proceeding
    if (!adminBot) {
      console.error(
        "❌ adminBot is not available, skipping Telegram notifications"
      );
      return; // Exit early if adminBot is not available
    }

    // Check if adminBot.telegram exists (it should always exist for Telegraf instances)
    if (typeof adminBot.telegram === "undefined") {
      console.error(
        "❌ adminBot.telegram is not available yet, skipping Telegram notifications"
      );
      return; // Exit early if telegram property doesn't exist
    }

    // Use welcome.png for admin notifications
    const welcomeImagePath = path.resolve(
      __dirname,
      "../../public/welcome.png"
    );
    const welcomeImageExists = fs.existsSync(welcomeImagePath);
    const welcomeImageSource = welcomeImageExists
      ? { source: fs.createReadStream(welcomeImagePath) }
      : null;

    for (const admin of admins) {
      if (admin.telegramId) {
        try {
          // Double-check adminBot is available before each use
          if (!adminBot || !adminBot.telegram) {
            console.error(
              `❌ adminBot not available when sending to ${admin.telegramId}`
            );
            continue; // Skip this admin and continue with others
          }

          if (welcomeImageSource) {
            // Use welcome image for admin notifications
            await adminBot.telegram.sendPhoto(
              admin.telegramId,
              welcomeImageSource,
              {
                caption: adminCaption,
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "📋 View Details",
                        callback_data: `view_order_${orderId}`,
                      },
                    ],
                  ],
                },
              }
            );
          } else {
            // If welcome image is not available, send text message only
            await adminBot.telegram.sendMessage(
              admin.telegramId,
              adminCaption,
              {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "📋 View Details",
                        callback_data: `view_order_${orderId}`,
                      },
                    ],
                  ],
                },
              }
            );
          }
        } catch (error) {
          console.error(
            `❌ Telegram error for ${admin.telegramId}:`,
            error.message || error
          );
          // Continue with other admins even if one fails
        }
      }
    }
  } catch (error) {
    console.error("❌ notifyOrder failed:", error);
    throw new InternalServerError(
      "Failed to notify admins of new order",
      error
    );
  }
};

// Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll();
    return orders;
  } catch (error) {
    next(new InternalServerError("Failed to fetch orders", error));
  }
};

// Get order by ID
exports.getOrderById = async (orderId, res, next) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      const error = new NotFoundError("Order not found");
      if (res && next) {
        return next(error);
      }
      throw error;
    }
    return order;
  } catch (error) {
    // If error is already a custom error, handle it appropriately
    if (
      error instanceof NotFoundError ||
      error instanceof InternalServerError
    ) {
      if (res && next) {
        return next(error);
      }
      throw error;
    }
    // Otherwise, wrap it in InternalServerError
    const serverError = new InternalServerError("Failed to fetch order", error);
    if (res && next) {
      return next(serverError);
    }
    throw serverError;
  }
};

// Update order (price and status)
exports.updateOrder = async (req, res, next) => {
  try {
    const { error } = updateOrderSchema.validate(req.body);
    const { newTotalPrice, status } = req.body;
    const orderId = req.params.id;
    const orderData = { status, totalPrice: newTotalPrice, orderId };

    if (error) {
      res.locals.error = error.details[0].message;
      return res.render("admin/order/update-order", {
        title: "Update Order",
        order: orderData,
      });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return next(new NotFoundError("Order not found")); // Use custom NotFoundError
    }

    const oldTotalPrice = order.totalPrice;
    const oldStatus = order.status;

    order.newTotalPrice = newTotalPrice;
    order.status = status;
    order.updatedBy = req.admin.adminId;

    // If marking as delivered, store the delivery user ID
    if (status === "delivered") {
      order.deliveryUserId = req.admin.adminId;
    }

    await order.save();

    // Get customer
    const customer = await User.findOne({ where: { userId: order.userId } });

    // Proceed only if customer exists and status changed
    if (customer && oldStatus !== status) {
      const orderId = order.orderId || "N/A";
      const oldPrice = oldTotalPrice ? Number(oldTotalPrice).toFixed(2) : "N/A";
      const newPrice = newTotalPrice ? Number(newTotalPrice).toFixed(2) : "N/A";

      let message = "";

      if (status === "progress") {
        message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Price:</b> ${oldPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
        if (newPrice !== oldPrice) {
          message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
          message += `
<b>Reason for Price Change:</b> ${
            order.specialOrder ||
            "This could be due to special order adjustments, such as customized items or delivery-related fees."
          }
          \n  `;
        }

        message += `
<i>If you have any questions or need any updates, feel free to contact us!</i>
            `;
      } else if (status === "cancelled") {
        message = `
❌ <b>Your Order Has Been Cancelled</b>\n
<b>Order ID:</b> ${orderId}\n
<i>We regret to inform you that your order has been cancelled. We understand this might be disappointing and sincerely apologize for any inconvenience caused.</i>\n
<i>If you need more information or would like to discuss any concerns, please don’t hesitate to contact our support team.</i>
            `;
      } else if (status === "completed") {
        message = `
🎉 <b>Your Order Has Been Completed</b> 🎉\n
<b>Order ID:</b> ${orderId}\n
<i>Thank you for your patience! Your order has now been completed. We truly appreciate your trust in us.</i>
            `;
        const deliveryAdmins = await Admin.findAll({
          where: { role: "delivery" },
        });
        // If the admin role is 'delivery', send a message to notify them to address the completed food
        if (deliveryAdmins && status === "completed") {
          const deliveryMessage = `
🚚 <b>Delivery Team, Please Address the Completed Order</b> 🍽️\n
<b>Order ID:</b> ${orderId}\n
<i>The food is now ready for delivery. Please ensure to deliver it to the customer promptly. The details are as follows:</i>\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Ensure that all items are delivered according to the customer's request and address any special order notes.</i>
                `;

          // Lazy load adminBot to avoid circular dependency
          let adminBot;
          try {
            const adminBotModule = require("../../bots/adminBot");
            adminBot = adminBotModule.adminBot;
          } catch (error) {
            console.error(
              "❌ Failed to load adminBot for delivery notification:",
              error.message
            );
            return; // Skip delivery notifications if adminBot can't be loaded
          }

          for (const admin of deliveryAdmins) {
            if (admin.telegramId) {
              try {
                if (adminBot && adminBot.telegram) {
                  await adminBot.telegram.sendMessage(
                    admin.telegramId,
                    deliveryMessage,
                    {
                      parse_mode: "HTML",
                    }
                  );
                }
              } catch (error) {
                console.error(
                  `❌ Failed to send delivery message to admin ${admin.telegramId}:`,
                  error.message
                );
              }
            }
          }
        }
      } else if (status === "delivered") {
        message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Price:</b> ${oldPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
        if (newPrice !== oldPrice) {
          message = `
✅ <b>Your Order Has Been Accepted</b>\n
<b>Order ID:</b> ${orderId}\n
<b>Old Price:</b> ${oldPrice} birr\n
<b>New Price:</b> ${newPrice} birr\n
<i>Your order is now being prepared, and we are working hard to get it ready. Please be patient while we complete your order.</i>\n
            `;
          message += `
<b>Reason for Price Change:</b> ${
            order.specialOrder ||
            "This could be due to special order adjustments, such as customized items or delivery-related fees."
          }
          \n  `;
        }
        message += `
🙏 <b>We would love to hear your feedback!</b> 📝\n\n
<i>Please let us know if you are satisfied with your order, or if there’s anything we can improve. Your feedback helps us serve you better!</i>\n\n
<i>Feel free to reply to this message or contact us if you need further assistance.</i>

            `;
      }

      if (message && customer.telegramId) {
        // Lazy load sendMessageToUser to avoid circular dependency
        try {
          const userBotModule = require("../../bots/userBot");
          const sendMessageToUser = userBotModule.sendMessageToUser;

          if (sendMessageToUser && typeof sendMessageToUser === "function") {
            await sendMessageToUser(customer.telegramId, message);
          } else {
            console.error("❌ sendMessageToUser is not a function");
          }
        } catch (error) {
          console.error("❌ Failed to send message to user:", error.message);
          // Continue with order update even if message sending fails
        }
      }
    }

    res.locals.success = "Order updated successfully!";
    return res.render("admin/order/update-order", {
      title: "Update Order",
      order,
    });
  } catch (error) {
    next(new InternalServerError("Failed to update order", error));
  }
};
