const { getAllAdmins, getAdminById } = require('../api/adminController'); // Adjust path if needed
const { InternalServerError } = require('../../utils/customError');
exports.listAdmins = async (req, res) => {
  try {
   const admins = await getAllAdmins();
    
const models = admins;

const modelColumns = [
  { name: 'Admin ID', field: 'adminId', index: 0 },
  { name: 'Username', field: 'username', index: 1 },
  { name: 'Email', field: 'email', index: 2 },
  { name: 'Role', field: 'role', index: 3 },
  { name: 'status', field: 'states', index: 4 }
];

const filters = [
  { id: 'admin', name: 'Admin', value: 'admin', colorClass: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'manager', name: 'Manager', value: 'manager', colorClass: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'delivery', name: 'Delivery boy/girl', value: 'delivery', colorClass: 'bg-green-600 hover:bg-green-700' },
  { id: 'active', name: 'Active', value: 'Active', colorClass: 'bg-teal-600 hover:bg-teal-700' },
  { id: 'inactive', name: 'Inactive', value: 'Inactive', colorClass: 'bg-red-600 hover:bg-red-700' }
];


  res.render('admin/list-admin', { title: 'Admin List' , models, modelColumns, filters, modelName: 'Admin', modelNameLower: 'admin',permissions: {
    canView: false,
        canAdd: true,
        canEdit: true,
        canDelete: true,
  } });


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
