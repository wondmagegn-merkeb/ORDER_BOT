const Admin = require('./Admin');
const AdminAuditLog = require('./AdminAuditLog');
const User = require('./User');
const UserUpdateLog = require('./UserUpdateLog');
const Food = require('./Food');
const FoodCategory = require('./FoodCategory');
const FoodUpdateLog = require('./FoodUpdateLog');
const Order = require('./Order');
const OrderUpdateLog = require('./OrderUpdateLog');

// Associations between models

// Admin has many AdminAuditLogs
Admin.hasMany(AdminAuditLog, {
  foreignKey: 'performedBy',  // Foreign key in AdminAuditLog that references Admin
});

// AdminAuditLog belongs to Admin
AdminAuditLog.belongsTo(Admin, {
  foreignKey: 'performedBy',  // Foreign key in AdminAuditLog that references Admin
});


// FoodCategory has many Foods
FoodCategory.hasMany(Food, { foreignKey: 'categoryId' });
Food.belongsTo(FoodCategory, { foreignKey: 'categoryId' });

// Food has many FoodUpdateLogs (for dynamic tracking of changes)
Food.hasMany(FoodUpdateLog, { foreignKey: 'foodId' });
FoodUpdateLog.belongsTo(Food, { foreignKey: 'foodId' });

// Associations with Order model
Order.hasMany(OrderUpdateLog, { foreignKey: 'orderId' });
OrderUpdateLog.belongsTo(Order, { foreignKey: 'orderId' });

// User has many Orders
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Admin can update an Order, so add the association without using alias
Order.belongsTo(Admin, { foreignKey: 'updatedBy' });
Admin.hasMany(Order, { foreignKey: 'updatedBy' });

// Associations for UserUpdateLog
User.hasMany(UserUpdateLog, { foreignKey: 'userId' });
UserUpdateLog.belongsTo(User, { foreignKey: 'userId' });

// Export all models so they can be used in other files
module.exports = {
  Admin,
  AdminAuditLog,
  User,
  UserUpdateLog,
  Food,
  FoodCategory,
  FoodUpdateLog,
  Order,
  OrderUpdateLog
};
