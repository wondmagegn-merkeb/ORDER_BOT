const {
  getAllCategories,
  getCategoryById,
} = require('../api/categoryController');
const { InternalServerError } = require('../../utils/customError');

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    res.render('admin/category/list-category', { categories, title: 'Category List' });
  } catch (error) {
    next(new InternalServerError('Failed to list categories', error));
  }
};

exports.showAddForm = (req, res) => {
  res.render('admin/category/create-category', { title: 'Category Add' });
};

exports.showEditForm = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await getCategoryById(categoryId);

    if (!category) {
      return res.status(404).send('Category not found');
    }

    res.render('admin/category/update-category', { category, title: 'Category Update' });
  } catch (error) {
    next(new InternalServerError('Failed to fetch category for editing', error));
  }
};
