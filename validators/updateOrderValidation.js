const Joi = require('joi');

// Validation schema for updating the order
const updateOrderSchema = Joi.object({
  totalPrice: Joi.number()
    .precision(2)
    .positive()
    .optional()  // Make it optional since user can update only one field
    .messages({
      'number.base': 'Total price must be a number.',
      'number.precision': 'Total price can only have up to 2 decimal places.',
      'number.positive': 'Total price must be a positive value.',
    }),

  status: Joi.string()
    .valid('pending', 'in progress', 'completed', 'cancelled') // Allowed status values
    .optional()  // Optional as user can update only one field
    .messages({
      'string.base': 'Status must be a string.',
      'string.valid': 'Status must be one of the following: pending, in progress, completed, cancelled.',
    })
});

module.exports = updateOrderSchema;
