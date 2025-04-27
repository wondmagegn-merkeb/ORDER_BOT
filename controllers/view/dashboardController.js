const { InternalServerError, NotFoundError } = require('../../utils/customError');
const { Op, fn, col, sequelize } = require('sequelize');
const moment = require('moment');
const { User, Order } = require('../../models/index');

exports.showDashBoard = async (req, res, next) => {
  try {
    // Fetch data for the dashboard
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalPrice');
    const totalOnlineUsers = await User.count({ where: { status: 'active' } });
    console.log('Total Users:', totalUsers);
    console.log('Total Orders:', totalOrders);
    console.log('Total Revenue:', totalRevenue);
    console.log('Total Online Users:', totalOnlineUsers);

    // Orders status by count
    const ordersStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
      group: 'status',
      raw: true
    });
console.log('Orders Status:', ordersStatus);
    // Default empty check for ordersStatus
    const safeOrdersStatus = ordersStatus.length > 0 ? ordersStatus : [{ status: 'No data', count: 0 }];

    // Fetch min, max, and avg order value
    const minOrderValue = await Order.min('totalPrice');
    const maxOrderValue = await Order.max('totalPrice');
    const avgOrderValue = await Order.avg('totalPrice');
console.log('Min Order Value:', minOrderValue);
    console.log('Max Order Value:', maxOrderValue);
    console.log('Avg Order Value:', avgOrderValue);

    // Provide safe defaults for these values
    const safeMinOrderValue = minOrderValue || 0;
    const safeMaxOrderValue = maxOrderValue || 0;
    const safeAvgOrderValue = avgOrderValue ? avgOrderValue.toFixed(2) : 0;

    // Fetch top users by order count
    const topUsers = await User.findAll({
      attributes: ['userId', 'fullName', [sequelize.fn('count', sequelize.col('orders.orderId')), 'orderCount']],
      include: [{ model: Order, attributes: [] }],
      group: ['User.userId'],
      order: [[sequelize.literal('orderCount'), 'DESC']],
      limit: 5
    });

    // Default empty check for top users
    const safeTopUsers = topUsers.length > 0 ? topUsers : [{ userId: 'N/A', fullName: 'No data', orderCount: 0 }];

    // Get users with orders count
    const usersWithOrders = await Order.count({
      distinct: true,
      col: 'userId'
    }) || 0;

    // Date ranges for the week and month
    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

    // Fetch most ordered items this week
    const mostOrderedThisWeek = await Order.findAll({
      attributes: ['foodId', [fn('COUNT', col('foodId')), 'orderCount']],
      where: { createdAt: { [Op.between]: [startOfWeek, endOfWeek] } },
      group: ['foodId'],
      order: [[fn('COUNT', col('foodId')), 'DESC']],
      limit: 5
    });

    // Default empty check for most ordered this week
    const safeMostOrderedThisWeek = mostOrderedThisWeek.length > 0 ? mostOrderedThisWeek : [{ foodId: 'N/A', orderCount: 0 }];

    // Fetch most ordered items this month
    const mostOrderedThisMonth = await Order.findAll({
      attributes: ['foodId', [fn('COUNT', col('foodId')), 'orderCount']],
      where: { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
      group: ['foodId'],
      order: [[fn('COUNT', col('foodId')), 'DESC']],
      limit: 5
    });

    // Default empty check for most ordered this month
    const safeMostOrderedThisMonth = mostOrderedThisMonth.length > 0 ? mostOrderedThisMonth : [{ foodId: 'N/A', orderCount: 0 }];

    // Fetch order status counts for this week
    const orderStatusThisWeek = await Order.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'statusCount']],
      where: { createdAt: { [Op.between]: [startOfWeek, endOfWeek] } },
      group: ['status'],
      order: [[fn('COUNT', col('status')), 'DESC']]
    });

    // Default empty check for order status this week
    const safeOrderStatusThisWeek = orderStatusThisWeek.length > 0 ? orderStatusThisWeek : [{ status: 'No data', statusCount: 0 }];

    // Fetch order status counts for this month
    const orderStatusThisMonth = await Order.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'statusCount']],
      where: { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
      group: ['status'],
      order: [[fn('COUNT', col('status')), 'DESC']]
    });

    // Default empty check for order status this month
    const safeOrderStatusThisMonth = orderStatusThisMonth.length > 0 ? orderStatusThisMonth : [{ status: 'No data', statusCount: 0 }];

    // Render dashboard with safe default values
    res.render('admin/dashboard', {
      title: 'Dashboard',
      totalUsers,
      totalOrders,
      totalRevenue,
      totalOnlineUsers,
      ordersStatus: safeOrdersStatus,
      topUsers: safeTopUsers,
      minOrderValue: safeMinOrderValue,
      maxOrderValue: safeMaxOrderValue,
      avgOrderValue: safeAvgOrderValue,
      usersWithOrders,
      mostOrderedThisWeek: safeMostOrderedThisWeek,
      mostOrderedThisMonth: safeMostOrderedThisMonth,
      orderStatusThisWeek: safeOrderStatusThisWeek,
      orderStatusThisMonth: safeOrderStatusThisMonth
    });

  } catch (error) {
    console.error("Error in showDashBoard:", error);

    // Custom error handling for specific issues
    if (error.name === 'SequelizeDatabaseError') {
      next(new InternalServerError('Database query failed', error));
    } else {
      next(new InternalServerError('Failed to fetch user data for editing', error));
    }
  }
};
