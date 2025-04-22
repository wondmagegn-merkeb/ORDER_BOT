const sharp = require("sharp");
const cloudinary = require("../../config/cloudinary");
const { Food } = require("../../models/index");
const { foodSchema } = require("../../validators/foodValidation");
const {
  getAllCategories,
  
} = require('./categoryController');
exports.createFood = async (req, res) => {
  try {
    const categories = await getAllCategories();
    
    // Validate input
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      
      res.locals.error = error.details[0].message;
      res.render('admin/food/create-food', { categories,title:'Food List' });
    }
      
    if (!req.file) {
      
      res.locals.error = '📸 Image file is required.';
      res.render('admin/food/create-food', { categories,title:'Food List' });
    }

    // Optimize image
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toBuffer();

    // 📦 Convert to base64 Data URI
    const base64 = buffer.toString("base64");
    const dataUri = `data:image/webp;base64,${base64}`;

    // ☁️ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "foods"
    });

    // ✅ Create food item in DB
    const food = await Food.create({
      name: value.name,
      description: value.description,
      price: value.price,
      isAvailable: value.isAvailable ?? true,
      categoryId: value.categoryId,
      createdBy: req.admin.adminId,
      updatedBy: req.admin.adminId,
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    });
res.locals.success = "✅ Food created successfully";
res.render('admin/food/create-food', { categories,title:'Food List' });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Internal Server Error", error: err.message });
  }
};

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.findAll();
    return foods;
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch foods", error: err.message });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "❌ Food not found" });
    return food;
  } catch (err) {
    res.status(500).json({ message: "Error fetching food", error: err.message });
  }
};

exports.updateFood = async (req, res) => {
  try {
    // ✅ Validate input
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/food/update-food', { title: 'Update Food' });
    }

    // ❌ Check if food exists
    const food = await Food.findByPk(req.params.id);
    if (!food) {
      res.locals.error = "❌ Food not found";
      return res.render('admin/food/update-food', { title: 'Update Food' });
    }

    // 📸 Handle optional new image upload
    if (req.file) {
      // 🧊 Optimize new image
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 800 })
        .webp({ quality: 80 })
        .toBuffer();

      // 🧼 Remove old image from Cloudinary
      if (food.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(food.cloudinaryPublicId);
      }

      // 📦 Convert and upload new image
      const base64 = buffer.toString("base64");
      const dataUri = `data:image/webp;base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "foods"
      });

      // 📝 Save new image data
      food.imageUrl = result.secure_url;
      food.cloudinaryPublicId = result.public_id;
    }

    // 🛠️ Update food fields
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
    console.error("❌ Error updating food:", err);
    return res.status(500).json({ message: "❌ Update failed", error: err.message });
  }
};


exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) {
      res.locals.error = "❌ Food not found";
      res.render('admin/food/list-food', { title: 'Add List' });
    }
    
    if (food.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(food.cloudinaryPublicId);
    }
    food.updatedBy= req.admin.adminId,
    await food.destroy();
    res.locals.success = "🗑️ Food deleted successfully";
    res.render('admin/food/list-food', { title: 'Add List' });
    
  } catch (err) {
    res.status(500).json({ message: "Delete error", error: err.message });
  }
};
