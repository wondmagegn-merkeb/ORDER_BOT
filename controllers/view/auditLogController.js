const { 
  AdminAuditLog,
  UserUpdateLog,
  FoodCategoryUpdateLog,
  FoodUpdateLog,
  OrderUpdateLog
} = require('../../models/index');
const { InternalServerError } = require('../../utils/customError');

// Common columns for logs
const modelColumns = [
  { name: 'ID', field: 'id', index: 0 },
  { name: 'Action', field: 'action', index: 1 },
  { name: 'Performed By', field: 'performedBy', index: 2 },
];

// Colorful filters (updated colors)
const actionFilters = [
  { id: 'CREATE', name: 'CREATE', value: 'CREATE', colorClass: 'bg-blue-500 hover:bg-blue-600' },  // Blue color for CREATE
  { id: 'UPDATE', name: 'UPDATE', value: 'UPDATE', colorClass: 'bg-green-500 hover:bg-green-600' },  // Green color for UPDATE
  { id: 'DELETE', name: 'DELETE', value: 'DELETE', colorClass: 'bg-red-500 hover:bg-red-600' },  // Red color for DELETE
];

// Admin Logs
const getAdminLogs = async (req, res, next) => {
  try {
    const models = await AdminAuditLog.findAll();

    res.render('admin/logs/adminLog-list', {
      title: 'Admin Logs',
      models,
      modelColumns,
      filters: actionFilters,
      modelName: 'Admin Log',
      modelNameLower: 'adminlogs',
      permissions: {
        canAdd: false,
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch admin logs', error));
  }
};

// Order Logs
const getOrderLogs = async (req, res, next) => {
  try {
    const models = await OrderUpdateLog.findAll();
    
    res.render('admin/logs/orderLog-list', {
      title: 'Order Logs',
      models,
      modelColumns,
      filters: [], // No filters for orders
      modelName: 'Order Log',
      modelNameLower: 'orderlogs',
      permissions: {
        canAdd: false,
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch order logs', error));
  }
};

// User Logs
const getUserLogs = async (req, res, next) => {
  try {
    const models = await UserUpdateLog.findAll();
    
    res.render('admin/logs/userLog-list', {
      title: 'User Logs',
      models,
      modelColumns,
      filters: [], // No filters for users
      modelName: 'User Log',
      modelNameLower: 'userlogs',
      permissions: {
        canAdd: false,
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch user logs', error));
  }
};

// Food Logs
const getFoodLogs = async (req, res, next) => {
  try {
    const models = await FoodUpdateLog.findAll();

    res.render('admin/logs/foodLog-list', {
      title: 'Food Logs',
      models,
      modelColumns,
      filters: actionFilters,
      modelName: 'Food Log',
      modelNameLower: 'foodlogs',
      permissions: {
        canAdd: false,
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch food logs', error));
  }
};

// Category Logs
const getCategoryLogs = async (req, res, next) => {
  try {
    const models = await FoodCategoryUpdateLog.findAll();

    res.render('admin/logs/categoryLog-list', {
      title: 'Category Logs',
      models,
      modelColumns,
      filters: actionFilters,
      modelName: 'Category Log',
      modelNameLower: 'categorylogs',
      permissions: {
        canAdd: false,
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch category logs', error));
  }
};

module.exports = {
  getAdminLogs,
  getOrderLogs,
  getUserLogs,
  getFoodLogs,
  getCategoryLogs,
};
