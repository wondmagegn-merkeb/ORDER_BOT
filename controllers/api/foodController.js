const sharp = require("sharp");
const cloudinary = require("../../config/cloudinary");
const { Food, FoodCategory, Admin } = require("../../models/index");
const { foodSchema } = require("../../validators/foodValidation");
const { getAllCategories } = require("./categoryController");
const { sendMessageToUser } = require("../../bots/userBot");
const { InternalServerError } = require("../../utils/CustomError");

exports.createFood = async (req, res) => {
  try {
    const categories = await getAllCategories();
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });

    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/food/create-food', { categories, title: 'Food List' });
    }

    if (!req.file) {
      res.locals.error = '📸 Image file is required.';
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

    await notifyUserController();

    const admins = await Admin.findAll();
    const adminTelegramIds = admins.map(admin => admin.telegramId);

    const message = `
🍽️ <b>New Food Item Added to the Menu!</b>
    `;

    for (const telegramId of adminTelegramIds) {
      await sendMessageToUser(telegramId, message);
    }

    res.locals.success = "✅ Food created successfully";
    return res.render('admin/food/create-food', { categories, title: 'Food List' });

  } catch (err) {
    console.error("❌ Error in createFood:", err);
    throw new InternalServerError("🚨 Failed to create food.", err);
  }
};

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.findAll({
      include: { model: FoodCategory, attributes: ['categoryName'] }
    });
    return foods;
  } catch (err) {
    console.error("❌ Error in getAllFoods:", err);
    throw new InternalServerError("🚨 Failed to fetch foods.", err);
  }
};

exports.getFoodById = async (foodId) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) {
      throw new InternalServerError("❌ Food not found");
    }
    return food;
  } catch (err) {
    console.error("❌ Error in getFoodById:", err);
    throw new InternalServerError("🚨 Failed to fetch food.", err);
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
      const result = await cloudinary.uploader.upload(dataUri, { folder: "foods" });

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
      cloudinaryPublicId: food.cloudinaryPublicId,
      updatedBy: req.admin.adminId,
    });

    res.locals.success = "✅ Food updated successfully";
    return res.render('admin/food/update-food', { title: 'Update Food', food });

  } catch (err) {
    console.error("❌ Error in updateFood:", err);
    throw new InternalServerError("🚨 Failed to update food.", err);
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) {
      res.locals.error = "❌ Food not found";
      return res.render('admin/food/list-food', { title: 'Food List' });
    }

    if (food.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(food.cloudinaryPublicId);
    }

    food.updatedBy = req.admin.adminId;
    await food.destroy();

    res.locals.success = "🗑️ Food deleted successfully";
    return res.render('admin/food/list-food', { title: 'Food List' });

  } catch (err) {
    console.error("❌ Error in deleteFood:", err);
    throw new InternalServerError("🚨 Failed to delete food.", err);
  }
};
