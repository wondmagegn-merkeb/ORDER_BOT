const {
  getAllCategories,
  getCategoryById,
} = require('../api/categoryController');


exports.listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    console.log(categories)
    res.render('admin/category/list-category', { categories, title: 'Category List'});
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.showAddForm = (req, res) => {
  res.render('admin/category/create-category',{title: 'Category Add'});
};

exports.showEditForm = async (req, res) => {
  try {
    const category = await getCategoryById();
    res.render('admin/category/update-category', { category, title: 'Category Update'});
  } catch (error) {
    res.status(500).send(error.message);
  }
};

