const Joi = require("joi");

const foodSchema = Joi.object({
  name: Joi.string().trim().min(2).required().messages({
    "string.empty": "🍽️ Food name is required.",
    "string.min": "🍽️ Food name should be at least 2 characters long.",
  }),
  description: Joi.string().trim().min(5).required().messages({
    "string.empty": "📖 Description is required.",
    "string.min": "📖 Description should be at least 5 characters long.",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "💲 Price must be a number.",
    "number.positive": "💲 Price must be greater than zero.",
    "any.required": "💲 Price is required.",
  }),
  isAvailable: Joi.string().required(),
  categoryId: Joi.string().required().messages({
    "string.empty": "📁 Category ID is required.",
  }),
});

module.exports = {
  foodSchema,
};
