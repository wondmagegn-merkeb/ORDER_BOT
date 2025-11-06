const jwt = require("jsonwebtoken");
const { Admin } = require("../models/index"); // Adjust the path to your Admin model

exports.authenticateAndAuthorize = (...roles) => {
  return async (req, res, next) => {
    const token = req.session.token;

    if (!token) {
      // For API routes, return JSON error instead of rendering login page
      const isApiRoute =
        req.originalUrl.startsWith("/api/") ||
        req.originalUrl.startsWith("/subscribe");
      if (isApiRoute) {
        return res.status(401).json({
          message: "Unauthorized. Please log in again.",
          error: "No authentication token found",
        });
      }
      return res.render("login", { message: null, layout: false });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded;

      // Fetch admin from database
      const admin = await Admin.findByPk(req.admin.adminId);

      if (!admin) {
        // For API routes, return JSON error instead of rendering login page
        const isApiRoute =
          req.originalUrl.startsWith("/api/") ||
          req.originalUrl.startsWith("/subscribe");
        if (isApiRoute) {
          return res.status(404).json({
            message: "Admin not found",
            error: "Admin account does not exist",
          });
        }
        return res.render("login", {
          message: "Admin not found",
          layout: false,
        });
      }

      res.locals.role = admin.role;

      // Check mustChangeCredentials
      if (admin.mustChangeCredentials) {
        res.locals.error =
          "You must change your credentials before continuing.";
        return res.render("admin/profile-admin", {
          admin,
          title: "Admin Profile",
        });
      }

      // Check role permission
      if (!roles.includes(admin.role)) {
        res.locals.error = "Access denied: insufficient permissions";
        return res.status(403).render("unauthorized", {
          error: "Access denied: insufficient permissions",
          layout: false,
        });
      }

      next();
    } catch (err) {
      console.error(err);
      // For API routes, return JSON error instead of rendering login page
      const isApiRoute =
        req.originalUrl.startsWith("/api/") ||
        req.originalUrl.startsWith("/subscribe");
      if (isApiRoute) {
        return res.status(401).json({
          message: "Authentication failed",
          error: err.message || "Invalid or expired token",
        });
      }
      return res.render("login", { message: null, layout: false });
    }
  };
};
