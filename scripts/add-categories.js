#!/usr/bin/env node

/**
 * Script to add food categories
 *
 * Usage: node scripts/add-categories.js
 */

require("dotenv").config();
const { sequelize } = require("../config/db");
const FoodCategory = require("../models/FoodCategory");

// Categories data from the table
const categoriesData = [
  {
    categoryName: "Beverages",
    description:
      "All types of hot and cold drinks, including juices, coffee, and tea.",
  },
  {
    categoryName: "Snacks",
    description:
      "Light bites and quick eats, such as chips, nuts, and finger foods.",
  },
  {
    categoryName: "Main Course",
    description:
      "Hearty meals including meat, poultry, fish, and vegetarian dishes.",
  },
  {
    categoryName: "Desserts",
    description: "Sweet treats like cakes, pastries, ice cream, and puddings.",
  },
  {
    categoryName: "Salads",
    description: "Fresh vegetables, fruits, and mixed salads with dressings.",
  },
  {
    categoryName: "Soups",
    description: "Hot and cold soups, from creamy to broth-based varieties.",
  },
  {
    categoryName: "Breakfast",
    description:
      "Items typically eaten for breakfast, like pancakes, eggs, and cereals.",
  },
  {
    categoryName: "Sandwiches",
    description: "Various types of sandwiches, wraps, and subs.",
  },
  {
    categoryName: "Pasta & Noodles",
    description:
      "Italian and Asian pasta, spaghetti, ramen, and noodle dishes.",
  },
  {
    categoryName: "Appetizers",
    description:
      "Small dishes served before the main course, such as spring rolls and bruschetta.",
  },
];

// Get starting category ID number
async function getStartingCategoryId() {
  const lastCategory = await FoodCategory.findOne({
    order: [["createdAt", "DESC"]],
    paranoid: false,
  });

  let startingIdNumber = 1;
  if (lastCategory && lastCategory.categoryId) {
    const match = lastCategory.categoryId.match(/^CAT(\d+)$/);
    if (match) {
      startingIdNumber = parseInt(match[1]) + 1;
    }
  }

  return startingIdNumber;
}

async function addCategories() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Get starting ID number once
    let currentIdNumber = await getStartingCategoryId();

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log("📝 Adding food categories...\n");
    console.log("=".repeat(60));

    for (const categoryData of categoriesData) {
      try {
        // Check if category already exists
        const existingCategory = await FoodCategory.findOne({
          where: { categoryName: categoryData.categoryName },
        });

        if (existingCategory) {
          console.log(
            `⏭️  Skipped: "${categoryData.categoryName}" (already exists)`
          );
          skippedCount++;
          continue;
        }

        // Generate unique category ID by incrementing
        let categoryId;
        let idExists = true;
        while (idExists) {
          categoryId = `CAT${currentIdNumber.toString().padStart(3, "0")}`;
          const existingId = await FoodCategory.findByPk(categoryId, {
            paranoid: false,
          });
          if (!existingId) {
            idExists = false;
          } else {
            currentIdNumber++;
          }
        }

        // Create category
        const newCategory = await FoodCategory.create({
          categoryId,
          categoryName: categoryData.categoryName,
          description: categoryData.description,
          createdBy: "ADM001",
        });

        console.log(
          `✅ Created: "${newCategory.categoryName}" (ID: ${newCategory.categoryId})`
        );
        createdCount++;
        // Increment for next category
        currentIdNumber++;
      } catch (error) {
        // Check if it's a unique constraint error (duplicate ID)
        if (error.name === "SequelizeUniqueConstraintError") {
          // Try with next ID
          currentIdNumber++;
          try {
            const categoryId = `CAT${currentIdNumber
              .toString()
              .padStart(3, "0")}`;
            const newCategory = await FoodCategory.create({
              categoryId,
              categoryName: categoryData.categoryName,
              description: categoryData.description,
              createdBy: "ADM001",
            });
            console.log(
              `✅ Created: "${newCategory.categoryName}" (ID: ${newCategory.categoryId})`
            );
            createdCount++;
            currentIdNumber++;
          } catch (retryError) {
            console.error(
              `❌ Error creating "${categoryData.categoryName}":`,
              retryError.message
            );
            errorCount++;
          }
        } else {
          console.error(
            `❌ Error creating "${categoryData.categoryName}":`,
            error.message
          );
          errorCount++;
        }
      }
    }

    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${categoriesData.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addCategories();
