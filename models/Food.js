const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const FoodUpdateLog = require('./FoodUpdateLog');

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

// 🔁 Auto-generate foodId like FOOD001
Food.beforeCreate(async (food) => {
  const last = await Food.findOne({ order: [['createdAt', 'DESC']] });
  let newIdNumber = 1;

  if (last && last.foodId) {
    const lastNumber = parseInt(last.foodId.replace('FOOD', ''));
    newIdNumber = lastNumber + 1;
  }

  food.foodId = 'FOOD' + String(newIdNumber).padStart(3, '0');
});

// 📝 Log creation
Food.afterCreate(async (food) => {
  const fieldsToLog = ['name', 'description', 'price', 'isAvailable', 'imageUrl', 'categoryId'];

  for (const field of fieldsToLog) {
    await FoodUpdateLog.create({
      foodId: food.foodId,
      field,
      oldValue: null,
      newValue: food[field]?.toString(),
      performedBy: food.createdBy || 'system',
      action: 'create'
    });
  }
});

// 📝 Log updates
Food.afterUpdate(async (food) => {
  const previous = await Food.findOne({ where: { foodId: food.foodId } });

  const fieldsToTrack = ['price', 'isAvailable', 'name', 'description', 'imageUrl', 'categoryId'];

  for (const field of fieldsToTrack) {
    if (food.changed(field)) {
      await FoodUpdateLog.create({
        foodId: food.foodId,
        field,
        oldValue: previous[field]?.toString(),
        newValue: food[field]?.toString(),
        performedBy: food.updatedBy || 'system',
        action: 'update'
      });
    }
  }
});

// 🗑️ Log soft-deletion
Food.afterDestroy(async (food) => {
  const foodData = await Food.findOne({ where: { foodId: food.foodId }, paranoid: false });

  await FoodUpdateLog.create({
    foodId: food.foodId,
    field: 'ALL',
    oldValue: JSON.stringify(foodData.toJSON()),
    newValue: null,
    performedBy: food.updatedBy || 'system',
    action: 'delete'
  });
});

module.exports = Food;
