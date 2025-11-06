/**
 * Migration script to update the endpoint column in admins table to TEXT
 * Run this with: node scripts/fix-endpoint-column.js
 */

require("dotenv").config();
const { sequelize } = require("../config/db");

async function fixEndpointColumn() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    console.log("🔧 Checking/Updating endpoint column...\n");
    
    // Check current column type
    const [columnInfo] = await sequelize.query(`
      SELECT COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admins' 
      AND COLUMN_NAME = 'endpoint'
    `);

    if (columnInfo.length > 0) {
      const currentType = columnInfo[0].COLUMN_TYPE;
      console.log(`Current endpoint column type: ${currentType}\n`);
      
      // Check if it's already TEXT
      if (currentType.toLowerCase().includes('text')) {
        console.log("✅ Column is already TEXT type, no changes needed\n");
      } else {
        // Alter the column to TEXT type
        await sequelize.query(`
          ALTER TABLE admins 
          MODIFY COLUMN endpoint TEXT
        `);
        console.log("✅ Successfully updated endpoint column to TEXT\n");
      }
    } else {
      console.log("⚠️  Column 'endpoint' not found in admins table\n");
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

fixEndpointColumn();

