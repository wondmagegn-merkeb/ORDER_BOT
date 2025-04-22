const categoryValidationSchema = require('../../validators/categoryValidation');
const { FoodCategory } = require('../../models/index');
const { InternalServerError } = require('../../utils/customError');

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await FoodCategory.findAll();
    return categories;
  } catch (error) {
    next(new InternalServerError('Failed to fetch categories',error));
  }
};

// Get a single category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await FoodCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return category;
  } catch (error) {
    next(new InternalServerError('Failed to fetch category',error));
  }
};

// Create a new category
exports.createCategory = async (req, res, next) => {
  try {
    const { error } = categoryValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { categoryName, description } = req.body;

    const existing = await FoodCategory.findOne({ where: { categoryName } });
    if (existing) return res.status(409).json({ message: 'Category name already exists' });

    const last = await FoodCategory.findOne({ order: [['createdAt', 'DESC']] });
    let newIdNumber = 1;
    if (last && last.categoryId) {
      const lastNumber = parseInt(last.categoryId.replace('CAT', ''));
      newIdNumber = lastNumber + 1;
    }

    const categoryId = 'CAT' + String(newIdNumber).padStart(3, '0');

    const newCategory = await FoodCategory.create({
      categoryId,
      categoryName,
      description,
      updatedBy :req.admin.adminId,
      createdBy :req.admin.adminId                                      
    });

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    next(new InternalServerError('Failed to create category',error));
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { error } = categoryValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { categoryName, description } = req.body;
    const categoryId = req.params.id;

    const category = await FoodCategory.findByPk(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.categoryName = categoryName || category.categoryName;
    category.description = description || category.description;
    category.updatedBy = req.admin.adminId;

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(new InternalServerError('Failed to update category',error));
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await FoodCategory.findByPk(categoryId);

    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.updatedBy = req.admin.adminId;
    await category.destroy();

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(new InternalServerError('Failed to delete category',error));
  }
};
