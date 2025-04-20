const { getAllCategories, getCategoryById } = require('../api/categoryController'); // Adjust path if needed

// List all categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.render('category/list-category', { categories, title: 'Category List' });
  } catch (err) {
    console.error('Error loading categories:', err.message);
    res.status(500).send('Error loading categories.');
  }
};

// Show form to add a new category
exports.showAddForm = (req, res) => {
  res.render('category/add-category', { title: 'Add Category' });
};

// Show form to edit an existing category
exports.showEditForm = async (req, res) => {
  try {
    const categoryId = req.params.id; // or req.query.categoryId if passed as query param
    const category = await getCategoryById(categoryId);

    if (!category) {
      return res.status(404).send('Category not found.');
    }

    res.render('category/edit-category', { 
      category, 
      title: 'Edit Category' 
    });
  } catch (err) {
    console.error('Error loading category:', err.message);
    res.status(500).send('Error loading category.');
  }
};
