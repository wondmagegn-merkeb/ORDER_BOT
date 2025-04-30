const Joi = require('joi');

exports.createAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  telegramId: Joi.string().required(),
  role: Joi.string().valid('admin', 'manager', 'delivery').required() // added 'delivery' role
});

exports.loginSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().required()
});

exports.updateAdminProfileSchema = Joi.object({
  username: Joi.string().min(3).required(), // Made optional
  password: Joi.string().min(6).allow(null, '').required(), // Made optional, allows null or empty string
});

exports.updateAdminSchema = Joi.object({
  email: Joi.string().email().required(), // Made optional
  telegramId: Joi.string().required(), // Made optional
  role: Joi.string().valid('admin', 'manager', 'delivery').required(), // Made optional
  states: Joi.string().required() // Made optional
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});
