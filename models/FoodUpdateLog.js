const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

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
  field: {
    type: DataTypes.STRING,
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
  performedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING, // e.g., 'create', 'update', 'delete'
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'food_update_logs'
});

module.exports = FoodUpdateLog;
