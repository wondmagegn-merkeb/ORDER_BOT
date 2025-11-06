/**
 * Script to create a clean package of the ORDER_BOT project
 * Excludes node_modules, uploads, and other unnecessary files
 * Run with: node scripts/create-clean-package.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const packageName = "ORDER_BOT_clean";
const tempDir = path.join(projectRoot, "temp_package");

// Files and directories to exclude
const excludePatterns = [
  "node_modules",
  ".git",
  "public/uploads",
  "temp",
  "temp_package",
  "*.zip",
  "session_db.json",
  ".env",
  ".env.example",
  "package-lock.json",
  "*.log",
  ".DS_Store",
  "Thumbs.db",
];

// Directories to include
const includeDirs = [
  "bots",
  "config",
  "controllers",
  "middleware",
  "models",
  "routes",
  "scripts",
  "utils",
  "validators",
  "views",
  "public/icons",
  "public/service-worker.js",
  "public/welcome.png",
  "public/welcome back.png",
  "public/welcome1.png",
  "server.js",
  "package.json",
  "nodemon.json",
];

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip excluded patterns
    const shouldExclude = excludePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace("*", ".*"));
        return regex.test(entry.name);
      }
      return entry.name === pattern;
    });

    if (shouldExclude) {
      console.log(`⏭️  Skipping: ${entry.name}`);
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${entry.name}`);
    }
  }
}

function createCleanPackage() {
  try {
    console.log("🧹 Creating clean package...\n");

    // Create temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Copy included files and directories
    console.log("📦 Copying files...\n");
    for (const item of includeDirs) {
      const srcPath = path.join(projectRoot, item);
      const destPath = path.join(tempDir, item);

      if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          copyDirectory(srcPath, destPath);
        } else {
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(srcPath, destPath);
          console.log(`✅ Copied: ${item}`);
        }
      }
    }

    // Create .gitignore in package
    const gitignoreContent = `node_modules/
.env
.env.local
*.log
temp/
public/uploads/
session_db.json
*.zip
.DS_Store
Thumbs.db
`;
    fs.writeFileSync(path.join(tempDir, ".gitignore"), gitignoreContent);

    // Create .env.example
    const envExample = `# Server
PORT=8080
NODE_ENV=development

# Database
MYSQL_ADDON_HOST=localhost
MYSQL_ADDON_PORT=3306
MYSQL_ADDON_DB=your_database_name
MYSQL_ADDON_USER=your_username
MYSQL_ADDON_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Session
SESSION_SECRET=your_session_secret_key

# Telegram Bots
USER_BOT_TOKEN=your_user_bot_token
ADMIN_BOT_TOKEN=your_admin_bot_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Web Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your_email@example.com
`;
    fs.writeFileSync(path.join(tempDir, ".env.example"), envExample);

    console.log("\n✅ Clean package created in temp_package/ directory");
    console.log("\n📝 Next steps:");
    console.log("   1. Review the files in temp_package/");
    console.log(
      "   2. Create a ZIP file manually or use: zip -r ORDER_BOT_clean.zip temp_package/"
    );
    console.log(
      "   3. The clean package excludes node_modules and sensitive files"
    );
    console.log(
      '\n⚠️  Note: Recipients will need to run "npm install" after extracting'
    );
  } catch (error) {
    console.error("❌ Error creating package:", error.message);
    process.exit(1);
  }
}

createCleanPackage();
