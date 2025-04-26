const { 
  AdminAuditLog,
  UserUpdateLog,
  FoodCategoryUpdateLog,
  FoodUpdateLog,
  OrderUpdateLog
      } = require('../../models/index');
const { InternalServerError } = require('../../utils/customError');

const modelColumns = [
  { name: 'ID', field: 'id', index: 0 },
  { name: 'Action', field: 'action', index: 1 },
  { name: 'Performed By', field: 'performedBy', index: 2 },
];

// Fetch admin audit logs
const getAdminLogs = async (req, res, next) => {
  try {
    const models = await AdminAuditLog.findAll();
    const filters = [
      { id: 'CREATE', name: 'CREATE', value: 'CREATE', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
      { id: 'UPDATE', name: 'UPDATE', value: 'UPDATE', colorClass: 'bg-purple-600 hover:bg-purple-700' },
      { id: 'DELETE', name: 'DELETE', value: 'DELETE', colorClass: 'bg-blue-600 hover:bg-blue-700' },
    ];

    res.render('admin/logs/adminLog-list', {
      title: 'Admin Logs',
      models,
      modelColumns,
      filters,
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
    next(new InternalServerError('Failed to fetch admin logs', error)); // Use the custom error handler
  }
};

// Fetch order logs
const getOrderLogs = async (req, res, next) => {
  try {
    const models = await OrderUpdateLog.findAll();
    const filters = [];

    res.render('admin/logs/orderLog-list', {
      title: 'Order Logs',
      models,
      modelColumns,
      filters,
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
    next(new InternalServerError('Failed to fetch order logs', error)); // Use the custom error handler
  }
};

// Fetch user logs
const getUserLogs = async (req, res, next) => {
  try {
    const models = await UserUpdateLog.findAll();
    const filters = [ ];

    res.render('admin/logs/userLog-list', {
      title: 'User Logs',
      models,
      modelColumns,
      filters,
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
    next(new InternalServerError('Failed to fetch user logs', error)); // Use the custom error handler
  }
};

// Fetch food logs
const getFoodLogs = async (req, res, next) => {
  try {
    
    const models = await FoodUpdateLog.findAll();
    const filters = [
      { id: 'CREATE', name: 'CREATE', value: 'CREATE', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
      { id: 'UPDATE', name: 'UPDATE', value: 'UPDATE', colorClass: 'bg-purple-600 hover:bg-purple-700' },
      { id: 'DELETE', name: 'DELETE', value: 'DELETE', colorClass: 'bg-blue-600 hover:bg-blue-700' },
    ];

    res.render('admin/logs/foodLog-list', {
      title: 'Food Logs',
      models,
      modelColumns,
      filters,
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
    next(new InternalServerError('Failed to fetch food logs', error)); // Use the custom error handler
  }
};

// Fetch category logs
const getCategoryLogs = async (req, res, next) => {
  try {
    
    const models = await FoodCategoryUpdateLog.findAll();
    const filters = [
      { id: 'CREATE', name: 'CREATE', value: 'CREATE', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
      { id: 'UPDATE', name: 'UPDATE', value: 'UPDATE', colorClass: 'bg-purple-600 hover:bg-purple-700' },
      { id: 'DELETE', name: 'DELETE', value: 'DELETE', colorClass: 'bg-blue-600 hover:bg-blue-700' },
    ];

    res.render('admin/logs/categoryLog-list', {
      title: 'Category Logs',
      models,
      modelColumns,
      filters,
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
    next(new InternalServerError('Failed to fetch category logs', error)); // Use the custom error handler
  }
};

module.exports = {
  getAdminLogs,
  getOrderLogs,
  getUserLogs,
  getFoodLogs,
  getCategoryLogs,
};
