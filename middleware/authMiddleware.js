const jwt = require('jsonwebtoken');

// 🔐 Combined Middleware: Authenticate and Authorize based on roles
exports.authenticateAndAuthorize = (...roles) => {
  return (req, res, next) => {
    // Check if the token is available in the session
    const token = req.session.token; // Assuming the token is stored in the session

    // If no token is found in session, return an error
    if (!token) {
      res.render('login', { message: null, layout: false });
    }

    try {
      // Verify the token using the secret key (same as before)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Store decoded token info (like adminId, email, role) on the request object
      req.admin = decoded;

      // Check if the authenticated admin's role is included in the allowed roles
      if (!roles.includes(req.admin.role)) {
        res.locals.error = 'Access denied: insufficient permissions';
      }

      // If token is valid and role is authorized, continue to the next middleware or route handler
      next();
    } catch (err) {
      // Token is invalid or expired
      res.render('login', { message: null, layout: false });
    }
  };
};
