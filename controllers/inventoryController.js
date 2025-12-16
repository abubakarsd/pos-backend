const Inventory = require("../models/inventoryModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

// Get all inventory items with optional filtering
const getInventory = async (req, res, next) => {
    try {
        const { search, category } = req.query;
        const query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const items = await Inventory.find(query).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (error) {
        next(error);
    }
};

// Add new inventory item
const addInventoryItem = async (req, res, next) => {
    try {
        const { name, category, currentStock, minStock, unit } = req.body;

        if (!name || !category || !unit) {
            return next(createHttpError(400, "Please provide name, category, and unit!"));
        }

        const newItem = new Inventory({
            name,
            category,
            currentStock: currentStock || 0,
            minStock: minStock || 0,
            unit,
            lastUpdated: new Date()
        });

        await newItem.save();

        res.status(201).json({
            success: true,
            message: "Inventory item added!",
            data: newItem,
        });
    } catch (error) {
        next(error);
    }
};

// Update inventory item
const updateInventoryItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, category, currentStock, minStock, unit } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid item ID!"));
        }

        const updateData = {
            lastUpdated: new Date() // Always update timestamp
        };

        if (name) updateData.name = name;
        if (category) updateData.category = category;
        if (currentStock !== undefined) updateData.currentStock = currentStock;
        if (minStock !== undefined) updateData.minStock = minStock;
        if (unit) updateData.unit = unit;

        const updatedItem = await Inventory.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return next(createHttpError(404, "Item not found!"));
        }

        res.status(200).json({
            success: true,
            message: "Inventory item updated!",
            data: updatedItem,
        });
    } catch (error) {
        next(error);
    }
};

// Delete inventory item
const deleteInventoryItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid item ID!"));
        }

        const deletedItem = await Inventory.findByIdAndDelete(id);

        if (!deletedItem) {
            return next(createHttpError(404, "Item not found!"));
        }

        res.status(200).json({
            success: true,
            message: "Inventory item deleted!",
            data: deletedItem,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
};
