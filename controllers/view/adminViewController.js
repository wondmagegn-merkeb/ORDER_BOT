const { getAllAdmins } = require('../api/adminController'); // Adjust path if needed

exports.listAdmins = async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.render('admin/list', { admins, title: 'Admin List' });
  } catch (err) {
    res.status(500).send('Error loading admins.');
  }
};

exports.showAddForm = (req, res) => {
  res.render('admin/add', { title: 'Add Admin' });
};

exports.showEditForm = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
 //   res.render('admin/edit', { admin, title: 'Edit Admin' });
  } catch (err) {
    res.status(500).send('Error loading admin.');
  }
};
