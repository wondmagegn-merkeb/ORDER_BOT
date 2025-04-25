const { getAllAdmins, getAdminById } = require('../api/adminController'); // Adjust path if needed
const { InternalServerError } = require('../../utils/customError');
exports.listAdmins = async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.render('admin/list-admin', { admins, title: 'Admin List' });
  } catch (err) {
    next(new InternalServerError('Error loading admins.', err));
  }
};

exports.showAddForm = (req, res) => {
  res.render('admin/create-admin', { title: 'Add Admin' });
};


exports.showEditForm = async (req, res) => {
  try {
    const adminId = req.params.id; // or req.query.adminId if passed as query param
    const admin = await getAdminById(adminId);

    if (!admin) {
      return res.status(404).send('Admin not found.');
    }

    res.render('admin/update-admin', {
      admin,
      title: 'Edit Admin'
    });
  } catch (err) {
    next(new InternalServerError('Error loading admin.', err));
    
  }
};

exports.showProfileForm = async (req, res) => {
  try {
    const adminId = req.admin.adminId; // or req.query.adminId if passed as query param
    const admin = await getAdminById(adminId);

    if (!admin) {
      return res.status(404).send('Admin not found.');
    }

    res.render('admin/profile-admin', {
      admin,
      title: 'Admin Profile'
    });
  } catch (err) {
    next(new InternalServerError('Error loading admin.', err));
  }
};                             
