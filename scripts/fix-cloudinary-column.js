#!/usr/bin/env node

/**
 * Script to fix cloudinaryPublicId column to allow NULL or empty string
 *
 * Usage: node scripts/fix-cloudinary-column.js
 */

require("dotenv").config();
const { sequelize } = require("../config/db");

async function fixCloudinaryColumn() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    console.log("🔧 Fixing cloudinaryPublicId column...\n");

    // Alter the column to allow NULL and set default to empty string
    await sequelize.query(`
      ALTER TABLE foods 
      MODIFY COLUMN cloudinaryPublicId VARCHAR(255) DEFAULT '' NULL;
    `);

    // Update existing NULL values to empty string
    await sequelize.query(`
      UPDATE foods 
      SET cloudinaryPublicId = '' 
      WHERE cloudinaryPublicId IS NULL;
    `);

    console.log("✅ Column fixed successfully!\n");
    console.log("   - Column now allows NULL and has default value ''");
    console.log("   - Existing NULL values updated to empty string\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.parent) {
      console.error("   SQL Error:", error.parent.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixCloudinaryColumn();
