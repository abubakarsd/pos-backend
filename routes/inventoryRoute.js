const express = require("express");
const router = express.Router();
const {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
} = require("../controllers/inventoryController");
const { isVerifiedUser: verifyToken } = require("../middlewares/tokenVerification");

// Protected routes
router.get("/", verifyToken, getInventory);
router.post("/", verifyToken, addInventoryItem);
router.put("/:id", verifyToken, updateInventoryItem);
router.delete("/:id", verifyToken, deleteInventoryItem);

module.exports = router;
