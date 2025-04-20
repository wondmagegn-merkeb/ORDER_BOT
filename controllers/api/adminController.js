
const { Admin } = require('../../models/index');
const crypto = require('crypto');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const sendMail = require('../../utils/mailer');
const { createAdminSchema, loginSchema, updateAdminSchema, forgotPasswordSchema, resetPasswordSchema } = require('../../validators/adminValidator');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ✅ Create Admin
exports.createAdmin = async (req, res) => {
  const { error } = createAdminSchema.validate(req.body);
  if (error){
    res.locals.error = error.details[0].message;
    res.render('admin/add', { title: 'Add Admin' });
  }
  try {
    const { username, email, password, telegramId, role } = req.body;

    const existing = await Admin.findOne({ where: { email } });
    if (existing){
      res.locals.error =  'Email already in use' ;
      res.render('admin/add', { title: 'Add Admin' });
    }
    const lastAdmin = await Admin.findOne({ order: [['createdAt', 'DESC']] });

  let newIdNumber = 1;
  if (lastAdmin && lastAdmin.adminId) {
    const lastNumber = parseInt(lastAdmin.adminId.replace('ADM', ''));
    newIdNumber = lastNumber + 1;
  }

    const adminId = 'ADM' + String(newIdNumber).padStart(3, '0');
    const newAdmin = await Admin.create({
      adminId,
      username,
      email,
      password, // Using plain password (no hashing)
      telegramId,
      createdBy:'ADM001',
      role
    });
  
    res.locals.success =  'Admin added successfully!';;
    
 // req.session.error;
    res.render('admin/add', { title: 'Add Admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all admins
exports.getAllAdmins = async () => {
  try {
    // Fetch all admins from the database (no pagination on DB)
    const admins = await Admin.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Return full list — frontend will handle pagination
    return admins;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getAdminById = async (adminId) => {
  try {
    const admin = await Admin.findOne({ where: { adminId } });
    return admin; // Could be null if not found, let controller handle it
  } catch (err) {
    throw new Error(err.message);
  }
};

// ✅ Update admin
exports.updateAdmin = async (req, res) => {
  const { error } = updateAdminSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { adminId } = req.params;
    const { username, email, password, telegramId, updatedBy, role, states } = req.body;

    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) admin.password = password;  // Using plain password
    if (telegramId) admin.telegramId = telegramId;
    if (states) admin.states = states;
    if (role) admin.role = role;
    admin.updatedBy = updatedBy;

    await admin.save();
    res.redirect(`/admins/${adminId}`);  // Redirect after successful update (to admin detail page)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Admin login
exports.login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (admin.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ adminId: admin.adminId, role: admin.role }, JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ token, admin: { adminId: admin.adminId, username: admin.username, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Forgot password
exports.forgotPassword = async (req, res) => {
  const { error } = forgotPasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ message: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1hr

    admin.resetToken = token;
    admin.resetTokenExpires = expiry;
    await admin.save();

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await sendMail({
      to: admin.email,
      subject: 'Reset Your Password',
      html: `<p>You requested a password reset. <a href="${resetLink}">Click here</a> to reset.</p>`
    });

    res.json({ message: 'Reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reset password
exports.resetPassword = async (req, res) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { token, newPassword } = req.body;

    const admin = await Admin.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!admin) return res.status(400).json({ message: 'Invalid or expired token' });

    admin.password = newPassword;  // Using plain password
    admin.resetToken = null;
    admin.resetTokenExpires = null;
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
