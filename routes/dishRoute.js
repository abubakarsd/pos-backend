const express = require("express");
const { addDish, getDishes, updateDish } = require("../controllers/dishController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const upload = require("../middlewares/uploadMiddleware"); // Import the new middleware

router
  .route("/")
  .post(isVerifiedUser, upload.single("image"), addDish); // Add multer middleware
router.route("/").get(isVerifiedUser, getDishes);
router.route("/:id").put(isVerifiedUser, updateDish);

module.exports = router;