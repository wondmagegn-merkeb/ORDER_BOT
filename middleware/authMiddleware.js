const jwt = require('jsonwebtoken');
const { Admin } = require('../models/index'); // adjust path to your Admin model

exports.authenticateAndAuthorize = (...roles) => {
  return async (req, res, next) => {
    const token = req.session.token;

    if (!token) {
      return res.render('login', { message: null, layout: false });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded;

      // Fetch admin from database
      const admin = await Admin.findByPk(req.admin.adminId);

      if (!admin) {
        return res.render('login', { message: 'Admin not found', layout: false });
      }

      // Check mustChangeCredentials
      if (!admin.mustChangeCredentials) {
        
          res.locals.error = 'You must change your credentials before continuing.';
          
      return  res.render('admin/profile-admin', {
      admin,
      title: 'Admin Profile'
    });
      }

      // Check role permission
      if (!roles.includes(admin.role)) {
        res.locals.error = 'Access denied: insufficient permissions';
        return res.status(403).render('unauthorized', { error: 'Access denied: insufficient permissions', layout: false });
      }

      next();
    } catch (err) {
      return res.render('login', { message: null, layout: false });
    }
  };
};
