const categoryValidationSchema = require('../../validators/categoryValidation'); // Adjust the path if necessary
const { FoodCategory } = require('../../models/index'); // Adjust path if necessary

// Get all categories (API endpoint)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await FoodCategory.findAll();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};

// Get a single category by ID (API endpoint)
exports.getCategoryById = async (req, res) => {
  try {
    const category = await FoodCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return category;
  } catch (error) {
    console.error('Error fetching category:', error.message);
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
};

// Create a new category (API endpoint)
exports.createCategory = async (req, res) => {
  try {
    // Validate request body with Joi
    const { error } = categoryValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description } = req.body;

    const newCategory = await FoodCategory.create({ name, description });

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error.message);
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};

// Update an existing category (API endpoint)
exports.updateCategory = async (req, res) => {
  try {
    // Validate request body with Joi
    const { error } = categoryValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description } = req.body;
    const categoryId = req.params.id;

    const category = await FoodCategory.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating category:', error.message);
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

// Delete a category (API endpoint)
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await FoodCategory.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.destroy();

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error.message);
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};
