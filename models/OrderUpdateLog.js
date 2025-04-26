const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
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
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: true // old data before update
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true // new data after update
  },
  performedBy: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'order_update_logs'
});



module.exports = OrderUpdateLog;
