const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FoodUpdateLog = sequelize.define('FoodUpdateLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  foodId: {
    type: DataTypes.STRING,
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
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'food_update_logs'
});

module.exports = FoodUpdateLog;
