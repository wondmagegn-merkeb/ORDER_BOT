const { getAllAdmins, getAdminById } = require('../api/adminController'); 
const { InternalServerError } = require('../../utils/customError');

exports.listAdmins = async (req, res,next) => {
  try {
    const admins = await getAllAdmins();
    const models = admins;

    const modelColumns = [
      { name: 'Admin ID', field: 'adminId', index: 0 },
      { name: 'Username', field: 'username', index: 1 },
      { name: 'Email', field: 'email', index: 2 },
      { name: 'Role', field: 'role', index: 3 },
      { name: 'Status', field: 'states', index: 4 }
    ];

const filters = [
  { id: 'admin', name: 'Admin', value: 'admin', colorClass: 'bg-violet-400 hover:bg-violet-500' },
  { id: 'manager', name: 'Manager', value: 'manager', colorClass: 'bg-sky-400 hover:bg-sky-500' },
  { id: 'delivery', name: 'Delivery Staff', value: 'delivery', colorClass: 'bg-lime-400 hover:bg-lime-500' },
  { id: 'active', name: 'Active', value: 'Active', colorClass: 'bg-teal-400 hover:bg-teal-500' },
  { id: 'inactive', name: 'Inactive', value: 'Inactive', colorClass: 'bg-pink-400 hover:bg-pink-500' }
];


    res.render('admin/list-admin', { 
      title: 'Admin List', 
      models, 
      modelColumns, 
      filters, 
      modelName: 'Admin', 
      modelNameLower: 'admin', 
      permissions: {
        canView: false,
        canAdd: true,
        canEdit: true,
        canDelete: true
      } 
    });
  } catch (err) {
    next(new InternalServerError('Error loading admins.', err));
  }
};

exports.showAddForm = (req, res) => {
  res.render('admin/create-admin', { title: 'Add Admin' });
};

exports.showEditForm = async (req, res,next) => {
  try {
    const adminId = req.params.id;
    const admin = await getAdminById(adminId);

    res.render('admin/update-admin', {
      admin,
      title: 'Edit Admin'
    });
  } catch (err) {
    next(new InternalServerError('Error loading admin.', err));
  }
};

exports.showProfileForm = async (req, res,next) => {
  try {
    const adminId = req.admin.adminId;
    const admin = await getAdminById(adminId);

    res.render('admin/profile-admin', {
      admin,
      title: 'Admin Profile'
    });
  } catch (err) {
    next(new InternalServerError('Error loading admin.', err));
  }
};
