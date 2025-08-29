const express = require("express");
const {
  addCategory,
  getCategories,
  updateCategory,
} = require("../controllers/categoryController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const upload = require("../middlewares/uploadMiddleware"); // Import the new middleware

router
  .route("/")
  .post(isVerifiedUser, upload.single("image"), addCategory); // Add multer middleware
router.route("/").get(isVerifiedUser, getCategories);
router.route("/:id").put(isVerifiedUser, updateCategory);

module.exports = router;