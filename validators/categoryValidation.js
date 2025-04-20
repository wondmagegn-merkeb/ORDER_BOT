const Joi = require('joi');

// Joi schema for category validation
const categoryValidationSchema = Joi.object({
  categoryName: Joi.string().min(3).required().messages({
    'string.base': 'Category name should be a string.',
    'string.min': 'Category name should have at least 3 characters.',
    'any.required': 'Category name is required.'
  })
});

// Export the schema for use in other files
module.exports = categoryValidationSchema;
