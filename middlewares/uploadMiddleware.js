const multer = require("multer");
const path = require("path");
const createHttpError = require("http-errors");

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // The directory where files will be stored
  },
  filename: function (req, file, cb) {
    // Create a unique filename with a timestamp and the original extension
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createHttpError(400, "Only .jpeg, .jpg and .png format allowed!"));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB file size limit
});

module.exports = upload;