/**
 * Migration script to add deliveryUserId column to orders table
 * Run this with: node scripts/add-delivery-user-id-column.js
 * or: npm run add-delivery-user-id
 */

require("dotenv").config();
const { sequelize } = require("../config/db");

async function addDeliveryUserIdColumn() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    console.log("🔧 Checking/Adding deliveryUserId column...\n");
    
    // Check if column already exists
    const [columnCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'deliveryUserId'
    `);

    if (columnCheck.length > 0) {
      console.log("⚠️  Column 'deliveryUserId' already exists in orders table\n");
      console.log("✅ No changes needed\n");
    } else {
      // Add the column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN deliveryUserId VARCHAR(255) NULL 
        COMMENT 'Admin ID of the delivery person who delivered this order'
        AFTER updatedBy
      `);
      console.log("✅ Successfully added 'deliveryUserId' column to orders table\n");
    }

    console.log("✅ Migration completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.parent) {
      console.error("   SQL Error:", error.parent.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addDeliveryUserIdColumn();

