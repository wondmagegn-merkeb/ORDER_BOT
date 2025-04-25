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
  { name: 'User ID', field: 'id', index: 0 },
  { name: 'Telegram Id', field: 'telegramId', index: 1 },
  { name: 'Username', field: 'username', index: 2 },
  { name: 'Full Name', field: 'fullName', index: 3 },
  { name: 'Phone One', field: 'phoneNumber1', index: 4 },
  { name: 'Phone Two', field: 'phoneNumber2', index: 5 },
  { name: 'User Type', field: 'userType', index: 6 },
  { name: 'Status', field: 'status', index: 7 }
];

const filters = [
  { id: 'active', name: 'Active', value: 'active', colorClass: 'bg-green-600 hover:bg-green-700' },
  { id: 'inactive', name: 'Inactive', value: 'inactive', colorClass: 'bg-red-600 hover:bg-red-700' }
];

  res.render('admin/user/list-user', { title: 'User List' , models, modelColumns, filters, modelName: 'User', modelNameLower: 'user',permissions: {
    canView: false,
    canEdit: true,
    canDelete: false
  } });
    
  } catch (error) {
    next(new InternalServerError('Failed to list users', error));
  }
};

// Show the form to edit an existing user
exports.showEditForm = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Fetch user by ID using the userController's method
    const user = await getUserById(userId);

    // If the user is not found, return a 404 error
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('admin/user/update-user', { user, title: 'Update User' });
  } catch (error) {
    next(new InternalServerError('Failed to fetch user for editing', error));
  }
};
