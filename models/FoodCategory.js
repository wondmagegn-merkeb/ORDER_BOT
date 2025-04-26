const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const FoodCategoryUpdateLog = require('./FoodCategoryUpdateLog');
const { InternalServerError } = require('../utils/customError'); // Adjust path if needed

const FoodCategory = sequelize.define('FoodCategory', {
  categoryId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  categoryName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'food_categories',
});

// ==================== Hooks ====================

// After Create: Log creation
FoodCategory.afterCreate(async (category) => {
  try {
    await FoodCategoryUpdateLog.create({
      categoryId: category.categoryId,
      oldValue: null,
      newValue: category.toJSON(),
      performedBy: category.createdBy || 'system',
      action: 'CREATE',
    });
  } catch (error) {
    throw new InternalServerError('Failed to log category creation.', error);
  }
});

// After Update: Log update
FoodCategory.afterUpdate(async (category) => {
  try {
    await FoodCategoryUpdateLog.create({
      categoryId: category.categoryId,
      oldValue: category._previousDataValues,
      newValue: category.toJSON(),
      performedBy: category.updatedBy || 'system',
      action: 'UPDATE',
    });
  } catch (error) {
    throw new InternalServerError('Failed to log category update.', error);
  }
});

// After Destroy: Log deletion
FoodCategory.afterDestroy(async (category) => {
  try {
    await FoodCategoryUpdateLog.create({
      categoryId: category.categoryId,
      oldValue: category.toJSON(),
      newValue: null,
      performedBy: category.updatedBy || 'system',
      action: 'DELETE',
    });
  } catch (error) {
    throw new InternalServerError('Failed to log category deletion.', error);
  }
});

module.exports = FoodCategory;
