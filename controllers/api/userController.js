const { User } = require('../../models');
const { InternalServerError } = require('../../utils/customError');
const userValidationSchema = require('../../validators/userValidation');
const { sendMessageToUser } = require('../../bots/userBot');

// Helper to generate user update message
const generateUserUpdateMessage = (user) => {
  const statusNote = user.status === 'inactive'
    ? '⚠️ You are now <b>blocked</b> from accessing the system.'
    : '✅ You are now <b>active</b> and can use the system.';

  return `
<b>⚙️ User Updated!</b>

<b>👤 Full Name:</b> ${user.fullName || 'Not provided'}
<b>🆔 Username:</b> ${user.username || 'Not provided'}
<b>🏷️ User Type:</b> ${user.userType || 'Not provided'}
<b>📶 Status:</b> ${user.status || 'Not provided'}

${statusNote}
  `;
};

// ✅ Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    return users;
  } catch (error) {
    next(new InternalServerError('Failed to fetch users', error));
  }
};

// ✅ Get a single user by ID
exports.getUserById = async (userId, res, next) => {
  try {
    const user = await User.findByPk(userId);
    return user;
  } catch (error) {
    next(new InternalServerError('Failed to fetch user', error));
  }
};

// ✅ Update user
exports.updateUser = async (req, res, next) => {
  try {
    req.body.status = req.body.status || 'inactive';
    const { status, userType } = req.body;
    const userId = req.params.id;

    const { error } = userValidationSchema.validate(req.body);
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

    const statusChanged = user.status !== status;

    // Update fields
    user.status = status;
    user.userType = userType;
    user.updatedBy = req.admin.adminId;
    await user.save();

    // Notify user if status changed
    if (statusChanged) {
      const message = generateUserUpdateMessage(user);
      await sendMessageToUser(user.telegramId, message);
    }

    res.locals.success = 'User updated successfully!';
    return res.render('admin/user/update-user', {
      title: 'Update User',
      user,
    });

  } catch (error) {
    next(new InternalServerError('Failed to update user', error));
  }
};
