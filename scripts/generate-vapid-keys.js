#!/usr/bin/env node

/**
 * Script to generate VAPID keys for Web Push Notifications
 *
 * Usage: node scripts/generate-vapid-keys.js
 *        or: npm run generate-vapid-keys
 */

const webpush = require("web-push");

console.log("🔑 Generating VAPID keys for Web Push Notifications...\n");

try {
  // Generate VAPID keys
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log("✅ VAPID keys generated successfully!\n");
  console.log("=".repeat(60));
  console.log("📋 Add these to your .env file:\n");
  console.log(`VAPID_PUBLIC_KEY= ${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY= ${vapidKeys.privateKey}`);
  console.log(`VAPID_EMAIL=mailto:your_email@example.com`);
  console.log("=".repeat(60));
  console.log(
    '\n📝 Note: Replace "your_email@example.com" with your actual email address.'
  );
  console.log(
    "   The email should be a valid contact email for your application.\n"
  );
} catch (error) {
  console.error("❌ Error generating VAPID keys:", error.message);
  process.exit(1);
}
