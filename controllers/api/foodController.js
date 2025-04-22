const stream = require("stream");
const sharp = require("sharp");
const cloudinary = require("../../config/cloudinary");
const { Food } = require("../../models/index");
const { foodSchema } = require("../../validators/foodValidation");

exports.createFood = async (req, res) => {
  try {
    // Validate input
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      
      res.locals.error = error.details[0].message;
      res.render('admin/food/create-food', { title: 'Add Food' });
    }
      
    if (!req.file) {
      
      res.locals.error = '📸 Image file is required.';
      res.render('admin/food/create-food', { title: 'Add Food' });
    }

    // Optimize image
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toBuffer();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "foods",
        resource_type: "image",
        format: "webp",
      },
      async (error, result) => {
        if (error) {
    res.locals.error = "Image upload failed";
      res.render('admin/food/create-food', { title: 'Add Food' });
          
        }

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
        res.status(201).json({ message: "✅ Food created successfully", food });
      }
    );

    const readable = new stream.PassThrough();
    readable.end(buffer);
    readable.pipe(uploadStream);
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
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.locals.error = error.details[0].message;
      res.render('admin/food/update-food', { title: 'Update Food' });
    }

    const food = await Food.findByPk(req.params.id);
    if (!food) {
      res.locals.error = "❌ Food not found";
      res.render('admin/food/update-food', { title: 'update Food' });
    }

    // Optional: handle new image upload
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 800 })
        .webp({ quality: 80 })
        .toBuffer();

      const uploadResult = await new Promise((resolve, reject) => {
        const streamUpload = cloudinary.uploader.upload_stream(
          { folder: "foods", resource_type: "image", format: "webp" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        const readable = new stream.PassThrough();
        readable.end(buffer);
        readable.pipe(streamUpload);
      });

      food.imageUrl = uploadResult.secure_url;
      food.cloudinaryPublicId = uploadResult.public_id;
    }

    // Update fields
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
    res.render('admin/food/update-food', { title: 'update Food' });
    
  } catch (err) {
    res.status(500).json({ message: "❌ Update failed", error: err.message });
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
