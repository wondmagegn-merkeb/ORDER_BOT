const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const FoodCategoryUpdateLog = sequelize.define('FoodCategoryUpdateLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoryId: {
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
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'food_category_update_logs'
});

module.exports = FoodCategoryUpdateLog;
