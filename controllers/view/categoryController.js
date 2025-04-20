const {
  getAllCategories,
  getCategoryById,
} = require('../api/categoryApiController');


exports.listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.render('category', { categories });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.showAddForm = (req, res) => {
  res.render('addCategory');
};

exports.showEditForm = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    res.render('editCategory', { category });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

