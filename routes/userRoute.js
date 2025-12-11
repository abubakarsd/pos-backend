const express = require("express");
const { register, login, getUserData, logout, getAllUsers, updateUserStatus, deleteUser } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();


// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout)

// User Management Routes
router.route("/").get(isVerifiedUser, getAllUsers);
router.route("/:id").put(isVerifiedUser, updateUserStatus);
router.route("/:id").delete(isVerifiedUser, deleteUser);

// Get current user data
router.route("/profile").get(isVerifiedUser, getUserData);

module.exports = router;