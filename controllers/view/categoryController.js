const {
  getAllCategories,
  getCategoryById,
} = require('../api/categoryController');
const { InternalServerError } = require('../../utils/customError');

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    const models = categories;

    const modelColumns = [
      { name: 'Category ID', field: 'categoryId', index: 0 },
      { name: 'Category Name', field: 'categoryName', index: 1 },
      { name: 'Description', field: 'description', index: 2 }
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
        canDelete:true
          }
    });
    
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
