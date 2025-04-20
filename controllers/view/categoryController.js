const {
  getAllCategories,
  getCategoryById,
} = require('../api/categoryApiController');


exports.listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.render('category', { categories, title: 'Category List'});
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.showAddForm = (req, res) => {
  res.render('addCategory',{title: 'Category Add'});
};

exports.showEditForm = async (req, res) => {
  try {
    const category = await getCategoryById();
    res.render('editCategory', { category, title: 'Category Update'});
  } catch (error) {
    res.status(500).send(error.message);
  }
};

