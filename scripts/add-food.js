#!/usr/bin/env node

/**
 * Script to add food items from a folder
 *
 * Usage:
 *   node scripts/add-food.js
 *   node scripts/add-food.js --imagesFolder=./images/foods
 *
 * Place food images in a folder (default: ./images/foods)
 * Image filenames should match or be similar to food names for easy matching
 */

require("dotenv").config();
const { sequelize } = require("../config/db");
const Food = require("../models/Food");
const FoodCategory = require("../models/FoodCategory");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");
const http = require("http");

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  });
  return args;
}

// Sample food data - modify this with your actual food items
const foodsData = [
  // Beverages
  {
    name: "Coffee",
    description: "Freshly brewed coffee, hot and aromatic",
    price: 5.99,
    categoryName: "Beverages",
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800", // Optional: URL to download image
  },
  {
    name: "Orange Juice",
    description: "Fresh squeezed orange juice",
    price: 4.99,
    categoryName: "Beverages",
    imageUrl:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800",
  },
  {
    name: "Tea",
    description: "Hot tea with your choice of flavors",
    price: 3.99,
    categoryName: "Beverages",
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800",
  },

  // Snacks
  {
    name: "French Fries",
    description: "Crispy golden fries served hot",
    price: 7.99,
    categoryName: "Snacks",
    imageUrl:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800",
  },
  {
    name: "Chicken Wings",
    description: "Spicy chicken wings with your choice of sauce",
    price: 15.99,
    categoryName: "Snacks",
    imageUrl:
      "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800",
  },
  {
    name: "Nachos",
    description: "Crispy nachos with cheese and jalapeños",
    price: 12.99,
    categoryName: "Snacks",
    imageUrl:
      "https://images.unsplash.com/photo-1612536057832-6ff1e8b15fdc?w=800",
  },

  // Main Course
  {
    name: "Pizza Margherita",
    description: "Classic Italian pizza with tomato, mozzarella, and basil",
    price: 25.99,
    categoryName: "Main Course",
    imageUrl:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
  },
  {
    name: "Grilled Chicken",
    description: "Tender grilled chicken breast with herbs",
    price: 22.99,
    categoryName: "Main Course",
    imageUrl:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800",
  },
  {
    name: "Beef Burger",
    description: "Juicy beef burger with lettuce, tomato, and special sauce",
    price: 18.99,
    categoryName: "Main Course",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  },
  {
    name: "Pasta Carbonara",
    description: "Creamy pasta with bacon and parmesan cheese",
    price: 19.99,
    categoryName: "Main Course",
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
  },
  {
    name: "Fried Rice",
    description: "Flavorful fried rice with vegetables and choice of protein",
    price: 16.99,
    categoryName: "Main Course",
    imageUrl:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
  },

  // Desserts
  {
    name: "Chocolate Cake",
    description: "Rich chocolate cake with chocolate frosting",
    price: 8.99,
    categoryName: "Desserts",
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
  },
  {
    name: "Ice Cream",
    description: "Creamy vanilla ice cream with your choice of toppings",
    price: 6.99,
    categoryName: "Desserts",
    imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1b5?w=800",
  },
  {
    name: "Cheesecake",
    description: "Creamy New York style cheesecake",
    price: 9.99,
    categoryName: "Desserts",
    imageUrl:
      "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800",
  },

  // Salads
  {
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with Caesar dressing and croutons",
    price: 12.99,
    categoryName: "Salads",
    imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800",
  },
  {
    name: "Greek Salad",
    description: "Fresh vegetables with feta cheese and olives",
    price: 13.99,
    categoryName: "Salads",
    imageUrl:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
  },
  {
    name: "Garden Salad",
    description: "Mixed fresh greens with seasonal vegetables",
    price: 10.99,
    categoryName: "Salads",
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
  },

  // Soups
  {
    name: "Tomato Soup",
    description: "Creamy tomato soup served hot",
    price: 8.99,
    categoryName: "Soups",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
  },
  {
    name: "Chicken Soup",
    description: "Hearty chicken soup with vegetables",
    price: 9.99,
    categoryName: "Soups",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
  },
  {
    name: "Mushroom Soup",
    description: "Creamy mushroom soup with herbs",
    price: 9.99,
    categoryName: "Soups",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
  },

  // Breakfast
  {
    name: "Pancakes",
    description: "Fluffy pancakes with maple syrup",
    price: 11.99,
    categoryName: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
  },
  {
    name: "Scrambled Eggs",
    description: "Fresh scrambled eggs with toast",
    price: 8.99,
    categoryName: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1633613286991-611fe298c4a7?w=800",
  },
  {
    name: "Breakfast Burrito",
    description: "Eggs, cheese, and bacon wrapped in tortilla",
    price: 12.99,
    categoryName: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
  },

  // Sandwiches
  {
    name: "Club Sandwich",
    description: "Triple decker sandwich with chicken, bacon, and vegetables",
    price: 14.99,
    categoryName: "Sandwiches",
    imageUrl:
      "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800",
  },
  {
    name: "Grilled Cheese",
    description: "Melted cheese between toasted bread slices",
    price: 7.99,
    categoryName: "Sandwiches",
    imageUrl:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
  },
  {
    name: "Turkey Sandwich",
    description: "Sliced turkey with lettuce, tomato, and mayo",
    price: 13.99,
    categoryName: "Sandwiches",
    imageUrl:
      "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800",
  },

  // Pasta & Noodles
  {
    name: "Spaghetti Bolognese",
    description: "Classic spaghetti with meat sauce",
    price: 17.99,
    categoryName: "Pasta & Noodles",
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
  },
  {
    name: "Ramen",
    description: "Japanese ramen noodles in rich broth",
    price: 15.99,
    categoryName: "Pasta & Noodles",
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
  },
  {
    name: "Pad Thai",
    description: "Thai stir-fried noodles with vegetables",
    price: 16.99,
    categoryName: "Pasta & Noodles",
    imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
  },

  // Appetizers
  {
    name: "Spring Rolls",
    description: "Crispy spring rolls with vegetables",
    price: 8.99,
    categoryName: "Appetizers",
    imageUrl:
      "https://images.unsplash.com/photo-1615367423058-97cd2b6d3c29?w=800",
  },
  {
    name: "Bruschetta",
    description: "Toasted bread with tomatoes, garlic, and basil",
    price: 9.99,
    categoryName: "Appetizers",
    imageUrl:
      "https://images.unsplash.com/photo-1572441713132-51c75654db73?w=800",
  },
  {
    name: "Mozzarella Sticks",
    description: "Breaded mozzarella cheese sticks with marinara sauce",
    price: 10.99,
    categoryName: "Appetizers",
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
  },
];

// Generate food ID
async function generateFoodId() {
  const lastFood = await Food.findOne({
    order: [["createdAt", "DESC"]],
    paranoid: false,
  });

  let newIdNumber = 1;
  if (lastFood && lastFood.foodId) {
    const match = lastFood.foodId.match(/^FOOD(\d+)$/);
    if (match) {
      newIdNumber = parseInt(match[1]) + 1;
    }
  }

  return `FOOD${newIdNumber.toString().padStart(3, "0")}`;
}

// Find image file by name (fuzzy matching)
function findImageFile(foodName, imagesFolder, specifiedFileName) {
  if (!fs.existsSync(imagesFolder)) {
    return null;
  }

  const files = fs.readdirSync(imagesFolder);
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  // If specific filename provided, use it
  if (specifiedFileName) {
    const fullPath = path.join(imagesFolder, specifiedFileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Try to match by food name
  const foodNameLower = foodName.toLowerCase().replace(/\s+/g, "-");
  const foodNameLowerNoDash = foodName.toLowerCase().replace(/\s+/g, "");

  for (const file of files) {
    const fileLower = file.toLowerCase();
    const fileWithoutExt = path
      .basename(file, path.extname(file))
      .toLowerCase();

    // Check if filename contains food name or vice versa
    if (
      fileLower.includes(foodNameLower) ||
      foodNameLower.includes(fileWithoutExt) ||
      fileWithoutExt.includes(foodNameLowerNoDash) ||
      foodNameLowerNoDash.includes(fileWithoutExt)
    ) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        return path.join(imagesFolder, file);
      }
    }
  }

  return null;
}

// Download image from URL
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
          return downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          return reject(
            new Error(`Failed to download image: ${response.statusCode}`)
          );
        }

        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolve(outputPath);
        });

        fileStream.on("error", (err) => {
          fs.unlinkSync(outputPath);
          reject(err);
        });
      })
      .on("error", reject);
  });
}

// Process and save image
async function processAndSaveImage(imagePath, outputDir, foodName) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = path.basename(imagePath);
  const ext = path.extname(filename);
  const filenameWithoutExt = foodName.toLowerCase().replace(/\s+/g, "-");
  const outputFilename = `${filenameWithoutExt}-${Date.now()}.webp`;
  const outputPath = path.join(outputDir, outputFilename);

  // Resize and convert to WebP
  await sharp(imagePath)
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toFile(outputPath);

  return `/uploads/foods/${outputFilename}`;
}

async function addFoods() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    const args = parseArgs();
    const imagesFolder =
      args.imagesFolder || path.join(__dirname, "..", "images", "foods");
    const uploadsDir = path.join(__dirname, "..", "public", "uploads", "foods");

    console.log(`📁 Images folder: ${imagesFolder}`);
    console.log(`📁 Uploads folder: ${uploadsDir}\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log("📝 Adding food items...\n");
    console.log("=".repeat(60));

    for (const foodData of foodsData) {
      try {
        // Check if food already exists
        const existingFood = await Food.findOne({
          where: { name: foodData.name },
        });

        if (existingFood) {
          console.log(`⏭️  Skipped: "${foodData.name}" (already exists)`);
          skippedCount++;
          continue;
        }

        // Get category
        const category = await FoodCategory.findOne({
          where: { categoryName: foodData.categoryName },
        });

        if (!category) {
          console.error(
            `❌ Category not found: "${foodData.categoryName}" for "${foodData.name}"`
          );
          errorCount++;
          continue;
        }

        // Handle image: download from URL or use local file
        let imageUrl = null;
        let tempImagePath = null;

        try {
          // First, try to download from URL if provided
          if (foodData.imageUrl && foodData.imageUrl.startsWith("http")) {
            console.log(
              `   📥 Downloading image from URL for "${foodData.name}"...`
            );
            const tempDir = path.join(__dirname, "..", "temp");
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }
            tempImagePath = path.join(
              tempDir,
              `temp-${Date.now()}-${Math.random()
                .toString(36)
                .substring(7)}.jpg`
            );

            await downloadImage(foodData.imageUrl, tempImagePath);
            imageUrl = await processAndSaveImage(
              tempImagePath,
              uploadsDir,
              foodData.name
            );

            // Clean up temp file
            if (fs.existsSync(tempImagePath)) {
              fs.unlinkSync(tempImagePath);
            }
            console.log(`   ✅ Image downloaded and processed`);
          }
          // Otherwise, try to find local image file
          else {
            const imagePath = findImageFile(
              foodData.name,
              imagesFolder,
              foodData.imageFileName
            );

            if (imagePath) {
              imageUrl = await processAndSaveImage(
                imagePath,
                uploadsDir,
                foodData.name
              );
              console.log(`   📷 Image found: ${path.basename(imagePath)}`);
            } else {
              console.warn(
                `   ⚠️  No image found for "${foodData.name}" in ${imagesFolder}`
              );
            }
          }
        } catch (imageError) {
          console.warn(
            `   ⚠️  Image processing failed for "${foodData.name}":`,
            imageError.message
          );
          // Clean up temp file if it exists
          if (tempImagePath && fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
        }

        // Generate food ID
        let currentIdNumber = parseInt(
          (await generateFoodId()).replace("FOOD", "")
        );
        let foodId;
        let idExists = true;
        while (idExists) {
          foodId = `FOOD${currentIdNumber.toString().padStart(3, "0")}`;
          const existingId = await Food.findByPk(foodId, { paranoid: false });
          if (!existingId) {
            idExists = false;
          } else {
            currentIdNumber++;
          }
        }

        // Create food
        const newFood = await Food.create({
          foodId,
          name: foodData.name,
          description: foodData.description || "",
          price: foodData.price,
          isAvailable: foodData.isAvailable !== false,
          categoryId: category.categoryId,
          imageUrl: imageUrl,
          cloudinaryPublicId: "", // Empty string since we're not using Cloudinary
          createdBy: "ADM001",
        });

        console.log(
          `✅ Created: "${newFood.name}" (ID: ${newFood.foodId}) - ${
            foodData.price
          } ETB${imageUrl ? " (with image)" : " (no image)"}`
        );
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating "${foodData.name}":`, error.message);
        errorCount++;
      }
    }

    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${foodsData.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addFoods();
