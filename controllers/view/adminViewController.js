const { getAllAdmins, getAdminById } = require('../api/adminController'); // Adjust path if needed
const { InternalServerError } = require('../../utils/customError');
exports.listAdmins = async (req, res) => {
  try {
   const admins = await getAllAdmins();
    
const models = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', status: 'Active' }
];

const modelColumns = [
  { name: 'ID', field: 'id', index: 0 },
  { name: 'Name', field: 'name', index: 1 },
  { name: 'Email', field: 'email', index: 2 },
  { name: 'Role', field: 'role', index: 3 },
  { name: 'Status', field: 'status', index: 4 }
];

// Dummy filters (adjust based on your needs)
const filters = [
  { id: 'active', name: 'Active', value: 'Active' },
  { id: 'inactive', name: 'Inactive', value: 'Inactive' }
];

  res.render('admin/list-admin', {title: 'Admin List',admins, models, modelColumns, filters, modelName: 'Model', modelNameLower: 'model' });

  //  res.render('admin/list-admin', { admins, title: 'Admin List' });
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
