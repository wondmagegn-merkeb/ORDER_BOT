const { InternalServerError, NotFoundError } = require('../../utils/customError');
const { Op, col, fn, literal } = require('sequelize');
const moment = require('moment');
const { User, Order } = require('../../models/index');

exports.showDashBoard = async (req, res, next) => {
  try {
    // Fetch data for the dashboard
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalPrice');
    const totalOnlineUsers = await User.count({ where: { status: 'active' } });

    const pending = await Order.count({ where: { status: 'pending' } });
    const progress = await Order.count({ where: { status: 'in progress' } });
    const completed = await Order.count({ where: { status: 'completed' } });
    const cancelled = await Order.count({ where: { status: 'cancelled' } });
    const delivered = await Order.count({ where: { status: 'delivered' } });

    // Feedback counts
    const tastyCount = await Order.count({ where: { feedback: 'tasty' } });
    const loveCount = await Order.count({ where: { feedback: 'love' } });
    const deliciousCount = await Order.count({ where: { feedback: 'delicious' } });
    const goodCount = await Order.count({ where: { feedback: 'good' } });
    const okayCount = await Order.count({ where: { feedback: 'okay' } });
    const badCount = await Order.count({ where: { feedback: 'bad' } });

    // Fetch recent orders with user info
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
        [literal('(SELECT COUNT(*) FROM `orders` AS `Order` WHERE `Order`.`createdBy` = `User`.`userId` AND `Order`.`deletedAt` IS NULL)'), 'orderCount']
      ],
      where: { deletedAt: null },
      order: [[literal('orderCount'), 'DESC']],
      limit: 5,
      raw: true
    });

    const safeTopUsers = topUsers.length > 0 ? topUsers : [{ userId: 'N/A', fullName: 'No data', orderCount: 0 }];

    // Users with orders count
    const usersWithOrders = await Order.count({ distinct: true, col: 'userId' }) || 0;

    // Date ranges for weekly and monthly stats
    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
    const startOfDay = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endOfDay = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

    // Get daily revenue
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

    // Get monthly revenue
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

    // New customers this week and month
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

    // Most ordered items this week and month
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

    // Order status this week and month
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

    // Render dashboard
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
      mostOrderedThisWeek: safeMostOrderedThisWeek,
      mostOrderedThisMonth: safeMostOrderedThisMonth,
      orderStatusThisWeek: safeOrderStatusThisWeek,
      orderStatusThisMonth: safeOrderStatusThisMonth,
      newCustomersThisWeek,
      dailyRevenue,
      monthlyRevenue,
      newCustomersThisMonth
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
