const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const OrderUpdateLog = require('./OrderUpdateLog'); // Import OrderUpdateLog

// Define the Order model
const Order = sequelize.define('Order', {
  orderId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  foodId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  specialOrder: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  newTotalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  feedback: {
    type: DataTypes.STRING,
    defaultValue: 'noFeedBack'
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // New Location Fields
  location: {
    type: DataTypes.STRING,
    allowNull: true // This can be the full address
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true // Latitude for the delivery location
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true // Longitude for the delivery location
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'orders'
});

// Hook to generate custom order ID before creating an order
Order.beforeCreate(async (order, options) => {
  const lastOrder = await Order.findOne({ order: [['createdAt', 'DESC']] });

  let newIdNumber = 1;
  if (lastOrder && lastOrder.orderId) {
    const lastNumber = parseInt(lastOrder.orderId.replace('ORD', ''));
    newIdNumber = lastNumber + 1;
  }

  order.orderId = 'ORD' + String(newIdNumber).padStart(3, '0');
});

// After update hook to track changes
Order.afterUpdate(async (updatedOrder, options) => {
  const originalOrder = await Order.findOne({
    where: { orderId: updatedOrder.orderId },
    paranoid: false // Get the original order even if it is soft-deleted
  });

  // Check for changes in the status, totalPrice, and location fields, and log those changes
  if (originalOrder.status !== updatedOrder.status) {
    await OrderUpdateLog.create({
      orderId: updatedOrder.orderId,
      field: 'status',
      oldValue: originalOrder.status,
      newValue: updatedOrder.status,
      performedBy: updatedOrder.updatedBy
    });
  }

  if (originalOrder.totalPrice !== updatedOrder.totalPrice) {
    await OrderUpdateLog.create({
      orderId: updatedOrder.orderId,
      field: 'totalPrice',
      oldValue: originalOrder.totalPrice.toString(),
      newValue: updatedOrder.totalPrice.toString(),
      performedBy: updatedOrder.updatedBy
    });
  }


});

module.exports = Order;
