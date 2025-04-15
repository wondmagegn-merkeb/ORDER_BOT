const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const FoodUpdateLog = sequelize.define('FoodUpdateLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  foodId: {
    type: DataTypes.STRING, // e.g., FOOD001
    allowNull: false
  },
  field: {
    type: DataTypes.STRING, // can log any field change
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
  tableName: 'food_update_logs'
});

module.exports = FoodUpdateLog;
