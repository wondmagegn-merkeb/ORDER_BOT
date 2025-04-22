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
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((err) => err.message),
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "📸 Image file is required." });
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
          return res.status(500).json({ message: "Image upload failed", error });
        }

        const food = await Food.create({
          name: value.name,
          description: value.description,
          price: value.price,
          isAvailable: value.isAvailable ?? true,
          categoryId: value.categoryId,
          createdBy: req.user?.id || "system",
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
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch foods", error: err.message });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "❌ Food not found" });
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: "Error fetching food", error: err.message });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const { error, value } = foodSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((err) => err.message),
      });
    }

    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "❌ Food not found" });

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
      cloudinaryPublicId: food.cloudinaryPublicId,
    });

    res.json({ message: "✅ Food updated", food });
  } catch (err) {
    res.status(500).json({ message: "❌ Update failed", error: err.message });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "❌ Food not found" });

    if (food.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(food.cloudinaryPublicId);
    }

    await food.destroy();
    res.json({ message: "🗑️ Food deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete error", error: err.message });
  }
};
