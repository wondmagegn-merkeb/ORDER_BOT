// Import the v2 version of the Cloudinary SDK
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,         // Your Cloudinary cloud name
  api_key: process.env.CLOUD_API_KEY,         // Your Cloudinary API key
  api_secret: process.env.CLOUD_API_SECRET,   // Your Cloudinary API secret
});

// Export the configured Cloudinary instance for use in other parts of your app
module.exports = cloudinary;
