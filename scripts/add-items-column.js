#!/usr/bin/env node

/**
 * Script to migrate orders table to use items JSON column
 * - Adds items JSON column if it doesn't exist
 * - Migrates existing orders to items format
 * - Removes unused columns (foodId, quantity, specialOrder)
 *
 * Usage: node scripts/add-items-column.js
 */

require("dotenv").config();
const { sequelize } = require("../config/db");
const { Order } = require("../models/index");

async function migrateOrdersTable() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Step 1: Add items column if it doesn't exist
    console.log("🔧 Step 1: Checking/Adding items column...\n");
    const [columnCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'items'
    `);

    if (columnCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN items JSON NULL 
        COMMENT 'Array of food items. Format: [{foodId, foodName, price, quantity, specialOrder, itemTotal}]'
      `);
      console.log("✅ Added 'items' column\n");
    } else {
      console.log("⚠️  Column 'items' already exists\n");
    }

    // Step 2: Migrate existing orders to items format
    console.log("🔧 Step 2: Migrating existing orders to items format...\n");
    const existingOrders = await Order.findAll({
      where: {
        items: null,
      },
      paranoid: false,
    });

    let migratedCount = 0;
    for (const order of existingOrders) {
      // Check if order has foodId (old format)
      if (order.foodId) {
        try {
          // Get food details from Food model
          const { Food } = require("../models/index");
          const food = await Food.findByPk(order.foodId, { paranoid: false });

          if (food) {
            const itemsArray = [
              {
                foodId: order.foodId,
                foodName: food.name || "Unknown",
                price: parseFloat(food.price) || parseFloat(order.totalPrice),
                quantity: order.quantity || 1,
                specialOrder: order.specialOrder || null,
                itemTotal: parseFloat(order.totalPrice),
                imageUrl: food.imageUrl || null,
              },
            ];

            await order.update({
              items: itemsArray,
            });
            migratedCount++;
          }
        } catch (error) {
          console.error(
            `⚠️  Failed to migrate order ${order.orderId}:`,
            error.message
          );
        }
      }
    }

    console.log(`✅ Migrated ${migratedCount} existing orders\n`);

    // Step 3: Make items column NOT NULL after migration
    console.log("🔧 Step 3: Making items column NOT NULL...\n");
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        MODIFY COLUMN items JSON NOT NULL
      `);
      console.log("✅ Made 'items' column NOT NULL\n");
    } catch (error) {
      console.warn(
        "⚠️  Could not make items NOT NULL (may have NULL values):",
        error.message
      );
    }

    // Step 4: Remove unused columns
    console.log(
      "🔧 Step 4: Removing unused columns (foodId, quantity, specialOrder)...\n"
    );

    const columnsToRemove = ["foodId", "quantity", "specialOrder"];
    for (const columnName of columnsToRemove) {
      const [columnExists] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = '${columnName}'
      `);

      if (columnExists.length > 0) {
        try {
          await sequelize.query(`
            ALTER TABLE orders 
            DROP COLUMN ${columnName}
          `);
          console.log(`✅ Removed column '${columnName}'\n`);
        } catch (error) {
          console.error(
            `⚠️  Failed to remove column '${columnName}':`,
            error.message
          );
        }
      } else {
        console.log(`⚠️  Column '${columnName}' does not exist, skipping...\n`);
      }
    }

    console.log("✅ Migration completed successfully!\n");
    console.log("📋 Summary:");
    console.log(
      `   - Added items column: ${
        columnCheck.length === 0 ? "Yes" : "Already existed"
      }`
    );
    console.log(`   - Migrated orders: ${migratedCount}`);
    console.log(
      `   - Removed unused columns: foodId, quantity, specialOrder\n`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.parent) {
      console.error("   SQL Error:", error.parent.message);
    }
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrateOrdersTable();
