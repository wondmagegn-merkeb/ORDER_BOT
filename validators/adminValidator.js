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

exports.updateAdminSchema = Joi.object({
  username: Joi.string().min(3).optional(), // Made optional
  email: Joi.string().email().optional(), // Made optional
  password: Joi.string().min(6).allow(null, '').optional(), // Made optional, allows null or empty string
  telegramId: Joi.string().optional(), // Made optional
  role: Joi.string().valid('admin', 'manager', 'delivery').optional(), // Made optional
  states: Joi.string().optional() // Made optional
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});
