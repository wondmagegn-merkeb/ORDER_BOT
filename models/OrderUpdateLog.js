const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const Order = require('./Order'); // Import Order model

// Define the OrderUpdateLog model
const OrderUpdateLog = sequelize.define('OrderUpdateLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  field: {
    type: DataTypes.ENUM('status', 'newTotalPrice'), // Fields that can be updated
    allowNull: false
  },
  oldValue: {
    type: DataTypes.STRING,
    allowNull: true
  },
  newValue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'order_update_logs'
});



module.exports = OrderUpdateLog;
