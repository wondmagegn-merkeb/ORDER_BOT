const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const FoodCategory = sequelize.define('FoodCategory', {
  categoryId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  categoryName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'food_categories'
});

// 🔁 Custom ID: CAT001
FoodCategory.beforeCreate(async (category) => {
  const last = await FoodCategory.findOne({ order: [['createdAt', 'DESC']] });
  let newIdNumber = 1;

  if (last && last.categoryId) {
    const lastNumber = parseInt(last.categoryId.replace('CAT', ''));
    newIdNumber = lastNumber + 1;
  }

  category.categoryId = 'CAT' + String(newIdNumber).padStart(3, '0');
});

module.exports = FoodCategory;
