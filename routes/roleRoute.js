const express = require("express");
const { getAllRoles, createRole, updateRole, deleteRole, getRoleById } = require("../controllers/roleController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Get all roles
router.route("/").get(isVerifiedUser, getAllRoles);

// Create new role
router.route("/").post(isVerifiedUser, createRole);

// Get role by ID
router.route("/:id").get(isVerifiedUser, getRoleById);

// Update role
router.route("/:id").put(isVerifiedUser, updateRole);

// Delete role
router.route("/:id").delete(isVerifiedUser, deleteRole);

module.exports = router;
