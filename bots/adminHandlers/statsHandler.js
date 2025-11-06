const { Order, User, Food } = require("../../models/index");
const { Op, literal, fn, col } = require("sequelize");
const moment = require("moment");

// Format number with commas
const formatNumber = (num) => {
  if (!num) return "0";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format date
const formatDate = (date) => {
  return moment(date).format("MMM DD, YYYY");
};

// Get statistics for admin bot
async function showStats(ctx) {
  try {
    // Send a loading message
    await ctx.reply("📊 Calculating statistics...");

    // Basic counts
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum("totalPrice") || 0;
    const totalRevenueDelivered = await Order.sum("totalPrice", {
      where: { status: "delivered" },
    }) || 0;

    // User statistics
    const activeUsers = await User.count({ where: { status: "active" } });
    const blockedUsers = await User.count({ where: { status: "block" } });
    const vipUsers = await User.count({ where: { userType: "vip" } });
    const customers = await User.count({ where: { userType: "customer" } });
    const guests = await User.count({ where: { userType: "guest" } });

    // Order status counts
    const pending = await Order.count({ where: { status: "pending" } });
    const progress = await Order.count({ where: { status: "progress" } });
    const completed = await Order.count({ where: { status: "completed" } });
    const delivered = await Order.count({ where: { status: "delivered" } });
    const cancelled = await Order.count({ where: { status: "cancelled" } });

    // Feedback statistics
    const tastyCount = await Order.count({ where: { feedback: "tasty" } });
    const loveCount = await Order.count({ where: { feedback: "love" } });
    const deliciousCount = await Order.count({ where: { feedback: "delicious" } });
    const goodCount = await Order.count({ where: { feedback: "good" } });
    const okayCount = await Order.count({ where: { feedback: "okay" } });
    const badCount = await Order.count({ where: { feedback: "bad" } });

    // Revenue statistics
    const minOrderValue = (await Order.min("totalPrice")) || 0;
    const maxOrderValue = (await Order.max("totalPrice")) || 0;
    const avgOrder = await Order.findAll({
      attributes: [[literal("AVG(`totalPrice`)"), "avgOrderValue"]],
      raw: true,
    });
    const avgOrderValue = avgOrder[0]?.avgOrderValue
      ? Number(avgOrder[0].avgOrderValue).toFixed(2)
      : 0;

    // Today's statistics
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();
    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });
    const todayRevenue = await Order.sum("totalPrice", {
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    }) || 0;

    // This week's statistics
    const weekStart = moment().startOf("week").toDate();
    const weekEnd = moment().endOf("week").toDate();
    const weekOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [weekStart, weekEnd],
        },
      },
    });
    const weekRevenue = await Order.sum("totalPrice", {
      where: {
        createdAt: {
          [Op.between]: [weekStart, weekEnd],
        },
      },
    }) || 0;

    // This month's statistics
    const monthStart = moment().startOf("month").toDate();
    const monthEnd = moment().endOf("month").toDate();
    const monthOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });
    const monthRevenue = await Order.sum("totalPrice", {
      where: {
        createdAt: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    }) || 0;

    // Top users by order count
    const topUsers = await User.findAll({
      attributes: [
        "userId",
        "fullName",
        [
          literal(
            "(SELECT COUNT(*) FROM `orders` AS `Order` WHERE `Order`.`userId` = `User`.`userId` AND `Order`.`deletedAt` IS NULL)"
          ),
          "orderCount",
        ],
      ],
      where: { deletedAt: null },
      order: [[literal("orderCount"), "DESC"]],
      limit: 5,
      raw: true,
    });

    // Build the stats message
    let statsMessage = `📊 <b>ORDER BOT STATISTICS</b>\n\n`;

    // Summary Section
    statsMessage += `📈 <b>SUMMARY</b>\n`;
    statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    statsMessage += `👥 Total Users: <b>${totalUsers}</b>\n`;
    statsMessage += `📦 Total Orders: <b>${totalOrders}</b>\n`;
    statsMessage += `💰 Total Revenue: <b>${formatNumber(totalRevenue)}</b> birr\n`;
    statsMessage += `✅ Delivered Revenue: <b>${formatNumber(totalRevenueDelivered)}</b> birr\n\n`;

    // User Statistics
    statsMessage += `👥 <b>USER STATISTICS</b>\n`;
    statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    statsMessage += `✅ Active: <b>${activeUsers}</b>\n`;
    statsMessage += `❌ Blocked: <b>${blockedUsers}</b>\n`;
    statsMessage += `👑 VIP: <b>${vipUsers}</b>\n`;
    statsMessage += `🛒 Customer: <b>${customers}</b>\n`;
    statsMessage += `👤 Guest: <b>${guests}</b>\n\n`;

    // Order Status Statistics
    statsMessage += `📦 <b>ORDER STATUS</b>\n`;
    statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    statsMessage += `⏳ Pending: <b>${pending}</b>\n`;
    statsMessage += `👨‍🍳 In Progress: <b>${progress}</b>\n`;
    statsMessage += `✅ Completed: <b>${completed}</b>\n`;
    statsMessage += `🚚 Delivered: <b>${delivered}</b>\n`;
    statsMessage += `❌ Cancelled: <b>${cancelled}</b>\n\n`;

    // Time-based Statistics
    statsMessage += `📅 <b>TIME-BASED STATS</b>\n`;
    statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    statsMessage += `📆 Today:\n`;
    statsMessage += `   Orders: <b>${todayOrders}</b> | Revenue: <b>${formatNumber(todayRevenue)}</b> birr\n`;
    statsMessage += `📆 This Week:\n`;
    statsMessage += `   Orders: <b>${weekOrders}</b> | Revenue: <b>${formatNumber(weekRevenue)}</b> birr\n`;
    statsMessage += `📆 This Month:\n`;
    statsMessage += `   Orders: <b>${monthOrders}</b> | Revenue: <b>${formatNumber(monthRevenue)}</b> birr\n\n`;

    // Revenue Statistics
    statsMessage += `💰 <b>REVENUE STATISTICS</b>\n`;
    statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
    statsMessage += `📉 Min Order: <b>${formatNumber(minOrderValue)}</b> birr\n`;
    statsMessage += `📈 Max Order: <b>${formatNumber(maxOrderValue)}</b> birr\n`;
    statsMessage += `📊 Avg Order: <b>${formatNumber(avgOrderValue)}</b> birr\n\n`;

    // Feedback Statistics
    const totalFeedback = tastyCount + loveCount + deliciousCount + goodCount + okayCount + badCount;
    if (totalFeedback > 0) {
      statsMessage += `💬 <b>FEEDBACK STATISTICS</b>\n`;
      statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
      statsMessage += `😋 Tasty: <b>${tastyCount}</b>\n`;
      statsMessage += `❤️ Loved: <b>${loveCount}</b>\n`;
      statsMessage += `🍽️ Delicious: <b>${deliciousCount}</b>\n`;
      statsMessage += `😊 Good: <b>${goodCount}</b>\n`;
      statsMessage += `👌 Okay: <b>${okayCount}</b>\n`;
      statsMessage += `😞 Bad: <b>${badCount}</b>\n`;
      statsMessage += `📊 Total Feedback: <b>${totalFeedback}</b>\n\n`;
    }

    // Top Users
    if (topUsers && topUsers.length > 0) {
      statsMessage += `🏆 <b>TOP USERS (BY ORDERS)</b>\n`;
      statsMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
      topUsers.forEach((user, index) => {
        const orderCount = user.orderCount || 0;
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";
        statsMessage += `${medal} ${user.fullName || "N/A"}: <b>${orderCount}</b> orders\n`;
      });
      statsMessage += `\n`;
    }

    statsMessage += `\n🔄 <i>Last updated: ${moment().format("MMM DD, YYYY HH:mm")}</i>`;

    // Send the stats message
    await ctx.reply(statsMessage, {
      parse_mode: "HTML",
    });

  } catch (err) {
    console.error("❌ Error fetching statistics:", err);
    await ctx.reply(
      "❌ Something went wrong while fetching statistics. Please try again later."
    );
  }
}

module.exports = {
  showStats,
};


