const { InternalServerError } = require('../../utils/customError');
const { Op, col, fn, literal } = require('sequelize');
const moment = require('moment');
const { Food, User, Order } = require('../../models/index');

exports.showDashBoard = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalPrice');
    const totalOnlineUsers = await User.count({ where: { status: 'active' } });

    const pending = await Order.count({ where: { status: 'pending' } });
    const progress = await Order.count({ where: { status: 'in progress' } });
    const completed = await Order.count({ where: { status: 'completed' } });
    const cancelled = await Order.count({ where: { status: 'cancelled' } });
    const delivered = await Order.count({ where: { status: 'delivered' } });

    const tastyCount = await Order.count({ where: { feedback: 'tasty' } });
    const loveCount = await Order.count({ where: { feedback: 'love' } });
    const deliciousCount = await Order.count({ where: { feedback: 'delicious' } });
    const goodCount = await Order.count({ where: { feedback: 'good' } });
    const okayCount = await Order.count({ where: { feedback: 'okay' } });
    const badCount = await Order.count({ where: { feedback: 'bad' } });

    const orders = await Order.findAll({
      include: [{
        model: User,
        attributes: ['fullName'],
      }],
      where: {
        status: ['progress', 'pending', 'cancelled', 'completed', 'delivered']
      },
      order: [['createdAt', 'DESC']]
    });

    const minOrderValue = await Order.min('totalPrice') || 0;
    const maxOrderValue = await Order.max('totalPrice') || 0;

    const avgOrder = await Order.findAll({
      attributes: [[literal('AVG(`totalPrice`)'), 'avgOrderValue']],
      raw: true,
    });
    const safeAvgOrderValue = avgOrder[0]?.avgOrderValue ? Number(avgOrder[0].avgOrderValue).toFixed(2) : 0;

    const topUsers = await User.findAll({
      attributes: [
        'userId',
        'fullName',
        [literal('(SELECT COUNT(*) FROM `orders` AS `Order` WHERE `Order`.`createdBy` = `User`.`userId` AND `Order`.`deletedAt` IS NULL)'), 'orderCount']
      ],
      where: { deletedAt: null },
      order: [[literal('orderCount'), 'DESC']],
      limit: 5,
      raw: true
    });
    const safeTopUsers = topUsers.length > 0 ? topUsers : [{ userId: 'N/A', fullName: 'No data', orderCount: 0 }];

    const usersWithOrders = await Order.count({ distinct: true, col: 'userId' }) || 0;

    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
    const startOfDay = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endOfDay = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const startOfYear = moment().startOf('year').format('YYYY-MM-DD 00:00:00');
    const endOfYear = moment().endOf('year').format('YYYY-MM-DD 23:59:59');

   // Get TOP 5 ITEMS for week
const topItemsWeek = await Order.findAll({
  attributes: [
    'foodId',
    [fn('SUM', col('quantity')), 'totalOrdered']
  ],
  include: [{ model: Food, attributes: ['name'] }],
  where: {
    createdAt: {
      [Op.between]: [startOfWeek, endOfWeek]
    }
  },
  group: ['foodId'],
  order: [[literal('totalOrdered'), 'DESC']],
  limit: 5
});

// Get TOP 5 ITEMS for month
const topItemsMonth = await Order.findAll({
  attributes: [
    'foodId',
    [fn('SUM', col('quantity')), 'totalOrdered']
  ],
  include: [{ model: Food, attributes: ['name'] }],
  where: {
    createdAt: {
      [Op.between]: [startOfMonth, endOfMonth]
    }
  },
  group: ['foodId'],
  order: [[literal('totalOrdered'), 'DESC']],
  limit: 5
});

// Get TOP 5 ITEMS for year
const topItemsYear = await Order.findAll({
  attributes: [
    'foodId',
    [fn('SUM', col('quantity')), 'totalOrdered']
  ],
  include: [{ model: Food, attributes: ['name'] }],
  where: {
    createdAt: {
      [Op.between]: [startOfYear, endOfYear]
    }
  },
  group: ['foodId'],
  order: [[literal('totalOrdered'), 'DESC']],
  limit: 5
});

// WEEK
const weekPieChartLabels = topItemsWeek.map(item => item.Food.name);
const weekPieChartData = topItemsWeek.map(item => item.dataValues.totalOrdered);

// MONTH
const monthPieChartLabels = topItemsMonth.map(item => item.Food.name);
const monthPieChartData = topItemsMonth.map(item => item.dataValues.totalOrdered);

// YEAR
const yearPieChartLabels = topItemsYear.map(item => item.Food.name);
const yearPieChartData = topItemsYear.map(item => item.dataValues.totalOrdered);

    // Get day-by-day order counts for this month
    const dailyOrdersThisMonth = await Order.findAll({
      attributes: [
        [fn('DAY', col('createdAt')), 'day'],
        [fn('COUNT', col('orderId')), 'orderCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      group: [fn('DAY', col('createdAt'))],
      order: [[fn('DAY', col('createdAt')), 'ASC']]
    });

    // Prepare data for daily orders line graph
    const dailyOrderLabels = dailyOrdersThisMonth.map(item => item.get('day'));
    const dailyOrderCounts = dailyOrdersThisMonth.map(item => item.get('orderCount'));

    // Get monthly order counts for this year
    const monthlyOrdersThisYear = await Order.findAll({
      attributes: [
        [fn('MONTH', col('createdAt')), 'month'],
        [fn('COUNT', col('orderId')), 'orderCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfYear, endOfYear] // Ensure correct start and end of the year
        }
      },
      group: [fn('MONTH', col('createdAt'))],
      order: [[fn('MONTH', col('createdAt')), 'ASC']]
    });

    // Prepare data for monthly orders line graph
    const monthlyOrderLabels = monthlyOrdersThisYear.map(item => {
      const month = item.get('month');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthNames[month - 1]; // Convert month number to month name
    });
    const monthlyOrderCounts = monthlyOrdersThisYear.map(item => item.get('orderCount'));

    const dailyRevenue = await Order.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('totalPrice')), 'totalRevenue']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      group: ['date'],
      order: [[fn('DATE', col('createdAt')), 'ASC']]
    });

    const weeklyRevenue = await Order.findAll({
      attributes: [
        [fn('DAYOFWEEK', col('createdAt')), 'dayOfWeek'],
        [fn('SUM', col('totalPrice')), 'totalRevenue']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfWeek, endOfWeek]
        }
      },
      group: ['dayOfWeek'],
      order: [[fn('DAYOFWEEK', col('createdAt')), 'ASC']]
    });

    const revenueByDay = {};
    weeklyRevenue.forEach(item => {
      revenueByDay[item.get('dayOfWeek')] = parseFloat(item.get('totalRevenue'));
    });

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedWeeklyRevenue = daysOfWeek.map((day, index) => ({
      day,
      revenue: revenueByDay[index + 1] || 0
    }));

    const monthlyRevenue = await Order.findAll({
      attributes: [
        [fn('MONTH', col('createdAt')), 'month'],
        [fn('SUM', col('totalPrice')), 'totalRevenue']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      group: ['month'],
      order: [[fn('MONTH', col('createdAt')), 'ASC']]
    });

    const newCustomersThisWeek = await User.count({
      where: {
        createdAt: {
          [Op.between]: [startOfWeek, endOfWeek]
        }
      }
    });

    const newCustomersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

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

    res.render('admin/dashboard', {
      title: 'Dashboard',
      totalUsers,
      totalOrders,
      totalRevenue,
      totalOnlineUsers,
      pending,
      progress,
      completed,
      cancelled,
      delivered,
      tastyCount,
      loveCount,
      deliciousCount,
      goodCount,
      okayCount,
      badCount,
      orders,
      topUsers: safeTopUsers,
      minOrderValue,
      maxOrderValue,
      avgOrderValue: safeAvgOrderValue,
      usersWithOrders,
      newCustomersThisWeek,
      newCustomersThisMonth,
      weekPieChartLabels,
      weekPieChartData,
      monthPieChartLabels,
      monthPieChartData,
      yearPieChartLabels,
      yearPieChartData,
      dailyOrderLabels,
      dailyOrderCounts,
      monthlyOrderLabels,
      monthlyOrderCounts,
      dailyRevenue,
      monthlyRevenue,
      formattedWeeklyRevenue
    });
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError') {
      next(new InternalServerError('Database query failed', error));
    } else {
      next(new InternalServerError('Failed to fetch dashboard data', error));
    }
  }
};
