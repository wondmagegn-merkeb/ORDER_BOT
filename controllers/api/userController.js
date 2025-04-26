const { User } = require('../../models/index');
const { InternalServerError } = require('../../utils/customError');
const userValidationSchema = require('../../validators/userValidation'); // Assuming you have a validation schema

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    return users;
  } catch (error) {
    next(new InternalServerError('Failed to fetch users', error));
  }
};

// Get a single user by ID
exports.getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    return user;
  } catch (error) {
    return next(new InternalServerError('Failed to fetch user', error));
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    // Validate input using userValidationSchema
    const { error } = userValidationSchema.validate(req.body);
    
    const { status, userType } = req.body;
    const userId = req.params.id;
    
    const userData = { status, userType, userId };
    
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/user/update-user', {
        title: 'Update User',
        user: userData
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.locals.error = 'User not found';
      return res.render('admin/user/update-user', {
        title: 'Update User',
        user: userData
      });
    }

    // Update user fields
    user.status = status;
    user.userType = userType;
    user.updatedBy = req.admin.adminId;

    await user.save();

    res.locals.success = 'User updated successfully!';
    return res.render('admin/user/update-user', {
      title: 'Update User',
      user,
    });

  } catch (error) {
    next(new InternalServerError('Failed to update user', error));
  }
};

