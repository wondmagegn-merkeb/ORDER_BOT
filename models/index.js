const Admin = require('./Admin');
const AdminAuditLog = require('./AdminAuditLog');
const User = require('./User');
const Food = require('./Food');
const FoodCategory = require('./FoodCategory');
const FoodUpdateLog = require('./FoodUpdateLog');

// Associations between models

// Admin has many Audit Logs
Admin.hasMany(AdminAuditLog, { foreignKey: 'adminId' });
// Each AdminAuditLog belongs to one Admin
AdminAuditLog.belongsTo(Admin, { foreignKey: 'adminId' });

// FoodCategory has many Foods
FoodCategory.hasMany(Food, { foreignKey: 'categoryId' });
// Food belongs to FoodCategory
Food.belongsTo(FoodCategory, { foreignKey: 'categoryId' });

// Food has many FoodUpdateLogs (for dynamic tracking of changes)
Food.hasMany(FoodUpdateLog, { foreignKey: 'foodId' });
// FoodUpdateLog belongs to Food
FoodUpdateLog.belongsTo(Food, { foreignKey: 'foodId' });

// User has many Orders (or any other models related to user activities)
User.hasMany(FoodUpdateLog, { foreignKey: 'userId' });  // Example: Assuming a User can update food logs
FoodUpdateLog.belongsTo(User, { foreignKey: 'userId' });  // Example: FoodUpdateLog is related to a User

// Order belongs to User (a user can place many orders)
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Order belongs to Food (a food item can appear in many orders)
Food.hasMany(Order, { foreignKey: 'foodId' });
Order.belongsTo(Food, { foreignKey: 'foodId' });

// Export all models so they can be used in other files
module.exports = {
  Admin,
  AdminAuditLog,
  User,
  Food,
  FoodCategory,
  FoodUpdateLog
};
