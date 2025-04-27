const sharp = require("sharp");
const cloudinary = require("../../config/cloudinary");
const { Food, FoodCategory, Admin, User } = require("../../models/index");
const { foodSchema } = require("../../validators/foodValidation");
const { getAllCategories } = require("./categoryController");
const { sendMessageToUser } = require("../../bots/userBot");
const { InternalServerError, NotFoundError } = require("../../utils/customError"); // Import NotFoundError

exports.createFood = async (req, res) => {
  try {
    const categories = await getAllCategories();
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });

    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/food/create-food', { categories, title: 'Food List' });
    }

    if (!req.file) {
      res.locals.error = 'Image file is required.';
      return res.render('admin/food/create-food', { categories, title: 'Food List' });
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toBuffer();
    const base64 = buffer.toString("base64");
    const dataUri = `data:image/webp;base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, { folder: "foods" });

    const last = await Food.findOne({ order: [['createdAt', 'DESC']] });
    const newIdNumber = last?.foodId ? parseInt(last.foodId.replace('FOOD', '')) + 1 : 1;
    const foodId = `FOOD${String(newIdNumber).padStart(3, '0')}`;

    const food = await Food.create({
      foodId,
      name: value.name,
      description: value.description,
      price: value.price,
      isAvailable: value.isAvailable === 'on',
      categoryId: value.categoryId,
      createdBy: req.admin.adminId,
      updatedBy: req.admin.adminId,
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    });


    const users = await User.findAll();
    const userTelegramIds = users.map(user => user.telegramId);

    const message = `
New Food Item Added to the Menu!
    `;

    for (const telegramId of userTelegramIds) {
      await sendMessageToUser(telegramId, message);
    }

    res.locals.success = "Food created successfully";
    return res.render('admin/food/create-food', { categories, title: 'Food List' });

  } catch (err) {
    console.error("Error in createFood:", err);
    throw new InternalServerError("Failed to create food.", err);
  }
};

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.findAll({
      include: { model: FoodCategory, attributes: ['categoryName'] }
    });
    return foods;
  } catch (err) {
    console.error("Error in getAllFoods:", err);
    throw new InternalServerError("Failed to fetch foods.", err);
  }
};

// Get food by ID
exports.getFoodById = async (foodId) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) {
      throw new NotFoundError("Food not found"); 
    }
    return food;
  } catch (err) {
    console.error("Error in getFoodById:", err);
    throw new InternalServerError("Failed to fetch food.", err);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    // Destructuring req.body
    const { name, description, price, isAvailable, categoryId } = req.body;
    // Destructuring foodId from req.params
    const { foodId } = req.params;

    // Validate the data using the schema
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
        // Fetch the food item by its foodId
    const food = await Food.findOne({ where: { foodId } });
    if (!food) {
      throw new NotFoundError("Food item not found.");
    }
    
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/food/update-food', { title: 'Update Food', food});
    }

    // Handle file upload (if a new image is provided)
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 800 })
        .webp({ quality: 80 })
        .toBuffer();

      // Delete the old image from Cloudinary
      if (food.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(food.cloudinaryPublicId);
      }

      // Upload the new image to Cloudinary
      const base64 = buffer.toString("base64");
      const dataUri = `data:image/webp;base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: "foods" });

      food.imageUrl = result.secure_url;
      food.cloudinaryPublicId = result.public_id;
    }

    // Update the food item with the new data
    await food.update({
      name: name || food.name,
      description: description || food.description,
      price: price || food.price,
      isAvailable: isAvailable || food.isAvailable,
      categoryId: categoryId || food.categoryId,
      imageUrl: food.imageUrl,
      cloudinaryPublicId: food.cloudinaryPublicId,
      updatedBy: req.admin.adminId,
    });

    
    res.locals.success = "Food updated successfully";
    return res.render('admin/food/update-food', { title: 'Update Food', food });

  } catch (err) {
      next(new InternalServerError("Failed to update food item", err));  
  }
};


// Delete food
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) {
      throw new NotFoundError("Food not found");
    }

    if (food.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(food.cloudinaryPublicId);
    }

    food.updatedBy = req.admin.adminId;
    await food.destroy();
    const foods = await Food.findAll({
      include: { model: FoodCategory, attributes: ['categoryName'] }
    });
    return  res.locals.success = "Food deleted successfully";
    res.render('admin/food/list-food', { foods ,title:'Food List'});
  } catch (err) {
    console.error("Error in deleteFood:", err);
    throw new InternalServerError("Failed to delete food.", err);
  }
};
