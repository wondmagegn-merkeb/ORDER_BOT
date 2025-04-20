const Joi = require('joi');

// Joi schema for category validation
const categoryValidationSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.base': 'Category name should be a string.',
    'string.min': 'Category name should have at least 3 characters.',
    'any.required': 'Category name is required.'
  }),
  description: Joi.string().optional().allow('')
});

// Export the schema for use in other files
module.exports = categoryValidationSchema;
