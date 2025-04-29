const { InternalServerError } = require('../../utils/customError');
const { Op, col, fn, literal } = require('sequelize');
const moment = require('moment');
const { Food, User, Order } = require('../../models/index');

exports.showDashBoard = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalPrice');
    const totalRevenueDelivered = await Order.sum('totalPrice', {
       where: {
       status: 'delivered'
      }
    });
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

const minOrderValueDelivered = await Order.min('totalPrice', {
  where: {
    status: 'delivered'
  }
}) || 0;

const maxOrderValueDelivered = await Order.max('totalPrice', {
  where: {
    status: 'delivered'
  }
}) || 0;

const avgOrderDelivered = await Order.findAll({
  attributes: [[literal('AVG(`totalPrice`)'), 'avgOrderValue']],
  where: {
    status: 'delivered'
  },
  raw: true,
});

const avgOrderValueDelivered = avgOrderDelivered[0]?.avgOrderValue
  ? Number(avgOrderDelivered[0].avgOrderValue).toFixed(2)
  : 0;

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
    const startOfYear = moment().startOf('year').format('YYYY-MM-DD 00:00:00');
    const endOfYear = moment().endOf('year').format('YYYY-MM-DD 23:59:59');
const totalDaysInMonth = moment().daysInMonth();
const allStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'delivered']; // Update based on your system
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];
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

    // Map day to order count
let orderCountMap = {};
dailyOrdersThisMonth.forEach(item => {
  orderCountMap[item.get('day')] = parseInt(item.get('orderCount'));
});

// Fill the labels and counts
const dailyOrderLabels = [];
const dailyOrderCounts = [];

for (let day = 1; day <= totalDaysInMonth; day++) {
  dailyOrderLabels.push(day.toString());
  dailyOrderCounts.push(orderCountMap[day] || 0);
}
    
// Query monthly orders this year
const monthlyOrdersThisYear = await Order.findAll({
  attributes: [
    [fn('MONTH', col('createdAt')), 'month'],
    [fn('COUNT', col('orderId')), 'orderCount']
  ],
  where: {
    createdAt: {
      [Op.between]: [startOfYear, endOfYear]
    }
  },
  group: [fn('MONTH', col('createdAt'))],
  order: [[fn('MONTH', col('createdAt')), 'ASC']]
});

// Build a map from month number to order count
orderCountMap = {};
monthlyOrdersThisYear.forEach(item => {
  orderCountMap[item.get('month')] = parseInt(item.get('orderCount'));
});

const monthlyOrderLabels = [];
const monthlyOrderCounts = [];

for (let month = 1; month <= 12; month++) {
  monthlyOrderLabels.push(monthNames[month - 1]);
  monthlyOrderCounts.push(orderCountMap[month] || 0);
}

const dailyRevenueThisMonth = await Order.findAll({
  attributes: [
    [fn('DAY', col('createdAt')), 'day'],
    [fn('SUM', col('totalPrice')), 'totalRevenue']
  ],
  where: {
    createdAt: {
      [Op.between]: [startOfMonth, endOfMonth]
    },
    status: 'delivered' // Only delivered orders
  },
  group: [fn('DAY', col('createdAt'))],
  order: [[fn('DAY', col('createdAt')), 'ASC']]
});

// Map day to revenue
const revenueCountMap = {};
dailyRevenueThisMonth.forEach(item => {
  revenueCountMap[item.get('day')] = parseFloat(item.get('totalRevenue'));
});

// Prepare labels and data
const dailyRevenueLabels = [];
const dailyRevenueCounts = [];

for (let day = 1; day <= totalDaysInMonth; day++) {
  dailyRevenueLabels.push(day.toString());
  dailyRevenueCounts.push(revenueCountMap[day] || 0);
}

const monthlyRevenueThisYear = await Order.findAll({
  attributes: [
    [fn('MONTH', col('createdAt')), 'month'],
    [fn('SUM', col('totalPrice')), 'totalRevenue']
  ],
  where: {
    createdAt: {
      [Op.between]: [startOfYear, endOfYear]
    },
    status: 'delivered' // Only delivered orders
  },
  group: [fn('MONTH', col('createdAt'))],
  order: [[fn('MONTH', col('createdAt')), 'ASC']]
});

// Map month to revenue
const revenueMonthMap = {};
monthlyRevenueThisYear.forEach(item => {
  revenueMonthMap[item.get('month')] = parseFloat(item.get('totalRevenue'));
});

const monthlyRevenueLabels = [];
const monthlyRevenueCounts = [];

for (let month = 1; month <= 12; month++) {
  monthlyRevenueLabels.push(monthNames[month - 1]);
  monthlyRevenueCounts.push(revenueMonthMap[month] || 0);
}


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

const orderStatusThisWeek = await Order.findAll({
  attributes: [
    'status',
    [literal('COUNT(status)'), 'statusCount']
  ],
  where: {
    createdAt: {
      [Op.between]: [startOfWeek, endOfWeek]
    }
  },
  group: ['status'],
  order: [[literal('COUNT(status)'), 'DESC']]
});

// Map actual counts
const statusCountMap = {};
orderStatusThisWeek.forEach(item => {
  statusCountMap[item.get('status')] = parseInt(item.get('statusCount'));
});

// Prepare labels and counts (fill missing statuses with 0)
const statusLabels = [];
const statusCounts = [];

allStatuses.forEach(status => {
  statusLabels.push(status);
  statusCounts.push(statusCountMap[status] || 0);
});

const orderStatusThisMonth = await Order.findAll({
  attributes: [
    'status',
    [literal('COUNT(status)'), 'statusCount']
  ],
  where: {
    createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
  },
  group: ['status']
});

// Build a status map
const monthlyStatusMap = {};
orderStatusThisMonth.forEach(item => {
  monthlyStatusMap[item.get('status')] = parseInt(item.get('statusCount'));
});

// Fill in missing statuses with 0
const monthStatusLabels = [];
const monthStatusCounts = [];

allStatuses.forEach(status => {
  monthStatusLabels.push(status);
  monthStatusCounts.push(monthlyStatusMap[status] || 0);
});

const orderStatusThisYear = await Order.findAll({
  attributes: [
    'status',
    [literal('COUNT(status)'), 'statusCount']
  ],
  where: {
    createdAt: { [Op.between]: [startOfYear, endOfYear] }
  },
  group: ['status']
});

const yearlyStatusMap = {};
orderStatusThisYear.forEach(item => {
  yearlyStatusMap[item.get('status')] = parseInt(item.get('statusCount'));
});

const yearStatusLabels = [];
const yearStatusCounts = [];
    
allStatuses.forEach(status => {
  yearStatusLabels.push(status);
  yearStatusCounts.push(yearlyStatusMap[status] || 0);
});
    
    res.render('admin/dashboard', {
      title: 'Dashboard',
      totalUsers,
      totalOrders,
      totalRevenue,
      totalRevenueDelivered,
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

      minOrderValueDelivered,
      maxOrderValueDelivered,
      avgOrderValueDelivered,
      
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
      
      dailyRevenueLabels,
      dailyRevenueCounts,
      monthlyRevenueLabels,
      monthlyRevenueCounts,
      
      statusLabels ,
      statusCounts,
      monthStatusLabels,
      monthStatusCounts,
      yearStatusLabels,
      yearStatusCounts,
    });
  } catch (error) {
    console.log(error)
    if (error.name === 'SequelizeDatabaseError') {
      next(new InternalServerError('Database query failed', error));
    } else {
      next(new InternalServerError('Failed to fetch dashboard data', error));
    }
  }
};
