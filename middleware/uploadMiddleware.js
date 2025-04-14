// Import the multer library for handling file uploads
const multer = require("multer");

// Memory storage - This means the uploaded files will be stored in memory (not saved to disk).
// We use this for cases where you don't want to store the file locally but rather process it (e.g., upload to Cloudinary).
const storage = multer.memoryStorage();

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
// - `storage`: Where the uploaded files will be stored (in-memory in this case).
// - `limits`: Restricts the file size to 2MB. If the uploaded file is larger than this limit, multer will reject it.
// - `fileFilter`: Ensures that only image files are uploaded.
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit set to 2MB (2 * 1024 * 1024 bytes).
    fileFilter,
});

// Export the upload middleware so it can be used in other parts of the app (e.g., in routes).
module.exports = upload;
