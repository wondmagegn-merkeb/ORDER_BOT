const {
  getAllUsers,
  getUserById,
} = require('../api/userController');
const { InternalServerError } = require('../../utils/customError');

// List all users
exports.listUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    const models = users;

    const modelColumns = [
      { name: 'User ID', field: 'userId', index: 0 },
      { name: 'Telegram Id', field: 'telegramId', index: 1 },
      { name: 'Username', field: 'username', index: 2 },
      { name: 'Full Name', field: 'fullName', index: 3 },
      { name: 'Phone One', field: 'phoneNumber1', index: 4 },
      { name: 'Phone Two', field: 'phoneNumber2', index: 5 },
      { name: 'User Type', field: 'userType', index: 6 },
      { name: 'Status', field: 'status', index: 7 },
    ];

    const filters = [
      { id: 'guest', name: 'Guest', value: 'guest', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
      { id: 'vip', name: 'VIP', value: 'vip', colorClass: 'bg-indigo-600 hover:bg-indigo-700' }, // Changed to indigo for better contrast
      { id: 'customer', name: 'Customer', value: 'customer', colorClass: 'bg-blue-600 hover:bg-blue-700' },
      { id: 'active', name: 'Active', value: 'active', colorClass: 'bg-green-500 hover:bg-pink-600' }, // Changed to emerald for a more vibrant green
      { id: 'block', name: 'Block', value: 'block', colorClass: 'bg-pink-500 hover:bg-pink-600' }, // Changed to rose for a softer red
    ];

    res.render('admin/user/list-user', {
      title: 'User List',
      models,
      modelColumns,
      filters,
      modelName: 'User',
      modelNameLower: 'users',
      permissions: {
        canView: false,
        canAdd: false,
        canEdit: true,
        canDelete: false,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to list users', error));
  }
};

// Show the form to edit an existing user
exports.showEditForm = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await getUserById(userId);

    res.render('admin/user/update-user', {
      user,
      title: 'Update User',
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch user for editing', error));
  }
};
