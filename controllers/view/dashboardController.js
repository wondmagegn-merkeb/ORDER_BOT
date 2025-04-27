const { InternalServerError } = require('../../utils/customError'); // Custom error handling
const { Op, fn, col, sequelize } = require('sequelize'); // Sequelize methods
const moment = require('moment'); // Moment for handling date and time
const { User, Order } = require('../../models/index'); // Assuming you have User and Order models set up

// Show the form to edit an existing user
exports.showEditForm = async (req, res, next) => {
  try {
    // Fetch data for the dashboard
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalPrice');
    const totalOnlineUsers = await User.count({ where: { status: 'active' } }); // Assuming 'active' means online
    
    // Other KPIs (like orders by status, average order value, etc.)
    const ordersStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
      group: 'status',
      raw: true
    });
    
    const minOrderValue = await Order.min('totalPrice');
    const maxOrderValue = await Order.max('totalPrice');
    const avgOrderValue = await Order.avg('totalPrice');

    // Fetch top users (with the most orders)
    const topUsers = await User.findAll({
      attributes: ['userId', 'fullName', [sequelize.fn('count', sequelize.col('orders.orderId')), 'orderCount']],
      include: [{
        model: Order,
        attributes: [],
      }],
      group: ['User.userId'],
      order: [[sequelize.literal('orderCount'), 'DESC']],
      limit: 5
    });

    const usersWithOrders = await Order.count({
      distinct: true,
      col: 'userId' // Counting distinct userIds from orders table
    });

    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

    // Get the most ordered items this week
    const mostOrderedThisWeek = await Order.findAll({
      attributes: [
        'foodId',
        [fn('COUNT', col('foodId')), 'orderCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfWeek, endOfWeek]
        }
      },
      group: ['foodId'],
      order: [[fn('COUNT', col('foodId')), 'DESC']],
      limit: 5
    });

    // Get the most ordered items this month
    const mostOrderedThisMonth = await Order.findAll({
      attributes: [
        'foodId',
        [fn('COUNT', col('foodId')), 'orderCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      group: ['foodId'],
      order: [[fn('COUNT', col('foodId')), 'DESC']],
      limit: 5
    });

    // Get order status counts for this week
    const orderStatusThisWeek = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('status')), 'statusCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfWeek, endOfWeek]
        },
        status: {
          [Op.in]: ['progress', 'pending', 'cancelled', 'completed', 'delivered'] // Filter for specific statuses
        }
      },
      group: ['status'],
      order: [[fn('COUNT', col('status')), 'DESC']]
    });

    // Get order status counts for this month
    const orderStatusThisMonth = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('status')), 'statusCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        },
        status: {
          [Op.in]: ['progress', 'pending', 'cancelled', 'completed', 'delivered'] // Filter for specific statuses
        }
      },
      group: ['status'],
      order: [[fn('COUNT', col('status')), 'DESC']]
    });

    res.render('admin/dashboard', { 
      title: 'Dashboard', 
      totalUsers,
      totalOrders,
      totalRevenue,
      totalOnlineUsers,
      ordersStatus,
      topUsers,
      minOrderValue: minOrderValue || 0,
      maxOrderValue: maxOrderValue || 0,
      avgOrderValue: avgOrderValue ? avgOrderValue.toFixed(2) : 0,
      usersWithOrders,
      mostOrderedThisWeek,
      mostOrderedThisMonth,
      orderStatusThisWeek,
      orderStatusThisMonth
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch user for editing', error));
  }
};
