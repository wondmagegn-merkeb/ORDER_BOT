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
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).allow(null).required(),
  telegramId: Joi.string().required(),
  role: Joi.string().valid('admin', 'manager', 'delivery').required(), // added 'delivery' role
  states: Joi.string().required() // states made required
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});
