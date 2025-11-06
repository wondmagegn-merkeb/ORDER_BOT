#!/usr/bin/env node

/**
 * Script to add a new admin user
 *
 * Usage:
 *   Interactive mode: node scripts/add-admin.js
 *   With arguments: node scripts/add-admin.js --email=email@example.com --telegramId=123456789 --role=admin --username=admin1 --password=password123
 */

require("dotenv").config();
const readline = require("readline");
const { sequelize } = require("../config/db");
const Admin = require("../models/Admin");
const { createAdminSchema } = require("../validators/adminValidator");

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

// Create readline interface for interactive input
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Prompt for input
function question(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Generate admin ID
async function generateAdminId() {
  const lastAdmin = await Admin.findOne({
    order: [["createdAt", "DESC"]],
    paranoid: false,
  });

  let newIdNumber = 1;
  if (lastAdmin && lastAdmin.adminId) {
    const lastNumber = parseInt(lastAdmin.adminId.replace("ADM", ""));
    if (!isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `ADM${newIdNumber.toString().padStart(3, "0")}`;
}

// Main function
async function addAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    const args = parseArgs();
    let email, telegramId, role, username, password;

    // Check if arguments are provided
    if (args.email && args.telegramId && args.role) {
      // Use command line arguments
      email = args.email;
      telegramId = args.telegramId;
      role = args.role;
      username = args.username || `${role}_${Date.now()}`;
      password = args.password || `${role}_password_${Date.now()}`;
    } else {
      // Interactive mode
      const rl = createReadlineInterface();

      console.log("📝 Enter admin details:\n");

      email = await question(rl, "Email: ");
      telegramId = await question(rl, "Telegram ID: ");
      role = await question(rl, "Role (admin/manager/delivery): ");
      username =
        (await question(rl, "Username (press Enter to auto-generate): ")) ||
        `${role}_${Date.now()}`;
      password =
        (await question(rl, "Password (press Enter to auto-generate): ")) ||
        `${role}_password_${Date.now()}`;

      rl.close();
    }

    // Validate input
    const { error } = createAdminSchema.validate({ email, telegramId, role });
    if (error) {
      console.error("❌ Validation error:", error.details[0].message);
      process.exit(1);
    }

    // Validate username
    if (!username || username.length < 3) {
      console.error("❌ Username must be at least 3 characters long");
      process.exit(1);
    }

    // Validate password
    if (!password || password.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    // Check for existing email
    const existingEmail = await Admin.findOne({ where: { email } });
    if (existingEmail) {
      console.error("❌ Email already exists:", email);
      process.exit(1);
    }

    // Check for existing telegramId
    const existingTelegramId = await Admin.findOne({ where: { telegramId } });
    if (existingTelegramId) {
      console.error("❌ Telegram ID already exists:", telegramId);
      process.exit(1);
    }

    // Check for existing username
    const existingUsername = await Admin.findOne({ where: { username } });
    if (existingUsername) {
      console.error("❌ Username already exists:", username);
      process.exit(1);
    }

    // Generate admin ID
    const adminId = await generateAdminId();

    // Create admin
    const newAdmin = await Admin.create({
      adminId,
      username,
      email,
      password,
      telegramId,
      role,
      createdBy: null, // Set to null for script-created admins
      states: "active",
    });

    console.log("\n✅ Admin created successfully!\n");
    console.log("=".repeat(60));
    console.log("📋 Admin Details:");
    console.log("=".repeat(60));
    console.log(`Admin ID:     ${newAdmin.adminId}`);
    console.log(`Username:     ${newAdmin.username}`);
    console.log(`Email:        ${newAdmin.email}`);
    console.log(`Telegram ID:  ${newAdmin.telegramId}`);
    console.log(`Role:         ${newAdmin.role}`);
    console.log(`Status:       ${newAdmin.states}`);
    console.log("=".repeat(60));
    console.log(`\n⚠️  Password: ${password}`);
    console.log("   (Please save this password securely)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    if (error.name === "SequelizeUniqueConstraintError") {
      console.error("   A record with this information already exists.");
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
addAdmin();
