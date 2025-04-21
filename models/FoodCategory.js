const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const FoodCategoryUpdateLog = require('./FoodCategoryUpdateLog'); // Import the log model

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
description: {
  type: DataTypes.STRING,
    allowNull: true,  
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
  paranoid: true, // Enable soft delete (deletedAt)
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

// 🔁 Hook: After Create — Log the creation of the food category
FoodCategory.afterCreate(async (category, options) => {
  console.log(category)
  await FoodCategoryUpdateLog.create({
    categoryId: category.categoryId,    
    oldValue: null,  // No old value for a new creation
    newValue: category.categoryName,
    performedBy: category.createdBy || 'system',
    action: 'CREATE'  // Action is 'CREATE' for new records
  });
});

// 🔁 Hook: After Update — Log the update of the food category
FoodCategory.afterUpdate(async (category, options) => {
  console.log(category)
  // Assuming categoryName is being updated
  if (category.changed('categoryName')) {
    await FoodCategoryUpdateLog.create({
      categoryId: category.categoryId,      
      oldValue: category._previousDataValues.categoryName,  // Fetch the old value before the update
      newValue: category.categoryName,
      performedBy: category.updatedBy || 'system',
      action: 'UPDATE'  // Action is 'UPDATE' for updated records
    });
  }
});

// 🔁 Hook: After Delete — Log the deletion of the food category
FoodCategory.afterDestroy(async (category, options) => {
  await FoodCategoryUpdateLog.create({
    categoryId: category.categoryId,
    oldValue: category.categoryName,  // The value that is being deleted
    newValue: null,  // No new value after deletion
    performedBy: category.updatedBy || 'system',
    action: 'DELETE'  // Action is 'DELETE' for deleted records
  });
});

module.exports = FoodCategory;
