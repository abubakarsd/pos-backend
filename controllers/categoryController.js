const Category = require("../models/categoryModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

const addCategory = async (req, res, next) => {
    try {
        const { name, image } = req.body;
        if (!name || !image) {
            return next(createHttpError(400, "Please provide all required fields (name, image)!"));
        }
        
        const isCategoryPresent = await Category.findOne({ name });
        if (isCategoryPresent) {
            return next(createHttpError(400, "Category already exists!"));
        }

        const newCategory = new Category({ name, image });
        await newCategory.save();
        res.status(201).json({ success: true, message: "Category added!", data: newCategory });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid category ID!"));
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name, image },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return next(createHttpError(404, "Category not found!"));
        }

        res.status(200).json({ success: true, message: "Category updated!", data: updatedCategory });
    } catch (error) {
        next(error);
    }
};

module.exports = { addCategory, getCategories, updateCategory };