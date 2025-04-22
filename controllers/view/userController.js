const {
  getAllUsers,
  getUserById,
} = require('../api/userController');
const { InternalServerError } = require('../../utils/customError');

// List all users
exports.listUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.render('admin/user/list-user', { users, title: 'User List' });
  } catch (error) {
    next(new InternalServerError('Failed to list users', error));
  }
};

// Show the form to edit an existing user
exports.showEditForm = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Fetch user by ID using the userController's method
    const user = await getUserById();

    // If the user is not found, return a 404 error
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('admin/user/update-user', { user, title: 'Update User' });
  } catch (error) {
    next(new InternalServerError('Failed to fetch user for editing', error));
  }
};
