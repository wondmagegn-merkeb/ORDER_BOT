const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const {
  Food,
  FoodCategory,
  Admin,
  User,
  Order,
} = require("../../models/index");
const { foodSchema } = require("../../validators/foodValidation");
const { getAllCategories } = require("./categoryController");
const { sendMessageToUser } = require("../../bots/userBot");
const {
  InternalServerError,
  NotFoundError,
} = require("../../utils/customError");

exports.createFood = async (req, res, next) => {
  try {
    req.body.isAvailable = req.body.isAvailable || "off";
    const categories = await getAllCategories();
    const { error, value } = foodSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.locals.error = error.details[0].message;
      return res.render("admin/food/create-food", {
        categories,
        title: "Food List",
      });
    }

    if (!req.file) {
      res.locals.error = "Image file is required.";
      return res.render("admin/food/create-food", {
        categories,
        title: "Food List",
      });
    }

    // Process image with sharp and save to local folder
    const originalPath = req.file.path;
    const filename = path.basename(originalPath);
    const ext = path.extname(filename);
    const filenameWithoutExt = path.basename(filename, ext);
    const processedFilename = `${filenameWithoutExt}.webp`;
    const processedPath = path.join(req.file.destination, processedFilename);

    // Resize and convert to WebP
    await sharp(originalPath)
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toFile(processedPath);

    // Delete original file if it's different from processed
    if (originalPath !== processedPath && fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    // Generate image URL path
    const imageUrl = `/uploads/foods/${processedFilename}`;

    const last = await Food.findOne({
      order: [["createdAt", "DESC"]],
      paranoid: false,
    });

    const newIdNumber = last?.foodId
      ? parseInt(last.foodId.replace("FOOD", "")) + 1
      : 1;
    const foodId = `FOOD${String(newIdNumber).padStart(3, "0")}`;

    const food = await Food.create({
      foodId,
      name: value.name,
      description: value.description,
      price: value.price,
      isAvailable: value.isAvailable === "on",
      categoryId: value.categoryId,
      createdBy: req.admin.adminId,
      updatedBy: req.admin.adminId,
      imageUrl: imageUrl,
      cloudinaryPublicId: "", // Empty string since we're not using Cloudinary
    });

    const users = await User.findAll();
    const userTelegramIds = users.map((user) => user.telegramId);

    const message = `🍽️ New Food Item Added to the Menu! Check it out!`;

    for (const telegramId of userTelegramIds) {
      await sendMessageToUser(telegramId, message);
    }

    res.locals.success = "Food created successfully";
    return res.render("admin/food/create-food", {
      categories,
      title: "Food List",
    });
  } catch (err) {
    console.error("Error in createFood:", err);
    next(new InternalServerError("Failed to create food.", err));
  }
};

exports.getAllFoods = async (req, res, next) => {
  try {
    const foods = await Food.findAll({
      include: { model: FoodCategory, attributes: ["categoryName"] },
    });
    return foods;
  } catch (err) {
    console.error("Error in getAllFoods:", err);
    next(new InternalServerError("Failed to fetch foods.", err));
  }
};

exports.getFoodById = async (foodId) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) {
      throw new NotFoundError("Food not found");
    }
    return food;
  } catch (err) {
    console.error(`Error in getFoodById (${foodId}):`, err);
    throw new InternalServerError("Failed to fetch food.", err);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    req.body.isAvailable = req.body.isAvailable || "off";
    const { name, description, price, isAvailable, categoryId } = req.body;
    const foodId = req.params.id;

    const { error, value } = foodSchema.validate(req.body, {
      abortEarly: false,
    });

    const food = await Food.findOne({ where: { foodId } });
    if (!food) {
      throw new NotFoundError("Food item not found.");
    }
    const categories = await getAllCategories();
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render("admin/food/update-food", {
        title: "Update Food",
        food,
        categories,
      });
    }

    if (req.file) {
      // Delete old image if exists
      if (food.imageUrl && food.imageUrl.startsWith("/uploads/")) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          food.imageUrl
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Process new image
      const originalPath = req.file.path;
      const filename = path.basename(originalPath);
      const ext = path.extname(filename);
      const filenameWithoutExt = path.basename(filename, ext);
      const processedFilename = `${filenameWithoutExt}.webp`;
      const processedPath = path.join(req.file.destination, processedFilename);

      // Resize and convert to WebP
      await sharp(originalPath)
        .resize({ width: 800 })
        .webp({ quality: 80 })
        .toFile(processedPath);

      // Delete original file if different
      if (originalPath !== processedPath && fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      // Generate image URL path
      const imageUrl = `/uploads/foods/${processedFilename}`;
      food.imageUrl = imageUrl;
      food.cloudinaryPublicId = ""; // Empty string since we're not using Cloudinary
    }

    await food.update({
      name: name || food.name,
      description: description || food.description,
      price: price || food.price,
      isAvailable: isAvailable === "on" ? true : false,
      categoryId: categoryId || food.categoryId,
      imageUrl: food.imageUrl,
      cloudinaryPublicId: food.cloudinaryPublicId || "", // Ensure empty string if null
      updatedBy: req.admin.adminId,
    });

    res.locals.success = "Food updated successfully";
    return res.render("admin/food/update-food", {
      title: "Update Food",
      food,
      categories,
    });
  } catch (err) {
    console.error("Error in updateFood:", err);
    next(new InternalServerError("Failed to update food item.", err));
  }
};

exports.deleteFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const food = await Food.findOne({ where: { foodId } });

    if (!food) {
      return next(new NotFoundError("Food not found"));
    }

    // Check if food is referenced in any order's items JSON array
    // Use raw SQL to check JSON array for foodId
    const { sequelize } = require("../config/db");
    const [results] = await sequelize.query(
      `SELECT orderId FROM orders WHERE JSON_SEARCH(items, 'one', :foodId, NULL, '$[*].foodId') IS NOT NULL LIMIT 1`,
      {
        replacements: { foodId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const relatedOrder = results && results.length > 0 ? results[0] : null;

    if (relatedOrder) {
      res.locals.error = "Cannot delete food. It is referenced in orders.";
      const foods = await Food.findAll({
        include: { model: FoodCategory, attributes: ["categoryName"] },
      });
      return res.render("admin/food/list-food", { title: "Food List", foods });
    }

    // Delete image file if exists
    if (food.imageUrl && food.imageUrl.startsWith("/uploads/")) {
      const imagePath = path.join(__dirname, "..", "public", food.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await food.destroy();

    res.locals.success = "Food deleted successfully";
    const foods = await Food.findAll({
      include: { model: FoodCategory, attributes: ["categoryName"] },
    });
    return res.render("admin/food/list-food", { title: "Food List", foods });
  } catch (err) {
    console.error("Error in deleteFood:", err);
    next(new InternalServerError("Failed to delete food.", err));
  }
};
