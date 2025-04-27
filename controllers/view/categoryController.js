const {
  getAllCategories,
  getCategoryById,
} = require('../api/categoryController');
const { InternalServerError } = require('../../utils/customError');

// List all categories
exports.listCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    const models = categories;

    const modelColumns = [
      { name: 'Category ID', field: 'categoryId', index: 0 },
      { name: 'Category Name', field: 'categoryName', index: 1 },
      { name: 'Description', field: 'description', index: 2 },
    ];

    const filters = [];

    res.render('admin/category/list-category', {
      title: 'Category List',
      models,
      modelColumns,
      filters,
      modelName: 'Category',
      modelNameLower: 'categories',
      permissions: {
        canView: false,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to list categories', error));
  }
};

// Show form to add a new category
exports.showAddForm = (req, res) => {
  res.render('admin/category/create-category', { title: 'Category Add' });
};

// Show form to edit a category
exports.showEditForm = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await getCategoryById(categoryId);

    res.render('admin/category/update-category', { category, title: 'Category Update' });
  } catch (error) {
    next(new InternalServerError('Failed to fetch category for editing', error));
  }
};
