const jwt = require('jsonwebtoken');

// 🔐 Middleware to authenticate requests using JWT
exports.authenticate = (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  // Check if it exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract the token from header (removing 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store decoded token info (like adminId, email, role) on the request object
    req.admin = decoded;

    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    // Token is invalid or expired
    res.status(401).json({ message: 'Invalid token' });
  }
};

// 🔒 Middleware to authorize access based on roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the authenticated admin's role is included in the allowed roles
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // Role is authorized, continue
    next();
  };
};
