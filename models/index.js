// Import all models
const Admin = require('./Admin');
const AdminAuditLog = require('./AdminAuditLog');
const User = require('./User');
const UserUpdateLog = require('./UserUpdateLog');
const Food = require('./Food');
const FoodCategory = require('./FoodCategory');
const FoodUpdateLog = require('./FoodUpdateLog');
const Order = require('./Order');
const OrderUpdateLog = require('./OrderUpdateLog');

/**
 * ===============================
 * Model Relationships / Associations
 * ===============================
 */

// FoodCategory ↔ Food
FoodCategory.hasMany(Food, { foreignKey: 'categoryId' });
Food.belongsTo(FoodCategory, { foreignKey: 'categoryId' });

// Food ↔ FoodUpdateLog
Food.hasMany(FoodUpdateLog, { foreignKey: 'foodId' });
FoodUpdateLog.belongsTo(Food, { foreignKey: 'foodId' });

// User ↔ Order
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Order ↔ OrderUpdateLog
Order.hasMany(OrderUpdateLog, { foreignKey: 'orderId' });
OrderUpdateLog.belongsTo(Order, { foreignKey: 'orderId' });

// User ↔ UserUpdateLog
User.hasMany(UserUpdateLog, { foreignKey: 'userId' });
UserUpdateLog.belongsTo(User, { foreignKey: 'userId' });

// Admin ↔ Order (Updated By)
Admin.hasMany(Order, { foreignKey: 'updatedBy' });
Order.belongsTo(Admin, { foreignKey: 'updatedBy' });

/**
 * Link all 'performedBy' in log models to Admin
 */
Admin.hasMany(AdminAuditLog, { foreignKey: 'performedBy' });
AdminAuditLog.belongsTo(Admin, { foreignKey: 'performedBy' });

Admin.hasMany(FoodUpdateLog, { foreignKey: 'performedBy' });
FoodUpdateLog.belongsTo(Admin, { foreignKey: 'performedBy' });

Admin.hasMany(UserUpdateLog, { foreignKey: 'performedBy' });
UserUpdateLog.belongsTo(Admin, { foreignKey: 'performedBy' });

Admin.hasMany(OrderUpdateLog, { foreignKey: 'performedBy' });
OrderUpdateLog.belongsTo(Admin, { foreignKey: 'performedBy' });

/**
 * Link all 'createdBy' and 'updatedBy' fields to Admin (audit tracking)
 */

// Food
Admin.hasMany(Food, { foreignKey: 'createdBy' });
Food.belongsTo(Admin, { as: 'creator', foreignKey: 'createdBy' });

Admin.hasMany(Food, { foreignKey: 'updatedBy' });
Food.belongsTo(Admin, { as: 'updater', foreignKey: 'updatedBy' });

// FoodCategory
Admin.hasMany(FoodCategory, { foreignKey: 'createdBy' });
FoodCategory.belongsTo(Admin, { as: 'creator', foreignKey: 'createdBy' });

Admin.hasMany(FoodCategory, { foreignKey: 'updatedBy' });
FoodCategory.belongsTo(Admin, { as: 'updater', foreignKey: 'updatedBy' });

// User
Admin.hasMany(User, { foreignKey: 'createdBy' });
User.belongsTo(Admin, { as: 'creator', foreignKey: 'createdBy' });

Admin.hasMany(User, { foreignKey: 'updatedBy' });
User.belongsTo(Admin, { as: 'updater', foreignKey: 'updatedBy' });

// Order
Admin.hasMany(Order, { foreignKey: 'createdBy' });
Order.belongsTo(Admin, { as: 'creator', foreignKey: 'createdBy' });

// Order's updatedBy already defined above
// Keeping it for completeness
Admin.hasMany(Order, { foreignKey: 'updatedBy' });
Order.belongsTo(Admin, { as: 'updater', foreignKey: 'updatedBy' });

/**
 * ===============================
 * Export All Models
 * ===============================
 */
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
