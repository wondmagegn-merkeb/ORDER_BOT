// Import the multer library for handling file uploads
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "public", "uploads", "foods");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage - Save files to local folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random number + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `food-${uniqueSuffix}${ext}`);
  },
});

// File type filter - This function checks the file type of the uploaded file.
// In this case, we are allowing only image files (anything that starts with "image/").
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    // If the file is an image, continue the upload.
    cb(null, true);
  } else {
    // If the file is not an image, return an error message.
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Initialize multer with the following options:
// - `storage`: Where the uploaded files will be stored (disk storage for local folder).
// - `limits`: Restricts the file size to 5MB. If the uploaded file is larger than this limit, multer will reject it.
// - `fileFilter`: Ensures that only image files are uploaded.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit set to 5MB (5 * 1024 * 1024 bytes).
  fileFilter,
});

// Export the upload middleware so it can be used in other parts of the app (e.g., in routes).
module.exports = upload;
