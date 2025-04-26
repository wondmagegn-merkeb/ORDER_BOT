const categoryValidationSchema = require('../../validators/categoryValidation');
const { FoodCategory } = require('../../models/index');
const { InternalServerError } = require('../../utils/customError');

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await FoodCategory.findAll();
    return categories;
  } catch (error) {
    next(new InternalServerError('Failed to fetch categories', error));
  }
};

// Get a single category by ID
exports.getCategoryById = async (categoryId, res) => {
  try {
    const category = await FoodCategory.findByPk(categoryId);
    if (!category) {
      res.locals.error = 'Category not found';
      return res.render('admin/category/list-category', { title: 'List Category' });
    }
    return category;
  } catch (error) {
    return next(new InternalServerError('Failed to fetch category', error));
  }
};

// Create a new category
exports.createCategory = async (req, res, next) => {
  try {
    const { error } = categoryValidationSchema.validate(req.body);
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/category/create-category', { title: 'Add Category' });
    }

    const { categoryName, description } = req.body;

    const existing = await FoodCategory.findOne({ where: { categoryName } });
    if (existing) {
      res.locals.error = 'Category name already exists';
      return res.render('admin/category/create-category', { title: 'Add Category' });
    }

    // Generate unique category ID
    const last = await FoodCategory.findOne({ order: [['createdAt', 'DESC']] });
    let newIdNumber = 1;
    if (last && last.categoryId) {
      const lastNumber = parseInt(last.categoryId.replace('CAT', ''));
      newIdNumber = lastNumber + 1;
    }
    const categoryId = 'CAT' + String(newIdNumber).padStart(3, '0');

    await FoodCategory.create({
      categoryId,
      categoryName,
      description,
      createdBy: req.admin.adminId,
      updatedBy: req.admin.adminId,
    });

    res.locals.success = 'Category added successfully!';
    return res.render('admin/category/create-category', { title: 'Add Category' });
  } catch (error) {
    next(new InternalServerError('Failed to create category', error));
  }
};

// Update a category
exports.updateCategory = async (req, res, next) => {
  try {
    const { error } = categoryValidationSchema.validate(req.body);
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/category/update-category', { title: 'Update Category' });
    }

    const { categoryName, description } = req.body;
    const categoryId = req.params.id;

    const category = await FoodCategory.findByPk(categoryId);
    if (!category) {
      res.locals.error = 'Category not found';
      return res.render('admin/category/update-category', { title: 'Update Category' });
    }

    category.categoryName = categoryName || category.categoryName;
    category.description = description || category.description;
    category.updatedBy = req.admin.adminId;

    await category.save();

    res.locals.success = 'Category updated successfully!';
    return res.render('admin/category/update-category', { title: 'Update Category' });
  } catch (error) {
    next(new InternalServerError('Failed to update category', error));
  }
};

// Delete a category
exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await FoodCategory.findByPk(categoryId);

    if (!category) {
      res.locals.error = 'Category not found';
      return res.render('admin/category/list-category', { title: 'List Category' });
    }

    category.updatedBy = req.admin.adminId;
    await category.destroy();

    res.locals.success = 'Category deleted successfully!';
    return res.render('admin/category/list-category', { title: 'List Category' });
  } catch (error) {
    next(new InternalServerError('Failed to delete category', error));
  }
};
