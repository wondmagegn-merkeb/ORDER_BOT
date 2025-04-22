const Joi = require('joi');

// User validation schema
const userValidationSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'Username must be a string',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username can be at most 30 characters long',
      'any.required': 'Username is required',
    }),
  
  status: Joi.string()
    .valid('active', 'inactive') // Allow only 'active' or 'inactive'
    .required()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be either "active" or "inactive"',
      'any.required': 'Status is required',
    }),
  
  userType: Joi.string()
    .valid('customer', 'admin') // Allow only 'customer' or 'admin'
    .required()
    .messages({
      'string.base': 'User Type must be a string',
      'any.only': 'User Type must be either "customer" or "admin"',
      'any.required': 'User Type is required',
    }),
});

module.exports = userValidationSchema;
