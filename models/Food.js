const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const FoodUpdateLog = require('./FoodUpdateLog');
const { InternalServerError } = require('../utils/customError');

const Food = sequelize.define('Food', {
  foodId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cloudinaryPublicId: {
    type: DataTypes.STRING,
    allowNull: false
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
  tableName: 'foods'
});

// 📝 Log creation
Food.afterCreate(async (food) => {
  try {
    await FoodUpdateLog.create({
      foodId: food.foodId,
      newData: food.toJSON(),
      performedBy: food.createdBy,
      action: 'CREATE'
    });
  } catch (err) {
    console.error('Error in afterCreate hook:', err);
    throw new InternalServerError('Error during food post-creation tasks (audit log).', err);
  }
});

// 📝 Log updates
Food.afterUpdate(async (food) => {
  try {
    await FoodUpdateLog.create({
      foodId: food.foodId,
      action: 'UPDATE',
      performedBy: food.updatedBy,
      oldData: food._previousDataValues,
      newData: food.toJSON()
    });
  } catch (err) {
    console.error('Error in afterUpdate hook:', err);
    throw new InternalServerError('Error during food post-update tasks (audit log).', err);
  }
});

// 🗑️ Log soft-deletion
Food.afterDestroy(async (food) => {
  try {
    await FoodUpdateLog.create({
      foodId: food.foodId,
      action: 'DELETE',
      performedBy: food.updatedBy,
      oldData: food.toJSON(),
      newData: null
    });
  } catch (err) {
    console.error('Error in afterDestroy hook:', err);
    throw new InternalServerError('Error during food post-delete tasks (audit log).', err);
  }
});

module.exports = Food;
