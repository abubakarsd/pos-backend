const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String, // Storing category name purely for simplicity as per existing frontend dummy data structure
            required: true,
            trim: true,
        },
        currentStock: {
            type: Number,
            required: true,
            default: 0,
        },
        minStock: {
            type: Number,
            required: true,
            default: 0,
        },
        unit: {
            type: String,
            required: true, // e.g., 'kg', 'pcs', 'L'
            trim: true,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
