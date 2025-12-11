const express = require("express");
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get all settings
router.route("/").get(isVerifiedUser, getSettings);

// Update settings
router.route("/").put(isVerifiedUser, updateSettings);

module.exports = router;
