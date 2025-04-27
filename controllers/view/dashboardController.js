const { InternalServerError, NotFoundError } = require('../../utils/customError');
const { Op, col, fn, literal } = require('sequelize'); // fixed import
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
      attributes: [
        'status',
        [literal('COUNT(status)'), 'count']
      ],
      group: 'status',
      raw: true
    });

    const safeOrdersStatus = ordersStatus.length > 0 ? ordersStatus : [{ status: 'No data', count: 0 }];

    // Fetch min, max, and avg order value
    const minOrderValue = await Order.min('totalPrice') || 0;
    const maxOrderValue = await Order.max('totalPrice') || 0;
    const avgOrder = await Order.findAll({
       attributes: [[literal('AVG(`totalPrice`)'), 'avgOrderValue']],
       raw: true,
     });

     const safeAvgOrderValue = avgOrder[0]?.avgOrderValue ? Number(avgOrder[0].avgOrderValue).toFixed(2) : 0;
    
    // Top users by order count
const topUsers = await User.findAll({
  attributes: [
    'userId',
    'fullName',
    [fn('COUNT', col('Orders.orderId')), 'orderCount']
  ],
  include: [
    {
      model: Order,
      attributes: [], // No need to select any columns from the Order table
    },
  ],
  group: ['User.userId'],
  order: [[fn('COUNT', col('Orders.orderId')), 'DESC']], // Sort by the orderCount in descending order
  limit: 5,
  raw: true, // Optional: to get raw results without Sequelize's additional formatting
});


    const safeTopUsers = topUsers.length > 0 ? topUsers : [{ userId: 'N/A', fullName: 'No data', orderCount: 0 }];

    const usersWithOrders = await Order.count({
      distinct: true,
      col: 'userId'
    }) || 0;

    // Date ranges
    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

    // Most ordered items this week
    const mostOrderedThisWeek = await Order.findAll({
      attributes: [
        'foodId',
        [literal('COUNT(foodId)'), 'orderCount']
      ],
      where: { createdAt: { [Op.between]: [startOfWeek, endOfWeek] } },
      group: ['foodId'],
      order: [[literal('COUNT(foodId)'), 'DESC']],
      limit: 5
    });

    const safeMostOrderedThisWeek = mostOrderedThisWeek.length > 0 ? mostOrderedThisWeek : [{ foodId: 'N/A', orderCount: 0 }];

    // Most ordered items this month
    const mostOrderedThisMonth = await Order.findAll({
      attributes: [
        'foodId',
        [literal('COUNT(foodId)'), 'orderCount']
      ],
      where: { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
      group: ['foodId'],
      order: [[literal('COUNT(foodId)'), 'DESC']],
      limit: 5
    });

    const safeMostOrderedThisMonth = mostOrderedThisMonth.length > 0 ? mostOrderedThisMonth : [{ foodId: 'N/A', orderCount: 0 }];

    // Order status this week
    const orderStatusThisWeek = await Order.findAll({
      attributes: [
        'status',
        [literal('COUNT(status)'), 'statusCount']
      ],
      where: { createdAt: { [Op.between]: [startOfWeek, endOfWeek] } },
      group: ['status'],
      order: [[literal('COUNT(status)'), 'DESC']]
    });

    const safeOrderStatusThisWeek = orderStatusThisWeek.length > 0 ? orderStatusThisWeek : [{ status: 'No data', statusCount: 0 }];

    // Order status this month
    const orderStatusThisMonth = await Order.findAll({
      attributes: [
        'status',
        [literal('COUNT(status)'), 'statusCount']
      ],
      where: { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
      group: ['status'],
      order: [[literal('COUNT(status)'), 'DESC']]
    });

    const safeOrderStatusThisMonth = orderStatusThisMonth.length > 0 ? orderStatusThisMonth : [{ status: 'No data', statusCount: 0 }];

    // Render dashboard
    res.render('admin/dashboard', {
      title: 'Dashboard',
      totalUsers,
      totalOrders,
      totalRevenue,
      totalOnlineUsers,
      ordersStatus: safeOrdersStatus,
      topUsers: safeTopUsers,
      minOrderValue,
      maxOrderValue,
      avgOrderValue: safeAvgOrderValue,
      usersWithOrders,
      mostOrderedThisWeek: safeMostOrderedThisWeek,
      mostOrderedThisMonth: safeMostOrderedThisMonth,
      orderStatusThisWeek: safeOrderStatusThisWeek,
      orderStatusThisMonth: safeOrderStatusThisMonth
    });

  } catch (error) {
    console.error("Error in showDashBoard:", error);
    if (error.name === 'SequelizeDatabaseError') {
      next(new InternalServerError('Database query failed', error));
    } else {
      next(new InternalServerError('Failed to fetch dashboard data', error));
    }
  }
};
