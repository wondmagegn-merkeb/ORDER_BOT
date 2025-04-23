const sharp = require("sharp");
const cloudinary = require("../../config/cloudinary");
const { Food, FoodCategory } = require("../../models/index");
const { foodSchema } = require("../../validators/foodValidation");
const {
  getAllCategories,
} = require('./categoryController');
const { notifyUserController } = require('./controllers/notificationController');

exports.createFood = async (req, res) => {
  try {
    const categories = await getAllCategories();
    
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.locals.error = error.details[0].message;
      res.render('admin/food/create-food', { categories, title: 'Food List' });
    }

    if (!req.file) {
      res.locals.error = '📸 Image file is required.';
      res.render('admin/food/create-food', { categories, title: 'Food List' });
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toBuffer();

    const base64 = buffer.toString("base64");
    const dataUri = `data:image/webp;base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "foods"
    });
const last = await Food.findOne({ order: [['createdAt', 'DESC']] });
  let newIdNumber = 1;

  if (last && last.foodId) {
    const lastNumber = parseInt(last.foodId.replace('FOOD', ''));
    newIdNumber = lastNumber + 1;
  }

  const foodId = 'FOOD' + String(newIdNumber).padStart(3, '0');
    
    const food = await Food.create({
  foodId,
  name: value.name,
  description: value.description,
  price: value.price,
  isAvailable: value.isAvailable === 'on' ? true : false, // Ensure it's a boolean
  categoryId: value.categoryId,
  createdBy: req.admin.adminId,
  updatedBy: req.admin.adminId,
  imageUrl: result.secure_url,
  cloudinaryPublicId: result.public_id,
});

    await notifyUserController();


    res.locals.success = "✅ Food created successfully";
    res.render('admin/food/create-food', { categories, title: 'Food List' });

  } catch (err) {
    console.error("❌ Internal Error (createFood):", err);
    res.locals.error = "🚨 Internal server error occurred. Please try again.";
    const categories = await getAllCategories();
    res.render('admin/food/create-food', { categories, title: 'Food List' });
  }
};

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.findAll({
      include: {
        model: FoodCategory,
        attributes: ['categoryName'], // You can customize which fields to fetch
      }
    });
    return foods;
  } catch (err) {
    console.error("❌ Internal Error (getAllFoods):", err);
    res.status(500).json({
      message: "🚨 Failed to fetch foods. Please try again later.",
      error: err.message
    });
  }
};


exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "❌ Food not found" });
    return food;
  } catch (err) {
    console.error("❌ Internal Error (getFoodById):", err);
    res.status(500).json({ message: "🚨 Error fetching food. Please try again later.", error: err.message });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/food/update-food', { title: 'Update Food' });
    }

    const food = await Food.findByPk(req.params.id);
    if (!food) {
      res.locals.error = "❌ Food not found";
      return res.render('admin/food/update-food', { title: 'Update Food' });
    }

    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 800 })
        .webp({ quality: 80 })
        .toBuffer();

      if (food.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(food.cloudinaryPublicId);
      }

      const base64 = buffer.toString("base64");
      const dataUri = `data:image/webp;base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "foods"
      });

      food.imageUrl = result.secure_url;
      food.cloudinaryPublicId = result.public_id;
    }

    await food.update({
      name: value.name,
      description: value.description,
      price: value.price,
      isAvailable: value.isAvailable,
      categoryId: value.categoryId,
      imageUrl: food.imageUrl,
      updatedBy: req.admin.adminId,
      cloudinaryPublicId: food.cloudinaryPublicId,
    });

    res.locals.success = "✅ Food updated successfully";
    return res.render('admin/food/update-food', { title: 'Update Food', food });

  } catch (err) {
    console.error("❌ Internal Error (updateFood):", err);
    res.locals.error = "🚨 Failed to update food. Please try again later.";
    return res.render('admin/food/update-food', { title: 'Update Food' });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) {
      res.locals.error = "❌ Food not found";
      return res.render('admin/food/list-food', { title: 'Add List' });
    }

    if (food.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(food.cloudinaryPublicId);
    }

    food.updatedBy = req.admin.adminId;
    await food.destroy();

    res.locals.success = "🗑️ Food deleted successfully";
    res.render('admin/food/list-food', { title: 'Add List' });

  } catch (err) {
    console.error("❌ Internal Error (deleteFood):", err);
    res.locals.error = "🚨 Failed to delete food. Please try again later.";
    res.render('admin/food/list-food', { title: 'Add List' });
  }
};

