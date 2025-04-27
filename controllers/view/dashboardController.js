const {
  getDashboardData
} = require('../api/dashboradController');
const { InternalServerError } = require('../../utils/customError');

// Show the form to edit an existing user
exports.showEditForm = async (req, res, next) => {
  try {
  
    const dashboard = await getDashboardData();

    res.render('admin/dashboard', { title: 'Dashboard', dashboard });
  } catch (error) {
    next(new InternalServerError('Failed to fetch user for editing', error));
  }
};
