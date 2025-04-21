const { getAllAdmins, getAdminById } = require('../api/adminController'); // Adjust path if needed

exports.listAdmins = async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.render('admin/list-admin', { admins, title: 'Admin List' });
  } catch (err) {
    res.status(500).send('Error loading admins.');
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
    console.error('Error loading admin:', err.message);
    res.status(500).send('Error loading admin.');
  }
};
