
const Admin = require('../../models/Admin');

exports.listAdmins = async (req, res) => {
  const admins = await Admin.findAll();
  res.render('admin/list', { admins, title: 'Admin List' });
};

exports.showAddForm = (req, res) => {
  res.render('admin/add', { title: 'Add Admin' });
};

exports.showEditForm = async (req, res) => {
  const admin = await Admin.findByPk(req.params.id);
  res.render('admin/edit', { admin, title: 'Edit Admin' });
};
