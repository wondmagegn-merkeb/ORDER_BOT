const Joi = require('joi');

// User validation schema
const userValidationSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'block')
    .required()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be either "active" or "inactive"',
      'any.required': 'Status is required',
    }),
  
  userType: Joi.string()
    .valid('guest', 'vip', 'customer')
    .required()
    .messages({
      'string.base': 'User Type must be a string',
      'any.only': 'User Type must be either "customer" or "admin"',
      'any.required': 'User Type is required',
    }),
});

module.exports = userValidationSchema;
